# 🧭 LLM COMPASS - Global AI Model Spec & TCO Analytics Platform

> **LLM COMPASS**는 전세계 주요 AI LLM 모델의 스펙, 비용, 벤치마크 비교부터 API vs 셀프호스팅 TCO 시뮬레이션, AI 아키텍처 맞춤 추천, 최신 AI 툴 튜토리얼 및 실무 활용 팁 중심의 24시간 정기 AI 실전 뉴스 배치를 통합 제공하는 **글로벌 AI 통합 인텔리전스 플랫폼**입니다.

---

## 🌟 주요 기능 모듈 (7대 핵심 메뉴)

### 1. 📊 LLM 모델 카탈로그 (Catalog Dashboard)
- **전 세계 주요 LLM 모델 스펙 DB**: OpenAI(GPT-4o, o3-mini), Anthropic(Claude 3.5 Sonnet), Google(Gemini 2.5 Flash/Pro), Meta(Llama 3.3), DeepSeek(R1, V3) 등 20여 개 핵심 모델 실시간 스펙 제공.
- **다원화된 필터링**: 프로바이더, 티어(Frontier, Mid, Small, Micro), 오픈웨이트 여부, 검색 지원.
- **상세 메트릭**: 토큰당 비용(Input/Output/Cached), 쿼터 한도(RPM/TPM/RPD), 벤치마크 점수(Arena ELO, MMLU-Pro, SWE-bench), 추천 GPU 사양.
- **⚡ 모델별 원클릭 API 코드 플레이그라운드**: 각 모델 카드에서 `⚡ API 코드` 버튼 클릭 시 **Python SDK, JavaScript/Node.js, cURL, LangChain** 4대 언어/프레임워크별 100% 작동 코드 스니펫 및 1-Click 복사, 연동 실전 팁 모달 제공.

### 2. ⚖️ 모델 다자간 정밀 비교 (Compare View)
- 최대 N개 모델을 선택하여 **입/출력 비용, 컨텍스트 윈도우, SWE-bench 개발 성능, 가성비 지표**를 1:1 표 및 그래픽 카드로 정밀 비교.

### 3. 🧮 API vs 셀프호스팅 TCO 시뮬레이터 (TCO Simulator)
- **비용 최적화 예측 엔진**: 월간 예상 토큰 사용량(Input/Output), 픽 타임 요청 수, 분산 아키텍처 입력 시 **상용 API 사용 비용 vs cloud GPU(NVIDIA H100, A100, L40S) 셀프호스팅 TCO(총 소유 비용)** 자동 산출.
- **크리티컬 마일스톤 안내**: API 쿼터 한도 돌파 시점 및 셀프호스팅 전환 시 손익분기점(BEP) 제시.

### 4. 💎 AI 아키텍처 어드바이저 (Architecture Advisor)
- **Top 5 랭킹 프리셋**: 사전 검증된 아키텍처 시나리오(유저 챗봇, RAG 파이프라인, 에이전트 코딩, 대용량 문서 분석 등) 즉시 로드 (0.001초).
- **Top 10+ 모달 & AI 마크다운 파이프라인**: 5단계 결정론적 검증 파이프라인(Router ➔ Generator ➔ Critique ➔ Deterministic Validator ➔ Retry) 기반으로 맞춤형 아키텍처 명세서 마크다운 생성.

### 5. 🎓 AI 에이전트 코딩 & Vibe Coding 튜토리얼 (Tutorial Academy)
- **10대 최신 AI 코딩 도구 가이드**: Google Antigravity, AWS Q / Kiro, Claude Code, Cursor, Bolt.new, v0.dev, Copilot Workspace, Windsurf, Replit Agent, Devin 가이드.
- **실리콘밸리 Vibe Skills Pack**: 생산 배포(`deploy_production`), 코드 리뷰 가드(`code_review_guard`), DB 마이그레이션(`db_migration`), API 연동(`api_integration`), 버그 헌팅(`bug_hunting_agent`) 스킬 1-Click 복사 스니펫 제공.
- **MCP 연동 가이드**: `codebase-memory-mcp` 등 지식 그래프 MCP 연동 명령어 가이드.

### 6. 📰 AI 실전 뉴스 펄스 2.0 (AI News Pulse)
- **22개 글로벌 랜드마크 수집 채널 (소스당 5개, 총 110개+ 기사 수집)**:
  - *빅테크 공식 (8개)*: OpenAI, Anthropic, Google DeepMind, Meta AI, Microsoft Research, AWS ML, NVIDIA AI, Apple ML
  - *IT 전문 매체 (9개)*: TechCrunch AI, VentureBeat, Ars Technica, MIT Tech Review, Wired, The Verge, ZDNet, IEEE Spectrum, MarkTechPost
  - *연구/학계 (5개)*: Hugging Face, ArXiv AI, ArXiv NLP, LangChain Blog, LlamaIndex Blog
- **24시간 정기 배치 스케줄러 & GitHub Actions 연동**: 백엔드 자체 24시간 루프 및 **GitHub Actions Cron 워크플로우(`.github/workflows/news_batch.yml`)**가 매일 아침 백엔드 인스턴스를 자동으로 웜업(Warm-up)시키고 배치 파이프라인을 구동. (대기시간 0초 보장)
- **5대 직무 렌즈 (Role-based Lens)**: `🔥 전체`, `👩‍💻 개발자/엔지니어`, `💡 기획/PM`, `💼 비즈니스`, `🔬 연구/학계` 선택 필터 제공.
- **🖼️ 고화질 기사 썸네일 이미지 지원**: RSS 파서 및 HTML 기반 대표 썸네일 정밀 추출과 카테고리별 기술 이미지 폴백으로 모던한 카드 비주얼 제공.
- **💡 실전 활용 팁 (Actionable Insight)**: 기사의 3줄 요약 외에 각 직무별 "이 기술/소식을 현업에서 어떻게 즉시 활용하거나 대비해야 하는가?" 조언 도출.

