#!/usr/bin/env python3
"""같은 모델을 여러 프로바이더가 서빙할 때의 비교표를 OpenRouter 에서 받아 D1 에 넣는다.

'실시간 추론 속도' 화면은 2026-08-13 에 손으로 적은 6개 프로바이더 값을 41일째
그대로 보여주고 있었다. 가동률 99.9, 단가 0.60 같은 값은 측정 주체가 없는
창작값이었고, 화면에는 "실시간"이라고 적혀 있었다.

OpenRouter 의 /models/:slug/endpoints 가 프로바이더 목록·단가·양자화·가동률을
실제로 내려준다. 그쪽은 이미 카탈로그의 출처이므로 수치가 서로 어긋나지 않는다.

한 가지 한계: latency_last_30m 과 throughput_last_30m 은 전 모델·전 프로바이더에
null 로 온다(인증을 붙여도 같다). 컬럼은 두고 값이 생기면 흘러가게 하되, 지금은
화면에서 속도를 단정하지 않는다.

    python3 backend/scripts/sync_provider_endpoints.py --report   # 쓰지 않고 확인만
    python3 backend/scripts/sync_provider_endpoints.py            # SQL 파일 생성
"""
import argparse
import concurrent.futures
import json
import os
import re
import subprocess
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(REPO_ROOT, "provider_endpoints.sql")
API = "https://openrouter.ai/api/v1/models/{slug}/endpoints"

# 이 화면의 값은 "같은 모델을 누가 더 잘 서빙하나" 다. 프로바이더가 하나뿐인 모델은
# 비교할 대상이 없어 넣지 않는다.
MIN_PROVIDERS = 2

# 수집이 부분 실패하면 기존 행을 지우고 빈 표가 남는다. 하한을 밑돌면 아무것도 쓰지 않는다.
MIN_MODELS = 20


def fetch_endpoints(slug, opener=urllib.request.urlopen):
    req = urllib.request.Request(
        API.format(slug=slug),
        headers={"User-Agent": "LLM-Compass/3.0", "Accept": "application/json"},
    )
    try:
        with opener(req, timeout=20) as r:
            return json.loads(r.read()).get("data", {}).get("endpoints", []) or []
    except (urllib.error.URLError, json.JSONDecodeError, TimeoutError, OSError):
        return []


def slug_of(official_url):
    """official_url 이 곧 OpenRouter 모델 페이지 주소다. 없으면 시드 모델이라 건너뛴다."""
    m = re.match(r"^https?://openrouter\.ai/models/(.+)$", official_url or "")
    return m.group(1) if m else None


def load_catalog(runner=subprocess.run, attempts=3):
    """오픈웨이트 모델만 본다 — 여러 곳이 같은 가중치를 서빙하는 건 사실상 이쪽뿐이다."""
    last = ""
    for _ in range(attempts):
        res = runner(
            ["npx", "wrangler", "d1", "execute", "llm-compass-db", "--remote", "--json",
             "--command",
             "SELECT id, name, official_url FROM models "
             "WHERE is_open_weight = 1 AND is_deprecated = 0 AND superseded_by IS NULL"],
            capture_output=True, text=True,
        )
        out = (res.stdout or "").strip()
        try:
            data = json.loads(out)
        except json.JSONDecodeError:
            data = None
        if isinstance(data, list):
            return [r for blk in data for r in blk.get("results", []) if isinstance(r, dict) and r.get("id")]
        last = out[:200]
    raise RuntimeError(f"카탈로그 조회 실패: {last}")


def price(pricing, key):
    """OpenRouter 는 토큰당 단가를 문자열로 준다. 화면 단위인 100만 토큰당으로 바꾼다."""
    try:
        return round(float(pricing[key]) * 1_000_000, 4)
    except (KeyError, TypeError, ValueError):
        return None


