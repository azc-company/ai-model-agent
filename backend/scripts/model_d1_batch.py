#!/usr/bin/env python3
"""
D1 모델 카탈로그 배치 갱신 스크립트 (model_d1_batch.py)

OpenRouter API를 통해 최신 LLM 모델 정보를 수집하여
Cloudflare D1 `models` 테이블에 직접 UPSERT합니다.
기존 580개 폴백 모델은 보존하고, 신규 모델 추가 및 가격/스펙 갱신을 수행합니다.

CLI 옵션:
  --dry-run   : SQL 파일만 생성하고 wrangler 실행은 건너뜀

실행 방법:
  python3 backend/scripts/model_d1_batch.py
  python3 backend/scripts/model_d1_batch.py --dry-run
"""

import os
import re
import sys
import json
import time
import argparse
import subprocess
import urllib.request
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
D1_DB_NAME = "llm-compass-db"
SQL_OUTPUT_PATH = os.path.join(REPO_ROOT, "seed_models_batch.sql")
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/models"

# ─────────────────────────────────────────────────────────
# 1. OpenRouter API 수집
# ─────────────────────────────────────────────────────────


# 동기화 때 덮어쓸 컬럼. 여기 없는 컬럼은 보존된다.
#   first_seen_at   — 최초 발견일. "신규 모델" 판정의 유일한 근거라 절대 덮어쓰지 않는다.
#   is_new          — 더 이상 쓰지 않는다(Worker 가 first_seen_at 으로 계산). 건드리지 않는다.
#   description_i18n— 설명이 바뀐 경우에만 비워 번역 배치가 다시 채우게 한다.
_UPSERT_COLUMNS = (
    "provider_id", "provider_name", "name", "tier", "is_open_weight", "license_type",
    "parameter_count_b", "architecture", "context_window", "max_output_tokens", "modality",
    "description", "official_url", "source_docs_url", "api_pricing", "quota", "benchmarks",
    "is_verified", "litellm_id", "supports_reasoning", "supports_web_search", "is_deprecated",
    "hardware_requirements", "source",
)
UPSERT_SET = ",\n  ".join(
    ["description_i18n = CASE WHEN models.description IS excluded.description "
     "THEN models.description_i18n ELSE NULL END"]
    + [f"{c} = excluded.{c}" for c in _UPSERT_COLUMNS]
    + ["updated_at = CURRENT_TIMESTAMP"]
)

