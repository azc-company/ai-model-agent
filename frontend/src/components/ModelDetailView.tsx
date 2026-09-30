// 모델 상세 화면. 카탈로그 카드는 설명을 두 줄에서 자르고, 그 설명마저 OpenRouter 가
// 200자 안팎으로 잘라서 준다. 여기서는 설명을 자르지 않고 보여주되, 세부 내용은
// 이미 가진 수치(단가·한도·벤치마크 순위·서빙 프로바이더·관련 기사·대안)로 채운다.
//
// 넣지 않은 것: architecture 는 피드 모델 529개에 'Dense' 가 하드코딩돼 있고(MoE 포함),
// parameter_count·quota·hardware_requirements 는 전 모델이 비어 있다. 틀리거나 빈 값을
// 상세 정보처럼 보여주지 않는다.
import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Link2, Check, ExternalLink } from 'lucide-react';
import type { ModelSpec } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { fetchModelDetail } from '../api';
import { rankOf, alternativesFor, isTruncated, apiModelIdOf } from '../data/modelDetail';
import { track } from '../analytics';

interface RelatedNews { id: string; title: string; report_type?: string; created_at: string }
interface ServingProvider {
  provider_name: string; tag: string; quantization: string | null;
  input_per_1m: number | null; output_per_1m: number | null; uptime_30m: number | null;
}

interface Props {
  model: ModelSpec;
  allModels: ModelSpec[];
  comparedIds: string[];
  onBack: () => void;
  onOpenModel: (id: string) => void;
  onOpenArticle: (id: string) => void;
  onShowCode: (m: ModelSpec) => void;
  onToggleCompare: (id: string) => void;
}

