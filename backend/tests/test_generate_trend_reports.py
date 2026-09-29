import io
import json
import sys
import unittest
from contextlib import redirect_stdout
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch


sys.path.insert(0, str(Path(__file__).parents[1] / "scripts"))

from generate_trend_reports import build_prompt, cluster_articles, load_catalog_names
from generate_trend_reports import find_mentioned_models
from generate_trend_reports import (
    build_insert_sql,
    call_llm,
    extract_image,
    load_config,
    pick_image,
    write_report,
)
from generate_trend_reports import (
    BatchConfig,
    BatchSummary,
    exit_code_for,
    run_batch,
)


class ConfigTests(unittest.TestCase):
    def test_missing_litellm_key_fails_before_work_starts(self):
        with self.assertRaisesRegex(RuntimeError, "LITELLM_API_KEY"):
            load_config({})

    def test_environment_builds_config(self):
        config = load_config({"LITELLM_API_KEY": "test-key"})

        self.assertEqual(config.litellm_key, "test-key")
        self.assertEqual(config.model, "gemini/gemini-3.7-flash")
        self.assertEqual(config.fallback_model, "openai/gpt-4o-mini")
        self.assertEqual(config.litellm_url, "https://ai-gateway.azclab.com/v1")


class LlmClientTests(unittest.TestCase):
    @staticmethod
    def response_for(report):
        class Response:
            def __enter__(self):
                return self

            def __exit__(self, *_args):
                return False

            def read(self):
                content = json.dumps(report)
                return json.dumps(
                    {"choices": [{"message": {"content": content}}]}
                ).encode()

        return Response()

    def test_requests_strict_trend_report_schema_with_bounded_output(self):
        captured = {}

        class Response:
            def __enter__(self):
                return self

            def __exit__(self, *_args):
                return False

            def read(self):
                content = json.dumps(
                    {
                        "title": "제목",
                        "primary_topic": "에이전트",
                        "tldr": "요약입니다.",
                        "blog_body": "본문입니다.",
                        "developer_tip": "개발자 팁입니다.",
                        "pm_tip": "PM 팁입니다.",
                        "business_tip": "비즈니스 팁입니다.",
                        "tags": ["#AI"],
                        "impact_score": 90,
                    }
                )
                return json.dumps(
                    {"choices": [{"message": {"content": content}}]}
                ).encode()

        def fake_urlopen(request, timeout):
            captured["payload"] = json.loads(request.data)
            captured["timeout"] = timeout
            return Response()

        config = BatchConfig("https://gateway.test/v1", "test-key", "personal-main")
        with patch("generate_trend_reports.urllib.request.urlopen", fake_urlopen):
            report = call_llm("prompt", config)

        payload = captured["payload"]
        response_format = payload["response_format"]
        schema = response_format["json_schema"]["schema"]
        self.assertEqual(payload["max_tokens"], 12000)
        self.assertEqual(response_format["type"], "json_schema")
        self.assertTrue(response_format["json_schema"]["strict"])
        self.assertEqual(
            set(schema["required"]),
            {
                "title",
                "primary_topic",
                "tldr",
                "blog_body",
                "developer_tip",
                "pm_tip",
                "business_tip",
                "tags",
                "impact_score",
                "key_numbers",
                "our_take",
                "open_questions",
            },
        )
        self.assertFalse(schema["additionalProperties"])
        self.assertEqual(report["primary_topic"], "에이전트")

    def test_falls_back_to_qwen_with_json_mode_after_primary_timeout(self):
        payloads = []

        def fake_urlopen(request, timeout):
            payload = json.loads(request.data)
            payloads.append(payload)
            if len(payloads) == 1:
                raise TimeoutError("primary timed out")
            return self.response_for(valid_generated_report())

        config = BatchConfig(
            "https://gateway.test/v1",
            "test-key",
            "gemini/gemini-3.7-flash",
            "groq/qwen/qwen3.6-27b",
        )
        with patch("generate_trend_reports.urllib.request.urlopen", fake_urlopen):
            report = call_llm("prompt", config)

        self.assertEqual(
            [payload["model"] for payload in payloads],
            ["gemini/gemini-3.7-flash", "groq/qwen/qwen3.6-27b"],
        )
        self.assertEqual(payloads[0]["response_format"]["type"], "json_schema")
        self.assertEqual(payloads[1]["response_format"], {"type": "json_object"})
        self.assertEqual(payloads[1]["reasoning_effort"], "none")
        self.assertEqual(report["primary_topic"], "AI 에이전트")

    def test_retries_qwen_once_when_required_fields_are_missing(self):
        calls = []
        incomplete = valid_generated_report()
        incomplete.pop("primary_topic")

        def fake_urlopen(request, timeout):
            calls.append(json.loads(request.data)["model"])
            if len(calls) == 1:
                raise TimeoutError("primary timed out")
            if len(calls) == 2:
                return self.response_for(incomplete)
            return self.response_for(valid_generated_report())

        config = BatchConfig(
            "https://gateway.test/v1",
            "test-key",
            "gemini/gemini-3.7-flash",
            "groq/qwen/qwen3.6-27b",
        )
        with patch("generate_trend_reports.urllib.request.urlopen", fake_urlopen):
            report = call_llm("prompt", config)

        self.assertEqual(calls, [
            "gemini/gemini-3.7-flash",
            "groq/qwen/qwen3.6-27b",
            "groq/qwen/qwen3.6-27b",
        ])
        self.assertEqual(report["primary_topic"], "AI 에이전트")

    def test_records_which_model_wrote_the_report(self):
        # 폴백이 한 달 넘게 죽어 있어도 몰랐던 이유 — 어느 모델이 썼는지 어디에도 없었다.
        calls = []

        def fake_urlopen(request, timeout):
            calls.append((json.loads(request.data), timeout))
            if len(calls) == 1:
                raise TimeoutError("primary timed out")
            return self.response_for(valid_generated_report())

        config = BatchConfig("https://gateway.test/v1", "test-key",
                             "gemini/gemini-3.7-flash", "cf-gpt-oss-120b")
        with patch("generate_trend_reports.urllib.request.urlopen", fake_urlopen):
            report = call_llm("prompt", config)

        self.assertEqual(report["_model"], "cf-gpt-oss-120b")
        # 폴백은 Cloudflare 대기열 때문에 느리다. 1순위와 같은 60초로 끊으면 안 된다.
        self.assertEqual(calls[0][1], 60)
        self.assertGreater(calls[1][1], 60)
        # gpt-oss 는 추론형이라 기본 강도에서 124초가 걸렸다.
        self.assertEqual(calls[1][0]["reasoning_effort"], "low")
        self.assertNotIn("reasoning_effort", calls[0][0])

    def test_primary_success_is_recorded_too(self):
        def fake_urlopen(request, timeout):
            return self.response_for(valid_generated_report())

        config = BatchConfig("https://gateway.test/v1", "test-key",
                             "gemini/gemini-3.7-flash", "cf-gpt-oss-120b")
        with patch("generate_trend_reports.urllib.request.urlopen", fake_urlopen):
            report = call_llm("prompt", config)
        self.assertEqual(report["_model"], "gemini/gemini-3.7-flash")

    def test_normalizes_qwen_alias_fields_before_validation(self):
        calls = []
        qwen_report = valid_generated_report()
        qwen_report["theme"] = qwen_report.pop("primary_topic")
        qwen_report["dev_tip"] = qwen_report.pop("developer_tip")
        qwen_report["biz_tip"] = qwen_report.pop("business_tip")
        qwen_report["confidence"] = qwen_report.pop("impact_score")

        def fake_urlopen(request, timeout):
            calls.append(json.loads(request.data)["model"])
            if len(calls) == 1:
                raise TimeoutError("primary timed out")
            return self.response_for(qwen_report)

        config = BatchConfig(
            "https://gateway.test/v1",
            "test-key",
            "gemini/gemini-3.7-flash",
            "groq/qwen/qwen3.6-27b",
        )
        with patch("generate_trend_reports.urllib.request.urlopen", fake_urlopen):
            report = call_llm("prompt", config)

        self.assertEqual(len(calls), 2)
        self.assertEqual(report["primary_topic"], "AI 에이전트")
        self.assertEqual(report["developer_tip"], "도입 전 부하 테스트를 수행합니다.")
        self.assertEqual(report["business_tip"], "운영 비용과 품질을 함께 측정합니다.")
        self.assertEqual(report["impact_score"], 90)
        self.assertNotIn("theme", report)


