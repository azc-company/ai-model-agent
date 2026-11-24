import React, { useState } from 'react';
import { ChevronDown, ExternalLink } from 'lucide-react';

export interface NewsSource { name: string; url: string }

interface NewsSourcesProps {
  sources?: NewsSource[];
  fallbackUrl?: string;
  fallbackLabel?: string;
  regionLabel?: string;
  toggleLabel?: string;   // {n} 자리에 출처 개수
}

export const NewsSources: React.FC<NewsSourcesProps> = ({ sources = [], fallbackUrl, fallbackLabel = '원문 기사 보기', regionLabel = '원문 출처', toggleLabel = '원문 출처 {n}개 보기' }) => {
  const [open, setOpen] = useState(false);
  const validSources = sources.filter((source) => source.url);

  if (!validSources.length) return fallbackUrl ? <a href={fallbackUrl} target="_blank" rel="noopener noreferrer" className="touch-target focus-ring inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white">{fallbackLabel}<ExternalLink className="h-4 w-4" /></a> : null;

  return <section className="w-full sm:w-72" aria-label={regionLabel}>
    <button type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)} className="touch-target focus-ring flex w-full items-center justify-between rounded-xl border border-blue-200 bg-blue-50 px-4 text-sm font-black text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300">
      {toggleLabel.replace('{n}', String(validSources.length))} <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
    </button>
    {open && <ul className="mt-2 grid gap-2">{validSources.map((source) => <li key={`${source.name}-${source.url}`}><a href={source.url} target="_blank" rel="noopener noreferrer" className="touch-target focus-ring flex items-center justify-between gap-3 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white"><span className="truncate">{source.name}</span><ExternalLink className="h-4 w-4 shrink-0" /></a></li>)}</ul>}
  </section>;
};
