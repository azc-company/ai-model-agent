import importlib.util
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("sync", ROOT / "backend/scripts/sync_benchmarks.py")
sync = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sync)


def m(id_, name):
    return {"id": id_, "name": name}


class MatchTest(unittest.TestCase):
    ARENA = [("claude-fable-5.1-max", 1510, "2026-09-11"), ("claude-fable-5.1-high", 1502, "2026-09-11"),
             ("gpt-4o-2024-05-13", 1287, "2026-09-11"), ("ministral-8b-2410", 1180, "2026-09-11"),
             ("claude-opus-4-1-20250805", 1450, "2026-09-11")]

    def setUp(self):
        self.idx = sync.index(self.ARENA)

    def test_catalog_prefix_and_dots_match_arena_slug_and_best_effort_wins(self):
        hit = sync.match(m("anthropic-claude-fable-5.1", "Anthropic: Claude Fable 5.1"), self.idx)
        self.assertEqual(hit[:2], (1510, "claude-fable-5.1-max"))

    def test_undated_catalog_model_may_match_a_dated_arena_entry(self):
        hit = sync.match(m("claude-opus-4.1", "Claude Opus 4.1"), self.idx)
        self.assertEqual(hit[1], "claude-opus-4-1-20250805")

    def test_dated_catalog_model_never_borrows_another_snapshot(self):
        # 실측 오탐: GPT-4o (2024-11-20) 가 2024-05-13 점수를, Ministral 3 8B 2512 가 2410 점수를 가져왔다.
        self.assertIsNone(sync.match(m("openai-gpt-4o-2024-11-20", "OpenAI: GPT-4o (2024-11-20)"), self.idx))
        self.assertIsNone(sync.match(m("mistralai-ministral-8b-2512", "Mistral: Ministral 3 8B 2512"), self.idx))

    def test_batch_variant_shares_the_base_score(self):
        hit = sync.match(m("anthropic-claude-fable-5.1-batch", "Anthropic: Claude Fable 5.1 (batch)"), self.idx)
        self.assertEqual(hit[0], 1510)


class BuildTest(unittest.TestCase):
    def test_stale_seed_columns_are_cleared_and_unmatched_models_become_null(self):
        catalog = [m("anthropic-claude-fable-5.1", "Anthropic: Claude Fable 5.1"), m("obscure-x", "Obscure X")]
        stmts, rep = sync.build(catalog, [("claude-fable-5.1-max", 1510, "2026-09-11")],
                                [("claude-fable-5.1_max", 91.2, "2026-09-02")])
        self.assertEqual((rep["arena"], rep["gpqa"]), (1, 1))
        self.assertIn('"arena_elo": 1510', stmts[0])
        self.assertIn('"gpqa": 91.2', stmts[0])
        self.assertIn('"mmlu_pro": null', stmts[0])
        self.assertIn('"swe_bench": null', stmts[0])
        self.assertIn('"arena_elo": null', stmts[1])     # 시드 값을 남기지 않는다

    def test_gpqa_is_converted_to_percent(self):
        import io, zipfile
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w") as z:
            z.writestr("gpqa_diamond.csv", "Model version,mean_score,Best score (across scorers),Release date\n"
                                           "gpt-6-astra_max,0.95,0.9577,2026-09-01\n")
        self.assertEqual(sync.gpqa_rows(buf.getvalue()), [("gpt-6-astra_max", 95.8, "2026-09-01")])


if __name__ == "__main__":
    unittest.main()
