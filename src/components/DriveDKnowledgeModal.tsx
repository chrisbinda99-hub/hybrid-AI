import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  CheckCircle2,
  Download,
  Search,
  RefreshCw,
  FolderSync,
  FileCode,
  Sparkles,
  ShieldCheck,
  X,
  PlusCircle,
  ExternalLink,
} from 'lucide-react';
import { DriveDSyncStatus, KnowledgeEntry } from '../types';
import { fetchDriveDStatus, fetchKnowledgeEntries, saveToDriveDVault } from '../services/knowledgeService';

interface DriveDKnowledgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSnippetForPrompt?: (promptText: string) => void;
}

export const DriveDKnowledgeModal: React.FC<DriveDKnowledgeModalProps> = ({
  isOpen,
  onClose,
  onSelectSnippetForPrompt,
}) => {
  const [status, setStatus] = useState<DriveDSyncStatus | null>(null);
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'vault' | 'manual' | 'guide'>('vault');

  // Manual entry form state
  const [manualPrompt, setManualPrompt] = useState('');
  const [manualResponse, setManualResponse] = useState('');
  const [isSavingManual, setIsSavingManual] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [statusData, entriesData] = await Promise.all([
        fetchDriveDStatus(),
        fetchKnowledgeEntries(searchQuery),
      ]);
      setStatus(statusData);
      setEntries(entriesData.entries || []);
    } catch (err) {
      console.error('Error loading vault data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, searchQuery]);

  const handleSaveManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualPrompt.trim() || !manualResponse.trim()) return;
    setIsSavingManual(true);
    const success = await saveToDriveDVault(manualPrompt, manualResponse, 'manual-entry', 'ai_studio');
    setIsSavingManual(false);
    if (success) {
      setSaveSuccessMsg('Wissensdaten erfolgreich im Laufwerk D: Tresor abgelegt!');
      setManualPrompt('');
      setManualResponse('');
      setTimeout(() => setSaveSuccessMsg(''), 4000);
      loadData();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="drive-d-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        id="drive-d-modal-container"
        className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Laufwerk D: Wissens-Tresor
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  D:\OllamaKnowledge
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  Offline + Online RAG
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Sichert alle Google Gemini & AI Studio Antworten dauerhaft auf Laufwerk D: für Ollama
              </p>
            </div>
          </div>
          <button
            id="drive-d-modal-close-btn"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Storage Health Banner */}
        <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="font-semibold text-white">{status?.totalEntries || entries.length}</span>
              <span>Dokumente archiviert</span>
            </div>
            <div className="h-3 w-[1px] bg-slate-700" />
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="font-semibold text-white">
                {(((status?.totalBytes || 2400) / 1024)).toFixed(1)} KB
              </span>
              <span>Speichergröße</span>
            </div>
            <div className="h-3 w-[1px] bg-slate-700" />
            <div className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Auto-Sync aktiv (100% lokal gesichert)</span>
            </div>
          </div>

          {/* Quick Script Actions */}
          <div className="flex items-center gap-2">
            <a
              id="download-sync-bat-btn"
              href="/api/desktop/files/sync-to-drive-d.bat"
              download="sync-to-drive-d.bat"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-medium transition-colors"
              title="Windows Batch Script herunterladen, das den Ordner D:\OllamaKnowledge spiegelt"
            >
              <Download className="w-3 h-3" />
              <span>sync-to-drive-d.bat</span>
            </a>
            <a
              id="download-vault-jsonl-btn"
              href="/api/knowledge/export/jsonl"
              download="D_OllamaKnowledge_vault.jsonl"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium transition-colors"
            >
              <Download className="w-3 h-3" />
              <span>JSONL Export</span>
            </a>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 px-6 bg-slate-900/50">
          <button
            id="tab-vault-entries"
            onClick={() => setActiveTab('vault')}
            className={`py-2.5 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'vault'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FolderSync className="w-3.5 h-3.5" />
            Gespeicherte Cloud-Erkenntnisse ({entries.length})
          </button>
          <button
            id="tab-manual-entry"
            onClick={() => setActiveTab('manual')}
            className={`py-2.5 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'manual'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Eintrag manuell sichern
          </button>
          <button
            id="tab-offline-guide"
            onClick={() => setActiveTab('guide')}
            className={`py-2.5 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'guide'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Ollama Offline-Konfiguration (Windows 11)
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'vault' && (
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="vault-search-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Wissensspeicher auf Laufwerk D: durchsuchen (z.B. WebSocket, RAG, DSGVO)..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <button
                  onClick={loadData}
                  disabled={isLoading}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  Aktualisieren
                </button>
              </div>

              {/* Entries List */}
              {entries.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl bg-slate-950/40">
                  <HardDrive className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-300">Keine passenden Einträge gefunden</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Jede Anfrage an Google Gemini oder im Hybrid-Modus sichert automatisch nach D:\OllamaKnowledge.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-all text-xs"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <span className="font-semibold text-slate-200 text-sm block">
                            {entry.prompt}
                          </span>
                          <div className="flex items-center gap-2 mt-1 text-slate-400">
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-amber-300 font-mono">
                              {entry.model}
                            </span>
                            <span className="text-[11px]">{new Date(entry.timestamp).toLocaleString()}</span>
                            <span className="text-[11px] font-mono text-cyan-400">
                              {entry.targetPath}
                            </span>
                          </div>
                        </div>

                        {onSelectSnippetForPrompt && (
                          <button
                            onClick={() => {
                              onSelectSnippetForPrompt(entry.prompt);
                              onClose();
                            }}
                            className="px-2.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[11px] font-medium whitespace-nowrap transition-colors flex items-center gap-1"
                            title="Diesen Prompt im Chatfenster testen"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Im Chat testen
                          </button>
                        )}
                      </div>

                      <div className="bg-slate-900 p-3 rounded-lg border border-slate-800/80 text-slate-300 leading-relaxed max-h-36 overflow-y-auto">
                        {entry.response}
                      </div>

                      {entry.tags && entry.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {entry.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'manual' && (
            <form onSubmit={handleSaveManual} className="space-y-4">
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <h3 className="text-sm font-semibold text-white mb-1">
                  Wissen manuell für Ollama auf Laufwerk D: bereitstellen
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  Tragen Sie benutzerdefinierte AI Studio Prompts, Fachdokumentationen oder Best-Practices ein.
                  Diese werden sofort in <span className="font-mono text-cyan-400">D:\OllamaKnowledge</span> abgelegt.
                </p>

                {saveSuccessMsg && (
                  <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    {saveSuccessMsg}
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Thema / Fragestellung:
                    </label>
                    <input
                      type="text"
                      value={manualPrompt}
                      onChange={(e) => setManualPrompt(e.target.value)}
                      placeholder="z.B. Windows 11 Registry Tuning für minimale Audio-Latenz..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Gemini / AI Studio Erkenntnis & Antwort:
                    </label>
                    <textarea
                      rows={6}
                      value={manualResponse}
                      onChange={(e) => setManualResponse(e.target.value)}
                      placeholder="Fügen Sie hier die Ausarbeitung, Codeblöcke oder Fakten ein..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingManual}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors"
                  >
                    <FolderSync className={`w-3.5 h-3.5 ${isSavingManual ? 'animate-spin' : ''}`} />
                    {isSavingManual ? 'Speichere auf D:...' : 'Auf Laufwerk D: sichern'}
                  </button>
                </div>
              </div>
            </form>
          )}

          {activeTab === 'guide' && (
            <div className="space-y-4 text-xs">
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
                  <FileCode className="w-4 h-4" />
                  <span>Wie Ollama offline & online auf Laufwerk D: zugreift</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Ihr System synchronisiert alle von der Cloud generierten Inhalte automatisch im Format
                  <code className="mx-1 px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono">D:\OllamaKnowledge\gemini_*.md</code>.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="font-semibold text-emerald-400 block mb-1">
                      1. Automatischer Hybrid-RAG Modus
                    </span>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Bei jeder Frage an Ollama sucht die Workstation blitzschnell nach passenden Fakten auf Laufwerk D:.
                      Die Treffer werden dem lokalen Modell transparent als vertrauenswürdiger Kontext übergeben.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="font-semibold text-cyan-400 block mb-1">
                      2. Vollständige Offline-Autarkie
                    </span>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Selbst wenn keine Internetverbindung besteht, bleibt der Wissensstand von Laufwerk D: für
                      alle installierten Ollama-Modelle (z.B. Llama 3.2, Mistral, Qwen) 100% lokal abrufbar.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="font-semibold text-amber-300 block mb-1">
                    3. Optional: Ollama Modell mit dauerhaftem D:\ Modelfile backen
                  </span>
                  <p className="text-slate-400 text-[11px] leading-relaxed mb-2">
                    Möchten Sie ein spezielles Ollama Modell mit festem Systemprompt erzeugen, führen Sie in der Windows PowerShell aus:
                  </p>
                  <pre className="p-2.5 rounded bg-slate-950 font-mono text-[11px] text-slate-300 overflow-x-auto border border-slate-800">
{`# 1. Erstelle ein Modelfile mit Referenz auf Laufwerk D:
echo "FROM llama3.2:3b" > Modelfile
echo "SYSTEM Du bist ein lokaler Experte mit Zugriff auf D:\\OllamaKnowledge." >> Modelfile

# 2. Modell erstellen
ollama create hybrid-expert -f Modelfile`}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Dauerhafte Datensouveränität auf Windows 11</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
