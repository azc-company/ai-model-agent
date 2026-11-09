#!/usr/bin/env python3
"""한국어 기사를 번역해 trend_news_i18n 에 넣을 SQL 을 만든다.

기사는 평균 6,000자가 넘어 무료 번역 엔진(800자 제한, 70건쯤이면 차단)을 쓸 수 없다.
뉴스 배치와 같은 게이트웨이의 LLM 으로 번역하고, 기사 생성과 분리해 돌린다 — 번역이
실패해도 기사 발행에는 영향이 없고, 다음 실행이 다시 시도한다.

검증을 통과하지 못한 번역은 저장하지 않는다. 화면은 그 기사를 한국어로 보여 준다.

  python3 backend/scripts/translate_articles.py --limit 2      # 동작 확인용
  npx wrangler d1 execute llm-compass-db --remote --file=seed_article_i18n.sql
"""
import argparse
import concurrent.futures
import hashlib
import json
import re
import subprocess
import sys
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from translate_model_descriptions import LANG_NAMES, escape_sql  # noqa: E402

OUT = "seed_article_i18n.sql"
ABORT_AFTER_FAILED_BATCHES = 3   # 연달아 전부 실패하면 게이트웨이가 막힌 것 — 비용만 쓰지 않고 멈춘다
HASHED = ("title", "report_type", "executive_summary", "analytical_deep_dive",
          "key_takeaways", "key_numbers", "our_take", "open_questions", "tags")
# 배치가 쓰는 고정 값이라 LLM 에 맡기지 않는다(기사마다 표현이 달라진다). 모르는 값은 NULL → 원문 표시.
REPORT_TYPES = {
    "🔎 심층 리포트": {"en": "🔎 In-depth report"},
    "🔮 종합 트렌드 리포트": {"en": "🔮 Trend synthesis report"},
}
# 게이트웨이의 hide-secrets 가드레일이 이 키 이름들을 "[REDACTED]" 로 바꿔 응답이 깨진다(2026-11-09 실측).
WIRE_KEYS = {"executive_summary": "summary", "analytical_deep_dive": "body",
             "key_numbers": "figures", "open_questions": "questions"}
HANGUL = re.compile(r"[가-힣]")
MODEL_NAME = re.compile(r"[A-Za-z]+-?\d[A-Za-z0-9.-]*")


def _json_list(raw) -> list:
    try:
        value = json.loads(raw or "[]")
    except (TypeError, json.JSONDecodeError):
        return []
    return value if isinstance(value, list) else []


def source_hash(row: dict) -> str:
    return hashlib.sha256(json.dumps([row.get(k) or "" for k in HASHED], ensure_ascii=False).encode()).hexdigest()[:16]


def needs_translation(row: dict) -> bool:
    return bool((row.get("title") or "").strip()) and row.get("translated_hash") != source_hash(row)


def load_rows(lang: str, days: int, runner=subprocess.run) -> list:
    sql = ("SELECT t.id, t.title, t.report_type, t.executive_summary, t.analytical_deep_dive, t.key_takeaways, "
           "t.key_numbers, t.our_take, t.open_questions, t.tags, i.source_hash AS translated_hash "
           f"FROM trend_news t LEFT JOIN trend_news_i18n i ON i.news_id = t.id AND i.lang = '{lang}' "
           f"WHERE t.created_at >= datetime('now', '-{int(days)} day') ORDER BY t.created_at DESC")
    res = runner(["npx", "wrangler", "d1", "execute", "llm-compass-db", "--remote", "--json", "--command", sql],
                 capture_output=True, text=True, check=True)
    return [r for blk in json.loads(res.stdout) for r in blk.get("results", []) if isinstance(r, dict) and r.get("id")]


def build_payload(row: dict) -> dict:
    return {
        "title": row.get("title") or "",
        "executive_summary": row.get("executive_summary") or "",
        "analytical_deep_dive": row.get("analytical_deep_dive") or "",
        "key_takeaways": _json_list(row.get("key_takeaways")),
        "key_numbers": [{"label": n.get("label", ""), "value": n.get("value", "")}
                        for n in _json_list(row.get("key_numbers")) if isinstance(n, dict)],
        "our_take": row.get("our_take") or "",
        "open_questions": _json_list(row.get("open_questions")),
        "tags": _json_list(row.get("tags")),
    }


def to_wire(data: dict) -> dict:
    return {WIRE_KEYS.get(k, k): v for k, v in data.items()}


