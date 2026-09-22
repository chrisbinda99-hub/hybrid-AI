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
}

/**
 * Normalizes Markdown content to repair malformed or collapsed table rows.
 * e.g. when LLMs output "| Col 1 | Col 2 | | :--- | :--- | | Val 1 | Val 2 |" on a single line.
 */
function normalizeMarkdownContent(content: string): string {
  if (!content) return '';
  // Fix double pipes separating table rows on the same line
  let normalized = content.replace(/\|\s*\|\s*(?=[^|\n]*\|)/g, '|\n|');
  // Fix table dividers concatenated without newline e.g. "| text | | :---"
  normalized = normalized.replace(/\|\s*\|\s*(:?-+:?)/g, '|\n| $1');
  // Fix table row ends immediately adjacent to next row start
  normalized = normalized.replace(/\|\s*\|/g, '|\n|');
  return normalized;
}

const markdownComponents = {
  table: ({ children, ...props }: any) => (
    <div className="overflow-x-auto my-3 rounded-xl border border-slate-700/80 bg-slate-950/70 shadow-sm">
      <table className="w-full text-left border-collapse text-xs text-slate-200" {...props}>
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
    <th className="px-3.5 py-2.5 font-semibold text-xs text-cyan-300 border-r border-slate-800/80 last:border-r-0" {...props}>
      {children}
    </th>
  ),
  td: ({ children, ...props }: any) => (
    <td className="px-3.5 py-2 text-xs text-slate-200 border-r border-slate-800/60 last:border-r-0 leading-relaxed" {...props}>
      {children}
    </td>
  ),
  code: ({ inline, className, children, ...props }: any) => {
    return inline ? (
      <code className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono text-[11px] border border-slate-700/60" {...props}>
        {children}
      </code>
    ) : (
      <code className="block p-3 rounded-lg bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto border border-slate-800 my-2" {...props}>
        {children}
      </code>
    );
  },
};

