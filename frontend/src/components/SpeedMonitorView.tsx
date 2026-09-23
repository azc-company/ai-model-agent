// 같은 모델을 여러 프로바이더가 서빙할 때의 비교.
//
// 예전에는 이 파일 안에 손으로 적은 프로바이더 6줄이 상수로 박혀 있었고, 화면은
// 그것을 "실시간"이라고 불렀다. 2026-08-13 에 넣은 값이 41일 동안 그대로였고
// 가동률 99.9 같은 수치는 측정 주체가 없었다.
//
// 지금은 /api/v1/provider-endpoints 가 주 1회 동기화된 실제 값을 준다.
// TTFT·TPS 는 OpenRouter 공개 API 가 null 로만 내주므로 값이 있는 경우에만 그린다.
import React, { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface ProviderEndpoint {
  provider_name: string;
  tag: string;
  quantization: string | null;
  context_length: number | null;
  max_output_tokens: number | null;
  input_per_1m: number | null;
  output_per_1m: number | null;
  uptime_30m: number | null;
  uptime_1d: number | null;
  latency_ms: number | null;
  throughput_tps: number | null;
}

interface ModelEndpoints {
  model_id: string;
  model_slug: string;
  model_name: string;
  updated_at: string;
  providers: ProviderEndpoint[];
}

type Metric = 'output' | 'input' | 'uptime';

const CHART_COLORS = [
  'var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)',
  'var(--chart-4)', 'var(--chart-5)', 'var(--chart-6)',
];

export const SpeedMonitorView: React.FC = () => {
  const { t } = useLanguage();
  const [models, setModels] = useState<ModelEndpoints[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [slug, setSlug] = useState<string>('');
  const [metric, setMetric] = useState<Metric>('output');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetch('/api/v1/provider-endpoints')
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        setModels(d.models || []);
        setUpdatedAt(d.updated_at || null);
        setSlug(d.models?.[0]?.model_slug || '');
      })
      .catch(() => { if (alive) setModels([]); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const current = useMemo(
    () => models.find((m) => m.model_slug === slug) || models[0],
    [models, slug],
  );

  // 단가는 낮은 순, 가동률은 높은 순. 값이 없는 프로바이더는 뒤로 민다.
  const rows = useMemo(() => {
    if (!current) return [];
    const pick = (p: ProviderEndpoint) =>
      metric === 'uptime' ? p.uptime_30m : metric === 'input' ? p.input_per_1m : p.output_per_1m;
    return [...current.providers]
      .filter((p) => pick(p) != null)
      .sort((a, b) => {
        const av = pick(a) as number, bv = pick(b) as number;
        return metric === 'uptime' ? bv - av : av - bv;
      })
      .map((p, i) => ({
        ...p,
        // 같은 프로바이더가 여러 구성을 올리므로 tag 로 구분해 보여준다.
        label: p.tag && p.tag !== p.provider_name ? p.tag : p.provider_name,
        value: pick(p) as number,
        color: CHART_COLORS[i % CHART_COLORS.length],
      }));
  }, [current, metric]);

  const hasSpeed = Boolean(current?.providers.some((p) => p.throughput_tps != null));
  const num = (n: number | null | undefined, digits = 2) =>
    n == null ? t.speed.unknown : n.toLocaleString(undefined, { maximumFractionDigits: digits });

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-16 text-center text-muted font-semibold">{t.speed.loading}…</div>;
  }
  if (!current) {
    return <div className="max-w-7xl mx-auto px-4 py-16 text-center text-muted font-semibold">{t.speed.empty}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-black shadow-sm">
          ⚖️ {t.speed.badge}
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          {t.speed.subtitle}
        </h1>
        <p className="text-muted text-sm sm:text-base font-semibold max-w-3xl mx-auto leading-relaxed">
          {t.speed.description}
        </p>
        {/* 값이 언제 것인지 화면에서 바로 보이게 둔다. 예전 화면이 실패한 지점이다. */}
        <p className="text-2xs text-muted font-bold font-mono">
          {t.speed.asOf} {(updatedAt || '').slice(0, 10)} · {t.speed.source}: OpenRouter
        </p>
      </div>

      {/* Control Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 shadow-md backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <label htmlFor="speed-model" className="text-xs font-extrabold text-slate-700 dark:text-slate-300 mr-1">
            {t.speed.targetModel}
          </label>
          <select
            id="speed-model"
            value={current.model_slug}
            onChange={(e) => setSlug(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 max-w-full"
          >
            {models.map((m) => (
              <option key={m.model_slug} value={m.model_slug}>
                {m.model_name} ({m.providers.length}{t.speed.providerCount})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
          {([
            ['output', t.speed.metricOutput],
            ['input', t.speed.metricInput],
            ['uptime', t.speed.metricUptime],
          ] as [Metric, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setMetric(key)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition ${
                metric === key
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-muted hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart & Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-4 shadow-md backdrop-blur-md">
          <h3 className="text-sm font-black text-slate-900 dark:text-white">
            {t.speed.chartTitle}{' '}
            {metric === 'uptime' ? t.speed.metricUptime
              : `${metric === 'input' ? t.speed.metricInput : t.speed.metricOutput} (${t.speed.unitPer1M})`}
          </h3>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" horizontal={false} />
                <XAxis type="number" stroke="#64748b" tick={{ fill: '#475569', fontSize: 11, fontWeight: 'bold' }}
                       domain={metric === 'uptime' ? [0, 100] : undefined} />
                <YAxis dataKey="label" type="category" width={110} stroke="#64748b"
                       tick={{ fill: '#0f172a', fontSize: 11, fontWeight: 'bold' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '12px', color: '#0f172a', fontWeight: 'bold' }}
                  formatter={(value: any) => [
                    metric === 'uptime' ? `${Number(value).toFixed(2)}%` : `$${Number(value).toFixed(2)}`,
                    metric === 'uptime' ? t.speed.colUptime : t.speed.unitPer1M,
                  ]}
                />
                <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                  {rows.map((r, i) => <Cell key={i} fill={r.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-3">
          <h3 className="text-sm font-black text-slate-900 dark:text-white px-1">{t.speed.rankTitle}</h3>
          <div tabIndex={0} className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {rows.map((p, idx) => (
              <div
                key={p.tag}
                className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/40 shadow-sm transition flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center font-black text-xs"
                    style={{ backgroundColor: `${p.color}15`, color: p.color, border: `1px solid ${p.color}40` }}
                  >
                    #{idx + 1}
                  </div>
                  <div className="min-w-0">
                    <div className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2 flex-wrap">
                      <span className="truncate">{p.provider_name}</span>
                      {idx === 0 && metric !== 'uptime' && (
                        <span className="text-2xs bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 px-1.5 py-0.5 rounded font-black border border-amber-300">
                          {t.speed.cheapest}
                        </span>
                      )}
                    </div>
                    <div className="text-2xs text-muted font-bold font-mono truncate">
                      {t.speed.colQuant} {p.quantization || t.speed.unknown}
                      {p.context_length ? ` · ${t.speed.colCtx} ${num(p.context_length, 0)}` : ''}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-sm font-black text-indigo-600 dark:text-cyan-400 font-mono">
                    {metric === 'uptime' ? `${num(p.uptime_30m)}%` : `$${num(p.value)}`}
                  </div>
                  <div className="text-xs text-muted font-bold font-mono">
                    {metric === 'uptime'
                      ? `${t.speed.metricOutput} $${num(p.output_per_1m)}`
                      : `${t.speed.colUptime} ${num(p.uptime_30m)}%`}
                  </div>
                  {p.throughput_tps != null && (
                    <div className="text-2xs text-muted font-bold font-mono">{num(p.throughput_tps, 0)} TPS</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 없는 값을 없다고 말한다. 예전 화면은 이 자리에서 "실시간"이라고 했다. */}
      {!hasSpeed && (
        <p className="text-xs text-muted font-semibold leading-relaxed border-l-2 border-slate-300 dark:border-slate-700 pl-3 max-w-3xl">
          {t.speed.speedNote}
        </p>
      )}
    </div>
  );
};
