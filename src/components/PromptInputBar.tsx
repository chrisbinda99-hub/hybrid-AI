import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Trash2, ArrowUpRight, ChevronDown, ChevronUp, CornerDownLeft } from 'lucide-react';
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
  const [showQuickPrompts, setShowQuickPrompts] = useState(!hasMessages);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
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
    <div className="space-y-1.5">
      {/* Optional Quick Prompt Chips (Collapsible to save vertical space) */}
      {showQuickPrompts && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar animate-in fade-in duration-150">
          <span className="text-[11px] text-slate-400 font-medium px-1 shrink-0">
            Schnellstart:
          </span>
          {quickPrompts.map((qp, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setInput(qp.text);
                textareaRef.current?.focus();
              }}
              className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800 text-slate-300 hover:text-cyan-200 text-[11px] whitespace-nowrap transition cursor-pointer"
            >
              <span>{qp.title}</span>
              <ArrowUpRight className="w-3 h-3 opacity-60" />
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowQuickPrompts(false)}
            className="text-[10px] text-slate-500 hover:text-slate-300 ml-auto shrink-0 px-1"
            title="Schnellstart-Leiste ausblenden"
          >
            Ausblenden
          </button>
        </div>
      )}

      {/* Input Box */}
      <form
        onSubmit={handleSubmit}
        className="bg-slate-900/95 border border-slate-800 focus-within:border-cyan-500/80 rounded-2xl p-2 sm:p-2.5 shadow-xl transition-all"
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
                ? 'Nachricht eingeben (Smart Router wählt automatisch lokal oder Cloud)...'
                : activeMode === 'side_by_side'
                ? 'Prompt für simultanen Ollama vs Gemini Vergleich eingeben...'
                : activeMode === 'collaborative'
                ? 'Prompt für Ollama-Vorentwurf & Gemini-Veredelung eingeben...'
                : 'Prompt für hybride Konsensus-Synthese eingeben...'
            }
            className="flex-1 bg-transparent text-slate-100 text-sm sm:text-base placeholder:text-slate-500 focus:outline-none resize-none px-2 py-1 max-h-40 min-h-[36px] leading-relaxed"
          />

          <div className="flex items-center gap-1.5 shrink-0">
            {!showQuickPrompts && (
              <button
                type="button"
                onClick={() => setShowQuickPrompts(true)}
                className="h-8 px-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 text-[11px] hidden sm:flex items-center gap-1 transition"
                title="Beispiel-Prompts einblenden"
              >
                <span>Beispiele</span>
                <ChevronUp className="w-3 h-3" />
              </button>
            )}

            {hasMessages && (
              <button
                type="button"
                onClick={onClearHistory}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                title="Chatverlauf leeren"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-4 h-9 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 disabled:opacity-40 text-white font-medium text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-cyan-950/40 transition-all cursor-pointer"
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

        <div className="flex items-center justify-between px-2 pt-1.5 text-[10px] sm:text-[11px] text-slate-400 border-t border-slate-800/60 mt-1">
          <span className="truncate">
            <kbd className="font-mono bg-slate-800 px-1 py-0.5 rounded text-[10px] text-slate-300">Enter</kbd> zum Senden, <kbd className="font-mono bg-slate-800 px-1 py-0.5 rounded text-[10px] text-slate-300">Shift+Enter</kbd> für neue Zeile
          </span>
          <span className="shrink-0 ml-2">
            Modus: <strong className="text-cyan-300 font-medium">{activeMode}</strong>
          </span>
        </div>
      </form>
    </div>
  );
};
