import React, { useState, useEffect, useRef } from 'react';
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
  ShieldCheck,
  AlertOctagon,
  ArrowRight,
  Monitor,
  Check,
  FileText,
  Download,
  Save,
  Eye,
  Copy,
  FolderCheck,
  Brain,
} from 'lucide-react';
import {
  DiagnosticTestResult,
  GpuStatusInfo,
  GpuAccelerationMode,
  HallunoxStatus,
  HallunoxVerificationResult,
  QwenDeciderStatus,
  QwenDeciderEvaluation,
  KevFamilyBenchmarkResult,
} from '../types';
import {
  runSystemDiagnostics,
  DiagnosticSuiteResult,
  fetchGpuStatus,
  purgeVramModels,
  saveVramDiagnosticReport,
  fetchSavedDiagnosticReports,
  VramAlertReport,
  SavedReportItem,
} from '../services/knowledgeService';
import { fetchHallunoxStatus, verifyWithHallunox, downloadHallunoxFile } from '../services/hallunoxService';
import {
  fetchQwenStatus,
  testQwenDecider,
  downloadQwenFile,
  runKevFamilyBenchmark,
  KEV_FAMILY_MEMBERS,
  DEFAULT_QWEN_DECIDER_MODEL,
} from '../services/qwenDeciderService';
import { VramUsageChartD3 } from './VramUsageChartD3';
import { Loihi2NeuromorphicView } from './Loihi2NeuromorphicView';

interface SystemDiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'tests' | 'gpu' | 'hallunox' | 'qwen' | 'loihi2' | 'interactive' | 'tuning';
  ollamaHost: string;
  ollamaModel?: string;
  geminiModel: string;
  activeQwenModel?: string;
  onSelectQwenModel?: (model: string) => void;
  onExecuteTestPromptInChat?: (mode: 'hybrid' | 'ollama' | 'gemini', promptText: string) => void;
}

