import React from 'react';
import {
  BrainCircuit,
  SplitSquareVertical,
  Workflow,
  Scale,
  Sparkles,
  Lightbulb,
  Layers,
  Radio,
} from 'lucide-react';
import { HybridMode } from '../types';
import { GEMINI_MODELS } from '../services/geminiService';

interface Props {
  mode: HybridMode;
  onSelectMode: (mode: HybridMode) => void;
  geminiModel: string;
  onSelectGeminiModel: (model: string) => void;
  enableThinking: boolean;
  onToggleThinking: () => void;
}

export const HybridModeSelector: React.FC<Props> = ({
  mode,
  onSelectMode,
  geminiModel,
  onSelectGeminiModel,
  enableThinking,
  onToggleThinking,
}) => {
  const modes: {
    id: HybridMode;
    title: string;
    subtitle: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    {
      id: 'matrix_swarm',
      title: '20-KI Schwarm',
      subtitle: 'Simultane Multi-Agenten Matrix & Konsens',
      icon: Layers,
    },
    {
      id: 'solo_system',
      title: 'Einzelbetrieb (1 KI)',
      subtitle: 'Genau 1 System isoliert betreiben & bedienen',
      icon: Radio,
    },
    {
      id: 'smart_router',
      title: 'Smart Router',
      subtitle: 'Auto-Routing (Datenschutz lokal vs Cloud)',
      icon: BrainCircuit,
    },
    {
      id: 'side_by_side',
      title: 'Dual Direkt',
      subtitle: 'Ollama & Gemini parallel im Direktvergleich',
      icon: SplitSquareVertical,
    },
    {
      id: 'collaborative',
      title: 'Verbund Pipeline',
      subtitle: 'Ollama Entwurf ➔ Gemini High Thinking Polish',
      icon: Workflow,
    },
    {
      id: 'consensus',
      title: 'Konsensus Synthese',
      subtitle: 'Unabhängige Antworten zur Synthese verschmelzen',
      icon: Scale,
    },
  ];

  return (
    <div className="space-y-2.5">
      {/* 6-Way Mode Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {modes.map((m) => {
          const Icon = m.icon;
          const isActive = mode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => onSelectMode(m.id)}
              className={`text-left p-2.5 rounded-xl border transition-all flex flex-col justify-between ${
                isActive
                  ? 'bg-gradient-to-b from-cyan-950/60 to-slate-900 border-cyan-500/80 shadow-md shadow-cyan-950/30'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700/80 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span
                  className={`font-semibold text-xs ${
                    isActive ? 'text-cyan-200' : 'text-slate-200'
                  }`}
                >
                  {m.title}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 leading-snug line-clamp-2">
                {m.subtitle}
              </p>
            </button>
          );
        })}
      </div>

      {/* Gemini Engine Controls Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span className="text-slate-300 font-medium">Google Gemini Cloud-Modell:</span>
          <select
            value={geminiModel}
            onChange={(e) => onSelectGeminiModel(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 font-medium focus:outline-none focus:border-cyan-500"
          >
            {GEMINI_MODELS.map((gm) => (
              <option key={gm.id} value={gm.id}>
                {gm.name} {gm.supportsThinking ? '★ (Thinking Mode)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Thinking mode toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleThinking}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition ${
              enableThinking || geminiModel === 'gemini-3.1-pro-preview'
                ? 'bg-indigo-950/70 border-indigo-500/80 text-indigo-300 shadow-sm'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Aktiviert High Thinking für tiefgründige Reasoning-Ketten"
          >
            <Lightbulb
              className={`w-3.5 h-3.5 ${
                enableThinking || geminiModel === 'gemini-3.1-pro-preview'
                  ? 'text-indigo-400 fill-indigo-400/20'
                  : ''
              }`}
            />
            <span>
              High Thinking:{' '}
              {enableThinking || geminiModel === 'gemini-3.1-pro-preview' ? 'Aktiviert' : 'Standard'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
