import { useState } from 'react';
import { X, Copy, Check, ExternalLink, Code2, Lightbulb } from 'lucide-react';
import { getCodeSnippetForModel } from '../data/modelCodeSnippets';
import type { ModelSpec } from '../types';

interface CodeSnippetModalProps {
  model: ModelSpec | null;
  onClose: () => void;
}

type LangTab = 'python' | 'javascript' | 'curl' | 'langchain';

export const CodeSnippetModal = ({ model, onClose }: CodeSnippetModalProps) => {
  const [activeTab, setActiveTab] = useState<LangTab>('python');
  const [copied, setCopied] = useState(false);

  if (!model) return null;

  const snippet = getCodeSnippetForModel(model);

  const getCode = () => {
    switch (activeTab) {
      case 'python':
        return snippet.python;
      case 'javascript':
        return snippet.javascript;
      case 'curl':
        return snippet.curl;
      case 'langchain':
        return snippet.langchain;
      default:
        return snippet.python;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabs: { id: LangTab; label: string; icon: string }[] = [
    { id: 'python', label: 'Python (SDK)', icon: '🐍' },
    { id: 'javascript', label: 'JavaScript (Node)', icon: '🟨' },
    { id: 'curl', label: 'cURL (REST API)', icon: '🌐' },
    { id: 'langchain', label: 'LangChain', icon: '🦜🔗' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
              <Code2 className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {model.provider_name}
                </span>
                <h2 className="text-lg font-bold text-white">{model.name}</h2>
              </div>
              {/* 카탈로그 내부 id(openai-gpt-5.6-luna)가 아니라 코드에 실제로 들어가는 값을 보여준다. */}
              <p className="text-xs text-muted font-mono mt-0.5">Model ID: {snippet.apiModelId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-muted hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar & Key Link */}
        <div className="px-6 py-3 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <KeyIcon className="w-4 h-4 text-cyan-400" />
            <span>API Key 발급:</span>
            <a
              href={snippet.apiKeyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300 underline font-semibold flex items-center gap-1"
            >
              공식 콘솔 바로가기 <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-muted">Context: <strong className="text-white">{model.context_window.toLocaleString()}</strong> tokens</span>
          </div>
        </div>

        {/* Tab Buttons & Copy Button */}
        <div className="px-4 sm:px-6 pt-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 rounded-t-xl text-xs font-bold transition-all flex items-center gap-1.5 border-t border-x shrink-0 whitespace-nowrap min-h-[38px] ${
                  activeTab === tab.id
                    ? 'bg-slate-950 text-cyan-400 border-cyan-500/50 border-b-slate-950 shadow-sm'
                    : 'bg-slate-800/40 text-muted border-transparent hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <button
            onClick={handleCopy}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-sm mb-1 shrink-0 whitespace-nowrap min-h-[36px] ${
              copied
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" /> 복사 완료!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" /> 코드 복사
              </>
            )}
          </button>
        </div>

        {/* Code Content Box */}
        <div className="p-6 bg-slate-950 overflow-y-auto flex-1 font-mono text-xs text-slate-200 leading-relaxed relative">
          <pre className="whitespace-pre-wrap break-words">{getCode()}</pre>
        </div>

        {/* Tip Bar */}
        {snippet.tip && (
          <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-start gap-2.5 text-xs text-slate-300">
            <Lightbulb className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-yellow-400">💡 연동 실전 팁:</strong> {snippet.tip}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function KeyIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="7.5" cy="15.5" r="5.5" />
      <path d="m21 2-9.6 9.6" />
      <path d="m15.5 7.5 3 3" />
    </svg>
  );
}
