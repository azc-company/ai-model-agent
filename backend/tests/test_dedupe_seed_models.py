import importlib.util
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "backend/scripts"))
spec = importlib.util.spec_from_file_location("dd", ROOT / "backend/scripts/dedupe_seed_models.py")
dd = importlib.util.module_from_spec(spec)
spec.loader.exec_module(dd)


def r(id_, name, source, deprecated=0):
    return {"id": id_, "name": name, "source": source, "is_deprecated": deprecated}


class PairTest(unittest.TestCase):
    def test_seed_row_maps_to_its_synced_twin(self):
        pairs, _ = dd.pair_seed_to_feed([r("claude-opus-5", "Claude Opus 5", "seed"),
                                         r("anthropic-claude-opus-5", "Claude Opus 5", "feed"),
                                         r("anthropic-claude-opus-5:batch", "Claude Opus 5 (batch)", "feed")])
        self.assertEqual(pairs, [("claude-opus-5", "anthropic-claude-opus-5")])   # 배치 채널로는 합치지 않는다

    def test_different_variant_words_are_never_merged(self):
        # 실측 오탐: Sonar Reasoning→Sonar, o1-preview→o1, Gemini 3.1 Pro→Gemini 3.1 Pro Preview
        pairs, skipped = dd.pair_seed_to_feed([
            r("perplexity-sonar-reasoning", "Sonar Reasoning", "seed"), r("perplexity-sonar", "Perplexity: Sonar", "feed"),
            r("o1-preview", "o1-preview", "seed"), r("openai-o1", "OpenAI: o1", "feed"),
            r("gemini-3.1-pro", "Gemini 3.1 Pro", "seed"), r("google-gemini-3.1-pro-preview", "Google: Gemini 3.1 Pro Preview", "feed"),
        ])
        self.assertEqual(pairs, [])
        self.assertEqual(len(skipped), 3)

    def test_base_model_wins_over_high_variant(self):
        pairs, _ = dd.pair_seed_to_feed([r("o4-mini", "o4-mini", "seed"),
                                         r("openai-o4-mini", "OpenAI: o4 Mini", "feed"),
                                         r("openai-o4-mini-high", "OpenAI: o4 Mini High", "feed")])
        self.assertEqual(pairs, [("o4-mini", "openai-o4-mini")])

    def test_dated_snapshots_stay_separate(self):
        pairs, _ = dd.pair_seed_to_feed([r("gpt-4o-2024-11-20", "GPT-4o (2024-11-20)", "seed"),
                                         r("openai-gpt-4o-2024-05-13", "OpenAI: GPT-4o (2024-05-13)", "feed")])
        self.assertEqual(pairs, [])

    def test_sql_only_touches_seed_rows_and_is_reversible(self):
        sql = dd.build_sql([("claude-opus-5", "anthropic-claude-opus-5")])[0]
        self.assertIn("is_deprecated = 1, superseded_by = 'anthropic-claude-opus-5'", sql)
        self.assertIn("AND source = 'seed'", sql)
        self.assertNotIn("DELETE", sql.upper())


if __name__ == "__main__":
    unittest.main()
