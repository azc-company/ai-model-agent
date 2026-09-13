import React, { useState, useMemo } from 'react';
import type { ModelSpec } from '../types';
import { Trophy, Award, BrainCircuit } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { ResponsiveDataTable, type ResponsiveColumn } from './ResponsiveDataTable';

type RankedRow = { model: ModelSpec; rank: number; score: string };

interface LeaderboardViewProps {
  models: ModelSpec[];
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({ models }) => {
  const { t } = useLanguage();
  const [activeBenchmark, setActiveBenchmark] = useState<'arena' | 'gpqa'>('arena');

  const rankedModels = useMemo(() => {
    return [...models]
      .filter((m) => {
        if (activeBenchmark === 'arena') return m.benchmarks.arena_elo != null;
        if (activeBenchmark === 'gpqa') return m.benchmarks.gpqa != null;
        return true;
      })
      .sort((a, b) => {
        let scoreA = 0;
        let scoreB = 0;
        if (activeBenchmark === 'arena') {
          scoreA = a.benchmarks.arena_elo || 0;
          scoreB = b.benchmarks.arena_elo || 0;
        } else if (activeBenchmark === 'gpqa') {
          scoreA = a.benchmarks.gpqa || 0;
          scoreB = b.benchmarks.gpqa || 0;
        }
        return scoreB - scoreA;
      });
  }, [models, activeBenchmark]);

  const rankedRows: RankedRow[] = rankedModels.map((model, index) => {
    const raw = activeBenchmark === 'arena' ? model.benchmarks.arena_elo : model.benchmarks.gpqa;
    return { model, rank: index + 1, score: raw == null ? '-' : activeBenchmark === 'arena' ? String(raw) : `${raw}%` };
  });
  const columns: ResponsiveColumn<RankedRow>[] = [
    { key: 'rank', header: t.leaderboard.rank, priority: 'primary', numeric: true, render: (row) => row.rank <= 3 ? ['🥇', '🥈', '🥉'][row.rank - 1] : `#${row.rank}` },
    { key: 'model', header: t.leaderboard.model, priority: 'primary', render: (row) => <strong>{row.model.name}</strong> },
    { key: 'provider', header: t.leaderboard.provider, priority: 'secondary', render: (row) => row.model.provider_name },
    { key: 'tier', header: t.leaderboard.tier, priority: 'secondary', render: (row) => row.model.tier },
    { key: 'score', header: t.leaderboard.score, priority: 'primary', numeric: true, render: (row) => <strong className="text-accent">{row.score}</strong> },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md">
        <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-2 flex items-center gap-3 tracking-tight">
          <Trophy className="w-8 h-8 text-warn shrink-0" />
          {t.leaderboard.title}
        </h2>
        <p className="text-muted text-sm max-w-3xl font-semibold">
          {t.leaderboard.subtitle}
        </p>
      </div>

      {/* Benchmark Selector Tabs */}
      <div className="flex flex-wrap items-center gap-2.5">
        <button
          onClick={() => setActiveBenchmark('arena')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-black text-xs transition-all shadow-sm ${
            activeBenchmark === 'arena'
              ? 'bg-amber-400 text-slate-950 shadow-md ring-2 ring-amber-400 font-black'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700'
          }`}
        >
          <Award className="w-4 h-4 text-warn" />
          {t.leaderboard.tabArenaElo}
        </button>



        <button
          onClick={() => setActiveBenchmark('gpqa')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-black text-xs transition-all shadow-sm ${
            activeBenchmark === 'gpqa'
              ? 'bg-purple-600 text-white shadow-md ring-2 ring-purple-400 font-black'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700'
          }`}
        >
          <BrainCircuit className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          {t.leaderboard.tabGpqa}
        </button>
      </div>

      {/* CC-BY 4.0 출처 표기. 아레나 점수는 모델별 최고 추론 설정(-high/-max 등) 기준이다. */}
      <p className="text-2xs text-muted font-semibold">
        Arena: <a className="underline" href="https://huggingface.co/datasets/lmarena-ai/leaderboard-dataset" target="_blank" rel="noopener noreferrer">LMArena</a> (CC-BY 4.0, best reasoning setting)
        {' · '}GPQA Diamond: <a className="underline" href="https://epoch.ai/benchmarks" target="_blank" rel="noopener noreferrer">Epoch AI</a> (CC-BY 4.0)
      </p>

      <ResponsiveDataTable rows={rankedRows} columns={columns} getRowId={(row) => row.model.id} caption={t.leaderboard.title} />
    </div>
  );
};