class D1WriterTests(unittest.TestCase):
    def test_build_insert_sql_escapes_quotes_and_uses_persisted_fields(self):
        report = {
            "title": "모델의 '새 기능'",
            "primary_topic": "추론",
            "tldr": "기업의 '선택'입니다.",
            "blog_body": "한국어 AI 분석 본문 " * 100,
            "tags": ["#AI"],
            "impact_score": 92,
        }

        sql = build_insert_sql(
            report,
            [
                {
                    "source": "OpenAI",
                    "link": "https://example.com/a",
                }
            ],
            "synth-test",
        )

        self.assertIn("모델의 ''새 기능''", sql)
        self.assertIn("기업의 ''선택''입니다", sql)
        self.assertNotIn("primary_topic", sql)
        self.assertNotIn("impact_score", sql)

    def test_write_report_returns_false_without_leaking_stderr(self):
        class Result:
            returncode = 1
            stderr = "Authorization: Bearer secret-value"

        calls = []

        def runner(args, **kwargs):
            calls.append((args, kwargs))
            return Result()

        output = io.StringIO()
        with redirect_stdout(output):
            result = write_report("INSERT INTO trend_news VALUES ('x')", runner)

        self.assertFalse(result)
        self.assertNotIn("secret-value", output.getvalue())
        self.assertIn("report write failed", output.getvalue())
        self.assertEqual(calls[0][0][0:4], ["npx", "wrangler", "d1", "execute"])


