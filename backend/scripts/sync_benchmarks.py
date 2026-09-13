#!/usr/bin/env python3
"""모델 벤치마크를 공개 라이선스 수집원에서 갱신한다.

  Arena 레이팅 — LMArena 공식 데이터셋 (CC-BY 4.0)
                 huggingface.co/datasets/lmarena-ai/leaderboard-dataset  text/latest, category=overall
  GPQA Diamond — Epoch AI Benchmarking Hub (CC-BY 4.0)
                 epoch.ai/data/benchmark_data.zip  gpqa_diamond.csv

그전까지 benchmarks 컬럼 169개 값은 전부 2026-08 시드에 손으로 적은 것이었고, 주간
동기화된 모델은 하나도 값을 갖지 못했다. 시드 ELO 는 옛 척도(최고 ~1400)라 현재
아레나(최고 ~1510)와 섞으면 비교가 무의미해진다 — 그래서 매칭 여부와 상관없이 모든
행을 새 값으로 덮는다. 매칭이 안 되면 null 이다.

MMLU-Pro·SWE-bench 는 신선한 공개 수집원이 없어 null 로 비운다. 근거 없는 옛 숫자를
최신처럼 보여주는 것보다 비어 있는 편이 낫다.

Artificial Analysis 는 속도·지수까지 주지만 무료 API 는 "내부 사용만, 재배포 금지"라
공개 사이트에 쓸 수 없다.

  python3 backend/scripts/sync_benchmarks.py            # seed_benchmarks.sql 생성
  python3 backend/scripts/sync_benchmarks.py --report   # 매칭 결과만 출력
"""
import argparse
import csv
import io
import json
import re
import subprocess
import sys
import urllib.request
import zipfile

ARENA_URL = "https://huggingface.co/datasets/lmarena-ai/leaderboard-dataset/resolve/main/text/latest-00000-of-00001.parquet"
EPOCH_URL = "https://epoch.ai/data/benchmark_data.zip"
OUT = "seed_benchmarks.sql"

# 수집이 부분 실패했을 때 멀쩡한 값을 null 로 덮지 않기 위한 하한. 실측: 아레나 401, GPQA 313.
MIN_ARENA_ROWS = 150
MIN_GPQA_ROWS = 100

_PROVIDERS = (r"(openai|anthropic|google|meta|meta-llama|mistralai|mistral|deepseek|x-ai|xai|spacexai|"
              r"qwen|alibaba|z-ai|zai|moonshotai|minimax|cohere|amazon|microsoft|nvidia|ibm|inclusionai|bytedance)")
# 추론 강도·배포 채널 접미사. 아레나는 같은 모델을 -high/-max 로 따로 올린다.
_VARIANT = r"(-(high|max|low|medium|minimal|xhigh|thinking|non-thinking|reasoning|preview|exp|experimental|latest|beta))+$"
_DATE = r"(-(\d{8}|\d{4}-\d{2}-\d{2}|\d{4}))+$"


def _base(s):
    s = s.lower().strip()
    s = re.sub(r"\s*\((batch|free|latest|beta|x?high|max|low|medium)\)\s*", " ", s)
    s = re.sub(r"^[a-z0-9 .-]+:\s*", "", s)              # "OpenAI: GPT-6" → "gpt-6"
    s = re.sub(r"^" + _PROVIDERS + r"[-/]", "", s)       # "anthropic-claude…" → "claude…"
    s = re.sub(r"[\s_./()]+", "-", s)
    return re.sub(r"-+", "-", s).strip("-")


def keys(name):
    """(정확 키, 느슨한 키). 정확 키는 날짜를 남겨 gpt-4o-2024-05-13 과 -11-20 을 가른다."""
    exact = re.sub(_VARIANT, "", _base(name))
    loose = re.sub(_VARIANT, "", re.sub(_DATE, "", exact))
    return exact, loose


def index(rows):
    """[(원천 이름, 점수, 기준일)] → {키: (점수, 원천 이름, 기준일)}. 같은 키면 최고 설정 점수를 쓴다."""
    exact, loose = {}, {}
    for name, score, asof in rows:
        e, l = keys(name)
        for table, k in ((exact, e), (loose, l)):
            if k not in table or score > table[k][0]:
                table[k] = (score, name, asof)
    return exact, loose


def match(model, idx):
    exact, loose = idx
    candidates = [keys(model["id"]), keys(model["name"])]
    for e, _ in candidates:
        if e in exact:
            return exact[e]
    # 느슨한 매칭(날짜 제거)은 카탈로그 쪽에 날짜가 없을 때만 쓴다. 이름에 날짜를 박은
    # 모델은 특정 스냅샷이다 — 아레나에 그 날짜가 없는데 날짜를 벗겨 매칭하면 다른 버전의
    # 점수를 가져온다. 실측 오탐: GPT-4o (2024-11-20) ↔ gpt-4o-2024-05-13,
    # Ministral 3 8B 2512 ↔ ministral-8b-2410, GPT-3.5 Turbo (v0613) ↔ gpt-3.5-turbo-0125.
    for e, l in candidates:
        if e == l and l in loose:
            return loose[l]
    return None


