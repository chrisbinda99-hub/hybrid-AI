import React, { useState } from 'react';
import {
  Cpu,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  HardDrive,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Terminal,
  Copy,
  Check,
  Zap,
} from 'lucide-react';
import { OllamaModelInfo, OllamaStatus } from '../types';

interface Props {
  status: OllamaStatus;
  isScanning: boolean;
  onScan: () => void;
  activeModel: string;
  onSelectModel: (model: string) => void;
  isDemoMode: boolean;
  onToggleDemoMode: () => void;
  customHost: string;
  onChangeHost: (host: string) => void;
}

export const DetectionPanel: React.FC<Props> = ({
  status,
  isScanning,
  onScan,
  activeModel,
  onSelectModel,
  isDemoMode,
  onToggleDemoMode,
  customHost,
  onChangeHost,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showWinGuide, setShowWinGuide] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(1)} GB`;
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-sm text-slate-200">
      <div className="flex items-center justify-between gap-3">
        {/* Left: Status and Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center border ${
              status.connected
                ? 'bg-emerald-950/70 border-emerald-600/50 text-emerald-400'
                : isDemoMode
                ? 'bg-amber-950/70 border-amber-600/50 text-amber-400'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <Cpu className="w-5 h-5" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-slate-100 truncate">
                Ollama Windows 11 Erkennung
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                  status.connected
                    ? 'bg-emerald-950/70 text-emerald-300 border-emerald-700/60'
                    : isDemoMode
                    ? 'bg-amber-950/70 text-amber-300 border-amber-700/60'
                    : 'bg-rose-950/70 text-rose-300 border-rose-700/60'
                }`}
              >
                {status.connected ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    Verbunden ({status.latencyMs ?? 5}ms)
                  </>
                ) : isDemoMode ? (
                  <>
                    <Zap className="w-3 h-3 text-amber-400" />
                    Simulations-Modus
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3 h-3 text-rose-400" />
                    Offline (Nicht gestartet)
                  </>
                )}
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate mt-0.5">
              Host: <code className="text-slate-300 font-mono">{customHost}</code>
              {status.version && ` • Version ${status.version}`}
              {status.models.length > 0 && ` • ${status.models.length} Modelle gefunden`}
            </p>
          </div>
        </div>

        {/* Right: Quick actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onScan}
            disabled={isScanning}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-xs font-medium text-slate-200 rounded-lg border border-slate-700 transition"
            title="Lokales Windows 11 Ollama neu scannen"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-cyan-400' : ''}`} />
            <span className="hidden sm:inline">Auto-Scan</span>
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-xs text-slate-300 rounded-lg border border-slate-700/60 transition"
            title="Einstellungen und Modell-Verwaltung"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded details & configuration */}
      {isExpanded && (
        <div className="mt-3.5 pt-3.5 border-t border-slate-800 space-y-3">
          {/* Model Selector and Host Input */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Aktives lokales Modell</label>
              <select
                value={activeModel}
                onChange={(e) => onSelectModel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
              >
                {status.models.map((m: OllamaModelInfo) => (
                  <option key={m.name} value={m.name}>
                    {m.name} ({formatSize(m.size)} {m.details?.quantization_level ? `• ${m.details.quantization_level}` : ''})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Ollama Host-Adresse (Windows 11)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customHost}
                  onChange={(e) => onChangeHost(e.target.value)}
                  placeholder="http://127.0.0.1:11434"
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono text-xs"
                />
                <button
                  onClick={onScan}
                  className="px-2.5 py-1.5 bg-cyan-700/80 hover:bg-cyan-600 text-white rounded-lg font-medium transition"
                >
                  Testen
                </button>
              </div>
            </div>
          </div>

          {/* Installed Models Grid */}
          {status.models.length > 0 && (
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="font-medium">Erkannte Modelle auf Ihrer Festplatte:</span>
                <span>{status.models.length} verfügbar</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 max-h-36 overflow-y-auto pr-1">
                {status.models.map((m) => {
                  const isSelected = m.name === activeModel;
                  return (
                    <button
                      key={m.name}
                      onClick={() => onSelectModel(m.name)}
                      className={`text-left p-2 rounded-lg border text-xs transition ${
                        isSelected
                          ? 'bg-cyan-950/60 border-cyan-500/80 text-cyan-200 shadow-sm'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="font-mono font-medium truncate">{m.name}</div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1">
                        <HardDrive className="w-3 h-3" />
                        <span>{formatSize(m.size)}</span>
                        {m.details?.parameter_size && <span>• {m.details.parameter_size}</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Toggle Demo Mode & Windows Guide Button */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
            <div className="flex items-center gap-2">
              <button
                onClick={onToggleDemoMode}
                className={`px-2.5 py-1 text-xs rounded-md border font-medium transition ${
                  isDemoMode
                    ? 'bg-amber-950/60 border-amber-600/70 text-amber-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                {isDemoMode ? '✓ Simulation aktiv (Offline-Test)' : 'Simulation aktivieren'}
              </button>
              <span className="text-[11px] text-slate-500">
                (Erlaubt Testen auch wenn Ollama noch nicht lokal gestartet ist)
              </span>
            </div>

            <button
              onClick={() => setShowWinGuide(!showWinGuide)}
              className="text-xs text-cyan-400 hover:text-cyan-300 underline font-medium"
            >
              {showWinGuide ? 'Windows 11 Anleitung schließen' : 'Windows 11 Einrichtungs-Hilfe anzeigen'}
            </button>
          </div>

          {/* Windows 11 Quickstart Guide */}
          {showWinGuide && (
            <div className="bg-slate-950 rounded-lg p-3 border border-slate-800 text-xs space-y-2.5 mt-2">
              <div className="flex items-center gap-2 font-semibold text-cyan-300">
                <Terminal className="w-4 h-4" />
                <span>Ollama auf Windows 11 optimal einrichten</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Damit die Hybrid Workstation und Browser-Apps direkt mit Ihrem lokalen Ollama kommunizieren können, aktivieren Sie bitte CORS für Ihren Windows-Benutzer:
              </p>

              <div className="space-y-1.5 font-mono text-[11px]">
                <div className="flex items-center justify-between bg-slate-900 px-2.5 py-1.5 rounded border border-slate-800">
                  <span className="text-slate-300 select-all">setx OLLAMA_ORIGINS "*"</span>
                  <button
                    onClick={() => copyToClipboard('setx OLLAMA_ORIGINS "*"', 'setx')}
                    className="text-slate-400 hover:text-slate-200 flex items-center gap-1 text-[10px]"
                  >
                    {copiedCmd === 'setx' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>Kopieren</span>
                  </button>
                </div>

                <div className="flex items-center justify-between bg-slate-900 px-2.5 py-1.5 rounded border border-slate-800">
                  <span className="text-slate-300 select-all">ollama run llama3.2</span>
                  <button
                    onClick={() => copyToClipboard('ollama run llama3.2', 'run')}
                    className="text-slate-400 hover:text-slate-200 flex items-center gap-1 text-[10px]"
                  >
                    {copiedCmd === 'run' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>Kopieren</span>
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-slate-400">
                Nach dem Setzen von <code className="text-cyan-300">OLLAMA_ORIGINS</code> Ollama im Windows-Infobereich (System-Tray) rechts unten neu starten.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
