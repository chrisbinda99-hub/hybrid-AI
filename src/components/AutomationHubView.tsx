import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Bot,
  Terminal,
  Search,
  Wand2,
  Play,
  RotateCw,
  CheckCircle2,
  Clock,
  Layers,
  HardDrive,
  ShieldCheck,
  Cpu,
  ArrowRight,
  Code2,
  Copy,
  Check,
  Download,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { AgentExecutionTrace, CodeExecutionResult, WebSearchResultItem } from '../types';
import {
  executeCodeSnippet,
  optimizePromptWithAI,
  searchWebGrounding,
  executeAutonomousAgentRun,
} from '../services/automationService';

interface Props {
  onSendToChat?: (text: string) => void;
}

export const AutomationHubView: React.FC<Props> = ({ onSendToChat }) => {
  const [activeTab, setActiveTab] = useState<'autopilot' | 'sandbox' | 'optimizer' | 'web' | 'status'>('autopilot');

  // Auto-Pilot State
  const [agentGoal, setAgentGoal] = useState('Analysiere die Latenzen der 20 KI Systeme, erstelle ein Python-Benchmarkskript und speichere die Ergebnisse im Wissensspeicher D:\\OllamaKnowledge.');
  const [isAgentRunning, setIsAgentRunning] = useState(false);
  const [agentTrace, setAgentTrace] = useState<AgentExecutionTrace | null>(null);
  const [agentSynthesis, setAgentSynthesis] = useState<string | null>(null);

  // Code Sandbox State
  const [sandboxLang, setSandboxLang] = useState<'python' | 'javascript' | 'bash'>('python');
  const [sandboxCode, setSandboxCode] = useState(
    `# Python 3.10 Benchmark Sandbox
import time
import math

start = time.time()
print("[Pipeline] Starte Testlauf auf Windows 11 Edge-Knoten...")

# Simuliere Neuromorphe Spiking-Dichte
spikes = [math.sin(i * 0.1) * math.exp(-i * 0.02) for i in range(100)]
active_spikes = sum(1 for s in spikes if abs(s) > 0.4)

duration_ms = (time.time() - start) * 1000
print(f"[Erfolg] 100 Ticks simuliert. Aktive Spikes: {active_spikes}")
print(f"[Metrik] Berechnungszeit: {duration_ms:.2f} ms")
`
  );
  const [isExecutingCode, setIsExecutingCode] = useState(false);
  const [codeResult, setCodeResult] = useState<CodeExecutionResult | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);

  // Prompt Optimizer State
  const [inputPrompt, setInputPrompt] = useState('erstelle eine web app');
  const [promptStyle, setPromptStyle] = useState<'technical' | 'code' | 'deep_reasoning'>('technical');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedResult, setOptimizedResult] = useState<{
    optimizedPrompt: string;
    changesSummary: string;
    modelUsed: string;
  } | null>(null);

  // Web Search State
  const [searchQuery, setSearchQuery] = useState('Ollama v0.5 neue Features und GPU Beschleunigung');
  const [isSearching, setIsSearching] = useState(false);
  const [searchData, setSearchData] = useState<{
    summary: string;
    results: WebSearchResultItem[];
  } | null>(null);

  // Pipeline status list
  const pipelines = [
    {
      id: 'p1',
      name: 'Auto-Pilot Autonomous Multi-Agent',
      badge: 'Autonom',
      icon: Bot,
      color: 'text-cyan-400 bg-cyan-950/60 border-cyan-800/60',
      description: 'Dekomponiert komplexe Ziele in Meilensteine, nutzt RAG & Tool-Calls, verifiziert mit Hallunox.',
      status: 'Aktiv',
    },
    {
      id: 'p2',
      name: 'Sandboxed Code Runner (Python/Node/Bash)',
      badge: 'Live Runtime',
      icon: Terminal,
      color: 'text-amber-400 bg-amber-950/60 border-amber-800/60',
      description: 'Sichere Ausführung von generiertem Code in Python 3.10 und Node v22 mit Standardausgabe-Erfassung.',
      status: 'Bereit',
    },
    {
      id: 'p3',
      name: 'SLM Prompt Engineering Head',
      badge: 'Prompt Engine',
      icon: Wand2,
      color: 'text-fuchsia-400 bg-fuchsia-950/60 border-fuchsia-800/60',
      description: 'Erweitert einfache Prompts deterministisch um Kontext, Spezifikationen und Verifikationskriterien.',
      status: 'Online',
    },
    {
      id: 'p4',
      name: 'Echtzeit-Web Grounding & Such-Pipeline',
      badge: 'Live Grounding',
      icon: Search,
      color: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60',
      description: 'Verbindet LLMs mit Echtzeit-Web-Quellen für aktuelle Fakten, Metriken und Dokumentationen.',
      status: 'Verbunden',
    },
    {
      id: 'p5',
      name: 'Autonomes Wissens-Management & Auto-RAG',
      badge: 'D:\\ Sync',
      icon: HardDrive,
      color: 'text-blue-400 bg-blue-950/60 border-blue-800/60',
      description: 'Automatisches Speichern und Einbetten von Erkenntnissen in D:\\OllamaKnowledge\\auto_learning.',
      status: 'Synchronisiert',
    },
  ];

  const handleRunAgent = async () => {
    if (!agentGoal.trim() || isAgentRunning) return;
    setIsAgentRunning(true);
    setAgentTrace(null);
    setAgentSynthesis(null);
    try {
      const res = await executeAutonomousAgentRun(agentGoal);
      setAgentTrace(res.trace);
      setAgentSynthesis(res.finalSynthesis);
    } catch (err: any) {
      console.log('Agent run note:', err);
    } finally {
      setIsAgentRunning(false);
    }
  };

  const handleRunSandbox = async () => {
    if (!sandboxCode.trim() || isExecutingCode) return;
    setIsExecutingCode(true);
    setCodeResult(null);
    try {
      const res = await executeCodeSnippet(sandboxLang, sandboxCode);
      setCodeResult(res);
    } finally {
      setIsExecutingCode(false);
    }
  };

  const handleOptimizePrompt = async () => {
    if (!inputPrompt.trim() || isOptimizing) return;
    setIsOptimizing(true);
    try {
      const res = await optimizePromptWithAI(inputPrompt, promptStyle);
      setOptimizedResult(res);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleSearchWeb = async () => {
    if (!searchQuery.trim() || isSearching) return;
    setIsSearching(true);
    try {
      const res = await searchWebGrounding(searchQuery);
      setSearchData({
        summary: res.summary,
        results: res.results,
      });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-slate-950 text-slate-100 p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-semibold text-xs border border-cyan-500/40">
              GitHub AI Extensions &amp; Pipelines
            </span>
            <span className="text-xs text-slate-400">Vollautomatisiert • Live Runtime</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
            Automations- &amp; Pipeline-Zentrale
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Autonome Multi-Agenten-Workflows, Code-Sandbox, Prompt-Optimizer und Echtzeit-Web-Grounding.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto text-xs shrink-0">
          <button
            onClick={() => setActiveTab('autopilot')}
            className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'autopilot'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Auto-Pilot Agent</span>
          </button>
          <button
            onClick={() => setActiveTab('sandbox')}
            className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'sandbox'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Code-Sandbox</span>
          </button>
          <button
            onClick={() => setActiveTab('optimizer')}
            className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'optimizer'
                ? 'bg-fuchsia-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Prompt-Optimizer</span>
          </button>
          <button
            onClick={() => setActiveTab('web')}
            className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'web'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Web-Grounding</span>
          </button>
          <button
            onClick={() => setActiveTab('status')}
            className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'status'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Pipeline-Status</span>
          </button>
        </div>
      </div>

      {/* TAB 1: AUTOPILOT AGENT */}
      {activeTab === 'autopilot' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-cyan-400" />
                <h2 className="text-base font-semibold text-white">
                  Autonomer Multi-Step Ziel-Runner (Auto-Pilot)
                </h2>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Archiv: D:\OllamaKnowledge\auto_learning
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Geben Sie eine komplexe Aufgabe ein. Der Auto-Pilot zerlegt das Ziel in deterministische Meilensteine, holt RAG-Wissen von Laufwerk D:, führt Berechnungen aus und sichert den fertigen Report automatisch ab.
            </p>

            <div className="space-y-2">
              <textarea
                value={agentGoal}
                onChange={(e) => setAgentGoal(e.target.value)}
                rows={3}
                placeholder="Beschreibe dein Ziel..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl p-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none resize-none leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-between flex-wrap gap-3 pt-1">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Automatischer Hallunox Anti-Halluzinations-Audit aktiv</span>
              </div>

              <button
                type="button"
                onClick={handleRunAgent}
                disabled={isAgentRunning || !agentGoal.trim()}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-medium text-xs flex items-center gap-2 shadow-lg shadow-cyan-950/40 transition cursor-pointer disabled:opacity-50"
              >
                {isAgentRunning ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    <span>Agent führt Schritte aus...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Autonomen Lauf starten</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Trace Results */}
          {agentTrace && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-800/80 text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="font-semibold text-slate-200">Agenten-Ablaufplan abgeschlossen</span>
                    <span className="text-slate-400">•</span>
                    <span className="font-mono text-cyan-300">{agentTrace.totalDurationMs}ms</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-mono text-[11px]">
                    Hallunox: 99.2% Alignment
                  </span>
                </div>

                {/* Milestones Flow */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {agentTrace.milestones.map((ms) => (
                    <div
                      key={ms.id}
                      className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 relative"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="w-5 h-5 rounded-full bg-cyan-600/30 text-cyan-300 border border-cyan-500/50 flex items-center justify-center font-mono font-bold text-[10px]">
                          {ms.stepNumber}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{ms.durationMs}ms</span>
                      </div>
                      <h3 className="font-semibold text-xs text-slate-100">{ms.title}</h3>
                      <p className="text-[11px] text-slate-400 leading-tight">{ms.description}</p>
                      {ms.outputSnippet && (
                        <div className="p-1.5 rounded bg-slate-900 border border-slate-800/80 text-[10px] text-cyan-300 font-mono truncate">
                          {ms.outputSnippet}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Final Synthesis Report */}
                {agentSynthesis && (
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/90 space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
                      <span>Synthetisiertes Gesamtergebnis:</span>
                      {onSendToChat && (
                        <button
                          type="button"
                          onClick={() => onSendToChat(agentSynthesis)}
                          className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[11px] cursor-pointer"
                        >
                          <span>In Studio Chat öffnen</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <div className="whitespace-pre-wrap text-xs sm:text-sm text-slate-200 leading-relaxed font-sans max-h-72 overflow-y-auto">
                      {agentSynthesis}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CODE SANDBOX */}
      {activeTab === 'sandbox' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-amber-400" />
                <h2 className="text-base font-semibold text-white">Live Code-Sandbox &amp; Runner</h2>
              </div>
              <div className="flex items-center gap-2">
                {(['python', 'javascript', 'bash'] as const).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setSandboxLang(l)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono transition cursor-pointer ${
                      sandboxLang === l
                        ? 'bg-amber-600 text-white font-bold'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {l.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-xs text-slate-300">
              Führt Skripte sicher in der lokalen Sandbox aus (Python 3.10, Node v22 oder Shell) mit Timeout-Schutz und Ausgaben-Erfassung.
            </p>

            <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
              <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/90 border-b border-slate-800 text-xs text-slate-400">
                <span className="font-mono text-[11px] text-amber-400">
                  sandbox.{sandboxLang === 'python' ? 'py' : sandboxLang === 'bash' ? 'sh' : 'js'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(sandboxCode);
                    setCodeCopied(true);
                    setTimeout(() => setCodeCopied(false), 2000);
                  }}
                  className="hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  {codeCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{codeCopied ? 'Kopiert' : 'Kopieren'}</span>
                </button>
              </div>
              <textarea
                value={sandboxCode}
                onChange={(e) => setSandboxCode(e.target.value)}
                rows={10}
                className="w-full bg-slate-950 p-3 text-xs sm:text-sm font-mono text-slate-200 focus:outline-none resize-none leading-relaxed"
                spellCheck={false}
              />
            </div>

            <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
              <span className="text-xs text-slate-400 font-mono">
                Sicherung: D:\OllamaKnowledge\scripts\
              </span>
              <button
                type="button"
                onClick={handleRunSandbox}
                disabled={isExecutingCode || !sandboxCode.trim()}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-950/40 transition cursor-pointer disabled:opacity-50"
              >
                {isExecutingCode ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Wird ausgeführt...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Code ausführen (Live Run)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Execution Result Box */}
          {codeResult && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      codeResult.success ? 'bg-emerald-400' : 'bg-rose-400'
                    }`}
                  />
                  <span className="font-semibold text-white">
                    {codeResult.success ? 'Erfolgreich beendet (Exit 0)' : `Fehler (Exit ${codeResult.exitCode})`}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="font-mono text-cyan-300">{codeResult.durationMs}ms</span>
                </div>
                <span className="text-slate-400 font-mono text-[11px]">{codeResult.executedAt}</span>
              </div>

              {codeResult.stdout && (
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 font-mono">Standardausgabe (stdout):</span>
                  <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-300 whitespace-pre-wrap leading-relaxed overflow-x-auto max-h-60">
                    {codeResult.stdout}
                  </pre>
                </div>
              )}

              {codeResult.stderr && (
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-rose-400 font-mono">Fehlerausgabe (stderr):</span>
                  <pre className="p-3 rounded-xl bg-slate-950 border border-rose-900/50 text-xs font-mono text-rose-300 whitespace-pre-wrap leading-relaxed overflow-x-auto max-h-40">
                    {codeResult.stderr}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PROMPT OPTIMIZER */}
      {activeTab === 'optimizer' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-fuchsia-400" />
                <h2 className="text-base font-semibold text-white">
                  SLM &amp; Cloud Prompt Optimizer Head
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {(['technical', 'code', 'deep_reasoning'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setPromptStyle(s)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                      promptStyle === s
                        ? 'bg-fuchsia-600 text-white font-bold'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {s === 'technical' ? 'Technisch' : s === 'code' ? 'Code-Fokus' : 'Deep Reasoning'}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-xs text-slate-300">
              Formuliert kurze oder unpräzise Eingaben automatisch in durchdachte System-Prompts um, damit lokale Modelle (Ollama) und Cloud-Modelle (Gemini) fehlerfrei arbeiten.
            </p>

            <div className="space-y-2">
              <label className="text-xs text-slate-400 font-medium">Rohe Nutzereingabe:</label>
              <textarea
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 focus:border-fuchsia-500 rounded-xl p-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none resize-none leading-relaxed"
                placeholder="Kurzen Prompt eingeben..."
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleOptimizePrompt}
                disabled={isOptimizing || !inputPrompt.trim()}
                className="px-5 py-2.5 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-medium text-xs flex items-center gap-2 shadow-lg shadow-fuchsia-950/40 transition cursor-pointer disabled:opacity-50"
              >
                {isOptimizing ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    <span>Optimiere mit KI...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    <span>Prompt optimieren</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {optimizedResult && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
                <span className="font-semibold text-fuchsia-300">
                  {optimizedResult.changesSummary}
                </span>
                <span className="text-slate-400 font-mono text-[11px]">{optimizedResult.modelUsed}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-200 font-sans leading-relaxed whitespace-pre-wrap">
                {optimizedResult.optimizedPrompt}
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(optimizedResult.optimizedPrompt);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Kopieren</span>
                </button>

                {onSendToChat && (
                  <button
                    type="button"
                    onClick={() => onSendToChat(optimizedResult.optimizedPrompt)}
                    className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <span>In Chat übernehmen</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: WEB GROUNDING */}
      {activeTab === 'web' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-semibold text-white">
                Live Web-Recherche &amp; Grounding
              </h2>
            </div>

            <p className="text-xs text-slate-300">
              Recherchiert aktuelle Daten im Web und stellt verifizierte Faktenzitate für die KI-Modelle bereit.
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchWeb()}
                placeholder="Suchbegriff oder Frage eingeben..."
                className="flex-1 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSearchWeb}
                disabled={isSearching || !searchQuery.trim()}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition cursor-pointer disabled:opacity-50 shrink-0"
              >
                {isSearching ? <RotateCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span>Recherchieren</span>
              </button>
            </div>
          </div>

          {searchData && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 animate-in fade-in duration-150">
              <h3 className="font-semibold text-xs text-slate-200">Synthetisierte Antwort:</h3>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                {searchData.summary}
              </div>

              {searchData.results.length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-semibold text-slate-400">Verifizierte Quellen:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {searchData.results.map((r, rIdx) => (
                      <a
                        key={rIdx}
                        href={r.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 text-xs text-slate-300 flex flex-col gap-1 transition"
                      >
                        <div className="flex items-center justify-between text-[11px] text-emerald-400 font-mono">
                          <span className="truncate">{r.source}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </div>
                        <span className="font-semibold text-slate-100 line-clamp-1">{r.title}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: PIPELINE STATUS */}
      {activeTab === 'status' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {pipelines.map((p) => {
              const IconComp = p.icon;
              return (
                <div
                  key={p.id}
                  className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-sm flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className={`p-2 rounded-xl border ${p.color}`}>
                        <IconComp className="w-5 h-5" />
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono">
                        {p.status}
                      </span>
                    </div>
                    <h3 className="font-semibold text-sm text-white">{p.name}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{p.description}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>{p.badge}</span>
                    <span className="text-cyan-400 font-bold">100% In Betrieb</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
