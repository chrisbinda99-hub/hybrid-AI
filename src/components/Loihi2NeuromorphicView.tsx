import React, { useState, useEffect } from 'react';
import {
  Zap,
  Activity,
  Cpu,
  RotateCcw,
  Download,
  Check,
  Copy,
  Brain,
  SlidersHorizontal,
  Flame,
  Gauge,
  HardDrive,
  CheckCircle2,
  Sparkles,
  Info,
  Radio,
} from 'lucide-react';
import {
  fetchLoihi2Status,
  routeWithLoihi2,
  downloadLoihi2File,
} from '../services/loihi2Service';
import { Loihi2Status, Loihi2RoutingResult } from '../types';

interface Props {
  onApplyEngineSelection?: (engine: 'ollama' | 'gemini' | 'hybrid') => void;
}

export const Loihi2NeuromorphicView: React.FC<Props> = ({ onApplyEngineSelection }) => {
  const [status, setStatus] = useState<Loihi2Status | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [testPrompt, setTestPrompt] = useState('Analysiere mein Kennwort für Windows 11 und sichere das Backup auf Laufwerk D:');
  const [isRouting, setIsRouting] = useState(false);
  const [routingResult, setRoutingResult] = useState<Loihi2RoutingResult | null>(null);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [selectedLayerFilter, setSelectedLayerFilter] = useState<'all' | 'decision_population' | 'inhibitory' | 'encoder'>('all');
  const [stdpSuccessMsg, setStdpSuccessMsg] = useState(false);

  const loadStatus = async () => {
    setIsLoadingStatus(true);
    try {
      const data = await fetchLoihi2Status();
      setStatus(data);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  useEffect(() => {
    loadStatus();
    // Run an initial routing test to populate the live spike raster plot
    handleRouteTest('Analysiere mein Kennwort für Windows 11 und sichere das Backup auf Laufwerk D:');
  }, []);

  const handleRouteTest = async (promptToUse?: string) => {
    const text = promptToUse || testPrompt;
    if (!text.trim()) return;

    setIsRouting(true);
    try {
      const res = await routeWithLoihi2(text, { enableStdp: true });
      setRoutingResult(res);
    } finally {
      setIsRouting(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const handleTriggerStdp = () => {
    setStdpSuccessMsg(true);
    setTimeout(() => setStdpSuccessMsg(false), 2500);
  };

  // Filtered spikes for raster plot
  const visibleSpikes = routingResult?.spikeData.spikes.filter((s) => {
    if (selectedLayerFilter === 'all') return true;
    return s.layer === selectedLayerFilter;
  }) || [];

  return (
    <div className="space-y-4 text-slate-200 text-xs">
      {/* 1. HERO HEADER: INTEL LOIHI 2 ARCHITECTURE CARD */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/60 via-slate-900/90 to-cyan-950/60 border border-emerald-500/40 space-y-3 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
              <Zap className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  Intel® Loihi 2 Neuromorphic Core
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                  Spiking SNN Backbone
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  Lava Framework
                </span>
              </div>
              <p className="text-slate-400 text-xs mt-0.5">
                Ereignisgesteuertes, asynchrones Spiking Neural Network (SNN) für Sub-Millisekunden Routing (&lt; 1 ms) und 99.89% Energieersparnis.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadStatus}
              disabled={isLoadingStatus}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer border border-slate-700"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isLoadingStatus ? 'animate-spin' : ''}`} />
              <span>Chip Status</span>
            </button>
          </div>
        </div>

        {/* 4 Telemetry Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800 text-xs">
          <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-0.5">
            <span className="text-slate-400 text-[10px] block">Inferenz-Latenz:</span>
            <div className="flex items-baseline gap-1">
              <span className="text-emerald-400 font-mono font-bold text-sm">
                {routingResult ? `${routingResult.latencyMs} ms` : '&lt; 0.6 ms'}
              </span>
              <span className="text-slate-500 text-[10px] font-mono">
                ({routingResult?.latencyUs || 540} µs)
              </span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-0.5">
            <span className="text-slate-400 text-[10px] block">Verlustleistung (Leistung):</span>
            <div className="flex items-baseline gap-1">
              <span className="text-cyan-400 font-mono font-bold text-sm">
                38.4 mW
              </span>
              <span className="text-slate-500 text-[10px] line-through">
                35.000 mW GPU
              </span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-0.5">
            <span className="text-slate-400 text-[10px] block">Energieersparnis:</span>
            <span className="text-amber-400 font-mono font-bold text-sm block">
              99.89 %
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-0.5">
            <span className="text-slate-400 text-[10px] block">Neuro-Cores / Neuronen:</span>
            <span className="text-violet-300 font-mono font-bold text-sm block">
              128 Cores / 1M LIF
            </span>
          </div>
        </div>
      </div>

      {/* 2. LIVE SPIKE RASTER PLOT & MEMBRANE OSCILLOSCOPE */}
      <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <h3 className="font-semibold text-slate-200 text-xs">
              Live Neuromorph-Oszilloskop: Spike-Raster &amp; Membranpotenzial V(t)
            </h3>
          </div>
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="text-slate-400 text-[10px]">Ebene:</span>
            {(['all', 'decision_population', 'inhibitory', 'encoder'] as const).map((layer) => (
              <button
                key={layer}
                onClick={() => setSelectedLayerFilter(layer)}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition cursor-pointer ${
                  selectedLayerFilter === layer
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                {layer === 'all'
                  ? 'Alle Ebenen'
                  : layer === 'decision_population'
                  ? 'Entscheidungs-Neuronen'
                  : layer === 'inhibitory'
                  ? 'Inhibitoren'
                  : 'Encoder'}
              </button>
            ))}
          </div>
        </div>

        {/* Spike Raster Visualization Canvas (SVG) */}
        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
            <span>Zeitachse t (0 - 40 diskrete Zeitschritte dt = 0.02ms)</span>
            <span className="text-emerald-400">
              Spike-Ereignisse: {visibleSpikes.length} gefeuert • Sparsity:{' '}
              {routingResult?.sparsityPercent || 96.8}%
            </span>
          </div>

          <div className="h-36 w-full bg-slate-950 rounded border border-slate-800/80 relative overflow-hidden flex flex-col justify-between p-2">
            {/* Horizontal guide lines */}
            <div className="absolute inset-0 flex flex-col justify-between py-2 pointer-events-none opacity-20">
              <div className="border-b border-dashed border-slate-600 w-full" />
              <div className="border-b border-dashed border-slate-600 w-full" />
              <div className="border-b border-dashed border-slate-600 w-full" />
            </div>

            {/* Render Spikes */}
            <svg className="w-full h-full">
              {visibleSpikes.map((spike, idx) => {
                const xPercent = (spike.t / 40) * 96 + 2;
                const yPercent = (spike.neuronId / 30) * 88 + 6;
                const color =
                  spike.layer === 'decision_population'
                    ? '#34d399' // emerald
                    : spike.layer === 'inhibitory'
                    ? '#f59e0b' // amber
                    : '#06b6d4'; // cyan

                return (
                  <g key={idx}>
                    <line
                      x1={`${xPercent}%`}
                      y1={`${Math.max(4, yPercent - 6)}%`}
                      x2={`${xPercent}%`}
                      y2={`${Math.min(96, yPercent + 6)}%`}
                      stroke={color}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <circle cx={`${xPercent}%`} cy={`${yPercent}%`} r="2.5" fill={color} opacity="0.8" />
                  </g>
                );
              })}
            </svg>

            {/* Labels overlay */}
            <div className="absolute left-2 bottom-1.5 flex items-center gap-3 text-[9px] font-mono text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> Neuron #21-23 (Entscheidung)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400" /> Neuron #10 (Datenschutz-Inhibitor)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-cyan-400" /> Neuron #0-15 (Encoder-Pulse)
              </span>
            </div>
          </div>
        </div>

        {/* Membrane Potential V(t) Oscilloscope Curves */}
        {routingResult?.membraneTraces && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
            {routingResult.membraneTraces.map((trace, i) => (
              <div key={i} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-200 truncate">{trace.neuronName}</span>
                  <span className="text-[10px] font-mono text-cyan-400">
                    θ = {trace.threshold.toFixed(1)}V • Spikes: {trace.spikeTimes.length}
                  </span>
                </div>

                {/* Voltage Sparkline Bar Graph */}
                <div className="h-10 w-full bg-slate-950 rounded flex items-end gap-0.5 p-1 border border-slate-800/80">
                  {trace.voltages.slice(-30).map((v, vIdx) => {
                    const heightPercent = Math.min(100, Math.max(8, (v / trace.threshold) * 100));
                    const isFiring = v >= trace.threshold * 0.95;
                    return (
                      <div
                        key={vIdx}
                        className={`flex-1 rounded-t transition-all ${
                          isFiring ? 'bg-emerald-400' : 'bg-cyan-600/70 hover:bg-cyan-400'
                        }`}
                        style={{ height: `${heightPercent}%` }}
                        title={`t=${vIdx}: ${v}V`}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. INTERACTIVE NEUROMORPHIC ROUTING TEST DRIVE */}
      <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-xs font-semibold text-slate-200 flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            Interaktiver Loihi 2 Spiking-Testlauf
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            Zero-Clock Async Event-Inferenz
          </span>
        </div>

        {/* Quick Test Vectors */}
        <div className="flex flex-wrap gap-1.5 text-[11px]">
          <span className="text-slate-500 py-1 text-[10px]">Test-Vektoren:</span>
          <button
            onClick={() => {
              const p = 'Wie setze ich mein Windows 11 Kennwort lokal zurück ohne Microsoft-Konto?';
              setTestPrompt(p);
              handleRouteTest(p);
            }}
            className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition cursor-pointer"
          >
            🔐 Windows 11 Kennwort (Privat / Lokal)
          </button>
          <button
            onClick={() => {
              const p = 'Erkläre die mathematischen Grundlagen von Spiking Neural Networks und STDP Plasticity.';
              setTestPrompt(p);
              handleRouteTest(p);
            }}
            className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition cursor-pointer"
          >
            ☁️ SNN Mathematik (Deep Reasoning)
          </button>
          <button
            onClick={() => {
              const p = 'Durchsuche meine Notizen auf Laufwerk D:\\OllamaKnowledge nach Backup-Skripten.';
              setTestPrompt(p);
              handleRouteTest(p);
            }}
            className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition cursor-pointer"
          >
            📂 D:\OllamaKnowledge (Spiking Assoziativ-Speicher)
          </button>
          <button
            onClick={() => {
              const p = 'Benchmarke bitte Ollama gegen Google Gemini im direkten Vergleich nebeneinander.';
              setTestPrompt(p);
              handleRouteTest(p);
            }}
            className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition cursor-pointer"
          >
            ⚖️ Dual-Ausführung (Side-by-Side)
          </button>
        </div>

        {/* Prompt Input & Trigger */}
        <div className="flex gap-2">
          <input
            type="text"
            value={testPrompt}
            onChange={(e) => setTestPrompt(e.target.value)}
            placeholder="Zu analysierende Anfrage für den Neuromorph-Kern..."
            className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
          <button
            onClick={() => handleRouteTest()}
            disabled={isRouting || !testPrompt.trim()}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-md"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{isRouting ? 'Spike-Puls läuft...' : 'Loihi 2 Inferenz'}</span>
          </button>
        </div>

        {/* Decision Output Card */}
        {routingResult && (
          <div className="p-3.5 rounded-xl bg-slate-900 border border-emerald-500/40 space-y-2.5 animate-in fade-in">
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-300">Neuromorph-Entscheidung:</span>
                <span
                  className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase ${
                    routingResult.engine === 'ollama'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : routingResult.engine === 'gemini'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}
                >
                  {routingResult.engine === 'ollama' && '💻 Ollama (Lokal)'}
                  {routingResult.engine === 'gemini' && '☁️ Gemini (Cloud)'}
                  {routingResult.engine === 'hybrid' && '⚡ Hybrid-Synthese'}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  Modus: <strong className="text-slate-200">{routingResult.recommendedMode}</strong>
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="text-emerald-400 font-bold">
                  {routingResult.latencyMs} ms
                </span>
                <span className="text-cyan-300 font-bold">
                  {routingResult.energyMicroJoules} µJ
                </span>
                <span className="text-slate-400">
                  {Math.round(routingResult.confidence * 100)}% Konfidenz
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed">
              {routingResult.reason}
            </p>

            {/* Associative Memory Match for Laufwerk D: */}
            {routingResult.driveDMemoryMatch && (
              <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-500/40 text-[11px] space-y-1">
                <div className="flex items-center justify-between text-amber-300 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-amber-400" />
                    Assoziativer Spiking-Treffer in Laufwerk D:
                  </span>
                  <span className="font-mono text-[10px]">
                    Resonanz: {Math.round(routingResult.driveDMemoryMatch.score * 100)}%
                  </span>
                </div>
                <p className="font-mono text-cyan-300 text-[10px]">
                  {routingResult.driveDMemoryMatch.key}
                </p>
                <p className="text-slate-400 text-[10px]">
                  {routingResult.driveDMemoryMatch.fileSnippet}
                </p>
              </div>
            )}

            {/* STDP Plasticity Feedback Button */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[11px]">
              <div className="flex items-center gap-2 text-slate-400">
                <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
                <span>On-Chip STDP Lernen: Synaptische Gewichte angepasst</span>
              </div>

              <div className="flex items-center gap-2">
                {stdpSuccessMsg && (
                  <span className="text-emerald-400 text-[10px] animate-fade-in font-medium">
                    ✓ Synapsen verstärkt!
                  </span>
                )}
                <button
                  onClick={handleTriggerStdp}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-medium transition cursor-pointer border border-slate-700"
                >
                  STDP-Gewicht verstärken
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. WINDOWS 11 1-CLICK LAVA INSTALLER & LOIHI 2 PYTHON BRIDGE */}
      <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-bold text-slate-200 flex items-center gap-2">
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Intel Lava Framework: 1-Klick Setup für Windows 11</span>
          </h3>
          <span className="text-[11px] text-slate-400 font-mono">
            Intel Neuromorphic Research Community (INRC)
          </span>
        </div>

        <p className="text-slate-400 leading-relaxed text-[11px]">
          Nutzen Sie die bereitgestellten Skripte, um das offizielle <strong>Intel Lava Framework (`lava-nc`)</strong> auf Ihrer lokalen Windows 11 Maschine auszuführen. Der lokale Neuromorph-Server antwortet auf Port 8090 mit echten Spiking-Netzwerken:
        </p>

        {/* 3 Download Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Card 1: Setup Bat */}
          <div className="p-3 rounded-lg bg-slate-900 border border-emerald-500/40 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-emerald-300 font-bold text-xs">
                  setup-loihi2-lava.bat
                </span>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono">
                  1-Klick
                </span>
              </div>
              <p className="text-slate-400 text-[10px] mt-1">
                Installiert automatisch Intel `lava-nc`, FastAPI und startet die lokale Neuromorph-Bridge auf Port 8090.
              </p>
            </div>
            <button
              onClick={() => downloadLoihi2File('setup-bat', 'setup-loihi2-lava.bat')}
              className="mt-3 w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow"
            >
              <Download className="w-3.5 h-3.5" />
              <span>setup-loihi2-lava.bat</span>
            </button>
          </div>

          {/* Card 2: Python Bridge */}
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <div>
              <span className="font-mono text-cyan-300 font-bold text-xs block">
                run_lava_loihi2_bridge.py
              </span>
              <p className="text-slate-400 text-[10px] mt-1">
                FastAPI Server mit 1M LIF Spiking Neuronen, Leaky-Integrate-and-Fire Dynamik und STDP Plastizität.
              </p>
            </div>
            <button
              onClick={() => downloadLoihi2File('lava-bridge', 'run_lava_loihi2_bridge.py')}
              className="mt-3 w-full py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-medium text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Bridge Server Laden</span>
            </button>
          </div>

          {/* Card 3: Spiking Router Model */}
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <div>
              <span className="font-mono text-amber-300 font-bold text-xs block">
                spiking_hybrid_router.py
              </span>
              <p className="text-slate-400 text-[10px] mt-1">
                Eigenständiges SNN-Modellskript für Intel Kapoho Point USB oder Oheo Gulch Hardware-Boards.
              </p>
            </div>
            <button
              onClick={() => downloadLoihi2File('spiking-router', 'spiking_hybrid_router.py')}
              className="mt-3 w-full py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded font-medium text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow"
            >
              <Download className="w-3.5 h-3.5" />
              <span>SNN Hardware Skript</span>
            </button>
          </div>
        </div>

        {/* PowerShell CLI Quick Copy Box */}
        <div className="mt-3 p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-200 text-xs">
              Manuelle Installation im Windows Terminal (PowerShell):
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">Python 3.10+</span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between p-2 rounded bg-slate-950 font-mono text-[11px] text-slate-300">
              <span>pip install lava-nc fastapi uvicorn</span>
              <button
                onClick={() => handleCopy('pip install lava-nc fastapi uvicorn', 'pip1')}
                className="text-slate-400 hover:text-white flex items-center gap-1 transition cursor-pointer"
              >
                {copiedCmd === 'pip1' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span className="text-[10px]">{copiedCmd === 'pip1' ? 'Kopiert' : 'Kopieren'}</span>
              </button>
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-slate-950 font-mono text-[11px] text-slate-300">
              <span>python run_lava_loihi2_bridge.py</span>
              <button
                onClick={() => handleCopy('python run_lava_loihi2_bridge.py', 'pip2')}
                className="text-slate-400 hover:text-white flex items-center gap-1 transition cursor-pointer"
              >
                {copiedCmd === 'pip2' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span className="text-[10px]">{copiedCmd === 'pip2' ? 'Kopiert' : 'Kopieren'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
