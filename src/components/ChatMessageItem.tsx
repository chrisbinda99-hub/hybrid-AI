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
  Smartphone,
  Download,
  RefreshCw,
  CheckCircle2,
  ExternalLink,
  Layers,
  Play,
  Radio,
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
  // Ensure fenced code blocks are separated from preceding text by an empty line
  normalized = normalized.replace(/([^\n])\n(```[a-zA-Z0-9_-]*)/g, '$1\n\n$2');
  return normalized;
}

function extractTextFromChildren(node: any): string {
  if (node === null || node === undefined) return '';
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractTextFromChildren).join('');
  if (React.isValidElement(node) && (node.props as any)?.children) {
    return extractTextFromChildren((node.props as any).children);
  }
  return '';
}

const PreBlock = ({ children, ...props }: any) => {
  const [copied, setCopied] = useState(false);
  const [showApkMenu, setShowApkMenu] = useState(false);
  const [buildingApk, setBuildingApk] = useState(false);
  const [apkFeedback, setApkFeedback] = useState<string | null>(null);

  // In react-markdown v10, pre wraps a code element: <pre><code className="language-xyz">...</code></pre>
  const isCodeElement = React.isValidElement(children);
  const codeProps: any = isCodeElement ? children.props : {};
  const className = codeProps?.className || props?.className || '';
  const match = /language-([a-zA-Z0-9_-]+)/.exec(className);
  const language = match ? match[1] : '';
  const rawCode = extractTextFromChildren(codeProps?.children ?? children).replace(/\n$/, '');

  const handleCopy = () => {
    navigator.clipboard.writeText(rawCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenApkModal = () => {
    setShowApkMenu(false);
    window.dispatchEvent(new CustomEvent('open-android-apk-modal'));
  };

  const handleBuildIntoApk = async () => {
    setShowApkMenu(false);
    setBuildingApk(true);
    setApkFeedback('Kompiliere AOSP DEX & binde Code in APK ein...');
    try {
      const res = await fetch('/api/apk/embed-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: rawCode,
          language: language || 'text',
          title: `Code-Menü Export (${language || 'Code'})`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setApkFeedback('Erfolgreich gebaut! APK-Download startet...');
        // trigger direct download
        const a = document.createElement('a');
        a.href = data.downloadUrl || '/downloads/gemini-ai-assistant.apk';
        a.download = data.fileName || 'gemini-ai-assistant.apk';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => setApkFeedback(null), 4000);
      } else {
        setApkFeedback('Fehler beim Bauen: ' + (data.error || 'Unbekannt'));
        setTimeout(() => setApkFeedback(null), 4000);
      }
    } catch (err: any) {
      setApkFeedback('Verbindungsfehler: ' + err.message);
      setTimeout(() => setApkFeedback(null), 4000);
    } finally {
      setBuildingApk(false);
    }
  };

  return (
    <div className="relative my-3.5 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-md">
      {/* Code-Menü Header */}
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-900 border-b border-slate-800 text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-2">
          <span className="uppercase text-cyan-400 font-semibold">{language || 'Code'}</span>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <span className="text-[10px] text-slate-500 font-sans uppercase tracking-wider hidden sm:inline">
            Code-Menü
          </span>
        </div>

        <div className="flex items-center gap-1.5 relative">
          {/* APK Menu Button */}
          <div className="relative">
            <button
              onClick={() => setShowApkMenu((prev) => !prev)}
              type="button"
              disabled={buildingApk}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-sans text-[11px] font-medium transition cursor-pointer disabled:opacity-50"
              title="Android APK Menü (Herunterladen, Bauen, QR-Code)"
            >
              <Smartphone className={`w-3 h-3 text-emerald-400 ${buildingApk ? 'animate-bounce' : ''}`} />
              <span className="hidden xs:inline">*.apk</span>
              <ChevronDown className="w-2.5 h-2.5 opacity-70" />
            </button>

            {/* Dropdown in Code-Menü */}
            {showApkMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-64 p-1.5 rounded-xl bg-slate-900 border border-emerald-500/40 shadow-2xl z-30 font-sans space-y-1 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-2.5 py-1 border-b border-slate-800 text-[10px] text-slate-400 font-semibold flex items-center justify-between">
                  <span>Android APK Aktionen</span>
                  <span className="text-emerald-400">No Root</span>
                </div>

                <a
                  href="/downloads/gemini-ai-assistant.apk"
                  download="gemini-ai-assistant.apk"
                  onClick={() => setShowApkMenu(false)}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-emerald-500/10 text-slate-200 hover:text-emerald-300 text-xs transition block cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <div className="text-left">
                    <div className="font-semibold text-white">*.apk herunterladen</div>
                    <div className="text-[10px] text-slate-400">Signiertes Release-Paket (~16.5 KB)</div>
                  </div>
                </a>

                <button
                  type="button"
                  onClick={handleBuildIntoApk}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-cyan-500/10 text-slate-200 hover:text-cyan-300 text-xs transition text-left cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <div>
                    <div className="font-semibold text-white">Code in *.apk bauen</div>
                    <div className="text-[10px] text-slate-400">Snippet in APK-Assets einbetten</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleOpenApkModal}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-purple-500/10 text-slate-200 hover:text-purple-300 text-xs transition text-left cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <div>
                    <div className="font-semibold text-white">APK-Details &amp; QR-Code</div>
                    <div className="text-[10px] text-slate-400">Prüfmatrix &amp; Mobile Scanner</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            type="button"
            className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition cursor-pointer font-sans text-[11px]"
            title="Code kopieren"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Kopiert' : 'Kopieren'}</span>
          </button>
        </div>
      </div>

      {/* Status banner when building APK */}
      {apkFeedback && (
        <div className="px-3.5 py-1.5 bg-emerald-950/80 border-b border-emerald-500/40 text-[11px] text-emerald-300 flex items-center gap-2 font-sans animate-in fade-in">
          {buildingApk ? (
            <RefreshCw className="w-3 h-3 text-emerald-400 animate-spin" />
          ) : (
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          )}
          <span>{apkFeedback}</span>
        </div>
      )}

      {/* Actual Code content */}
      <pre className="p-4 overflow-x-auto text-[13px] sm:text-sm font-mono text-slate-200 leading-relaxed">
        <code className={className}>{rawCode}</code>
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
  h4: ({ children, ...props }: any) => (
    <h4
      className={`font-semibold text-slate-200 mt-3 mb-1 ${
        fontSize === 'large' ? 'text-base sm:text-lg' : 'text-sm sm:text-base'
      }`}
      {...props}
    >
      {children}
    </h4>
  ),
  p: ({ children, ...props }: any) => (
    <div
      className={`my-2.5 leading-[1.75] text-slate-200 ${
        fontSize === 'large' ? 'text-base sm:text-lg' : 'text-[15px] sm:text-base'
      }`}
      {...props}
    >
      {children}
    </div>
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
  hr: (props: any) => <hr className="my-4 border-slate-800" {...props} />,
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
  pre: PreBlock,
  code: ({ children, className, ...props }: any) => {
    const rawText = extractTextFromChildren(children);
    const isMultiLine = rawText.includes('\n');
    const hasLanguage = Boolean(className && /language-/.test(className));

    if (isMultiLine || hasLanguage) {
      return (
        <PreBlock {...props} className={className}>
          {children}
        </PreBlock>
      );
    }

    return (
      <code
        className={`px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono text-[13px] border border-slate-700/60 ${className || ''}`}
        {...props}
      >
        {children}
      </code>
    );
  },
});

export const ChatMessageItem: React.FC<Props> = ({ message, fontSize = 'normal' }) => {
  const [copied, setCopied] = useState(false);
  const [showOllamaDetails, setShowOllamaDetails] = useState(false);
  const [showGeminiDetails, setShowGeminiDetails] = useState(false);
  const [showHallunoxDetails, setShowHallunoxDetails] = useState(false);
  const [expandedSystemId, setExpandedSystemId] = useState<string | null>(null);
  const [showAllSwarmResponses, setShowAllSwarmResponses] = useState(false);

  const handleSwitchToSolo = (systemId: string) => {
    window.dispatchEvent(new CustomEvent('switch-to-solo-system', { detail: { systemId } }));
  };

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
          <div
            className={`whitespace-pre-wrap leading-relaxed ${
              fontSize === 'large' ? 'text-base sm:text-lg' : 'text-[15px] sm:text-base'
            }`}
          >
            {message.content}
          </div>
        </div>
      </div>
    );
  }

  // Assistant Response: Render based on Mode
  const meta = message.metadata;
  const isSideBySide = meta?.mode === 'side_by_side';
  const isCollaborative = meta?.mode === 'collaborative';
  const isConsensus = meta?.mode === 'consensus';
  const isMatrixSwarm = meta?.mode === 'matrix_swarm' || Boolean(meta?.matrixSwarmResult);
  const isSoloSystem = meta?.mode === 'solo_system' || Boolean(meta?.soloSystemResult);

  return (
    <div className="my-4 w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm text-slate-100 transition-all">
      {/* Top Header of Response */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800/80 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          {message.engine === 'solo_system' || isSoloSystem ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/60 text-cyan-200 font-medium shadow-sm">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>Einzelbetrieb: {message.modelName}</span>
            </div>
          ) : message.engine === 'matrix_swarm' || isMatrixSwarm ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-cyan-950 to-indigo-950 border border-cyan-500/60 text-cyan-200 font-medium shadow-sm">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>20-KI Hybrid-Schwarm ({meta?.matrixSwarmResult?.activeSystemsCount || 20} Systeme)</span>
            </div>
          ) : message.engine === 'ollama' ? (
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

      {/* Intel Loihi 2 Neuromorphic Spiking Banner */}
      {meta?.loihi2Routing && (
        <div className="mt-3 px-3.5 py-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/50 text-xs text-emerald-200 flex flex-col gap-1.5 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-emerald-400 shrink-0 animate-pulse" />
              <span className="font-semibold text-slate-100">
                Intel® Loihi 2 SNN:
              </span>
              <span className="font-mono text-cyan-300 font-medium">
                {meta.loihi2Routing.engine.toUpperCase()} ({Math.round(meta.loihi2Routing.confidence * 100)}% Konfidenz)
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-[11px] text-emerald-400 font-mono font-bold">
                {meta.loihi2Routing.latencyMs}ms ({meta.loihi2Routing.latencyUs}µs)
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-900/70 border border-emerald-500/40 text-emerald-300 font-mono">
                {meta.loihi2Routing.energyMicroJoules} µJ • 38.4 mW
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="px-2 py-0.5 rounded bg-emerald-900/60 border border-emerald-500/40 text-emerald-200">
                99.89% Sparsity
              </span>
              {meta.loihi2Routing.stdpWeightUpdated && (
                <span className="px-2 py-0.5 rounded bg-teal-900/60 border border-teal-500/40 text-teal-200 font-mono">
                  STDP Plasticity
                </span>
              )}
            </div>
          </div>
          <div className="text-[11px] text-slate-300 flex items-start justify-between flex-wrap gap-2 pl-5">
            <span>{meta.loihi2Routing.reason}</span>
            {meta.loihi2Routing.driveDMemoryMatch && (
              <span className="text-[10px] text-amber-300 font-mono">
                D:\ Assoziativ-Treffer: {meta.loihi2Routing.driveDMemoryMatch.key.split('\\').pop()}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Kev & Qwen-Decider Millisecond Decision Head Banner */}
      {meta?.qwenDecider && (
        <div className="mt-3 px-3.5 py-2.5 rounded-xl bg-violet-950/40 border border-violet-600/50 text-xs text-violet-200 flex flex-col gap-1.5 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
              <span className="font-semibold text-slate-100">
                {meta.qwenDecider.isKevModel || meta.qwenDecider.model?.toLowerCase().includes('kev')
                  ? `Kev Decision Head (${meta.qwenDecider.model || 'kev-0.8b'})`
                  : `Qwen-Decider (${meta.qwenDecider.model || 'qwen-decider'})`}:
              </span>
              <span className="font-mono text-cyan-300 font-medium">
                {(meta.qwenDecider.engine || 'ollama').toUpperCase()} ({Math.round((meta.qwenDecider.confidence ?? 0.95) * 100)}% Konfidenz)
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-[11px] text-emerald-400 font-mono">
                {meta.qwenDecider.latencyMs ?? 8}ms
              </span>
              {meta.qwenDecider.blockCausalMaskApplied && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-violet-900/70 border border-violet-500/40 text-violet-300 font-mono">
                  Single Pass
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="px-2 py-0.5 rounded bg-violet-900/60 border border-violet-500/40 text-violet-200">
                Datenschutz: {meta.qwenDecider.privacyScore ?? 50}%
              </span>
              <span className="px-2 py-0.5 rounded bg-cyan-900/60 border border-cyan-500/40 text-cyan-200">
                Komplexität: {meta.qwenDecider.complexityScore ?? 25}%
              </span>
              {meta.qwenDecider.requiresDriveDKnowledge && (
                <span className="px-2 py-0.5 rounded bg-amber-900/60 border border-amber-500/40 text-amber-200">
                  D:\-RAG
                </span>
              )}
            </div>
          </div>
          <div className="text-[11px] text-slate-300 flex items-start justify-between flex-wrap gap-2 pl-5">
            <span>{meta.qwenDecider.reason || 'Kev Single Forward Pass Kausalentscheidung.'}</span>
            {meta.qwenDecider.calibratedProbabilities?.engine && (
              <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                <span>P(Ollama): {((meta.qwenDecider.calibratedProbabilities.engine.ollama ?? 0.8) * 100).toFixed(0)}%</span>
                <span>•</span>
                <span>P(Gemini): {((meta.qwenDecider.calibratedProbabilities.engine.gemini ?? 0.2) * 100).toFixed(0)}%</span>
              </div>
            )}
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

      {/* Solo System Execution Banner */}
      {meta?.soloSystemResult && (
        <div className="mt-3 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-950/60 via-slate-900 to-indigo-950/40 border border-cyan-500/50 text-xs text-cyan-200 flex flex-wrap items-center justify-between gap-2 shadow-sm">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-5 h-5 rounded-md bg-cyan-500/20 text-cyan-300 font-mono font-bold flex items-center justify-center text-[10px] border border-cyan-500/40">
              #{meta.soloSystemResult.systemNumber < 10 ? `0${meta.soloSystemResult.systemNumber}` : meta.soloSystemResult.systemNumber}
            </span>
            <span className="font-semibold text-slate-100">{meta.soloSystemResult.systemName}</span>
            <span className="text-slate-400 font-mono text-[10px]">({meta.soloSystemResult.architecture})</span>
            <span className="text-slate-400">•</span>
            <span className="text-[11px] text-cyan-300 font-medium">{meta.soloSystemResult.role}</span>
          </div>

          <div className="flex items-center gap-2">
            {meta.soloSystemResult.tokensPerSec && (
              <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-300">
                ⚡ ~{meta.soloSystemResult.tokensPerSec} Tok/s
              </span>
            )}
            <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-semibold border border-cyan-500/40">
              Einzelbetrieb Aktiv
            </span>
          </div>
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
      ) : isMatrixSwarm && meta?.matrixSwarmResult ? (
        // 20-KI Matrix Swarm & Consensus View
        <div className="mt-4 space-y-4">
          {/* Swarm Master Header Bar */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/70 via-indigo-950/50 to-slate-950 border border-cyan-700/50 text-xs space-y-2.5 shadow-md">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span className="font-bold text-slate-100 text-sm">
                  20-KI-System Swarm Matrix: {meta.matrixSwarmResult.activeSystemsCount} Systeme im Verbund
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold font-mono">
                  {meta.matrixSwarmResult.consensusScore}% Konsensus
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                  Latenz: {meta.matrixSwarmResult.totalLatencyMs}ms
                </span>
              </div>
            </div>

            {/* Agreed Points / Highlights */}
            {meta.matrixSwarmResult.agreedPoints && meta.matrixSwarmResult.agreedPoints.length > 0 && (
              <div className="space-y-1 pt-1 border-t border-slate-800/80 text-[11px] text-slate-300">
                {meta.matrixSwarmResult.agreedPoints.map((pt, pIdx) => (
                  <div key={pIdx} className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{pt}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Metrics of Fastest & Deepest */}
            <div className="flex items-center justify-between flex-wrap gap-2 pt-1 text-[11px] text-slate-400">
              <span>⚡ Schnellster Reflex: <strong className="text-cyan-300">{meta.matrixSwarmResult.fastestSystem}</strong></span>
              <span>🧠 Höchste Reasoning-Konfidenz: <strong className="text-indigo-300">{meta.matrixSwarmResult.highestConfidenceSystem}</strong></span>
            </div>
          </div>

          {/* Master Synthesis Content */}
          <div className="leading-relaxed max-w-none pt-1">
            <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {normalizeMarkdownContent(message.content)}
            </Markdown>
          </div>

          {/* Expandable Individual Responses from the Active Systems */}
          <div className="pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-cyan-400" />
                <span>Individuelle Antworten der einzelnen Systeme ({meta.matrixSwarmResult.systemResponses.length})</span>
              </span>
              <button
                onClick={() => setShowAllSwarmResponses(!showAllSwarmResponses)}
                className="text-xs text-cyan-300 hover:text-cyan-100 flex items-center gap-1 font-medium transition cursor-pointer"
              >
                <span>{showAllSwarmResponses ? 'System-Matrix einklappen' : 'Alle Systeme im Detail ansehen'}</span>
                {showAllSwarmResponses ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {showAllSwarmResponses && (
              <div className="space-y-3 mt-3 animate-in fade-in duration-200">
                {meta.matrixSwarmResult.systemResponses.map((sysResp) => {
                  const isExpanded = expandedSystemId === sysResp.systemId;
                  return (
                    <div
                      key={sysResp.systemId}
                      className="rounded-xl border border-slate-800 bg-slate-950/80 overflow-hidden text-xs transition"
                    >
                      <div
                        onClick={() => setExpandedSystemId(isExpanded ? null : sysResp.systemId)}
                        className="px-3.5 py-2.5 bg-slate-900/60 hover:bg-slate-900 flex items-center justify-between gap-2 cursor-pointer transition select-none"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] font-bold flex items-center justify-center">
                            #{sysResp.systemNumber < 10 ? `0${sysResp.systemNumber}` : sysResp.systemNumber}
                          </span>
                          <span className="font-bold text-slate-200">{sysResp.systemName}</span>
                          <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                            ({sysResp.parameters})
                          </span>
                          <span className="text-[10px] text-cyan-400 font-mono">
                            {sysResp.durationMs}ms
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* SWITCH TO SOLO OPERATOR BUTTON */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSwitchToSolo(sysResp.systemId);
                            }}
                            className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-700/60 hover:bg-cyan-900 text-cyan-200 hover:text-white transition flex items-center gap-1 text-[11px] font-medium cursor-pointer"
                            title="Zu diesem System in den Einzelbetrieb wechseln"
                          >
                            <Play className="w-2.5 h-2.5 fill-current" />
                            <span>Einzeln bedienen</span>
                          </button>

                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="p-4 bg-slate-950 border-t border-slate-800/80 space-y-2">
                          <div className="flex items-center justify-between text-[11px] text-slate-400 pb-2 border-b border-slate-800/60 font-mono">
                            <span>Architektur: {sysResp.architecture}</span>
                            <span>Rolle: {sysResp.role}</span>
                          </div>
                          <div className="leading-relaxed max-w-none pt-1">
                            <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                              {normalizeMarkdownContent(sysResp.text)}
                            </Markdown>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
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
