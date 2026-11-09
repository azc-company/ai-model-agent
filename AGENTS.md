# AGENTS.md — ai-model-agent 작업 규약

## 프로젝트 카드
<!-- project-master/projects.yaml 과 동기화. 세션을 마칠 때 '상태'와 '다음 할 일'을 갱신한다. -->
- 목적: LLM COMPASS — 전세계 LLM 스펙·비용·벤치마크 비교, TCO 시뮬레이션, AI 뉴스 배치
- 등급: 운영
- 배포: https://llmcompass.azclab.com · Cloudflare Workers + D1(wrangler.toml), 백엔드 Render(render.yaml)
- 실행: `cd frontend && npm run dev`
- 테스트: `cd frontend && npm test · cd backend && python3 -m unittest`
- 배포 명령: `cd frontend && npm run build` 후 `npx wrangler deploy (루트)` (wrangler 는 빌드하지 않고 frontend/dist 를 그대로 올린다) · 백엔드는 render.yaml 자동배포 [확인필요]`
- 상태(2026-11-09): 뉴스 메뉴 맨 위 이동·기사 영어 번역(`trend_news_i18n`, backend/scripts/translate_articles.py, .github/workflows/article_i18n.yml) 구현 완료, 미커밋·미배포. 이전 완료분: 첫 화면을 AI 트렌드 뉴스 탭으로(`DEFAULT_TAB`, frontend/src/navigation/navigationConfig.tsx — ?tab= 없이 들어오면 뉴스). 2026-11-09 배포·운영 확인 완료. 직전: GPU 스펙&비용 탭에 DGX Spark·Blackwell(B200/B300, RTX PRO 6000, RTX 5090)·Apple M5 Mac Studio·Ryzen AI Max 추가, 전 장비 가격 2026-10 시세로 갱신 (데이터: frontend/src/api.ts fetchGPUSpecs)
- 다음 할 일:
  1. 기사 번역 출시: 커밋·`main` 병합 → 운영 D1 에 `trend_news_i18n` 생성(schema_d1.sql 의 해당 CREATE 문) → 프론트 빌드 후 `npx wrangler deploy` → GitHub Actions 에서 Article Translation 실행
  2. GPU 탭 라이트 테마 글자 대비 수정(`text-sky-600`). 이 E2E 실패로 main push 자동 배포가 막혀 있다
  3. 영어 번역 품질 확인 후 다른 언어 확대(`--lang`, `REPORT_TYPES`, 워크플로)

