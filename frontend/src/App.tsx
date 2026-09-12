// 🚀 Cloudflare Workers CI/CD Pipeline Active
import React, { lazy, Suspense, useState, useEffect, useRef, useMemo } from 'react';
import type { ModelSpec, Provider } from './types';
import { fetchModels, fetchProviders } from './api';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppShell } from './components/AppShell';
import { isAppTab, type AppTab } from './navigation/navigationConfig';
import { track } from './analytics';

const Dashboard = lazy(() => import('./components/Dashboard').then((module) => ({ default: module.Dashboard })));
const CompareView = lazy(() => import('./components/CompareView').then((module) => ({ default: module.CompareView })));
const TCOSimulatorView = lazy(() => import('./components/TCOSimulatorView').then((module) => ({ default: module.TCOSimulatorView })));
const ArchitectureAdvisor = lazy(() => import('./components/ArchitectureAdvisor').then((module) => ({ default: module.ArchitectureAdvisor })));
const TutorialView = lazy(() => import('./components/TutorialView').then((module) => ({ default: module.TutorialView })));
const LeaderboardView = lazy(() => import('./components/LeaderboardView').then((module) => ({ default: module.LeaderboardView })));
const GPUListView = lazy(() => import('./components/GPUListView').then((module) => ({ default: module.GPUListView })));
const NewsPulseView = lazy(() => import('./components/NewsPulseView'));
const TokenizerSandboxView = lazy(() => import('./components/TokenizerSandboxView').then((module) => ({ default: module.TokenizerSandboxView })));
const SpeedMonitorView = lazy(() => import('./components/SpeedMonitorView').then((module) => ({ default: module.SpeedMonitorView })));

/** 검색어가 모델/프로바이더 이름에 실제로 걸리는지. 걸리지 않으면 서버로 보내지 않는다. */
export function matchesCatalog(term: string, models: ModelSpec[], providers: Provider[]): boolean {
  const needle = term.toLowerCase();
  if (needle.length < 2) return false;
  return models.some((m) => m.name?.toLowerCase().includes(needle) || m.provider_name?.toLowerCase().includes(needle))
    || providers.some((p) => p.name?.toLowerCase().includes(needle));
}

