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
        stmt, filled, failed = tr.build_row(row, translator=lambda t, tgt, s: "번역" if tgt == "ko" else None, pause=0)
        stored = json.loads(stmt.split("description_i18n = '")[1].split("' WHERE")[0].replace("''", "'"))
        self.assertEqual((filled, failed), (1, 5))
        self.assertEqual(stored["ko"], "번역")
        self.assertEqual(stored["en"], SRC)
        for lang in ("ja", "zh", "es", "de", "fr"):
            self.assertNotIn(lang, stored)          # 원문 복사본을 남기지 않는다 → 다음 실행이 재시도


if __name__ == "__main__":
    unittest.main()
