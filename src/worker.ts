import * as Sentry from '@sentry/cloudflare';
import { PROVIDERS, GPU_SPECS, TRENDING_TEMPLATES } from './data';
import { calculateTCO } from './tco';
import { recommendArchitecture, generateMarkdown } from './llm';
import { ClientError } from './errors';
import * as seo from './seo';
export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  ADMIN_PASSWORD?: string;
  SENTRY_DSN?: string;
  TRACK_LIMITER: { limit(o: { key: string }): Promise<{ success: boolean }> };
}

const JSON_CORS = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

/**
 * 공통 에러 응답 + Sentry 보고.
 * 잘못된 요청까지 500 으로 돌려주면 실제 장애와 구분이 안 되고 알림이 오염된다.
 * 서버 오류일 때 err.message 를 그대로 실으면 내부 구현(파서 위치, 쿼리문)이 새어나가므로
 * 상세는 Sentry 로만 보내고 응답은 고정 문구를 쓴다.
 */
function fail(err: any): Response {
  if (err instanceof ClientError) {
    return new Response(JSON.stringify({ error: err.message }), { status: err.status, headers: JSON_CORS });
  }
  // request.json() 이 본문 파싱에 실패하면 SyntaxError 를 던진다 — 이것도 클라이언트 잘못이다.
  if (err instanceof SyntaxError) {
    return new Response(JSON.stringify({ error: 'Request body is not valid JSON' }), { status: 400, headers: JSON_CORS });
  }
  Sentry.captureException(err);
  return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500, headers: JSON_CORS });
}

// ─── 어드민 인증 ─────────────────────────────────────────────────────────────
// ADMIN_PASSWORD 시크릿(wrangler secret put)이 없으면 항상 거부한다 — 미설정 상태로
// 배포돼 어드민 페이지가 그대로 공개되는 사고를 막기 위한 fail-closed 기본값.
function requireAdmin(request: Request, env: Env): Response | null {
  const expected = env.ADMIN_PASSWORD;
  const challenge = new Response('Unauthorized', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="LLM COMPASS Admin"' },
  });
  if (!expected) return challenge;
  const header = request.headers.get('Authorization') || '';
  if (!header.startsWith('Basic ')) return challenge;
  let decoded = '';
  try { decoded = atob(header.slice(6)); } catch { return challenge; }
  const password = decoded.slice(decoded.indexOf(':') + 1);
  return password === expected ? null : challenge;
}

// ─── 기사 썸네일 ─────────────────────────────────────────────────────────────
// trend_news.image_url 이 있으면 그것을, 없으면 id 해시로 풀에서 결정론적 선택.
// 상수 하나를 쓰면 모든 기사가 같은 그림이 되므로 분산이 필요하다.
const FALLBACK_IMAGES = [
  'photo-1620712943543-bcc4688e7485',
  'photo-1526374965328-7f61d4dc18c5',
  'photo-1558494949-ef010cbdcc31',
  'photo-1618005182384-a83a8bd57fbe',
  'photo-1507413245164-6160d8298b31',
  'photo-1607799279861-4dd421887fb3',
  'photo-1550751827-4bd374c3f58b',
  'photo-1460925895917-afdab827c52f',
  'photo-1532094349884-543bc11b234d',
];

