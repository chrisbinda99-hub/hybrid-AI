import React, { useState } from 'react';
import {
  Layers,
  Sparkles,
  Cpu,
  Clock,
  HardDrive,
  RefreshCw,
  Sliders,
  ChevronDown,
  Play,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { AISystemDefinition } from '../types';
import { pingAISystem } from '../services/multiAiMatrixService';

interface Props {
  activeSystem: AISystemDefinition;
  allSystems: AISystemDefinition[];
  onSelectSystem: (systemId: string) => void;
  onSwitchToSwarm: () => void;
  onOpenMatrixModal: () => void;
  customHost: string;
}

export const SoloSystemControlBar: React.FC<Props> = ({
  activeSystem,
  allSystems,
  onSelectSystem,
  onSwitchToSwarm,
  onOpenMatrixModal,
  customHost,
}) => {
  const [isPinging, setIsPinging] = useState(false);
  const [currentLatency, setCurrentLatency] = useState<number>(activeSystem.latencyMs);
  const [showDropdown, setShowDropdown] = useState(false);

  const handlePing = async () => {
    setIsPinging(true);
    try {
      const res = await pingAISystem(activeSystem, customHost);
      setCurrentLatency(res.latencyMs);
    } catch {
      // ignore
    } finally {
      setIsPinging(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-cyan-950/70 via-slate-900 to-indigo-950/70 border-b border-cyan-800/40 px-3 py-2 text-xs text-slate-200 transition-all">
      <div className="max-w-[1700px] mx-auto flex flex-wrap items-center justify-between gap-2">
        {/* Left: Active Solo System Badge & Quick Switcher */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/20 border border-cyan-500/50 text-cyan-200 font-semibold shadow-sm">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-mono text-[11px]">
              SYS-{activeSystem.systemNumber < 10 ? `0${activeSystem.systemNumber}` : activeSystem.systemNumber}
            </span>
            <span>•</span>
            <span className="text-white">{activeSystem.name}</span>
            <span className="text-[10px] text-cyan-300 font-normal hidden sm:inline">
              ({activeSystem.parameters})
            </span>
          </div>

          {/* Quick-Switch Dropdown to any other of the 20 systems */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white flex items-center gap-1.5 transition text-xs cursor-pointer font-medium"
              title="Anderes KI-System für den Einzelbetrieb auswählen"
            >
              <span>System wechseln</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showDropdown && (
              <div
                className="absolute left-0 top-full mt-1 w-80 max-h-96 overflow-y-auto bg-slate-950 border border-slate-800 rounded-xl shadow-2xl z-50 p-1.5 space-y-1 animate-in fade-in duration-150"
                onClick={() => setShowDropdown(false)}
              >
                <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800/80 mb-1">
                  Direktzugriff: Alle 20 KI-Systeme
                </div>
                {allSystems.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => onSelectSystem(s.id)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs transition ${
                      s.id === activeSystem.id
                        ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 font-semibold'
                        : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-mono text-[10px] text-slate-400">
                        #{s.systemNumber < 10 ? `0${s.systemNumber}` : s.systemNumber}
                      </span>
                      <span className="truncate">{s.shortName}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono ml-2 shrink-0">
                      {s.parameters}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60 font-mono">
              <Clock className="w-3 h-3 text-cyan-400" />
              <span>{currentLatency}ms</span>
            </div>

            <button
              onClick={handlePing}
              disabled={isPinging}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition"
              title="Latenz-Ping messen"
            >
              <RefreshCw className={`w-3 h-3 ${isPinging ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Right: Actions (Back to Swarm / Open Full Matrix) */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenMatrixModal}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white transition flex items-center gap-1.5 text-xs font-medium cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span>20 KI-Matrix Hub</span>
          </button>

          <button
            onClick={onSwitchToSwarm}
            className="px-3 py-1 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white transition flex items-center gap-1.5 text-xs font-semibold shadow-sm shadow-indigo-950/40 cursor-pointer"
            title="Zurück zum 20-KI-System Hybrid-Schwarm"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Zum 20-KI-Schwarm</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
