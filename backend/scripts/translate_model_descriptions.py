#!/usr/bin/env python3
"""모델 설명(description)을 지원 언어로 번역해 models.description_i18n 을 채운다.

원문이 한국어인 행은 영어 UI 에서 한국어로, 영어인 행은 한국어 UI 에서 영어로
보였다. 언어별 번역본을 컬럼 하나(JSON)에 담아 Worker 가 ?lang= 으로 고른다.

번역 엔진은 무료 경로(Google GTX → MyMemory)다. LLM 을 부르지 않아 토큰 비용이 없다.

■ 실패는 비워 둔다 (2026-09-14 수정)
  예전에는 번역이 실패하면 원문을 번역본 자리에 저장했다. 9/06 대량 백필 도중 무료
  엔진이 한동안 막히자 194행이 6개 언어 전부 영어 원문으로 굳었고, 재시도 조건이
  "번역이 NULL" 뿐이라 영영 다시 시도되지 않았다. 한국어 화면에 영어 설명이 보인 원인.
  이제 실패한 언어는 저장하지 않고(Worker 가 원문으로 대체 표시), 다음 실행이 다시 채운다.

■ LLM 대체 경로 (2026-09-14 추가)
  무료 엔진은 요청 70건 안팎이면 막힌다. 주간 실행이 한 번에 10행 남짓밖에 못 고쳐
  밀린 182행에 4달 가까이 걸리는 구조였다. LITELLM_API_KEY 가 있으면, 무료 엔진이
  실패한 언어만 모아 뉴스 배치와 같은 게이트웨이로 모델당 한 번 호출해 채운다.
  무료 엔진이 연달아 막히면 그 실행의 나머지 행은 곧장 LLM 으로 보낸다.

  python3 backend/scripts/translate_model_descriptions.py --missing-only   # 빠졌거나 실패한 번역만
  python3 backend/scripts/translate_model_descriptions.py --limit 20       # 일부만 (동작 확인용)
  npx wrangler d1 execute llm-compass-db --remote --file=seed_model_i18n.sql
"""
import argparse
import json
import os
import re
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

LANGS = ["ko", "en", "ja", "zh", "es", "de", "fr"]
OUT = "seed_model_i18n.sql"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"
MAX_CHARS = 800            # 실측 최대 설명 길이 336자. GET URL 길이 여유를 둔다.
ABORT_AFTER_BLOCKED_ROWS = 8   # 연속 N행이 전 언어 실패면 엔진이 막힌 것 — (LLM 도 없으면) 멈추고 다음 실행에 맡긴다
LANG_NAMES = {"ko": "Korean", "en": "English", "ja": "Japanese", "zh": "Simplified Chinese",
              "es": "Spanish", "de": "German", "fr": "French"}


def detect_lang(text: str) -> str:
    """원문 언어. 한글이 섞여 있으면 ko, 아니면 en 으로 본다."""
    return "ko" if re.search(r"[가-힣]", text) else "en"


def strip_links(text: str) -> str:
    """[텍스트](URL) → 텍스트. 수집 단계에서도 걸러지지만 기존 행을 위해 한 번 더."""
    return re.sub(r"\[([^\]]+)\]\s*\((?:https?://)[^)]*\)", r"\1", text or "")   # 번역 엔진이 ] 와 ( 사이에 공백을 넣는다


