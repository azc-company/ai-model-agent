import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { API_BASE_URL } from '../api';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { AdminApp } from './AdminApp';

afterEach(cleanup);

const SUMMARY = {
  days: 7,
  totals: { events: 12, sessions: 4 },
  daily: [{ day: '2026-08-28', events: 12, sessions: 4 }],
  top_tabs: [{ label: 'dashboard', count: 8 }],
  top_searches: [{ label: 'gpt-4', count: 2 }],
  top_compared: [{ label: 'gpt-4o', count: 3 }],
  device_breakdown: [{ label: 'desktop', count: 9 }, { label: 'mobile', count: 3 }],
  country_breakdown: [{ label: 'KR', count: 12 }],
  top_external_links: [],
  top_news: [],
  crawlers: [{ label: 'GPTBot', count: 12, last_seen: '2026-08-31 09:00:00' }],
  crawler_paths: [{ label: '/models/gpt-4o', count: 5 }],
};

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response(JSON.stringify(SUMMARY), { status: 200 }))));
});

test('renders KPI totals from the summary endpoint', async () => {
  render(<AdminApp />);
  await waitFor(() => expect(screen.getByText('총 이벤트')).toBeInTheDocument());
  expect(screen.getByText('순 방문 세션')).toBeInTheDocument();
  expect(fetch).toHaveBeenCalledWith(`${API_BASE_URL}/admin/analytics/summary?days=7`);
});

test('re-fetches when the date range changes', async () => {
  render(<AdminApp />);
  await waitFor(() => expect(screen.getByText('총 이벤트')).toBeInTheDocument());
  await userEvent.click(screen.getByRole('button', { name: '최근 30일' }));
  await waitFor(() => expect(fetch).toHaveBeenLastCalledWith(`${API_BASE_URL}/admin/analytics/summary?days=30`));
});

test('shows a readable message on 401', async () => {
  vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response(null, { status: 401 }))));
  render(<AdminApp />);
  await waitFor(() => expect(screen.getByText(/인증이 필요합니다/)).toBeInTheDocument());
});

// GSC 실적은 배포 직후 몇 주간 비어 있어 실측으로 확인할 수 없다. 두 경로를
// 모두 테스트로 고정해 둔다.
test('shows the weekly KPI card with week-over-week change', async () => {
  const withWeekly = { ...SUMMARY, sources: [{ label: 'disquiet', count: 5 }],
    weekly: { sessions: 30, sessions_prev: 20, impressions: 300, impressions_prev: 0, clicks: 4, clicks_prev: 2, pages_28d: 57, gsc_latest: '2026-09-12' } };
  vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response(JSON.stringify(withWeekly), { status: 200 }))));
  render(<AdminApp />);
  await waitFor(() => expect(screen.getByText(/주간 핵심 지표/)).toBeInTheDocument());
  expect(screen.getByText('+50%')).toBeInTheDocument();      // 세션 30 vs 20
  expect(screen.getByText('신규')).toBeInTheDocument();       // 이전 주 노출 0
  expect(screen.getByText('57')).toBeInTheDocument();
  expect(screen.getByText('disquiet')).toBeInTheDocument();
  expect(localStorage.getItem('llmc_internal')).toBe('1');   // 어드민을 연 브라우저는 내부 방문으로 표시
});

test('shows a waiting message while Search Console has no data', async () => {
  render(<AdminApp />);
  await waitFor(() => expect(screen.getByText('🔎 검색 유입 (Search Console)')).toBeInTheDocument());
  expect(screen.getByText(/아직 검색 실적이 없다/)).toBeInTheDocument();
});

test('renders Search Console queries and pages once data arrives', async () => {
  const withGsc = {
    ...SUMMARY,
    gsc_totals: { clicks: 42, impressions: 1580, position: 12.34, latest: '2026-09-04' },
    gsc_queries: [{ label: 'llm 가격 비교', clicks: 30, impressions: 900, position: 8.2 }],
    gsc_pages: [{ label: 'https://llmcompass.azclab.com/models/gpt-4o', clicks: 12, impressions: 680, position: 15.1 }],
  };
  vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response(JSON.stringify(withGsc), { status: 200 }))));
  render(<AdminApp />);
  await waitFor(() => expect(screen.getByText('llm 가격 비교')).toBeInTheDocument());
  expect(screen.getByText('1,580')).toBeInTheDocument();   // 노출 합계
  expect(screen.getByText('12.3')).toBeInTheDocument();    // 평균 순위
  expect(screen.getByText(/최신 데이터 2026-09-04/)).toBeInTheDocument();
});