export const AppContent: React.FC = () => {
  const { language, t } = useLanguage();
  // URL query parameter ?tab= 및 ?article= 파싱으로 북마크/즐겨찾기 라우팅 초기화
  const getInitialTab = (): AppTab => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    const articleParam = params.get('article');
    if (articleParam) return 'news';
    if (isAppTab(tabParam)) {
      return tabParam;
    }
    return 'dashboard';
  };

  const [activeTab, setActiveTabState] = useState<AppTab>(getInitialTab);
  const [models, setModels] = useState<ModelSpec[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedModelIds, setSelectedModelIds] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Global Search State
  const [globalSearchQuery, setGlobalSearchQuery] = useState<string>('');

  const searchTrackTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const handleGlobalSearch = (query: string) => {
    setGlobalSearchQuery(query);
    if (activeTab !== 'dashboard') {
      setActiveTab('dashboard');
    }
    clearTimeout(searchTrackTimer.current);
    const term = query.trim();
    if (term) {
      // 검색창은 자유 입력이라 원문을 그대로 올리면 PII 가 섞인 채 어드민 '인기 검색어'에
      // 그대로 뜬다. 카탈로그에 실제로 걸리는 말만 라벨로 보내면 통계 가치는 유지하면서
      // 아무렇게나 입력한 문자열은 브라우저 밖으로 나가지 않는다.
      const label = matchesCatalog(term, models, providers) ? term : undefined;
      searchTrackTimer.current = setTimeout(() => track('search', { label }), 600);
    }
  };

  // 탭 변경 시 URL 파라미터 주소창 자동 동기화 (즐겨찾기/링크 공유 가능)
  const setActiveTab = (tab: AppTab) => {
    setActiveTabState(tab);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    // ?article= 은 뉴스 탭에서만 의미가 있다. 남겨 두면 다른 탭에 갔다가 돌아왔을 때
    // NewsPulseView 가 URL 을 읽어 보던 기사를 다시 열어 버린다 — 목록을 기대한
    // 독자에게는 화면이 멈춘 것처럼 보인다.
    if (tab !== 'news') {
      url.searchParams.delete('article');
    }
    window.history.pushState({}, '', url.toString());
  };

  // 탭 뷰가 실제로 바뀔 때마다 방문을 기록한다 — 초기 진입/네비게이션/뒤로가기를 한 곳에서 커버
  useEffect(() => {
    track('page_view', { tab: activeTab });
  }, [activeTab]);

  // 브라우저 뒤로가기/앞으로가기 (popstate) 감지
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      setActiveTabState(isAppTab(tabParam) ? tabParam : 'dashboard');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [modelsData, providersData] = await Promise.all([
          fetchModels({ lang: language }),
          fetchProviders(),
        ]);
        setModels(modelsData);
        setProviders(providersData);
      } catch (err: any) {
        setError(t.nav.errorCatalog);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [language]);

  const handleToggleCompare = (modelId: string) => {
    setSelectedModelIds((prev) => {
      const removing = prev.includes(modelId);
      track(removing ? 'compare_remove' : 'compare_add', { label: modelId });
      return removing ? prev.filter((id) => id !== modelId) : [...prev, modelId];
    });
  };

  const handleClearCompare = () => {
    setSelectedModelIds([]);
  };

  // 헤더에 580+ / 24 를 박아 두었더니 카탈로그가 612 / 69 로 자라도 그대로였다.
  const catalogStats = useMemo(
    () => ({ models: models.length, providers: new Set(models.map((m) => m.provider_name)).size }),
    [models],
  );

  return (
    <AppShell activeTab={activeTab} onNavigate={setActiveTab} compareCount={selectedModelIds.length} globalSearchQuery={globalSearchQuery} onGlobalSearch={handleGlobalSearch} catalogStats={catalogStats}>
        <main className="flex-1 max-w-[var(--content-max)] w-full mx-auto px-2.5 sm:px-6 py-4 sm:py-8" aria-busy={loading || undefined}>
          {loading && models.length === 0 ? (
            <div>
              <div className="h-8 w-64 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse" />
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {[0, 1, 2].map((item) => <div key={item} className="h-48 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 animate-pulse" />)}
              </div>
              <p className="sr-only">LLM COMPASS Loading...</p>
            </div>
          ) : error ? (
            <div className="glass-card max-w-md mx-auto p-8 text-center rounded-2xl border border-red-500/30">
              <h2 className="text-xl font-bold text-red-500 mb-2">{t.nav.errorTitle}</h2>
              <p className="text-muted text-sm mb-4">{error}</p>
              <button onClick={() => window.location.reload()} className="touch-target focus-ring px-4 py-2 bg-accent hover:bg-cyan-500 rounded-lg text-sm font-semibold text-white">{t.nav.retry}</button>
            </div>
          ) : <Suspense fallback={<div role="status" className="grid grid-cols-1 sm:grid-cols-2 gap-4" aria-label={t.nav.loadingView}><div className="h-48 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-900" /><div className="h-48 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-900" /></div>}>
          {activeTab === 'dashboard' && (
            <Dashboard
              models={models}
              providers={providers}
              selectedModelIds={selectedModelIds}
              onToggleCompare={handleToggleCompare}
              onClearCompare={handleClearCompare}
              onGoToCompare={() => setActiveTab('compare')}
              globalSearchQuery={globalSearchQuery}
            />
          )}

          {activeTab === 'compare' && (
            <CompareView
              models={models}
              selectedModelIds={selectedModelIds}
              onToggleCompare={handleToggleCompare}
              onGoToDashboard={() => setActiveTab('dashboard')}
            />
          )}

          {activeTab === 'tco' && <TCOSimulatorView models={models} />}

          {activeTab === 'advisor' && <ArchitectureAdvisor />}

          {activeTab === 'tutorial' && <TutorialView />}

          {activeTab === 'leaderboard' && <LeaderboardView models={models} />}

          {activeTab === 'gpus' && <GPUListView />}
          
          {activeTab === 'news' && <NewsPulseView />}

          {activeTab === 'sandbox' && (
            <TokenizerSandboxView
              models={models}
              onToggleCompare={handleToggleCompare}
              selectedModelIds={selectedModelIds}
            />
          )}

          {activeTab === 'speed' && <SpeedMonitorView />}
          </Suspense>}
        </main>

        <footer className="mobile-safe-bottom border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 py-6 text-center text-xs text-muted">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p>
              © 2026 LLM COMPASS - Global AI Model Spec &amp; TCO Analytics Platform
              <span className="mx-2 text-slate-300 dark:text-slate-700">·</span>
              <a href={`/changelog?lang=${language}`} className="focus-ring font-semibold text-cyan-700 hover:underline dark:text-cyan-400">
                {t.nav.updates}
              </a>
            </p>
            <p className="text-muted">Supported Languages: 🇰🇷 한국어 | 🇺🇸 English | 🇯🇵 日本語 | 🇨🇳 中文</p>
          </div>
        </footer>
    </AppShell>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default App;