### 7. 🏆 리더보드 & 💻 GPU 사양 정보 (Leaderboard & GPU List)
- LMSYS Chatbot Arena ELO 및 SWE-bench 랭킹 실시간 리더보드.
- NVIDIA H100, A100, L40S, RTX 4090 등 대표 AI GPU 사양 및 VRAM 스펙 테이블.

---

## 🏗️ 운영 시스템 아키텍처 (System Architecture)

```
[ Frontend: React 19 + TypeScript + Vite + TailwindCSS ]
      │
      │ Same-origin REST API
      ▼
[ Cloudflare Worker: `src/worker.ts` ]
  ├── D1 모델·뉴스 조회 API
  ├── TCO 계산 및 아키텍처 추천 API
  └── `frontend/dist` 정적 자산 제공
      │
      ▼
[ Cloudflare D1: `llm-compass-db` ]

[ GitHub Actions Python Batch ]
  └── `backend/scripts/generate_trend_reports.py`
      RSS 수집 → 기사 검증 → 클러스터링 → LLM 생성 → 품질 검증 → D1 저장
```

`backend/app`의 FastAPI 구현은 로컬·레거시 호환 용도로 남아 있으며, 현재 운영 트래픽의 기본 진입점은 Cloudflare Worker입니다. 뉴스 생성은 공개 Worker API가 아니라 GitHub Actions Python 배치에서만 수행합니다.

---

## 🛠️ 기술 스택 (Tech Stack)

### Frontend
- **Framework**: React 18, TypeScript, Vite
- **Styling**: TailwindCSS, Glassmorphism UI, Lucide Icons
- **i18n**: 한국어, English, 日本語, 中文 4개국어 멀티 랭귀지 지원

### Backend / Edge
- **Runtime**: Cloudflare Workers, D1, Wrangler
- **Legacy/Local API**: FastAPI, Uvicorn, Pydantic v2
- **AI/LLM**: LiteLLM Gateway
- **News Batch**: Python 3.11, GitHub Actions, deterministic quality validation

---

## 🚀 로컬 개발 및 실행 방법 (Quick Start)

### 1. Repository 클론
```bash
git clone https://github.com/azc-company/ai-model-agent.git
cd ai-model-agent
```

### 2. 프론트엔드 실행
```bash
cd frontend
npm install
npm run dev
```

브라우저에서 `http://localhost:5173`으로 접속합니다. 로컬 프론트엔드는 필요한 경우 `VITE_API_BASE_URL`로 별도 API를 지정할 수 있습니다.

### 3. 뉴스 배치 테스트
```bash
cd backend
python3 -m unittest \
  tests.test_generate_trend_reports \
  tests.test_trend_report_validation \
  -v
```

운영 배치에는 GitHub Secret `LITELLM_API_KEY`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`가 필요합니다. 테스트는 외부 LLM이나 운영 D1을 호출하지 않습니다. 실제 배치 실행은 D1을 변경하므로 운영 권한이 있는 환경에서만 수행해야 합니다.

---

## 📊 백엔드 주요 API 엔드포인트

| Method | Endpoint | 설명 |
| :--- | :--- | :--- |
| `GET` | `/api/v1/providers` | LLM 프로바이더 목록 조회 |
| `GET` | `/api/v1/models` | LLM 모델 스펙 및 요금 조회 (필터링 지원) |
| `POST` | `/api/v1/simulate/tco` | API vs GPU 셀프호스팅 TCO 시뮬레이션 |
| `POST` | `/api/v1/recommend/architecture` | 맞춤형 AI 아키텍처 추천 |
| `POST` | `/api/v1/generate/markdown` | 5단계 파이프라인 마크다운 생성 |
| `GET` | `/api/v1/news/pulse` | 24시간 정기 배치 수집된 AI 뉴스 & 실전 팁 조회 (`?lens=developer`) |
| `POST` | `/api/v1/analytics/track` | 익명 사용 이벤트 수집 (세션 ID만, 개인정보 없음) |
| `GET` | `/api/v1/admin/analytics/summary` | 이용현황 요약 (어드민 인증 필요, `?days=7\|14\|30`) |

뉴스 생성·갱신용 공개 HTTP 엔드포인트는 제공하지 않습니다. 수동 실행은 GitHub Actions의 `news_batch.yml` workflow dispatch를 사용합니다.

---

## 📈 어드민 모니터링 페이지

`/admin` 경로에서 탭별 조회수, 검색어, 비교 모델, 뉴스 열람, 공식 문서 클릭, 디바이스/국가 분포를 확인할 수 있습니다. 개인 식별 정보는 수집하지 않고 브라우저 localStorage에 저장된 익명 세션 ID로만 집계합니다.

`ADMIN_PASSWORD` 시크릿이 없으면 어드민 페이지와 요약 API 모두 401로 차단됩니다(fail-closed). 최초 1회 설정:

```bash
npx wrangler secret put ADMIN_PASSWORD
```

브라우저로 `/admin` 접속 시 뜨는 기본 인증(Basic Auth) 창에 아이디는 아무 값, 비밀번호는 위에서 설정한 값을 입력합니다.

---

## 📄 라이선스 (License)
MIT License. 자유롭게 커스텀 및 수정하여 사용하실 수 있습니다.
