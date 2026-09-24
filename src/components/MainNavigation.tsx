import React from 'react';
import {
  MessageSquare,
  Cpu,
  HardDrive,
  Layers,
  Activity,
  AppWindow,
  Download,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Monitor,
} from 'lucide-react';
import { HybridMode, OllamaStatus } from '../types';

export type WorkspaceTab = 'chat' | 'models' | 'knowledge' | 'matrix' | 'system';

interface Props {
  activeWorkspace: WorkspaceTab;
  onSelectWorkspace: (tab: WorkspaceTab) => void;
  ollamaStatus: OllamaStatus;
  activeOllamaModel: string;
  activeGeminiModel: string;
  hybridMode: HybridMode;
  driveDCount: number;
  activeSystemsCount: number;
  onOpenDedicatedWindow: () => void;
  onOpenPackager: () => void;
  onOpenAndroidApk: () => void;
  onInstallPwa: () => void;
  canInstallPwa: boolean;
  isStandalone: boolean;
}

export const MainNavigation: React.FC<Props> = ({
  activeWorkspace,
  onSelectWorkspace,
  ollamaStatus,
  activeOllamaModel,
  activeGeminiModel,
  hybridMode,
  driveDCount,
  activeSystemsCount,
  onOpenDedicatedWindow,
  onOpenPackager,
  onOpenAndroidApk,
  onInstallPwa,
  canInstallPwa,
  isStandalone,
}) => {
  const navTabs: {
    id: WorkspaceTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    countBadge?: string | number;
  }[] = [
    {
      id: 'chat',
      label: 'Studio Chat',
      icon: MessageSquare,
    },
    {
      id: 'models',
      label: 'Modell-Zentrale',
      icon: Cpu,
      countBadge: ollamaStatus.models?.length || 0,
    },
    {
      id: 'knowledge',
      label: 'Wissens-Tresor',
      icon: HardDrive,
      countBadge: driveDCount,
    },
    {
      id: 'matrix',
      label: 'KI-Matrix',
      icon: Layers,
      countBadge: `${activeSystemsCount}/20`,
    },
    {
      id: 'system',
      label: 'System & Apps',
      icon: Activity,
    },
  ];

  return (
    <nav className="h-12 bg-slate-950 border-b border-slate-800/80 px-3 sm:px-5 flex items-center justify-between select-none z-20 shrink-0">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => onSelectWorkspace('chat')}
          className="flex items-center gap-2 text-left cursor-pointer group"
          title="Zurück zum Studio Chat"
        >
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center p-0.5 shadow-sm shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <span className="text-[11px] font-bold text-white tracking-tighter">AI</span>
          </div>
          <span className="text-sm font-semibold tracking-tight text-slate-100 group-hover:text-cyan-400 transition-colors whitespace-nowrap">
            Hybrid AI Workstation
          </span>
        </button>

        {/* Minimal unboxed status indicator */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400 pl-2 border-l border-slate-800">
          <span
            className={`w-2 h-2 rounded-full ${
              ollamaStatus.connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
            }`}
          />
          <span className="text-slate-300 font-medium">
            {ollamaStatus.connected ? 'Ollama aktiv' : 'Simulation'}
          </span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span className="text-slate-400 truncate max-w-[140px] font-mono text-[11px]">
            {activeOllamaModel}
          </span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span className="text-cyan-400 text-[11px]">
            Gemini {activeGeminiModel.replace('gemini-', '')}
          </span>
        </div>
      </div>

      {/* Zone 2: 4-6 clean text navigation links / workspace tabs */}
      <div className="flex items-center gap-1 bg-slate-900/60 p-1 rounded-lg border border-slate-800/60">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeWorkspace === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectWorkspace(tab.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-slate-800 text-cyan-300 shadow-sm border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.countBadge !== undefined && (
                <span
                  className={`text-[10px] font-mono tabular-nums px-1.5 py-0.2 rounded ${
                    isActive
                      ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/50'
                      : 'bg-slate-800/80 text-slate-400'
                  }`}
                >
                  {tab.countBadge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Zone 3: 1-2 primary actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenAndroidApk}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-emerald-200 bg-emerald-950/40 hover:bg-emerald-950/70 border border-emerald-700/40 rounded-lg transition-colors cursor-pointer"
          title="Android APK für Smartphone herunterladen (100% ohne Root)"
        >
          <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden xl:inline">Android APK</span>
        </button>

        <button
          onClick={onOpenPackager}
          className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg shadow-sm transition-colors cursor-pointer whitespace-nowrap"
          title="Windows 11 Starter-Paket herunterladen"
        >
          <Download className="w-3.5 h-3.5 text-slate-300" />
          <span>Windows App</span>
        </button>
      </div>
    </nav>
  );
};