def fetch_openrouter_models() -> List[Dict]:
    """OpenRouter API에서 최신 LLM 모델 목록 수집"""
    print("📡 OpenRouter API 수집 중...")
    try:
        req = urllib.request.Request(
            OPENROUTER_API_URL,
            headers={"User-Agent": "LLM-Compass/3.0", "Accept": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            if resp.status == 200:
                data = json.loads(resp.read().decode("utf-8"))
                models = data.get("data", [])
                print(f"  ✅ OpenRouter API: {len(models)}개 모델 수신")
                return models
    except Exception as e:
        print(f"  ❌ OpenRouter API 오류: {e}")
    return []


# ─────────────────────────────────────────────────────────
# 2. 모델 데이터 변환
# ─────────────────────────────────────────────────────────

def classify_tier(context_len: int, prompt_price: float) -> str:
    """컨텍스트 길이 및 가격 기반 티어 분류"""
    if context_len >= 200000 or prompt_price >= 5.0:
        return "Frontier"
    elif context_len >= 64000 or prompt_price >= 1.0:
        return "Mid"
    elif context_len >= 16000 or prompt_price >= 0.2:
        return "Small"
    return "Micro"


def is_open_weight(model_id: str, name: str) -> bool:
    """모델 ID/이름 기반 오픈웨이트 여부 판별"""
    combined = (model_id + " " + name).lower()
    open_kws = ["llama", "mistral", "qwen", "deepseek", "gemma", "phi", "yi", "falcon",
                "bloom", "mpt", "solar", "openchat", "dolphin", "mixtral", "nous",
                "codellama", "starcoder", "wizardlm", "open-", "free"]
    return any(kw in combined for kw in open_kws)


def extract_provider(raw_id: str) -> tuple:
    """모델 ID에서 provider_id, provider_name 추출"""
    parts = raw_id.split("/")
    if len(parts) > 1:
        pid = parts[0].lower()
        pname = parts[0].capitalize()
    else:
        pid = "other"
        pname = "Other"

    # 주요 프로바이더 이름 정규화
    provider_map = {
        "openai": "OpenAI",
        "anthropic": "Anthropic",
        "google": "Google",
        "meta-llama": "Meta",
        "mistralai": "Mistral AI",
        "deepseek": "DeepSeek",
        "qwen": "Alibaba Qwen",
        "microsoft": "Microsoft",
        "cohere": "Cohere",
        "nvidia": "NVIDIA",
        "x-ai": "xAI",
        "amazon": "Amazon",
        "perplexity": "Perplexity",
        "together": "Together AI",
    }
    pname = provider_map.get(pid, pname)
    return pid, pname


def escape_sql(s: str) -> str:
    """SQL 단일 인용부호 이스케이프"""
    if not s:
        return ""
    return str(s).replace("'", "''")


def convert_model_to_sql(ext: Dict) -> Optional[str]:
    """OpenRouter 모델 데이터를 D1 UPSERT SQL로 변환"""
    raw_id = ext.get("id", "")
    if not raw_id:
        return None

    sanitized_id = raw_id.replace("/", "-").lower()
    pid, pname = extract_provider(raw_id)
    name = ext.get("name") or raw_id
    description = ext.get("description") or f"{name} - LLM 모델"
    if len(description) > 500:
        description = description[:497] + "..."

    pricing = ext.get("pricing", {})
    # OpenRouter 가격: per token → per 1M token으로 환산
    raw_prompt = pricing.get("prompt", "0")
    raw_completion = pricing.get("completion", "0")
    try:
        prompt_price = float(raw_prompt) * 1_000_000
        completion_price = float(raw_completion) * 1_000_000
    except (ValueError, TypeError):
        prompt_price = 0.0
        completion_price = 0.0

    context_window = ext.get("context_length") or 128000
    try:
        context_window = int(context_window)
    except (ValueError, TypeError):
        context_window = 128000

    tier = classify_tier(context_window, prompt_price)
    open_weight = is_open_weight(raw_id, name)
    license_type = "Open-Weights" if open_weight else "Proprietary"

    top_prov = ext.get("top_provider", {})
    max_out = 16384
    if isinstance(top_prov, dict):
        max_out = top_prov.get("max_completion_tokens") or 16384

    modality = ["text"]
    if "image" in str(ext).lower() or "vision" in name.lower():
        modality = ["text", "vision"]
    if "audio" in str(ext).lower():
        modality.append("audio")

    supports_reasoning = 1 if any(k in (raw_id + name).lower() for k in ["o1", "o3", "thinking", "reason", "r1", "deepseek-r"]) else 0

    api_pricing = {
        "input_price_per_1m": round(prompt_price, 4),
        "output_price_per_1m": round(completion_price, 4),
        "currency": "USD"
    }

    # INSERT OR REPLACE 는 충돌 시 행을 지우고 다시 넣는다. 그래서 컬럼 목록에 없는
    # description_i18n 이 매주 NULL 로 날아가고(번역 배치가 430건을 다시 번역했다),
    # 최초 발견일도 남길 방법이 없었다. ON CONFLICT 로 필요한 컬럼만 갱신한다.
    sql = f"""INSERT INTO models (
  id, provider_id, provider_name, name, tier, is_open_weight, license_type,
  parameter_count_b, architecture, context_window, max_output_tokens, modality,
  description, official_url, source_docs_url, api_pricing, quota, benchmarks,
  is_verified, litellm_id, supports_reasoning, supports_web_search, is_deprecated, is_new, hardware_requirements,
  source, first_seen_at
) VALUES (
  '{escape_sql(sanitized_id)}',
  '{escape_sql(pid)}',
  '{escape_sql(pname)}',
  '{escape_sql(name)}',
  '{tier}',
  {1 if open_weight else 0},
  '{license_type}',
  0,
  'Dense',
  {context_window},
  {max_out},
  '{escape_sql(json.dumps(modality, ensure_ascii=False))}',
  '{escape_sql(description)}',
  '{escape_sql(f"https://openrouter.ai/models/{raw_id}")}',
  '{escape_sql(f"https://openrouter.ai/playground?model={raw_id}")}',
  '{escape_sql(json.dumps(api_pricing, ensure_ascii=False))}',
  '{escape_sql(json.dumps({}, ensure_ascii=False))}',
  '{escape_sql(json.dumps({"arena_elo": None, "mmlu_pro": None, "gpqa": None, "swe_bench": None}, ensure_ascii=False))}',
  1,
  '{escape_sql(sanitized_id)}',
  {supports_reasoning},
  0,
  0,
  0,
  '{escape_sql(json.dumps({}, ensure_ascii=False))}',
  'feed',
  datetime('now')
)
ON CONFLICT(id) DO UPDATE SET
  {UPSERT_SET};"""
    return sql


def insert_provider_sql(pid: str, pname: str) -> str:
    """프로바이더 UPSERT SQL 생성"""
    return f"INSERT OR REPLACE INTO providers (id, name) VALUES ('{escape_sql(pid)}', '{escape_sql(pname)}');"


# ─────────────────────────────────────────────────────────
# 3. D1 실행
# ─────────────────────────────────────────────────────────

def run_wrangler_execute(sql_file: str) -> bool:
    """wrangler d1 execute로 SQL 파일을 D1에 적재"""
    print(f"\n🚀 D1 적재 중: {sql_file}")
    try:
        result = subprocess.run(
            ["npx", "wrangler", "d1", "execute", D1_DB_NAME, "--remote", f"--file={sql_file}"],
            capture_output=True, text=True, cwd=REPO_ROOT, timeout=180
        )
        if result.returncode == 0:
            print("✅ D1 적재 성공!")
            # changes 수 파싱
            try:
                import re as _re
                m = _re.search(r'"changes":\s*(\d+)', result.stdout)
                if m:
                    print(f"   변경 행 수: {m.group(1)}개")
            except Exception:
                pass
            return True
        else:
            print(f"❌ D1 적재 실패:\n{result.stderr[-800:]}")
            return False
    except Exception as e:
        print(f"❌ wrangler 실행 오류: {e}")
        return False


def check_current_count() -> int:
    """현재 D1 models 테이블 수 확인"""
    try:
        result = subprocess.run(
            ["curl", "-s", "https://ai-model-agent.ai-azc2004.workers.dev/api/v1/models"],
            capture_output=True, text=True, timeout=10
        )
        data = json.loads(result.stdout)
        if isinstance(data, list):
            return len(data)
    except Exception:
        pass
    return 0


# ─────────────────────────────────────────────────────────
# 4. 메인
# ─────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="LLM 모델 카탈로그 Cloudflare D1 배치 갱신")
    parser.add_argument("--dry-run", action="store_true", help="SQL 파일만 생성하고 wrangler 실행 건너뜀")
    args = parser.parse_args()

    print("=" * 60)
    print("🤖  LLM 모델 카탈로그 Cloudflare D1 배치 갱신 스크립트")
    print("=" * 60)

    before_count = check_current_count()
    print(f"\n📊 현재 D1 모델 수: {before_count}개")
    print("📡 OpenRouter API에서 최신 모델 수집 시작...\n")

    # 1. OpenRouter API 수집
    ext_models = fetch_openrouter_models()
    if not ext_models:
        print("❌ 수집된 모델이 없습니다. OpenRouter API 연결을 확인하세요.")
        return

    # 2. SQL 변환
    print(f"\n🔄 {len(ext_models)}개 모델 D1 SQL 변환 중...")
    sql_statements = []
    provider_set = set()
    converted = 0
    skipped = 0

    for ext in ext_models:
        raw_id = ext.get("id", "")
        if not raw_id:
            skipped += 1
            continue

        pid, pname = extract_provider(raw_id)
        if pid not in provider_set:
            provider_set.add(pid)
            sql_statements.append(insert_provider_sql(pid, pname))

        sql = convert_model_to_sql(ext)
        if sql:
            sql_statements.append(sql)
            converted += 1
        else:
            skipped += 1

    print(f"  ✅ 변환 완료: {converted}개 모델 SQL 생성 (건너뜀: {skipped}개)")

    if not sql_statements:
        print("❌ 생성된 SQL이 없습니다.")
        return

    # 3. SQL 파일 저장
    with open(SQL_OUTPUT_PATH, "w", encoding="utf-8") as f:
        f.write("\n".join(sql_statements))
    print(f"\n💾 SQL 파일 저장 완료: {SQL_OUTPUT_PATH}")
    print(f"   총 {len(sql_statements)}개 구문 ({len(provider_set)}개 프로바이더 + {converted}개 모델)")

    # 4. D1 적재 (--dry-run 시 건너뜀)
    if args.dry_run:
        print(f"\n⏭️  --dry-run 모드: wrangler 실행 건너뜀.")
        print(f"   적재하려면: npx wrangler d1 execute {D1_DB_NAME} --remote --file={SQL_OUTPUT_PATH}")
        return

    success = run_wrangler_execute(SQL_OUTPUT_PATH)

    if success:
        time.sleep(2)
        after_count = check_current_count()
        new_models = after_count - before_count
        print(f"\n🎉 완료!")
        print(f"   이전: {before_count}개 → 이후: {after_count}개")
        if new_models > 0:
            print(f"   🆕 신규 모델 {new_models}개 추가!")
        else:
            print(f"   ✅ 기존 {after_count}개 모델 가격/스펙 갱신 완료")
    else:
        print(f"\n⚠️  D1 적재 실패. SQL 파일은 {SQL_OUTPUT_PATH}에 저장되었습니다.")
        print(f"   수동으로 실행하려면: npx wrangler d1 execute {D1_DB_NAME} --remote --file={SQL_OUTPUT_PATH}")


if __name__ == "__main__":
    main()
