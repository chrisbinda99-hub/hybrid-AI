import React, { useState } from 'react';
import {
  X,
  Cpu,
  Sparkles,
  Zap,
  ShieldCheck,
  Activity,
  Layers,
  CheckCircle2,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sliders,
  ExternalLink,
  Brain,
  Terminal,
  Code2,
  Database,
  Network,
  Scale,
  Workflow,
  Radio,
  Clock,
  HardDrive,
  Play,
} from 'lucide-react';
import {
  AISystemDefinition,
  AISystemCategory,
  SwarmPresetId,
} from '../types';
import {
  getAllAISystems,
  saveAISystems,
  updateAISystem,
  applySwarmPreset,
  pingAISystem,
} from '../services/multiAiMatrixService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  activeSoloSystemId: string;
  onSelectSoloSystem: (systemId: string) => void;
  onSwitchToSoloMode: (systemId: string) => void;
  onSwitchToSwarmMode: () => void;
  isSoloMode: boolean;
  customHost: string;
}

export const MultiAiMatrixModal: React.FC<Props> = ({
  isOpen,
  onClose,
  activeSoloSystemId,
  onSelectSoloSystem,
  onSwitchToSoloMode,
  onSwitchToSwarmMode,
  isSoloMode,
  customHost,
}) => {
  const [systems, setSystems] = useState<AISystemDefinition[]>(getAllAISystems);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [pingingId, setPingingId] = useState<string | null>(null);
  const [editingSystemId, setEditingSystemId] = useState<string | null>(null);

  if (!isOpen) return null;

  const activeInHybridCount = systems.filter((s) => s.enabledInHybrid).length;

  const handleToggleHybrid = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const system = systems.find((s) => s.id === id);
    if (!system) return;
    const next = updateAISystem(id, { enabledInHybrid: !system.enabledInHybrid });
    setSystems(next);
  };

  const handleApplyPreset = (preset: SwarmPresetId) => {
    const updated = applySwarmPreset(preset);
    setSystems(updated);
  };

  const handlePing = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const system = systems.find((s) => s.id === id);
    if (!system) return;
    setPingingId(id);
    try {
      const pingRes = await pingAISystem(system, customHost);
      const next = updateAISystem(id, {
        latencyMs: pingRes.latencyMs,
        status: pingRes.status as any,
      });
      setSystems(next);
    } catch {
      // ignore
    } finally {
      setPingingId(null);
    }
  };

  const handleStartSolo = (id: string) => {
    onSwitchToSoloMode(id);
    onClose();
  };

  const filteredSystems = systems.filter((s) => {
    const matchesCategory =
      selectedCategory === 'all' || s.category === selectedCategory;
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.architecture.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.parameters.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories: { id: string; label: string; count: number }[] = [
    { id: 'all', label: 'Alle 20 Systeme', count: systems.length },
    {
      id: 'local_ollama',
      label: 'Lokale Ollama & Edge',
      count: systems.filter((s) => s.category === 'local_ollama').length,
    },
    {
      id: 'neuromorphic_slm',
      label: 'Neuromorph & SLM',
      count: systems.filter((s) => s.category === 'neuromorphic_slm').length,
    },
    {
      id: 'google_gemini',
      label: 'Google Cloud Flaggschiffe',
      count: systems.filter((s) => s.category === 'google_gemini').length,
    },
    {
      id: 'cloud_reasoning',
      label: 'Cloud Partner & Reasoning',
      count: systems.filter((s) => s.category === 'cloud_reasoning').length,
    },
    {
      id: 'specialist_agent',
      label: 'Spezial- & Wissens-Agenten',
      count: systems.filter((s) => s.category === 'specialist_agent').length,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl max-h-[92vh] flex flex-col bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-800 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-cyan-950/40">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-100">
                  20 KI-Systeme Matrix & Hybrid-Hub
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-cyan-950 border border-cyan-800/80 text-cyan-300">
                  20 Systeme registriert
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-950 border border-emerald-800/80 text-emerald-300">
                  {activeInHybridCount}/20 im Hybrid-Schwarm aktiv
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Hybrid-Schwarm für Multi-Agenten-Konsensus oder jedes einzelne der 20 Systeme isoliert im Einzelbetrieb bedienen.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isSoloMode && (
              <button
                onClick={() => {
                  onSwitchToSwarmMode();
                  onClose();
                }}
                className="px-3 py-1.5 rounded-xl bg-indigo-950/80 border border-indigo-700/70 text-indigo-300 hover:bg-indigo-900 text-xs font-medium flex items-center gap-1.5 transition"
                title="Vom Einzelbetrieb zum 20-KI-Hybrid-Schwarm wechseln"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Zum 20-KI-Schwarm wechseln</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Schließen"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* SWARM PRESET BAR & OPERATOR ACTIONS */}
        <div className="px-4 sm:px-6 py-2.5 bg-slate-900/40 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
              Schwarm-Presets:
            </span>
            <button
              onClick={() => handleApplyPreset('full_20_matrix')}
              className="px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white transition flex items-center gap-1 font-medium text-[11px]"
            >
              <span>🌟 Alle 20 (Voll-Matrix)</span>
            </button>
            <button
              onClick={() => handleApplyPreset('top_5_fast')}
              className="px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white transition flex items-center gap-1 font-medium text-[11px]"
            >
              <Zap className="w-3 h-3 text-amber-400" />
              <span>Top 5 Speed (&lt; 100ms)</span>
            </button>
            <button
              onClick={() => handleApplyPreset('local_offline_dsgvo')}
              className="px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white transition flex items-center gap-1 font-medium text-[11px]"
            >
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>100% Offline DSGVO (10 Systeme)</span>
            </button>
            <button
              onClick={() => handleApplyPreset('deep_reasoning_council')}
              className="px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white transition flex items-center gap-1 font-medium text-[11px]"
            >
              <Brain className="w-3 h-3 text-indigo-400" />
              <span>Deep Reasoning Rat (6 Systeme)</span>
            </button>
            <button
              onClick={() => handleApplyPreset('code_systems_squad')}
              className="px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white transition flex items-center gap-1 font-medium text-[11px]"
            >
              <Code2 className="w-3 h-3 text-cyan-400" />
              <span>Code & Architektur Squad</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="System, Modell oder Rolle suchen..."
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/80"
            />
          </div>
        </div>

        {/* CATEGORY TABS */}
        <div className="px-4 sm:px-6 py-2 border-b border-slate-800/60 flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0 text-xs">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 rounded-lg whitespace-nowrap transition font-medium text-xs flex items-center gap-1.5 ${
                selectedCategory === cat.id
                  ? 'bg-cyan-950/80 border border-cyan-700 text-cyan-200'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <span>{cat.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  selectedCategory === cat.id ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-500'
                }`}
              >
                {cat.count}
              </span>
            </button>
          ))}
        </div>

        {/* 20 SYSTEMS GRID CONTAINER */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredSystems.map((sys) => {
              const isSoloActive = isSoloMode && activeSoloSystemId === sys.id;
              const isPinging = pingingId === sys.id;
              const isEditing = editingSystemId === sys.id;

              return (
                <div
                  key={sys.id}
                  className={`rounded-xl border transition-all flex flex-col justify-between p-3.5 relative ${
                    isSoloActive
                      ? 'bg-gradient-to-b from-cyan-950/50 to-slate-900 border-cyan-500 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-500'
                      : sys.enabledInHybrid
                      ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                      : 'bg-slate-950/60 border-slate-800/50 opacity-70 hover:opacity-100'
                  }`}
                >
                  {/* Card Top: Number, Name & Status */}
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-slate-800 text-slate-300 font-mono text-[11px] font-bold flex items-center justify-center shrink-0 border border-slate-700/60">
                          #{sys.systemNumber < 10 ? `0${sys.systemNumber}` : sys.systemNumber}
                        </span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-xs sm:text-sm font-bold text-slate-100 tracking-tight">
                              {sys.name}
                            </h3>
                            {isSoloActive && (
                              <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-semibold border border-cyan-500/40">
                                Aktiv (Solo)
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {sys.parameters} • {sys.architecture}
                          </span>
                        </div>
                      </div>

                      {/* Hybrid Toggle Checkbox */}
                      <label
                        className="flex items-center gap-1 cursor-pointer select-none shrink-0"
                        title="Im 20-KI-Schwarm aktivieren oder stummschalten"
                        onClick={(e) => handleToggleHybrid(sys.id, e)}
                      >
                        <input
                          type="checkbox"
                          checked={sys.enabledInHybrid}
                          readOnly
                          className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0 cursor-pointer"
                        />
                        <span className="text-[10px] text-slate-400 hidden sm:inline">Schwarm</span>
                      </label>
                    </div>

                    {/* Role Description */}
                    <p className="text-[11px] text-slate-300 mb-2 leading-relaxed font-medium">
                      {sys.role}
                    </p>

                    {/* Metrics: Latency & VRAM / Parameters */}
                    <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60 text-[10px] text-slate-300 font-mono">
                        <Clock className="w-3 h-3 text-cyan-400" />
                        <span>{sys.latencyMs} ms</span>
                      </div>

                      {sys.vramMb > 0 ? (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60 text-[10px] text-slate-300 font-mono">
                          <HardDrive className="w-3 h-3 text-emerald-400" />
                          <span>{sys.vramMb} MB VRAM</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60 text-[10px] text-slate-300 font-mono">
                          <Sparkles className="w-3 h-3 text-sky-400" />
                          <span>Cloud Scale</span>
                        </div>
                      )}

                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                          sys.status === 'online'
                            ? 'bg-emerald-950/70 border-emerald-700/50 text-emerald-300'
                            : sys.status === 'ready'
                            ? 'bg-sky-950/70 border-sky-700/50 text-sky-300'
                            : 'bg-amber-950/70 border-amber-700/50 text-amber-300'
                        }`}
                      >
                        {sys.status === 'online' ? 'Online' : sys.status === 'ready' ? 'Bereit' : 'Simuliert'}
                      </span>
                    </div>

                    {/* Strengths Pills */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {sys.strengths.slice(0, 3).map((st, sIdx) => (
                        <span
                          key={sIdx}
                          className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800/60 text-slate-400 border border-slate-700/40"
                        >
                          {st}
                        </span>
                      ))}
                    </div>

                    {/* Optional Drawer for editing Single System Params */}
                    {isEditing && (
                      <div className="mt-2 mb-3 p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2 animate-in fade-in duration-150 text-xs">
                        <div>
                          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                            <span>Temperatur: {sys.temperature}</span>
                            <span>{sys.temperature < 0.4 ? 'Präzise/Deterministisch' : 'Kreativ/Offen'}</span>
                          </div>
                          <input
                            type="range"
                            min="0.0"
                            max="1.0"
                            step="0.1"
                            value={sys.temperature}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              const next = updateAISystem(sys.id, { temperature: val });
                              setSystems(next);
                            }}
                            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                            System-Prompt Persona:
                          </label>
                          <textarea
                            rows={2}
                            value={sys.systemInstruction}
                            onChange={(e) => {
                              const next = updateAISystem(sys.id, { systemInstruction: e.target.value });
                              setSystems(next);
                            }}
                            className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-[11px] text-slate-200 focus:outline-none focus:border-cyan-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Bottom: Action Buttons */}
                  <div className="pt-2 border-t border-slate-800/70 flex items-center justify-between gap-1.5">
                    {/* SOLO START BUTTON */}
                    <button
                      onClick={() => handleStartSolo(sys.id)}
                      className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                        isSoloActive
                          ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 font-bold'
                          : 'bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700/60 text-cyan-200 hover:text-white'
                      }`}
                      title={`Dieses KI-System (${sys.name}) isoliert im Einzelbetrieb bedienen`}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{isSoloActive ? 'Aktiver Einzelbetrieb' : 'Einzeln bedienen'}</span>
                    </button>

                    {/* PING TEST BUTTON */}
                    <button
                      onClick={(e) => handlePing(sys.id, e)}
                      disabled={isPinging}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition"
                      title="Latenz-Ping messen"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin text-cyan-400' : ''}`} />
                    </button>

                    {/* CONFIG TOGGLE BUTTON */}
                    <button
                      onClick={() => setEditingSystemId(isEditing ? null : sys.id)}
                      className={`p-1.5 rounded-lg transition ${
                        isEditing
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                      title="Parameter & Persona anpassen"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="px-4 sm:px-6 py-3 border-t border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Alle 20 Systeme voll kompatibel mit Windows 11 & Offline-Betrieb.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition font-medium text-xs"
            >
              Schließen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