def from_wire(data) -> dict:
    back = {v: k for k, v in WIRE_KEYS.items()}
    return {back.get(k, k): v for k, v in data.items()} if isinstance(data, dict) else data


def build_prompt(payload: dict, lang: str) -> str:
    return (
        f"Translate every value of this Korean AI news article JSON into {LANG_NAMES[lang]}.\n"
        "Rules:\n"
        "- Keep the same keys. Every array keeps the same length and order.\n"
        "- Keep product, model and company names exactly as written.\n"
        "- Convert Korean number units correctly: 1만 = 10 thousand, 100만 = 1 million, 1억 = 100 million, 1조 = 1 trillion. Never change a quantity.\n"
        "- Keep all Markdown (##, **, tables, lists) and every line break.\n"
        "- Do not add, drop or soften information. Professional technology-journalism tone.\n"
        "- tags: one word per tag, starting with #, no spaces.\n"
        "Return ONLY the JSON object.\n\n"
        + json.dumps(to_wire(payload), ensure_ascii=False)
    )


def _flatten(value) -> str:
    if isinstance(value, dict):
        return " ".join(_flatten(v) for v in value.values())
    if isinstance(value, list):
        return " ".join(_flatten(v) for v in value)
    return str(value or "")


def validation_error(src: dict, out) -> str | None:
    """번역을 저장하면 안 되는 이유. 문제없으면 None."""
    if not isinstance(out, dict):
        return "not an object"
    for key, value in src.items():
        got = out.get(key)
        if isinstance(value, list):
            if not isinstance(got, list) or len(got) != len(value):
                return f"{key}: length changed"   # Worker 가 key_takeaways 를 위치로 읽는다
            if key == "key_numbers":
                if not all(isinstance(g, dict) and g.get("label") and g.get("value") for g in got):
                    return "key_numbers: empty item"
                for a, b in zip(value, got):
                    # shortcut: 만·억·조 단위는 자릿수가 바뀌어 비교를 건너뛴다. 오역이 나오면 단위 환산 비교로.
                    if not re.search("[천만억조]", a["value"]) and re.findall(r"\d", a["value"]) != re.findall(r"\d", str(b["value"])):
                        return f"key_numbers: value changed ({a['value']})"
            elif not all(isinstance(g, str) and g.strip() for g in got):
                return f"{key}: empty item"
        elif value and not (isinstance(got, str) and got.strip()):
            return f"{key}: empty"
    if HANGUL.search(str(out["title"])):
        return "title: untranslated"
    text = _flatten({k: out.get(k) for k in src})
    if "REDACTED]" in text:
        return "masked by gateway"                  # 가려진 문구가 기사 본문으로 저장되면 안 된다
    if len(HANGUL.findall(text)) > len(text) * 0.01:   # 인용된 고유명사 몇 글자는 허용한다
        return "untranslated text"
    source_body, translated_body = src["analytical_deep_dive"], str(out.get("analytical_deep_dive") or "")
    if len(translated_body) < len(source_body) * 0.7:
        return "body: too short"
    if translated_body.count("\n") < source_body.count("\n") * 0.5:
        return "body: line breaks lost"             # 줄바꿈이 사라지면 본문이 한 덩어리로 렌더링된다
    names = {m.strip(".-") for m in MODEL_NAME.findall(_flatten(src))}
    lowered = text.lower()
    if names and sum(n.lower() in lowered for n in names) < len(names) * 0.9:
        return "model names changed"
    return None


def request_translation(payload: dict, lang: str, config, opener=urllib.request.urlopen):
    """검증을 통과한 번역 dict, 실패하면 None."""
    for model in dict.fromkeys(m for m in (config.model, config.fallback_model) if m):
        body = {"model": model, "temperature": 0.2, "max_tokens": 12000,
                "messages": [{"role": "system", "content": "You are a precise technical translator. Return only valid JSON."},
                             {"role": "user", "content": build_prompt(payload, lang)}],
                "response_format": {"type": "json_object"}}
        req = urllib.request.Request(f"{config.litellm_url}/chat/completions", method="POST",
                                     data=json.dumps(body).encode(),
                                     headers={"Authorization": f"Bearer {config.litellm_key}",
                                              "Content-Type": "application/json", "User-Agent": "curl/8.7.1"})
        try:
            with opener(req, timeout=120) as r:
                choice = json.loads(r.read())["choices"][0]
            if choice.get("finish_reason") == "content_filter":
                return None                     # 게이트웨이 필터 — 다른 모델도 같은 게이트웨이라 소용없다
            if choice.get("finish_reason") == "length":
                continue                        # 잘린 JSON
            raw = re.sub(r"^```(?:json)?\s*|\s*```$", "", (choice["message"].get("content") or "").strip())
            data = from_wire(json.loads(raw))
        except Exception as exc:
            print(f"   ⚠️ {model}: {type(exc).__name__}")
            continue
        error = validation_error(payload, data)
        if not error:
            return data
        print(f"   ⚠️ {model}: 검증 실패 — {error}")
    return None