export const ChatMessageItem: React.FC<Props> = ({ message }) => {
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

  if (isUser) {
    return (
      <div className="flex justify-end my-3">
        <div className="max-w-2xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-md shadow-cyan-950/20">
          <div className="flex items-center gap-1.5 text-[11px] text-cyan-200/90 mb-1">
            <User className="w-3 h-3" />
            <span>Benutzer</span>
            <span>•</span>
            <span>{message.timestamp}</span>
          </div>
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
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
    <div className="my-4 max-w-4xl bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm text-slate-100">
      {/* Top Header of Response */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800/80 text-xs">
        <div className="flex items-center gap-2">
          {message.engine === 'ollama' ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 font-medium">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ollama (Lokal): {message.modelName}</span>
            </div>
          ) : message.engine === 'gemini' ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-950/80 border border-cyan-700/60 text-cyan-300 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Google Gemini: {message.modelName}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-950/80 border border-indigo-700/60 text-indigo-300 font-medium">
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
          className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition text-[11px]"
          title="Antwort kopieren"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? 'Kopiert' : 'Kopieren'}</span>
        </button>
      </div>

      {/* Qwen-Decider Millisecond Decision Head Banner */}
      {meta?.qwenDecider && (
        <div className="mt-2.5 px-3 py-2 rounded-lg bg-violet-950/40 border border-violet-600/50 text-xs text-violet-200 flex flex-col gap-1.5 shadow-sm">
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
        <div className="mt-2.5 px-3 py-1.5 rounded-lg bg-slate-950/70 border border-slate-800 text-xs text-slate-300 flex items-start gap-2">
          <Brain className="w-3.5 h-3.5 text-cyan-400 mt-0.5 shrink-0" />
          <span>{meta.routedReason}</span>
        </div>
      )}

      {/* Drive D Persistence & RAG Indicator Badges */}
      {(meta?.savedToDriveD || message.engine === 'gemini' || message.engine === 'hybrid') && (
        <div className="mt-2.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <HardDrive className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="font-medium">Cloud-Wissen gesichert:</span>
            <span className="font-mono text-cyan-300 text-[11px]">{meta?.targetPath || 'D:\\OllamaKnowledge\\'}</span>
          </div>
          <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-medium">
            Ollama Offline & Online Archiv
          </span>
        </div>
      )}

      {meta?.driveDKnowledgeUsed !== undefined && meta.driveDKnowledgeUsed > 0 && (
        <div className="mt-2.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
          <HardDrive className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Offline-RAG: {meta.driveDKnowledgeUsed} archivierte Einträge von Laufwerk D: eingeflossen</span>
        </div>
      )}

      {/* Hallunox Anti-Hallucination Guardrail Badge */}
      {meta?.hallunoxVerification && (
        <div
          className={`mt-2.5 rounded-lg border text-xs overflow-hidden transition-all ${
            meta.hallunoxVerification.hallucinationRisk === 'high'
              ? 'bg-rose-950/40 border-rose-500/50 text-rose-200'
              : meta.hallunoxVerification.hallucinationRisk === 'moderate'
              ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
              : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
          }`}
        >
          <div className="px-3 py-2 flex items-center justify-between flex-wrap gap-2">
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
            <div className="px-3 py-2.5 bg-slate-950/70 border-t border-slate-800/80 text-[11px] text-slate-300 space-y-1.5">
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
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Local Ollama Output */}
          <div className="bg-slate-950/70 border border-emerald-900/50 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
                <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                <span>Ollama ({meta?.ollamaPart?.model})</span>
              </div>
              <span className="text-[10px] text-slate-400">{meta?.ollamaPart?.durationMs}ms</span>
            </div>
            <div className="text-xs text-slate-200 leading-relaxed max-w-none prose prose-invert">
              <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {normalizeMarkdownContent(meta?.ollamaPart?.content || 'Keine Antwort')}
              </Markdown>
            </div>
          </div>

          {/* Cloud Gemini Output */}
          <div className="bg-slate-950/70 border border-cyan-900/50 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-300">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Gemini ({meta?.geminiPart?.model})</span>
              </div>
              <span className="text-[10px] text-slate-400">{meta?.geminiPart?.durationMs}ms</span>
            </div>
            <div className="text-xs text-slate-200 leading-relaxed max-w-none prose prose-invert">
              <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {normalizeMarkdownContent(meta?.geminiPart?.content || 'Keine Antwort')}
              </Markdown>
            </div>
          </div>
        </div>
      ) : isCollaborative ? (
        // Collaborative View: Primary Polished Response + Collapsible Local Draft
        <div className="mt-3 space-y-3">
          {meta?.ollamaPart && (
            <div className="border border-slate-800/80 rounded-xl overflow-hidden bg-slate-950/50">
              <button
                onClick={() => setShowOllamaDetails(!showOllamaDetails)}
                className="w-full px-3 py-2 flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition"
              >
                <div className="flex items-center gap-2">
                  <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Stufe 1: Lokaler Ollama-Vorentwurf ({meta.ollamaPart.model})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px]">{meta.ollamaPart.durationMs}ms</span>
                  {showOllamaDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </div>
              </button>
              {showOllamaDetails && (
                <div className="px-3.5 py-3 border-t border-slate-800/80 bg-slate-950 text-xs text-slate-300 leading-relaxed prose prose-invert max-w-none">
                  <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                    {normalizeMarkdownContent(meta.ollamaPart.content)}
                  </Markdown>
                </div>
              )}
            </div>
          )}

          {/* Gemini High Thinking Refined Output */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Stufe 2: Veredelte Ausarbeitung (Google Gemini mit High Thinking)</span>
            </div>
            <div className="text-sm text-slate-200 leading-relaxed prose prose-invert max-w-none">
              <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {normalizeMarkdownContent(message.content)}
              </Markdown>
            </div>
          </div>
        </div>
      ) : isConsensus ? (
        // Consensus View
        <div className="mt-3 space-y-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => setShowOllamaDetails(!showOllamaDetails)}
              className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-slate-700 text-left"
            >
              <div className="flex items-center justify-between text-emerald-300 font-medium">
                <span>Ollama Perspektive</span>
                {showOllamaDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </div>
            </button>
            <button
              onClick={() => setShowGeminiDetails(!showGeminiDetails)}
              className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-slate-700 text-left"
            >
              <div className="flex items-center justify-between text-cyan-300 font-medium">
                <span>Gemini Perspektive</span>
                {showGeminiDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </div>
            </button>
          </div>

          {showOllamaDetails && meta?.ollamaPart && (
            <div className="p-3 rounded-lg bg-slate-950 border border-emerald-900/50 text-xs text-slate-300 leading-relaxed prose prose-invert max-w-none">
              <strong className="text-emerald-300">Ollama Standpunkt:</strong>
              <div className="mt-1">
                <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                  {normalizeMarkdownContent(meta.ollamaPart.content)}
                </Markdown>
              </div>
            </div>
          )}

          {showGeminiDetails && meta?.geminiPart && (
            <div className="p-3 rounded-lg bg-slate-950 border border-cyan-900/50 text-xs text-slate-300 leading-relaxed prose prose-invert max-w-none">
              <strong className="text-cyan-300">Gemini Standpunkt:</strong>
              <div className="mt-1">
                <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                  {normalizeMarkdownContent(meta.geminiPart.content)}
                </Markdown>
              </div>
            </div>
          )}

          {/* Unified Consensus Text */}
          <div className="text-sm text-slate-200 leading-relaxed prose prose-invert max-w-none pt-1">
            <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {normalizeMarkdownContent(message.content)}
            </Markdown>
          </div>
        </div>
      ) : (
        // Standard Direct Message Text
        <div className="mt-3 text-sm text-slate-200 leading-relaxed prose prose-invert max-w-none">
          <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {normalizeMarkdownContent(message.content)}
          </Markdown>
        </div>
      )}
    </div>
  );
};