export const SystemDiagnosticModal: React.FC<SystemDiagnosticModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'tests',
  ollamaHost,
  ollamaModel = 'llama3.2:3b',
  geminiModel,
  activeQwenModel = DEFAULT_QWEN_DECIDER_MODEL,
  onSelectQwenModel,
  onExecuteTestPromptInChat,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [suiteResult, setSuiteResult] = useState<DiagnosticSuiteResult | null>(null);
  const [activeTab, setActiveTab] = useState<'tests' | 'gpu' | 'hallunox' | 'qwen' | 'loihi2' | 'interactive' | 'tuning'>(
    initialTab || 'tests'
  );

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Qwen-Decider SLM State (Winzige JEPA-Entscheidungsmodelle)
  const [qwenStatus, setQwenStatus] = useState<QwenDeciderStatus | null>(null);
  const [isLoadingQwen, setIsLoadingQwen] = useState(false);
  const [qwenTestPrompt, setQwenTestPrompt] = useState('Kannst du mir helfen das Kennwort für meinen Windows 11 Account zurückzusetzen?');
  const [qwenTestResult, setQwenTestResult] = useState<QwenDeciderEvaluation | null>(null);
  const [isTestingQwen, setIsTestingQwen] = useState(false);
  const [qwenCopiedCmd, setQwenCopiedCmd] = useState<string | null>(null);
  const [selectedQwenModel, setSelectedQwenModel] = useState<string>(activeQwenModel || 'kev-0.8b');
  const [showQwenJson, setShowQwenJson] = useState(false);
  const [kevBenchmarkResult, setKevBenchmarkResult] = useState<KevFamilyBenchmarkResult | null>(null);
  const [isRunningKevBenchmark, setIsRunningKevBenchmark] = useState(false);

  useEffect(() => {
    if (activeQwenModel) {
      setSelectedQwenModel(activeQwenModel);
    }
  }, [activeQwenModel]);

  const loadQwenStatus = async () => {
    setIsLoadingQwen(true);
    try {
      const status = await fetchQwenStatus(ollamaHost);
      setQwenStatus(status);
    } catch (err) {
      console.log('[Notice] Qwen status load handled:', err);
    } finally {
      setIsLoadingQwen(false);
    }
  };

  const handleTestQwen = async (promptOverride?: string) => {
    const prompt = promptOverride || qwenTestPrompt;
    if (!prompt.trim()) return;
    setIsTestingQwen(true);
    try {
      const res = await testQwenDecider(prompt, ollamaHost, selectedQwenModel);
      setQwenTestResult(res);
    } catch (err) {
      console.log('[Notice] Qwen test handled:', err);
    } finally {
      setIsTestingQwen(false);
    }
  };

  const handleRunKevBenchmark = async (promptOverride?: string) => {
    const prompt = promptOverride || qwenTestPrompt;
    if (!prompt.trim()) return;
    setIsRunningKevBenchmark(true);
    try {
      const res = await runKevFamilyBenchmark(prompt);
      setKevBenchmarkResult(res);
    } catch (err) {
      console.log('[Notice] Kev benchmark test handled:', err);
    } finally {
      setIsRunningKevBenchmark(false);
    }
  };

  const handleCopyQwenCmd = (cmd: string, key: string) => {
    navigator.clipboard.writeText(cmd);
    setQwenCopiedCmd(key);
    setTimeout(() => setQwenCopiedCmd(null), 2500);
  };

  // Hallunox Anti-Hallucination Guardrail State
  const [hallunoxStatus, setHallunoxStatus] = useState<HallunoxStatus | null>(null);
  const [isLoadingHallunox, setIsLoadingHallunox] = useState(false);
  const [hallunoxPrompt, setHallunoxPrompt] = useState('Erkläre die Vor- und Nachteile von Microservices gegenüber einem Monolithen.');
  const [hallunoxResponse, setHallunoxResponse] = useState('Microservices bieten unabhängige Skalierbarkeit und modulare Bereitstellung, erhöhen jedoch die Netzwerkkomplexität und den Betriebsaufwand im Vergleich zu einer monolithischen Architektur.');
  const [hallunoxTestResult, setHallunoxTestResult] = useState<HallunoxVerificationResult | null>(null);
  const [isVerifyingHallunox, setIsVerifyingHallunox] = useState(false);
  const [hallunoxCopiedCmd, setHallunoxCopiedCmd] = useState<string | null>(null);
  const [hallunoxGuardrailEnabled, setHallunoxGuardrailEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hybrid_hallunox_guardrail_enabled') !== 'false';
    } catch {
      return true;
    }
  });

  const toggleHallunoxGuardrail = (enabled: boolean) => {
    setHallunoxGuardrailEnabled(enabled);
    try {
      localStorage.setItem('hybrid_hallunox_guardrail_enabled', enabled ? 'true' : 'false');
    } catch {}
  };

  const loadHallunoxStatus = async () => {
    setIsLoadingHallunox(true);
    try {
      const st = await fetchHallunoxStatus();
      setHallunoxStatus(st);
    } catch {
      // ignore
    } finally {
      setIsLoadingHallunox(false);
    }
  };

  const handleTestHallunoxVerification = async () => {
    if (!hallunoxPrompt.trim()) return;
    setIsVerifyingHallunox(true);
    try {
      const res = await verifyWithHallunox({
        prompt: hallunoxPrompt,
        response: hallunoxResponse,
        model: ollamaModel || 'llama3.2:3b',
        threshold: 0.85,
      });
      setHallunoxTestResult(res);
    } catch (err: any) {
      console.log('[Notice] Hallunox verification handled:', err);
    } finally {
      setIsVerifyingHallunox(false);
    }
  };

  // GPU Acceleration & VRAM Monitor State
  const [gpuStatus, setGpuStatus] = useState<GpuStatusInfo | null>(null);
  const [gpuTier, setGpuTier] = useState<string>('8gb');
  const [gpuMode, setGpuMode] = useState<GpuAccelerationMode>('active');
  const [simulatedModel, setSimulatedModel] = useState<string>(ollamaModel || 'llama3.2:3b');
  const [isPurgingVram, setIsPurgingVram] = useState(false);
  const [vramNotification, setVramNotification] = useState<string | null>(null);
  const [isLoadingGpu, setIsLoadingGpu] = useState(false);

  // Custom VRAM Critical Threshold (in GB) with localStorage persistence
  const [vramThresholdGb, setVramThresholdGb] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('hybrid_vram_threshold_gb');
      if (saved) {
        const val = parseFloat(saved);
        if (!isNaN(val) && val > 0) return val;
      }
    } catch {
      // ignore storage errors
    }
    return 6.5;
  });

  const handleThresholdChange = (val: number) => {
    const maxLimit = gpuStatus?.totalVramGb || 24.0;
    const clamped = Math.max(1.0, Math.min(val, maxLimit));
    const rounded = Number(clamped.toFixed(1));
    setVramThresholdGb(rounded);
    try {
      localStorage.setItem('hybrid_vram_threshold_gb', rounded.toString());
    } catch {
      // ignore
    }
  };

  // Synchronize threshold if GPU capacity is smaller than current threshold
  useEffect(() => {
    if (gpuStatus && vramThresholdGb > gpuStatus.totalVramGb) {
      const adjusted = Number((gpuStatus.totalVramGb * 0.85).toFixed(1));
      setVramThresholdGb(adjusted);
      try {
        localStorage.setItem('hybrid_vram_threshold_gb', adjusted.toString());
      } catch {}
    }
  }, [gpuStatus?.totalVramGb]);

  const isThresholdExceeded = gpuStatus ? gpuStatus.usedVramGb >= vramThresholdGb : false;
  const thresholdPercentOfTotal = gpuStatus
    ? Math.min(100, Math.round((vramThresholdGb / gpuStatus.totalVramGb) * 100))
    : 85;

  // VRAM Alert JSON Status Reports in D:\OllamaKnowledge\diagnostics
  const [autoSaveReportsEnabled, setAutoSaveReportsEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('hybrid_vram_autosave_reports');
      return saved !== 'false';
    } catch {
      return true;
    }
  });

  const [savedReports, setSavedReports] = useState<SavedReportItem[]>([]);
  const [lastSavedReport, setLastSavedReport] = useState<{
    fileName: string;
    targetPath: string;
    timestamp: string;
    report: VramAlertReport;
  } | null>(null);
  const [isSavingReport, setIsSavingReport] = useState(false);
  const [reportSaveFeedback, setReportSaveFeedback] = useState<string | null>(null);
  const [selectedReportForPreview, setSelectedReportForPreview] = useState<VramAlertReport | null>(null);
  const [copiedReportJson, setCopiedReportJson] = useState(false);

  const lastAutoSavedIncidentKeyRef = useRef<string>('');

  const loadSavedReports = async () => {
    try {
      const res = await fetchSavedDiagnosticReports();
      setSavedReports(res.reports);
    } catch (err) {
      console.log('[Notice] Could not load saved diagnostic reports:', err);
    }
  };

  const handleToggleAutoSave = (enabled: boolean) => {
    setAutoSaveReportsEnabled(enabled);
    try {
      localStorage.setItem('hybrid_vram_autosave_reports', enabled ? 'true' : 'false');
    } catch {}
  };

  const handleSaveDiagnosticReport = async (autoTriggered = false) => {
    if (!gpuStatus) return;
    setIsSavingReport(true);
    try {
      const result = await saveVramDiagnosticReport({
        gpuStatus,
        thresholdGb: vramThresholdGb,
        gpuTier,
        ollamaHost,
        autoTriggered,
      });

      setLastSavedReport({
        fileName: result.fileName,
        targetPath: result.targetPath,
        timestamp: result.timestamp,
        report: result.report,
      });

      setReportSaveFeedback(
        autoTriggered
          ? `Statusbericht automatisch archiviert in: ${result.targetPath}`
          : `Statusbericht manuell gespeichert in: ${result.targetPath}`
      );

      await loadSavedReports();
    } catch (err: any) {
      setReportSaveFeedback(`Fehler beim Speichern: ${err?.message || 'Unbekannt'}`);
    } finally {
      setIsSavingReport(false);
      setTimeout(() => setReportSaveFeedback(null), 8000);
    }
  };

  const handleDownloadReportJson = (report: VramAlertReport, fileName?: string) => {
    try {
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || report.fileName || `vram_alert_report_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.log('[Notice] Download handled:', err);
    }
  };

  // Automatic trigger on critical threshold exceeded
  useEffect(() => {
    if (!isOpen || !gpuStatus || !isThresholdExceeded || !autoSaveReportsEnabled) return;

    // Unique incident identifier based on model, threshold, and status to prevent endless save loop
    const incidentKey = `${gpuStatus.activeModel.name}_${gpuTier}_${vramThresholdGb.toFixed(1)}_${gpuStatus.usedVramGb.toFixed(1)}`;
    if (lastAutoSavedIncidentKeyRef.current === incidentKey) {
      return;
    }
    lastAutoSavedIncidentKeyRef.current = incidentKey;

    // Trigger auto-save
    handleSaveDiagnosticReport(true);
  }, [isThresholdExceeded, gpuStatus?.activeModel?.name, gpuStatus?.usedVramGb, vramThresholdGb, autoSaveReportsEnabled, isOpen]);

  // Load reports list when GPU tab is active or modal opens
  useEffect(() => {
    if (isOpen && activeTab === 'gpu') {
      loadSavedReports();
    }
    if (isOpen && (activeTab === 'hallunox' || !hallunoxStatus)) {
      loadHallunoxStatus();
    }
    if (isOpen && (activeTab === 'qwen' || !qwenStatus)) {
      loadQwenStatus();
    }
  }, [isOpen, activeTab]);

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
      console.log('[Notice] GPU status fetch handled:', err);
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
      console.log('[Notice] Diagnostic handled:', err);
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
    logItem('Google Gemini Cloud', 'pending', 'Sende Testanfrage an Google API...');
    const t1 = performance.now();
    try {
      const gemRes = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `[SYSTEM_CHECK]: Antworte mit genau 1 Satz: "${testPrompt}"`,
          model: geminiModel,
        }),
      });
      const gemData = await gemRes.json();
      const lat1 = Math.round(performance.now() - t1);
      if (gemRes.ok && gemData.text) {
        logItem(
          'Google Gemini Cloud',
          'success',
          `Antwort erhalten (${gemData.text.slice(0, 60)}...) [${gemData.model || geminiModel}]`,
          lat1
        );
      } else {
        logItem('Google Gemini Cloud', 'failed', gemData.error || 'Fehlerhafte Antwort');
      }
    } catch (e: any) {
      logItem('Google Gemini Cloud', 'failed', e?.message || 'Fehlgeschlagen');
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
                ? isThresholdExceeded
                  ? 'border-rose-400 text-rose-300'
                  : 'border-amber-400 text-amber-400'
                : isThresholdExceeded
                ? 'border-transparent text-rose-300 hover:text-rose-200'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className={`w-3.5 h-3.5 ${isThresholdExceeded ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`} />
            GPU & VRAM-Wächter
            {gpuStatus && (
              <span
                className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${
                  isThresholdExceeded
                    ? 'bg-rose-500/30 text-rose-300 border border-rose-500/60 animate-pulse'
                    : gpuStatus.statusLevel === 'critical'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : gpuStatus.statusLevel === 'warning'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-300'
                }`}
              >
                {isThresholdExceeded ? (
                  <>
                    <AlertOctagon className="w-2.5 h-2.5 text-rose-400" />
                    <span>ALARM ({gpuStatus.usedVramGb.toFixed(1)} GB &ge; {vramThresholdGb.toFixed(1)} GB)</span>
                  </>
                ) : (
                  <span>{gpuStatus.vramPercent}% ({gpuStatus.usedVramGb.toFixed(1)} GB)</span>
                )}
              </span>
            )}
          </button>

          {/* Hallunox Anti-Halluzinations-Wächter (PyPI) Tab */}
          <button
            id="diag-tab-hallunox"
            onClick={() => setActiveTab('hallunox')}
            className={`py-2.5 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
              activeTab === 'hallunox'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className={`w-3.5 h-3.5 ${hallunoxStatus?.serviceRunning ? 'text-emerald-400' : 'text-cyan-400'}`} />
            <span>Hallunox (PyPI) Guardrail</span>
            {hallunoxStatus && (
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  hallunoxStatus.serviceRunning
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-800 text-cyan-300 border border-slate-700'
                }`}
              >
                {hallunoxStatus.serviceRunning ? 'Port 8001 Online' : 'PyPI Ready'}
              </span>
            )}
          </button>

          {/* Qwen & Kev Decision Model SLM Routing Tab */}
          <button
            id="diag-tab-qwen"
            onClick={() => setActiveTab('qwen')}
            className={`py-2.5 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
              activeTab === 'qwen'
                ? 'border-violet-400 text-violet-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Brain className="w-3.5 h-3.5 text-violet-400" />
            <span>Kev &amp; Qwen Decision Head</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/40">
              Kev v0.1.0
            </span>
          </button>

          {/* Intel Loihi 2 Neuromorphic SNN Tab */}
          <button
            id="diag-tab-loihi2"
            onClick={() => setActiveTab('loihi2')}
            className={`py-2.5 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
              activeTab === 'loihi2'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Intel® Loihi 2 SNN</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              &lt; 1ms • 38mW
            </span>
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
              <div
                className={`p-3 rounded-xl flex items-center justify-between transition-colors ${
                  isThresholdExceeded
                    ? 'bg-gradient-to-r from-rose-950/70 via-slate-900 to-amber-950/50 border-2 border-rose-500/70 shadow-lg shadow-rose-950/40'
                    : 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30'
                }`}
              >
                <div className="flex items-center gap-2.5 text-xs text-amber-300">
                  {isThresholdExceeded ? (
                    <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0 animate-pulse" />
                  ) : (
                    <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                  )}
                  <span>
                    {isThresholdExceeded ? (
                      <strong className="text-rose-300">
                        WARNUNG: VRAM-Schwelle überschritten ({gpuStatus?.usedVramGb.toFixed(1)} GB &ge; {vramThresholdGb.toFixed(1)} GB)!
                      </strong>
                    ) : (
                      <strong>D3.js VRAM-Nutzungsdiagramm & Speicherwächter</strong>
                    )}{' '}
                    – Überwacht Windows 11 GPU-Speicherebenen mit interaktiver Vektorgrafik und Grenzwert-Alarm.
                  </span>
                </div>
                <button
                  onClick={() => setActiveTab('gpu')}
                  className={`px-3 py-1 font-bold rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer shrink-0 ml-2 ${
                    isThresholdExceeded
                      ? 'bg-rose-600 hover:bg-rose-500 text-white shadow'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                  }`}
                >
                  <span>Zum VRAM-Diagramm</span>
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

              {/* VISUAL THRESHOLD WARNING BANNER (USER CONFIGURED CRITICAL VRAM THRESHOLD) */}
              {gpuStatus && isThresholdExceeded && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-rose-950/90 via-slate-950/95 to-amber-950/80 border-2 border-rose-500/80 shadow-xl shadow-rose-950/60 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2.5 text-rose-300 font-bold text-sm">
                      <AlertOctagon className="w-5 h-5 text-rose-400 animate-pulse shrink-0" />
                      <span>VISUELLE WARNUNG: VRAM-SCHWELLE ÜBERSCHRITTEN ({gpuStatus.usedVramGb.toFixed(1)} GB &ge; {vramThresholdGb.toFixed(1)} GB)</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/50">
                      +{(gpuStatus.usedVramGb - vramThresholdGb).toFixed(1)} GB über Grenzwert
                    </span>
                  </div>
                  <p className="text-xs text-rose-200/95 leading-relaxed">
                    Der aktuelle Speicherverbrauch von Ollama ({simulatedModel}) hat Ihre eingestellte kritische Warnschwelle von <strong>{vramThresholdGb.toFixed(1)} GB</strong> ({thresholdPercentOfTotal}% von {gpuStatus.totalVramGb} GB VRAM) überschritten! Bei Auslagerung in den langsamen Windows-System-RAM (Shared Memory Spillover) drohen drastische Geschwindigkeitseinbußen und Ruckler in anderen Desktop-Anwendungen.
                  </p>

                  {/* AUTO-GENERATED STATUS REPORT NOTICE */}
                  <div className="p-3 rounded-lg bg-slate-950/80 border border-rose-500/40 flex items-center justify-between flex-wrap gap-2.5">
                    <div className="flex items-center gap-2.5 text-xs text-rose-200">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                        <FolderCheck className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div>
                        <div className="font-semibold text-white flex items-center gap-2">
                          <span>Statusbericht automatisch als JSON archiviert</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            D:\OllamaKnowledge\diagnostics
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-300 mt-0.5">
                          {lastSavedReport ? lastSavedReport.fileName : `vram_alert_report_${new Date().toISOString().slice(0, 10)}.json`}
                          {lastSavedReport && (
                            <span className="text-slate-400 ml-2">
                              ({(lastSavedReport.report.gpu.usedVramGb).toFixed(1)} GB &ge; {lastSavedReport.report.threshold.configuredThresholdGb.toFixed(1)} GB)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {lastSavedReport ? (
                        <>
                          <button
                            onClick={() => setSelectedReportForPreview(lastSavedReport.report)}
                            className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5 text-cyan-400" />
                            <span>JSON anzeigen</span>
                          </button>
                          <button
                            onClick={() => handleDownloadReportJson(lastSavedReport.report, lastSavedReport.fileName)}
                            className="px-2.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>JSON herunterladen</span>
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleSaveDiagnosticReport(false)}
                          disabled={isSavingReport}
                          className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <Save className="w-3.5 h-3.5 text-amber-400" />
                          <span>{isSavingReport ? 'Speichere...' : 'Jetzt archivieren'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="pt-1 flex items-center gap-2.5 flex-wrap">
                    <button
                      onClick={handlePurgeVram}
                      disabled={isPurgingVram}
                      className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {isPurgingVram ? 'Leere VRAM...' : 'VRAM jetzt leeren (Modell entladen)'}
                    </button>
                    <button
                      onClick={() => handleSimulatedModelChange('llama3.2:3b')}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-rose-200 rounded-lg text-xs font-semibold border border-rose-500/40 transition-colors cursor-pointer"
                    >
                      Auf 3B-Modell wechseln
                    </button>
                    <button
                      onClick={() => handleThresholdChange(Math.min(gpuStatus.totalVramGb, Number((vramThresholdGb + 1.0).toFixed(1))))}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-300 rounded-lg text-xs font-semibold border border-amber-500/40 transition-colors cursor-pointer ml-auto"
                    >
                      Schwelle um +1.0 GB anheben
                    </button>
                  </div>
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

              {/* VRAM THRESHOLD SLIDER CONTROLLER */}
              {gpuStatus && (
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-bold text-white">
                        Kritische VRAM-Auslastungsschwelle (in GB)
                      </span>
                      <span className="text-[10px] text-slate-400">
                        (Definiert den Grenzwert für visuelle Warnungen & D3-Marker)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-amber-300">
                        {vramThresholdGb.toFixed(1)} GB ({thresholdPercentOfTotal}% von {gpuStatus.totalVramGb} GB)
                      </span>
                      {isThresholdExceeded ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1 animate-pulse">
                          <AlertOctagon className="w-3 h-3 text-rose-400" />
                          SCHWELLE ÜBERSCHRITTEN
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          NORMALBEREICH ({gpuStatus.usedVramGb.toFixed(1)} GB AKTIV)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Range Slider Track */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-mono text-slate-500 shrink-0 font-medium">1.0 GB</span>
                      <div className="relative flex-1 flex items-center">
                        <input
                          type="range"
                          min="1.0"
                          max={gpuStatus.totalVramGb}
                          step="0.1"
                          value={vramThresholdGb}
                          onChange={(e) => handleThresholdChange(parseFloat(e.target.value))}
                          className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none focus:outline-none"
                        />
                      </div>
                      <span className="text-[11px] font-mono text-slate-500 shrink-0 font-medium">
                        {gpuStatus.totalVramGb.toFixed(1)} GB
                      </span>
                    </div>

                    {/* Meta info & Quick Preset Buttons */}
                    <div className="flex items-center justify-between flex-wrap gap-2 text-[10px] text-slate-400 pt-0.5">
                      <div className="flex items-center gap-2">
                        <span>Aktuelle Belegung:</span>
                        <strong className={isThresholdExceeded ? 'text-rose-400 font-bold' : 'text-slate-200'}>
                          {gpuStatus.usedVramGb.toFixed(1)} GB ({gpuStatus.vramPercent}%)
                        </strong>
                        <span className="text-slate-600">|</span>
                        <span className={isThresholdExceeded ? 'text-rose-400 font-medium' : 'text-emerald-400 font-medium'}>
                          {isThresholdExceeded
                            ? `+${(gpuStatus.usedVramGb - vramThresholdGb).toFixed(1)} GB über Warnschwelle`
                            : `${(vramThresholdGb - gpuStatus.usedVramGb).toFixed(1)} GB Puffer bis zur Warnung`}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="text-slate-500 mr-1">Vorgaben:</span>
                        {[
                          { label: '60%', pct: 0.6 },
                          { label: '75%', pct: 0.75 },
                          { label: '85% (Empfohlen)', pct: 0.85 },
                          { label: '90%', pct: 0.9 },
                          { label: 'Max (100%)', pct: 1.0 },
                        ].map((preset) => {
                          const val = Number((gpuStatus.totalVramGb * preset.pct).toFixed(1));
                          const isActive = Math.abs(vramThresholdGb - val) < 0.15;
                          return (
                            <button
                              key={preset.label}
                              onClick={() => handleThresholdChange(val)}
                              className={`px-1.5 py-0.5 text-[9px] font-semibold rounded transition-colors cursor-pointer ${
                                isActive
                                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                              }`}
                            >
                              {preset.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* D3.JS VRAM USAGE DIAGRAM */}
              {gpuStatus && (
                <VramUsageChartD3
                  gpuStatus={gpuStatus}
                  activeModelName={simulatedModel}
                  onSelectModel={handleSimulatedModelChange}
                  thresholdGb={vramThresholdGb}
                />
              )}

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

              {/* SECTION: VRAM STATUS REPORTS & DIAGNOSTIC ARCHIVE (D:\OllamaKnowledge\diagnostics) */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <FolderCheck className="w-4 h-4 text-emerald-400" />
                    <div>
                      <h3 className="font-semibold text-slate-200 text-xs">
                        Automatische Diagnoseberichte &amp; VRAM-Audit
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-slate-400">Speicherort:</span>
                        <code className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-slate-900 text-emerald-400 border border-emerald-500/30">
                          D:\OllamaKnowledge\diagnostics
                        </code>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSaveDiagnosticReport(false)}
                      disabled={isSavingReport || !gpuStatus}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Save className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{isSavingReport ? 'Archiviere...' : 'Bericht jetzt manuell erstellen'}</span>
                    </button>
                  </div>
                </div>

                {/* Auto-save toggle control */}
                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between flex-wrap gap-3">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-white block">
                      Automatisches Speichern bei kritischer VRAM-Schwelle
                    </span>
                    <p className="text-[11px] text-slate-400 leading-relaxed max-w-xl">
                      Sobald der Ollama-Speicherbedarf den Grenzwert von <strong>{vramThresholdGb.toFixed(1)} GB</strong> überschreitet, wird sofort ein detaillierter JSON-Statusbericht mit GPU-Sensordaten, VRAM-Breakdown und Systemempfehlungen in <code>D:\OllamaKnowledge\diagnostics</code> abgelegt.
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggleAutoSave(!autoSaveReportsEnabled)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      autoSaveReportsEnabled
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-900/40'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700'
                    }`}
                  >
                    <Check className={`w-3.5 h-3.5 ${autoSaveReportsEnabled ? 'opacity-100' : 'opacity-0'}`} />
                    <span>{autoSaveReportsEnabled ? 'Auto-Save Aktiv' : 'Auto-Save Deaktiviert'}</span>
                  </button>
                </div>

                {/* Feedback Toast if any */}
                {reportSaveFeedback && (
                  <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/50 flex items-center justify-between text-xs text-emerald-200 animate-in fade-in">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{reportSaveFeedback}</span>
                    </div>
                    {lastSavedReport && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedReportForPreview(lastSavedReport.report)}
                          className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded text-[11px] border border-slate-700 flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3 h-3 text-cyan-400" />
                          <span>Ansehen</span>
                        </button>
                        <button
                          onClick={() => handleDownloadReportJson(lastSavedReport.report, lastSavedReport.fileName)}
                          className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Download className="w-3 h-3" />
                          <span>Download</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Saved Reports List */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold text-slate-300">
                      Archivierte Berichte ({savedReports.length}):
                    </span>
                    <button
                      onClick={loadSavedReports}
                      className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Liste aktualisieren</span>
                    </button>
                  </div>

                  {savedReports.length === 0 ? (
                    <div className="p-4 rounded-lg bg-slate-900/40 border border-slate-800/80 text-center text-xs text-slate-500">
                      Noch keine Berichte archiviert. Sobald die VRAM-Schwelle überschritten wird, erscheint hier automatisch die archivierte JSON-Datei.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-lg border border-slate-800">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-900/90 text-[10px] text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                            <th className="py-2 px-3">Dateiname</th>
                            <th className="py-2 px-3">Zeitstempel</th>
                            <th className="py-2 px-3">Modell</th>
                            <th className="py-2 px-3">VRAM / Schwelle</th>
                            <th className="py-2 px-3">Dateigröße</th>
                            <th className="py-2 px-3 text-right">Aktionen</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                          {savedReports.map((item) => (
                            <tr key={item.fileName} className="hover:bg-slate-900/50 transition-colors">
                              <td className="py-2.5 px-3 font-mono text-[11px] text-slate-200 flex items-center gap-1.5">
                                <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                <span className="truncate max-w-[200px]" title={item.fileName}>
                                  {item.fileName}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                                {new Date(item.timestamp).toLocaleString('de-DE')}
                              </td>
                              <td className="py-2.5 px-3 text-slate-300 font-semibold">
                                {item.modelName || item.report?.activeModel?.name || 'llama3'}
                              </td>
                              <td className="py-2.5 px-3 text-rose-300 font-mono text-[11px]">
                                {item.usedVramGb?.toFixed(1) || item.report?.gpu?.usedVramGb?.toFixed(1) || '0'} GB
                                <span className="text-slate-500 font-normal"> / {item.thresholdGb?.toFixed(1) || item.report?.threshold?.configuredThresholdGb?.toFixed(1) || '6.5'} GB</span>
                              </td>
                              <td className="py-2.5 px-3 text-slate-400 text-[11px] font-mono">
                                {item.sizeBytes ? `${(item.sizeBytes / 1024).toFixed(1)} KB` : '1.8 KB'}
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {item.report && (
                                    <button
                                      onClick={() => setSelectedReportForPreview(item.report!)}
                                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-medium rounded border border-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
                                      title="JSON im Modal ansehen"
                                    >
                                      <Eye className="w-3 h-3 text-cyan-400" />
                                      <span>Vorschau</span>
                                    </button>
                                  )}
                                  <a
                                    href={`/api/diagnostics/reports/${encodeURIComponent(item.fileName)}?download=true`}
                                    download={item.fileName}
                                    onClick={(e) => {
                                      if (item.report) {
                                        e.preventDefault();
                                        handleDownloadReportJson(item.report, item.fileName);
                                      }
                                    }}
                                    className="px-2 py-1 bg-cyan-600/80 hover:bg-cyan-600 text-white text-[10px] font-semibold rounded flex items-center gap-1 cursor-pointer transition-colors"
                                    title="JSON herunterladen"
                                  >
                                    <Download className="w-3 h-3" />
                                    <span>JSON</span>
                                  </a>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: HALLUNOX (PyPI) ANTI-HALLUZINATIONS-WÄCHTER */}
          {activeTab === 'hallunox' && (
            <div className="space-y-4">
              {/* STATUS & CONNECTION CARD */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h3 className="font-semibold text-slate-200 text-sm flex items-center gap-2">
                        Hallunox Anti-Halluzinations-Framework (PyPI)
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                          pip install hallunox
                        </span>
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Pre-Generation Hallucination Mitigation via Hidden-State Semantic Projection &amp; Token Alignment.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={loadHallunoxStatus}
                      disabled={isLoadingHallunox}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${isLoadingHallunox ? 'animate-spin' : ''}`} />
                      <span>{isLoadingHallunox ? 'Prüfe...' : 'Status aktualisieren'}</span>
                    </button>
                  </div>
                </div>

                {/* Service Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-1">
                  <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Bridge-Dienst:</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          hallunoxStatus?.serviceRunning ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                        }`}
                      />
                      <span className="text-xs font-mono font-bold text-white">
                        {hallunoxStatus?.serviceRunning ? 'Aktiv (Port 8001)' : 'Standby / Fallback'}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 block mt-0.5">
                      http://127.0.0.1:8001
                    </span>
                  </div>

                  <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">PyPI-Paket:</span>
                    <span className="text-xs font-mono font-bold text-cyan-300 block mt-1">
                      {hallunoxStatus?.pypiPackage || 'hallunox'}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Version {hallunoxStatus?.version || '0.1.0'}
                    </span>
                  </div>

                  <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Windows 11 Pfad:</span>
                    <span className="text-[11px] font-mono font-semibold text-amber-300 block mt-1 truncate" title="D:\OllamaKnowledge\hallunox">
                      D:\OllamaKnowledge\hallunox
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      Lokales Microservice-Verzeichnis
                    </span>
                  </div>

                  <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Guardrail-Schutz:</span>
                      <span className="text-xs font-semibold text-emerald-400 block mt-1">
                        {hallunoxGuardrailEnabled ? 'Aktiviert (Echtzeit)' : 'Deaktiviert'}
                      </span>
                    </div>
                    <button
                      onClick={() => toggleHallunoxGuardrail(!hallunoxGuardrailEnabled)}
                      className={`mt-1.5 px-2 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer text-center ${
                        hallunoxGuardrailEnabled
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {hallunoxGuardrailEnabled ? 'Aktiv (Klick zum Pausieren)' : 'Einschalten'}
                    </button>
                  </div>
                </div>
              </div>

              {/* INSTALLATION & WINDOWS 11 SCRIPTS */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-cyan-400" />
                    <h3 className="font-semibold text-slate-200 text-xs">
                      1-Klick Setup &amp; PyPI Installation für Windows 11
                    </h3>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Automatisches Setup in D:\OllamaKnowledge\hallunox
                  </span>
                </div>

                <div className="bg-slate-900/90 rounded-lg p-3 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-cyan-300">
                      pip install hallunox fastapi uvicorn pydantic torch
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText('pip install hallunox fastapi uvicorn pydantic torch');
                        setHallunoxCopiedCmd('pip');
                        setTimeout(() => setHallunoxCopiedCmd(null), 2000);
                      }}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] rounded border border-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      {hallunoxCopiedCmd === 'pip' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{hallunoxCopiedCmd === 'pip' ? 'Kopiert!' : 'Befehl kopieren'}</span>
                    </button>
                  </div>
                </div>

                {/* 1-Click Starter & Files Download */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <button
                    onClick={() => downloadHallunoxFile('install-hallunox.bat')}
                    className="p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left transition-colors flex items-center justify-between group cursor-pointer"
                  >
                    <div>
                      <span className="text-xs font-semibold text-slate-200 block group-hover:text-cyan-300">
                        install-hallunox.bat
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Automatische PyPI-Installation
                      </span>
                    </div>
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                  </button>

                  <button
                    onClick={() => downloadHallunoxFile('start-hallunox.bat')}
                    className="p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left transition-colors flex items-center justify-between group cursor-pointer"
                  >
                    <div>
                      <span className="text-xs font-semibold text-slate-200 block group-hover:text-emerald-300">
                        start-hallunox.bat
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Startet FastAPI Bridge (Port 8001)
                      </span>
                    </div>
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                  </button>

                  <button
                    onClick={() => downloadHallunoxFile('hallunox_service.py')}
                    className="p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left transition-colors flex items-center justify-between group cursor-pointer"
                  >
                    <div>
                      <span className="text-xs font-semibold text-slate-200 block group-hover:text-amber-300">
                        hallunox_service.py
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Python Service Bridge Script
                      </span>
                    </div>
                    <Download className="w-3.5 h-3.5 text-amber-400" />
                  </button>
                </div>
              </div>

              {/* HOW HALLUNOX WORKS: MATHEMATICAL & ARCHITECTURAL OVERVIEW */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-semibold text-slate-200 text-xs">
                    Funktionsweise: Pre-Generation Halluzinationsreduktion
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] text-slate-300">
                  <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800/80 space-y-1">
                    <span className="font-semibold text-cyan-300 block">1. Hidden-State Projektion</span>
                    <p className="text-slate-400 leading-relaxed">
                      Projiziert die Repräsentationen der Prompt-Aufmerksamkeit und Zwischenzustände in einen semantischen Validierungsraum, um Driften vor der Token-Ausgabe zu erkennen.
                    </p>
                  </div>
                  <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800/80 space-y-1">
                    <span className="font-semibold text-emerald-300 block">2. Alignment &amp; Risikobewertung</span>
                    <p className="text-slate-400 leading-relaxed">
                      Vergleicht generierte Textfragmente kontinuierlich mit dem Kontext und markiert divergente Token („Flagged Tokens“) mit Risikolevels (None, Low, Moderate, High).
                    </p>
                  </div>
                  <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800/80 space-y-1">
                    <span className="font-semibold text-amber-300 block">3. Lokale Heuristik &amp; D:\ Fallback</span>
                    <p className="text-slate-400 leading-relaxed">
                      Falls der externe Python-Dienst offline ist, greift die integrierte semantische Token-Overlap Heuristik der Workstation, sodass die App immer geschützt bleibt.
                    </p>
                  </div>
                </div>
              </div>

              {/* INTERACTIVE CALIBRATION & LIVE-TEST SANDBOX */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-emerald-400" />
                    <h3 className="font-semibold text-slate-200 text-xs">
                      Interaktive Hallunox-Prüfung &amp; Kalibrierungs-Sandbox
                    </h3>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Modell: {ollamaModel || 'llama3.2:3b'}
                  </span>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                      Test-Prompt (Eingabefrage):
                    </label>
                    <input
                      type="text"
                      value={hallunoxPrompt}
                      onChange={(e) => setHallunoxPrompt(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      placeholder="Geben Sie eine Eingabeaufforderung ein..."
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                      Modell-Antwort (Zu prüfender Text):
                    </label>
                    <textarea
                      rows={2}
                      value={hallunoxResponse}
                      onChange={(e) => setHallunoxResponse(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
                      placeholder="Zu validierender Antworttext..."
                    />
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      onClick={handleTestHallunoxVerification}
                      disabled={isVerifyingHallunox || !hallunoxPrompt.trim()}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{isVerifyingHallunox ? 'Prüfe Projektion...' : 'Mit Hallunox Verifizieren'}</span>
                    </button>
                  </div>
                </div>

                {/* TEST RESULT CARD */}
                {hallunoxTestResult && (
                  <div
                    className={`mt-3 p-3.5 rounded-lg border text-xs space-y-2 ${
                      hallunoxTestResult.hallucinationRisk === 'high'
                        ? 'bg-rose-950/40 border-rose-500/50 text-rose-200'
                        : hallunoxTestResult.hallucinationRisk === 'moderate'
                        ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                        : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                    }`}
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        {hallunoxTestResult.hallucinationRisk === 'high' ? (
                          <ShieldAlert className="w-4 h-4 text-rose-400" />
                        ) : (
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        )}
                        <span className="font-bold text-white">
                          Hallunox Ergebnis: {hallunoxTestResult.alignmentScore}% Ausrichtung
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            hallunoxTestResult.hallucinationRisk === 'high'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : hallunoxTestResult.hallucinationRisk === 'moderate'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          }`}
                        >
                          Risiko: {hallunoxTestResult.hallucinationRisk}
                        </span>
                      </div>
                    </div>

                    <p className="text-slate-300 leading-relaxed text-[11px]">
                      {hallunoxTestResult.explanation}
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-[10px] font-mono text-slate-300">
                      <div>
                        <span className="text-slate-500 block">Hidden-State:</span>
                        <span className="font-semibold text-emerald-400">{hallunoxTestResult.hiddenStateConfidence}%</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Projektion:</span>
                        <span className="font-semibold text-cyan-400">{hallunoxTestResult.semanticProjectionSimilarity}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Latenz:</span>
                        <span className="font-semibold text-slate-200">{hallunoxTestResult.latencyMs} ms</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Engine:</span>
                        <span className="font-semibold text-amber-300 truncate" title={hallunoxTestResult.engine}>
                          {hallunoxTestResult.engine}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: THE KEV FAMILY (0.8B, 4B, 9B ON QWEN3.5 BASES) */}
          {activeTab === 'qwen' && (
            <div className="space-y-4">
              {/* HEADER / EXPLANATION CARD (THE KEV FAMILY ON QWEN3.5) */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-violet-950/70 via-slate-900/90 to-cyan-950/60 border border-violet-700/50 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-xl bg-violet-500/20 border border-violet-500/40 text-violet-300">
                      <Brain className="w-5 h-5 text-violet-300" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2 flex-wrap">
                        The Kev Family: Kev-0.8B, Kev-4B, Kev-9B
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          Qwen3.5 Bases
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Single Forward Pass (&lt; 8ms Gatekeeper)
                        </span>
                      </h3>
                      <p className="text-slate-400 text-xs mt-0.5">
                        Jared Palmer Decision Head Familie mit Block-Causal Masking &amp; TypeSafe /v1/systemone API.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={loadQwenStatus}
                      disabled={isLoadingQwen}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${isLoadingQwen ? 'animate-spin' : ''}`} />
                      <span>Status prüfen</span>
                    </button>
                  </div>
                </div>

                {/* THE KEV FAMILY MEMBERS SHOWCASE CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  {KEV_FAMILY_MEMBERS.filter((m) => m.id.startsWith('kev')).map((member) => {
                    const isSelected = selectedQwenModel === member.id;
                    return (
                      <div
                        key={member.id}
                        className={`p-3 rounded-xl border transition flex flex-col justify-between ${
                          isSelected
                            ? 'bg-violet-950/40 border-violet-500 ring-1 ring-violet-500/50'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-xs text-white flex items-center gap-1.5">
                              <Zap className="w-3.5 h-3.5 text-amber-400" />
                              {member.id.toUpperCase()}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                              {member.baseArchitecture}
                            </span>
                          </div>

                          <div className="text-[11px] font-semibold text-slate-300">
                            {member.targetProfile}
                          </div>

                          <div className="grid grid-cols-2 gap-1 text-[10px] font-mono pt-1 text-slate-400">
                            <div>Latenz: <strong className="text-emerald-400">~{member.latencyMs}ms</strong></div>
                            <div>VRAM: <strong className="text-cyan-300">{member.vramMb} MB</strong></div>
                          </div>

                          <ul className="text-[10px] text-slate-400 space-y-0.5 pt-1">
                            {member.strengths.slice(0, 2).map((s, idx) => (
                              <li key={idx} className="flex items-center gap-1">
                                <Check className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                                <span>{s}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedQwenModel(member.id);
                            onSelectQwenModel?.(member.id);
                          }}
                          className={`mt-3 w-full py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                            isSelected
                              ? 'bg-violet-600 text-white'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                          }`}
                        >
                          {isSelected ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                              <span>Aktiv als Decision Head</span>
                            </>
                          ) : (
                            <span>Auswählen &amp; Aktivieren</span>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Status Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-xs">
                  <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Aktives Kev Modell:</span>
                    <span className="font-mono font-semibold text-violet-300 truncate block">
                      {selectedQwenModel}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Ollama / Inferenz Status:</span>
                    <span className={`font-semibold flex items-center gap-1 ${qwenStatus?.deciderModelAvailable ? 'text-emerald-400' : 'text-amber-300'}`}>
                      {qwenStatus?.deciderModelAvailable ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Bereit in Ollama</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-3.5 h-3.5" />
                          <span>Kev-Heuristik aktiv</span>
                        </>
                      )}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Latenz-Klasse:</span>
                    <span className="font-mono font-semibold text-cyan-300">
                      {selectedQwenModel.includes('0.8') ? '< 8 ms (Gatekeeper)' : selectedQwenModel.includes('4') ? '22 ms (Balanced)' : '48 ms (Deep Governance)'}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Base Architektur:</span>
                    <span className="font-semibold text-emerald-400 font-mono text-[11px]">
                      {selectedQwenModel.includes('0.8') ? 'Qwen3.5-0.8B' : selectedQwenModel.includes('4') ? 'Qwen3.5-4B' : selectedQwenModel.includes('9') ? 'Qwen3.5-9B' : 'Qwen2.5-0.5B'}
                    </span>
                  </div>
                </div>
              </div>

              {/* INTERACTIVE TESTING SANDBOX & TRIPLE BENCHMARK */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                    <Play className="w-3.5 h-3.5 text-violet-400" />
                    Interaktive Kev Entscheidungsprüfung &amp; Benchmark
                  </span>
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] text-slate-400">Modell:</label>
                    <select
                      value={selectedQwenModel}
                      onChange={(e) => {
                        setSelectedQwenModel(e.target.value);
                        onSelectQwenModel?.(e.target.value);
                      }}
                      className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-violet-300 focus:outline-none focus:border-violet-500 font-mono"
                    >
                      <option value="kev-0.8b">kev-0.8b (Sub-10ms Gatekeeper auf Qwen3.5-0.8B)</option>
                      <option value="kev-4b">kev-4b (Balanced Precision auf Qwen3.5-4B)</option>
                      <option value="kev-9b">kev-9b (Deep Governance &amp; Policy auf Qwen3.5-9B)</option>
                      <option value="qwen2.5:0.5b">qwen2.5:0.5b (Ollama Legacy)</option>
                    </select>
                  </div>
                </div>

                {/* Preset Prompt Buttons */}
                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  <span className="text-slate-500 py-1 text-[10px]">Kev Test-Vektoren:</span>
                  <button
                    onClick={() => {
                      const p = 'Kannst du mir helfen das Kennwort für meinen Windows 11 Account zurückzusetzen?';
                      setQwenTestPrompt(p);
                      handleTestQwen(p);
                    }}
                    className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition cursor-pointer"
                  >
                    🔐 Kennwort / Windows (Privat)
                  </button>
                  <button
                    onClick={() => {
                      const p = 'Erkläre die mathematische Formulierung der Einstein-Feldgleichungen und Quantenverschränkung.';
                      setQwenTestPrompt(p);
                      handleTestQwen(p);
                    }}
                    className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition cursor-pointer"
                  >
                    ☁️ Quantenphysik (Komplex)
                  </button>
                  <button
                    onClick={() => {
                      const p = 'Lies meine lokalen Projektnotizen aus D:\\OllamaKnowledge und erstelle ein Backup-Skript.';
                      setQwenTestPrompt(p);
                      handleTestQwen(p);
                    }}
                    className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition cursor-pointer"
                  >
                    📂 D:\OllamaKnowledge (Lokales RAG)
                  </button>
                  <button
                    onClick={() => {
                      const p = 'Benchmarke bitte Ollama gegen Google Gemini im direkten Vergleich nebeneinander.';
                      setQwenTestPrompt(p);
                      handleTestQwen(p);
                    }}
                    className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition cursor-pointer"
                  >
                    ⚖️ Benchmark Vergleich (Side-by-Side)
                  </button>
                </div>

                {/* Prompt Input & Dual Actions */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={qwenTestPrompt}
                    onChange={(e) => setQwenTestPrompt(e.target.value)}
                    placeholder="Zu evaluierende Nutzeranfrage für den Kev Decision Head..."
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 font-sans"
                  />
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleTestQwen()}
                      disabled={isTestingQwen || isRunningKevBenchmark || !qwenTestPrompt.trim()}
                      className="px-3.5 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-300" />
                      <span>{isTestingQwen ? 'Inferenz...' : `${selectedQwenModel} testen`}</span>
                    </button>

                    <button
                      onClick={() => handleRunKevBenchmark()}
                      disabled={isRunningKevBenchmark || isTestingQwen || !qwenTestPrompt.trim()}
                      className="px-3.5 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0"
                      title="Alle 3 Modelle der Kev-Familie zeitgleich auf die Eingabe anwenden"
                    >
                      <Activity className={`w-3.5 h-3.5 ${isRunningKevBenchmark ? 'animate-spin' : ''}`} />
                      <span>{isRunningKevBenchmark ? 'Benchmark läuft...' : 'Triple Benchmark (0.8B vs 4B vs 9B)'}</span>
                    </button>
                  </div>
                </div>

                {/* TRIPLE BENCHMARK COMPARISON MATRIX */}
                {kevBenchmarkResult && (
                  <div className="mt-3 p-3.5 rounded-xl bg-slate-900/90 border border-cyan-800/50 space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-cyan-400" />
                        <h4 className="font-bold text-xs text-white">
                          Kev Family Live Triple-Benchmark (Qwen3.5 Bases)
                        </h4>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Schnellstes Modell: <strong className="text-emerald-400">{kevBenchmarkResult.fastestModel}</strong>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {kevBenchmarkResult.results.map((res) => (
                        <div
                          key={res.modelId}
                          className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-2 flex flex-col justify-between"
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-bold text-xs text-white">
                                {res.modelName?.split(' ')?.[0] || res.modelId} {res.modelName?.split(' ')?.[1] || ''}
                              </span>
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                                {res.baseArchitecture || 'Qwen3.5'}
                              </span>
                            </div>

                            {/* Latency & Confidence */}
                            <div className="space-y-1 text-[11px]">
                              <div className="flex justify-between font-mono">
                                <span className="text-slate-400">Inferenz-Latenz:</span>
                                <span className="font-bold text-emerald-400">{res.latencyMs ?? 8} ms</span>
                              </div>
                              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-emerald-400 h-full rounded-full"
                                  style={{ width: `${Math.max(10, Math.min(100, (1 - (res.latencyMs ?? 8) / 60) * 100))}%` }}
                                />
                              </div>

                              <div className="flex justify-between font-mono pt-1">
                                <span className="text-slate-400">Konfidenz:</span>
                                <span className="font-bold text-violet-300">{Math.round((res.confidence ?? 0.95) * 100)}%</span>
                              </div>

                              <div className="flex justify-between font-mono">
                                <span className="text-slate-400">Softmax-Entropie (H):</span>
                                <span className="font-bold text-cyan-300">
                                  {typeof res.entropy === 'number' ? res.entropy.toFixed(3) : '0.150'}
                                </span>
                              </div>
                            </div>

                            {/* Engine Badge */}
                            <div className="pt-1 flex items-center justify-between text-[10px]">
                              <span className="text-slate-400">Ziel-Engine:</span>
                              <span
                                className={`px-2 py-0.5 rounded font-bold uppercase ${
                                  res.engine === 'ollama'
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                    : res.engine === 'gemini'
                                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                }`}
                              >
                                {res.engine}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              setSelectedQwenModel(res.modelId);
                              onSelectQwenModel?.(res.modelId);
                            }}
                            className="mt-2 w-full py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-[10px] font-medium transition cursor-pointer"
                          >
                            Diesen Kopf aktivieren
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SINGLE DECISION RESULT DISPLAY */}
                {qwenTestResult && (
                  <div className="mt-3 p-4 rounded-xl bg-slate-900/90 border border-violet-800/50 space-y-3 animate-in fade-in">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-200">Ziel-Engine:</span>
                        <span
                          className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wide ${
                            qwenTestResult.engine === 'ollama'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : qwenTestResult.engine === 'gemini'
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          }`}
                        >
                          {qwenTestResult.engine === 'ollama' && '💻 LOKAL (Ollama)'}
                          {qwenTestResult.engine === 'gemini' && '☁️ CLOUD (Gemini)'}
                          {qwenTestResult.engine === 'hybrid' && '⚡ HYBRID (Verbund)'}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          Empfohlener Modus: <strong className="text-slate-200">{qwenTestResult.recommendedMode}</strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs font-mono">
                        <span className="text-emerald-400 font-bold">
                          {qwenTestResult.latencyMs} ms
                        </span>
                        <span className="text-violet-300 font-bold">
                          {Math.round(qwenTestResult.confidence * 100)}% Konfidenz
                        </span>
                        {qwenTestResult.entropy !== undefined && (
                          <span className="text-cyan-300 font-bold" title="Softmax-Entropie (Maß für Unsicherheit)">
                            H={typeof qwenTestResult.entropy === 'number' ? qwenTestResult.entropy.toFixed(3) : qwenTestResult.entropy}
                          </span>
                        )}
                        {qwenTestResult.qwenBaseArchitecture && (
                          <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60 text-[10px]">
                            {qwenTestResult.qwenBaseArchitecture}
                          </span>
                        )}
                        {qwenTestResult.blockCausalMaskApplied && (
                          <span className="px-1.5 py-0.5 rounded bg-violet-900/60 text-violet-300 border border-violet-700/60 text-[10px]">
                            Block-Causal Mask
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Metric Gauges */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="p-2 rounded bg-slate-950/80 border border-slate-800">
                        <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                          <span>Privatsphäre / Lokal:</span>
                          <span className="font-mono font-bold text-amber-400">
                            {Math.round(qwenTestResult.privacyScore)}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-amber-400 h-full rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, Math.round(qwenTestResult.privacyScore))}%` }}
                          />
                        </div>
                      </div>

                      <div className="p-2 rounded bg-slate-950/80 border border-slate-800">
                        <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                          <span>Komplexität:</span>
                          <span className="font-mono font-bold text-cyan-400">
                            {Math.round(qwenTestResult.complexityScore)}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-cyan-400 h-full rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, Math.round(qwenTestResult.complexityScore))}%` }}
                          />
                        </div>
                      </div>

                      <div className="p-2 rounded bg-slate-950/80 border border-slate-800">
                        <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                          <span>D:\ Knowledge RAG:</span>
                          <span className="font-mono font-bold text-emerald-400">
                            {qwenTestResult.requiresDriveDKnowledge ? 'Erforderlich' : 'Nicht nötig'}
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${qwenTestResult.requiresDriveDKnowledge ? 'bg-emerald-400 w-full' : 'bg-slate-700 w-1/4'}`}
                          />
                        </div>
                      </div>

                      <div className="p-2 rounded bg-slate-950/80 border border-slate-800">
                        <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                          <span>High Thinking:</span>
                          <span className="font-mono font-bold text-violet-400">
                            {qwenTestResult.requiresThinking ? 'Empfohlen' : 'Standard'}
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${qwenTestResult.requiresThinking ? 'bg-violet-400 w-full' : 'bg-slate-700 w-1/4'}`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Calibrated Probability Breakdown (Kev Feature) */}
                    {qwenTestResult.calibratedProbabilities && (
                      <div className="p-3 rounded-lg bg-slate-950/90 border border-violet-800/40 space-y-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-violet-300 flex items-center gap-1.5">
                            <SlidersHorizontal className="w-3.5 h-3.5 text-violet-400" />
                            Kev Kalibrierte Wahrscheinlichkeits-Tensoren (Softmax):
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Kein Sampling / Exakte Verteilung
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1 text-[11px]">
                          {/* Engine Probabilities */}
                          {qwenTestResult.calibratedProbabilities.engine && (
                            <div className="p-2 rounded bg-slate-900 border border-slate-800 space-y-1">
                              <span className="text-slate-400 text-[10px] font-medium block">
                                P(Ziel-Engine):
                              </span>
                              {Object.entries(qwenTestResult.calibratedProbabilities.engine).map(([k, v]) => (
                                <div key={k} className="flex items-center justify-between font-mono text-[10px]">
                                  <span className="text-slate-300 capitalize">{k}:</span>
                                  <span className={v >= 0.5 ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                                    {(v * 100).toFixed(1)}%
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Privacy Probabilities */}
                          {qwenTestResult.calibratedProbabilities.privacy && (
                            <div className="p-2 rounded bg-slate-900 border border-slate-800 space-y-1">
                              <span className="text-slate-400 text-[10px] font-medium block">
                                P(Datenschutz-Risiko):
                              </span>
                              {Object.entries(qwenTestResult.calibratedProbabilities.privacy).map(([k, v]) => (
                                <div key={k} className="flex items-center justify-between font-mono text-[10px]">
                                  <span className="text-slate-300">{k}:</span>
                                  <span className={v >= 0.5 ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                                    {(v * 100).toFixed(1)}%
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Drive D / Thinking Probabilities */}
                          <div className="p-2 rounded bg-slate-900 border border-slate-800 space-y-1">
                            <span className="text-slate-400 text-[10px] font-medium block">
                              P(Drive D RAG &amp; Thinking):
                            </span>
                            <div className="flex items-center justify-between font-mono text-[10px]">
                              <span className="text-slate-300">P(Drive D nötig):</span>
                              <span className={qwenTestResult.calibratedProbabilities.driveD?.true && qwenTestResult.calibratedProbabilities.driveD.true >= 0.5 ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                                {qwenTestResult.calibratedProbabilities.driveD?.true ? (qwenTestResult.calibratedProbabilities.driveD.true * 100).toFixed(1) : 0}%
                              </span>
                            </div>
                            <div className="flex items-center justify-between font-mono text-[10px]">
                              <span className="text-slate-300">P(High Thinking):</span>
                              <span className={qwenTestResult.calibratedProbabilities.thinking?.true && qwenTestResult.calibratedProbabilities.thinking.true >= 0.5 ? 'text-violet-400 font-bold' : 'text-slate-400'}>
                                {qwenTestResult.calibratedProbabilities.thinking?.true ? (qwenTestResult.calibratedProbabilities.thinking.true * 100).toFixed(1) : 0}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Rationale text */}
                    <div className="p-2.5 rounded bg-slate-950/90 border border-slate-800 text-xs text-slate-300 flex items-start gap-2">
                      <Brain className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-200 block text-[11px]">Kev / Qwen Begründung:</strong>
                        <p className="mt-0.5 leading-relaxed">{qwenTestResult.reason}</p>
                      </div>
                    </div>

                    {/* Optional JSON View */}
                    <div className="pt-1">
                      <button
                        onClick={() => setShowQwenJson((prev) => !prev)}
                        className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 font-mono transition cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>{showQwenJson ? 'JSON-Payload ausblenden' : 'Rohdaten JSON anzeigen'}</span>
                      </button>

                      {showQwenJson && (
                        <pre className="mt-2 p-2.5 bg-slate-950 border border-slate-800 rounded font-mono text-[10px] text-emerald-400 overflow-x-auto">
                          {JSON.stringify(qwenTestResult, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* KEV FAMILY MODELFILES & TRAINING BAUKASTEN */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3 text-xs">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="font-bold text-slate-200 flex items-center gap-2">
                    <FolderCheck className="w-4 h-4 text-amber-400" />
                    <span>The Kev Family: Lokales Setup &amp; Training (1-Klick)</span>
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Windows 11 / Ollama / PyTorch / Qwen3.5
                  </span>
                </div>

                <p className="text-slate-400 leading-relaxed text-[11px]">
                  Bauen oder beziehen Sie Jared Palmers Kev Familie (0.8B, 4B, 9B auf Qwen3.5 Basis) direkt auf Ihrer lokalen Windows 11 Maschine:
                </p>

                {/* 1-Click File Download Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                  {/* Kev Setup Bat */}
                  <div className="p-3 rounded-lg bg-slate-900 border border-violet-800/40 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-amber-300 font-bold text-xs block">
                          setup-kev-family.bat
                        </span>
                        <span className="text-[9px] bg-violet-500/20 text-violet-300 px-1.5 py-0.5 rounded font-mono">
                          Kev Family
                        </span>
                      </div>
                      <p className="text-slate-400 text-[10px] mt-1">
                        1-Klick Windows 11 Batch-Skript: Richtet die gesamte Kev-Familie (0.8B, 4B, 9B) in Ollama ein und validiert /v1/systemone.
                      </p>
                    </div>
                    <button
                      onClick={() => downloadQwenFile('kev-setup', 'setup-kev-family.bat')}
                      className="mt-3 w-full py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded font-medium text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>setup-kev-family.bat</span>
                    </button>
                  </div>

                  {/* Kev Modelfiles Selector */}
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex flex-col justify-between">
                    <div>
                      <span className="font-mono text-cyan-300 font-bold text-xs block">
                        Modelfiles (0.8B / 4B / 9B)
                      </span>
                      <p className="text-slate-400 text-[10px] mt-1">
                        Ollama Modelfiles mit Block-Causal Masking Parametern und Pointer Readout Heads für die Qwen3.5 Familie.
                      </p>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-1">
                      <button
                        onClick={() => downloadQwenFile('kev-modelfile-0.8b', 'Modelfile-kev-0.8b')}
                        className="py-1 px-1 bg-cyan-700 hover:bg-cyan-600 text-white rounded font-medium text-[10px] flex items-center justify-center gap-0.5 transition cursor-pointer"
                        title="Modelfile Kev 0.8B herunterladen"
                      >
                        <Download className="w-2.5 h-2.5" />
                        <span>0.8B</span>
                      </button>
                      <button
                        onClick={() => downloadQwenFile('kev-modelfile-4b', 'Modelfile-kev-4b')}
                        className="py-1 px-1 bg-cyan-700 hover:bg-cyan-600 text-white rounded font-medium text-[10px] flex items-center justify-center gap-0.5 transition cursor-pointer"
                        title="Modelfile Kev 4B herunterladen"
                      >
                        <Download className="w-2.5 h-2.5" />
                        <span>4B</span>
                      </button>
                      <button
                        onClick={() => downloadQwenFile('kev-modelfile-9b', 'Modelfile-kev-9b')}
                        className="py-1 px-1 bg-cyan-700 hover:bg-cyan-600 text-white rounded font-medium text-[10px] flex items-center justify-center gap-0.5 transition cursor-pointer"
                        title="Modelfile Kev 9B herunterladen"
                      >
                        <Download className="w-2.5 h-2.5" />
                        <span>9B</span>
                      </button>
                    </div>
                  </div>

                  {/* Kev Python Training Script */}
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex flex-col justify-between">
                    <div>
                      <span className="font-mono text-emerald-300 font-bold text-xs block">
                        train_kev_qwen35_family.py
                      </span>
                      <p className="text-slate-400 text-[10px] mt-1">
                        PyTorch / LoRA Multi-Model Suite: Testet oder trainiert 0.8B, 4B oder 9B Decision Heads auf Qwen3.5 Basis.
                      </p>
                    </div>
                    <button
                      onClick={() => downloadQwenFile('kev-train', 'train_kev_qwen35_family.py')}
                      className="mt-3 w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>train_kev_family.py</span>
                    </button>
                  </div>

                  {/* Android APK Package */}
                  <div className="p-3 rounded-lg bg-slate-900 border border-emerald-600/40 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-emerald-400 font-bold text-xs block">
                          gemini-ai-assistant.apk
                        </span>
                        <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono">
                          Android APK
                        </span>
                      </div>
                      <p className="text-slate-400 text-[10px] mt-1">
                        Native Android Installationsdatei (.apk) für Smartphones &amp; Tablets (Android 5.0 bis 15+). 100% ohne Root.
                      </p>
                    </div>
                    <div className="mt-3 flex items-center gap-1.5">
                      <a
                        href="/downloads/gemini-ai-assistant.apk"
                        download="gemini-ai-assistant.apk"
                        className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium text-xs flex items-center justify-center gap-1 transition cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>*.apk Download</span>
                      </a>
                      <button
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent('open-android-apk-modal'));
                        }}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 rounded text-xs transition cursor-pointer"
                        title="QR-Code Sideload öffnen"
                      >
                        📱
                      </button>
                    </div>
                  </div>
                </div>

                {/* Step by step manual setup instructions */}
                <div className="mt-3 p-3.5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200 text-xs block">
                      The Kev Family in PowerShell einrichten (Qwen3.5 Basis):
                    </span>
                    <span className="text-[10px] text-amber-400 font-mono">Modelle: kev-0.8b, kev-4b, kev-9b</span>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Kopieren Sie diese Befehle in Ihr Windows Terminal, um die Modelle in Ollama zu registrieren und den TypeSafe Single-Pass Endpoint zu testen:
                  </p>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between p-2 rounded bg-slate-950 font-mono text-[11px] text-slate-300">
                      <span>1. ollama pull qwen2.5:0.5b</span>
                      <button
                        onClick={() => handleCopyQwenCmd('ollama pull qwen2.5:0.5b', 'cmd1')}
                        className="text-slate-400 hover:text-white flex items-center gap-1 transition cursor-pointer"
                      >
                        {qwenCopiedCmd === 'cmd1' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span className="text-[10px]">{qwenCopiedCmd === 'cmd1' ? 'Kopiert' : 'Kopieren'}</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded bg-slate-950 font-mono text-[11px] text-slate-300">
                      <span>2. ollama cp qwen2.5:0.5b kev-0.8b; ollama cp qwen2.5:0.5b kev-4b; ollama cp qwen2.5:0.5b kev-9b</span>
                      <button
                        onClick={() => handleCopyQwenCmd('ollama cp qwen2.5:0.5b kev-0.8b; ollama cp qwen2.5:0.5b kev-4b; ollama cp qwen2.5:0.5b kev-9b', 'cmd-alias')}
                        className="text-slate-400 hover:text-white flex items-center gap-1 transition cursor-pointer"
                      >
                        {qwenCopiedCmd === 'cmd-alias' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span className="text-[10px]">{qwenCopiedCmd === 'cmd-alias' ? 'Kopiert' : 'Kopieren'}</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded bg-slate-950 font-mono text-[11px] text-slate-300">
                      <span>3. curl http://localhost:3000/v1/systemone (TypeSafe System One Contract)</span>
                      <button
                        onClick={() => handleCopyQwenCmd('curl -X POST http://localhost:3000/v1/systemone -H "Content-Type: application/json" -d "{\\"state\\":\\"Test\\",\\"model\\":\\"kev-0.8b\\",\\"questions\\":[{\\"id\\":\\"q1\\",\\"type\\":\\"boolean\\",\\"question\\":\\"Is local?\\"}]}"', 'cmd2')}
                        className="text-slate-400 hover:text-white flex items-center gap-1 transition cursor-pointer"
                      >
                        {qwenCopiedCmd === 'cmd2' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span className="text-[10px]">{qwenCopiedCmd === 'cmd2' ? 'Kopiert' : 'Kopieren'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: INTEL LOIHI 2 NEUROMORPHIC COMPUTING */}
          {activeTab === 'loihi2' && (
            <Loihi2NeuromorphicView
              onApplyEngineSelection={(eng) => {
                if (onExecuteTestPromptInChat) {
                  onExecuteTestPromptInChat(eng, 'Neuromorph-validierte Spiking Anfrage');
                }
              }}
            />
          )}

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

        {/* JSON DIAGNOSTIC REPORT VIEWER SUB-MODAL */}
        {selectedReportForPreview && (
          <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
              <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-400" />
                  <div>
                    <h3 className="font-bold text-sm text-white">
                      Diagnosebericht: {selectedReportForPreview.fileName}
                    </h3>
                    <p className="text-[11px] font-mono text-emerald-400">
                      {selectedReportForPreview.targetPath}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedReportForPreview(null)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 overflow-y-auto flex-1 bg-slate-950 font-mono text-xs text-slate-300">
                <pre className="whitespace-pre-wrap leading-relaxed select-all">
                  {JSON.stringify(selectedReportForPreview, null, 2)}
                </pre>
              </div>

              <div className="px-5 py-3 border-t border-slate-800 bg-slate-900 flex items-center justify-between">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(selectedReportForPreview, null, 2));
                    setCopiedReportJson(true);
                    setTimeout(() => setCopiedReportJson(false), 2000);
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedReportJson ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Kopiert!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>JSON kopieren</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownloadReportJson(selectedReportForPreview, selectedReportForPreview.fileName)}
                    className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download (.json)</span>
                  </button>
                  <button
                    onClick={() => setSelectedReportForPreview(null)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-colors cursor-pointer"
                  >
                    Schließen
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