def valid_generated_report():
    return {
        "title": "AI 에이전트 비용 최적화",
        "primary_topic": "AI 에이전트",
        "tldr": "새 추론 모델은 운영 비용을 낮춥니다. 실제 도입 전 품질 측정이 필요합니다.",
        "blog_body": "## 분석\n" + "AI 모델과 에이전트 추론 비용을 한국어로 상세히 분석합니다. " * 40,
        "developer_tip": "도입 전 부하 테스트를 수행합니다.",
        "pm_tip": "품질 지표를 제품 요구사항에 포함합니다.",
        "business_tip": "운영 비용과 품질을 함께 측정합니다.",
        "tags": ["#AI", "#에이전트"],
        "impact_score": 90,
    }


class OrchestratorTests(unittest.TestCase):
    def test_continues_after_llm_failure_and_saves_next_report(self):
        articles_by_feed = {
            "agent-feed": [
                {
                    "title": "AI agent model released",
                    "link": "https://example.com/agent",
                    "summary": "LLM agent inference",
                    "source": "example.com",
                }
            ],
            "research-feed": [
                {
                    "title": "GPU benchmark for AI",
                    "link": "https://example.org/gpu",
                    "summary": "AI model benchmark",
                    "source": "example.org",
                }
            ],
        }
        generated = iter([RuntimeError("gateway failed"), valid_generated_report()])
        written_sql = []

        def generator(_prompt, _config):
            value = next(generated)
            if isinstance(value, Exception):
                raise value
            return value

        summary = run_batch(
            BatchConfig("https://gateway.test/v1", "test", "model"),
            fetcher=lambda feed: articles_by_feed[feed],
            generator=generator,
            writer=lambda sql: written_sql.append(sql) is None,
            feeds=("agent-feed", "research-feed"),
            # 원문 스크래핑이 테스트에서 실제 네트워크를 타지 않게 한다
            body_attacher=lambda arts: [dict(a, body="본문 " * 200) for a in arts],
            catalog_loader=lambda: [("gpt-4o", "GPT-4o")],
        )

        self.assertEqual(summary.saved, 1)
        self.assertEqual(summary.failed, 1)
        self.assertEqual(summary.reasons["llm_failure"], 1)
        self.assertEqual(len(written_sql), 1)

    def test_rejects_invalid_sources_before_generation(self):
        generator_calls = []

        summary = run_batch(
            BatchConfig("https://gateway.test/v1", "test", "model"),
            fetcher=lambda _feed: [
                {
                    "title": "등산로 개방",
                    "link": "https://example.com/hike",
                    "summary": "주말 산행 안내",
                    "source": "example.com",
                }
            ],
            generator=lambda prompt, config: generator_calls.append((prompt, config)),
            writer=lambda _sql: True,
            feeds=("one-feed",),
            body_attacher=lambda arts: [dict(a, body="본문 " * 200) for a in arts],
            catalog_loader=lambda: [("gpt-4o", "GPT-4o")],
        )

        self.assertEqual(summary.saved, 0)
        self.assertEqual(summary.source_rejected, 1)
        self.assertEqual(summary.reasons["irrelevant_source"], 1)
        self.assertEqual(generator_calls, [])

    def test_extract_image_reads_every_supported_rss_shape(self):
        cases = [
            ('<media:content url="https://a.test/x.jpg"/>', "https://a.test/x.jpg"),
            ('<media:thumbnail url="https://b.test/y.png" />', "https://b.test/y.png"),
            ('<enclosure url="https://c.test/z.jpg" type="image/jpeg"/>', "https://c.test/z.jpg"),
            ('<description><img src="https://d.test/w.jpg?a=1&amp;b=2"></description>',
             "https://d.test/w.jpg?a=1&b=2"),
        ]
        for xml, expected in cases:
            with self.subTest(xml=xml):
                self.assertEqual(extract_image(xml), expected)

    def test_extract_image_rejects_missing_and_unusable(self):
        self.assertIsNone(extract_image("<title>no image</title>"))
        self.assertIsNone(extract_image('<img src="https://e.test/icon.svg">'))
        self.assertIsNone(extract_image('<img src="/relative/path.jpg">'))

    def test_pick_image_takes_first_available_in_cluster(self):
        self.assertEqual(
            pick_image([{"image": None}, {"image": "https://x.test/y.jpg"}]),
            "https://x.test/y.jpg",
        )
        self.assertIsNone(pick_image([{"image": None}, {}]))

    def test_insert_sql_carries_image_or_null(self):
        report = {"title": "t", "tldr": "s", "blog_body": "b"}
        cluster = [{"source": "a.test", "link": "https://a.test/1", "image": "https://a.test/p.jpg"}]
        self.assertIn("'https://a.test/p.jpg'", build_insert_sql(report, cluster, "id-1"))
        self.assertIn("image_url", build_insert_sql(report, cluster, "id-1"))
        bare = [{"source": "a.test", "link": "https://a.test/1"}]
        # 이미지가 없으면 NULL 이 들어가고, 그 뒤로 사실/의견 컬럼이 이어진다
        self.assertIn("NULL,", build_insert_sql(report, bare, "id-2"))

    def test_insert_sql_drops_numbers_without_a_source_in_this_cluster(self):
        """출처 URL 을 못 대는 수치는 저장하지 않는다 — 프롬프트 지시만으로는 안 지켜진다."""
        cluster = [{"source": "a.test", "link": "https://a.test/1"}]
        report = {
            "title": "t", "tldr": "s", "blog_body": "b",
            "key_numbers": [
                {"label": "정상", "value": "57점", "source_url": "https://a.test/1"},
                {"label": "출처없음", "value": "80%", "source_url": ""},
                {"label": "남의출처", "value": "3배", "source_url": "https://other.test/9"},
            ],
            "our_take": "의견",
            "open_questions": ["확인되지 않은 것", ""],
        }
        sql = build_insert_sql(report, cluster, "id-3")
        self.assertIn("정상", sql)
        self.assertNotIn("출처없음", sql)
        self.assertNotIn("남의출처", sql)
        self.assertIn("의견", sql)
        self.assertIn("확인되지 않은 것", sql)

    def test_exit_code_is_nonzero_when_nothing_saved(self):
        self.assertEqual(exit_code_for(BatchSummary(saved=0, failed=1)), 1)
        self.assertEqual(exit_code_for(BatchSummary(saved=1, failed=3)), 0)


