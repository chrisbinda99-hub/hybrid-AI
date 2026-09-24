import React, { useState } from 'react';
import {
  Layers,
  Radio,
  Sparkles,
  Cpu,
  Zap,
  Activity,
  Search,
  CheckCircle2,
  RefreshCw,
  Play,
  Sliders,
  ShieldCheck,
  Brain,
  MessageSquare,
} from 'lucide-react';
import { AISystemDefinition, AISystemCategory, SwarmPresetId, HybridMode } from '../types';
import {
  getAllAISystems,
  updateAISystem,
  applySwarmPreset,
  pingAISystem,
} from '../services/multiAiMatrixService';

interface Props {
  activeSoloSystemId: string;
  onSelectSoloSystem: (systemId: string) => void;
  onSwitchToSoloMode: (systemId: string) => void;
  onSwitchToSwarmMode: () => void;
  isSoloMode: boolean;
  customHost: string;
  onSwitchToChat: () => void;
}

export const AiMatrixView: React.FC<Props> = ({
  activeSoloSystemId,
  onSelectSoloSystem,
  onSwitchToSoloMode,
  onSwitchToSwarmMode,
  isSoloMode,
  customHost,
  onSwitchToChat,
}) => {
  const [systems, setSystems] = useState<AISystemDefinition[]>(getAllAISystems);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [pingingId, setPingingId] = useState<string | null>(null);

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
    onSwitchToChat();
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
      label: 'Cloud Reasoning',
      count: systems.filter((s) => s.category === 'cloud_reasoning').length,
    },
    {
      id: 'specialist_agent',
      label: 'Spezial-Agenten',
      count: systems.filter((s) => s.category === 'specialist_agent').length,
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* 1. Header with clear, human-friendly explanation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-cyan-400" />
            <span>20-KI-System Matrix &amp; Schwarm-Orchestrator</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Nutzen Sie das gesamte Spektrum von 20 spezialisierten KI-Systemen. Sie können entweder mit
            <strong> genau 1 Experten im Solo-Modus</strong> sprechen oder alle aktiven Modelle als
            <strong> Schwarm im Konsens</strong> antworten lassen.
          </p>
        </div>

        {/* Operating Mode Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl shrink-0 self-start md:self-auto">
          <button
            onClick={onSwitchToSwarmMode}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              !isSoloMode
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Schwarm-Modus ({activeInHybridCount} aktiv)</span>
          </button>

          <button
            onClick={() => onSwitchToSoloMode(activeSoloSystemId)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              isSoloMode
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Solo-Experte</span>
          </button>
        </div>
      </div>

      {/* 2. Quick Presets Bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-medium text-slate-400 mr-1">Schnell-Profile:</span>
        <button
          onClick={() => handleApplyPreset('full_20_matrix')}
          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-lg text-xs transition cursor-pointer"
        >
          Alle 20 KIs aktiv
        </button>
        <button
          onClick={() => handleApplyPreset('top_5_fast')}
          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-lg text-xs transition cursor-pointer"
        >
          Top 5 Blitzschnell (&lt;50ms)
        </button>
        <button
          onClick={() => handleApplyPreset('local_offline_dsgvo')}
          className="px-2.5 py-1 bg-emerald-950/60 hover:bg-emerald-950 border border-emerald-700/60 text-emerald-300 rounded-lg text-xs transition cursor-pointer"
        >
          100% Offline &amp; DSGVO
        </button>
        <button
          onClick={() => handleApplyPreset('deep_reasoning_council')}
          className="px-2.5 py-1 bg-cyan-950/60 hover:bg-cyan-950 border border-cyan-700/60 text-cyan-300 rounded-lg text-xs transition cursor-pointer"
        >
          Deep Reasoning Rat
        </button>
        <button
          onClick={() => handleApplyPreset('code_systems_squad')}
          className="px-2.5 py-1 bg-indigo-950/60 hover:bg-indigo-950 border border-indigo-700/60 text-indigo-300 rounded-lg text-xs transition cursor-pointer"
        >
          Code &amp; Entwickler-Squad
        </button>
      </div>

      {/* 3. Search & Category Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Category Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                selectedCategory === c.id
                  ? 'bg-slate-800 text-cyan-300 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <span>{c.label}</span>
              <span className="ml-1.5 text-[10px] text-slate-500 font-mono">({c.count})</span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Spezialist suchen..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* 4. Systems Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredSystems.map((s) => {
          const isCurrentSolo = activeSoloSystemId === s.id;
          const isPinging = pingingId === s.id;

          return (
            <div
              key={s.id}
              onClick={() => onSelectSoloSystem(s.id)}
              className={`p-4 rounded-xl border flex flex-col justify-between gap-3 transition-all cursor-pointer ${
                isCurrentSolo && isSoloMode
                  ? 'bg-slate-900 border-emerald-500/80 shadow-md shadow-emerald-950/40 ring-1 ring-emerald-500/50'
                  : s.enabledInHybrid
                  ? 'bg-slate-900/80 border-slate-700/80 hover:border-slate-600'
                  : 'bg-slate-950/40 border-slate-800/60 opacity-60 hover:opacity-80'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-md bg-slate-800 border border-slate-700 text-[10px] font-mono flex items-center justify-center text-slate-300 shrink-0">
                      {s.systemNumber}
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-100 truncate">
                        {s.name}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {s.architecture}
                      </div>
                    </div>
                  </div>

                  {/* Toggle Swarm Participation */}
                  <button
                    onClick={(e) => handleToggleHybrid(s.id, e)}
                    className={`text-[10px] px-2 py-0.5 rounded border transition shrink-0 cursor-pointer ${
                      s.enabledInHybrid
                        ? 'bg-cyan-950/80 border-cyan-700/60 text-cyan-300'
                        : 'bg-slate-900 border-slate-800 text-slate-500'
                    }`}
                    title="Im 20-KI Schwarm aktivieren oder deaktivieren"
                  >
                    {s.enabledInHybrid ? 'Im Schwarm: AN' : 'Schwarm: AUS'}
                  </button>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-2">
                  {s.role}
                </p>

                <div className="flex flex-wrap items-center gap-1">
                  {s.strengths.slice(0, 3).map((st) => (
                    <span key={st} className="text-[10px] bg-slate-800/80 text-slate-400 px-1.5 py-0.2 rounded">
                      {st}
                    </span>
                  ))}
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                  <span>Latenz: <strong className="font-mono text-slate-200 tabular-nums">{s.latencyMs}ms</strong></span>
                  <button
                    onClick={(e) => handlePing(s.id, e)}
                    disabled={isPinging}
                    className="p-1 text-slate-500 hover:text-slate-300 rounded cursor-pointer"
                    title="Latenz testen"
                  >
                    <RefreshCw className={`w-3 h-3 ${isPinging ? 'animate-spin text-cyan-400' : ''}`} />
                  </button>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartSolo(s.id);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition cursor-pointer"
                >
                  <Play className="w-3 h-3 text-cyan-400" />
                  <span>Solo ausführen</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
