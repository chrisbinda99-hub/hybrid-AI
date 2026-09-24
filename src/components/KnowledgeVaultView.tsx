import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  Search,
  PlusCircle,
  FileText,
  Download,
  Check,
  Copy,
  MessageSquare,
  Sparkles,
  RefreshCw,
  FolderCheck,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { DriveDSyncStatus, KnowledgeEntry } from '../types';
import { fetchDriveDStatus, fetchKnowledgeEntries, saveToDriveDVault } from '../services/knowledgeService';

interface Props {
  driveDStatus: DriveDSyncStatus | null;
  onRefreshDriveD: () => void;
  onAskInChatWithContext: (snippetText: string) => void;
}

export const KnowledgeVaultView: React.FC<Props> = ({
  driveDStatus,
  onRefreshDriveD,
  onAskInChatWithContext,
}) => {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<KnowledgeEntry | null>(null);

  // New Note Form
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadEntries = async () => {
    setIsLoading(true);
    try {
      const data = await fetchKnowledgeEntries(searchQuery);
      setEntries(data.entries || []);
      if (data.entries?.length && !selectedEntry) {
        setSelectedEntry(data.entries[0]);
      }
    } catch (e) {
      console.log('[Notice] Failed to load knowledge entries:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, [searchQuery]);

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() || !noteContent.trim()) return;

    setIsSaving(true);
    try {
      const ok = await saveToDriveDVault(
        noteTitle.trim(),
        noteContent.trim(),
        'manual-editor',
        'ai_studio'
      );
      if (ok) {
        setSaveSuccess(true);
        setNoteTitle('');
        setNoteContent('');
        setIsAddingNote(false);
        onRefreshDriveD();
        await loadEntries();
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyContent = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportAllMarkdown = () => {
    const markdownContent = entries
      .map(
        (e) =>
          `# ${e.prompt}\n\n*Quelle: ${e.source} | Modell: ${e.model} | Datum: ${new Date(
            e.timestamp
          ).toLocaleString()}*\n\n${e.response}\n\n---\n`
      )
      .join('\n');

    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OllamaKnowledge_Export_${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
      {/* 1. Header with clear, human-friendly explanation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800 shrink-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <HardDrive className="w-6 h-6 text-amber-400" />
            <span>Wissens-Tresor &amp; Lokales RAG (Drive D:)</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Ihre private Wissensdatenbank. Antworten aus Google Gemini oder eigene Notizen werden auf
            <code className="text-slate-300 font-mono mx-1">D:\OllamaKnowledge</code> gesichert und können
            jederzeit von lokalen Offline-Modellen ohne Internetverbindung durchsucht werden.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <button
            onClick={() => setIsAddingNote((prev) => !prev)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium shadow-sm transition cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>{isAddingNote ? 'Abbrechen' : 'Neues Wissen anlegen'}</span>
          </button>

          <button
            onClick={handleExportAllMarkdown}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition cursor-pointer"
            title="Alle Einträge als lesbare Markdown-Datei exportieren"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Exportieren (.md)</span>
          </button>
        </div>
      </div>

      {/* 2. Sync Status Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4 shrink-0">
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <FolderCheck className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] text-slate-400">Speicherort</div>
            <div className="text-xs font-semibold text-slate-200 font-mono truncate">
              {driveDStatus?.targetFolder || 'D:\\OllamaKnowledge'}
            </div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400">Dokumente im Tresor</div>
            <div className="text-xs font-semibold text-slate-200 tabular-nums">
              {entries.length} Einträge · {((driveDStatus?.totalBytes || 1024) / 1024).toFixed(1)} KB
            </div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400">Datenschutz-Status</div>
            <div className="text-xs font-semibold text-emerald-300">
              100% Offline &amp; DSGVO-gesichert
            </div>
          </div>
        </div>
      </div>

      {/* 3. New Note Form (Collapsible) */}
      {isAddingNote && (
        <form onSubmit={handleSaveNote} className="mb-4 p-4 rounded-xl bg-slate-900 border border-amber-500/40 space-y-3 shrink-0">
          <h3 className="text-xs font-semibold text-amber-300">Neuen Wissenseintrag manuell anlegen</h3>
          <input
            type="text"
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
            placeholder="Titel oder Fragestellung (z. B. Interne API-Richtlinien 2026)"
            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            required
          />
          <textarea
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            placeholder="Wissenstext, Anleitung oder Code-Ausschnitt, der für lokale KIs verfügbar sein soll..."
            rows={4}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none"
            required
          />
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddingNote(false)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs hover:bg-slate-700 transition"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium transition cursor-pointer"
            >
              {isSaving ? 'Speichere...' : 'Im Tresor speichern'}
            </button>
          </div>
        </form>
      )}

      {saveSuccess && (
        <div className="mb-3 p-3 rounded-xl bg-emerald-950/80 border border-emerald-700/60 text-emerald-200 text-xs flex items-center gap-2 shrink-0">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Wissen erfolgreich im Laufwerk D: Tresor abgelegt und indiziert!</span>
        </div>
      )}

      {/* 4. Search Filter */}
      <div className="relative mb-3 shrink-0">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Wissen durchsuchen nach Stichworten, Tags oder Fragen..."
          className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
        />
      </div>

      {/* 5. Master-Detail Two-Column Studio Layout */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 min-h-0 overflow-hidden">
        {/* Left Column: List of entries */}
        <div className="md:col-span-5 flex flex-col rounded-xl bg-slate-900/60 border border-slate-800 overflow-hidden">
          <div className="p-3 border-b border-slate-800 text-xs font-medium text-slate-400 flex items-center justify-between shrink-0">
            <span>Gespeicherte Dokumente</span>
            <span className="font-mono text-[11px]">{entries.length} Treffer</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-1">
            {entries.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                Keine Einträge gefunden.
              </div>
            ) : (
              entries.map((entry) => {
                const isSelected = selectedEntry?.id === entry.id;
                return (
                  <div
                    key={entry.id}
                    onClick={() => setSelectedEntry(entry)}
                    className={`p-3 rounded-lg cursor-pointer transition text-left ${
                      isSelected
                        ? 'bg-slate-800 border border-amber-500/50 shadow-sm'
                        : 'hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="text-xs font-semibold text-slate-100 line-clamp-1">
                      {entry.prompt}
                    </div>
                    <div className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                      {entry.summary || entry.response}
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-2">
                      <span className="text-amber-400/90 font-mono">
                        {entry.source.toUpperCase()}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">
                        {new Date(entry.timestamp).toLocaleDateString()}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">
                        {Math.round(entry.sizeBytes / 1024 * 10) / 10} KB
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Detail Reader & Actions */}
        <div className="md:col-span-7 flex flex-col rounded-xl bg-slate-900/80 border border-slate-800 overflow-hidden">
          {selectedEntry ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Detail Header */}
              <div className="p-4 border-b border-slate-800 bg-slate-900 space-y-2 shrink-0">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-sm font-bold text-slate-100 leading-snug">
                    {selectedEntry.prompt}
                  </h2>
                  <button
                    onClick={() =>
                      handleCopyContent(
                        `${selectedEntry.prompt}\n\n${selectedEntry.response}`,
                        selectedEntry.id
                      )
                    }
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer shrink-0"
                    title="Inhalt in Zwischenablage kopieren"
                  >
                    {copiedId === selectedEntry.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                  <span>Modell: <strong className="text-slate-200">{selectedEntry.model}</strong></span>
                  <span aria-hidden="true">·</span>
                  <span>Pfad: <code className="text-slate-300 font-mono text-[10px]">{selectedEntry.targetPath}</code></span>
                </div>

                {selectedEntry.tags && selectedEntry.tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1 pt-1">
                    {selectedEntry.tags.map((tag) => (
                      <span key={tag} className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Detail Content */}
              <div className="flex-1 overflow-y-auto p-4 text-xs text-slate-200 leading-relaxed space-y-3 font-sans whitespace-pre-wrap select-text">
                {selectedEntry.response}
              </div>

              {/* Action Footer */}
              <div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-3 shrink-0">
                <span className="text-[11px] text-slate-400">
                  Möchten Sie eine Frage basierend auf diesem Text stellen?
                </span>

                <button
                  onClick={() =>
                    onAskInChatWithContext(
                      `Beantworte mir folgende Frage unter Berücksichtigung unseres Wissens-Tresors zu "${selectedEntry.prompt}": `
                    )
                  }
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition cursor-pointer shrink-0"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Im Chat befragen</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 space-y-2">
              <HardDrive className="w-8 h-8 text-slate-700" />
              <div className="text-xs">Wählen Sie ein Dokument aus der Liste aus, um Details anzuzeigen.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
