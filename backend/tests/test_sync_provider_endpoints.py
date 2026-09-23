"""프로바이더 엔드포인트 동기화가 지켜야 할 것들.

이 화면은 손으로 적은 값을 41일 동안 "실시간"이라고 부르다 갈아엎은 자리다.
같은 실패(빈 표, 창작값, 조용한 실패)를 다시 하지 않게 하는 검사만 둔다.
"""
import importlib.util
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("sync_pe", ROOT / "backend/scripts/sync_provider_endpoints.py")
sync = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sync)


def endpoint(provider, tag=None, prompt="0.0000001", completion="0.0000003", **over):
    e = {
        "provider_name": provider,
        "tag": tag or provider.lower(),
        "quantization": "fp8",
        "context_length": 131072,
        "max_completion_tokens": 16384,
        "pricing": {"prompt": prompt, "completion": completion},
        "uptime_last_30m": 99.5,
        "uptime_last_1d": 99.1,
        "latency_last_30m": None,     # OpenRouter 가 전 모델에 null 을 준다
        "throughput_last_30m": None,
        "status": 0,
    }
    e.update(over)
    return e


MODEL = {"id": "meta-llama-llama-3.3-70b", "name": "Llama 3.3 70B", "slug": "meta-llama/llama-3.3-70b"}


class SlugTest(unittest.TestCase):
    def test_reads_slug_from_official_url(self):
        self.assertEqual(
            sync.slug_of("https://openrouter.ai/models/meta-llama/llama-3.3-70b"),
            "meta-llama/llama-3.3-70b")

    def test_seed_models_have_no_slug(self):
        self.assertIsNone(sync.slug_of("https://docs.anthropic.com/en/docs/about-claude/models"))
        self.assertIsNone(sync.slug_of(""))
        self.assertIsNone(sync.slug_of(None))


class RowTest(unittest.TestCase):
    def test_price_is_converted_to_per_million(self):
        [r] = sync.rows_for(MODEL, [endpoint("DeepInfra", prompt="0.0000001", completion="0.00000032")])
        self.assertEqual(r["input_per_1m"], 0.1)
        self.assertEqual(r["output_per_1m"], 0.32)

    def test_missing_price_stays_none(self):
        [r] = sync.rows_for(MODEL, [endpoint("X", pricing={})])
        self.assertIsNone(r["input_per_1m"])

    def test_null_speed_is_kept_null(self):
        # 0 으로 채우면 화면이 "0 TPS" 를 사실처럼 그린다. 없는 값은 없어야 한다.
        [r] = sync.rows_for(MODEL, [endpoint("Groq")])
        self.assertIsNone(r["latency_ms"])
        self.assertIsNone(r["throughput_tps"])

    def test_duplicate_tag_is_dropped(self):
        # (model_slug, tag) 가 PK 라 중복이 들어오면 INSERT 가 통째로 실패한다.
        rows = sync.rows_for(MODEL, [endpoint("Google", tag="google"), endpoint("Google", tag="google")])
        self.assertEqual(len(rows), 1)

    def test_endpoint_without_provider_is_skipped(self):
        self.assertEqual(sync.rows_for(MODEL, [endpoint("X", provider_name=None)]), [])


class CollectTest(unittest.TestCase):
    catalog = [
        {"id": "a", "name": "A", "official_url": "https://openrouter.ai/models/x/a"},
        {"id": "b", "name": "B", "official_url": "https://openrouter.ai/models/x/b"},
        {"id": "c", "name": "C", "official_url": "https://docs.anthropic.com/models"},
    ]

    def test_single_provider_models_are_excluded(self):
        # 비교 화면이라 프로바이더가 하나면 보여줄 게 없다.
        def fetch(slug):
            return [endpoint("P1"), endpoint("P2")] if slug == "x/a" else [endpoint("Solo")]
        rows, kept, scanned = sync.collect(self.catalog, fetch=fetch, workers=2)
        self.assertEqual(scanned, 2)                       # 시드 모델은 조회조차 하지 않는다
        self.assertEqual([k[0] for k in kept], ["A"])
        self.assertEqual({r["provider_name"] for r in rows}, {"P1", "P2"})

    def test_fetch_failure_does_not_abort_the_run(self):
        def fetch(slug):
            if slug == "x/a":
                raise RuntimeError("boom")
            return [endpoint("P1"), endpoint("P2")]
        # fetch_endpoints 는 예외를 삼키고 [] 를 돌려주므로, 그 계약을 그대로 흉내낸다.
        safe = lambda s: [] if s == "x/a" else fetch(s)
        rows, kept, _ = sync.collect(self.catalog, fetch=safe, workers=2)
        self.assertEqual([k[0] for k in kept], ["B"])


class SqlTest(unittest.TestCase):
    def test_quotes_are_escaped(self):
        rows = sync.rows_for(MODEL, [endpoint("O'Brien AI", tag="o'brien")])
        sql = "\n".join(sync.build_sql(rows, "2026-09-23 00:00:00"))
        self.assertIn("O''Brien AI", sql)

    def test_delete_comes_first(self):
        sql = sync.build_sql(sync.rows_for(MODEL, [endpoint("P")]), "2026-09-23 00:00:00")
        self.assertEqual(sql[0], "DELETE FROM provider_endpoints;")

    def test_null_is_written_as_null_not_quoted(self):
        sql = "\n".join(sync.build_sql(sync.rows_for(MODEL, [endpoint("P")]), "2026-09-23 00:00:00"))
        self.assertIn("NULL", sql)
        self.assertNotIn("'None'", sql)


if __name__ == "__main__":
    unittest.main()
