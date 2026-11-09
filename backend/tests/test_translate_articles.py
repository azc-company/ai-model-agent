"""번역본을 저장해도 되는지 가르는 검증과, 다시 번역할 대상 판정을 확인한다."""
import importlib.util
import io
import json
import unittest
from pathlib import Path
from types import SimpleNamespace

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("ta", ROOT / "backend/scripts/translate_articles.py")
ta = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ta)

ROW = {
    "id": "a'1",
    "title": "GPT-5.5 출시",
    "report_type": "🔎 심층 리포트",
    "executive_summary": "요약입니다",
    "analytical_deep_dive": "## 배경\n\nGPT-5.5 는 빠릅니다.\n\n세부 내용입니다.",
    "key_takeaways": json.dumps(["요약", "개발자", "PM", "비즈니스", "연구자"], ensure_ascii=False),
    "key_numbers": json.dumps([{"label": "사용자", "value": "100만 명", "source_url": "https://ex.com/a"},
                               {"label": "팀 수", "value": "9개", "source_url": "https://ex.com/b"}], ensure_ascii=False),
    "our_take": "의견",
    "open_questions": json.dumps(["질문"], ensure_ascii=False),
    "tags": json.dumps(["#AI에이전트"], ensure_ascii=False),
}


def good():
    return {
        "title": "GPT-5.5 released",
        "executive_summary": "A summary of the article",
        "analytical_deep_dive": "## Background\n\nGPT-5.5 is fast and capable.\n\nHere are the details of the release.",
        "key_takeaways": ["Summary", "Dev", "PM", "Biz", "Research"],
        "key_numbers": [{"label": "Users", "value": "1 million"}, {"label": "Teams", "value": "9"}],
        "our_take": "Opinion",
        "open_questions": ["A question"],
        "tags": ["# AI Agents"],
    }


class ValidationTest(unittest.TestCase):
    def check(self, **changes):
        return ta.validation_error(ta.build_payload(ROW), {**good(), **changes})

    def test_good_translation_passes(self):
        self.assertIsNone(self.check())

    def test_takeaway_count_must_match_because_worker_reads_by_position(self):
        self.assertIn("length", self.check(key_takeaways=["only one"]))

    def test_untranslated_title_is_rejected(self):
        self.assertIn("title", self.check(title="GPT-5.5 출시"))

    def test_mostly_korean_body_is_rejected(self):
        self.assertIn("untranslated", self.check(our_take="한국어 그대로 남은 문장입니다 " * 10))

    def test_lost_line_breaks_are_rejected(self):
        self.assertIn("line breaks", self.check(analytical_deep_dive="## Background GPT-5.5 is fast and capable. Here are the details."))

    def test_truncated_body_is_rejected(self):
        self.assertIn("too short", self.check(analytical_deep_dive="GPT-5.5\n\n\n\n"))

    def test_renamed_model_is_rejected(self):
        self.assertIn("model names", self.check(
            title="GPT released",
            analytical_deep_dive="## Background\n\nThe model is fast and capable.\n\nHere are the details of the release."))

    def test_text_masked_by_gateway_is_rejected(self):
        self.assertIn("masked", self.check(our_take="Contact [EMAIL_REDACTED] for details"))

    def test_changed_plain_number_is_rejected(self):
        numbers = [{"label": "Users", "value": "1 million"}, {"label": "Teams", "value": "90"}]
        self.assertIn("value changed", self.check(key_numbers=numbers))

    def test_korean_unit_conversion_is_allowed(self):
        self.assertIsNone(self.check(key_numbers=[{"label": "Users", "value": "1 million"}, {"label": "Teams", "value": "9 teams"}]))


class TargetTest(unittest.TestCase):
    def test_missing_translation_is_a_target(self):
        self.assertTrue(ta.needs_translation({**ROW, "translated_hash": None}))

    def test_up_to_date_translation_is_skipped(self):
        self.assertFalse(ta.needs_translation({**ROW, "translated_hash": ta.source_hash(ROW)}))

    def test_regenerated_article_is_translated_again(self):
        old = ta.source_hash(ROW)
        self.assertTrue(ta.needs_translation({**ROW, "analytical_deep_dive": "새 본문", "translated_hash": old}))


class StatementTest(unittest.TestCase):
    def test_source_urls_come_from_the_original_and_quotes_are_escaped(self):
        translated = good()
        translated["key_numbers"][0]["source_url"] = "https://evil.example"
        sql = ta.build_statement(ROW, "en", translated)
        self.assertIn("https://ex.com/a", sql)
        self.assertNotIn("evil.example", sql)
        self.assertIn("'a''1'", sql)
        self.assertIn("🔎 In-depth report", sql)
        self.assertIn('"#AIAgents"', sql)

    def test_unknown_report_type_stays_null(self):
        self.assertIn("'en', 'GPT-5.5 released', NULL,", ta.build_statement({**ROW, "report_type": "새 유형"}, "en", good()))


class RequestTest(unittest.TestCase):
    CONFIG = SimpleNamespace(model="m1", fallback_model="m2", litellm_url="http://x", litellm_key="k")

    @staticmethod
    def opener(replies, seen):
        def _open(req, timeout):
            seen.append(json.loads(req.data)["model"])
            return io.BytesIO(json.dumps({"choices": [replies.pop(0)]}).encode())
        return _open

    def test_falls_back_when_first_model_is_truncated(self):
        seen = []
        replies = [{"finish_reason": "length", "message": {"content": "{"}},
                   {"finish_reason": "stop", "message": {"content": json.dumps(ta.to_wire(good()))}}]
        out = ta.request_translation(ta.build_payload(ROW), "en", self.CONFIG, self.opener(replies, seen))
        self.assertEqual(out["analytical_deep_dive"], good()["analytical_deep_dive"])
        self.assertEqual(seen, ["m1", "m2"])

    def test_prompt_avoids_key_names_the_gateway_masks(self):
        prompt = ta.build_prompt(ta.build_payload(ROW), "en")
        for name in ta.WIRE_KEYS:
            self.assertNotIn(name, prompt)

    def test_invalid_translation_from_every_model_returns_none(self):
        bad = {"finish_reason": "stop", "message": {"content": json.dumps(ta.to_wire({**good(), "title": "한국어 제목"}))}}
        self.assertIsNone(ta.request_translation(ta.build_payload(ROW), "en", self.CONFIG, self.opener([bad, dict(bad)], [])))

    def test_same_model_twice_is_called_once(self):
        seen = []
        config = SimpleNamespace(model="m1", fallback_model="m1", litellm_url="http://x", litellm_key="k")
        bad = {"finish_reason": "stop", "message": {"content": "{}"}}
        ta.request_translation(ta.build_payload(ROW), "en", config, self.opener([bad], seen))
        self.assertEqual(seen, ["m1"])


if __name__ == "__main__":
    unittest.main()