const money = (n: number | null | undefined) =>
  n == null ? '—' : `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
const num = (n: number | null | undefined) => (n ? n.toLocaleString() : '—');

const Card: React.FC<{ title: string; note?: string; children: React.ReactNode }> = ({ title, note, children }) => (
  <section className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
    <div>
      <h2 className="text-sm font-black text-slate-900 dark:text-white">{title}</h2>
      {note && <p className="text-xs text-muted font-semibold mt-0.5">{note}</p>}
    </div>
    {children}
  </section>
);

export const ModelDetailView: React.FC<Props> = ({
  model, allModels, comparedIds, onBack, onOpenModel, onOpenArticle, onShowCode, onToggleCompare,
}) => {
  const { t } = useLanguage();
  const d = t.modelDetail;
  const [news, setNews] = useState<RelatedNews[]>([]);
  const [serving, setServing] = useState<ServingProvider[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0 });
    track('model_open', { label: model.name });
    let alive = true;
    // 관련 기사·서빙 프로바이더만 따로 받는다. 설명·수치는 목록이 이미 가진 값(언어별 번역 포함)을 쓴다.
    fetchModelDetail(model.id)
      .then((r: any) => {
        if (!alive) return;
        setNews(r.related_news || []);
        setServing(r.serving_providers || []);
      })
      .catch(() => { /* 부가 정보라 실패해도 본문은 그대로 보여준다 */ });
    return () => { alive = false; };
  }, [model.id, model.name]);

  const arena = useMemo(() => rankOf(model, allModels, (m) => m.benchmarks?.arena_elo), [model, allModels]);
  const gpqa = useMemo(() => rankOf(model, allModels, (m) => m.benchmarks?.gpqa), [model, allModels]);
  const alternatives = useMemo(() => alternativesFor(model, allModels), [model, allModels]);
  const docsUrl = model.source_docs_url || model.official_url;
  const isCompared = comparedIds.includes(model.id);
  const rankText = (r: { rank: number; of: number } | null) =>
    r ? d.rank.replace('{r}', String(r.rank)).replace('{n}', String(r.of)) : '';

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }).catch(() => {});
  };

  const facts: Array<[string, string]> = [
    [`${d.input} (${d.per1m})`, money(model.api_pricing?.input_price_per_1m)],
    [`${d.output} (${d.per1m})`, money(model.api_pricing?.output_price_per_1m)],
    [d.context, `${num(model.context_window)} ${d.tokens}`],
    [d.maxOutput, `${num(model.max_output_tokens)} ${d.tokens}`],
    [d.modality, (model.modality || []).join(' · ') || '—'],
    [d.license, model.license_type || '—'],
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8 space-y-6 animate-fadeIn">
      {/* 상단 바 */}
      <div className="flex items-center justify-between gap-3">
        <button onClick={onBack}
          className="focus-ring inline-flex items-center gap-1.5 text-sm font-black text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-cyan-400">
          <ArrowLeft className="w-4 h-4" /> {d.back}
        </button>
        <button onClick={copyLink}
          className="focus-ring inline-flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-500">
          {copied ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
          {copied ? d.copied : d.copyLink}
        </button>
      </div>

      {/* 머리말 */}
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-black uppercase tracking-wider text-blue-700 dark:text-cyan-400">{model.provider_name}</span>
          {model.is_new && <span className="text-2xs px-2 py-0.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white font-black">✨ NEW</span>}
          <span className="text-2xs px-2 py-0.5 rounded-full font-bold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300">{model.tier}</span>
          <span className={`text-2xs px-2 py-0.5 rounded-full font-bold border ${model.is_open_weight
            ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30'
            : 'bg-indigo-100 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-300 dark:border-indigo-500/30'}`}>
            {model.is_open_weight ? t.dashboard.openWeight : t.dashboard.proprietary}
          </span>
          {model.supports_reasoning && (
            <span className="text-2xs px-2 py-0.5 rounded-full font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-500/40">🧠 {d.reasoning}</span>
          )}
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">{model.name}</h1>
        <p className="text-2xs text-muted font-bold font-mono">
          {model.first_seen_at && <>{d.firstSeen} {model.first_seen_at.slice(0, 10)} · </>}
          {d.lastVerified} {(model.updated_at || '').slice(0, 10)}
        </p>
        {model.source && model.source !== 'feed' && (
          <p className="text-xs text-muted font-semibold border-l-2 border-slate-300 dark:border-slate-700 pl-3">{d.staleNote}</p>
        )}
        <div className="space-y-1.5 max-w-3xl">
          <p className="text-sm sm:text-base text-slate-700 dark:text-slate-200 leading-relaxed font-semibold">{model.description}</p>
          <p className="text-2xs text-muted font-bold">
            {d.summaryNote}
            {isTruncated(model.description) && docsUrl && (
              <> · <a href={docsUrl} target="_blank" rel="noopener noreferrer"
                onClick={() => track('external_link_click', { label: model.name })}
                className="underline hover:text-indigo-600 dark:hover:text-cyan-400">{d.fullDescription} ↗</a></>
            )}
          </p>
        </div>
      </header>

      {/* 동작 */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => onShowCode(model)}
          className="focus-ring px-4 py-2 rounded-xl text-xs font-black text-white bg-gradient-to-r from-violet-600 to-indigo-600 shadow-sm">
          ⚡ {t.dashboard.apiCode}
        </button>
        {docsUrl && (
          <a href={docsUrl} target="_blank" rel="noopener noreferrer"
            onClick={() => track('external_link_click', { label: model.name })}
            className="focus-ring inline-flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-black bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
            {t.dashboard.officialDocs.replace(/\s*↗\s*$/, '')} <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
        <button onClick={() => onToggleCompare(model.id)}
          className={`focus-ring px-4 py-2 rounded-xl text-xs font-black ${isCompared
            ? 'bg-emerald-600 text-white' : 'bg-cyan-700 text-white'}`}>
          {isCompared ? t.dashboard.compared : t.dashboard.compareButton}
        </button>
      </div>

      {/* 핵심 사양 */}
      <Card title={d.keyFacts}>
        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-slate-200 dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
          {facts.map(([k, v]) => (
            <div key={k} className="bg-white dark:bg-slate-900 p-3">
              <dt className="text-2xs text-muted font-bold">{k}</dt>
              <dd className="text-sm sm:text-base font-black text-slate-900 dark:text-white font-mono tabular-nums break-words">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="text-2xs text-muted font-bold">
          {d.apiModelId}: <code className="font-mono text-slate-700 dark:text-slate-300">{apiModelIdOf(model)}</code>
        </p>
      </Card>

      {/* 벤치마크 — 값이 있을 때만 */}
      {(arena || gpqa) && (
        <Card title={d.benchmarks} note={d.benchSource}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {arena && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                <div className="text-2xs text-muted font-bold">LMArena{model.benchmarks.arena_variant ? ` (${model.benchmarks.arena_variant})` : ''}</div>
                <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">{num(model.benchmarks.arena_elo)}</div>
                <div className="text-xs font-bold text-slate-600 dark:text-slate-400">{rankText(arena)}</div>
              </div>
            )}
            {gpqa && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                <div className="text-2xs text-muted font-bold">GPQA Diamond</div>
                <div className="text-2xl font-black text-indigo-600 dark:text-cyan-400 font-mono">{model.benchmarks.gpqa}%</div>
                <div className="text-xs font-bold text-slate-600 dark:text-slate-400">{rankText(gpqa)}</div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* 서빙 프로바이더 — 비교 데이터가 있는 모델만 */}
      {serving.length > 0 && (
        <Card title={`${d.servingProviders} (${serving.length})`} note={d.servingNote}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-muted font-bold border-b border-slate-200 dark:border-slate-800">
                  <th className="py-2 pr-3" aria-label={d.servingProviders} />
                  <th className="py-2 pr-3">{d.quant}</th>
                  <th className="py-2 pr-3 text-right">{d.input}</th>
                  <th className="py-2 pr-3 text-right">{d.output}</th>
                  <th className="py-2 text-right">{d.uptime}</th>
                </tr>
              </thead>
              <tbody>
                {serving.map((p) => (
                  <tr key={p.tag} className="border-b border-slate-100 dark:border-slate-800/60">
                    <td className="py-2 pr-3 font-black text-slate-900 dark:text-white">{p.provider_name}</td>
                    <td className="py-2 pr-3 font-mono text-slate-600 dark:text-slate-400">{p.quantization || '—'}</td>
                    <td className="py-2 pr-3 font-mono text-right tabular-nums">{money(p.input_per_1m)}</td>
                    <td className="py-2 pr-3 font-mono text-right tabular-nums">{money(p.output_per_1m)}</td>
                    <td className="py-2 font-mono text-right tabular-nums">{p.uptime_30m == null ? '—' : `${p.uptime_30m.toFixed(1)}%`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* 관련 기사 */}
      <Card title={d.relatedNews}>
        {news.length === 0 ? (
          <p className="text-xs text-muted font-semibold">{d.noNews}</p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {news.map((n) => (
              <li key={n.id}>
                <button onClick={() => onOpenArticle(n.id)}
                  className="focus-ring w-full text-left py-2.5 flex items-baseline justify-between gap-3 group">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-cyan-400">{n.title}</span>
                  <span className="text-2xs text-muted font-mono shrink-0">{(n.created_at || '').slice(0, 10)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* 대안 */}
      {alternatives.length > 0 && (
        <Card title={d.alternatives} note={d.alternativesNote}>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {alternatives.map((a) => (
              <li key={a.id} className="py-2.5 flex items-center justify-between gap-3">
                <button onClick={() => onOpenModel(a.id)}
                  className="focus-ring text-left min-w-0">
                  <div className="text-sm font-black text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-cyan-400 truncate">{a.name}</div>
                  <div className="text-2xs text-muted font-mono">
                    {d.input} {money(a.api_pricing.input_price_per_1m)} · {d.output} {money(a.api_pricing.output_price_per_1m)} · {d.context} {num(a.context_window)}
                  </div>
                </button>
                <button onClick={() => onToggleCompare(a.id)}
                  className={`focus-ring shrink-0 px-3 py-1.5 rounded-lg text-2xs font-black text-white ${
                    comparedIds.includes(a.id) ? 'bg-emerald-600' : 'bg-cyan-700'}`}>
                  {comparedIds.includes(a.id) ? t.dashboard.compared : t.dashboard.compareButton}
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
};
