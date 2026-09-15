import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { API_BASE_URL } from './api';
import { firstTouchSource, markInternal, track } from './analytics';

// 6주 전략의 기준선이 이 파일에 달려 있다. 9/15 이전에는 구글봇 렌더링과 운영자 점검 방문이
// 사람 방문으로 섞여 30일 세션이 미국 74·한국 12 인데 검색 클릭은 0 이었다.

const setUrl = (search: string) => window.history.replaceState({}, '', `/${search}`);
const referrer = (value: string) => Object.defineProperty(document, 'referrer', { value, configurable: true });

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  setUrl('');
  referrer('');
  Object.defineProperty(navigator, 'webdriver', { value: false, configurable: true });
  vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response(null, { status: 204 }))));
});
afterEach(() => vi.unstubAllGlobals());

const sentBody = () => JSON.parse((fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1].body);

test('utm_source 가 있으면 그것을 첫 유입으로 쓴다', () => {
  setUrl('?utm_source=disquiet&utm_medium=maker_log');
  expect(firstTouchSource()).toBe('disquiet');
});

test('utm 이 없으면 외부 리퍼러 호스트, 그것도 없으면 direct', () => {
  referrer('https://www.news.hada.io/topic?id=1');
  expect(firstTouchSource()).toBe('news.hada.io');
  sessionStorage.clear();
  referrer('');
  expect(firstTouchSource()).toBe('direct');
});

test('SPA 안에서 탭을 옮겨도 첫 유입을 유지한다', () => {
  setUrl('?utm_source=reddit');
  expect(firstTouchSource()).toBe('reddit');
  setUrl('?tab=compare');
  expect(firstTouchSource()).toBe('reddit');
});

test('page_view 에 첫 유입 경로가 실린다', () => {
  setUrl('?utm_source=geeknews');
  track('page_view', { tab: 'dashboard' });
  expect(sentBody().source).toBe('geeknews');
});

test('?internal=1 로 표시한 브라우저는 기록하지 않고, ?internal=0 으로 되돌린다', () => {
  setUrl('?internal=1');
  track('page_view');
  expect(fetch).not.toHaveBeenCalled();
  setUrl('?internal=0');
  track('page_view');
  expect(fetch).toHaveBeenCalledTimes(1);
});

test('어드민이 표시한 운영자 브라우저는 기록하지 않는다', () => {
  markInternal(true);
  track('news_open', { label: 'x' });
  expect(fetch).not.toHaveBeenCalled();
});

test('자동화 브라우저(navigator.webdriver)는 기록하지 않는다', () => {
  Object.defineProperty(navigator, 'webdriver', { value: true, configurable: true });
  track('page_view');
  expect(fetch).not.toHaveBeenCalled();
});

// ── 기존 테스트 (세션 유지·전송 형식·실패 무해성) ──────────────────────────
test('persists a session id across calls', () => {
  // 세션 id 는 모듈 메모리에도 캐시되므로, 저장소가 아니라 실제로 전송된 값으로 확인한다.
  track('page_view', { tab: 'dashboard' });
  track('page_view', { tab: 'compare' });
  const calls = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls;
  const [a, b] = calls.map((c) => JSON.parse(c[1].body).session_id);
  expect(a).toBeTruthy();
  expect(b).toBe(a);
});

test('posts to the tracking endpoint with the session id and event type', () => {
  track('search', { label: 'gpt-4' });
  expect(fetch).toHaveBeenCalledWith(
    `${API_BASE_URL}/analytics/track`,
    expect.objectContaining({ method: 'POST', keepalive: true })
  );
  const body = sentBody();
  expect(body).toMatchObject({ event_type: 'search', label: 'gpt-4' });
  expect(body.session_id).toBeTruthy();
});

test('never throws even if fetch is unavailable', () => {
  vi.stubGlobal('fetch', undefined);
  expect(() => track('news_open', { label: 'x' })).not.toThrow();
});
