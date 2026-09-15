// 익명 사용 로그. 개인 식별 정보는 보내지 않는다 — 세션 단위 UUID만 로컬에 저장.
import { API_BASE_URL } from './api';
export type AnalyticsEvent = 'page_view' | 'search' | 'compare_add' | 'compare_remove' | 'external_link_click' | 'news_open';

let cachedSessionId: string | null = null;

function getSessionId(): string {
  if (cachedSessionId) return cachedSessionId;
  try {
    const key = 'llmc_sid';
    let id = localStorage.getItem(key);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(key, id);
    }
    cachedSessionId = id;
    return id;
  } catch {
    // 프라이빗 브라우징 등 localStorage 차단 시에도 이번 페이지뷰 동안은 세션을 유지
    cachedSessionId = crypto.randomUUID();
    return cachedSessionId;
  }
}

const INTERNAL_KEY = 'llmc_internal';
const SOURCE_KEY = 'llmc_src';

// 운영자 브라우저는 집계에서 뺀다. 개발·점검 방문이 실제 방문자처럼 쌓이면 기준선이 틀어진다.
// 한 번 ?internal=1 로 들어오면 이 브라우저는 계속 제외되고, ?internal=0 으로 되돌린다.
// 어드민에 로그인한 브라우저도 자동으로 표시한다(AdminApp 에서 markInternal 호출).
export function markInternal(on = true): void {
  try {
    if (on) localStorage.setItem(INTERNAL_KEY, '1');
    else localStorage.removeItem(INTERNAL_KEY);
  } catch { /* 저장소 차단 시 무시 */ }
}

function isExcluded(): boolean {
  try {
    const flag = new URLSearchParams(window.location.search).get('internal');
    if (flag === '1') markInternal(true);
    if (flag === '0') markInternal(false);
    // 자동화 브라우저(Playwright·Puppeteer·헤드리스 크롬)는 사람 방문이 아니다.
    if (navigator.webdriver) return true;
    return localStorage.getItem(INTERNAL_KEY) === '1';
  } catch {
    return false;
  }
}

// 이 탭에서 처음 들어온 경로. utm_source → 외부 리퍼러 호스트 → direct 순.
// SPA 안에서 탭을 옮겨도 첫 유입을 유지해야 채널별 효과를 가를 수 있다.
export function firstTouchSource(): string {
  try {
    const cached = sessionStorage.getItem(SOURCE_KEY);
    if (cached) return cached;
    const utm = new URLSearchParams(window.location.search).get('utm_source');
    let source = 'direct';
    if (utm) {
      source = utm;
    } else if (document.referrer) {
      const host = new URL(document.referrer).hostname.replace(/^www\./, '');
      if (host && host !== window.location.hostname) source = host;
    }
    source = source.toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 60) || 'direct';
    sessionStorage.setItem(SOURCE_KEY, source);
    return source;
  } catch {
    return 'direct';
  }
}

export function track(eventType: AnalyticsEvent, options: { tab?: string; label?: string } = {}): void {
  try {
    if (isExcluded()) return;
    const payload = JSON.stringify({
      source: firstTouchSource(),
      session_id: getSessionId(),
      event_type: eventType,
      tab: options.tab,
      label: options.label,
      device: window.innerWidth < 768 ? 'mobile' : 'desktop',
    });
    fetch(`${API_BASE_URL}/analytics/track`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true }).catch(() => {});
  } catch {
    // 추적 실패가 실제 기능을 막으면 안 된다
  }
}
