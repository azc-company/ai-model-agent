import React, { useState } from 'react';

import type { AppTab } from '../navigation/navigationConfig';
import { HeaderTopBar } from './HeaderTopBar';
import { SidebarNav } from './SidebarNav';
import { MobileBottomNav } from './MobileBottomNav';

interface AppShellProps {
  activeTab: AppTab;
  onNavigate: (tab: AppTab) => void;
  compareCount: number;
  globalSearchQuery?: string;
  onGlobalSearch?: (query: string) => void;
  catalogStats?: { models: number; providers: number };
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  activeTab,
  onNavigate,
  compareCount,
  globalSearchQuery,
  onGlobalSearch,
  catalogStats,
  children,
}) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors">
      <SidebarNav
        activeTab={activeTab}
        setActiveTab={onNavigate}
        compareCount={compareCount}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        mobileOpen={mobileMenuOpen}
        setMobileOpen={setMobileMenuOpen}
      />
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-16' : 'md:ml-60'}`}>
        <HeaderTopBar
          activeTab={activeTab}
          setActiveTab={onNavigate}
          compareCount={compareCount}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          globalSearchQuery={globalSearchQuery}
          onGlobalSearch={onGlobalSearch}
          catalogStats={catalogStats}
        />
        {children}
      </div>
      <MobileBottomNav activeTab={activeTab} onNavigate={onNavigate} compareCount={compareCount} />
    </div>
  );
};
