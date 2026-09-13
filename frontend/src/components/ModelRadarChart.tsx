import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';
import type { ModelSpec } from '../types';

interface ModelRadarChartProps {
  models: ModelSpec[];
}

const RADAR_COLORS = [
  '#6366f1', // Indigo
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#a855f7', // Purple
  '#f59e0b', // Amber
  '#ec4899', // Pink
];

export const ModelRadarChart: React.FC<ModelRadarChartProps> = ({ models }) => {
  if (!models || models.length === 0) return null;

  // 정규화 헬퍼 함수 (0 ~ 100 점수 변환)
  // 값이 없으면 0 이다. 예전에는 50 을 돌려줘서 데이터가 없는 모델이 중간 성적처럼 그려졌다.
  // 척도는 현재 LMArena 범위(하위 10% ~1080, 최고 ~1510)에 맞춘다.
  const normalizeElo = (elo?: number | null) => {
    if (!elo) return 0;
    return Math.min(100, Math.max(0, ((elo - 1000) / 500) * 100));
  };

  const normalizeContext = (ctx?: number) => {
    if (!ctx) return 40;
    const logCtx = Math.log2(ctx);
    return Math.min(100, Math.max(10, ((logCtx - 13) / 7) * 100));
  };

  const normalizeGpqa = (gpqa?: number | null) => (gpqa ? Math.min(100, Math.max(0, gpqa)) : 0);

  const normalizeCostEfficiency = (inputPricePer1M: number) => {
    if (inputPricePer1M === 0) return 100;
    const score = 100 - (inputPricePer1M / 15) * 90;
    return Math.min(100, Math.max(10, score));
  };

  const radarData = [
    {
      subject: '사용자 선호 (LMArena)',
      fullMark: 100,
      ...models.reduce((acc, m) => {
        acc[m.name] = Math.round(normalizeElo(m.benchmarks?.arena_elo));
        return acc;
      }, {} as Record<string, number>)
    },
    {
      subject: '컨텍스트 윈도우',
      fullMark: 100,
      ...models.reduce((acc, m) => {
        acc[m.name] = Math.round(normalizeContext(m.context_window));
        return acc;
      }, {} as Record<string, number>)
    },
    {
      subject: '대학원 수준 추론 (GPQA Diamond)',
      fullMark: 100,
      ...models.reduce((acc, m) => {
        acc[m.name] = Math.round(normalizeGpqa(m.benchmarks?.gpqa));
        return acc;
      }, {} as Record<string, number>)
    },
    {
      subject: '비용 효율성 ($/1M)',
      fullMark: 100,
      ...models.reduce((acc, m) => {
        acc[m.name] = Math.round(normalizeCostEfficiency(m.api_pricing?.input_price_per_1m ?? 0));
        return acc;
      }, {} as Record<string, number>)
    }
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-4 shadow-md backdrop-blur-md">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
          🕸️ 모델 육각형 다차원 역량 비교 (Multi-Dimensional Radar Chart)
        </h3>
        <span className="text-xs text-muted font-bold">정규화 100점 만점 기준</span>
      </div>

      <div className="h-80 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
            <PolarGrid stroke="#cbd5e1" />
            <PolarAngleAxis dataKey="subject" stroke="#64748b" tick={{ fill: '#0f172a', fontSize: 12, fontWeight: 'bold' }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#94a3b8" />
            <Tooltip
              contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '12px', color: '#0f172a', fontWeight: 'bold' }}
            />
            <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px', fontWeight: 'bold' }} />
            {models.map((m, idx) => (
              <Radar
                key={m.id}
                name={m.name}
                dataKey={m.name}
                stroke={RADAR_COLORS[idx % RADAR_COLORS.length]}
                fill={RADAR_COLORS[idx % RADAR_COLORS.length]}
                fillOpacity={0.25}
              />
            ))}
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
