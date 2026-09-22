import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Trash2, ArrowUpRight } from 'lucide-react';
import { HybridMode } from '../types';

interface Props {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  onClearHistory: () => void;
  hasMessages: boolean;
  activeMode: HybridMode;
}

export const PromptInputBar: React.FC<Props> = ({
  onSendMessage,
  isLoading,
  onClearHistory,
  hasMessages,
  activeMode,
}) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const quickPrompts = [
    {
      title: 'Laufwerk D: RAG',
      text: 'Welche archivierten Erkenntnisse von Laufwerk D:\\OllamaKnowledge hast du zu WebSocket Performance und Offline RAG?',
    },
    {
      title: 'Datenschutz-Probe',
      text: 'Ich habe hier ein vertrauliches Mitarbeiter-Passwort und interne DSGVO-Daten. Wie kann ich diese sicher lokal speichern?',
    },
    {
      title: 'Deep Reasoning',
      text: 'Erstelle eine skalierbare Microservice-Architektur für 50.000 parallele WebSocket-Verbindungen auf Windows Server mit Beweis der Skalierung.',
    },
    {
      title: 'Speed-Vergleich',
      text: 'Schreibe einen performanten QuickSort-Algorithmus in TypeScript und erkläre die Zeitkomplexität O(n log n).',
    },
    {
      title: 'Verbund-Synthese',
      text: 'Fasse die Kernunterschiede zwischen Quantencomputern und klassischen Prozessoren zusammen und beurteile die Marktreife für 2030.',
    },
  ];

  return (
    <div className="space-y-2">
      {/* Quick Prompt Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
        <span className="text-[11px] text-slate-400 font-medium px-1 shrink-0">
          Schnellstart:
        </span>
        {quickPrompts.map((qp, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setInput(qp.text)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800 text-slate-300 hover:text-cyan-200 text-xs whitespace-nowrap transition"
          >
            <span>{qp.title}</span>
            <ArrowUpRight className="w-3 h-3 opacity-60" />
          </button>
        ))}
      </div>

      {/* Input Box */}
      <form
        onSubmit={handleSubmit}
        className="bg-slate-900/90 border border-slate-800 rounded-2xl p-2.5 shadow-lg focus-within:border-cyan-500/80 transition-all"
      >
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              activeMode === 'smart_router'
                ? 'Geben Sie Ihre Frage ein (Smart Router wählt automatisch lokal oder Cloud)...'
                : activeMode === 'side_by_side'
                ? 'Prompt für simultanen Ollama vs Gemini Vergleich eingeben...'
                : activeMode === 'collaborative'
                ? 'Prompt für Ollama-Vorentwurf & Gemini-Veredelung eingeben...'
                : 'Prompt für hybride Konsensus-Synthese eingeben...'
            }
            className="flex-1 bg-transparent text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none resize-none px-2 py-1 max-h-44 min-h-[38px]"
          />

          <div className="flex items-center gap-1.5 shrink-0">
            {hasMessages && (
              <button
                type="button"
                onClick={onClearHistory}
                className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition"
                title="Chatverlauf leeren"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-4 h-9 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-40 text-white font-medium text-xs flex items-center gap-1.5 shadow-md shadow-cyan-950/40 transition-all"
            >
              {isLoading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Berechne...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Senden</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between px-2 pt-2 text-[11px] text-slate-400 border-t border-slate-800/60 mt-1">
          <span>Drücken Sie <kbd className="font-mono bg-slate-800 px-1 py-0.5 rounded text-[10px]">Enter</kbd> zum Senden, <kbd className="font-mono bg-slate-800 px-1 py-0.5 rounded text-[10px]">Shift+Enter</kbd> für neue Zeile</span>
          <span>Modus: <strong className="text-cyan-300 font-medium">{activeMode}</strong></span>
        </div>
      </form>
    </div>
  );
};
