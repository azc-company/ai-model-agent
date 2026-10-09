// 피드백 위젯. 기사 👍/👎 누적 수만 공개하고(0 은 숨김), 오류 신고·추천기 결과는 비공개.
// 내 표는 브라우저에 기억해 다시 열어도 눌린 상태로 보인다.
import React, { useEffect, useState } from 'react';
import { ThumbsUp, ThumbsDown, Flag } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { fetchFeedbackCounts, sendFeedback, type FeedbackKind } from '../analytics';

type Vote = 'up' | 'down';

const remembered = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const remember = (key: string, v: string) => { try { localStorage.setItem(key, v); } catch { /* 사생활 모드 등 */ } };

/** 👍/👎. 한 사람당 한 표 — 같은 버튼을 다시 누르면 취소, 반대 버튼이면 바꾼다.
 *  기사(article_helpful)는 누적 수를 보여 준다. 0 은 숨긴다("♡ 0" 은 역효과).
 *  추천기처럼 reasons 를 주면 👎 뒤에 이유를 하나 고르게 한다. */
export const HelpfulVote: React.FC<{
  kind: Extract<FeedbackKind, 'article_helpful' | 'advisor_helpful'>;
  target: string;
  question: string;
  reasons?: Array<[string, string]>;   // [값, 표시 문구]
}> = ({ kind, target, question, reasons }) => {
  const { t } = useLanguage();
  const f = t.feedback;
  const key = `fb:${kind}:${target}`;
  const [mine, setMine] = useState<Vote | null>(() => {
    const v = remembered(key);
    return v === 'up' || v === 'down' ? v : null;
  });
  const [asking, setAsking] = useState(false);
  const [counts, setCounts] = useState<{ up: number; down: number } | null>(null);

  useEffect(() => {
    if (kind !== 'article_helpful') return;
    let alive = true;
    fetchFeedbackCounts(target).then((c) => { if (alive) setCounts(c); });
    return () => { alive = false; };
  }, [kind, target]);

  const apply = (next: Vote | null, reason?: string) => {
    sendFeedback(kind, target, next ?? 'clear', reason);
    remember(key, next ?? '');
    // 서버를 다시 읽지 않고 내 표만 반영한다.
    setCounts((c) => {
      if (!c) return c;
      const n = { ...c };
      if (mine) n[mine] = Math.max(0, n[mine] - 1);
      if (next) n[next] += 1;
      return n;
    });
    setMine(next);
    setAsking(false);
  };
  const vote = (value: Vote) => {
    if (mine === value) return apply(null);
    if (value === 'down' && reasons?.length) { setAsking(true); return; }
    apply(value);
  };

  const btn = (on: boolean) => `focus-ring inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black border ${on
    ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-cyan-300 dark:border-cyan-500'
    : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-cyan-400'}`;
  const count = (v: Vote) => (counts?.[v] ? <span className="tabular-nums">{counts[v]}</span> : null);

  if (asking) {
    return (
      <div className="flex flex-wrap items-center gap-2 text-xs" aria-live="polite">
        <span className="font-bold text-slate-700 dark:text-slate-300">{f.whyNot}</span>
        {reasons!.map(([v, label]) => (
          <button key={v} className={btn(false)} onClick={() => apply('down', v)}>{label}</button>
        ))}
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs" aria-live="polite">
      <span className="font-bold text-slate-700 dark:text-slate-300">{question}</span>
      <button className={btn(mine === 'up')} aria-pressed={mine === 'up'} onClick={() => vote('up')}>
        <ThumbsUp className="w-3.5 h-3.5" /> {f.yes} {count('up')}
      </button>
      <button className={btn(mine === 'down')} aria-pressed={mine === 'down'} onClick={() => vote('down')}>
        <ThumbsDown className="w-3.5 h-3.5" /> {f.no} {count('down')}
      </button>
      {mine && <span className="font-semibold text-muted">{f.thanks}</span>}
    </div>
  );
};

/** 모델 데이터 오류 신고. 접혀 있다가 누르면 항목 선택 + 짧은 메모. */
export const ReportDataError: React.FC<{ modelId: string }> = ({ modelId }) => {
  const { t } = useLanguage();
  const f = t.feedback;
  const [open, setOpen] = useState(false);
  const [field, setField] = useState('price');
  const [note, setNote] = useState('');
  const [sent, setSent] = useState(false);

  if (sent) return <p className="text-xs font-semibold text-muted" aria-live="polite">{f.reportThanks}</p>;
  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="focus-ring inline-flex items-center gap-1.5 text-xs font-bold text-muted hover:text-rose-600 dark:hover:text-rose-400">
        <Flag className="w-3.5 h-3.5" /> {f.reportLink}
      </button>
    );
  }
  const fields: Array<[string, string]> = [
    ['price', f.fieldPrice], ['context', f.fieldContext], ['benchmark', f.fieldBenchmark],
    ['description', f.fieldDescription], ['other', f.fieldOther],
  ];
  return (
    <form
      className="space-y-2 rounded-xl border border-slate-200 dark:border-slate-800 p-3 max-w-xl"
      onSubmit={(e) => { e.preventDefault(); sendFeedback('model_error', modelId, field, note.trim() || undefined); setSent(true); }}
    >
      <fieldset className="flex flex-wrap items-center gap-2 text-xs">
        <legend className="font-black text-slate-800 dark:text-slate-200 mb-1">{f.reportTitle}</legend>
        {fields.map(([v, label]) => (
          <label key={v} className="inline-flex items-center gap-1 font-bold cursor-pointer">
            <input type="radio" name="report-field" value={v} checked={field === v} onChange={() => setField(v)} className="accent-indigo-600" />
            {label}
          </label>
        ))}
      </fieldset>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value.slice(0, 300))}
        maxLength={300}
        rows={2}
        placeholder={f.notePlaceholder}
        aria-label={f.reportTitle}
        className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2"
      />
      <div className="flex items-center justify-between gap-2">
        <span className="text-2xs text-muted">{f.privacy}</span>
        <span className="flex gap-2">
          <button type="button" onClick={() => setOpen(false)} className="focus-ring px-3 py-1.5 rounded-lg text-xs font-bold text-muted">{f.cancel}</button>
          <button type="submit" className="focus-ring px-3 py-1.5 rounded-lg text-xs font-black bg-indigo-600 text-white">{f.send}</button>
        </span>
      </div>
    </form>
  );
};
