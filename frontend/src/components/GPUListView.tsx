import React, { useState, useEffect, useMemo } from 'react';
import type { GPUSpec, GPUTier } from '../types';
import { fetchGPUSpecs } from '../api';
import { Cpu, Zap, HardDrive, Building2, User, Wrench, ChevronRight, Link2, Activity, Layers } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

// ─── 탭 메타데이터 ───────────────────────────────────────────────────────────
const TIERS: { key: GPUTier | 'all'; icon: React.ReactNode; color: string; bg: string; border: string }[] = [
  {
    key: 'all',
    icon: <Layers className="w-3.5 h-3.5" />,
    color: 'text-slate-700 dark:text-slate-200',
    bg: 'bg-slate-100 dark:bg-slate-800',
    border: 'border-slate-300 dark:border-slate-600',
  },
  {
    key: 'enterprise',
    icon: <Building2 className="w-3.5 h-3.5" />,
    color: 'text-violet-700 dark:text-violet-300',
    bg: 'bg-violet-50 dark:bg-violet-950',
    border: 'border-violet-300 dark:border-violet-700',
  },
  {
    key: 'prosumer',
    icon: <Wrench className="w-3.5 h-3.5" />,
    color: 'text-sky-700 dark:text-sky-300',
    bg: 'bg-sky-50 dark:bg-sky-950',
    border: 'border-sky-300 dark:border-sky-700',
  },
  {
    key: 'consumer',
    icon: <User className="w-3.5 h-3.5" />,
    color: 'text-emerald-700 dark:text-emerald-300',
    bg: 'bg-emerald-50 dark:bg-emerald-950',
    border: 'border-emerald-300 dark:border-emerald-700',
  },
];

const TIER_STYLES: Record<GPUTier, { badge: string; glow: string; accent: string }> = {
  enterprise: {
    badge: 'bg-violet-100 dark:bg-violet-950 text-violet-800 dark:text-violet-300 border-violet-300 dark:border-violet-700',
    glow: 'hover:border-violet-500 hover:shadow-violet-100 dark:hover:shadow-violet-900',
    accent: 'text-violet-600 dark:text-violet-400',
  },
  prosumer: {
    badge: 'bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border-sky-300 dark:border-sky-700',
    glow: 'hover:border-sky-500 hover:shadow-sky-100 dark:hover:shadow-sky-900',
    accent: 'text-sky-700 dark:text-sky-400',
  },
  consumer: {
    badge: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700',
    glow: 'hover:border-emerald-500 hover:shadow-emerald-100 dark:hover:shadow-emerald-900',
    accent: 'text-success',
  },
};

// 라벨은 언어별 사전에서 온다 — 모듈 상수로 두면 언어 전환이 반영되지 않는다.
const TIER_LABEL_KEY: Record<GPUTier, 'groupEnterprise' | 'groupProsumer' | 'groupConsumer'> = {
  enterprise: 'groupEnterprise',
  prosumer: 'groupProsumer',
  consumer: 'groupConsumer',
};
const TAB_LABEL_KEY: Record<GPUTier | 'all', 'tabAll' | 'tabEnterprise' | 'tabProsumer' | 'tabConsumer'> = {
  all: 'tabAll',
  enterprise: 'tabEnterprise',
  prosumer: 'tabProsumer',
  consumer: 'tabConsumer',
};

// ─── 퍼포먼스 바 ────────────────────────────────────────────────────────────
// api.ts 의 GPU 목록은 표시 문자열 대신 사전 키를 담는다. 키가 아닌 값이 오면 그대로 쓴다.
const localize = (t: any, value?: string) => (value && t.gpu[value]) || value || '';

