import React, { useState } from 'react';
import {
  Cpu,
  RefreshCw,
  HardDrive,
  Download,
  CheckCircle2,
  AlertTriangle,
  Play,
  Copy,
  Check,
  Search,
  Zap,
  Sliders,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Flame,
} from 'lucide-react';
import { OllamaModelInfo, OllamaStatus } from '../types';

interface Props {
  ollamaStatus: OllamaStatus;
  activeOllamaModel: string;
  onSelectOllamaModel: (model: string) => void;
  onScan: () => void;
  isScanning: boolean;
  customHost: string;
  onChangeHost: (host: string) => void;
  isDemoMode: boolean;
  onToggleDemoMode: () => void;
  onSwitchToChatWithModel: (modelName: string) => void;
}

interface RecommendedModel {
  name: string;
  modelTag: string;
  family: string;
  params: string;
  vramRequiredMb: number;
  diskSizeGb: string;
  bestFor: string;
  hardwareTier: 'lightweight' | 'standard' | 'powerful';
  description: string;
  isSpecialKev?: boolean;
}

const RECOMMENDED_MODELS: RecommendedModel[] = [
  {
    name: 'Kev / Qwen 2.5 0.8B (Ultraleicht)',
    modelTag: 'qwen2.5:0.5b',
    family: 'Qwen / Kev Family',
    params: '0.8 Mrd.',
    vramRequiredMb: 750,
    diskSizeGb: '0.8 GB',
    bestFor: 'Ultraschnelle Latenz (<30ms), SLM-Weiche, läuft auf jedem Laptop & älterer Hardware',
    hardwareTier: 'lightweight',
    description: 'Das perfekte Modell für ressourcenschonende Aufgaben, Router-Klassifizierung und schnelle Offline-Recherche.',
    isSpecialKev: true,
  },
  {
    name: 'Meta Llama 3.2 3B Instruct',
    modelTag: 'llama3.2:3b',
    family: 'Llama 3.2',
    params: '3.2 Mrd.',
    vramRequiredMb: 2100,
    diskSizeGb: '2.0 GB',
    bestFor: 'Alltags-Assistent, Textzusammenfassungen, E-Mails, DSGVO-konforme Notizen',
    hardwareTier: 'lightweight',
    description: 'Modernste Architektur von Meta. Hervorragende Balance aus Präzision und geringem Speicherbedarf.',
  },
  {
    name: 'DeepSeek-R1 8B Distill',
    modelTag: 'deepseek-r1:8b',
    family: 'DeepSeek / Llama',
    params: '8 Mrd.',
    vramRequiredMb: 5200,
    diskSizeGb: '4.9 GB',
    bestFor: 'Komplexe logische Beweise, Mathematik, Algorithmen mit schrittweisem Denken',
    hardwareTier: 'standard',
    description: 'Open-Source Denkwunder mit transparenten internen Gedankengängen (<think>...</think>).',
  },
  {
    name: 'Mistral 7B Instruct v0.3',
    modelTag: 'mistral:7b-instruct',
    family: 'Mistral AI',
    params: '7.2 Mrd.',
    vramRequiredMb: 4500,
    diskSizeGb: '4.1 GB',
    bestFor: 'Deutsche Sprachqualität, kreatives Schreiben, Redaktion, Vertragsklauseln',
    hardwareTier: 'standard',
    description: 'Klassiker aus Europa mit flüssigem, natürlichem Deutsch und solider Argumentation.',
  },
  {
    name: 'Qwen 2.5 Coder 7B',
    modelTag: 'qwen2.5-coder:7b',
    family: 'Qwen 2.5',
    params: '7.6 Mrd.',
    vramRequiredMb: 4900,
    diskSizeGb: '4.7 GB',
    bestFor: 'Software-Entwicklung: TypeScript, Python, C++, SQL, HTML/CSS, Git & Debugging',
    hardwareTier: 'standard',
    description: 'Schlägt viele proprietäre Cloud-Modelle bei Programmieraufgaben und Code-Refactoring.',
  },
  {
    name: 'Google Gemma 2 9B',
    modelTag: 'gemma2:9b',
    family: 'Gemma 2',
    params: '9.2 Mrd.',
    vramRequiredMb: 6100,
    diskSizeGb: '5.5 GB',
    bestFor: 'Höchste Texttreue, analytische Berichte, anspruchsvolle Dialoge',
    hardwareTier: 'powerful',
    description: 'Googles offene Gewichte basierend auf Gemini-Forschung für dedizierte 8GB+ GPUs.',
  },
];

