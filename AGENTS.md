# AGENTS.md — ai-model-agent 작업 규약

## 프로젝트 카드
<!-- project-master/projects.yaml 과 동기화. 세션을 마칠 때 '상태'와 '다음 할 일'을 갱신한다. -->
- 목적: LLM COMPASS — 전세계 LLM 스펙·비용·벤치마크 비교, TCO 시뮬레이션, AI 뉴스 배치
- 등급: 운영
- 배포: https://llmcompass.azclab.com · Cloudflare Workers + D1(wrangler.toml), 백엔드 Render(render.yaml)
- 실행: `cd frontend && npm run dev`
- 테스트: `cd frontend && npm test · cd backend && python3 -m unittest`
- 배포 명령: `cd frontend && npm run build` 후 `npx wrangler deploy (루트)` (wrangler 는 빌드하지 않고 frontend/dist 를 그대로 올린다) · 백엔드는 render.yaml 자동배포 [확인필요]`
- 상태(2026-11-09): 첫 화면을 AI 트렌드 뉴스 탭으로(`DEFAULT_TAB`, frontend/src/navigation/navigationConfig.tsx — ?tab= 없이 들어오면 뉴스). 2026-11-09 배포·운영 확인 완료. 직전: GPU 스펙&비용 탭에 DGX Spark·Blackwell(B200/B300, RTX PRO 6000, RTX 5090)·Apple M5 Mac Studio·Ryzen AI Max 추가, 전 장비 가격 2026-10 시세로 갱신 (데이터: frontend/src/api.ts fetchGPUSpecs)
- 다음 할 일:
  1. (기입)

