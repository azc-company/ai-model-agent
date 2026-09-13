import React from 'react';
import type { ModelSpec } from '../types';
import { ArrowLeftRight, X, Gauge } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { ModelRadarChart } from './ModelRadarChart';

interface CompareViewProps {
  models: ModelSpec[];
  selectedModelIds: string[];
  onToggleCompare: (id: string) => void;
  onGoToDashboard?: () => void;
}

export const CompareView: React.FC<CompareViewProps> = ({
  models,
  selectedModelIds,
  onToggleCompare,
}) => {
  const { t } = useLanguage();

  const comparedModels = models.filter((m) => selectedModelIds.includes(m.id));

  if (comparedModels.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-md">
        <ArrowLeftRight className="w-12 h-12 text-muted mx-auto" />
        <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">{t.compare.emptyTitle}</h3>
        <p className="text-muted text-sm max-w-md mx-auto font-semibold">
          {t.compare.emptyDesc}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md flex items-center justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-2 flex items-center gap-3 tracking-tight">
            <ArrowLeftRight className="w-7 h-7 text-accent" />
            {t.nav.compare} ({comparedModels.length})
          </h2>
          <p className="text-muted text-sm font-semibold">
            선택한 {comparedModels.length}개 모델의 상세 스펙, API 비용, Quota 및 벤치마크 나란히 대조
          </p>
        </div>
      </div>

      {/* Multi-Dimensional Radar Chart */}
      <ModelRadarChart models={comparedModels} />

      {/* Mobile Swipe Hint */}
      <div className="md:hidden flex items-center justify-between text-xs font-extrabold text-muted bg-slate-100 dark:bg-slate-800/60 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
        <span>👈 손가락으로 좌우 스크롤하여 대조</span>
        <span className="text-accent">총 {comparedModels.length}개 모델 비교 중</span>
      </div>

      {/* Comparison Grid Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto shadow-md" tabIndex={0} aria-label={t.compare.tableAria}>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
              <th className="p-4 w-48 text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider sticky left-0 bg-slate-50 dark:bg-slate-950 z-10">
                Spec Property
              </th>
              {comparedModels.map((model) => (
                <th key={model.id} className="p-4 min-w-[240px] text-center border-l border-slate-200 dark:border-slate-800 relative">
                  <button
                    onClick={() => onToggleCompare(model.id)}
                    className="absolute top-2 right-2 p-1 rounded-lg text-muted hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="text-xs text-muted font-extrabold mb-1">{model.provider_name}</div>
                  <div className="text-lg font-black text-slate-900 dark:text-white mb-2">{model.name}</div>
                  <span className="text-2xs px-2 py-0.5 rounded font-black bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
                    {model.tier}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm font-bold">
            {/* Input Pricing */}
            <tr>
              <td className="p-4 font-black text-slate-900 dark:text-slate-100 sticky left-0 bg-slate-50 dark:bg-slate-900 z-10">
                {t.dashboard.inputPrice}
              </td>
              {comparedModels.map((m) => (
                <td key={m.id} className="numeric p-4 text-center font-mono font-black text-success border-l border-slate-200 dark:border-slate-800">
                  {m.api_pricing ? `$${m.api_pricing.input_price_per_1m.toFixed(2)}` : '-'}
                </td>
              ))}
            </tr>

            {/* Output Pricing */}
            <tr>
              <td className="p-4 font-black text-slate-900 dark:text-slate-100 sticky left-0 bg-slate-50 dark:bg-slate-900 z-10">
                {t.dashboard.outputPrice}
              </td>
              {comparedModels.map((m) => (
                <td key={m.id} className="p-4 text-center font-mono font-black text-accent border-l border-slate-200 dark:border-slate-800">
                  {m.api_pricing ? `$${m.api_pricing.output_price_per_1m.toFixed(2)}` : '-'}
                </td>
              ))}
            </tr>

            {/* API Quota Rate Limits */}
            <tr className="bg-cyan-50/50 dark:bg-cyan-950/20">
              <td className="p-4 font-black text-accent sticky left-0 bg-slate-50 dark:bg-slate-900 z-10 flex items-center gap-1.5">
                <Gauge className="w-4 h-4 text-accent" />
                {t.quota.title}
              </td>
              {comparedModels.map((m) => (
                <td key={m.id} className="p-4 text-center font-mono text-xs border-l border-slate-200 dark:border-slate-800">
                  {m.quota && (m.quota.rpm !== undefined || m.quota.tpm !== undefined) ? (
                    <div className="space-y-1">
                      <div className="text-slate-900 dark:text-cyan-300 font-black">{m.quota.rpm ? `${m.quota.rpm.toLocaleString()} RPM` : '-'}</div>
                      <div className="text-muted font-bold">{m.quota.tpm ? `${(m.quota.tpm / 1000).toFixed(0)}k TPM` : '-'}</div>
                    </div>
                  ) : (
                    '-'
                  )}
                </td>
              ))}
            </tr>

            {/* Context Window */}
            <tr>
              <td className="p-4 font-black text-slate-900 dark:text-slate-100 sticky left-0 bg-slate-50 dark:bg-slate-900 z-10">
                {t.dashboard.contextWindow}
              </td>
              {comparedModels.map((m) => (
                <td key={m.id} className="p-4 text-center font-mono font-black text-slate-900 dark:text-slate-100 border-l border-slate-200 dark:border-slate-800">
                  {(m.context_window / 1000).toLocaleString()}k
                </td>
              ))}
            </tr>

            {/* License & Open-weight */}
            <tr>
              <td className="p-4 font-black text-slate-900 dark:text-slate-100 sticky left-0 bg-slate-50 dark:bg-slate-900 z-10">
                License / Weight
              </td>
              {comparedModels.map((m) => (
                <td key={m.id} className="p-4 text-center border-l border-slate-200 dark:border-slate-800">
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-black ${
                      m.is_open_weight
                        ? 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    {m.is_open_weight ? t.dashboard.openWeight : t.dashboard.proprietary}
                  </span>
                </td>
              ))}
            </tr>

            {/* Benchmarks Arena Elo */}
            <tr>
              <td className="p-4 font-black text-slate-900 dark:text-slate-100 sticky left-0 bg-slate-50 dark:bg-slate-900 z-10">
                LMArena Rating
              </td>
              {comparedModels.map((m) => (
                <td key={m.id} className="p-4 text-center font-mono font-black text-warn text-base border-l border-slate-200 dark:border-slate-800">
                  {m.benchmarks.arena_elo || '-'}
                </td>
              ))}
            </tr>

            {/* GPQA Diamond — Epoch AI (CC-BY 4.0) */}
            <tr>
              <td className="p-4 font-black text-slate-900 dark:text-slate-100 sticky left-0 bg-slate-50 dark:bg-slate-900 z-10">
                GPQA Diamond
              </td>
              {comparedModels.map((m) => (
                <td key={m.id} className="p-4 text-center font-mono text-accent font-black border-l border-slate-200 dark:border-slate-800">
                  {m.benchmarks.gpqa != null ? `${m.benchmarks.gpqa}%` : '-'}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