const PerfBar: React.FC<{ value: number; max: number; color: string; label: string; unit: string }> = ({ value, max, color, label, unit }) => {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div>
      <div className="flex justify-between text-2xs font-bold mb-0.5 text-muted">
        <span>{label}</span>
        <span className="font-mono text-slate-800 dark:text-slate-200">{value > 0 ? `${value.toLocaleString()} ${unit}` : 'N/A'}</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

// ─── GPU 카드 ────────────────────────────────────────────────────────────────
const GPUCard: React.FC<{ gpu: GPUSpec; maxBw: number; maxFp16: number; maxInt8: number }> = ({ gpu, maxBw, maxFp16, maxInt8 }) => {
  const { t } = useLanguage();
  const s = TIER_STYLES[gpu.tier];

  return (
    <article className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col space-y-4 p-4 sm:p-5 transition-all duration-200 shadow-sm hover:shadow-lg ${s.glow}`}>
      {/* 헤더 */}
      <div className="flex flex-col gap-1.5">
        <span className={`text-2xs font-black px-2 py-0.5 rounded-full border w-fit ${s.badge}`}>
          {t.gpu[TIER_LABEL_KEY[gpu.tier]]}
        </span>
        <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">{localize(t, gpu.name)}</h3>
        <div className="flex items-center gap-2 text-2xs text-muted font-semibold flex-wrap">
          <span className="flex items-center gap-0.5">
            <Layers className="w-3 h-3" />{localize(t, gpu.form_factor)}
          </span>
          {gpu.nvlink && (
            <span className="flex items-center gap-0.5 text-warn font-bold">
              <Link2 className="w-3 h-3" />NVLink
            </span>
          )}
          <span className="flex items-center gap-0.5">
            <Zap className="w-3 h-3 text-warn" />{gpu.power_watts}W
          </span>
        </div>
      </div>

      {/* VRAM + 대역폭 */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
          <div className="text-2xs font-extrabold text-muted flex items-center gap-1 mb-1">
            <HardDrive className="w-3 h-3 text-cyan-500" />VRAM
          </div>
          <div className="text-lg font-black text-slate-900 dark:text-white font-mono leading-none">
            {gpu.vram_gb} <span className="text-xs font-bold text-muted">GB</span>
          </div>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
          <div className="text-2xs font-extrabold text-muted flex items-center gap-1 mb-1">
            <Zap className="w-3 h-3 text-blue-500" />{t.gpu.bandwidth}
          </div>
          <div className="text-lg font-black text-slate-900 dark:text-white font-mono leading-none">
            {gpu.memory_bandwidth_gbps.toLocaleString()} <span className="text-xs font-bold text-muted">GB/s</span>
          </div>
        </div>
      </div>

      {/* 성능 바 */}
      <div className="space-y-2">
        <PerfBar value={gpu.memory_bandwidth_gbps} max={maxBw}   color="bg-blue-500"    label={t.gpu.perfBandwidth}   unit="GB/s" />
        <PerfBar value={gpu.fp16_tflops}           max={maxFp16} color="bg-violet-500"  label={t.gpu.perfFp16} unit="TFLOPS" />
        <PerfBar value={gpu.int8_tops}             max={maxInt8} color="bg-emerald-500" label={t.gpu.perfInt8}  unit="TOPS" />
      </div>

      {/* CUDA / Tensor 코어 */}
      {(gpu.cuda_cores > 0 || gpu.tensor_cores > 0) && (
        <div className="grid grid-cols-2 gap-2.5">
          {gpu.cuda_cores > 0 && (
            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center">
              <div className="text-2xs font-bold text-muted mb-0.5">{t.gpu.cudaCores}</div>
              <div className="text-sm font-black text-slate-800 dark:text-slate-100 font-mono">{gpu.cuda_cores.toLocaleString()}</div>
            </div>
          )}
          {gpu.tensor_cores > 0 && (
            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center">
              <div className="text-2xs font-bold text-muted mb-0.5">{t.gpu.tensorCores}</div>
              <div className="text-sm font-black text-slate-800 dark:text-slate-100 font-mono">{gpu.tensor_cores.toLocaleString()}</div>
            </div>
          )}
        </div>
      )}

      {/* 가격 정보 */}
      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs font-bold">
        <div className="flex justify-between items-center text-muted">
          <span>{t.gpu.purchasePrice}</span>
          <span className="font-mono text-success font-black">
            ${gpu.purchase_price_usd.toLocaleString()}
          </span>
        </div>
        {gpu.cloud_hourly_on_demand !== null ? (
          <>
            <div className="flex justify-between items-center text-muted">
              <span>{t.gpu.cloudOnDemand}</span>
              <span className={`font-mono font-black ${s.accent}`}>${gpu.cloud_hourly_on_demand.toFixed(2)}/hr</span>
            </div>
            {gpu.cloud_hourly_spot !== null && (
              <div className="flex justify-between items-center text-muted">
                <span>{t.gpu.cloudSpot}</span>
                <span className="font-mono text-accent font-black">${gpu.cloud_hourly_spot.toFixed(2)}/hr</span>
              </div>
            )}
          </>
        ) : (
          <div className="text-muted text-2xs font-semibold text-center py-0.5">
            {t.gpu.noCloud}
          </div>
        )}
      </div>

      {/* 추천 용도 */}
      <div className={`rounded-xl px-3 py-2.5 border ${s.badge} text-2xs font-semibold leading-relaxed`}>
        <div className="font-black mb-0.5 flex items-center gap-1">
          <ChevronRight className="w-3 h-3" /> {t.gpu.recommendedUse}
        </div>
        {localize(t, gpu.recommended_use)}
      </div>

      <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-2xs text-muted font-semibold text-center">
        Self-Hosting Hardware Reference Index
      </div>
    </article>
  );
};

// ─── 메인 뷰 ────────────────────────────────────────────────────────────────
export const GPUListView: React.FC = () => {
  const { t } = useLanguage();
  const [gpus, setGpus] = useState<GPUSpec[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<GPUTier | 'all'>('all');

  useEffect(() => {
    fetchGPUSpecs().then(setGpus).catch(console.error).finally(() => setLoading(false));
  }, []);

  const maxBw   = useMemo(() => Math.max(...gpus.map(g => g.memory_bandwidth_gbps)), [gpus]);
  const maxFp16 = useMemo(() => Math.max(...gpus.map(g => g.fp16_tflops)), [gpus]);
  const maxInt8 = useMemo(() => Math.max(...gpus.map(g => g.int8_tops)), [gpus]);

  const filtered = useMemo(() =>
    activeTab === 'all' ? gpus : gpus.filter(g => g.tier === activeTab),
    [gpus, activeTab]
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: gpus.length };
    for (const g of gpus) c[g.tier] = (c[g.tier] || 0) + 1;
    return c;
  }, [gpus]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 타이틀 */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-2 flex items-center gap-3 tracking-tight">
          <Cpu className="w-7 h-7 text-purple-600 dark:text-purple-400" />
          {t.gpu.title}
        </h2>
        <p className="text-muted text-sm max-w-3xl font-semibold">
          {t.gpu.subtitle}
        </p>
      </div>

      {/* 탭 필터 */}
      <div className="flex flex-wrap gap-2">
        {TIERS.map(tier => {
          const isActive = activeTab === tier.key;
          return (
            <button
              key={tier.key}
              onClick={() => setActiveTab(tier.key as GPUTier | 'all')}
              className={`touch-target focus-ring flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-xs font-black border transition-all ${
                isActive
                  ? `${tier.bg} ${tier.color} ${tier.border} shadow-sm`
                  : 'bg-white dark:bg-slate-900 text-muted border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-500'
              }`}
            >
              {tier.icon}
              {t.gpu[TAB_LABEL_KEY[tier.key]]}
              <span className={`px-1.5 py-0.5 rounded-full text-2xs font-black ${isActive ? 'bg-white/40 dark:bg-black/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                {counts[tier.key] ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* 요약 통계 (탭 선택 시) */}
      {activeTab !== 'all' && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: <HardDrive className="w-4 h-4 text-cyan-500" />, label: t.gpu.maxVram, value: `${Math.max(...filtered.map(g => g.vram_gb))} GB` },
            { icon: <Activity className="w-4 h-4 text-violet-500" />, label: t.gpu.topFp16, value: `${Math.max(...filtered.map(g => g.fp16_tflops))} TF` },
            { icon: <Zap className="w-4 h-4 text-emerald-500" />, label: t.gpu.topInt8, value: `${Math.max(...filtered.map(g => g.int8_tops))} TOPS` },
          ].map((stat, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950">{stat.icon}</div>
              <div>
                <div className="text-2xs font-bold text-muted">{stat.label}</div>
                <div className="text-sm font-black text-slate-800 dark:text-slate-100 font-mono">{stat.value}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* GPU 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map(gpu => (
          <GPUCard key={gpu.id} gpu={gpu} maxBw={maxBw} maxFp16={maxFp16} maxInt8={maxInt8} />
        ))}
      </div>
    </div>
  );
};