def _sql(value) -> str:
    return "NULL" if value is None else f"'{escape_sql(value)}'"


def _sql_json(value) -> str:
    return _sql(json.dumps(value, ensure_ascii=False))


def build_statement(row: dict, lang: str, translated: dict) -> str:
    numbers = [n for n in _json_list(row.get("key_numbers")) if isinstance(n, dict)]
    merged = [{**src, "label": out["label"], "value": out["value"]}   # source_url 은 LLM 을 거치지 않는다
              for src, out in zip(numbers, translated["key_numbers"])]
    tags = ["#" + re.sub(r"\s+", "", str(t).lstrip("#")) for t in translated["tags"]]
    values = [_sql(row["id"]), _sql(lang), _sql(translated["title"].strip()),
              _sql(REPORT_TYPES.get(row.get("report_type") or "", {}).get(lang)),
              _sql(translated.get("executive_summary") or None), _sql(translated.get("analytical_deep_dive") or None),
              _sql_json(translated["key_takeaways"]), _sql_json(merged), _sql(translated.get("our_take") or None),
              _sql_json(translated["open_questions"]), _sql_json(tags), _sql(source_hash(row))]
    return ("INSERT OR REPLACE INTO trend_news_i18n (news_id, lang, title, report_type, executive_summary, "
            "analytical_deep_dive, key_takeaways, key_numbers, our_take, open_questions, tags, source_hash) "
            f"VALUES ({', '.join(values)});")


def translate_row(row: dict, lang: str, config, opener=urllib.request.urlopen):
    translated = request_translation(build_payload(row), lang, config, opener)
    return build_statement(row, lang, translated) if translated else None


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--lang", default="en", choices=sorted(set(LANG_NAMES) - {"ko"}))
    ap.add_argument("--days", type=int, default=30, help="최근 며칠 기사까지 번역할지")
    ap.add_argument("--limit", type=int, default=100, help="한 번에 처리할 기사 수. 밀린 분량은 다음 실행이 잇는다")
    ap.add_argument("--workers", type=int, default=4)
    ap.add_argument("--out", default=OUT)
    args = ap.parse_args()

    from generate_trend_reports import load_config   # 뉴스 배치와 같은 게이트웨이
    config = load_config()
    rows = [r for r in load_rows(args.lang, args.days) if needs_translation(r)]
    print(f"📥 번역 대상 {len(rows)}건 ({args.lang}, 최근 {args.days}일) · 이번 실행 최대 {args.limit}건 · {config.model}")
    rows = rows[: args.limit]

    statements, failed_batches = [], 0
    with concurrent.futures.ThreadPoolExecutor(args.workers) as pool:
        for start in range(0, len(rows), args.workers):
            batch = rows[start: start + args.workers]
            done = [s for s in pool.map(lambda r: translate_row(r, args.lang, config), batch) if s]
            statements.extend(done)
            failed_batches = failed_batches + 1 if not done else 0
            print(f"   … {start + len(batch)}/{len(rows)} (성공 {len(statements)})", flush=True)
            if failed_batches >= ABORT_AFTER_FAILED_BATCHES:
                print("⚠️ 연속 실패 — 번역 경로가 막힌 것으로 보고 멈춘다. 나머지는 다음 실행에서.")
                break

    with open(args.out, "w", encoding="utf-8") as f:
        if statements:
            f.write("\n".join(statements) + "\n")
    print(f"✅ 번역 {len(statements)}건 → {args.out} · 실패·미처리(다음 실행에 재시도) {len(rows) - len(statements)}건")
    return 1 if rows and not statements else 0   # 전부 실패는 워크플로에 빨간불로 드러낸다


if __name__ == "__main__":
    sys.exit(main())
