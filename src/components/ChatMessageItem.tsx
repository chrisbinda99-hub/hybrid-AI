import React, { useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Cpu,
  Sparkles,
  User,
  Clock,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Brain,
  Workflow,
  SplitSquareVertical,
  Scale,
  HardDrive,
  ShieldCheck,
  ShieldAlert,
  Zap,
} from 'lucide-react';
import { ChatMessage } from '../types';

interface Props {
  message: ChatMessage;
  fontSize?: 'normal' | 'large';
}

/**
 * Normalizes Markdown content to repair malformed or collapsed table rows.
 */
function normalizeMarkdownContent(content: string): string {
  if (!content) return '';
  let normalized = content.replace(/\|\s*\|\s*(?=[^|\n]*\|)/g, '|\n|');
  normalized = normalized.replace(/\|\s*\|\s*(:?-+:?)/g, '|\n| $1');
  normalized = normalized.replace(/\|\s*\|/g, '|\n|');
  return normalized;
}

const CodeBlock = ({ inline, className, children, ...props }: any) => {
  const [copied, setCopied] = useState(false);
  const codeString = String(children).replace(/\n$/, '');

  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (inline) {
    return (
      <code className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono text-[13px] border border-slate-700/60" {...props}>
        {children}
      </code>
    );
  }

  return (
    <div className="relative my-3 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-md">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-900 border-b border-slate-800 text-[11px] font-mono text-slate-400">
        <span className="uppercase text-cyan-400 font-semibold">{language || 'Code'}</span>
        <button
          onClick={handleCopy}
          type="button"
          className="flex items-center gap-1 text-slate-400 hover:text-slate-100 transition cursor-pointer"
          title="Code kopieren"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Kopiert' : 'Kopieren'}</span>
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-[13px] sm:text-sm font-mono text-slate-200 leading-relaxed">
        <code>{children}</code>
      </pre>
    </div>
  );
};

const createMarkdownComponents = (fontSize: 'normal' | 'large') => ({
  h1: ({ children, ...props }: any) => (
    <h1
      className={`font-bold text-cyan-200 tracking-tight mt-5 mb-2.5 pb-1 border-b border-slate-800 ${
        fontSize === 'large' ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'
      }`}
      {...props}
    >
      {children}
    </h1>
  ),
  h2: ({ children, ...props }: any) => (
    <h2
      className={`font-semibold text-cyan-300 tracking-tight mt-4 mb-2 ${
        fontSize === 'large' ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl'
      }`}
      {...props}
    >
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: any) => (
    <h3
      className={`font-semibold text-slate-100 mt-3.5 mb-1.5 ${
        fontSize === 'large' ? 'text-lg sm:text-xl' : 'text-base sm:text-lg'
      }`}
      {...props}
    >
      {children}
    </h3>
  ),
  p: ({ children, ...props }: any) => (
    <p
      className={`my-2.5 leading-[1.75] text-slate-200 ${
        fontSize === 'large' ? 'text-base sm:text-lg' : 'text-[15px] sm:text-base'
      }`}
      {...props}
    >
      {children}
    </p>
  ),
  ul: ({ children, ...props }: any) => (
    <ul className="list-disc list-outside ml-5 my-2.5 space-y-1.5 text-slate-200" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: any) => (
    <ol className="list-decimal list-outside ml-5 my-2.5 space-y-1.5 text-slate-200" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }: any) => (
    <li
      className={`pl-1 leading-relaxed ${
        fontSize === 'large' ? 'text-base sm:text-lg' : 'text-[15px] sm:text-base'
      }`}
      {...props}
    >
      {children}
    </li>
  ),
  blockquote: ({ children, ...props }: any) => (
    <blockquote
      className="border-l-4 border-cyan-500/70 bg-cyan-950/20 pl-4 py-2 my-3 rounded-r-xl italic text-slate-300"
      {...props}
    >
      {children}
    </blockquote>
  ),
  table: ({ children, ...props }: any) => (
    <div className="overflow-x-auto my-3.5 rounded-xl border border-slate-700/80 bg-slate-950/70 shadow-sm">
      <table className="w-full text-left border-collapse text-xs sm:text-sm text-slate-200" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }: any) => (
    <thead className="bg-slate-800/90 text-cyan-300 border-b border-slate-700" {...props}>
      {children}
    </thead>
  ),
  tbody: ({ children, ...props }: any) => (
    <tbody className="divide-y divide-slate-800/70" {...props}>
      {children}
    </tbody>
  ),
  tr: ({ children, ...props }: any) => (
    <tr className="even:bg-slate-900/40 odd:bg-slate-950/40 hover:bg-slate-800/30 transition-colors" {...props}>
      {children}
    </tr>
  ),
  th: ({ children, ...props }: any) => (
    <th className="px-4 py-3 font-semibold text-cyan-300 border-r border-slate-800/80 last:border-r-0" {...props}>
      {children}
    </th>
  ),
  td: ({ children, ...props }: any) => (
    <td className="px-4 py-2.5 text-slate-200 border-r border-slate-800/60 last:border-r-0 leading-relaxed" {...props}>
      {children}
    </td>
  ),
  code: CodeBlock,
});

