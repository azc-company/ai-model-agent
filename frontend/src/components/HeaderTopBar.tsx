import React, { useState, useEffect, useRef } from 'react';
import {
  Compass,
  Search,
  ArrowLeftRight,
  Globe,
  Sun,
  Moon,
  Menu,
  X,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import type { Language } from '../i18n/translations';
import type { AppTab } from '../navigation/navigationConfig';

interface HeaderTopBarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  compareCount: number;
  onOpenMobileMenu: () => void;
  globalSearchQuery?: string;
  onGlobalSearch?: (query: string) => void;
  catalogStats?: { models: number; providers: number };
}

export const HeaderTopBar: React.FC<HeaderTopBarProps> = ({
  activeTab,
  setActiveTab,
  compareCount,
  onOpenMobileMenu,
  globalSearchQuery = '',
  onGlobalSearch,
  catalogStats,
}) => {
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState<string>(globalSearchQuery);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSearchQuery(globalSearchQuery);
  }, [globalSearchQuery]);

  // Global Keyboard Shortcut (⌘K / Ctrl+K) Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (onGlobalSearch) {
      onGlobalSearch(val);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-950/80 border-b border-slate-200/80 dark:border-white/10 backdrop-blur-2xl transition-colors shadow-sm h-16 flex items-center px-4 sm:px-6">
      <div className="w-full flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Brand Logo & Live Status Ticker */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenMobileMenu}
            aria-label="메뉴 열기"
            className="touch-target focus-ring md:hidden grid place-items-center rounded-xl text-muted hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="메뉴 열기"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo Branding */}
          <div
            onClick={() => setActiveTab('dashboard')}
            className="md:hidden flex items-center gap-2.5 cursor-pointer group shrink-0"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-cyan-500 p-0.5 shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Compass className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
            <span className="font-black text-base text-slate-900 dark:text-white tracking-wide hidden sm:inline">
              LLM COMPASS
            </span>
          </div>

          {/* Live Status Ticker Badge */}
          <div className="hidden xl:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>{catalogStats?.models ? `${catalogStats.models} AI Models | ${catalogStats.providers} Providers | Live Sync` : 'AI Models | Live Sync'}</span>
          </div>
        </div>

        {/* Center: Global Fast Search Input with Shortcut Hint */}
        <div className="hidden md:block flex-1 max-w-md mx-2">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 dark:text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={inputRef}
              type="search"
              aria-label="전역 모델 검색"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={catalogStats?.models ? `${catalogStats.models}개 모델, 프로바이더, 라이선스 검색...` : '모델, 프로바이더, 라이선스 검색...'}
              className="w-full bg-slate-100/90 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-16 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 dark:focus:border-cyan-500/60 focus:ring-2 focus:ring-indigo-500/20 transition shadow-inner font-bold"
            />

            {/* Clear Button or Cmd+K Badge */}
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {searchQuery ? (
                <button
                  onClick={() => handleSearchChange('')}
                  className="p-1 rounded-full text-muted hover:text-slate-700 dark:hover:text-slate-200 transition"
                  title="검색어 지우기"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <div className="hidden sm:flex items-center gap-0.5 bg-slate-200/80 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded px-1.5 py-0.5 text-2xs font-mono text-muted font-bold pointer-events-none">
                  <span>⌘</span>
                  <span>K</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Quick Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Compare Basket Button */}
          <button
            onClick={() => setActiveTab('compare')}
            aria-label={`${t.nav.compareBasket}${compareCount > 0 ? ` ${compareCount}` : ''}`}
            className={`hidden sm:flex px-3 min-h-[44px] sm:min-h-0 sm:py-1.5 rounded-xl text-xs font-bold items-center gap-1.5 transition ${
              activeTab === 'compare'
                ? 'bg-indigo-600 dark:bg-cyan-500 text-white dark:text-slate-950 font-black shadow-md shadow-indigo-600/30'
                : 'bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-indigo-500/40 hover:text-indigo-600'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.nav.compareBasket}</span>
            {compareCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-indigo-600 dark:bg-cyan-400 text-white dark:text-slate-950 font-black text-2xs shadow-sm">
                {compareCount}
              </span>
            )}
          </button>

          {/* Language Selector Dropdown */}
          <div className="relative flex items-center">
            <Globe className="w-3.5 h-3.5 text-slate-500 dark:text-cyan-400 absolute left-2.5 pointer-events-none" />
            <select
              aria-label="언어 선택"
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="min-h-[44px] md:min-h-0 bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-xl pl-7 pr-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer appearance-none shadow-sm"
            >
              <option value="ko">🇰🇷 한국어</option>
              <option value="en">🇺🇸 English</option>
              <option value="ja">🇯🇵 日本語</option>
              <option value="zh">🇨🇳 中文</option>
              <option value="es">🇪🇸 Español</option>
              <option value="de">🇩🇪 Deutsch</option>
              <option value="fr">🇫🇷 Français</option>
            </select>
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="touch-target focus-ring md:min-w-0 md:min-h-0 grid place-items-center md:p-2 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:border-indigo-500 transition shadow-sm"
            title={theme === 'dark' ? '화사한 라이트 모드로 변경' : '다크 모드로 변경'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
