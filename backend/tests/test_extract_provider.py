"""공급사 이름이 하나로 모이는지 확인한다.

카탈로그에 "OpenAI"(126건) 와 "~openai"(6건) 가 따로 잡혀 있었다. OpenRouter 가
"항상 최신" 라우트에 붙이는 ~ 접두사를 떼지 않아 정규화 맵을 비껴간 탓이다.
맵에 없는 곳은 .capitalize() 로 떨어져 "Moonshotai", "Z-ai" 처럼 회사가 쓰지 않는
표기가 모델 페이지 제목과 공급사 필터에 그대로 나갔다.
"""
import importlib.util
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("batch", ROOT / "backend/scripts/model_d1_batch.py")
batch = importlib.util.module_from_spec(spec)
spec.loader.exec_module(batch)


class ExtractProviderTest(unittest.TestCase):
    def test_tilde_route_is_the_same_provider(self):
        for raw in ("openai/gpt-6", "~openai/gpt-astra-latest"):
            self.assertEqual(batch.extract_provider(raw), ("openai", "OpenAI"), raw)

    def test_known_providers_keep_their_own_spelling(self):
        cases = {
            "z-ai/glm-5.3": "Z.ai",
            "moonshotai/kimi-k2": "Moonshot AI",
            "inclusionai/ling-3.0": "inclusionAI",
            "bytedance-seed/seed-oss": "ByteDance Seed",
            "nex-agi/nex-n2.5-pro": "Nex AGI",
            "inference-net/schematron-v2": "Inference.net",
        }
        for raw, expected in cases.items():
            self.assertEqual(batch.extract_provider(raw)[1], expected, raw)

    def test_unknown_provider_still_gets_a_name(self):
        pid, pname = batch.extract_provider("someone-new/model-1")
        self.assertEqual(pid, "someone-new")
        self.assertTrue(pname)

    def test_id_without_a_slash_falls_back(self):
        self.assertEqual(batch.extract_provider("bare-model"), ("other", "Other"))


if __name__ == "__main__":
    unittest.main()