function resolveImage(row: any): string {
  const stored = typeof row?.image_url === 'string' ? row.image_url.trim() : '';
  if (stored.startsWith('http')) return stored;
  const key = String(row?.id ?? '');
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  const id = FALLBACK_IMAGES[hash % FALLBACK_IMAGES.length];
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=80`;
}

// 배치는 key_takeaways 에 [요약, 개발자팁, PM팁, 비즈니스팁] 을 넣는다.
// 이걸 버리고 캔 문구를 쓰면 모든 기사의 팁이 똑같아진다.
const CANNED_INSIGHT = {
  developer: '최신 AI 모델 아키텍처 수율을 적용하여 에이전트 시스템을 구축하세요.',
  pm: '유저 인터페이스에 AI 에이전트 추론 과정을 효과적으로 가시화하세요.',
  business: '고비용 상용 API를 오픈/경량 모델로 대체하여 TCO를 70% 절감하세요.',
};

// 배치가 넣는 key_takeaways 는 [요약, 개발자, PM, 비즈니스] 4칸이라 researcher 팁의
// 원본이 없다. 캔 문구를 채우면 전 기사가 같은 문장을 달게 되므로, 5번째 항목이
// 실제로 들어온 기사에만 researcher 를 싣고 없으면 필드를 생략한다(프론트에서 optional).
function resolveInsight(takeaways: any[]) {
  const pick = (i: number) => {
    const value = Array.isArray(takeaways) && typeof takeaways[i] === 'string' ? takeaways[i].trim() : '';
    return value;
  };
  const researcher = pick(4);
  return {
    developer: pick(1) || CANNED_INSIGHT.developer,
    pm: pick(2) || CANNED_INSIGHT.pm,
    business: pick(3) || CANNED_INSIGHT.business,
    ...(researcher ? { researcher } : {}),
  };
}

// 역할별 팁으로 쓰인 항목은 요약에서 빼 중복 노출을 막는다.
function resolveSummary(takeaways: any[], executiveSummary: string): any[] {
  if (Array.isArray(takeaways) && takeaways.length >= 4) return [takeaways[0]];
  if (Array.isArray(takeaways) && takeaways.length > 0) return takeaways;
  return [executiveSummary];
}

// ─── 키워드 기반 렌즈 분류기 (백엔드 classify_article_lenses와 동일 로직) ──────
function classifyLenses(title: string, summary: string, sourceName: string, category: string): string[] {
  const combined = (title + ' ' + summary + ' ' + sourceName + ' ' + category).toLowerCase();
  const scores: Record<string, number> = { developer: 0, agent: 0, pm: 0, business: 0, researcher: 0 };

  // 1. developer
  const devKws = ['code', 'coding', 'developer', 'fine-tuning', 'vllm', 'sdk', 'python', 'cuda',
    'open-weights', 'github', 'refactoring', 'swe-bench', '파인튜닝', '개발자', '코드',
    'llama.cpp', 'huggingface', 'inference', 'deployment', 'docker', 'api endpoint', 'openai api', 'claude api'];
  for (const kw of devKws) if (combined.includes(kw)) scores.developer += 2;

  // 2. agent
  const agentKws = ['agentic', 'autonomous', 'multi-agent', 'langchain', 'llamaindex',
    'automation pipeline', '에이전트', '자율', '자동화 워크플로', 'tool call',
    'function call', 'computer use', 'autogen', 'crew ai', 'swarm', 'agent framework'];
  for (const kw of agentKws) if (combined.includes(kw)) scores.agent += 3;
  if (combined.includes('agent')) scores.agent += 1;
  if (combined.includes('workflow')) scores.agent += 1;

  // 3. pm (전문 복합어만)
  const pmKws = ['ux design', 'user experience', 'product manager', 'product roadmap',
    'onboarding flow', 'ui/ux', 'human-computer', 'interaction design', 'prototype',
    '기획자', '서비스 기획', '사용자 경험', '인터페이스 디자인', '프로토타입'];
  for (const kw of pmKws) if (combined.includes(kw)) scores.pm += 3;
  if (combined.includes('ui') && ['ux','interface','design','user'].filter(w => combined.includes(w)).length >= 2) scores.pm += 2;

  // 4. business
  const bizKws = ['tco', 'enterprise cost', 'business roi', 'security breach', 'iam policy',
    'market share', 'aws bedrock', 'on-premise', 'cloud cost', 'telco',
    '비용 절감', '엔터프라이즈', '보안 사고', '기업 도입', '연간 계약'];
  for (const kw of bizKws) if (combined.includes(kw)) scores.business += 2;
  if (combined.includes('enterprise')) scores.business += 1;
  if (combined.includes('cost') && ['cloud','gpu','api','model','tco'].some(k => combined.includes(k))) scores.business += 1;

  // 5. researcher
  const resKws = ['paper', 'arxiv', 'sota', 'benchmark', 'mcts', 'dataset', 'evaluation',
    '논문', '연구', '학계', '벤치마크', 'ablation', 'mmlu', 'gpqa', 'swe-bench'];
  for (const kw of resKws) if (combined.includes(kw)) scores.researcher += 3;

  // 출처 가중치
  if (combined.includes('arxiv') || combined.includes('hugging face')) scores.researcher += 5;
  if (combined.includes('openai') || combined.includes('anthropic') || combined.includes('deepmind')) scores.developer += 2;
  if (combined.includes('nvidia') && ['gpu','cuda','training','inference'].some(k => combined.includes(k))) scores.developer += 2;
  if (combined.includes('techcrunch') || combined.includes('venturebeat')) scores.business += 2;
  if (combined.includes('wired') || combined.includes('mit tech')) scores.researcher += 2;

  // 임계값 3 이상 + 최대 2개
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const selected = sorted.filter(([, s]) => s >= 3).slice(0, 2).map(([k]) => k);
  if (selected.length === 0) {
    const top = sorted[0];
    return top[1] > 0 ? [top[0]] : ['developer'];
  }
  return selected;
}

// ─── 기사 직렬화 ─────────────────────────────────────────────────────────────
// pulse 목록과 단건 조회가 같은 표현을 내려야 한다. 예전에는 두 핸들러가 같은 50여 줄을
// 각자 들고 있어 한쪽만 고치면 조용히 갈라졌다.
//
// trend_news 실제 컬럼은 id/title/report_type/executive_summary/analytical_deep_dive/
// key_takeaways/original_sources/created_at/tags/matched_lenses/image_url 뿐이다.
// source_name·multi_sources·primary_topic·is_synthesized 를 읽던 분기는 항상 undefined
// 였으므로 제거했다.
// "신규 모델" 은 카탈로그에 처음 들어온 지 30일 이내인 모델이다.
// 예전에는 시드 데이터에 손으로 박은 is_new 플래그를 그대로 내보냈고, 동기화는 이 값을
// 항상 0 으로 썼다. 그 결과 1년 전 모델(DeepSeek R1, Grok 3)이 계속 "신규" 로 뜨고
// 실제로 새로 들어온 GPT-6 Astra 는 한 번도 신규로 표시되지 않았다.
// first_seen_at 은 동기화가 절대 덮어쓰지 않으므로 이 판정이 저절로 흘러간다.
const NEW_MODEL_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
function isNewModel(firstSeen: unknown): boolean {
  if (typeof firstSeen !== 'string' || !firstSeen) return false;
  const t = Date.parse(firstSeen.replace(' ', 'T') + 'Z');   // D1 datetime 은 UTC, 'Z' 가 없다
  return Number.isFinite(t) && Date.now() - t < NEW_MODEL_WINDOW_MS;
}

function safeJson<T>(v: unknown, fallback: T): T {
  if (typeof v !== 'string') return (v as T) ?? fallback;
  try { return JSON.parse(v || 'null') ?? fallback; } catch { return fallback; }
}

export function buildArticle(n: any) {
  let takeaways: any[] = [];
  let sources: any[] = [];
  let tags = ["#AITrend", "#DeepSeek", "#Anthropic", "#SOTA"];

  try { takeaways = JSON.parse(n.key_takeaways || '[]'); } catch {}
  try { sources = JSON.parse(n.original_sources || '[]'); } catch {}
  if (n.tags) { try { tags = JSON.parse(n.tags); } catch {} }

  // ✅ 항상 실시간 재분류 (DB 저장 렌즈 무시 → 탭 중복 방지)
  const summaryText = (Array.isArray(takeaways) ? takeaways.join(' ') : (typeof takeaways === 'string' ? takeaways : '')) || n.executive_summary || '';
  const matched_lenses = classifyLenses(n.title || '', summaryText, sources[0]?.title || '', n.report_type || '');

  // 교차 검증된 기사인지는 실제로 묶인 출처 수로만 판단한다. 제목 문자열 추측이나
  // 존재하지 않는 is_synthesized 컬럼을 보던 분기는 전부 참이 되어 배지가 무의미했다.
  const is_synthesized = sources.length >= 2;
  if (is_synthesized && !matched_lenses.includes('synthesized')) matched_lenses.push('synthesized');

  return {
    id: n.id,
    title: n.title,
    source_name: sources[0]?.title || "AI Engineering Lab",
    source_url: sources[0]?.url || "https://ai-compass.org",
    published_at: n.created_at || new Date().toISOString(),
    category: n.report_type || "심층 리포트",
    image_url: resolveImage(n),
    summary_bullets: resolveSummary(takeaways, n.executive_summary),
    blog_summary: n.analytical_deep_dive,
    actionable_insight: resolveInsight(takeaways),
    // 사실과 의견을 분리해 내려준다. 화면이 둘을 다르게 그릴 수 있어야 한다.
    key_numbers: safeJson(n.key_numbers, []),
    our_take: n.our_take || '',
    open_questions: safeJson(n.open_questions, []),
    impact_score: impactScore(n, sources),
    tags,
    matched_lenses,
    is_synthesized,
    multi_sources: is_synthesized
      ? sources.map((s: any) => ({ name: s.title || s.name || "AI Source", url: s.url || "" }))
      : undefined,
  };
}

// 출처 개수와 신선도로만 만드는 값이다. DB에 별도 지표가 없어 리터럴 98을 박아두었더니
// 전 기사가 같은 점수를 달고 나갔다. 진짜 영향도 지표가 생기면 이 함수를 갈아끼운다.
// ponytail: 출처 수 + 신선도 휴리스틱. 실제 영향도 신호가 생기면 교체.
export function impactScore(n: any, sources: any[]): number {
  const richness = Math.min(sources.length, 5) * 6;          // 0 ~ 30
  const ageHours = (Date.now() - Date.parse(n?.created_at || '')) / 3_600_000;
  const freshness = !Number.isFinite(ageHours) ? 0 : ageHours <= 24 ? 10 : ageHours <= 72 ? 5 : 0;
  return Math.min(60 + richness + freshness, 100);
}

// 요청 언어에 맞는 모델 설명을 고른다. description_i18n 에 해당 언어가 없으면
// 원문(description)으로 폴백한다 — 번역 백필이 끝나지 않은 행도 그대로 동작한다.
const SUPPORTED_LANGS = new Set(['ko', 'en', 'ja', 'zh', 'es', 'de', 'fr']);
function localizedDescription(m: any, lang: string): string {
  if (!SUPPORTED_LANGS.has(lang)) return m.description || '';
  try {
    const byLang = JSON.parse(m.description_i18n || '{}');
    const picked = byLang?.[lang];
    if (typeof picked === 'string' && picked.trim()) return picked;
  } catch {}
  return m.description || '';
}

export default Sentry.withSentry(
  // SENTRY_DSN 미설정 시 SDK no-op (에러 전송 없음)
  (env: Env) => ({ dsn: env.SENTRY_DSN, tracesSampleRate: 0 }),
  {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    
    // 크롤러 방문 기록. 응답을 막지 않도록 waitUntil 로 흘려보낸다.
    // 실패해도 조용히 넘어간다 — 관측이 서빙을 방해하면 안 된다.
    const bot = seo.classifyBot(request.headers.get('User-Agent'));
    if (bot && request.method === 'GET') {
      console.log(JSON.stringify({ event: 'crawler_hit', bot, path: url.pathname }));
      ctx.waitUntil(
        env.DB.prepare('INSERT INTO crawler_hits (bot, path) VALUES (?, ?)')
          .bind(bot, url.pathname.slice(0, 200)).run().then(() => undefined, () => undefined)
      );
    }

    // ─── 자체 진단 ────────────────────────────────────────────────────────
    // 워커가 죽으면 정적 자산 레이어가 모든 경로에 SPA 셸을 200 으로 돌려준다.
    // 상태 코드만 보는 외부 모니터에게는 완벽하게 건강해 보이므로(실제로 두 번의
    // 장애 내내 그랬다) 서비스가 스스로 상태를 말하게 한다.
    //
    // 장애와 정체를 구분한다:
    //   503 + ok:false        워커나 D1 이 실제로 고장 — "사이트 다운"
    //   200 + degraded:true   서빙은 되지만 배치가 멈춰 데이터가 상함
    if (url.pathname === '/health') {
      const NEWS_STALE_HOURS = 48;   // 배치는 하루 1회. 스케줄 지연을 감안한 여유.
      try {
        const row: any = await env.DB.prepare(
          `SELECT (SELECT COUNT(*) FROM models) AS models,
                  (SELECT COUNT(*) FROM trend_news) AS news,
                  (SELECT MAX(created_at) FROM trend_news) AS news_latest`
        ).first();

        const ageH = row?.news_latest
          ? (Date.now() - Date.parse(String(row.news_latest).replace(' ', 'T') + 'Z')) / 3_600_000
          : Infinity;

        // 카탈로그가 비면 D1 은 붙었어도 서비스는 제 기능을 못 한다.
        const ok = (row?.models ?? 0) > 100;
        const stale = !Number.isFinite(ageH) || ageH > NEWS_STALE_HOURS;
        // 시크릿이 사라지면 requireAdmin 이 fail-closed 로 항상 401 을 던져 아무도
        // 어드민에 못 들어간다. 밖에서는 '오답 401' 과 구분되지 않아 접속을 시도해야만
        // 알게 된다. 값은 노출하지 않고 설정 여부만 보고한다.
        const adminConfigured = Boolean(env.ADMIN_PASSWORD);

        // UptimeRobot 무료 플랜은 HEAD 요청만 보낼 수 있어 본문 키워드 검사가
        // 불가능하다. 정체(degraded)도 상태 코드로 알려야 감시가 되므로,
        // ?strict=1 이면 degraded 를 실패로 취급한다. 기본 동작은 그대로 둔다 —
        // 배치가 하루 밀렸다고 '사이트 다운' 으로 호출되면 안 된다.
        const strict = url.searchParams.get('strict') === '1';
        const degraded = ok && (stale || !adminConfigured);

        return new Response(JSON.stringify({
          ok,
          degraded,
          checks: {
            models: row?.models ?? 0,
            news: row?.news ?? 0,
            admin_password_set: adminConfigured,
            news_age_hours: Number.isFinite(ageH) ? Math.round(ageH * 10) / 10 : null,
            news_stale_after_hours: NEWS_STALE_HOURS,
          },
          checked_at: new Date().toISOString(),
        }), {
          status: ok && !(strict && degraded) ? 200 : 503,
          headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        });
      } catch (err) {
        Sentry.captureException(err);
        return new Response(JSON.stringify({ ok: false, error: 'database unreachable' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        });
      }
    }

    // ─── 크롤러가 읽을 수 있는 HTML ────────────────────────────────────────
    // SPA 는 JS 실행 후에만 본문이 생기는데 AI 크롤러는 JS 를 실행하지 않는다.
    // 워커가 자산보다 먼저 실행되고 D1 을 쥐고 있으므로 여기서 바로 렌더한다.
    const HTML = { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=300, s-maxage=3600' };

    if (url.pathname.startsWith('/models/')) {
      const id = decodeURIComponent(url.pathname.slice('/models/'.length));
      const row: any = await env.DB.prepare('SELECT * FROM models WHERE id = ?').bind(id).first();
      if (!row) return new Response('Not Found', { status: 404 });
      return new Response(seo.modelPage(row, seo.pickLang(url.searchParams.get('lang'))), { headers: HTML });
    }

    if (url.pathname.startsWith('/news/')) {
      const id = decodeURIComponent(url.pathname.slice('/news/'.length));
      const row: any = await env.DB.prepare('SELECT * FROM trend_news WHERE id = ?').bind(id).first();
      if (!row) return new Response('Not Found', { status: 404 });
      const mids: string[] = safeJson(row.mentioned_models, []);
      if (mids.length) {
        const { results } = await env.DB.prepare(
          `SELECT id, name, provider_name, context_window, api_pricing FROM models
           WHERE id IN (${mids.map(() => '?').join(',')}) AND is_deprecated = 0`
        ).bind(...mids).all();
        row.mentioned_models = results.map((m: any) => ({ ...m, api_pricing: safeJson(m.api_pricing, {}) }));
      } else {
        row.mentioned_models = [];
      }
      return new Response(seo.newsPage(row, seo.pickLang(url.searchParams.get('lang'))), { headers: HTML });
    }

    if (url.pathname === '/changelog' || url.pathname === '/changelog/') {
      const { results } = await env.DB.prepare(
        'SELECT id, title, period_end FROM changelog ORDER BY period_end DESC LIMIT 60'
      ).all();
      return new Response(seo.changelogIndex(results, seo.pickLang(url.searchParams.get('lang'))), { headers: HTML });
    }

    if (url.pathname.startsWith('/changelog/')) {
      const id = decodeURIComponent(url.pathname.slice('/changelog/'.length));
      const row: any = await env.DB.prepare('SELECT * FROM changelog WHERE id = ?').bind(id).first();
      if (!row) return new Response('Not Found', { status: 404 });
      return new Response(seo.changelogPage(row, seo.pickLang(url.searchParams.get('lang'))), { headers: HTML });
    }

    if (url.pathname === '/sitemap.xml') {
      const [m, n, c] = await Promise.all([
        env.DB.prepare('SELECT id FROM models WHERE is_deprecated = 0 ORDER BY is_verified DESC, name ASC').all(),
        env.DB.prepare('SELECT id FROM trend_news ORDER BY created_at DESC').all(),
        env.DB.prepare('SELECT id FROM changelog ORDER BY period_end DESC').all(),
      ]);
      const body = seo.sitemap(
        m.results.map((r: any) => r.id),
        n.results.map((r: any) => r.id),
        c.results.map((r: any) => r.id),
      );
      return new Response(body, {
        headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=600, s-maxage=3600' },
      });
    }

    // 홈과 탭 URL 은 SPA 껍데기라 크롤러에게 텍스트 50자만 보였다. 사이트맵에서
    // 우선순위 1.0 인 홈이 여기 포함돼, 색인 가치가 가장 큰 URL 이 비어 있었다.
    //
    // 사람에게는 반드시 SPA 를 그대로 준다. 봇으로 확인된 요청에만 SEO HTML 을
    // 내려주고, 조회가 실패하면 조용히 정적 에셋으로 떨어진다 — 홈은 사이트에서
    // 가장 중요한 경로라 여기서 500 을 내면 안 된다.
    if (bot && request.method === 'GET' && url.pathname === '/') {
      try {
        const lang = seo.pickLang(url.searchParams.get('lang'));
        const stats: any = await env.DB.prepare(
          `SELECT (SELECT COUNT(*) FROM models WHERE is_deprecated = 0) models,
                  (SELECT COUNT(DISTINCT provider_name) FROM models WHERE is_deprecated = 0) providers,
                  (SELECT COUNT(*) FROM trend_news) news`
        ).first();
        const { results: topModels } = await env.DB.prepare(
          `SELECT id, name, provider_name, context_window FROM models
           WHERE is_deprecated = 0 ORDER BY COALESCE(context_window, 0) DESC LIMIT 30`
        ).all();
        const { results: latestNews } = await env.DB.prepare(
          'SELECT id, title FROM trend_news ORDER BY created_at DESC LIMIT 20'
        ).all();
        return new Response(
          seo.homePage(
            { models: stats?.models ?? 0, providers: stats?.providers ?? 0, news: stats?.news ?? 0 },
            topModels, latestNews, lang,
          ),
          { headers: HTML },
        );
      } catch (err) {
        Sentry.captureException(err);
        return env.ASSETS.fetch(request);   // 크롤러에게도 최소한 껍데기는 준다
      }
    }

    // Google Search Console 소유권 확인.
    // 구글이 지정한 파일명(googleXXXX.html)을 그대로 서빙해야 한다. 토큰은
    // 시크릿(GSC_VERIFICATION)에 두어 재배포 없이 교체할 수 있게 한다.
    // ⚠️ wrangler.toml 의 run_worker_first 에 "/google*" 이 있어야 여기까지 온다.
    //    없으면 정적 에셋이 먼저 잡아 404 가 난다.
    if (url.pathname.startsWith('/google') && url.pathname.endsWith('.html')) {
      const token = (env as any).GSC_VERIFICATION || '';
      const expected = `/${token}`;
      if (!token || url.pathname !== expected) {
        return new Response('Not Found', { status: 404 });
      }
      return new Response(`google-site-verification: ${token}`, {
        headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=300' },
      });
    }

    if (url.pathname === '/robots.txt') {
      return new Response(seo.robots(), {
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600, s-maxage=86400' },
      });
    }

    if (url.pathname === '/llms.txt') {
      const c: any = await env.DB.prepare(
        'SELECT (SELECT COUNT(*) FROM models) m, (SELECT COUNT(*) FROM trend_news) n, (SELECT COUNT(DISTINCT provider_name) FROM models) p'
      ).first();
      return new Response(seo.llmsTxt(c?.m ?? 0, c?.n ?? 0, c?.p ?? 0), {
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600, s-maxage=86400' },
      });
    }

    // SPA 가 최신 업데이트 노트를 배너로 띄우기 위해 쓴다. 크롤러용 /changelog 는
    // 별도로 HTML 을 렌더한다.
    if (url.pathname === '/api/v1/changelog') {
      try {
        const { results } = await env.DB.prepare(
          'SELECT id, period_start, period_end, title, summary, items, created_at FROM changelog ORDER BY period_end DESC LIMIT 10'
        ).all();
        return new Response(JSON.stringify(results.map((r: any) => ({
          ...r,
          items: (() => { try { return JSON.parse(r.items || '[]'); } catch { return []; } })(),
        }))), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*',
                     'Cache-Control': 'public, max-age=300, s-maxage=3600' },
        });
      } catch (err) {
        return fail(err);
      }
    }

    if (url.pathname === '/api/v1/providers') {
      return new Response(JSON.stringify(PROVIDERS), {
        // 배포해야만 바뀌는 상수다. 엣지가 처리하게 두고, 대신 배포 후 최대 1시간은
        // 옛 값이 나갈 수 있다.
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=300, s-maxage=3600' }
      });
    }

    if (url.pathname === '/api/v1/gpus') {
      return new Response(JSON.stringify(GPU_SPECS), {
        // 배포해야만 바뀌는 상수다. 엣지가 처리하게 두고, 대신 배포 후 최대 1시간은
        // 옛 값이 나갈 수 있다.
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=300, s-maxage=3600' }
      });
    }

    if (url.pathname === '/api/v1/recommend/trending') {
      return new Response(JSON.stringify(TRENDING_TEMPLATES), {
        // 배포해야만 바뀌는 상수다. 엣지가 처리하게 두고, 대신 배포 후 최대 1시간은
        // 옛 값이 나갈 수 있다.
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=300, s-maxage=3600' }
      });
    }

    if (url.pathname === '/api/v1/simulate/tco' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { results } = await env.DB.prepare('SELECT * FROM models').all();
        const models = results.map(r => ({ ...r, api_pricing: JSON.parse(r.api_pricing || '{}'), quota: JSON.parse(r.quota || '{}'), benchmarks: JSON.parse(r.benchmarks || '{}'), hardware_requirements: JSON.parse(r.hardware_requirements || '[]'), modality: JSON.parse(r.modality || '[]') }));
        const tco = calculateTCO(body, models);
        return new Response(JSON.stringify(tco), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (err: any) {
        return fail(err);
      }
    }

    if (url.pathname === '/api/v1/recommend/architecture' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { results } = await env.DB.prepare('SELECT * FROM models').all();
        const models = results.map(r => ({ ...r, api_pricing: JSON.parse(r.api_pricing || '{}'), quota: JSON.parse(r.quota || '{}'), benchmarks: JSON.parse(r.benchmarks || '{}'), hardware_requirements: JSON.parse(r.hardware_requirements || '[]'), modality: JSON.parse(r.modality || '[]') }));
        const rec = await recommendArchitecture(body, models, env);
        return new Response(JSON.stringify(rec), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (err: any) {
        return fail(err);
      }
    }

    if (url.pathname === '/api/v1/generate/markdown' && request.method === 'POST') {
      try {
        const body = await request.json();
        const md = await generateMarkdown(body, env);
        return new Response(JSON.stringify(md), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (err: any) {
        return fail(err);
      }
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    }

    // ─── 익명 사용 로그 수집 ────────────────────────────────────────────────
    if (url.pathname === '/api/v1/analytics/track' && request.method === 'POST') {
      const EVENT_TYPES = new Set(['page_view', 'search', 'compare_add', 'compare_remove', 'external_link_click', 'news_open']);
      // 인증이 없는 엔드포인트라 클라이언트가 보내는 session_id 로는 제한이 무의미하다
      // (그냥 새로 만들면 된다). 실제 비용을 유발하는 주체인 IP 로 제한한다.
      const rateKey = request.headers.get('CF-Connecting-IP') || 'unknown';
      const { success } = await env.TRACK_LIMITER.limit({ key: rateKey });
      if (!success) return new Response(null, { status: 429, headers: { 'Access-Control-Allow-Origin': '*' } });
      try {
        const body: any = await request.json();
        const eventType = String(body.event_type || '');
        const sessionId = String(body.session_id || '');
        if (!EVENT_TYPES.has(eventType) || !/^[a-zA-Z0-9-]{1,64}$/.test(sessionId)) {
          return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*' } });
        }
        const tab = String(body.tab || '').slice(0, 32) || null;
        const label = String(body.label || '').slice(0, 200) || null;
        const device = body.device === 'mobile' ? 'mobile' : 'desktop';
        const country = (request as any).cf?.country || null;
        await env.DB.prepare(
          'INSERT INTO analytics_events (session_id, event_type, tab, label, device, country) VALUES (?, ?, ?, ?, ?, ?)'
        ).bind(sessionId, eventType, tab, label, device, country).run();
      } catch {
        // 수집 실패가 서비스 이용을 막으면 안 된다 — 조용히 무시
      }
      return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*' } });
    }

    // ─── 어드민: 이용현황 요약 ──────────────────────────────────────────────
    if (url.pathname === '/api/v1/admin/analytics/summary') {
      const denied = requireAdmin(request, env);
      if (denied) return denied;
      try {
        const days = Math.min(Math.max(parseInt(url.searchParams.get('days') || '7', 10) || 7, 1), 90);
        const since = `-${days} days`;
        const db = env.DB;

        const [totals, daily, topTabs, topSearches, topCompared, deviceBreakdown, countryBreakdown, topLinks, topNews, crawlers, crawlerPaths, gscTotals, gscQueries, gscPages] = await Promise.all([
          db.prepare(`SELECT COUNT(*) AS events, COUNT(DISTINCT session_id) AS sessions FROM analytics_events WHERE created_at >= datetime('now', ?)`).bind(since).first(),
          db.prepare(`SELECT date(created_at) AS day, COUNT(*) AS events, COUNT(DISTINCT session_id) AS sessions FROM analytics_events WHERE created_at >= datetime('now', ?) GROUP BY day ORDER BY day ASC`).bind(since).all(),
          db.prepare(`SELECT tab AS label, COUNT(*) AS count FROM analytics_events WHERE event_type = 'page_view' AND created_at >= datetime('now', ?) AND tab IS NOT NULL GROUP BY tab ORDER BY count DESC LIMIT 10`).bind(since).all(),
          db.prepare(`SELECT label, COUNT(*) AS count FROM analytics_events WHERE event_type = 'search' AND created_at >= datetime('now', ?) AND label IS NOT NULL GROUP BY label ORDER BY count DESC LIMIT 10`).bind(since).all(),
          db.prepare(`SELECT label, COUNT(*) AS count FROM analytics_events WHERE event_type = 'compare_add' AND created_at >= datetime('now', ?) AND label IS NOT NULL GROUP BY label ORDER BY count DESC LIMIT 10`).bind(since).all(),
          db.prepare(`SELECT device AS label, COUNT(*) AS count FROM analytics_events WHERE created_at >= datetime('now', ?) GROUP BY device`).bind(since).all(),
          db.prepare(`SELECT country AS label, COUNT(*) AS count FROM analytics_events WHERE created_at >= datetime('now', ?) AND country IS NOT NULL GROUP BY country ORDER BY count DESC LIMIT 10`).bind(since).all(),
          db.prepare(`SELECT label, COUNT(*) AS count FROM analytics_events WHERE event_type = 'external_link_click' AND created_at >= datetime('now', ?) AND label IS NOT NULL GROUP BY label ORDER BY count DESC LIMIT 10`).bind(since).all(),
          db.prepare(`SELECT label, COUNT(*) AS count FROM analytics_events WHERE event_type = 'news_open' AND created_at >= datetime('now', ?) AND label IS NOT NULL GROUP BY label ORDER BY count DESC LIMIT 10`).bind(since).all(),
          // 크롤러는 analytics_events 와 분리된 테이블에 쌓인다 — 사람 세션 수를 오염시키지 않는다.
          db.prepare(`SELECT bot AS label, COUNT(*) AS count, MAX(created_at) AS last_seen FROM crawler_hits WHERE created_at >= datetime('now', ?) GROUP BY bot ORDER BY count DESC`).bind(since).all(),
          db.prepare(`SELECT path AS label, COUNT(*) AS count FROM crawler_hits WHERE created_at >= datetime('now', ?) GROUP BY path ORDER BY count DESC LIMIT 10`).bind(since).all(),
          // Search Console 실적. crawler_hits 가 '누가 왔나' 라면 이건 '검색에서
          // 어떻게 보이나' 다. 배치가 매일 최근 5일을 덮어쓴다.
          db.prepare(`SELECT SUM(clicks) AS clicks, SUM(impressions) AS impressions,
                             AVG(position) AS position, MAX(date) AS latest
                      FROM gsc_metrics WHERE dimension = 'query' AND date >= date('now', ?)`).bind(since).first(),
          db.prepare(`SELECT value AS label, SUM(clicks) AS clicks, SUM(impressions) AS impressions,
                             ROUND(AVG(position), 1) AS position
                      FROM gsc_metrics WHERE dimension = 'query' AND date >= date('now', ?)
                      GROUP BY value ORDER BY impressions DESC LIMIT 15`).bind(since).all(),
          db.prepare(`SELECT value AS label, SUM(clicks) AS clicks, SUM(impressions) AS impressions,
                             ROUND(AVG(position), 1) AS position
                      FROM gsc_metrics WHERE dimension = 'page' AND date >= date('now', ?)
                      GROUP BY value ORDER BY impressions DESC LIMIT 15`).bind(since).all(),
        ]);

        return new Response(JSON.stringify({
          days,
          totals: totals || { events: 0, sessions: 0 },
          daily: daily.results,
          top_tabs: topTabs.results,
          top_searches: topSearches.results,
          top_compared: topCompared.results,
          device_breakdown: deviceBreakdown.results,
          country_breakdown: countryBreakdown.results,
          top_external_links: topLinks.results,
          top_news: topNews.results,
          crawlers: crawlers.results,
          crawler_paths: crawlerPaths.results,
          gsc_totals: gscTotals || { clicks: 0, impressions: 0, position: null, latest: null },
          gsc_queries: gscQueries.results,
          gsc_pages: gscPages.results,
        }), { headers: { 'Content-Type': 'application/json' } });
      } catch (err: any) {
        return fail(err);
      }
    }

    // ─── 어드민 페이지 서빙 (/admin) ────────────────────────────────────────
    // Cloudflare 정적 자산은 clean-URL 규칙상 /admin.html 요청 자체를 /admin 으로
    // 되돌려 리다이렉트한다. 그래서 경로를 .html 로 재작성하지 않고 원본 요청을
    // 그대로 ASSETS 에 넘겨 admin.html 이 /admin 에서 바로 서빙되게 한다.
    if (url.pathname === '/admin' || url.pathname === '/admin/') {
      const denied = requireAdmin(request, env);
      if (denied) return denied;
      return env.ASSETS.fetch(request);
    }

    // D1 Edge API Routes - Models
    if (url.pathname === '/api/v1/models') {
      try {
        const lang = url.searchParams.get('lang') || 'ko';
        // 피드에서 사라진 모델은 가격이 갱신되지 않는다. 기본 목록에서 빼되
        // 데이터는 남겨 두고, 필요하면 ?include_deprecated=1 로 볼 수 있게 한다.
        const withDeprecated = url.searchParams.get('include_deprecated') === '1';
        const { results } = await env.DB.prepare(
          withDeprecated
            ? 'SELECT * FROM models ORDER BY is_verified DESC, name ASC'
            : 'SELECT * FROM models WHERE is_deprecated = 0 ORDER BY is_verified DESC, name ASC'
        ).all();

        const models = results.map((m: any) => ({
          ...m,
          description: localizedDescription(m, lang),
          description_i18n: undefined,   // 전 언어 번역본을 매 요청에 실어 보낼 이유가 없다
          is_open_weight: Boolean(m.is_open_weight),
          is_verified: Boolean(m.is_verified),
          supports_reasoning: Boolean(m.supports_reasoning),
          supports_web_search: Boolean(m.supports_web_search),
          is_deprecated: Boolean(m.is_deprecated),
          is_new: isNewModel(m.first_seen_at),
          modality: typeof m.modality === 'string' ? JSON.parse(m.modality || '[]') : m.modality,
          api_pricing: typeof m.api_pricing === 'string' ? JSON.parse(m.api_pricing || '{}') : m.api_pricing,
          quota: typeof m.quota === 'string' ? JSON.parse(m.quota || '{}') : m.quota,
          benchmarks: typeof m.benchmarks === 'string' ? JSON.parse(m.benchmarks || '{}') : m.benchmarks,
          hardware_requirements: typeof m.hardware_requirements === 'string' ? JSON.parse(m.hardware_requirements || '{}') : m.hardware_requirements,
        }));

        return new Response(JSON.stringify(models), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=60, s-maxage=3600',
          },
        });
      } catch (err: any) {
        return fail(err);
      }
    }

    if (url.pathname.startsWith('/api/v1/models/')) {
      const modelId = url.pathname.replace('/api/v1/models/', '');
      try {
        const m: any = await env.DB.prepare('SELECT * FROM models WHERE id = ?').bind(modelId).first();
        if (!m) {
          return new Response(JSON.stringify({ error: 'Model not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          });
        }
        const model = {
          ...m,
          is_open_weight: Boolean(m.is_open_weight),
          is_verified: Boolean(m.is_verified),
          supports_reasoning: Boolean(m.supports_reasoning),
          supports_web_search: Boolean(m.supports_web_search),
          is_deprecated: Boolean(m.is_deprecated),
          is_new: isNewModel(m.first_seen_at),
          modality: typeof m.modality === 'string' ? JSON.parse(m.modality || '[]') : m.modality,
          api_pricing: typeof m.api_pricing === 'string' ? JSON.parse(m.api_pricing || '{}') : m.api_pricing,
          quota: typeof m.quota === 'string' ? JSON.parse(m.quota || '{}') : m.quota,
          benchmarks: typeof m.benchmarks === 'string' ? JSON.parse(m.benchmarks || '{}') : m.benchmarks,
          hardware_requirements: typeof m.hardware_requirements === 'string' ? JSON.parse(m.hardware_requirements || '{}') : m.hardware_requirements,
        };

        return new Response(JSON.stringify(model), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=60, s-maxage=3600',
          },
        });
      } catch (err: any) {
        return fail(err);
      }
    }

    // D1 Edge API Routes - Trend News Pulse & Articles
    if (url.pathname === '/api/v1/news/pulse' || url.pathname.startsWith('/api/v1/news/pulse')) {
      try {
        const targetLens = url.searchParams.get('lens');
        const { results } = await env.DB.prepare('SELECT * FROM trend_news ORDER BY created_at DESC').all();

        let articles = results.map((n: any) => buildArticle(n));

        if (targetLens && targetLens !== 'all' && targetLens !== 'new') {
          if (targetLens === 'synthesized') {
            articles = articles.filter(a => a.is_synthesized || a.matched_lenses.includes('synthesized') || a.category?.includes('융합'));
          } else {
            articles = articles.filter(a => a.matched_lenses.includes(targetLens));
          }
        }

        return new Response(JSON.stringify({
          articles,
          total_count: articles.length,
          last_updated: new Date().toISOString()
        }), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=60, s-maxage=3600',
          },
        });
      } catch (err: any) {
        return fail(err);
      }
    }

    if (url.pathname.startsWith('/api/v1/news/articles/')) {
      const articleId = url.pathname.replace('/api/v1/news/articles/', '');
      try {
        const n: any = await env.DB.prepare('SELECT * FROM trend_news WHERE id = ?').bind(articleId).first();
        if (!n) {
          return new Response(JSON.stringify({ error: 'Article not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          });
        }

        const article: any = buildArticle(n);

        // 기사에 언급된 모델의 가격·벤치마크를 조회 시점에 붙인다. 기사 작성 시점에
        // 얼려두면 주간 동기화 뒤 틀린 값이 된다. 생성이 아니라 조회이므로 환각이 없다.
        const ids: string[] = safeJson(n.mentioned_models, []);
        if (ids.length) {
          const ph = ids.map(() => '?').join(',');
          const { results } = await env.DB.prepare(
            `SELECT id, name, provider_name, tier, context_window, api_pricing, benchmarks
             FROM models WHERE id IN (${ph}) AND is_deprecated = 0`
          ).bind(...ids).all();
          article.mentioned_models = results.map((m: any) => ({
            ...m,
            api_pricing: safeJson(m.api_pricing, {}),
            benchmarks: safeJson(m.benchmarks, {}),
          }));
        } else {
          article.mentioned_models = [];
        }

        return new Response(JSON.stringify(article), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=60, s-maxage=3600',
          },
        });
      } catch (err: any) {
        return fail(err);
      }
    }

    // Fallthrough to Static Assets (Frontend)
    return env.ASSETS.fetch(request);
  },
  },
);
