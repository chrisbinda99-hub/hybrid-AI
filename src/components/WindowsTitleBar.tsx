import React, { useState, useEffect } from 'react';
import {
  Minus,
  Square,
  X,
  Cpu,
  Sparkles,
  Monitor,
  ShieldCheck,
  Download,
  HardDrive,
  Activity,
  AppWindow,
  Maximize2,
  Smartphone,
} from 'lucide-react';

interface Props {
  ollamaConnected: boolean;
  activeOllamaModel: string;
  activeGeminiModel: string;
  isStandalone: boolean;
  onOpenPackager: () => void;
  onInstallPwa: () => void;
  canInstallPwa: boolean;
  onOpenDriveD?: () => void;
  onOpenDiagnostics?: () => void;
  onOpenAndroidApk?: () => void;
}

export const WindowsTitleBar: React.FC<Props> = ({
  ollamaConnected,
  activeOllamaModel,
  activeGeminiModel,
  isStandalone,
  onOpenPackager,
  onInstallPwa,
  canInstallPwa,
  onOpenDriveD,
  onOpenDiagnostics,
  onOpenAndroidApk,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDedicatedWindow, setIsDedicatedWindow] = useState(false);

  useEffect(() => {
    const checkWindowMode = () => {
      const isPopout =
        window.opener != null ||
        window.name === 'HybridWorkstationDedicatedApp' ||
        isStandalone ||
        (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
      setIsDedicatedWindow(!!isPopout);
      setIsFullscreen(!!document.fullscreenElement);
    };

    checkWindowMode();
    document.addEventListener('fullscreenchange', checkWindowMode);
    return () => document.removeEventListener('fullscreenchange', checkWindowMode);
  }, [isStandalone]);

  const handleOpenDedicatedWindow = () => {
    const width = Math.min(1440, window.screen.availWidth - 40);
    const height = Math.min(920, window.screen.availHeight - 60);
    const left = Math.max(0, Math.round((window.screen.availWidth - width) / 2));
    const top = Math.max(0, Math.round((window.screen.availHeight - height) / 2));

    const win = window.open(
      window.location.href,
      'HybridWorkstationDedicatedApp',
      `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,directories=no,scrollbars=yes,resizable=yes`
    );
    if (win) {
      win.focus();
    }
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleCloseWindow = () => {
    window.close();
  };

  return (
    <header className="h-10 bg-slate-950 border-b border-slate-800/80 flex items-center justify-between px-3 select-none text-xs text-slate-400 z-30">
      {/* App Branding & Windows 11 Indicator */}
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-1.5 font-medium text-slate-200">
          <div className="w-5 h-5 rounded-md bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center p-0.5 shadow-sm shadow-cyan-500/20">
            <span className="text-[10px] font-bold text-white tracking-tighter">HG</span>
          </div>
          <span className="font-semibold text-slate-100">Hybrid AI Workstation</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60">
            Win11
          </span>
        </div>

        <div className="h-3.5 w-px bg-slate-800" />

        {/* Live Status Indicators */}
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] border ${
              ollamaConnected
                ? 'bg-emerald-950/60 border-emerald-700/50 text-emerald-300'
                : 'bg-amber-950/60 border-amber-700/50 text-amber-300'
            }`}
            title={ollamaConnected ? 'Ollama aktiv auf Windows 11' : 'Ollama nicht verbunden'}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                ollamaConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <Cpu className="w-3 h-3" />
            <span>Ollama: {activeOllamaModel || 'Offline'}</span>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] bg-cyan-950/60 border border-cyan-700/50 text-cyan-300">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>Gemini: {activeGeminiModel.replace('gemini-', '')}</span>
          </div>

          {/* Indicator if dedicated window is active */}
          {isDedicatedWindow && (
            <div className="hidden xl:flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] bg-emerald-950/70 border border-emerald-600/50 text-emerald-300">
              <AppWindow className="w-3 h-3 text-emerald-400" />
              <span>Eigenes App-Fenster aktiv</span>
            </div>
          )}
        </div>
      </div>

      {/* Center status message */}
      <div className="hidden md:flex items-center gap-1 text-[11px] text-slate-400">
        <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
        <span>Hybrid-Verbund: Lokaler Datenschutz &amp; Google AI Cloud</span>
      </div>

      {/* Windows Controls & Standalone / EXE Action */}
      <div className="flex items-center gap-1.5">
        {/* Eigenes Fenster Popout Button if not already in dedicated window */}
        {!isDedicatedWindow && (
          <button
            onClick={handleOpenDedicatedWindow}
            id="titlebar-open-dedicated-window-btn"
            className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded font-medium shadow-sm transition-all cursor-pointer"
            title="Workstation in eigenem, isolierten App-Fenster ohne Browser-Rahmen öffnen"
          >
            <AppWindow className="w-3.5 h-3.5" />
            <span>Eigenes Fenster</span>
          </button>
        )}

        {onOpenDriveD && (
          <button
            onClick={onOpenDriveD}
            id="titlebar-open-drive-d-btn"
            className="flex items-center gap-1 px-2 py-1 text-[11px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 rounded border border-amber-500/30 transition-colors cursor-pointer"
            title="Laufwerk D: Tresor verwalten (D:\OllamaKnowledge)"
          >
            <HardDrive className="w-3 h-3 text-amber-400" />
            <span className="hidden sm:inline">D: Tresor</span>
          </button>
        )}

        {onOpenDiagnostics && (
          <button
            onClick={onOpenDiagnostics}
            id="titlebar-open-diag-btn"
            className="flex items-center gap-1 px-2 py-1 text-[11px] bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 rounded border border-cyan-500/30 transition-colors cursor-pointer"
            title="System auf Herz und Nieren testen"
          >
            <Activity className="w-3 h-3 text-cyan-400 animate-pulse" />
            <span className="hidden sm:inline">Diagnose (99%)</span>
          </button>
        )}

        {!isDedicatedWindow && (
          <button
            onClick={onInstallPwa}
            id="titlebar-pwa-install-btn"
            className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded font-medium shadow-sm transition-all cursor-pointer"
            title="In Windows 11 als App verankern (Startmenü / Taskleiste / PWA)"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>App in Win11 verankern</span>
          </button>
        )}

        <button
          onClick={onOpenPackager}
          id="titlebar-open-packager-btn"
          className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded font-medium shadow-sm transition-all cursor-pointer"
          title="Windows 11 Starter-Paket herunterladen (.ZIP / App)"
        >
          <Download className="w-3 h-3" />
          <span>Windows App (.ZIP)</span>
        </button>

        {onOpenAndroidApk && (
          <button
            onClick={onOpenAndroidApk}
            id="titlebar-open-android-apk-btn"
            className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white rounded font-medium shadow-sm transition-all cursor-pointer border border-emerald-400/40"
            title="Android APK herunterladen & prüfen (100% ohne Root)"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-200" />
            <span className="font-semibold">📱 Android APK (No Root)</span>
          </button>
        )}

        {/* Windows 11 simulated window controls */}
        <div className="flex items-center ml-2 border-l border-slate-800 pl-1">
          <button
            className="w-7 h-7 flex items-center justify-center hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded transition-colors"
            title="Minimieren"
            onClick={() => {
              window.blur();
            }}
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            className="w-7 h-7 flex items-center justify-center hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded transition-colors"
            title={isFullscreen ? 'Vollbild beenden' : 'Maximieren / Vollbild'}
            onClick={handleToggleFullscreen}
          >
            {isFullscreen ? <Maximize2 className="w-3 h-3 text-cyan-300" /> : <Square className="w-3 h-3" />}
          </button>
          <button
            className="w-7 h-7 flex items-center justify-center hover:bg-rose-600 hover:text-white text-slate-400 rounded transition-colors"
            title="Fenster schließen"
            onClick={handleCloseWindow}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};

