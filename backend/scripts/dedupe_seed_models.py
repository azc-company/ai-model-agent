#!/usr/bin/env python3
"""수작업 시드 행과 주간 동기화 행으로 이중 등록된 모델을 하나로 모은다.

같은 모델이 "Claude Opus 5"(seed, 2026-08 손으로 입력)와 "Anthropic: Claude Opus 5"
(feed, 매주 갱신)로 두 번 들어 있었다. 리더보드에서 줄지어 반복됐고, 검색엔진에는
/models/claude-opus-5 와 /models/anthropic-claude-opus-5 가 중복 페이지였다.
시드 행은 가격이 갱신되지 않으므로 동기화 행을 남긴다.

시드 행은 지우지 않는다. is_deprecated=1, superseded_by=<동기화 id> 로 표시하고,
Worker 가 옛 주소를 새 주소로 301 리다이렉트한다 — 이미 색인된 주소의 신호를 잃지 않는다.
되돌리려면 두 컬럼만 원복하면 된다.

매칭은 벤치마크 동기화에서 검증한 날짜 안전 정규화(정확 키)를 쓴다. 다만 정규화가
preview·reasoning·high 같은 변형 단어를 벗기므로, 양쪽 이름의 변형 단어가 다르면
합치지 않는다. 실측 오탐: Sonar Reasoning→Sonar, o1-preview→o1,
Gemini 3.1 Pro→Gemini 3.1 Pro Preview.

  python3 backend/scripts/dedupe_seed_models.py --report   # 매칭 목록만
  python3 backend/scripts/dedupe_seed_models.py            # seed_dedupe.sql 생성
"""
import argparse
import collections
import json
import os
import re
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sync_benchmarks import keys  # noqa: E402

OUT = "seed_dedupe.sql"
# 변형 단어 규칙이 보수적으로 보류하지만 사람이 확인해 같은 모델인 경우.
# 규칙을 느슨하게 풀면 Sonar Reasoning→Sonar 같은 오탐이 함께 살아나므로 예외만 적는다.
MANUAL_PAIRS = {
    "deepseek-r1": "deepseek-deepseek-r1",   # 시드 "DeepSeek R1 (Reasoning)" ↔ 피드 "DeepSeek: R1"
}

VARIANT_WORDS = {"preview", "reasoning", "high", "low", "thinking", "exp", "experimental", "mini", "pro", "max", "lite", "turbo"}


def _variant_words(name):
    words = set(re.findall(r"[a-z]+", re.sub(r"^[^:]+:\s*", "", name.lower())))
    return words & VARIANT_WORDS


def _is_channel_variant(model_id):
    return bool(re.search(r":(batch|free)$", model_id))


def pair_seed_to_feed(rows):
    """[(seed_id, feed_id)] 와 [(seed_id, 사유)] 를 돌려준다."""
    active = [r for r in rows if not r.get("is_deprecated")]
    feed = [r for r in active if r.get("source") == "feed" and not _is_channel_variant(r["id"])]
    seed = [r for r in active if r.get("source") == "seed"]
    index = collections.defaultdict(dict)
    for f in feed:
        for n in (f["id"], f["name"]):
            index[keys(n)[0]][f["id"]] = f

    pairs, skipped = [], []
    feed_ids = {f["id"] for f in feed}
    for s in seed:
        manual = MANUAL_PAIRS.get(s["id"])
        if manual and manual in feed_ids:
            pairs.append((s["id"], manual))
            continue
        cands = {}
        for n in (s["id"], s["name"]):
            cands.update(index.get(keys(n)[0], {}))
        # 변형 단어가 같은 후보만 남긴다 (o1-preview 를 o1 에, Sonar Reasoning 을 Sonar 에 합치지 않게)
        same = {fid: f for fid, f in cands.items() if _variant_words(f["name"]) == _variant_words(s["name"])}
        if not cands:
            continue
        if not same:
            skipped.append((s["id"], f"변형 단어 불일치: {sorted(cands)}"))
        elif len(same) == 1:
            pairs.append((s["id"], next(iter(same))))
        else:
            skipped.append((s["id"], f"후보 여럿: {sorted(same)}"))
    return pairs, skipped


def build_sql(pairs):
    q = lambda v: v.replace("'", "''")  # noqa: E731
    return [f"UPDATE models SET is_deprecated = 1, superseded_by = '{q(f)}' WHERE id = '{q(s)}' AND source = 'seed';"
            for s, f in pairs]


def load_rows(runner=subprocess.run):
    res = runner(["npx", "wrangler", "d1", "execute", "llm-compass-db", "--remote", "--json", "--command",
                  "SELECT id, name, source, is_deprecated FROM models"], capture_output=True, text=True, check=True)
    return [r for blk in json.loads(res.stdout) for r in blk.get("results", []) if isinstance(r, dict) and r.get("id")]


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--report", action="store_true")
    ap.add_argument("--out", default=OUT)
    args = ap.parse_args()
    pairs, skipped = pair_seed_to_feed(load_rows())
    print(f"🔗 합칠 쌍 {len(pairs)}개 · 보류 {len(skipped)}개")
    for s, f in pairs:
        print(f"   {s:<34} → {f}")
    for s, why in skipped:
        print(f"   [보류] {s}: {why}")
    if not args.report:
        with open(args.out, "w", encoding="utf-8") as fh:
            fh.write("\n".join(build_sql(pairs)) + ("\n" if pairs else ""))
        print(f"✅ {args.out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
