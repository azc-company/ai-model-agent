#!/usr/bin/env python3
"""이미 발행된 기사를 같은 원문으로 다시 생성한다.

발행 시점의 프롬프트가 시각 구조(표·불릿·인용)를 요구하지 않아, 2026-09-04~06
구간 75건 중 시각 요소를 가진 것이 17건뿐이다. original_sources 에 클러스터
구성이 남아 있으므로 원문을 다시 읽어 새 프롬프트로 본문만 갱신할 수 있다.

보존한다: id, created_at, image_url — URL 과 발행 시점이 바뀌면 안 된다.
갱신한다: 제목, 본문, 요약, 수치, 의견, 미확인 사항, 연결 모델, 리포트 라벨.

원문을 하나도 못 읽으면 그 기사는 건드리지 않는다. 원본이 남는 편이 낫다.

  python3 backend/scripts/regenerate_articles.py --since 2026-09-04 --until 2026-09-06
  python3 backend/scripts/regenerate_articles.py --since ... --limit 3   # 표본 확인
  LITELLM_FALLBACK_MODEL= ...   # 폴백이 쓴 기사를 다시 쓸 때 — 같은 폴백이 다시 쓰면 의미가 없다
  npx wrangler d1 execute llm-compass-db --remote --file=seed_regen.sql
"""
import argparse
import json
import os
import subprocess
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from generate_trend_reports import (  # noqa: E402
    ContentFiltered, call_llm, build_prompt, drop_filtered_articles,
    fetch_article_body, find_mentioned_models, load_catalog_names, load_config,
)
from trend_report_validation import REQUIRED_REPORT_FIELDS  # noqa: E402

OUT = "seed_regen.sql"


def esc(s):
    return (s or "").replace("'", "''")


def fetch_targets(since, until, runner=subprocess.run, before=None):
    """대상 기사를 D1 에서 읽는다. before(UTC 시각)는 같은 날 뒤에 쓴 기사를 뺄 때."""
    sql = (
        "SELECT id, title, original_sources FROM trend_news "
        f"WHERE date(created_at) >= '{since}' AND date(created_at) <= '{until}' "
        + (f"AND created_at < '{before}' " if before else "")
        + "ORDER BY created_at"
    )
    res = runner(
        ["npx", "wrangler", "d1", "execute", "llm-compass-db", "--remote", "--json", "--command", sql],
        capture_output=True, text=True,
    )
    out = res.stdout
    data = json.loads(out[out.index("["):])
    return [r for blk in data for r in blk.get("results", []) if isinstance(r, dict) and r.get("id")]


def rebuild_cluster(article, fetcher=fetch_article_body):
    """original_sources 로 원래 클러스터를 복원한다. 본문을 못 읽은 원문은 뺀다."""
    cluster = []
    for src in json.loads(article.get("original_sources") or "[]"):
        url = (src or {}).get("url") if isinstance(src, dict) else None
        if not url:
            continue
        body = fetcher(url)
        if body:
            name = (src.get("title") or "").strip()
            cluster.append({"title": name, "summary": "", "source": name, "link": url, "body": body})
        time.sleep(0.3)   # 같은 도메인을 연달아 때리지 않는다
    return cluster


def build_update_sql(article_id, report, cluster, catalog=()):
    """본문 계열 컬럼만 UPDATE 한다. id·created_at·image_url 은 손대지 않는다."""
    cluster_urls = {a.get("link", "") for a in cluster}
    numbers = [
        {"label": n["label"], "value": n["value"], "source_url": str(n.get("source_url")).strip()}
        for n in (report.get("key_numbers") or [])
        if isinstance(n, dict) and n.get("label") and n.get("value")
        and str(n.get("source_url") or "").strip() in cluster_urls
    ]
    tldr = report.get("tldr", "")
    takeaways = [tldr, report.get("developer_tip", ""), report.get("pm_tip", ""),
                 report.get("business_tip", ""), report.get("researcher_tip", "")]
    mentioned = find_mentioned_models(f"{report.get('title','')} {report.get('blog_body','')}", catalog)
    report_type = "🔮 종합 트렌드 리포트" if len(cluster) > 1 else "🔎 심층 리포트"
    j = lambda v: esc(json.dumps(v, ensure_ascii=False))  # noqa: E731

    return (
        "UPDATE trend_news SET "
        f"title = '{esc(report.get('title',''))}', "
        f"report_type = '{report_type}', "
        f"executive_summary = '{esc(tldr)}', "
        f"analytical_deep_dive = '{esc(report.get('blog_body',''))}', "
        f"key_takeaways = '{j(takeaways)}', "
        f"tags = '{j(report.get('tags', ['#AI트렌드']))}', "
        f"key_numbers = '{j(numbers)}', "
        f"our_take = '{esc(report.get('our_take',''))}', "
        f"open_questions = '{j(report.get('open_questions') or [])}', "
        f"mentioned_models = '{j(mentioned)}', "
        f"original_sources = '{j([{'title': a['source'], 'url': a['link']} for a in cluster])}' "
        f"WHERE id = '{esc(article_id)}';"
    )


def regenerate(targets, config, catalog, generator=call_llm, cluster_builder=rebuild_cluster):
    statements, skipped, failed = [], [], []
    for idx, art in enumerate(targets, 1):
        title = (art.get("title") or "")[:40]
        print(f"[{idx}/{len(targets)}] {title}", flush=True)
        cluster = cluster_builder(art)
        if not cluster:
            print("    원문을 하나도 못 읽음 — 건너뜀 (원본 유지)")
            skipped.append(art["id"])
            continue
        try:
            try:
                report = generator(build_prompt(cluster), config)
            except ContentFiltered:
                kept = drop_filtered_articles(cluster, config)
                if not kept:
                    raise
                print(f"    [필터 회피] 차단 원문 {len(cluster) - len(kept)}건 제외")
                cluster = kept
                report = generator(build_prompt(cluster), config)
        except Exception as error:
            print(f"    실패 {type(error).__name__}: {str(error)[:120]} — 건너뜀 (원본 유지)")
            failed.append(art["id"])
            continue
        if not all(report.get(f) for f in REQUIRED_REPORT_FIELDS):
            print("    필수 필드 누락 — 건너뜀 (원본 유지)")
            failed.append(art["id"])
            continue
        statements.append(build_update_sql(art["id"], report, cluster, catalog))
        body = report.get("blog_body", "")
        print(f"    ✓ 원문 {len(cluster)}건 → 본문 {len(body):,}자 · 수치 {len(report.get('key_numbers') or [])}개")
    return statements, skipped, failed


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--since", required=True)
    ap.add_argument("--until", required=True)
    ap.add_argument("--limit", type=int)
    ap.add_argument("--before", help="UTC 'YYYY-MM-DD HH:MM' 이전 기사만")
    ap.add_argument("--out", default=OUT)
    args = ap.parse_args()

    targets = fetch_targets(args.since, args.until, before=args.before)
    if args.limit:
        targets = targets[: args.limit]
    print(f"대상 {len(targets)}건 ({args.since} ~ {args.until})\n")

    config = load_config()
    catalog = load_catalog_names()
    statements, skipped, failed = regenerate(targets, config, catalog)

    with open(args.out, "w", encoding="utf-8") as f:
        f.write("\n".join(statements) + ("\n" if statements else ""))
    print(f"\n📊 갱신 {len(statements)} · 원문없음 {len(skipped)} · 실패 {len(failed)}")
    print(f"✅ {args.out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