def rows_for(model, endpoints):
    rows = []
    for e in endpoints:
        provider = e.get("provider_name")
        if not provider:
            continue
        rows.append({
            "model_id": model["id"],
            "model_slug": model["slug"],
            "model_name": model["name"],
            "provider_name": provider,
            # 한 프로바이더가 같은 모델을 여러 구성으로 올린다(deepinfra/turbo 등).
            # tag 가 비면 provider 로 대신해 PK 충돌을 막는다.
            "tag": e.get("tag") or provider,
            "quantization": e.get("quantization"),
            "context_length": e.get("context_length"),
            "max_output_tokens": e.get("max_completion_tokens"),
            "input_per_1m": price(e.get("pricing") or {}, "prompt"),
            "output_per_1m": price(e.get("pricing") or {}, "completion"),
            "uptime_30m": e.get("uptime_last_30m"),
            "uptime_1d": e.get("uptime_last_1d"),
            "latency_ms": e.get("latency_last_30m"),
            "throughput_tps": e.get("throughput_last_30m"),
            "status": str(e.get("status")) if e.get("status") is not None else None,
        })
    # 같은 (slug, tag) 가 두 번 오면 PK 가 깨진다. 먼저 온 것을 남긴다.
    seen, uniq = set(), []
    for r in rows:
        key = (r["model_slug"], r["tag"])
        if key not in seen:
            seen.add(key)
            uniq.append(r)
    return uniq


def sql_value(v):
    if v is None:
        return "NULL"
    if isinstance(v, bool):
        return "1" if v else "0"
    if isinstance(v, (int, float)):
        return repr(v)
    return "'" + str(v).replace("'", "''") + "'"


COLS = ["model_id", "model_slug", "model_name", "provider_name", "tag", "quantization",
        "context_length", "max_output_tokens", "input_per_1m", "output_per_1m",
        "uptime_30m", "uptime_1d", "latency_ms", "throughput_tps", "status", "updated_at"]


def build_sql(rows, now):
    out = ["DELETE FROM provider_endpoints;"]
    for r in rows:
        r = dict(r, updated_at=now)
        values = ", ".join(sql_value(r.get(c)) for c in COLS)
        out.append(f"INSERT INTO provider_endpoints ({', '.join(COLS)}) VALUES ({values});")
    return out


def collect(catalog, fetch=fetch_endpoints, workers=8):
    targets = []
    for m in catalog:
        slug = slug_of(m.get("official_url"))
        if slug:
            targets.append({"id": m["id"], "name": m["name"], "slug": slug})

    rows, kept = [], []
    with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as pool:
        for model, endpoints in zip(targets, pool.map(lambda t: fetch(t["slug"]), targets)):
            r = rows_for(model, endpoints)
            if len({x["provider_name"] for x in r}) >= MIN_PROVIDERS:
                rows.extend(r)
                kept.append((model["name"], len({x["provider_name"] for x in r}), len(r)))
    return rows, kept, len(targets)


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--report", action="store_true", help="SQL 을 쓰지 않고 수집 결과만 출력")
    ap.add_argument("--out", default=OUT)
    args = ap.parse_args()

    catalog = load_catalog()
    print(f"📥 오픈웨이트 모델 {len(catalog)}개")
    rows, kept, scanned = collect(catalog)
    print(f"🔗 OpenRouter 조회 {scanned}개 → 프로바이더 {MIN_PROVIDERS}곳 이상인 모델 {len(kept)}개 / 엔드포인트 {len(rows)}행")

    if args.report:
        for name, providers, eps in sorted(kept, key=lambda x: -x[1])[:30]:
            print(f"   {name[:46]:<46} 프로바이더 {providers:>2}곳  엔드포인트 {eps:>2}개")
        have_speed = sum(1 for r in rows if r["throughput_tps"] is not None)
        print(f"   속도 값이 실제로 온 행: {have_speed} / {len(rows)}")
        return 0

    if len(kept) < MIN_MODELS:
        # 부분 실패로 DELETE 만 나가면 화면이 빈 표가 된다.
        print(f"❌ 모델 {len(kept)}개는 하한({MIN_MODELS}) 미달. 갱신하지 않는다.")
        open(args.out, "w").close()
        return 1

    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    statements = build_sql(rows, now)
    with open(args.out, "w", encoding="utf-8") as f:
        f.write("\n".join(statements) + "\n")
    print(f"✅ {args.out} ({len(statements)}행, 기준 {now} UTC)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
