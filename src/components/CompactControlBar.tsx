import React, { useState } from 'react';
import {
  Cpu,
  Sparkles,
  Zap,
  HardDrive,
  Activity,
  Monitor,
  ChevronDown,
  ChevronUp,
  BrainCircuit,
  SplitSquareVertical,
  Workflow,
  Scale,
  SlidersHorizontal,
  Lightbulb,
  Maximize2,
  Minimize2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { HybridMode, OllamaStatus } from '../types';
import { GEMINI_MODELS } from '../services/geminiService';

interface Props {
  // Ollama
  ollamaStatus: OllamaStatus;
  isScanning: boolean;
  onScan: () => void;
  activeOllamaModel: string;
  onSelectOllamaModel: (model: string) => void;
  isDemoMode: boolean;
  onToggleDemoMode: () => void;
  customHost: string;
  onChangeHost: (host: string) => void;

  // Hybrid Mode
  mode: HybridMode;
  onSelectMode: (mode: HybridMode) => void;

  // Gemini
  geminiModel: string;
  onSelectGeminiModel: (model: string) => void;
  enableThinking: boolean;
  onToggleThinking: () => void;

  // Quick Action Modals
  onOpenDriveD: () => void;
  driveDCount: number;
  onOpenQwenDecider: () => void;
  activeQwenModel: string;
  onOpenDiagnostics: () => void;
  onOpenPackager: () => void;

  // Focus & View Controls
  isChatFocused: boolean;
  onToggleChatFocus: () => void;
  chatFontSize: 'normal' | 'large';
  onToggleChatFontSize: () => void;
}

export const CompactControlBar: React.FC<Props> = ({
  ollamaStatus,
  isScanning,
  onScan,
  activeOllamaModel,
  onSelectOllamaModel,
  isDemoMode,
  onToggleDemoMode,
  customHost,
  onChangeHost,
  mode,
  onSelectMode,
  geminiModel,
  onSelectGeminiModel,
  enableThinking,
  onToggleThinking,
  onOpenDriveD,
  driveDCount,
  onOpenQwenDecider,
  activeQwenModel,
  onOpenDiagnostics,
  onOpenPackager,
  isChatFocused,
  onToggleChatFocus,
  chatFontSize,
  onToggleChatFontSize,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const modeOptions: { id: HybridMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'smart_router', label: 'Smart Router', icon: BrainCircuit },
    { id: 'side_by_side', label: 'Dual Direkt', icon: SplitSquareVertical },
    { id: 'collaborative', label: 'Verbund', icon: Workflow },
    { id: 'consensus', label: 'Konsensus', icon: Scale },
  ];

  return (
    <div className="border-b border-slate-800/80 bg-slate-950/95 backdrop-blur shrink-0 transition-all">
      {/* 1. SLIM ULTRA-COMPACT TOOLBAR (Height ~44px) */}
      <div className="px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 max-w-[1700px] mx-auto text-xs">
        {/* Left: Ollama Model & Status + Mode Selector Pills */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
          {/* Ollama Status Pill & Model Select */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs transition ${
              ollamaStatus.connected
                ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-200'
                : isDemoMode
                ? 'bg-amber-950/60 border-amber-700/60 text-amber-200'
                : 'bg-slate-900 border-slate-700 text-slate-300'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                ollamaStatus.connected
                  ? 'bg-emerald-400 animate-pulse'
                  : isDemoMode
                  ? 'bg-amber-400'
                  : 'bg-rose-400'
              }`}
            />
            <Cpu className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="font-semibold text-slate-200 hidden md:inline">Ollama:</span>
            <select
              value={activeOllamaModel}
              onChange={(e) => onSelectOllamaModel(e.target.value)}
              className="bg-transparent font-mono text-[11px] text-emerald-300 focus:outline-none cursor-pointer max-w-[110px] sm:max-w-[140px] truncate"
              title="Aktives lokales Ollama-Modell auswählen"
            >
              {ollamaStatus.models.map((m) => (
                <option key={m.name} value={m.name} className="bg-slate-900 text-slate-200">
                  {m.name}
                </option>
              ))}
            </select>

            <button
              onClick={onScan}
              disabled={isScanning}
              className="hover:text-emerald-100 transition p-0.5 ml-0.5 cursor-pointer"
              title="Ollama erneut scannen"
            >
              <RefreshCw className={`w-3 h-3 ${isScanning ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Mode Selector Segment Pills */}
          <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-lg p-0.5">
            {modeOptions.map((opt) => {
              const Icon = opt.icon;
              const isActive = mode === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => onSelectMode(opt.id)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                    isActive
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                  title={`Modus wechseln: ${opt.label}`}
                >
                  <Icon className="w-3 h-3" />
                  <span className="hidden lg:inline">{opt.label}</span>
                </button>
              );
            })}
          </div>

          {/* Gemini Model & Thinking Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-950/50 border border-cyan-800/60 text-cyan-200 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="font-semibold text-slate-200 hidden xl:inline">Gemini:</span>
            <select
              value={geminiModel}
              onChange={(e) => onSelectGeminiModel(e.target.value)}
              className="bg-transparent font-mono text-[11px] text-cyan-300 focus:outline-none cursor-pointer max-w-[120px] sm:max-w-[150px] truncate"
              title="Google Gemini Cloud-Modell wählen"
            >
              {GEMINI_MODELS.map((m) => (
                <option key={m.id} value={m.id} className="bg-slate-900 text-slate-200">
                  {m.name}
                </option>
              ))}
            </select>

            <button
              onClick={onToggleThinking}
              className={`p-0.5 rounded transition cursor-pointer flex items-center gap-0.5 text-[10px] ${
                enableThinking
                  ? 'text-amber-300 font-bold'
                  : 'text-slate-500 hover:text-slate-400'
              }`}
              title={enableThinking ? 'High Thinking aktiv (Stufe 2 Deep Reasoning)' : 'Thinking deaktiviert'}
            >
              <Lightbulb className="w-3 h-3" />
              <span className="hidden xl:inline">{enableThinking ? 'Denken AN' : 'AUS'}</span>
            </button>
          </div>
        </div>

        {/* Right: Quick Action Modals + Chat Size & Focus */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Drive D Vault */}
          <button
            type="button"
            onClick={onOpenDriveD}
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-200 transition text-[11px] font-medium cursor-pointer"
            title="Laufwerk D: Wissensbestand & RAG öffnen (D:\OllamaKnowledge\)"
          >
            <HardDrive className="w-3 h-3 text-amber-400" />
            <span className="hidden sm:inline">D:\ Tresor</span>
            <span className="bg-amber-500/20 text-amber-300 font-mono text-[10px] px-1 rounded">
              {driveDCount}
            </span>
          </button>

          {/* Qwen-Decider SLM */}
          <button
            type="button"
            onClick={onOpenQwenDecider}
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/30 text-violet-200 transition text-[11px] font-medium cursor-pointer hidden md:flex"
            title="Qwen-Decider Millisekunden Decision Head"
          >
            <Zap className="w-3 h-3 text-amber-400" />
            <span>Qwen-Decider</span>
          </button>

          {/* Herz & Nieren Test (99%) */}
          <button
            type="button"
            onClick={onOpenDiagnostics}
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-200 transition text-[11px] font-medium cursor-pointer hidden lg:flex"
            title="Herz & Nieren 99% Systemdiagnose öffnen"
          >
            <Activity className="w-3 h-3 text-cyan-400" />
            <span>Diagnose</span>
            <span className="bg-emerald-500/20 text-emerald-300 text-[9px] font-bold px-1 rounded">99%</span>
          </button>

          {/* Windows 11 App / Desktop-Icon */}
          <button
            type="button"
            onClick={onOpenPackager}
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-200 transition text-[11px] font-medium cursor-pointer"
            title="Windows 11 Verankerung & Desktop-Installer öffnen"
          >
            <Monitor className="w-3 h-3 text-cyan-400" />
            <span className="hidden sm:inline">Win11 App</span>
          </button>

          <div className="h-4 w-px bg-slate-800 mx-0.5" />

          {/* Chat Text Size Toggle (A- / A+) */}
          <button
            type="button"
            onClick={onToggleChatFontSize}
            className="flex items-center gap-0.5 px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 transition text-[11px] font-medium cursor-pointer"
            title={`Schriftgröße umschalten (Aktuell: ${chatFontSize === 'large' ? 'Groß für lange Texte' : 'Standard'})`}
          >
            <span className={chatFontSize === 'large' ? 'text-cyan-300 font-bold' : 'text-slate-400'}>A</span>
            <span className={chatFontSize === 'large' ? 'text-cyan-300 font-extrabold text-xs' : 'text-slate-200 font-bold'}>A+</span>
          </button>

          {/* Toggle Fullscreen / Maximum Chat Focus */}
          <button
            type="button"
            onClick={onToggleChatFocus}
            className={`p-1.5 rounded-md border transition cursor-pointer ${
              isChatFocused
                ? 'bg-cyan-600 border-cyan-400 text-white'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title={isChatFocused ? 'Volle Leiste wieder einblenden' : 'Chat maximieren (Fokus-Modus)'}
          >
            {isChatFocused ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Toggle Details Dropdown */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
            title={isExpanded ? 'Details zuklappen' : 'Erweiterte Host- & Modus-Details öffnen'}
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 2. OPTIONAL EXPANDED DETAILS (Only opens when user clicks Chevron) */}
      {isExpanded && (
        <div className="border-t border-slate-800 bg-slate-950 p-4 space-y-3 animate-in fade-in duration-150">
          <div className="max-w-[1700px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* Host Config */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <span className="font-semibold text-slate-200 block">Ollama Host (Windows 11)</span>
              <input
                type="text"
                value={customHost}
                onChange={(e) => onChangeHost(e.target.value)}
                placeholder="http://127.0.0.1:11434"
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
              />
              <div className="flex items-center justify-between">
                <button
                  onClick={onScan}
                  disabled={isScanning}
                  className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-[11px] font-medium"
                >
                  {isScanning ? 'Scannt...' : 'Neu scannen'}
                </button>
                <button
                  onClick={onToggleDemoMode}
                  className="text-[11px] text-amber-400 hover:underline"
                >
                  {isDemoMode ? 'Echter Modus' : 'Simulations-Modus'}
                </button>
              </div>
            </div>

            {/* Mode Explanations */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
              <span className="font-semibold text-slate-200 block">Aktiver Verbundmodus</span>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                {mode === 'smart_router' && 'Smart Router: Qwen-Decider wählt in <20ms ob lokal gerechnet oder an Gemini delegiert wird.'}
                {mode === 'side_by_side' && 'Side-by-Side: Ollama & Gemini berechnen gleichzeitig dieselbe Aufgabe im Direktvergleich.'}
                {mode === 'collaborative' && 'Verbund Pipeline: Lokales Ollama erstellt Entwurf ➔ Gemini veredelt mit High Thinking.'}
                {mode === 'consensus' && 'Konsensus: Führt beide Modelle zusammen und erstellt eine ausgewogene Synthese.'}
              </p>
            </div>

            {/* Laufwerk D Vault Status */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
              <span className="font-semibold text-amber-300 block">D:\OllamaKnowledge RAG</span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Cloud-Antworten und Wissensfragmente werden synchronisiert, damit Ollama offline darauf zugreifen kann.
              </p>
              <button
                onClick={onOpenDriveD}
                className="text-[11px] text-amber-300 hover:underline font-medium"
              >
                Dateien &amp; Cache ansehen &rarr;
              </button>
            </div>

            {/* Hardware & Diagnostics */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
              <span className="font-semibold text-emerald-300 block">Systemintegrität (99%)</span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Alle Prüfpunkte (DirectML, Hallunox Guardrail, VRAM-Last) sind kalibriert.
              </p>
              <button
                onClick={onOpenDiagnostics}
                className="text-[11px] text-cyan-300 hover:underline font-medium"
              >
                Diagnose-Center öffnen &rarr;
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