def fetch(url, timeout=120):
    req = urllib.request.Request(url, headers={"User-Agent": "llm-compass-benchmark-sync"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def arena_rows(raw=None):
    import pyarrow.parquet as pq   # CI 에서 pip install pyarrow
    table = pq.read_table(io.BytesIO(raw if raw is not None else fetch(ARENA_URL))).to_pylist()
    return [(r["model_name"], round(float(r["rating"])), str(r["leaderboard_publish_date"])[:10])
            for r in table if r.get("category") == "overall" and r.get("rating") is not None]


def gpqa_rows(raw=None):
    with zipfile.ZipFile(io.BytesIO(raw if raw is not None else fetch(EPOCH_URL))) as z:
        text = z.read("gpqa_diamond.csv").decode("utf-8")
    out = []
    for r in csv.DictReader(io.StringIO(text)):
        score = r.get("Best score (across scorers)") or r.get("mean_score")
        if score:
            # 프론트는 퍼센트(예: 71.0)를 기대한다. Epoch 는 0~1 비율이다.
            out.append((r["Model version"], round(float(score) * 100, 1), (r.get("Release date") or "")[:10]))
    return out


def load_catalog(runner=subprocess.run, attempts=3):
    # Cloudflare API 가 가끔 7403(일시적 인증 오류)을 JSON 객체로 돌려준다. 그 안의
    # notes 배열을 결과로 오인하면 파싱이 엉뚱하게 깨지므로, 형태를 보고 재시도한다.
    last = ""
    for _ in range(attempts):
        res = runner(["npx", "wrangler", "d1", "execute", "llm-compass-db", "--remote", "--json",
                      "--command", "SELECT id, name FROM models"], capture_output=True, text=True)
        out = (res.stdout or "").strip()
        try:
            data = json.loads(out)
        except json.JSONDecodeError:
            data = None
        if isinstance(data, list):
            return [r for blk in data for r in blk.get("results", []) if isinstance(r, dict) and r.get("id")]
        last = out[:200]
    raise RuntimeError(f"카탈로그 조회 실패: {last}")


def build(catalog, arena, gpqa):
    a_idx, g_idx = index(arena), index(gpqa)
    arena_asof = max((d for _, _, d in arena), default=None)
    statements, report = [], {"arena": 0, "gpqa": 0, "total": len(catalog), "matches": []}
    for m in catalog:
        a, g = match(m, a_idx), match(m, g_idx)
        bench = {
            "arena_elo": a[0] if a else None,
            "arena_variant": a[1] if a else None,     # 화면에 "최고 설정 기준" 으로 밝힌다
            "gpqa": g[0] if g else None,
            "mmlu_pro": None,
            "swe_bench": None,
            "asof": {"arena": arena_asof if a else None, "gpqa": g[2] if g else None},
        }
        report["arena"] += bool(a)
        report["gpqa"] += bool(g)
        if a or g:
            report["matches"].append((m["name"], a[1] if a else None, g[1] if g else None))
        payload = json.dumps(bench, ensure_ascii=False).replace("'", "''")
        statements.append(f"UPDATE models SET benchmarks = '{payload}' WHERE id = '{m['id'].replace(chr(39), chr(39)*2)}';")
    return statements, report


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--report", action="store_true", help="SQL 을 쓰지 않고 매칭 결과만 출력")
    ap.add_argument("--out", default=OUT)
    args = ap.parse_args()

    arena, gpqa = arena_rows(), gpqa_rows()
    print(f"📥 Arena {len(arena)}행 · GPQA {len(gpqa)}행")
    if len(arena) < MIN_ARENA_ROWS or len(gpqa) < MIN_GPQA_ROWS:
        # 수집이 부분 실패하면 매칭 0 이 되어 전 모델 값을 null 로 덮는다. 아무것도 하지 않는다.
        print(f"❌ 수집량이 하한 미달 (Arena ≥{MIN_ARENA_ROWS}, GPQA ≥{MIN_GPQA_ROWS}). 갱신하지 않는다.")
        open(args.out, "w").close()
        return 1

    catalog = load_catalog()
    statements, rep = build(catalog, arena, gpqa)
    print(f"🔗 카탈로그 {rep['total']}개 → Arena 매칭 {rep['arena']} · GPQA 매칭 {rep['gpqa']}")
    if args.report:
        for name, a, g in sorted(rep["matches"]):
            print(f"   {name[:48]:<48} arena={a}  gpqa={g}")
        return 0
    with open(args.out, "w", encoding="utf-8") as f:
        f.write("\n".join(statements) + "\n")
    print(f"✅ {args.out} ({len(statements)}행)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
