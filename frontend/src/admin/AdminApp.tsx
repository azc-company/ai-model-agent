import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../api';
import { markInternal } from '../analytics';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface CountRow { label: string; count: number }
interface CrawlerRow extends CountRow { last_seen: string }
interface DailyRow { day: string; events: number; sessions: number }
interface Summary {
  days: number;
  totals: { events: number; sessions: number };
  daily: DailyRow[];
  top_tabs: CountRow[];
  top_searches: CountRow[];
  top_compared: CountRow[];
  device_breakdown: CountRow[];
  country_breakdown: CountRow[];
  top_external_links: CountRow[];
  top_news: CountRow[];
  crawlers: CrawlerRow[];
  crawler_paths: CountRow[];
  gsc_totals: { clicks: number; impressions: number; position: number | null; latest: string | null };
  gsc_queries: SearchRow[];
  gsc_pages: SearchRow[];
  sources?: CountRow[];
  weekly?: Weekly | null;
}

// 최근 7일 vs 그 전 7일. 6주 전략의 북극성(실사용 세션)과 검색 지표를 한 줄로 본다.
type Weekly = {
  sessions: number; sessions_prev: number;
  impressions: number; impressions_prev: number;
  clicks: number; clicks_prev: number;
  pages_28d: number; gsc_latest: string | null;
};

// 봇·내부 방문 제외 집계를 시작한 날. 이전 수치는 구글봇 렌더링이 사람 방문으로 섞여 있다.
const CLEAN_TRACKING_SINCE = '2026-09-15';