class CatalogAliasTest(unittest.TestCase):
    """카탈로그 이름은 접두어·접미사를 달고 있지만 기사는 맨이름만 쓴다."""

    def _load(self, names):
        rows = [{"id": f"id-{i}", "name": n} for i, n in enumerate(names)]
        payload = json.dumps([{"results": rows}])

        def runner(*_a, **_k):
            return SimpleNamespace(stdout=f"prefix noise {payload}")

        return load_catalog_names(runner=runner)

    def test_strips_provider_prefix_and_paren_suffix(self):
        catalog = self._load(["Google: Gemini 3.5 Flash (batch)"])
        names = {n for _, n in catalog}
        self.assertIn("Gemini 3.5 Flash", names)

    def test_article_wording_matches_decorated_catalog_name(self):
        catalog = self._load(["Google: Gemini 3.5 Flash (batch)", "Anthropic: Claude Opus 4.5"])
        found = find_mentioned_models(
            "Gemini 3.5 Flash 와 Claude Opus 4.5 를 비교했다", catalog
        )
        self.assertEqual(len(found), 2)

    def test_alias_defers_to_existing_canonical_row(self):
        catalog = self._load(["Gemini 2.5 Pro", "Google: Gemini 2.5 Pro (batch)"])
        found = find_mentioned_models("Gemini 2.5 Pro 성능", catalog)
        self.assertEqual(found, ["id-0"])

    def test_bare_generic_word_is_not_a_model_mention(self):
        catalog = self._load(["Fusion", "Uncensored"])
        self.assertEqual(catalog, [])


