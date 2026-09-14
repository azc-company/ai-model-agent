"""번역 실패가 원문으로 굳지 않는지 확인한다.

2026-09-06 백필 도중 무료 번역 엔진이 막히자 194행이 6개 언어 전부 영어 원문으로
저장됐고, 재시도 조건이 "번역이 NULL" 뿐이라 다시 시도되지 않았다.
"""
import importlib.util
import io
import json
import unittest
import urllib.error
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("tr", ROOT / "backend/scripts/translate_model_descriptions.py")
tr = importlib.util.module_from_spec(spec)
spec.loader.exec_module(tr)
tr.time.sleep = lambda *_: None      # 재시도 대기를 건너뛴다

SRC = "GLM-5.3 is a large-scale reasoning model from Z.ai."


class _Resp(io.BytesIO):
    def __enter__(self): return self
    def __exit__(self, *a): return False


def opener_blocked(req, timeout=None):
    raise urllib.error.HTTPError(req.full_url, 429, "Too Many Requests", {}, None)


def opener_echo(req, timeout=None):
    # 엔진이 번역하지 않고 원문을 그대로 돌려주는 경우
    if "googleapis" in req.full_url:
        return _Resp(json.dumps([[[SRC, SRC]]]).encode())
    return _Resp(json.dumps({"responseData": {"translatedText": SRC}}).encode())


def opener_ok(req, timeout=None):
    return _Resp(json.dumps([[["번역됨", SRC]]]).encode())


class TranslateTest(unittest.TestCase):
    def test_blocked_engine_returns_none_not_the_source(self):
        self.assertIsNone(tr.translate(SRC, "ko", "en", opener=opener_blocked))

    def test_engine_echoing_the_source_counts_as_failure(self):
        self.assertIsNone(tr.translate(SRC, "ko", "en", opener=opener_echo))

    def test_success(self):
        self.assertEqual(tr.translate(SRC, "ko", "en", opener=opener_ok), "번역됨")

    def test_markdown_links_are_flattened_before_translation(self):
        self.assertEqual(tr.strip_links("see [DeepSeek V4 Flash 0731](https://openrouter.ai/x) now"),
                         "see DeepSeek V4 Flash 0731 now")


class MissingLangsTest(unittest.TestCase):
    def test_translation_stuck_as_source_text_is_retried(self):
        stuck = json.dumps({lang: SRC for lang in tr.LANGS})
        self.assertEqual(tr.missing_langs(SRC, stuck), ["ko", "ja", "zh", "es", "de", "fr"])

    def test_complete_translation_needs_nothing(self):
        full = json.dumps({"en": SRC, **{l: f"{l} 번역" for l in tr.LANGS if l != "en"}})
        self.assertEqual(tr.missing_langs(SRC, full), [])

    def test_null_translation_needs_every_other_language(self):
        self.assertEqual(len(tr.missing_langs(SRC, None)), 6)


class BuildRowTest(unittest.TestCase):
    def test_failed_languages_are_removed_not_filled_with_source(self):
        row = {"id": "m1", "description": SRC, "description_i18n": json.dumps({l: SRC for l in tr.LANGS})}
        stmt, filled, failed, _ = tr.build_row(row, translator=lambda t, tgt, s: "번역" if tgt == "ko" else None, pause=0)
        stored = json.loads(stmt.split("description_i18n = '")[1].split("' WHERE")[0].replace("''", "'"))
        self.assertEqual((filled, failed), (1, 5))
        self.assertEqual(stored["ko"], "번역")
        self.assertEqual(stored["en"], SRC)
        for lang in ("ja", "zh", "es", "de", "fr"):
            self.assertNotIn(lang, stored)          # 원문 복사본을 남기지 않는다 → 다음 실행이 재시도


class LlmFallbackTest(unittest.TestCase):
    CFG = type("C", (), {"model": "gemini/x", "fallback_model": "", "litellm_url": "https://gw.test/v1", "litellm_key": "k"})()

    def _opener(self, content, finish="stop"):
        def opener(req, timeout=None):
            return _Resp(json.dumps({"choices": [{"finish_reason": finish, "message": {"content": content}}]}).encode())
        return opener

    def test_only_languages_the_free_engine_failed_go_to_the_llm(self):
        row = {"id": "m1", "description": SRC, "description_i18n": None}
        asked = []
        def llm(text, src, targets):
            asked.append(list(targets))
            return {t: f"{t}-LLM" for t in targets}
        stmt, filled, failed, free_failed = tr.build_row(
            row, translator=lambda t, tgt, s: "번역" if tgt == "ko" else None, pause=0, llm=llm)
        self.assertEqual(asked, [["ja", "zh", "es", "de", "fr"]])
        self.assertEqual((filled, failed, free_failed), (6, 0, 5))

    def test_skip_free_sends_everything_straight_to_the_llm(self):
        row = {"id": "m1", "description": SRC, "description_i18n": None}
        called = []
        _, filled, _, free_failed = tr.build_row(
            row, translator=lambda *a: called.append(a), pause=0, skip_free=True,
            llm=lambda text, src, targets: {t: "x" for t in targets})
        self.assertEqual(called, [])
        self.assertEqual((filled, free_failed), (6, 0))

    def test_llm_output_must_be_in_the_target_script(self):
        # ko 에 영어 원문을 돌려주면 번역으로 치지 않는다
        content = json.dumps({"ko": SRC, "ja": "GLM-5.3 は Z.ai の大規模推論モデルです。", "de": "GLM-5.3 ist ein Modell."})
        out = tr.llm_translate(SRC, "en", ["ko", "ja", "de"], self.CFG, opener=self._opener(content))
        self.assertEqual(sorted(out), ["de", "ja"])

    def test_content_filter_yields_nothing(self):
        out = tr.llm_translate(SRC, "en", ["ko"], self.CFG, opener=self._opener("blocked", finish="content_filter"))
        self.assertEqual(out, {})

    def test_fenced_json_is_accepted(self):
        content = "```json\n" + json.dumps({"ko": "GLM-5.3은 Z.ai의 추론 모델입니다."}) + "\n```"
        self.assertIn("ko", tr.llm_translate(SRC, "en", ["ko"], self.CFG, opener=self._opener(content)))


if __name__ == "__main__":
    unittest.main()
