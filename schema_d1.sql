-- Cloudflare D1 (SQLite Edge) Schema for LLM COMPASS 3.0

CREATE TABLE IF NOT EXISTS providers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  website TEXT,
  logo_url TEXT,
  description TEXT,
  official_docs_url TEXT
);

CREATE TABLE IF NOT EXISTS models (
  id TEXT PRIMARY KEY,
  provider_id TEXT NOT NULL,
  provider_name TEXT NOT NULL,
  name TEXT NOT NULL,
  tier TEXT NOT NULL,
  is_open_weight INTEGER DEFAULT 0,
  license_type TEXT,
  parameter_count_b REAL,
  architecture TEXT,
  context_window INTEGER,
  max_output_tokens INTEGER,
  modality TEXT, -- JSON array string
  description TEXT,
  -- 언어별 설명. {"en": "...", "ja": "..."} 형태의 JSON 이며 없는 언어는 description 으로
  -- 폴백한다. benchmarks/quota 와 같은 방식으로 컬럼 하나에 담는다.
  description_i18n TEXT,
  official_url TEXT,
  source_docs_url TEXT,
  api_pricing TEXT, -- JSON object string
  quota TEXT, -- JSON object string
  benchmarks TEXT, -- JSON object string
  is_verified INTEGER DEFAULT 1,
  litellm_id TEXT,
  supports_reasoning INTEGER DEFAULT 0,
  supports_web_search INTEGER DEFAULT 0,
  is_deprecated INTEGER DEFAULT 0,
  is_new INTEGER DEFAULT 0,
  hardware_requirements TEXT,
  -- 'feed' = OpenRouter 동기화가 넣은 행, 'seed' = 수기로 넣은 행.
  -- 피드에서 사라진 모델을 지원 중단 처리할 때 수기 시드를 건드리지 않기 위해 필요하다.
  source TEXT DEFAULT 'seed',
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS news_articles (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT,
  url TEXT,
  source TEXT,
  published_at TEXT,
  is_new INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS trend_news (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  report_type TEXT,
  executive_summary TEXT,
  analytical_deep_dive TEXT,
  key_takeaways TEXT,
  original_sources TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  image_url TEXT,
  -- 뉴스 배치가 채우는 컬럼. 원격 DB에는 ALTER TABLE 로 뒤늦게 붙어 이 파일과 어긋나
  -- 있었고, 이 스키마로 DB를 새로 만들면 배치가 깨졌다.
  tags TEXT,
  matched_lenses TEXT,
  -- 사실과 의견을 분리해 저장한다. 한 덩어리 본문에 섞여 있으면 독자가 어디까지가
  -- 원문 근거이고 어디부터가 모델 추론인지 구분할 수 없다.
  key_numbers TEXT,      -- JSON: [{label, value, source_url}] — 출처 없는 수치는 넣지 않는다
  our_take TEXT,         -- 편집 의견. UI 에서 사실과 시각적으로 구분한다
  open_questions TEXT,   -- JSON: 아직 확인되지 않은 것. 추측을 사실처럼 쓰지 않게 하는 자리다
  -- 기사에 등장한 모델의 id. 가격·벤치마크는 저장하지 않는다 — 주간 동기화로
  -- 값이 바뀌므로 기사 작성 시점에 얼려두면 곧 틀린 값이 된다. Worker 가 조회
  -- 시점에 models 와 조인해 항상 현재 값을 보여준다.
  mentioned_models TEXT  -- JSON: ["gpt-4o", ...]
);

CREATE INDEX IF NOT EXISTS idx_models_provider ON models(provider_id);
CREATE INDEX IF NOT EXISTS idx_models_tier ON models(tier);
CREATE INDEX IF NOT EXISTS idx_models_is_open ON models(is_open_weight);

-- 익명 사용 로그. 개인 식별 정보 없이 세션 단위 행동만 기록한다.
CREATE TABLE IF NOT EXISTS analytics_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL, -- page_view | search | compare_add | compare_remove | external_link_click | news_open
  tab TEXT,
  label TEXT,
  device TEXT, -- mobile | desktop
  country TEXT, -- Cloudflare edge에서 제공 (request.cf.country)
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 주간 제품 업데이트. 커밋 메시지를 그대로 싣지 않는다 — 개발자용 문장이고
-- 과거 보안·장애 이력이 그대로 드러난다. LLM 이 사용자 관점 문장으로 다시 쓴다.
CREATE TABLE IF NOT EXISTS changelog (
  id TEXT PRIMARY KEY,            -- changelog-YYYY-MM-DD
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  items TEXT NOT NULL,            -- JSON: [{category, text}]
  commit_count INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_changelog_end ON changelog(period_end);

-- 카탈로그 주간 스냅샷. model_d1_batch 가 INSERT OR REPLACE 로 덮어쓰기 때문에
-- 이전 가격·스펙이 소실된다. 동기화 직전에 현재 상태를 남겨 두 시점을 비교할 수
-- 있게 한다 — "이번 주 GPT-4o 단가 인하" 같은 변경 리포트의 재료다.
-- 631행 × 주 1회 = 연 33,000행. 180일 지난 것은 배치가 정리한다.
CREATE TABLE IF NOT EXISTS model_snapshots (
  captured_at TEXT NOT NULL,      -- date('now')
  model_id TEXT NOT NULL,
  name TEXT,
  provider_name TEXT,
  api_pricing TEXT,               -- JSON
  context_window INTEGER,
  benchmarks TEXT,                -- JSON
  is_deprecated INTEGER,
  PRIMARY KEY (captured_at, model_id)
);

CREATE INDEX IF NOT EXISTS idx_snapshot_captured ON model_snapshots(captured_at);

-- 크롤러 방문 기록. analytics_events 에 섞으면 사람 세션 수가 오염되므로 분리한다.
-- 워커가 자산보다 먼저 실행되므로 SPA 셸이 아니라 실제 요청 시점에 기록된다.
CREATE TABLE IF NOT EXISTS crawler_hits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bot TEXT NOT NULL,        -- GPTBot | ClaudeBot | PerplexityBot | Googlebot | ...
  path TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_crawler_created ON crawler_hits(created_at);
CREATE INDEX IF NOT EXISTS idx_crawler_bot ON crawler_hits(bot);

CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_session ON analytics_events(session_id);

-- Google Search Console 검색 실적.
-- GSC 데이터는 2~3일 지연돼 확정되므로 배치는 매번 최근 며칠을 다시 받아
-- 덮어쓴다. PRIMARY KEY 가 (date, dimension, value) 라 재수집이 안전하다.
CREATE TABLE IF NOT EXISTS gsc_metrics (
  date        TEXT NOT NULL,      -- YYYY-MM-DD
  dimension   TEXT NOT NULL,      -- query | page | country | device
  value       TEXT NOT NULL,      -- 검색어 / URL / 국가 / 기기
  clicks      INTEGER NOT NULL DEFAULT 0,
  impressions INTEGER NOT NULL DEFAULT 0,
  ctr         REAL    NOT NULL DEFAULT 0,
  position    REAL    NOT NULL DEFAULT 0,
  PRIMARY KEY (date, dimension, value)
);
CREATE INDEX IF NOT EXISTS idx_gsc_dim_date ON gsc_metrics(dimension, date DESC);

-- 2026-09-13: 카탈로그 최초 발견일. 동기화(ON CONFLICT DO UPDATE)가 덮어쓰지 않는다.
-- Worker 가 이 값으로 "신규 모델"(30일 이내)을 계산한다. is_new 컬럼은 더 이상 쓰지 않는다.
ALTER TABLE models ADD COLUMN first_seen_at TEXT;

-- 2026-09-15: 첫 유입 경로. utm_source 가 있으면 그것, 없으면 리퍼러 호스트, 둘 다 없으면 'direct'.
-- 채널(디스콰이엇·긱뉴스·레딧)별 효과를 가르기 위해 둔다.
ALTER TABLE analytics_events ADD COLUMN source TEXT;

-- 2026-09-15: 시드·동기화 이중 등록 정리. 시드 행을 지우지 않고 대체한 동기화 id 를 남긴다.
-- Worker 가 /models/<시드 id> 를 /models/<superseded_by> 로 301 리다이렉트한다.
ALTER TABLE models ADD COLUMN superseded_by TEXT;