class ClusteringTest(unittest.TestCase):
    """고정 키워드 버킷 대신 어휘 겹침으로 사건 단위를 묶는다."""

    @staticmethod
    def _art(title, summary=""):
        return {"title": title, "summary": summary, "source": "s", "link": "l"}

    def _titles(self, clusters):
        return [sorted(a["title"] for a in c) for c in clusters]

    def test_same_event_from_different_outlets_groups_together(self):
        articles = [
            self._art("Nvidia buys Hugging Face, the GitHub of AI, for $13 billion"),
            self._art("NVIDIA to Acquire Hugging Face"),
            self._art("Making sourdough bread at home with a cast iron pot"),
        ]
        clusters = cluster_articles(articles)
        biggest = max(clusters, key=len)
        self.assertEqual(len(biggest), 2)
        self.assertTrue(all("Hugging Face" in a["title"] for a in biggest))

    def test_unrelated_articles_stay_apart(self):
        articles = [
            self._art("Nvidia buys Hugging Face for $13 billion"),
            self._art("Making sourdough bread at home with a cast iron pot"),
        ]
        self.assertEqual([len(c) for c in cluster_articles(articles)], [1, 1])

    def test_newsletter_issues_do_not_merge_on_shared_boilerplate(self):
        # 회차마다 내용은 다르지만 접두어와 상용구가 같다. 이걸 걷어내지 않으면
        # 무관한 회차들이 한 "종합 리포트" 로 묶인다.
        boilerplate = "Welcome to Import AI, a newsletter about AI research. Import AI runs on arXiv."
        articles = [
            self._art("Import AI 471: Why Hugging Face worries me", boilerplate),
            self._art("Import AI 470: No rights for machines", boilerplate),
            self._art("Import AI 469: Science AI and RSI simulator", boilerplate),
        ]
        self.assertEqual([len(c) for c in cluster_articles(articles)], [1, 1, 1])

    def test_label_matches_cluster_size(self):
        report = {"tldr": "요약", "blog_body": "본문", "title": "제목"}
        one = build_insert_sql(report, [self._art("A")], "id-1")
        two = build_insert_sql(report, [self._art("A"), self._art("B")], "id-2")
        self.assertIn("심층 리포트", one)
        self.assertNotIn("종합 트렌드 리포트", one)
        self.assertIn("종합 트렌드 리포트", two)

    def test_empty_primary_response_falls_back(self):
        # 주 모델이 빈 응답을 주면 JSON 파싱이 깨진다. 폴백은 바로 이때 쓰라고 있다.
        import generate_trend_reports as gtr
        from trend_report_validation import REQUIRED_REPORT_FIELDS
        calls = []

        def fake(prompt, config, model, **_):
            calls.append(model)
            if model == config.model:
                raise json.JSONDecodeError("Expecting value", "", 0)
            return {f: "값" for f in REQUIRED_REPORT_FIELDS}

        config = gtr.BatchConfig(litellm_url="u", litellm_key="k",
                                 model="primary", fallback_model="backup")
        with patch.object(gtr, "_request_llm", fake):
            gtr.call_llm("prompt", config)
        self.assertEqual(calls, ["primary", "backup"])

    def test_content_filter_raises_a_named_error(self):
        import generate_trend_reports as gtr
        blocked = {"choices": [{"finish_reason": "content_filter",
                                "message": {"content": "Content blocked: execution request detected"}}]}

        class FakeResponse(io.BytesIO):
            def __enter__(self): return self
            def __exit__(self, *a): return False

        config = gtr.BatchConfig(litellm_url="https://gw.test/v1", litellm_key="k", model="m")
        with patch.object(gtr.urllib.request, "urlopen",
                          lambda *a, **k: FakeResponse(json.dumps(blocked).encode())):
            with self.assertRaises(gtr.ContentFiltered):
                gtr._request_llm("p", config, "m")

    def test_only_the_blocked_article_is_dropped(self):
        import generate_trend_reports as gtr
        cluster = [self._art("Nvidia buys Hugging Face"), self._art("NVIDIA to Acquire Hugging Face")]
        kept = gtr.drop_filtered_articles(
            cluster, None, checker=lambda a, _c: a["title"].startswith("Nvidia buys"))
        self.assertEqual([a["title"] for a in kept], ["NVIDIA to Acquire Hugging Face"])

    def test_empty_input_yields_no_clusters(self):
        self.assertEqual(cluster_articles([]), [])

    def test_single_article_prompt_does_not_ask_for_a_synthesis(self):
        prompt = build_prompt([self._art("Nvidia buys Hugging Face")])
        self.assertNotIn("종합 분석", prompt)
        self.assertIn("1건", prompt)


if __name__ == "__main__":
    unittest.main()
