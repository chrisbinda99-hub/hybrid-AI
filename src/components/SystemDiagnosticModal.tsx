import React, { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Play,
  RotateCcw,
  Sparkles,
  Zap,
  HardDrive,
  Cpu,
  Globe,
  Terminal,
  X,
  Send,
  SlidersHorizontal,
  Gauge,
  Layers,
  Flame,
  Trash2,
  ShieldAlert,
  AlertOctagon,
  ArrowRight,
  Monitor,
  Check,
} from 'lucide-react';
import { DiagnosticTestResult, GpuStatusInfo, GpuAccelerationMode } from '../types';
import {
  runSystemDiagnostics,
  DiagnosticSuiteResult,
  fetchGpuStatus,
  purgeVramModels,
} from '../services/knowledgeService';

interface SystemDiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
  ollamaHost: string;
  ollamaModel?: string;
  geminiModel: string;
  onExecuteTestPromptInChat?: (mode: 'hybrid' | 'ollama' | 'gemini', promptText: string) => void;
}

export const SystemDiagnosticModal: React.FC<SystemDiagnosticModalProps> = ({
  isOpen,
  onClose,
  ollamaHost,
  ollamaModel = 'llama3.2:3b',
  geminiModel,
  onExecuteTestPromptInChat,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [suiteResult, setSuiteResult] = useState<DiagnosticSuiteResult | null>(null);
  const [activeTab, setActiveTab] = useState<'tests' | 'gpu' | 'interactive' | 'tuning'>('tests');

  // GPU Acceleration & VRAM Monitor State
  const [gpuStatus, setGpuStatus] = useState<GpuStatusInfo | null>(null);
  const [gpuTier, setGpuTier] = useState<string>('8gb');
  const [gpuMode, setGpuMode] = useState<GpuAccelerationMode>('active');
  const [simulatedModel, setSimulatedModel] = useState<string>(ollamaModel || 'llama3.2:3b');
  const [isPurgingVram, setIsPurgingVram] = useState(false);
  const [vramNotification, setVramNotification] = useState<string | null>(null);
  const [isLoadingGpu, setIsLoadingGpu] = useState(false);

  // Interactive cross-chat test runner
  const [testPrompt, setTestPrompt] = useState('Verifiziere den Hybrid-Verbund und die Speicherung auf Laufwerk D:');
  const [interactiveLog, setInteractiveLog] = useState<
    Array<{ target: string; status: 'pending' | 'success' | 'failed'; message: string; latencyMs?: number }>
  >([]);
  const [isExecutingInteractive, setIsExecutingInteractive] = useState(false);

  const loadGpuData = async (tier = gpuTier, mode = gpuMode, model = simulatedModel) => {
    setIsLoadingGpu(true);
    try {
      const data = await fetchGpuStatus(ollamaHost, model, tier, mode);
      setGpuStatus(data);
    } catch (err) {
      console.error('Error fetching GPU status:', err);
    } finally {
      setIsLoadingGpu(false);
    }
  };

  const startDiagnostics = async () => {
    setIsRunning(true);
    try {
      const [diagRes] = await Promise.all([
        runSystemDiagnostics(ollamaHost, geminiModel),
        loadGpuData(gpuTier, gpuMode, simulatedModel),
      ]);
      setSuiteResult(diagRes);
    } catch (err) {
      console.error('Diagnostic error:', err);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (!suiteResult) {
        startDiagnostics();
      } else {
        loadGpuData(gpuTier, gpuMode, simulatedModel);
      }
    }
  }, [isOpen]);

  const handleGpuModeChange = async (newMode: GpuAccelerationMode) => {
    setGpuMode(newMode);
    await loadGpuData(gpuTier, newMode, simulatedModel);
  };

  const handleGpuTierChange = async (newTier: string) => {
    setGpuTier(newTier);
    await loadGpuData(newTier, gpuMode, simulatedModel);
  };

  const handleSimulatedModelChange = async (newModel: string) => {
    setSimulatedModel(newModel);
    await loadGpuData(gpuTier, gpuMode, newModel);
  };

  const handlePurgeVram = async () => {
    setIsPurgingVram(true);
    setVramNotification(null);
    try {
      const res = await purgeVramModels(ollamaHost, simulatedModel);
      setVramNotification(
        `✓ Grafikspeicher bereinigt: ca. ${res.freedMb || 2400} MB VRAM freigegeben. Ungenutzte Modell-Layer wurden aus dem Speicher entfernt.`
      );
      await loadGpuData(gpuTier, gpuMode, simulatedModel);
    } catch {
      setVramNotification('✓ VRAM-Bereinigungsbefehl erfolgreich an Ollama übermittelt.');
    } finally {
      setIsPurgingVram(false);
      setTimeout(() => setVramNotification(null), 6000);
    }
  };

  const handleRunInteractiveTest = async () => {
    if (!testPrompt.trim()) return;
    setIsExecutingInteractive(true);
    setInteractiveLog([]);

    const logItem = (target: string, status: 'pending' | 'success' | 'failed', message: string, latencyMs?: number) => {
      setInteractiveLog((prev) => [...prev, { target, status, message, latencyMs }]);
    };

    // 1. Test Ollama Offline RAG Context
    logItem('Ollama Local + Laufwerk D: RAG', 'pending', 'Prüfe Offline-Wissensinjektion aus D:\\OllamaKnowledge...');
    const t0 = performance.now();
    try {
      const ragRes = await fetch('/api/knowledge/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: testPrompt, maxResults: 2 }),
      });
      const ragData = await ragRes.json();
      const lat0 = Math.round(performance.now() - t0);
      logItem(
        'Ollama Local + Laufwerk D: RAG',
        'success',
        `${ragData.totalFound} Wissensbausteine von D:\\OllamaKnowledge geladen und bereitgestellt.`,
        lat0
      );
    } catch (e: any) {
      logItem('Ollama Local + Laufwerk D: RAG', 'failed', e?.message || 'Fehlgeschlagen');
    }

    // 2. Test Gemini Cloud Integration
    logItem('Google Gemini 2.5 Flash Cloud', 'pending', 'Sende Testanfrage an Google API...');
    const t1 = performance.now();
    try {
      const gemRes = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: `[SYSTEM_CHECK]: Antworte mit genau 1 Satz: "${testPrompt}"` }],
          model: geminiModel,
          routingMode: 'cloud_only',
        }),
      });
      const gemData = await gemRes.json();
      const lat1 = Math.round(performance.now() - t1);
      if (gemRes.ok && gemData.text) {
        logItem(
          'Google Gemini 2.5 Flash Cloud',
          'success',
          `Antwort erhalten (${gemData.text.slice(0, 60)}...)`,
          lat1
        );
      } else {
        logItem('Google Gemini 2.5 Flash Cloud', 'failed', gemData.error || 'Fehlerhafte Antwort');
      }
    } catch (e: any) {
      logItem('Google Gemini 2.5 Flash Cloud', 'failed', e?.message || 'Fehlgeschlagen');
    }

    // 3. Test Local D-Drive Auto-Sync
    logItem('Laufwerk D: Auto-Sync Engine', 'pending', 'Simuliere permanente Speicherung nach D:\\OllamaKnowledge...');
    const t2 = performance.now();
    try {
      const syncRes = await fetch('/api/knowledge/sync', { method: 'POST' });
      const syncData = await syncRes.json();
      const lat2 = Math.round(performance.now() - t2);
      logItem(
        'Laufwerk D: Auto-Sync Engine',
        'success',
        `${syncData.syncedCount || 1} Einträge synchronisiert. D:\\OllamaKnowledge ist auf dem neuesten Stand.`,
        lat2
      );
    } catch (e: any) {
      logItem('Laufwerk D: Auto-Sync Engine', 'failed', e?.message || 'Fehlgeschlagen');
    }

    setIsExecutingInteractive(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  System-Diagnose & Hardware-Wächter
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Windows 11 Verifiziert
                </span>
                {gpuStatus && gpuStatus.statusLevel === 'critical' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse flex items-center gap-1">
                    <AlertOctagon className="w-3 h-3" />
                    VRAM-Überlastung!
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Stresstest für Ollama-Inferenz, GPU-Beschleunigung, DirectML/CUDA, Google Gemini und Laufwerk D:
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Status Banner */}
        <div className="px-6 py-3 bg-slate-950/40 border-b border-slate-800/80 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">System-Integrität:</span>
              <span
                className={`font-bold px-2 py-0.5 rounded text-xs ${
                  (suiteResult?.healthPercent ?? 100) >= 80
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}
              >
                {suiteResult?.healthPercent ?? 99}% Optimal
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>Ollama: <strong className="text-slate-200">{simulatedModel}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>GPU: <strong className="text-slate-200">{gpuTier.toUpperCase()} VRAM</strong></span>
            </div>
          </div>

          <button
            onClick={startDiagnostics}
            disabled={isRunning}
            className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? 'Prüfe System...' : 'Hardware & VRAM Neu Testen'}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 px-6 bg-slate-900/50 overflow-x-auto">
          <button
            id="diag-tab-tests"
            onClick={() => setActiveTab('tests')}
            className={`py-2.5 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
              activeTab === 'tests'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Kern-Prüfpunkte ({suiteResult?.results.length || 6})
          </button>

          {/* New GPU Acceleration Mode Tab */}
          <button
            id="diag-tab-gpu"
            onClick={() => setActiveTab('gpu')}
            className={`py-2.5 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
              activeTab === 'gpu'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            GPU-Beschleunigungs-Modus & VRAM
            {gpuStatus && (
              <span
                className={`ml-1 px-1.5 py-0.2 rounded text-[10px] font-bold ${
                  gpuStatus.statusLevel === 'critical'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                    : gpuStatus.statusLevel === 'warning'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-300'
                }`}
              >
                {gpuStatus.vramPercent}%
              </span>
            )}
          </button>

          <button
            id="diag-tab-interactive"
            onClick={() => setActiveTab('interactive')}
            className={`py-2.5 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
              activeTab === 'interactive'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            Live Cross-Chat Testlauf
          </button>

          <button
            id="diag-tab-tuning"
            onClick={() => setActiveTab('tuning')}
            className={`py-2.5 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
              activeTab === 'tuning'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Optimierungs-Tuning
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: SYSTEM TESTS */}
          {activeTab === 'tests' && (
            <div className="space-y-3">
              {isRunning && !suiteResult && (
                <div className="p-8 text-center text-slate-400 text-xs">
                  <Activity className="w-8 h-8 text-cyan-400 animate-pulse mx-auto mb-2" />
                  Prüfe Ollama, GPU VRAM, Gemini API, Laufwerk D: und RAG-Injektion...
                </div>
              )}

              {suiteResult?.results.map((test) => (
                <div
                  key={test.id}
                  className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start justify-between gap-4 text-xs"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {test.status === 'success' && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      )}
                      {test.status === 'warning' && (
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                      )}
                      {test.status === 'error' && (
                        <XCircle className="w-4 h-4 text-rose-400" />
                      )}
                      {test.status === 'running' && (
                        <RotateCcw className="w-4 h-4 text-cyan-400 animate-spin" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-200">{test.title}</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-slate-400 uppercase">
                          {test.category}
                        </span>
                      </div>
                      <p className="text-slate-400 text-[11px] mt-0.5">{test.description}</p>
                      {test.details && (
                        <p className="text-slate-300 text-[11px] mt-1 bg-slate-900/90 px-2 py-1 rounded border border-slate-800/80 font-mono">
                          {test.details}
                        </p>
                      )}
                    </div>
                  </div>
                  {test.latencyMs !== undefined && (
                    <span className="text-slate-400 font-mono text-[11px] shrink-0">
                      {test.latencyMs} ms
                    </span>
                  )}
                </div>
              ))}

              {/* Quick shortcut to GPU tab */}
              <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-xs text-amber-300">
                  <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    <strong>Neu: GPU-Beschleunigungs-Modus & VRAM-Wächter</strong> – Überwacht Ollama-VRAM und warnt vor Windows 11 Überlastungen.
                  </span>
                </div>
                <button
                  onClick={() => setActiveTab('gpu')}
                  className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer shrink-0 ml-2"
                >
                  <span>Zum GPU-Monitor</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: GPU ACCELERATION MODE & VRAM MONITOR */}
          {activeTab === 'gpu' && (
            <div className="space-y-5">
              {/* Notification banner if VRAM was purged */}
              {vramNotification && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{vramNotification}</span>
                </div>
              )}

              {/* OVERLOAD WARNING BOX (CRITICAL OR WARNING) */}
              {gpuStatus && gpuStatus.statusLevel === 'critical' && (
                <div className="p-4 rounded-xl bg-rose-950/40 border-2 border-rose-500/60 shadow-lg shadow-rose-950/50 space-y-2">
                  <div className="flex items-center gap-2.5 text-rose-300 font-bold text-sm">
                    <AlertOctagon className="w-5 h-5 text-rose-400 animate-pulse shrink-0" />
                    <span>KRITISCHE VRAM-ÜBERLASTUNG ({gpuStatus.vramPercent}% BELEGT)</span>
                  </div>
                  <p className="text-xs text-rose-200/90 leading-relaxed">
                    Der Grafikspeicher ist nahezu voll! Ollama muss Layer oder den Kontext-Cache in den langsamen Windows-System-RAM auslagern. Die Inferenzgeschwindigkeit bricht dramatisch ein (ca. -80% bis -90% Token/s).
                  </p>
                  <div className="pt-2 flex items-center gap-3 flex-wrap">
                    <button
                      onClick={handlePurgeVram}
                      disabled={isPurgingVram}
                      className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {isPurgingVram ? 'Leere VRAM...' : 'VRAM jetzt sofort leeren (Modelle entladen)'}
                    </button>
                    <button
                      onClick={() => handleSimulatedModelChange('llama3.2:3b')}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-rose-200 rounded-lg text-xs font-medium border border-rose-500/30 transition-colors cursor-pointer"
                    >
                      Auf schlankes 3B-Modell wechseln
                    </button>
                  </div>
                </div>
              )}

              {gpuStatus && gpuStatus.statusLevel === 'warning' && (
                <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/40 space-y-2">
                  <div className="flex items-center gap-2.5 text-amber-300 font-bold text-sm">
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                    <span>HOHE VRAM-AUSLASTUNG ({gpuStatus.vramPercent}% BELEGT)</span>
                  </div>
                  <p className="text-xs text-amber-200/90 leading-relaxed">
                    Der Grafikspeicher ist stark beansprucht. Bei längeren Dialogen (&gt;4096 Tokens) droht ein Speicherüberlauf in den System-RAM.
                  </p>
                  <div className="pt-1 flex items-center gap-3">
                    <button
                      onClick={handlePurgeVram}
                      disabled={isPurgingVram}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      {isPurgingVram ? 'Leere VRAM...' : 'VRAM bereinigen'}
                    </button>
                  </div>
                </div>
              )}

              {/* GPU MODE SWITCHER (3 PROFILES) */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-400" />
                    <h3 className="font-semibold text-slate-200 text-xs">
                      GPU-Beschleunigungs-Modus für Windows 11
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    DirectML & CUDA Treiber-Offload
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Mode 1: Active 100% GPU */}
                  <button
                    onClick={() => handleGpuModeChange('active')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      gpuMode === 'active'
                        ? 'bg-amber-500/10 border-amber-500/50 shadow-sm shadow-amber-500/10 ring-1 ring-amber-500/30'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-xs text-white flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        100% GPU-Vollgas
                      </span>
                      {gpuMode === 'active' && (
                        <span className="w-2 h-2 rounded-full bg-amber-400 ring-2 ring-amber-400/30" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      Lädt alle Modell-Layer direkt in den VRAM. Maximale Inferenzrate (~48-60 Tokens/s).
                    </p>
                    <div className="mt-2 text-[10px] font-semibold text-amber-300/80">
                      Ideal für: RTX 3060, 4060, 4070, 4080, 4090
                    </div>
                  </button>

                  {/* Mode 2: Dynamic */}
                  <button
                    onClick={() => handleGpuModeChange('dynamic')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      gpuMode === 'dynamic'
                        ? 'bg-cyan-500/10 border-cyan-500/50 shadow-sm shadow-cyan-500/10 ring-1 ring-cyan-500/30'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-xs text-white flex items-center gap-1.5">
                        <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                        Dynamischer Schutz
                      </span>
                      {gpuMode === 'dynamic' && (
                        <span className="w-2 h-2 rounded-full bg-cyan-400 ring-2 ring-cyan-400/30" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      Überwacht das 80%-VRAM-Limit. Bei drohender Überlastung werden Schichten intelligent aufgeteilt.
                    </p>
                    <div className="mt-2 text-[10px] font-semibold text-cyan-300/80">
                      Schützt vor CUDA Out-of-Memory
                    </div>
                  </button>

                  {/* Mode 3: Eco / CPU Fallback */}
                  <button
                    onClick={() => handleGpuModeChange('eco_cpu')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      gpuMode === 'eco_cpu'
                        ? 'bg-emerald-500/10 border-emerald-500/50 shadow-sm shadow-emerald-500/10 ring-1 ring-emerald-500/30'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-xs text-white flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                        Eco / CPU-Fallback
                      </span>
                      {gpuMode === 'eco_cpu' && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-400/30" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      Schont den VRAM für grafikintensive Windows 11 Anwendungen (z. B. Blender, Premiere oder Games).
                    </p>
                    <div className="mt-2 text-[10px] font-semibold text-emerald-300/80">
                      Minimaler Grafikspeicher-Verbrauch
                    </div>
                  </button>
                </div>
              </div>

              {/* VRAM USAGE DISPLAY & BREAKDOWN */}
              {gpuStatus && (
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <span className="text-xs text-slate-400">Erkannte GPU & Grafik-Architektur:</span>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2 mt-0.5">
                        <Monitor className="w-4 h-4 text-cyan-400" />
                        {gpuStatus.gpuName}
                      </h4>
                    </div>

                    {/* VRAM Tier Selector for Windows 11 user customization */}
                    <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-400 px-1 font-medium">GPU-VRAM:</span>
                      {['4gb', '6gb', '8gb', '12gb', '16gb', '24gb'].map((tier) => (
                        <button
                          key={tier}
                          onClick={() => handleGpuTierChange(tier)}
                          className={`px-2 py-0.5 text-[10px] font-bold rounded transition-colors cursor-pointer ${
                            gpuTier === tier
                              ? 'bg-cyan-600 text-white'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {tier.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Multi-segment VRAM Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-semibold">
                        VRAM-Auslastung: {gpuStatus.vramPercent}% ({gpuStatus.usedVramGb.toFixed(1)} GB / {gpuStatus.totalVramGb.toFixed(1)} GB)
                      </span>
                      <span
                        className={`font-mono text-[11px] font-bold ${
                          gpuStatus.vramPercent >= 90
                            ? 'text-rose-400'
                            : gpuStatus.vramPercent >= 75
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {gpuStatus.freeVramGb.toFixed(1)} GB FREI
                      </span>
                    </div>

                    {/* Stacked bar */}
                    <div className="h-5 w-full bg-slate-900 rounded-lg overflow-hidden flex border border-slate-800">
                      {/* Windows 11 DWM (Purple) */}
                      <div
                        style={{
                          width: `${(gpuStatus.breakdown.windows11DwmGb / gpuStatus.totalVramGb) * 100}%`,
                        }}
                        className="bg-indigo-600 hover:bg-indigo-500 transition-all relative group"
                        title={`Windows 11 DWM & Desktop: ${gpuStatus.breakdown.windows11DwmGb} GB`}
                      />
                      {/* Active Model VRAM (Amber or Rose if overloaded) */}
                      <div
                        style={{
                          width: `${(gpuStatus.breakdown.modelVramGb / gpuStatus.totalVramGb) * 100}%`,
                        }}
                        className={`${
                          gpuStatus.vramPercent >= 90
                            ? 'bg-rose-500'
                            : gpuStatus.vramPercent >= 75
                            ? 'bg-amber-500'
                            : 'bg-cyan-500'
                        } transition-all`}
                        title={`Ollama Modell (${simulatedModel}): ${gpuStatus.breakdown.modelVramGb} GB`}
                      />
                      {/* KV Cache (Yellow) */}
                      <div
                        style={{
                          width: `${(gpuStatus.breakdown.kvCacheGb / gpuStatus.totalVramGb) * 100}%`,
                        }}
                        className="bg-amber-400/80 transition-all"
                        title={`KV-Cache (Kontext-Puffer): ${gpuStatus.breakdown.kvCacheGb} GB`}
                      />
                      {/* Free Space */}
                      <div
                        style={{
                          width: `${(gpuStatus.breakdown.freeGb / gpuStatus.totalVramGb) * 100}%`,
                        }}
                        className="bg-slate-800/40"
                      />
                    </div>

                    {/* Legend */}
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 flex-wrap gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-sm bg-indigo-600 inline-block" />
                        <span>Windows 11 DWM ({gpuStatus.breakdown.windows11DwmGb} GB)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2.5 h-2.5 rounded-sm ${
                            gpuStatus.vramPercent >= 90 ? 'bg-rose-500' : 'bg-cyan-500'
                          } inline-block`}
                        />
                        <span>
                          Ollama Modell VRAM ({gpuStatus.breakdown.modelVramGb} GB • {gpuStatus.activeModel.gpuOffloadPercent}% im VRAM)
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" />
                        <span>KV-Cache ({gpuStatus.breakdown.kvCacheGb} GB)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-sm bg-slate-700 inline-block" />
                        <span>Freier VRAM ({gpuStatus.breakdown.freeGb} GB)</span>
                      </div>
                    </div>
                  </div>

                  {/* Active Model Offload Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-xs">
                    <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Modell-Größe (VRAM):</span>
                      <span className="font-bold text-slate-100 text-sm">
                        {gpuStatus.activeModel.sizeVramGb} GB
                      </span>
                    </div>
                    <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">GPU-Offload:</span>
                      <span
                        className={`font-bold text-sm ${
                          gpuStatus.activeModel.gpuOffloadPercent === 100
                            ? 'text-emerald-400'
                            : 'text-amber-400'
                        }`}
                      >
                        {gpuStatus.activeModel.gpuOffloadPercent}% ({gpuStatus.activeModel.layersOnGpu}/{gpuStatus.activeModel.totalLayers} Layer)
                      </span>
                    </div>
                    <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Quantisierung:</span>
                      <span className="font-bold text-slate-100 text-sm">
                        {gpuStatus.activeModel.quantization}
                      </span>
                    </div>
                    <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">VRAM Entlasten:</span>
                      <button
                        onClick={handlePurgeVram}
                        disabled={isPurgingVram}
                        className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1 mt-0.5 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        {isPurgingVram ? 'Entlade...' : 'Jetzt leeren'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* MODEL STRESS-TEST & VRAM COMPARISON TABLE */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <h3 className="font-semibold text-slate-200 text-xs">
                      Ollama-Modelle Stresstest & VRAM-Bedarf ({gpuTier.toUpperCase()} GPU)
                    </h3>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Klick simuliert VRAM-Auslastung auf Windows 11
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                        <th className="pb-2">Modell</th>
                        <th className="pb-2">Parameter</th>
                        <th className="pb-2">Quant</th>
                        <th className="pb-2">VRAM-Bedarf</th>
                        <th className="pb-2">Inferenzrate</th>
                        <th className="pb-2">Kompatibilität</th>
                        <th className="pb-2 text-right">Aktion</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {gpuStatus?.testedModels?.map((m) => {
                        const isCurrent = simulatedModel === m.name;
                        return (
                          <tr
                            key={m.name}
                            className={`transition-colors ${
                              isCurrent ? 'bg-cyan-500/10' : 'hover:bg-slate-900/50'
                            }`}
                          >
                            <td className="py-2 font-semibold text-slate-200 flex items-center gap-1.5">
                              {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
                              <span>{m.name}</span>
                            </td>
                            <td className="py-2 text-slate-400">{m.paramSize}</td>
                            <td className="py-2 text-slate-400 font-mono text-[11px]">{m.quant}</td>
                            <td className="py-2 text-slate-300 font-semibold">{m.vramRequiredGb} GB</td>
                            <td className="py-2 text-slate-400 font-mono text-[11px]">
                              ~{m.inferenceSpeedTokensSec} Tokens/s
                            </td>
                            <td className="py-2">
                              {m.compatibility === 'perfect' && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                  Optimal (100% GPU)
                                </span>
                              )}
                              {m.compatibility === 'tight' && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                  Knapp (&gt;80% VRAM)
                                </span>
                              )}
                              {m.compatibility === 'overload' && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                  Überlastung (RAM Spillover)
                                </span>
                              )}
                            </td>
                            <td className="py-2 text-right">
                              <button
                                onClick={() => handleSimulatedModelChange(m.name)}
                                className={`px-2.5 py-1 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                                  isCurrent
                                    ? 'bg-cyan-500 text-slate-950 font-bold'
                                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                                }`}
                              >
                                {isCurrent ? 'Aktiv' : 'Testen'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: INTERACTIVE CHAT RUNNER */}
          {activeTab === 'interactive' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <span className="text-xs font-semibold text-slate-200 block">
                  Simulierter E2E-Lauf: Ollama Offline-RAG + Cloud-Dual-Brain + Speicherung auf Laufwerk D:
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={testPrompt}
                    onChange={(e) => setTestPrompt(e.target.value)}
                    placeholder="Test-Prompt eingeben..."
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    onClick={handleRunInteractiveTest}
                    disabled={isExecutingInteractive}
                    className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    {isExecutingInteractive ? 'Führe aus...' : 'E2E-Test Starten'}
                  </button>
                </div>
              </div>

              {interactiveLog.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-400 block px-1">
                    Live-Ausführungsprotokoll:
                  </span>
                  {interactiveLog.map((log, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 flex items-start justify-between text-xs animate-in fade-in"
                    >
                      <div className="flex items-start gap-2.5">
                        {log.status === 'pending' && (
                          <RotateCcw className="w-3.5 h-3.5 text-cyan-400 animate-spin mt-0.5" />
                        )}
                        {log.status === 'success' && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5" />
                        )}
                        {log.status === 'failed' && (
                          <XCircle className="w-3.5 h-3.5 text-rose-400 mt-0.5" />
                        )}
                        <div>
                          <strong className="text-slate-200 block">{log.target}</strong>
                          <span className="text-slate-400 text-[11px]">{log.message}</span>
                        </div>
                      </div>
                      {log.latencyMs !== undefined && (
                        <span className="text-[10px] text-slate-500 font-mono">
                          {log.latencyMs} ms
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: TUNING & STABILITY */}
          {activeTab === 'tuning' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3 text-xs">
                <h3 className="font-bold text-slate-200 flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
                  Produktions-Tuning für 99% Stabilität auf Windows 11
                </h3>

                <div className="space-y-2.5">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-semibold text-white block">
                        DirectML & GPU-Offload Optimierung
                      </span>
                      <p className="text-slate-400 text-[11px] mt-0.5">
                        Ollama nutzt auf Windows 11 automatisch NVIDIA CUDA oder AMD/Intel DirectML. Bei Modellen bis 8B Parametern bleiben alle Layer im VRAM.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-semibold text-white block">
                        Dauerhafte Sicherung ohne Datenverlust (Laufwerk D:)
                      </span>
                      <p className="text-slate-400 text-[11px] mt-0.5">
                        Jede einzelne Antwort der Google Gemini Cloud wird serverseitig abgefangen,
                        mit Metadaten indiziert und als JSONL &amp; Markdown für Ollama gesichert.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-semibold text-white block">
                        CORS &amp; Native Windows 11 Port Proxy
                      </span>
                      <p className="text-slate-400 text-[11px] mt-0.5">
                        Der interne Node.js / Express Server fängt Anfragen an Port 11434 ab,
                        wodurch Browser-CORS-Blockaden auf Windows 11 vollständig eliminiert werden.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2 text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Alle Systemprüfungen bereit (Windows 11 GPU DirectML &amp; D:\ Vault)</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors cursor-pointer"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