export const ChatMessageItem: React.FC<Props> = ({ message, fontSize = 'normal' }) => {
  const [copied, setCopied] = useState(false);
  const [showOllamaDetails, setShowOllamaDetails] = useState(false);
  const [showGeminiDetails, setShowGeminiDetails] = useState(false);
  const [showHallunoxDetails, setShowHallunoxDetails] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isUser = message.role === 'user';
  const markdownComponents = createMarkdownComponents(fontSize);

  if (isUser) {
    return (
      <div className="flex justify-end my-3 sm:my-4">
        <div className="w-full max-w-3xl lg:max-w-4xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 sm:px-5 sm:py-3.5 shadow-lg shadow-cyan-950/20">
          <div className="flex items-center gap-1.5 text-xs text-cyan-100/90 mb-1 font-medium">
            <User className="w-3.5 h-3.5" />
            <span>Benutzer</span>
            <span>•</span>
            <span>{message.timestamp}</span>
          </div>
          <p
            className={`whitespace-pre-wrap leading-relaxed ${
              fontSize === 'large' ? 'text-base sm:text-lg' : 'text-[15px] sm:text-base'
            }`}
          >
            {message.content}
          </p>
        </div>
      </div>
    );
  }

  // Assistant Response: Render based on Mode
  const meta = message.metadata;
  const isSideBySide = meta?.mode === 'side_by_side';
  const isCollaborative = meta?.mode === 'collaborative';
  const isConsensus = meta?.mode === 'consensus';

  return (
    <div className="my-4 w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm text-slate-100 transition-all">
      {/* Top Header of Response */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800/80 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          {message.engine === 'ollama' ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 font-medium">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ollama (Lokal): {message.modelName}</span>
            </div>
          ) : message.engine === 'gemini' ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-700/60 text-cyan-300 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Google Gemini: {message.modelName}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-700/60 text-indigo-300 font-medium">
              {isSideBySide && <SplitSquareVertical className="w-3.5 h-3.5 text-indigo-400" />}
              {isCollaborative && <Workflow className="w-3.5 h-3.5 text-indigo-400" />}
              {isConsensus && <Scale className="w-3.5 h-3.5 text-indigo-400" />}
              <span>Hybrid-Verbund ({meta?.mode})</span>
            </div>
          )}

          {message.durationMs && (
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <Clock className="w-3 h-3" />
              <span>{message.durationMs}ms</span>
            </div>
          )}
        </div>

        {/* Action button */}
        <button
          onClick={() => copyToClipboard(message.content)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition text-xs cursor-pointer"
          title="Gesamte Antwort kopieren"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Kopiert' : 'Antwort kopieren'}</span>
        </button>
      </div>

      {/* Qwen-Decider Millisecond Decision Head Banner */}
      {meta?.qwenDecider && (
        <div className="mt-3 px-3.5 py-2 rounded-xl bg-violet-950/40 border border-violet-600/50 text-xs text-violet-200 flex flex-col gap-1.5 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
              <span className="font-semibold text-slate-100">Qwen-Decider ({meta.qwenDecider.model}):</span>
              <span className="font-mono text-cyan-300 font-medium">
                {meta.qwenDecider.engine.toUpperCase()} ({Math.round(meta.qwenDecider.confidence * 100)}% Konfidenz)
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-[11px] text-emerald-400 font-mono">
                Latenz: {meta.qwenDecider.latencyMs}ms
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="px-2 py-0.5 rounded bg-violet-900/60 border border-violet-500/40 text-violet-200">
                Datenschutz: {meta.qwenDecider.privacyScore}%
              </span>
              <span className="px-2 py-0.5 rounded bg-cyan-900/60 border border-cyan-500/40 text-cyan-200">
                Komplexität: {meta.qwenDecider.complexityScore}%
              </span>
              {meta.qwenDecider.requiresDriveDKnowledge && (
                <span className="px-2 py-0.5 rounded bg-amber-900/60 border border-amber-500/40 text-amber-200">
                  D:\-RAG
                </span>
              )}
            </div>
          </div>
          <div className="text-[11px] text-slate-300 flex items-start gap-1.5 pl-5">
            <span>{meta.qwenDecider.reason}</span>
          </div>
        </div>
      )}

      {/* Routed Reason Badge if smart router (fallback if no Qwen decider) */}
      {!meta?.qwenDecider && meta?.routedReason && (
        <div className="mt-3 px-3.5 py-1.5 rounded-lg bg-slate-950/70 border border-slate-800 text-xs text-slate-300 flex items-start gap-2">
          <Brain className="w-3.5 h-3.5 text-cyan-400 mt-0.5 shrink-0" />
          <span>{meta.routedReason}</span>
        </div>
      )}

      {/* Drive D Persistence & RAG Indicator Badges */}
      {(meta?.savedToDriveD || message.engine === 'gemini' || message.engine === 'hybrid') && (
        <div className="mt-3 px-3.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <HardDrive className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="font-medium">Cloud-Wissen gesichert:</span>
            <span className="font-mono text-cyan-300 text-[11px]">{meta?.targetPath || 'D:\\OllamaKnowledge\\'}</span>
          </div>
          <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-medium">
            Ollama Offline &amp; Online Archiv
          </span>
        </div>
      )}

      {meta?.driveDKnowledgeUsed !== undefined && meta.driveDKnowledgeUsed > 0 && (
        <div className="mt-3 px-3.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
          <HardDrive className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Offline-RAG: {meta.driveDKnowledgeUsed} archivierte Einträge von Laufwerk D: eingeflossen</span>
        </div>
      )}

      {/* Hallunox Anti-Hallucination Guardrail Badge */}
      {meta?.hallunoxVerification && (
        <div
          className={`mt-3 rounded-xl border text-xs overflow-hidden transition-all ${
            meta.hallunoxVerification.hallucinationRisk === 'high'
              ? 'bg-rose-950/40 border-rose-500/50 text-rose-200'
              : meta.hallunoxVerification.hallucinationRisk === 'moderate'
              ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
              : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
          }`}
        >
          <div className="px-3.5 py-2 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              {meta.hallunoxVerification.hallucinationRisk === 'high' ? (
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-slate-100">Hallunox (PyPI) Guardrail:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {meta.hallunoxVerification.alignmentScore}% Ausrichtung
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-[11px] text-slate-300">
                  Hidden-State: {meta.hallunoxVerification.hiddenStateConfidence}%
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  meta.hallunoxVerification.hallucinationRisk === 'high'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : meta.hallunoxVerification.hallucinationRisk === 'moderate'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}
              >
                Risiko: {meta.hallunoxVerification.hallucinationRisk}
              </span>
              <button
                onClick={() => setShowHallunoxDetails(!showHallunoxDetails)}
                className="text-[11px] text-cyan-300 hover:text-cyan-100 flex items-center gap-0.5 cursor-pointer underline"
              >
                <span>{showHallunoxDetails ? 'Weniger' : 'Details'}</span>
                {showHallunoxDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>
          </div>

          {/* Expandable Hallunox Explanation & Metrics */}
          {showHallunoxDetails && (
            <div className="px-3.5 py-2.5 bg-slate-950/70 border-t border-slate-800/80 text-[11px] text-slate-300 space-y-1.5">
              <p className="leading-relaxed">{meta.hallunoxVerification.explanation}</p>
              <div className="flex flex-wrap items-center gap-3 pt-1 text-[10px] font-mono text-slate-400">
                <span>Projektions-Ähnlichkeit: {meta.hallunoxVerification.semanticProjectionSimilarity}</span>
                <span>•</span>
                <span>Latenz: {meta.hallunoxVerification.latencyMs}ms</span>
                <span>•</span>
                <span>Engine: {meta.hallunoxVerification.engine}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Content Render */}
      {isSideBySide ? (
        // Side-by-side split grid
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Local Ollama Output */}
          <div className="bg-slate-950/70 border border-emerald-900/50 rounded-xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-800/80">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
                <Cpu className="w-4 h-4 text-emerald-400" />
                <span>Ollama ({meta?.ollamaPart?.model})</span>
              </div>
              <span className="text-xs text-slate-400 font-mono">{meta?.ollamaPart?.durationMs}ms</span>
            </div>
            <div className="leading-relaxed max-w-none">
              <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {normalizeMarkdownContent(meta?.ollamaPart?.content || 'Keine Antwort')}
              </Markdown>
            </div>
          </div>

          {/* Cloud Gemini Output */}
          <div className="bg-slate-950/70 border border-cyan-900/50 rounded-xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-800/80">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-300">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Gemini ({meta?.geminiPart?.model})</span>
              </div>
              <span className="text-xs text-slate-400 font-mono">{meta?.geminiPart?.durationMs}ms</span>
            </div>
            <div className="leading-relaxed max-w-none">
              <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {normalizeMarkdownContent(meta?.geminiPart?.content || 'Keine Antwort')}
              </Markdown>
            </div>
          </div>
        </div>
      ) : isCollaborative ? (
        // Collaborative View: Primary Polished Response + Collapsible Local Draft
        <div className="mt-4 space-y-4">
          {meta?.ollamaPart && (
            <div className="border border-slate-800/80 rounded-xl overflow-hidden bg-slate-950/50">
              <button
                onClick={() => setShowOllamaDetails(!showOllamaDetails)}
                className="w-full px-4 py-2.5 flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition"
              >
                <div className="flex items-center gap-2">
                  <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Stufe 1: Lokaler Ollama-Vorentwurf ({meta.ollamaPart.model})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-mono">{meta.ollamaPart.durationMs}ms</span>
                  {showOllamaDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </div>
              </button>
              {showOllamaDetails && (
                <div className="px-4 py-3.5 border-t border-slate-800/80 bg-slate-950 leading-relaxed max-w-none">
                  <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                    {normalizeMarkdownContent(meta.ollamaPart.content)}
                  </Markdown>
                </div>
              )}
            </div>
          )}

          {/* Gemini High Thinking Refined Output */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Stufe 2: Veredelte Ausarbeitung (Google Gemini mit High Thinking)</span>
            </div>
            <div className="leading-relaxed max-w-none">
              <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {normalizeMarkdownContent(message.content)}
              </Markdown>
            </div>
          </div>
        </div>
      ) : isConsensus ? (
        // Consensus View
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => setShowOllamaDetails(!showOllamaDetails)}
              className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 text-left transition"
            >
              <div className="flex items-center justify-between text-emerald-300 font-medium">
                <span>Ollama Perspektive</span>
                {showOllamaDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </div>
            </button>
            <button
              onClick={() => setShowGeminiDetails(!showGeminiDetails)}
              className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 text-left transition"
            >
              <div className="flex items-center justify-between text-cyan-300 font-medium">
                <span>Gemini Perspektive</span>
                {showGeminiDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </div>
            </button>
          </div>

          {showOllamaDetails && meta?.ollamaPart && (
            <div className="p-4 rounded-xl bg-slate-950 border border-emerald-900/50 leading-relaxed max-w-none">
              <strong className="text-emerald-300 text-xs block mb-2">Ollama Standpunkt:</strong>
              <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {normalizeMarkdownContent(meta.ollamaPart.content)}
              </Markdown>
            </div>
          )}

          {showGeminiDetails && meta?.geminiPart && (
            <div className="p-4 rounded-xl bg-slate-950 border border-cyan-900/50 leading-relaxed max-w-none">
              <strong className="text-cyan-300 text-xs block mb-2">Gemini Standpunkt:</strong>
              <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {normalizeMarkdownContent(meta.geminiPart.content)}
              </Markdown>
            </div>
          )}

          {/* Unified Consensus Text */}
          <div className="leading-relaxed max-w-none pt-1">
            <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {normalizeMarkdownContent(message.content)}
            </Markdown>
          </div>
        </div>
      ) : (
        // Standard Direct Message Text
        <div className="mt-3.5 leading-relaxed max-w-none">
          <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {normalizeMarkdownContent(message.content)}
          </Markdown>
        </div>
      )}
    </div>
  );
};
