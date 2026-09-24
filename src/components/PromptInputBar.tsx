import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Trash2,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Paperclip,
  Image as ImageIcon,
  Film,
  Music,
  FileText,
  FileCode,
  FileSpreadsheet,
  X,
  Volume2,
  Wand2,
  Palette,
  Video,
  FilePlus,
  Radio,
  Sliders,
} from 'lucide-react';
import { HybridMode, ChatFileAttachment, GenerationType } from '../types';
import { processFileForChat, formatBytes } from '../services/multimodalService';

interface Props {
  onSendMessage: (
    text: string,
    files?: ChatFileAttachment[],
    generationType?: GenerationType,
    aspectRatio?: string,
    voice?: string
  ) => void;
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
  const [attachedFiles, setAttachedFiles] = useState<ChatFileAttachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);

  // Multimodal Generation Settings
  const [generationType, setGenerationType] = useState<GenerationType>('chat');
  const [aspectRatio, setAspectRatio] = useState<string>('16:9');
  const [selectedVoice, setSelectedVoice] = useState<string>('Kore');
  const [showGenOptions, setShowGenOptions] = useState<boolean>(false);
  const [fileNotice, setFileNotice] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  const handleFilesSelected = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setIsProcessingFiles(true);
    setFileNotice(null);
    try {
      const processed: ChatFileAttachment[] = [];
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        if (file.size > 40 * 1024 * 1024) {
          setFileNotice(`Datei ${file.name} überschreitet das Limit von 40 MB.`);
          continue;
        }
        const item = await processFileForChat(file);
        processed.push(item);
      }
      setAttachedFiles((prev) => [...prev, ...processed]);
    } catch (err: any) {
      console.log('File processing note:', err);
    } finally {
      setIsProcessingFiles(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
      await handleFilesSelected(e.clipboardData.files);
    }
  };

  const handleRemoveFile = (id: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleFilesSelected(e.dataTransfer.files);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanText = input.trim();
    if ((!cleanText && attachedFiles.length === 0) || isLoading || isProcessingFiles) return;

    let effectiveGenType = generationType;
    if (effectiveGenType === 'chat' && cleanText) {
      const lower = cleanText.toLowerCase();
      if (/^(generiere|erstelle|erzeuge|zeichne|male)\s+(ein\s+)?(bild|image|illustration|grafik|foto)/i.test(cleanText) || lower.startsWith('/image') || lower.startsWith('/bild')) {
        effectiveGenType = 'image';
      } else if (/^(generiere|erstelle|erzeuge|drehe)\s+(ein\s+)?(video|film|clip|animation|motion)/i.test(cleanText) || lower.startsWith('/video') || lower.startsWith('/film')) {
        effectiveGenType = 'video';
      } else if (/^(generiere|erstelle|erzeuge|sprich)\s+(eine?\s+)?(audio|sprache|sprachausgabe|sound|stimme)/i.test(cleanText) || lower.startsWith('/audio') || lower.startsWith('/stimme')) {
        effectiveGenType = 'audio';
      } else if (/^(generiere|erstelle|erzeuge|exportiere)\s+(eine?\s+)?(daten|datensatz|csv|datei|excel|tabelle|json|code)/i.test(cleanText) || lower.startsWith('/data') || lower.startsWith('/datei')) {
        effectiveGenType = 'data';
      }
    }

    onSendMessage(
      cleanText || (effectiveGenType === 'image' ? 'Generiere ein Bild' : 'Analysiere diese Datei'),
      attachedFiles.length > 0 ? attachedFiles : undefined,
      effectiveGenType,
      aspectRatio,
      selectedVoice
    );

    setInput('');
    setAttachedFiles([]);
    setGenerationType('chat');
    setFileNotice(null);
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
      title: '🎨 Bild generieren',
      text: 'Generiere Bild: Eine futuristische hybride AI Cloud & Edge Architektur auf Windows 11 mit leuchtenden Neon-Verbindungen',
      action: () => setGenerationType('image'),
    },
    {
      title: '🎙️ Sprachausgabe',
      text: 'Generiere Sprache: Das System arbeitet stabil auf Windows 11 mit lokaler Offline-Ausfallsicherung.',
      action: () => setGenerationType('audio'),
    },
    {
      title: '🎬 Video-Storyboard',
      text: 'Generiere Video: Cinematic Trailer über neuromorphes Computing mit Intel Loihi 2 und SNN Spiking-Signalen',
      action: () => setGenerationType('video'),
    },
    {
      title: '📊 Daten-Export',
      text: 'Generiere Datei: Erstelle einen CSV-Datensatz mit Leistungsmetriken der 20 KI-Systeme',
      action: () => setGenerationType('data'),
    },
  ];

  const renderFileIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="w-3.5 h-3.5 text-cyan-400 shrink-0" />;
      case 'video':
        return <Film className="w-3.5 h-3.5 text-purple-400 shrink-0" />;
      case 'audio':
        return <Music className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
      case 'pdf':
        return <FileText className="w-3.5 h-3.5 text-rose-400 shrink-0" />;
      case 'code':
        return <FileCode className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
      case 'data':
        return <FileSpreadsheet className="w-3.5 h-3.5 text-teal-400 shrink-0" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
    }
  };

  return (
    <div
      className="space-y-1.5 relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Hidden File Input supporting all media and files */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*,audio/*,.pdf,.txt,.md,.json,.csv,.tsv,.py,.ts,.js,.jsx,.tsx,.html,.css,.xml"
        className="hidden"
        onChange={(e) => handleFilesSelected(e.target.files)}
      />

      {/* Drag & Drop Visual Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-cyan-950/90 border-2 border-dashed border-cyan-400 rounded-2xl flex flex-col items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <Paperclip className="w-8 h-8 text-cyan-400 animate-bounce mb-2" />
          <p className="text-sm font-semibold text-cyan-200">Dateien &amp; Medien hier ablegen</p>
          <p className="text-xs text-slate-400 mt-1">Bilder, Videos, Audio, PDFs &amp; Dokumente werden direkt analysiert</p>
        </div>
      )}

      {/* Quick Mode Switcher Bar */}
      <div className="flex items-center justify-between gap-1 overflow-x-auto text-[11px] pb-0.5 no-scrollbar">
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => {
              setGenerationType('chat');
              setShowGenOptions(false);
            }}
            className={`px-2.5 py-1 rounded-lg font-medium flex items-center gap-1.5 transition cursor-pointer ${
              generationType === 'chat'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs shadow-cyan-950/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-transparent'
            }`}
          >
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>Chat &amp; Datei-Analyse</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setGenerationType('image');
              setShowGenOptions(true);
            }}
            className={`px-2.5 py-1 rounded-lg font-medium flex items-center gap-1.5 transition cursor-pointer ${
              generationType === 'image'
                ? 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40 shadow-xs shadow-fuchsia-950/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-transparent'
            }`}
          >
            <Palette className="w-3 h-3 text-fuchsia-400" />
            <span>Bild generieren</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setGenerationType('audio');
              setShowGenOptions(true);
            }}
            className={`px-2.5 py-1 rounded-lg font-medium flex items-center gap-1.5 transition cursor-pointer ${
              generationType === 'audio'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs shadow-emerald-950/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-transparent'
            }`}
          >
            <Volume2 className="w-3 h-3 text-emerald-400" />
            <span>Sprache / Audio</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setGenerationType('video');
              setShowGenOptions(true);
            }}
            className={`px-2.5 py-1 rounded-lg font-medium flex items-center gap-1.5 transition cursor-pointer ${
              generationType === 'video'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-xs shadow-purple-950/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-transparent'
            }`}
          >
            <Video className="w-3 h-3 text-purple-400" />
            <span>Video &amp; Motion</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setGenerationType('data');
              setShowGenOptions(false);
            }}
            className={`px-2.5 py-1 rounded-lg font-medium flex items-center gap-1.5 transition cursor-pointer ${
              generationType === 'data'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs shadow-amber-950/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-transparent'
            }`}
          >
            <FilePlus className="w-3 h-3 text-amber-400" />
            <span>Daten &amp; Datei</span>
          </button>
        </div>

        {generationType !== 'chat' && (
          <button
            type="button"
            onClick={() => setShowGenOptions(!showGenOptions)}
            className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 ml-auto shrink-0"
          >
            <Sliders className="w-3 h-3" />
            <span>{showGenOptions ? 'Optionen verbergen' : 'Format / Stimme anpassen'}</span>
          </button>
        )}
      </div>

      {/* Multimodal Generation Parameters Drawer (Aspect Ratio / Voice) */}
      {showGenOptions && generationType !== 'chat' && (
        <div className="flex items-center gap-3 p-2 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-slate-300 animate-in fade-in duration-150">
          {(generationType === 'image' || generationType === 'video') && (
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-[11px] font-medium">Format:</span>
              {(['16:9', '1:1', '9:16', '4:3'] as const).map((ar) => (
                <button
                  key={ar}
                  type="button"
                  onClick={() => setAspectRatio(ar)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition cursor-pointer ${
                    aspectRatio === ar
                      ? 'bg-cyan-600 text-white font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {ar}
                </button>
              ))}
            </div>
          )}

          {generationType === 'audio' && (
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-[11px] font-medium">Stimme:</span>
              {(['Kore', 'Puck', 'Fenrir', 'Zephyr'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setSelectedVoice(v)}
                  className={`px-2 py-0.5 rounded text-[11px] transition cursor-pointer ${
                    selectedVoice === v
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          )}

          <span className="text-[10px] text-slate-500 ml-auto font-mono">
            D:\OllamaKnowledge\media
          </span>
        </div>
      )}

      {/* Optional Quick Prompt Chips */}
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
                if (qp.action) qp.action();
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

      {/* Attached Files Preview Tray */}
      {attachedFiles.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto p-2 bg-slate-950/80 border border-slate-800 rounded-xl no-scrollbar animate-in fade-in">
          <span className="text-[11px] text-cyan-400 font-medium shrink-0 pl-1">
            Angehängt ({attachedFiles.length}):
          </span>
          {attachedFiles.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700/80 text-slate-200 text-xs shrink-0 group relative shadow-sm"
            >
              {file.thumbnailUrl ? (
                <img
                  src={file.thumbnailUrl}
                  alt={file.name}
                  className="w-5 h-5 rounded object-cover"
                />
              ) : (
                renderFileIcon(file.type)
              )}
              <div className="flex flex-col max-w-[120px]">
                <span className="truncate text-[11px] font-medium leading-tight">{file.name}</span>
                <span className="text-[9px] text-slate-400 font-mono">
                  {formatBytes(file.size)}
                  {file.durationSeconds ? ` • ${file.durationSeconds}s` : ''}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveFile(file.id)}
                className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 ml-1 transition cursor-pointer"
                title="Datei entfernen"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* File Size Notice Banner */}
      {fileNotice && (
        <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-amber-950/80 border border-amber-600/50 rounded-xl text-amber-200 text-xs shadow-sm">
          <span>{fileNotice}</span>
          <button
            type="button"
            onClick={() => setFileNotice(null)}
            className="text-amber-400 hover:text-white p-0.5 rounded cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Input Box */}
      <form
        onSubmit={handleSubmit}
        className="bg-slate-900/95 border border-slate-800 focus-within:border-cyan-500/80 rounded-2xl p-2 sm:p-2.5 shadow-xl transition-all"
      >
        <div className="flex items-end gap-2">
          {/* File Attachment Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || isProcessingFiles}
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-slate-800 text-slate-400 hover:text-cyan-300 border border-slate-800 hover:border-cyan-500/40 transition cursor-pointer shrink-0 disabled:opacity-40"
            title="Dateien, Bilder, Videos oder Dokumente anfügen"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={
              generationType === 'image'
                ? 'Beschreibe das gewünschte Bild (z.B. "Ein futuristischer Quantencomputer im 3D-Stil mit Neoneffekten")...'
                : generationType === 'audio'
                ? 'Gib den Text ein, der als Sprachaudio synthetisiert werden soll...'
                : generationType === 'video'
                ? 'Beschreibe das Video / Storyboard (z.B. "Cinematische Drohnenaufnahme über ein Rechenzentrum")...'
                : generationType === 'data'
                ? 'Welche Daten oder Skripte sollen generiert werden (z.B. "CSV mit Verkaufszahlen" oder "Python ETL")...'
                : attachedFiles.length > 0
                ? `${attachedFiles.length} Datei(en) angehängt. Frage oder Anweisung eingeben...`
                : activeMode === 'matrix_swarm'
                ? 'Prompt für 20-KI-System Swarm Matrix eingeben (alle Systeme antworten simultan)...'
                : activeMode === 'solo_system'
                ? 'Nachricht direkt an das ausgewählte KI-System senden...'
                : activeMode === 'smart_router'
                ? 'Nachricht oder Multimodal-Anfrage eingeben (Smart Router wählt lokal oder Cloud)...'
                : 'Prompt für hybride Inferenz eingeben...'
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
              disabled={(!input.trim() && attachedFiles.length === 0) || isLoading || isProcessingFiles}
              className="px-4 h-9 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 disabled:opacity-40 text-white font-medium text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-cyan-950/40 transition-all cursor-pointer"
            >
              {isLoading || isProcessingFiles ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>{isProcessingFiles ? 'Lade Datei...' : 'Berechne...'}</span>
                </>
              ) : generationType === 'image' ? (
                <>
                  <Palette className="w-3.5 h-3.5" />
                  <span>Bild erzeugen</span>
                </>
              ) : generationType === 'audio' ? (
                <>
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Audio erzeugen</span>
                </>
              ) : generationType === 'video' ? (
                <>
                  <Video className="w-3.5 h-3.5" />
                  <span>Video erzeugen</span>
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
            <kbd className="font-mono bg-slate-800 px-1 py-0.5 rounded text-[10px] text-slate-300">Enter</kbd> zum Senden, <kbd className="font-mono bg-slate-800 px-1 py-0.5 rounded text-[10px] text-slate-300">Shift+Enter</kbd> für neue Zeile • Drag &amp; Drop aktiv
          </span>
          <span className="shrink-0 ml-2">
            Modus: <strong className="text-cyan-300 font-medium">{generationType !== 'chat' ? generationType.toUpperCase() : activeMode}</strong>
          </span>
        </div>
      </form>
    </div>
  );
};