function WeeklyCard({ w }: { w: Weekly }) {
  const delta = (now: number, prev: number) => {
    if (!prev) return now ? '신규' : '—';
    const pct = Math.round(((now - prev) / prev) * 100);
    return `${pct >= 0 ? '+' : ''}${pct}%`;
  };
  const items: Array<[string, number, string]> = [
    ['실사용 세션', w.sessions, delta(w.sessions, w.sessions_prev)],
    ['검색 노출', w.impressions, delta(w.impressions, w.impressions_prev)],
    ['검색 클릭', w.clicks, delta(w.clicks, w.clicks_prev)],
    ['노출 발생 페이지 (28일)', w.pages_28d, ''],
  ];
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-black text-slate-900">🧭 주간 핵심 지표 · 최근 7일 vs 이전 7일</h3>
        <p className="text-2xs text-muted">
          세션은 {CLEAN_TRACKING_SINCE} 부터 봇·내부 방문 제외 · 검색은 GSC 최신 {w.gsc_latest ?? '—'} 기준
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {items.map(([label, value, d]) => (
          <div key={label}>
            <div className="text-2xs font-bold text-muted">{label}</div>
            <div className="text-2xl font-black text-slate-900 numeric">{value.toLocaleString()}</div>
            {d && <div className="text-2xs font-bold text-muted numeric">{d}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

// Search Console 실적. crawler_hits 가 "누가 왔나" 라면 이건 "검색에서 어떻게 보이나" 다.
type SearchRow = { label: string; clicks: number; impressions: number; position: number };

const RANGE_OPTIONS = [7, 14, 30] as const;

function SearchTable({ title, rows }: { title: string; rows: SearchRow[] }) {
  if (!rows.length) return null;
  return (
    <div className="mt-3">
      <div className="mb-1 text-2xs font-bold text-muted">{title}</div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-2xs text-muted">
              <th className="py-1 text-left font-bold">&nbsp;</th>
              <th className="py-1 text-right font-bold">클릭</th>
              <th className="py-1 text-right font-bold">노출</th>
              <th className="py-1 text-right font-bold">순위</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-t border-slate-100">
                <td className="max-w-[16rem] truncate py-1 pr-2 font-semibold text-slate-700" title={r.label}>
                  {r.label}
                </td>
                <td className="py-1 text-right numeric font-bold text-slate-900">{r.clicks.toLocaleString()}</td>
                <td className="py-1 text-right numeric text-muted">{r.impressions.toLocaleString()}</td>
                <td className="py-1 text-right numeric text-muted">{r.position?.toFixed?.(1) ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-xs font-bold text-muted">{label}</div>
      <div className="mt-1 text-2xl font-black text-slate-900 numeric">{value}</div>
    </div>
  );
}

function RankedList({ title, rows, emptyLabel = '데이터 없음' }: { title: string; rows: CountRow[]; emptyLabel?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-3 text-sm font-black text-slate-900">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-xs text-muted">{emptyLabel}</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li key={row.label} className="flex items-center justify-between gap-3 text-xs">
              <span className="truncate font-semibold text-slate-700">{row.label}</span>
              <span className="numeric shrink-0 font-black text-indigo-600">{row.count}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export const AdminApp: React.FC = () => {
  const [days, setDays] = useState<number>(7);
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 어드민을 여는 브라우저는 운영자다. 이후 사이트 방문을 실사용 집계에서 뺀다.
  useEffect(() => { markInternal(true); }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`${API_BASE_URL}/admin/analytics/summary?days=${days}`)
      .then((res) => {
        if (res.status === 401) throw new Error('인증이 필요합니다. 페이지를 새로고침해 로그인하세요.');
        if (!res.ok) throw new Error(`서버 오류 (${res.status})`);
        return res.json();
      })
      .then((json) => { if (!cancelled) setData(json); })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [days]);

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black">📊 이용현황 & 고객행동 모니터링</h1>
            <p className="text-xs text-muted">LLM COMPASS 내부 어드민 · 개인정보 없이 세션 단위로만 집계</p>
          </div>
          <div className="flex gap-1.5 rounded-xl border border-slate-200 bg-white p-1">
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option}
                onClick={() => setDays(option)}
                className={`touch-target focus-ring rounded-lg px-3 py-1.5 text-xs font-black transition ${
                  days === option ? 'bg-indigo-600 text-white' : 'text-muted hover:bg-slate-100'
                }`}
              >
                최근 {option}일
              </button>
            ))}
          </div>
        </header>

        {loading && <p className="text-sm text-muted">불러오는 중…</p>}
        {error && <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-danger">{error}</p>}

        {data?.weekly && <WeeklyCard w={data.weekly} />}

        {data && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <KpiCard label="총 이벤트" value={data.totals.events} />
              <KpiCard label="순 방문 세션" value={data.totals.sessions} />
              <KpiCard
                label="세션당 평균 이벤트"
                value={data.totals.sessions > 0 ? (data.totals.events / data.totals.sessions).toFixed(1) : '0'}
              />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-sm font-black text-slate-900">일별 추이</h3>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={data.daily}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="events" name="이벤트" stroke="#4f46e5" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="sessions" name="세션" stroke="#06b6d4" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-3 text-sm font-black text-slate-900">메뉴별 조회수</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.top_tabs} layout="vertical" margin={{ left: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                    <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} width={90} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#4f46e5" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <RankedList title="🔍 인기 검색어" rows={data.top_searches} />
              <RankedList title="⚖️ 많이 비교한 모델" rows={data.top_compared} />
              <RankedList title="📰 많이 읽은 기사" rows={data.top_news} />
              <RankedList title="🔗 많이 클릭한 공식 문서" rows={data.top_external_links} />

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-1 text-sm font-black text-slate-900">🤖 크롤러 방문</h3>
                <p className="mb-3 text-2xs text-muted">
                  AI 크롤러가 실제로 콘텐츠를 읽어 가는지 본다. User-Agent 는 위조 가능하므로 추세 지표로만 쓴다.
                </p>
                {(data.crawlers ?? []).length === 0 ? (
                  <p className="text-xs text-muted">아직 방문 기록이 없다. 색인에는 보통 며칠이 걸린다.</p>
                ) : (
                  <ul className="space-y-2">
                    {(data.crawlers ?? []).map((row) => (
                      <li key={row.label} className="flex items-center justify-between gap-3 text-xs">
                        <span className="font-semibold text-slate-700">{row.label}</span>
                        <span className="flex items-center gap-2 text-muted">
                          <span className="tabular-nums font-bold text-slate-900">{row.count.toLocaleString()}</span>
                          <span className="text-2xs">{(row.last_seen || '').slice(0, 16)}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <RankedList title="🚪 첫 유입 경로 (세션)" rows={data.sources ?? []} emptyLabel="기록 없음 — 9/15 배포 이후부터 쌓인다" />
              <RankedList title="🕸️ 크롤러가 많이 읽은 경로" rows={data.crawler_paths ?? []} />

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-1 text-sm font-black text-slate-900">🔎 검색 유입 (Search Console)</h3>
                <p className="mb-3 text-2xs text-muted">
                  구글이 2~3일 뒤에 확정하는 값이라 최근 이틀은 비어 있을 수 있다.
                  {data.gsc_totals?.latest ? ` 최신 데이터 ${data.gsc_totals.latest}.` : ''}
                </p>
                {(data.gsc_queries ?? []).length === 0 ? (
                  <p className="text-xs text-muted">
                    아직 검색 실적이 없다. 사이트맵 제출 후 색인·노출까지 보통 1~2주가 걸린다.
                  </p>
                ) : (
                  <>
                    <div className="mb-4 grid grid-cols-3 gap-3">
                      <div>
                        <div className="text-2xs font-bold text-muted">클릭</div>
                        <div className="text-lg font-black text-slate-900 numeric">
                          {(data.gsc_totals?.clicks ?? 0).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-2xs font-bold text-muted">노출</div>
                        <div className="text-lg font-black text-slate-900 numeric">
                          {(data.gsc_totals?.impressions ?? 0).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-2xs font-bold text-muted">평균 순위</div>
                        <div className="text-lg font-black text-slate-900 numeric">
                          {data.gsc_totals?.position ? data.gsc_totals.position.toFixed(1) : '-'}
                        </div>
                      </div>
                    </div>
                    <SearchTable title="검색어" rows={data.gsc_queries ?? []} />
                    <SearchTable title="유입 페이지" rows={data.gsc_pages ?? []} />
                  </>
                )}
              </div>


              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-3 text-sm font-black text-slate-900">디바이스 비중</h3>
                <ul className="space-y-2">
                  {data.device_breakdown.map((row) => (
                    <li key={row.label} className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">{row.label === 'mobile' ? '📱 모바일' : '🖥️ 데스크톱'}</span>
                      <span className="numeric font-black text-indigo-600">{row.count}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <RankedList title="🌍 접속 국가" rows={data.country_breakdown} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};