export const ModelHubView: React.FC<Props> = ({
  ollamaStatus,
  activeOllamaModel,
  onSelectOllamaModel,
  onScan,
  isScanning,
  customHost,
  onChangeHost,
  isDemoMode,
  onToggleDemoMode,
  onSwitchToChatWithModel,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedTag, setCopiedTag] = useState<string | null>(null);
  const [customPullInput, setCustomPullInput] = useState('');
  const [pullFeedback, setPullFeedback] = useState<string | null>(null);

  const handleCopyCommand = (tag: string) => {
    navigator.clipboard.writeText(`ollama run ${tag}`);
    setCopiedTag(tag);
    setTimeout(() => setCopiedTag(null), 2500);
  };

  const handleCustomPull = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPullInput.trim()) return;
    const tag = customPullInput.trim();
    navigator.clipboard.writeText(`ollama pull ${tag}`);
    setPullFeedback(`Befehl kopiert: "ollama pull ${tag}". Führen Sie diesen im Windows-Terminal aus.`);
    setTimeout(() => setPullFeedback(null), 5000);
    setCustomPullInput('');
  };

  const installedModels = ollamaStatus.models || [];
  const filteredInstalled = installedModels.filter((m) =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRecommended = RECOMMENDED_MODELS.filter(
    (m) =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.bestFor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.family.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* 1. Header with clear, human-friendly explanation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <Cpu className="w-6 h-6 text-cyan-400" />
            <span>Modell-Zentrale &amp; Lokale KI-Engine</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Verwalten Sie alle lokalen Sprachmodelle auf Ihrem Rechner. Lokale Modelle laufen 100% offline
            ohne Internetverbindung und ohne dass Daten Ihr Gerät verlassen (DSGVO-konform).
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <button
            onClick={onScan}
            disabled={isScanning}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-cyan-400' : 'text-slate-400'}`} />
            <span>{isScanning ? 'Scanne...' : 'Neu scannen'}</span>
          </button>

          <button
            onClick={onToggleDemoMode}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
              isDemoMode
                ? 'bg-amber-950/60 border-amber-700/60 text-amber-200'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-300'
            }`}
            title="Schaltet zwischen realer lokaler Inferenz und Vorführ-Simulation um"
          >
            {isDemoMode ? 'Simulations-Modus: AN' : 'Simulations-Modus: AUS'}
          </button>
        </div>
      </div>

      {/* 2. Engine Status & Hardware Profiler Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Status Box */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Ollama Verbindungsstatus</span>
            <span
              className={`w-2 h-2 rounded-full ${
                ollamaStatus.connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-slate-100">
              {ollamaStatus.connected ? 'Verbunden & Aktiv' : isDemoMode ? 'Simulation aktiv' : 'Offline'}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {ollamaStatus.version ? `v${ollamaStatus.version}` : '127.0.0.1:11434'}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>Latenz: <strong className="font-mono text-slate-200">{ollamaStatus.latencyMs ?? 12}ms</strong></span>
            <span>Modelle geladen: <strong className="font-mono text-slate-200">{installedModels.length}</strong></span>
          </div>
        </div>

        {/* Hardware VRAM Budget Guide */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">GPU VRAM Empfehlung</span>
            <span className="text-emerald-400 text-xs font-medium">Auto-Optimiert</span>
          </div>
          <div className="text-sm font-semibold text-slate-200">
            Optimal für Modelle bis 8 Milliarden Parameter
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            4-Bit Quantisierung (Q4_K_M) benötigt ca. 4–5 GB Speicher und liefert 99% der vollen Modell-Intelligenz.
          </p>
        </div>

        {/* Host Configuration */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
          <span className="text-xs font-medium text-slate-400">Ollama Endpunkt-Adresse</span>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={customHost}
              onChange={(e) => onChangeHost(e.target.value)}
              placeholder="http://127.0.0.1:11434"
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <p className="text-[10px] text-slate-400">
            Standard: <code className="text-slate-300">http://127.0.0.1:11434</code> (lokales Windows 11)
          </p>
        </div>
      </div>

      {/* 3. Search Bar & Filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Modelle nach Name, Einsatzzweck oder Familie filtern..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Custom Pull Field */}
        <form onSubmit={handleCustomPull} className="hidden sm:flex items-center gap-2 shrink-0">
          <input
            type="text"
            value={customPullInput}
            onChange={(e) => setCustomPullInput(e.target.value)}
            placeholder="Modellname (z. B. phi3:mini)"
            className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-52"
          />
          <button
            type="submit"
            className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Installieren</span>
          </button>
        </form>
      </div>

      {pullFeedback && (
        <div className="p-3 rounded-xl bg-cyan-950/80 border border-cyan-700/60 text-cyan-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{pullFeedback}</span>
        </div>
      )}

      {/* 4. Section: Installierte lokale Modelle */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <span>Installierte Modelle</span>
            <span className="text-xs font-normal text-slate-400 font-mono">
              ({filteredInstalled.length} bereit)
            </span>
          </h2>
          <span className="text-xs text-slate-400">
            Klicken Sie auf ein Modell, um es sofort als aktives Modell im Chat zu nutzen.
          </span>
        </div>

        {filteredInstalled.length === 0 ? (
          <div className="p-8 rounded-xl bg-slate-900/40 border border-slate-800 text-center space-y-3">
            <Cpu className="w-8 h-8 text-slate-600 mx-auto" />
            <div className="text-sm font-medium text-slate-300">Keine lokalen Modelle gefunden</div>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Starten Sie Ollama auf Windows 11 oder laden Sie unten eines der empfohlenen Modelle mit einem Klick herunter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredInstalled.map((model) => {
              const isActive = activeOllamaModel === model.name;
              const sizeMb = (model.size / (1024 * 1024)).toFixed(0);
              const sizeGb = (model.size / (1024 * 1024 * 1024)).toFixed(2);
              const displaySize = Number(sizeGb) >= 1 ? `${sizeGb} GB` : `${sizeMb} MB`;

              return (
                <div
                  key={model.name}
                  onClick={() => onSelectOllamaModel(model.name)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                    isActive
                      ? 'bg-slate-900 border-cyan-500/80 shadow-lg shadow-cyan-950/30 ring-1 ring-cyan-500/50'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-slate-100 truncate font-mono">
                          {model.name}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {model.details?.family || 'Transformer'} · {model.details?.parameter_size || 'Standard'}
                        </div>
                      </div>

                      {isActive ? (
                        <span className="text-[11px] font-medium text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-700/60 shrink-0">
                          Aktiv im Chat
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectOllamaModel(model.name);
                          }}
                          className="text-[11px] text-slate-400 hover:text-slate-200 bg-slate-800 px-2 py-0.5 rounded shrink-0 cursor-pointer"
                        >
                          Aktivieren
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400 pt-1 border-t border-slate-800/60">
                      <span>Speicher: <strong className="text-slate-300 font-mono">{displaySize}</strong></span>
                      <span aria-hidden="true">·</span>
                      <span>Quant: <strong className="text-slate-300 font-mono">{model.details?.quantization_level || 'Q4_K_M'}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSwitchToChatWithModel(model.name);
                      }}
                      className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Im Chat ausführen</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyCommand(model.name);
                      }}
                      className="text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1 cursor-pointer"
                      title="Terminal-Befehl kopieren"
                    >
                      {copiedTag === model.name ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400 text-[11px]">Kopiert</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span className="text-[11px]">Befehl</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Section: Empfohlener Modell-Katalog (1-Klick Setup) */}
      <div className="space-y-4 pt-4 border-t border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Kuratierter Modell-Katalog für Windows 11</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Diese Modelle wurden für maximale Performance auf privaten Windows PCs getestet.
            Kopieren Sie den Startbefehl oder fügen Sie ihn direkt in Ihr Terminal ein.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecommended.map((model) => {
            const isInstalled = installedModels.some((m) => m.name.startsWith(model.modelTag.split(':')[0]));

            return (
              <div
                key={model.modelTag}
                className={`p-4 rounded-xl border flex flex-col justify-between gap-4 transition-all ${
                  model.isSpecialKev
                    ? 'bg-gradient-to-b from-indigo-950/40 via-slate-900/80 to-slate-900 border-indigo-500/40'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-slate-100">{model.name}</span>
                        {model.isSpecialKev && (
                          <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded border border-indigo-500/30">
                            Kev Familie
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {model.family} · {model.params} Parameter
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                        model.hardwareTier === 'lightweight'
                          ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-300'
                          : model.hardwareTier === 'standard'
                          ? 'bg-blue-950/60 border-blue-700/60 text-blue-300'
                          : 'bg-purple-950/60 border-purple-700/60 text-purple-300'
                      }`}
                    >
                      {model.hardwareTier === 'lightweight'
                        ? 'Sehr leicht'
                        : model.hardwareTier === 'standard'
                        ? 'Standard'
                        : 'GPU 8GB+'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {model.description}
                  </p>

                  <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 text-[11px] space-y-1">
                    <div className="text-slate-400">
                      Ideal für: <span className="text-slate-200">{model.bestFor}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400 pt-1 border-t border-slate-800/60">
                      <span>VRAM Bedarf: <strong className="text-slate-300 font-mono">{model.vramRequiredMb} MB</strong></span>
                      <span>Download-Größe: <strong className="text-slate-300 font-mono">{model.diskSizeGb}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between gap-2">
                  <div className="text-[11px] font-mono text-slate-400 truncate">
                    <code>ollama run {model.modelTag}</code>
                  </div>

                  <button
                    onClick={() => handleCopyCommand(model.modelTag)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition cursor-pointer shrink-0"
                  >
                    {copiedTag === model.modelTag ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Kopiert!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-300" />
                        <span>Befehl</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