def _get_json(url: str, opener, attempts: int = 3):
    """429·5xx 는 잠깐 쉬고 다시 시도한다. 그 외 오류나 끝내 실패하면 None."""
    for i in range(attempts):
        try:
            with opener(urllib.request.Request(url, headers={"User-Agent": UA}), timeout=10) as r:
                return json.loads(r.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            if e.code != 429 and e.code < 500:
                return None
        except Exception:
            pass
        if i < attempts - 1:
            time.sleep(2 * (i + 1))
    return None


def translate(text: str, target: str, source: str, opener=urllib.request.urlopen):
    """번역 결과, 실패하면 None. 원문을 돌려주지 않는다 — 원문이 번역본으로 저장되면 복구가 안 된다."""
    clean = strip_links(text).strip()[:MAX_CHARS]
    if len(clean) < 3 or target == source:
        return clean
    data = _get_json("https://translate.googleapis.com/translate_a/single"
                     f"?client=gtx&sl={source}&tl={target}&dt=t&q={urllib.parse.quote(clean)}", opener)
    try:
        out = "".join(item[0] for item in data[0] if item and item[0]).strip() if data else ""
    except (TypeError, IndexError):
        out = ""
    if out and out != clean:
        return out
    data = _get_json("https://api.mymemory.translated.net/get"
                     f"?q={urllib.parse.quote(clean[:500])}&langpair={source}|{target}", opener)
    out = ((data or {}).get("responseData") or {}).get("translatedText", "").strip()
    if out and out != clean and not out.upper().startswith("MYMEMORY WARNING"):
        return out
    return None


def _script_ok(lang: str, text: str) -> bool:
    """대상 언어의 문자가 실제로 들어 있는지. LLM 이 번역을 건너뛰고 원문을 돌려주는 경우를 거른다."""
    if lang == "ko":
        return bool(re.search(r"[가-힣]", text))
    if lang == "ja":
        return bool(re.search(r"[぀-ヿ一-鿿]", text))
    if lang == "zh":
        return bool(re.search(r"[一-鿿]", text))
    return bool(re.search(r"[A-Za-zÀ-ÿ]", text))


def llm_translate(text: str, source: str, targets: list, config, opener=urllib.request.urlopen) -> dict:
    """무료 엔진이 실패한 언어를 한 번에 번역한다. 실패하거나 필터에 막히면 빈 dict."""
    clean = strip_links(text).strip()[:MAX_CHARS]
    targets = [t for t in targets if t != source]
    if len(clean) < 3 or not targets:
        return {}
    wanted = ", ".join(f'"{t}" ({LANG_NAMES[t]})' for t in targets)
    prompt = (
        f"Translate this AI model description from {LANG_NAMES[source]} into: {wanted}.\n"
        "Rules: keep product/model/company names, numbers and units exactly as written; "
        "do not add or drop information; natural, concise catalog tone; Korean in formal declarative style (~입니다).\n"
        f"Return ONLY a JSON object whose keys are exactly {json.dumps(targets)} and whose values are the translations.\n\n"
        f"Text:\n{clean}"
    )
    for model in (config.model, config.fallback_model):
        if not model:
            continue
        body = {"model": model, "temperature": 0.2, "max_tokens": 3000,
                "messages": [{"role": "system", "content": "You are a precise technical translator. Return only valid JSON."},
                             {"role": "user", "content": prompt}],
                "response_format": {"type": "json_object"}}
        if "qwen" in model.lower():
            body["reasoning_effort"] = "none"   # 켜 두면 400 (뉴스 배치와 동일)
        req = urllib.request.Request(f"{config.litellm_url}/chat/completions", method="POST",
                                     data=json.dumps(body).encode(),
                                     headers={"Authorization": f"Bearer {config.litellm_key}",
                                              "Content-Type": "application/json", "User-Agent": "curl/8.7.1"})
        try:
            with opener(req, timeout=60) as r:
                choice = json.loads(r.read())["choices"][0]
            if choice.get("finish_reason") == "content_filter":
                return {}                       # 게이트웨이 필터 오탐 — 다른 모델도 같은 게이트웨이라 소용없다
            raw = re.sub(r"^```(?:json)?\s*|\s*```$", "", (choice["message"].get("content") or "").strip())
            data = json.loads(raw)
        except Exception:
            continue
        out = {}
        for t in targets:
            v = strip_links(str(data.get(t) or "")).strip()
            if v and v != clean and _script_ok(t, v):
                out[t] = v
        if out:
            return out
    return {}


def missing_langs(description: str, i18n_raw: str) -> list:
    """다시 번역해야 할 언어. 비었거나, 원문과 똑같이 저장된(=과거 실패) 언어."""
    src_text = strip_links(description).strip()
    src = detect_lang(src_text)
    try:
        stored = json.loads(i18n_raw or "{}")
    except json.JSONDecodeError:
        stored = {}
    out = []
    for lang in LANGS:
        if lang == src:
            continue
        v = strip_links(stored.get(lang) or "").strip()
        if not v or v == src_text:
            out.append(lang)
    return out


def load_rows(runner=subprocess.run) -> list:
    """번역 원문은 D1 에서 읽는다. 공개 API 는 ?lang 에 맞춰 이미 번역된 설명을 내려줘서 원문이 아니다."""
    res = runner(["npx", "wrangler", "d1", "execute", "llm-compass-db", "--remote", "--json",
                  "--command", "SELECT id, description, description_i18n FROM models WHERE is_deprecated = 0"],
                 capture_output=True, text=True, check=True)
    data = json.loads(res.stdout)
    return [r for blk in data for r in blk.get("results", []) if isinstance(r, dict) and r.get("id")]


def escape_sql(s: str) -> str:
    return s.replace("'", "''")


def build_row(row: dict, translator=translate, pause: float = 0.12, llm=None, skip_free=False):
    """(UPDATE 문 또는 None, 새로 채운 언어 수, 이번에 실패한 언어 수, 무료 엔진 실패 수)

    llm: (text, src, targets) -> {lang: text}. 무료 엔진이 실패한 언어만 넘긴다.
    skip_free: 무료 엔진이 막힌 게 확인된 실행에서는 바로 LLM 으로 보낸다.
    """
    desc = strip_links(row.get("description") or "").strip()
    if len(desc) < 3:
        return None, 0, 0, 0
    src = detect_lang(desc)
    try:
        by_lang = json.loads(row.get("description_i18n") or "{}")
    except json.JSONDecodeError:
        by_lang = {}
    todo = missing_langs(desc, row.get("description_i18n"))
    filled = 0
    free_failed = []
    for lang in todo:
        out = None if skip_free else translator(desc, lang, src)
        if out:
            by_lang[lang] = out
            filled += 1
        else:
            by_lang.pop(lang, None)       # 원문 복사본이 남아 있었다면 걷어낸다
            free_failed.append(lang)
        if not skip_free:
            time.sleep(pause)
    if free_failed and llm:
        got = llm(desc, src, free_failed)
        for lang, text in got.items():
            by_lang[lang] = text
        filled += len(got)
    failed = len([l for l in free_failed if l not in by_lang])
    by_lang[src] = desc
    by_lang = {k: strip_links(v) for k, v in by_lang.items()}
    payload = escape_sql(json.dumps(by_lang, ensure_ascii=False))
    return (f"UPDATE models SET description_i18n = '{payload}' WHERE id = '{escape_sql(row['id'])}';",
            filled, failed, 0 if skip_free else len(free_failed))


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--limit", type=int, help="처리할 모델 수 (동작 확인용)")
    ap.add_argument("--only-korean", action="store_true", help="원문이 한국어인 행만 처리")
    ap.add_argument("--missing-only", action="store_true",
                    help="번역이 비었거나 과거에 실패해 원문으로 굳은 행만 처리 — 주간 배치가 쓴다")
    ap.add_argument("--no-llm", action="store_true", help="LLM 대체 경로를 쓰지 않는다")
    ap.add_argument("--llm-only", action="store_true",
                    help="무료 엔진을 건너뛰고 바로 LLM 으로 번역 — 엔진이 막힌 게 확실할 때 재시도 대기를 줄인다")
    ap.add_argument("--out", default=OUT)
    args = ap.parse_args()

    rows = load_rows()
    print(f"📥 모델 {len(rows)}개")
    if args.missing_only:
        rows = [r for r in rows if missing_langs(r.get("description") or "", r.get("description_i18n"))]
        print(f"   번역이 비었거나 실패로 굳은 행 {len(rows)}개")
    if args.only_korean:
        rows = [r for r in rows if detect_lang(r.get("description") or "") == "ko"]
    if args.limit:
        rows = rows[: args.limit]

    llm = None
    if os.environ.get("LITELLM_API_KEY") and not args.no_llm:
        from generate_trend_reports import load_config   # 뉴스 배치와 같은 게이트웨이·모델
        config = load_config()
        llm = lambda text, src, targets: llm_translate(text, src, targets, config)  # noqa: E731
        print(f"   LLM 대체 경로 사용: {config.model}")

    statements, filled_total, failed_total = [], 0, 0
    free_blocked_streak, blocked_streak, skip_free = 0, 0, bool(args.llm_only and llm)
    for i, row in enumerate(rows, 1):
        stmt, filled, failed, free_failed = build_row(row, llm=llm, skip_free=skip_free)
        if stmt:
            statements.append(stmt)
        filled_total += filled
        failed_total += failed
        # 무료 엔진이 연달아 전부 실패하면 막힌 것이다. LLM 이 있으면 이후 행은 무료 엔진을 건너뛴다.
        if not skip_free:
            free_blocked_streak = free_blocked_streak + 1 if free_failed and free_failed == len(missing_langs(row.get("description") or "", row.get("description_i18n"))) else 0
            if llm and free_blocked_streak >= ABORT_AFTER_BLOCKED_ROWS:
                skip_free = True
                print(f"   무료 엔진이 연속 {free_blocked_streak}행 막힘 — 나머지는 LLM 으로 바로 번역한다")
        blocked_streak = blocked_streak + 1 if failed and not filled else 0
        if blocked_streak >= ABORT_AFTER_BLOCKED_ROWS:
            print(f"⚠️ 연속 {blocked_streak}행이 전 언어 실패 — 번역 경로가 모두 막힌 것으로 보고 멈춘다. 나머지는 다음 실행에서.")
            break
        if i % 25 == 0:
            print(f"   … {i}/{len(rows)} (채움 {filled_total} · 실패 {failed_total})")

    with open(args.out, "w", encoding="utf-8") as f:
        if statements:
            f.write("-- 모델 설명 다국어 백필. 재실행해도 안전한 UPDATE 문이다.\n")
            f.write("\n".join(statements) + "\n")
    print(f"✅ {len(statements)}행 → {args.out} · 채운 번역 {filled_total} · 실패(다음 실행에 재시도) {failed_total}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
