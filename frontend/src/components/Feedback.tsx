// 비공개 피드백 위젯. 집계 숫자를 화면에 내지 않는다(사람이 적을 때 "0" 은 역효과).
// 눌렀다는 사실만 브라우저에 기억해 같은 사람에게 다시 묻지 않는다.
import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, Flag } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { sendFeedback, type FeedbackKind } from '../analytics';

const remembered = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const remember = (key: string, v: string) => { try { localStorage.setItem(key, v); } catch { /* 사생활 모드 등 */ } };

/** 👍/👎. 추천기처럼 reasons 를 주면 👎 뒤에 이유를 하나 고르게 한다. */
export const HelpfulVote: React.FC<{
  kind: Extract<FeedbackKind, 'article_helpful' | 'advisor_helpful'>;
  target: string;
  question: string;
  reasons?: Array<[string, string]>;   // [값, 표시 문구]
}> = ({ kind, target, question, reasons }) => {
  const { t } = useLanguage();
  const f = t.feedback;
  const key = `fb:${kind}:${target}`;
  const [state, setState] = useState<'idle' | 'why' | 'done'>(() => (remembered(key) ? 'done' : 'idle'));

  const vote = (value: 'up' | 'down') => {
    if (value === 'down' && reasons?.length) { setState('why'); return; }
    sendFeedback(kind, target, value);
    remember(key, value);
    setState('done');
  };
  const because = (reason: string) => {
    sendFeedback(kind, target, 'down', reason);
    remember(key, 'down');
    setState('done');
  };

  const btn = 'focus-ring inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-cyan-400';
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs" aria-live="polite">
      {state === 'done' ? (
        <span className="font-semibold text-muted">{f.thanks}</span>
      ) : state === 'why' ? (
        <>
          <span className="font-bold text-slate-700 dark:text-slate-300">{f.whyNot}</span>
          {reasons!.map(([v, label]) => (
            <button key={v} className={btn} onClick={() => because(v)}>{label}</button>
          ))}
        </>
      ) : (
        <>
          <span className="font-bold text-slate-700 dark:text-slate-300">{question}</span>
          <button className={btn} onClick={() => vote('up')}><ThumbsUp className="w-3.5 h-3.5" /> {f.yes}</button>
          <button className={btn} onClick={() => vote('down')}><ThumbsDown className="w-3.5 h-3.5" /> {f.no}</button>
        </>
      )}
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
