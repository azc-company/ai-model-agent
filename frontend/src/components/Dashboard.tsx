import React, { useState, useEffect, useMemo } from 'react';
import type { ModelSpec, Provider } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { fetchModels, fetchProviders } from '../api';
import { CodeSnippetModal } from './CodeSnippetModal';
import { Sparkles } from 'lucide-react';
import { FilterSheet, type CatalogFilters } from './FilterSheet';
import { track } from '../analytics';

interface DashboardProps {
  onCompareSelect?: (modelId: string) => void;
  selectedCompareIds?: string[];
  models?: ModelSpec[];
  providers?: Provider[];
  selectedModelIds?: string[];
  onToggleCompare?: (modelId: string) => void;
  onClearCompare?: () => void;
  onGoToCompare?: () => void;
  globalSearchQuery?: string;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onCompareSelect,
  selectedCompareIds = [],
  selectedModelIds = [],
  onToggleCompare,
  models: propModels = [],
  providers: propProviders = [],
  globalSearchQuery = ''
  , onGoToCompare
}) => {
  const { t } = useLanguage();
  const [models, setModels] = useState<ModelSpec[]>(propModels);
  const [providers, setProviders] = useState<Provider[]>(propProviders);
  const [loading, setLoading] = useState<boolean>(propModels.length === 0);

  // Filter states
  const [codeModalModel, setCodeModalModel] = useState<ModelSpec | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>(globalSearchQuery);

  useEffect(() => {
    setSearchTerm(globalSearchQuery);
  }, [globalSearchQuery]);
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [selectedLicense, setSelectedLicense] = useState<string>('all');
  const [reasoningOnly, setReasoningOnly] = useState<boolean>(false);
  const [webSearchOnly, setWebSearchOnly] = useState<boolean>(false);
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false);
  const [onlyNew, setOnlyNew] = useState<boolean>(false);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  type Density = 'compact' | 'comfortable';
  const [density, setDensity] = useState<Density>(() => localStorage.getItem('catalog-density') === 'compact' ? 'compact' : 'comfortable');
  const changeDensity = (next: Density) => { setDensity(next); localStorage.setItem('catalog-density', next); };

  const currentFilters: CatalogFilters = { provider: selectedProvider, tier: selectedTier, license: selectedLicense, reasoningOnly, webSearchOnly, verifiedOnly, onlyNew };
  const applyFilters = (filters: CatalogFilters) => {
    setSelectedProvider(filters.provider); setSelectedTier(filters.tier); setSelectedLicense(filters.license);
    setReasoningOnly(filters.reasoningOnly); setWebSearchOnly(filters.webSearchOnly); setVerifiedOnly(filters.verifiedOnly); setOnlyNew(filters.onlyNew);
    setFilterSheetOpen(false);
  };
  const clearFilters = () => applyFilters({ provider: 'all', tier: 'all', license: 'all', reasoningOnly: false, webSearchOnly: false, verifiedOnly: false, onlyNew: false });

  // View Mode: 'grid' | 'table' | 'compact'
  const [viewMode, setViewMode] = useState<'grid' | 'table' | 'compact'>('grid');

  // 기본 정렬은 최근에 들어온 순이다. 예전 기본값인 Arena ELO 는 8월 시드 데이터에만
  // 값이 있어서(612개 중 169개), 새로 들어온 모델은 전부 N/A 로 목록 맨 뒤에 가라앉았다.
  type SortKey = 'name' | 'provider' | 'tier' | 'context' | 'input_price' | 'output_price' | 'arena_elo' | 'rpm' | 'is_new';
  const [sortKey, setSortKey] = useState<SortKey>('is_new');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const TIER_ORDER: Record<string, number> = { Frontier: 4, Mid: 3, Small: 2, Micro: 1 };

  const effectiveCompareIds = selectedCompareIds.length > 0 ? selectedCompareIds : selectedModelIds;
  const handleToggle = (id: string) => {
    if (onToggleCompare) {
      onToggleCompare(id);
    } else if (onCompareSelect) {
      onCompareSelect(id);
    }
  };

  useEffect(() => {
    if (propModels.length > 0) {
      setModels(propModels);
      setProviders(propProviders);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const [modelsData, providersData] = await Promise.all([
          fetchModels(),
          fetchProviders()
        ]);

        if (modelsData && modelsData.length > 0) setModels(modelsData);
        if (providersData && providersData.length > 0) setProviders(providersData);
      } catch (err) {
        console.error('Failed to fetch catalog data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [propModels, propProviders]);

  const checkSupportsReasoning = (model: ModelSpec): boolean => {
    if (model.supports_reasoning) return true;
    const id = (model.id || '').toLowerCase();
    const name = (model.name || '').toLowerCase();
    return (
      id.includes('o1') ||
      id.includes('o3') ||
      id.includes('r1') ||
      id.includes('thinking') ||
      id.includes('reasoner') ||
      id.includes('qwq') ||
      id.includes('cot') ||
      id.includes('claude-3-7') ||
      id.includes('deepseek-r1') ||
      name.includes('reason') ||
      name.includes('thinking') ||
      name.includes('cot')
    );
  };

  const checkSupportsWebSearch = (model: ModelSpec): boolean => {
    if (model.supports_web_search) return true;
    const id = (model.id || '').toLowerCase();
    const name = (model.name || '').toLowerCase();
    return (
      id.includes('sonar') ||
      id.includes('search') ||
      id.includes('perplexity') ||
      id.includes('online') ||
      id.includes('web') ||
      id.includes('gemini') ||
      id.includes('gpt-4o') ||
      id.includes('grok-2') ||
      name.includes('search') ||
      name.includes('sonar') ||
      name.includes('perplexity')
    );
  };

  const checkIsVerified = (model: ModelSpec): boolean => {
    if (model.is_verified) return true;
    const p = (model.provider_id || '').toLowerCase();
    return ['openai', 'anthropic', 'google', 'meta', 'mistral', 'deepseek', 'aws', 'aws_bedrock', 'cohere', 'perplexity', 'xai', 'alibaba', 'microsoft'].includes(p);
  };

  // 신규 판정은 서버가 한다(카탈로그 최초 발견 30일 이내). 예전에는 여기서 이름에
  // '2.5'·'4.5'·'r1' 이 들어가면 신규로 쳐서 Gemini 2.5·Claude Opus 4.5·DeepSeek R1 이
  // 계속 신규로 뜨고, 실제로 새로 들어온 모델은 묻혔다.
  const checkIsNew = (model: ModelSpec): boolean => Boolean(model.is_new);
  const firstSeen = (model: ModelSpec): number => {
    const t = model.first_seen_at ? Date.parse(model.first_seen_at.replace(' ', 'T') + 'Z') : NaN;
    return Number.isFinite(t) ? t : 0;
  };

  const filteredModels = models.filter((model) => {
    const matchesSearch =
      model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      model.provider_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      model.license_type.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesProvider = selectedProvider === 'all' || model.provider_id === selectedProvider;
    const matchesTier = selectedTier === 'all' || model.tier === selectedTier;
    const matchesLicense =
      selectedLicense === 'all' ||
      (selectedLicense === 'open' ? model.is_open_weight : !model.is_open_weight);

    const matchesReasoning = !reasoningOnly || checkSupportsReasoning(model);
    const matchesWebSearch = !webSearchOnly || checkSupportsWebSearch(model);
    const matchesVerified = !verifiedOnly || checkIsVerified(model);
    const matchesNew = !onlyNew || checkIsNew(model);

    return matchesSearch && matchesProvider && matchesTier && matchesLicense && matchesReasoning && matchesWebSearch && matchesVerified && matchesNew;
  });

  // 상단 카드 3개. 예전에는 모델명·ELO·초당 토큰 수가 문자열로 박혀 있었다 — 카탈로그에는
  // 속도 데이터가 아예 없고 ELO 도 8월 시드에만 있다. 매주 동기화로 새로 받는 값
  // (최초 발견일·컨텍스트·가격)에서만 계산한다.
  const highlights = useMemo(() => {
    const blended = (m: ModelSpec) => (3 * (m.api_pricing?.input_price_per_1m || 0) + (m.api_pricing?.output_price_per_1m || 0)) / 4;
    const fresh = models.filter((m) => m.is_new)
      .sort((a, b) => firstSeen(b) - firstSeen(a) || Number(b.tier === 'Frontier') - Number(a.tier === 'Frontier') || a.name.localeCompare(b.name));
    const longest = models
      .filter((m) => m.source === 'feed' && !/router/i.test(m.name))   // 라우터는 모델이 아니다
      .reduce<ModelSpec | undefined>((best, m) => (!best || m.context_window > best.context_window ? m : best), undefined);
    const MAJOR = /^(OpenAI|Anthropic|Google|Meta|Mistral|DeepSeek|xAI|SpaceXAI|Alibaba|Qwen|Microsoft|Amazon)/i;
    const value = models
      .filter((m) => m.tier === 'Frontier' && MAJOR.test(m.provider_name) && !/\(batch\)/i.test(m.name)
        && (m.api_pricing?.input_price_per_1m || 0) > 0 && (m.api_pricing?.output_price_per_1m || 0) > 0)
      .reduce<ModelSpec | undefined>((best, m) => (!best || blended(m) < blended(best) ? m : best), undefined);
    return { fresh, longest, value, price: value ? blended(value) : 0 };
  }, [models]);

  const sortedModels = [...filteredModels].sort((a, b) => {
    let av: number | string = 0;
    let bv: number | string = 0;
    switch (sortKey) {
      case 'is_new':    av = firstSeen(a); bv = firstSeen(b); break;   // 최근에 들어온 순
      case 'name':      av = a.name; bv = b.name; break;
      case 'provider':  av = a.provider_name; bv = b.provider_name; break;
      case 'tier':      av = TIER_ORDER[a.tier] ?? 0; bv = TIER_ORDER[b.tier] ?? 0; break;
      case 'context':   av = a.context_window; bv = b.context_window; break;
      case 'input_price': av = a.api_pricing.input_price_per_1m; bv = b.api_pricing.input_price_per_1m; break;
      case 'output_price': av = a.api_pricing.output_price_per_1m; bv = b.api_pricing.output_price_per_1m; break;
      case 'arena_elo': av = a.benchmarks.arena_elo ?? -1; bv = b.benchmarks.arena_elo ?? -1; break;
      case 'rpm':       av = a.quota?.rpm ?? 0; bv = b.quota?.rpm ?? 0; break;
    }
    if (typeof av === 'string' && typeof bv === 'string') {
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    }
    const diff = sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
    if (diff !== 0 || sortKey !== 'is_new') return diff;
    // 발견일이 같으면(추적 이전부터 있던 모델들) ELO 가 있는 모델을 앞에, 그다음 이름순
    return (b.benchmarks.arena_elo ?? -1) - (a.benchmarks.arena_elo ?? -1) || a.name.localeCompare(b.name);
  });

  // Sort indicator icon
  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <span className="ml-1 text-muted">⇅</span>;
    return <span className="ml-1 text-cyan-400">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'Frontier':
        return 'bg-purple-700/20 text-purple-700 dark:text-purple-300 border-purple-500/40';
      case 'Mid':
        return 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/40';
      case 'Small':
        return 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40';
      case 'Micro':
        return 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-500/40';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/40';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* 2026 Bento Grid Spotlight Hero (Bright & Modern) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Bento 1: Top Elo Leader */}
        <div className="bento-card-2026 p-6 relative overflow-hidden group border border-purple-200 dark:border-purple-500/30 bg-gradient-to-br from-indigo-50/90 via-purple-50/50 to-white dark:from-purple-950/40 dark:to-slate-950/80 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xs font-black tracking-widest uppercase text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-700/20 border border-purple-200 dark:border-purple-500/30 px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
              <span>✨ JUST ADDED</span>
            </span>
            <span className="text-xs font-mono font-black text-purple-700 dark:text-amber-400">{highlights.fresh.length} new</span>
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-cyan-300 transition-colors">
            {highlights.fresh[0]?.name ?? '—'}
          </h3>
          <p className="text-xs text-muted leading-relaxed font-semibold">
            {t.dashboard.kpiNewDesc}
          </p>
        </div>

        {/* Bento 2: Speed Champion */}
        <div className="bento-card-2026 p-6 relative overflow-hidden group border border-cyan-200 dark:border-cyan-500/30 bg-gradient-to-br from-sky-50/90 via-cyan-50/50 to-white dark:from-cyan-950/40 dark:to-slate-950/80 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xs font-black tracking-widest uppercase text-cyan-800 dark:text-cyan-300 bg-cyan-100 dark:bg-cyan-500/20 border border-cyan-200 dark:border-cyan-500/30 px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
              <span>📏 LONGEST CONTEXT</span>
            </span>
            <span className="text-xs font-mono font-black text-accent">{highlights.longest ? `${(highlights.longest.context_window / 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 2 })}M tokens` : '—'}</span>
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1 group-hover:text-cyan-600 transition-colors">
            {highlights.longest?.name ?? '—'}
          </h3>
          <p className="text-xs text-muted leading-relaxed font-semibold">
            {t.dashboard.kpiContextDesc}
          </p>
        </div>

        {/* Bento 3: Best Value Champion */}
        <div className="bento-card-2026 p-6 relative overflow-hidden group border border-emerald-200 dark:border-emerald-500/30 bg-gradient-to-br from-emerald-50/90 via-teal-50/50 to-white dark:from-emerald-950/40 dark:to-slate-950/80 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xs font-black tracking-widest uppercase text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
              <span>💎 BEST FRONTIER VALUE</span>
            </span>
            <span className="text-xs font-mono font-black text-emerald-700 dark:text-emerald-300">{highlights.value ? `$${highlights.price.toFixed(3)} / 1M` : '—'}</span>
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1 group-hover:text-emerald-600 transition-colors">
            {highlights.value?.name ?? '—'}
          </h3>
          <p className="text-xs text-muted leading-relaxed font-semibold">
            {t.dashboard.kpiValueDesc}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar Header */}
      <div className="glass-card p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between gap-3 md:hidden">
          <button className="touch-target focus-ring flex-1 rounded-xl border border-slate-300 dark:border-slate-700 font-black" onClick={() => setFilterSheetOpen(true)}>필터 열기</button>
          <span className="text-xs font-bold text-muted">{[selectedProvider !== 'all', selectedTier !== 'all', selectedLicense !== 'all', reasoningOnly, webSearchOnly, verifiedOnly, onlyNew].filter(Boolean).length}개 적용</span>
        </div>
        {/* Row 1: Search Input & Primary Dropdowns */}
        <div className="flex flex-col lg:flex-row items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <input
              type="text"
              aria-label="카탈로그 검색"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="모델명, 프로바이더, 라이선스 검색..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 focus:border-cyan-500 rounded-xl text-sm font-bold placeholder-slate-400 dark:placeholder-slate-500 shadow-sm transition-all"
            />
            <svg
              className="w-4 h-4 text-muted absolute left-3.5 top-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* Primary Dropdown Filters */}
          <div className="hidden md:flex items-center gap-2 w-full lg:w-auto shrink-0">
            <select
              aria-label="프로바이더 필터"
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="w-full sm:w-auto bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 focus:border-cyan-500 rounded-xl px-2.5 sm:px-3 py-2.5 text-xs font-extrabold cursor-pointer shadow-sm min-h-[40px]"
            >
              <option value="all">{t.dashboard.allProviders}</option>
              {providers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <select
              aria-label="모델 등급 필터"
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="w-full sm:w-auto bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 focus:border-cyan-500 rounded-xl px-2.5 sm:px-3 py-2.5 text-xs font-extrabold cursor-pointer shadow-sm min-h-[40px]"
            >
              <option value="all">{t.dashboard.allTiers}</option>
              <option value="Frontier">Frontier</option>
              <option value="Mid">Mid</option>
              <option value="Small">Small</option>
              <option value="Micro">Micro</option>
            </select>

            <select
              aria-label="라이선스 필터"
              value={selectedLicense}
              onChange={(e) => setSelectedLicense(e.target.value)}
              className="w-full sm:w-auto bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 focus:border-cyan-500 rounded-xl px-2.5 sm:px-3 py-2.5 text-xs font-extrabold cursor-pointer shadow-sm min-h-[40px]"
            >
              <option value="all">{t.dashboard.allLicenses}</option>
              <option value="open">{t.dashboard.openWeight}</option>
              <option value="proprietary">{t.dashboard.proprietary}</option>
            </select>
          </div>
        </div>

        {/* Row 2: Special Feature Chips & View Mode Switcher */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          {/* Feature Filter Chips */}
          <div className="w-full sm:w-auto flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden text-xs font-medium">
            <span className="text-muted font-extrabold shrink-0 mr-1 whitespace-nowrap">{t.dashboard.specialFilters}</span>

            <button
              onClick={() => setOnlyNew(!onlyNew)}
              className={`px-3 py-2 rounded-xl border transition-all flex items-center gap-1.5 font-bold shadow-sm text-xs shrink-0 whitespace-nowrap min-h-[38px] ${
                onlyNew
                  ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white border-rose-500 shadow-rose-500/20 ring-2 ring-rose-500/30'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/80 hover:border-rose-400'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400 fill-rose-500 animate-pulse" />
              <span>{t.dashboard.filterNew}</span>
            </button>

            <button
              onClick={() => setReasoningOnly(!reasoningOnly)}
              className={`px-3 py-2 rounded-xl border transition-all flex items-center gap-1.5 font-bold shadow-sm text-xs shrink-0 whitespace-nowrap min-h-[38px] ${
                reasoningOnly
                  ? 'bg-purple-600 text-white border-purple-500 shadow-purple-500/20 ring-2 ring-purple-500/30'
                  : 'bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-purple-400'
              }`}
            >
              <span>🧠</span> {t.dashboard.filterReasoning}
            </button>

            <button
              onClick={() => setWebSearchOnly(!webSearchOnly)}
              className={`px-3 py-2 rounded-xl border transition-all flex items-center gap-1.5 font-bold shadow-sm text-xs shrink-0 whitespace-nowrap min-h-[38px] ${
                webSearchOnly
                  ? 'bg-blue-600 text-white border-blue-500 shadow-blue-500/20 ring-2 ring-blue-500/30'
                  : 'bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-blue-400'
              }`}
            >
              <span>🌐</span> {t.dashboard.filterWebSearch}
            </button>

            <button
              onClick={() => setVerifiedOnly(!verifiedOnly)}
              className={`px-3 py-2 rounded-xl border transition-all flex items-center gap-1.5 font-bold shadow-sm text-xs shrink-0 whitespace-nowrap min-h-[38px] ${
                verifiedOnly
                  ? 'bg-emerald-700 text-white border-emerald-500 shadow-emerald-500/20 ring-2 ring-emerald-500/30'
                  : 'bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-emerald-400'
              }`}
            >
              <span>🛡️</span> {t.dashboard.filterLitellm}
            </button>

            {(onlyNew || reasoningOnly || webSearchOnly || verifiedOnly || selectedProvider !== 'all' || selectedTier !== 'all' || selectedLicense !== 'all' || searchTerm) && (
              <button
                onClick={() => {
                  setOnlyNew(false);
                  setReasoningOnly(false);
                  setWebSearchOnly(false);
                  setVerifiedOnly(false);
                  setSelectedProvider('all');
                  setSelectedTier('all');
                  setSelectedLicense('all');
                  setSearchTerm('');
                }}
                className="text-red-500 hover:text-danger underline text-xs font-bold ml-1 shrink-0 whitespace-nowrap"
              >
                필터 초기화
              </button>
            )}
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-1 border border-slate-200 dark:border-slate-800 rounded-xl shrink-0 self-end sm:self-auto">
            <button aria-label={t.dashboard.densityComfortableAria} aria-pressed={density === 'comfortable'} onClick={() => changeDensity('comfortable')} className={`touch-target px-2 rounded-lg text-xs font-bold ${density === 'comfortable' ? 'bg-white dark:bg-slate-800' : ''}`}>{t.dashboard.densityComfortable}</button>
            <button aria-label={t.dashboard.densityCompactAria} aria-pressed={density === 'compact'} onClick={() => changeDensity('compact')} className={`touch-target px-2 rounded-lg text-xs font-bold ${density === 'compact' ? 'bg-white dark:bg-slate-800' : ''}`}>{t.dashboard.densityCompact}</button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all ${
                viewMode === 'grid'
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                  : 'text-muted hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              {t.viewMode.grid}
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all ${
                viewMode === 'table'
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                  : 'text-muted hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {t.viewMode.table}
            </button>
            <button
              onClick={() => setViewMode('compact')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all ${
                viewMode === 'compact'
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                  : 'text-muted hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              {t.viewMode.compact}
            </button>
          </div>
        </div>
      </div>

      {/* Model Count Info & Clean Integrated Sort Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm text-muted px-1 font-bold">
        <div className="flex items-center gap-2">
          <span className="font-black text-accent text-base">{sortedModels.length}</span> {t.dashboard.modelsFound}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted text-xs font-extrabold">{t.dashboard.sortBy}</span>
          <select
            aria-label="정렬 기준"
            value={sortKey}
            onChange={e => { const k = e.target.value as SortKey; setSortKey(k); if (k === 'is_new') setSortDir('desc'); }}
            className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs font-extrabold shadow-sm cursor-pointer"
          >
            <option value="is_new">✨ 신규/최신 모델 우선</option>
            <option value="arena_elo">🏆 LMSYS Arena Elo 랭킹순</option>
            <option value="input_price">💰 입력 비용 저렴한순</option>
            <option value="output_price">💸 출력 비용 저렴한순</option>
            <option value="context">📚 컨텍스트 윈도우 큰순</option>
            <option value="name">🔤 모델명 알파벳순</option>
            <option value="provider">🏢 프로바이더순</option>
            <option value="tier">🎯 티어 (Tier)순</option>
          </select>
          <button
            onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
            className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-cyan-500 text-slate-900 dark:text-cyan-300 font-extrabold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1"
            title={sortDir === 'asc' ? t.dashboard.sortAscTitle : t.dashboard.sortDescTitle}
          >
            {sortDir === 'asc' ? t.dashboard.sortAsc : t.dashboard.sortDesc}
          </button>
        </div>
      </div>

      {/* VIEW 1: Grid Mode */}
      {viewMode === 'grid' && (
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 ${density === 'compact' ? 'gap-3' : 'gap-6'}`}>
          {sortedModels.map((model) => {
            const isSelected = effectiveCompareIds.includes(model.id);
            return (
              <div
                key={model.id}
                className={`bento-card-2026 flex flex-col justify-between group relative overflow-hidden ${density === 'compact' ? 'p-3' : 'p-5'}`}
              >
                <div>
                  {/* Top Bar: Provider & Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-black text-muted uppercase tracking-wider font-mono">
                      {model.provider_name}
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {checkIsNew(model) && (
                        <span className="text-2xs px-2 py-0.5 rounded-full bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white font-black shadow-sm tracking-wider animate-pulse" title="2025/2026 신규 출시 모델">
                          ✨ NEW
                        </span>
                      )}
                      {checkSupportsReasoning(model) && (
                        <span className="text-2xs px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-500/40 font-bold" title="Reasoning / CoT 지원">
                          🧠 Reasoning
                        </span>
                      )}
                      {checkSupportsWebSearch(model) && (
                        <span className="text-2xs px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-500/40 font-bold" title="실시간 웹 검색 통합">
                          🌐 Web Search
                        </span>
                      )}
                      <span
                        className={`text-2xs px-2 py-0.5 rounded-full font-bold border ${getTierBadge(
                          model.tier
                        )}`}
                      >
                        {model.tier}
                      </span>
                      <span
                        className={`text-2xs px-2 py-0.5 rounded-full font-bold ${
                          model.is_open_weight
                            ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30'
                            : 'bg-indigo-100 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-300 dark:border-indigo-500/30'
                        }`}
                      >
                        {model.is_open_weight ? t.dashboard.openWeight : t.dashboard.proprietary}
                      </span>
                    </div>
                  </div>

                  {/* Model Title */}
                  <h3 className="text-xl font-black metallic-text group-hover:text-cyan-300 transition-colors mb-2 tracking-tight">
                    {model.name}
                  </h3>

                  <p className="text-xs text-slate-700 dark:text-slate-200 line-clamp-2 mb-4 leading-relaxed font-bold">
                    {model.description}
                  </p>

                  {/* Quota Information Box */}
                  {model.quota && (model.quota.rpm !== undefined || model.quota.tpm !== undefined) && (
                    <div className="bg-cyan-50 dark:bg-cyan-950/80 border border-cyan-200 dark:border-cyan-500/40 rounded-xl p-3 mb-4 text-xs shadow-inner">
                      <div className="text-2xs font-black text-cyan-800 dark:text-cyan-300 mb-1 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        API Rate Limits & Quotas
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-2xs text-slate-900 dark:text-slate-100 font-extrabold">
                        <div>
                          <span className="text-muted font-bold">RPM:</span> <span className="text-slate-900 dark:text-white font-black">{model.quota.rpm ? model.quota.rpm.toLocaleString() : '-'}</span>
                        </div>
                        <div>
                          <span className="text-muted font-bold">TPM:</span> <span className="text-slate-900 dark:text-white font-black">{model.quota.tpm ? `${(model.quota.tpm / 1000).toLocaleString()}k` : '-'}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Key Metrics Grid */}
                  <div className="grid grid-cols-2 gap-2.5 bg-slate-100 dark:bg-slate-900/90 p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 mb-4 text-xs shadow-inner">
                    <div>
                      <span className="text-muted block text-2xs font-bold mb-0.5">{t.dashboard.contextWindow}</span>
                      <span className="font-black text-slate-900 dark:text-white text-sm">
                        {(model.context_window / 1000).toLocaleString()}k tokens
                      </span>
                    </div>
                    <div>
                      <span className="text-muted block text-2xs font-bold mb-0.5">{t.dashboard.arenaElo}</span>
                      <span className="font-black text-warn text-sm flex items-center gap-1">
                        🏆 {model.benchmarks.arena_elo ? model.benchmarks.arena_elo.toFixed(0) : 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Pricing Info */}
                  <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-200 dark:border-slate-800 mb-4">
                    <div>
                      <span className="text-muted text-2xs block font-bold">{t.dashboard.inputPrice}</span>
                      <span className="font-black text-slate-900 dark:text-slate-100">${model.api_pricing.input_price_per_1m.toFixed(2)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-muted text-2xs block font-bold">{t.dashboard.outputPrice}</span>
                      <span className="font-black text-slate-900 dark:text-slate-100">${model.api_pricing.output_price_per_1m.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Buttons: Code Snippets, Official Docs & Compare */}
                <div className="flex items-center gap-1.5 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <button
                    onClick={() => setCodeModalModel(model)}
                    className="flex-1 py-2 px-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white transition-all shadow-md flex items-center justify-center gap-1"
                    title="API 연동 코드 스니펫 보기"
                  >
                    <span>⚡</span> {t.dashboard.apiCode}
                  </button>
                  <a
                    href={model.source_docs_url || model.official_url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => track('external_link_click', { label: model.name })}
                    className="flex-1 text-center py-2 px-2.5 rounded-xl text-xs font-black bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 transition-all border border-slate-300 dark:border-slate-700 shadow-sm"
                  >
                    {t.dashboard.officialDocs}
                  </a>
                  <button
                    onClick={() => handleToggle(model.id)}
                    className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-black transition-all shadow-md ${
                      isSelected
                        ? 'bg-emerald-700 hover:bg-emerald-500 text-white border border-emerald-400 shadow-emerald-600/30'
                        : 'bg-accent hover:bg-cyan-500 text-white shadow-cyan-600/30'
                    }`}
                  >
                    {isSelected ? t.dashboard.compared : t.dashboard.compareButton}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <FilterSheet open={filterSheetOpen} filters={currentFilters} providers={providers} onApply={applyFilters} onClear={clearFilters} onClose={() => setFilterSheetOpen(false)} />
      {effectiveCompareIds.length > 0 && onGoToCompare && <button onClick={onGoToCompare} className="md:hidden fixed bottom-24 left-4 right-4 z-30 touch-target rounded-xl bg-indigo-600 text-white font-black shadow-xl">선택한 모델 {effectiveCompareIds.length}개 비교</button>}

      {/* VIEW 2: Table Mode */}
      {viewMode === 'table' && (
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-md dark:shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 text-2xs font-black uppercase tracking-wider">
                  <th
                    className="py-3.5 px-4 cursor-pointer hover:text-blue-600 dark:hover:text-cyan-400 select-none transition-colors"
                    onClick={() => handleSort('name')}
                  >Model<SortIcon col="name" /></th>
                  <th
                    className="py-3.5 px-4 cursor-pointer hover:text-blue-600 dark:hover:text-cyan-400 select-none transition-colors"
                    onClick={() => handleSort('provider')}
                  >Provider<SortIcon col="provider" /></th>
                  <th
                    className="py-3.5 px-4 cursor-pointer hover:text-blue-600 dark:hover:text-cyan-400 select-none transition-colors"
                    onClick={() => handleSort('tier')}
                  >Tier<SortIcon col="tier" /></th>
                  <th
                    className="py-3.5 px-4 cursor-pointer hover:text-blue-600 dark:hover:text-cyan-400 select-none transition-colors"
                    onClick={() => handleSort('context')}
                  >Context<SortIcon col="context" /></th>
                  <th
                    className="py-3.5 px-4 cursor-pointer hover:text-blue-600 dark:hover:text-cyan-400 select-none transition-colors"
                    onClick={() => handleSort('input_price')}
                  >Input Price<SortIcon col="input_price" /></th>
                  <th
                    className="py-3.5 px-4 cursor-pointer hover:text-blue-600 dark:hover:text-cyan-400 select-none transition-colors"
                    onClick={() => handleSort('output_price')}
                  >Output Price<SortIcon col="output_price" /></th>
                  <th
                    className="py-3.5 px-4 cursor-pointer hover:text-blue-600 dark:hover:text-cyan-400 select-none transition-colors"
                    onClick={() => handleSort('rpm')}
                  >Quota RPM<SortIcon col="rpm" /></th>
                  <th
                    className="py-3.5 px-4 cursor-pointer hover:text-blue-600 dark:hover:text-cyan-400 select-none transition-colors"
                    onClick={() => handleSort('arena_elo')}
                  >ELO<SortIcon col="arena_elo" /></th>
                  <th className="py-3.5 px-4">Docs</th>
                  <th className="py-3.5 px-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                {sortedModels.map((model) => {
                  const isSelected = effectiveCompareIds.includes(model.id);
                  return (
                    <tr key={model.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-extrabold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <span>{model.name}</span>
                          {checkIsNew(model) && (
                            <span className="text-2xs px-1.5 py-0.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white font-black shrink-0 animate-pulse">
                              ✨ NEW
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-semibold">{model.provider_name}</td>
                      <td className="py-3 px-4">
                        <span className={`text-2xs px-2 py-0.5 rounded border font-bold ${getTierBadge(model.tier)}`}>
                          {model.tier}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                        {model.context_window > 0 ? `${(model.context_window / 1000).toLocaleString()}k` : '-'}
                      </td>
                      <td className="py-3 px-4 font-mono font-extrabold text-success">
                        ${model.api_pricing.input_price_per_1m.toFixed(3)}
                      </td>
                      <td className="py-3 px-4 font-mono font-extrabold text-success">
                        ${model.api_pricing.output_price_per_1m.toFixed(3)}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-cyan-300 text-xs">
                        {model.quota?.rpm ? `${model.quota.rpm.toLocaleString()}` : '-'}
                      </td>
                      <td className="py-3 px-4 font-mono font-extrabold text-warn text-xs">
                        {model.benchmarks.arena_elo ?? '-'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setCodeModalModel(model)}
                            className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:hover:bg-purple-800 dark:text-purple-200 border border-purple-200 dark:border-purple-500/40 rounded-md text-xs font-bold transition-colors whitespace-nowrap"
                            title="API 연동 코드 스니펫 보기"
                          >
                            ⚡ {t.dashboard.apiCode}
                          </button>
                          <a
                            href={model.source_docs_url || model.official_url}
                            target="_blank"
                            rel="noreferrer"
                            onClick={() => track('external_link_click', { label: model.name })}
                            className="text-xs font-bold text-muted hover:text-blue-600 dark:text-slate-400 dark:hover:text-cyan-400 transition-colors whitespace-nowrap"
                          >
                            Docs ↗
                          </a>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggle(model.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all shadow-sm ${
                            isSelected
                              ? 'bg-emerald-700 hover:bg-emerald-500 text-white border border-emerald-400 shadow-emerald-600/30'
                              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
                          }`}
                        >
                          {isSelected ? t.dashboard.compared : t.dashboard.compareButton}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: Compact Mode (요약 리스트) */}
      {viewMode === 'compact' && (
        <div className="space-y-2.5">
          {sortedModels.map((model) => {
            const isSelected = effectiveCompareIds.includes(model.id);
            return (
              <div
                key={model.id}
                className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-cyan-500 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 transition-all shadow-sm hover:shadow-md group"
              >
                {/* Left Section: Provider, Model Name, Badges & Ctx */}
                <div className="flex flex-wrap items-center gap-2.5 min-w-0 flex-1">
                  <span className="text-xs font-black uppercase tracking-wider text-blue-700 dark:text-cyan-400 bg-blue-50 dark:bg-cyan-950/60 border border-blue-200 dark:border-cyan-800 px-2.5 py-1 rounded-md shrink-0">
                    {model.provider_name}
                  </span>
                  <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors">
                    {model.name}
                  </span>
                  {checkIsNew(model) && (
                    <span className="text-2xs px-2 py-0.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white font-black shadow-sm shrink-0 animate-pulse">
                      ✨ NEW
                    </span>
                  )}
                  <span className={`text-2xs px-2 py-0.5 rounded-full font-bold border shrink-0 ${getTierBadge(model.tier)}`}>
                    {model.tier}
                  </span>
                  {checkSupportsReasoning(model) && (
                    <span className="text-2xs px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-500/40 font-bold shrink-0">
                      🧠 Reasoning
                    </span>
                  )}
                  {checkSupportsWebSearch(model) && (
                    <span className="text-2xs px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-500/40 font-bold shrink-0">
                      🌐 Web Search
                    </span>
                  )}
                  <span className="text-xs font-mono font-bold text-muted bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-md shrink-0">
                    Ctx: {model.context_window > 0 ? `${(model.context_window / 1000).toLocaleString()}k` : '-'}
                  </span>
                  {model.benchmarks.arena_elo && (
                    <span className="text-xs font-mono font-bold text-warn bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md shrink-0 flex items-center gap-1">
                      🏆 {model.benchmarks.arena_elo.toFixed(0)}
                    </span>
                  )}
                </div>

                {/* Right Section: Pricing & Action Buttons */}
                <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                  <span className="font-mono text-xs font-black text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-lg">
                    ${model.api_pricing.input_price_per_1m.toFixed(2)} <span className="text-muted font-normal">/ 1M</span>
                  </span>
                  <button
                    onClick={() => setCodeModalModel(model)}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-950/60 dark:hover:bg-purple-900/80 dark:text-purple-300 dark:border-purple-800 transition-all flex items-center gap-1"
                    title="API 연동 코드 스니펫 보기"
                  >
                    <span>⚡</span> {t.dashboard.apiCode}
                  </button>
                  <a
                    href={model.source_docs_url || model.official_url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => track('external_link_click', { label: model.name })}
                    className="text-xs font-bold text-muted hover:text-blue-600 dark:text-slate-400 dark:hover:text-cyan-400 transition-colors px-1"
                  >
                    Docs ↗
                  </a>
                  <button
                    onClick={() => handleToggle(model.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all shadow-sm ${
                      isSelected
                        ? 'bg-emerald-700 hover:bg-emerald-500 text-white border border-emerald-400 shadow-emerald-600/30'
                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
                    }`}
                  >
                    {isSelected ? t.dashboard.compared : t.dashboard.compareButton}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Code Snippet Modal */}
      <CodeSnippetModal
        model={codeModalModel}
        onClose={() => setCodeModalModel(null)}
      />
    </div>
  );
};
