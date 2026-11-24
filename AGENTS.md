# AGENTS.md — ai-model-agent 작업 규약

## 프로젝트 카드
<!-- project-master/projects.yaml 과 동기화. 세션을 마칠 때 '상태'와 '다음 할 일'을 갱신한다. -->
- 목적: LLM COMPASS — 전세계 LLM 스펙·비용·벤치마크 비교, TCO 시뮬레이션, AI 뉴스 배치
- 등급: 운영
- 배포: https://llmcompass.azclab.com · Cloudflare Workers + D1(wrangler.toml), 백엔드 Render(render.yaml)
- 실행: `cd frontend && npm run dev`
- 테스트: `cd frontend && npm test · cd backend && python3 -m unittest`
- 배포 명령: `cd frontend && npm run build` 후 `npx wrangler deploy (루트)` (wrangler 는 빌드하지 않고 frontend/dist 를 그대로 올린다) · 백엔드는 render.yaml 자동배포 [확인필요]`
- 상태(2026-11-24): 서비스 점검 후 개선 배포 — GPU 탭 글자 대비 수정·CI 의존성 순서 수정으로 main push 자동 배포 복구(2026-11-24 성공 확인), 뉴스 카드 30건씩+더 보기, 기사 상세 고정 문구 7개 언어, 번역 수치 검증 오탐 완화·gpt-4.1 대체 모델. 2026-11-10: 기사에서 목록 복귀 시 스크롤 유지, '목록으로 돌아가기' 버튼 7개 언어 표시 운영 배포 완료. 2026-11-09: 뉴스 메뉴 맨 위 이동·기사 영어 번역(`trend_news_i18n`, backend/scripts/translate_articles.py, .github/workflows/article_i18n.yml) 운영 배포 완료. 이전 완료분: 첫 화면을 AI 트렌드 뉴스 탭으로(`DEFAULT_TAB`, frontend/src/navigation/navigationConfig.tsx — ?tab= 없이 들어오면 뉴스). 2026-11-09 배포·운영 확인 완료. 직전: GPU 스펙&비용 탭에 DGX Spark·Blackwell(B200/B300, RTX PRO 6000, RTX 5090)·Apple M5 Mac Studio·Ryzen AI Max 추가, 전 장비 가격 2026-10 시세로 갱신 (데이터: frontend/src/api.ts fetchGPUSpecs)
- 다음 할 일:
  1. 영어 일괄 번역 완료(2026-11-24, 450건 반영). 남은 한국어 제목 41건은 대부분 게이트웨이 가림 — 2번 해결 후 워크플로 수동 실행
  2. 게이트웨이 hide-secrets 가 번역 응답을 가려 매일 실패하는 기사 약 13건 — 번역용 키를 가드레일 예외로 두는 게이트웨이 설정이 필요(레포 밖)
  3. 뉴스 목록 API 가 전체 795건(압축 약 450KB)을 내려준다. 화면은 30건씩 그리지만 전송량은 그대로 — 계속 늘면 목록 필드 축소나 서버 페이지네이션
  4. 영어 번역 품질 확인 후 다른 언어 확대(`--lang`, `REPORT_TYPES`, 워크플로)
