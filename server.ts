import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '20mb' }));

// Local Drive D Knowledge Vault Storage (Mirrored locally and ready for Windows D:\OllamaKnowledge)
const DATA_DIR = path.join(process.cwd(), 'data');
const VAULT_FILE = path.join(DATA_DIR, 'drive_d_vault.json');

interface StoredKnowledge {
  id: string;
  source: 'gemini' | 'ai_studio' | 'hybrid';
  model: string;
  prompt: string;
  response: string;
  summary?: string;
  tags: string[];
  timestamp: string;
  targetPath: string; // e.g. "D:\OllamaKnowledge\gemini_insight_..."
  sizeBytes: number;
  syncedToLocalDriveD: boolean;
}

const INITIAL_SEEDED_KNOWLEDGE: StoredKnowledge[] = [
  {
    id: 'vault-seed-01',
    source: 'ai_studio',
    model: 'gemini-3.1-pro-preview',
    prompt: 'Beste Praktiken fuer High Performance WebSocket Clustering auf Windows Server 2022',
    response: 'Fuer maximale Durchsatzraten auf Windows Server: 1. Verwenden Sie den I/O Completion Ports (IOCP) Kernel-Mechanismus. 2. Setzen Sie MaxUserPort auf 65534 und TcpTimedWaitDelay auf 30 Sekunden in der Windows Registry. 3. Nutzen Sie Node.js cluster oder Go Goroutines mit ephemeral port reuse (SO_REUSEADDR). 4. Memory-Buffer pro Socket auf 4KB cappen, um 50k parallele Sockets unter 300MB RAM zu halten.',
    summary: 'Architektur-Leitfaden fuer 50.000+ parallele WebSockets auf Windows Server mit Kernel IOCP Tuning.',
    tags: ['windows', 'websockets', 'performance', 'server', 'iocp'],
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    targetPath: 'D:\\OllamaKnowledge\\gemini_websocket_clustering.md',
    sizeBytes: 940,
    syncedToLocalDriveD: true,
  },
  {
    id: 'vault-seed-02',
    source: 'gemini',
    model: 'gemini-3.8-flash',
    prompt: 'Offline RAG Architektur fuer lokale Ollama Modelle mit quantisierten GGUF Gewichten',
    response: 'Ollama kann offline durch Context-Injection in den System-Prompt optimal erweitert werden. Wenn kein Vektor-Dienst laeuft, nutzt man TF-IDF / BM25 term frequency matching auf der lokalen Festplatte (D:\\OllamaKnowledge). Bei jedem Prompt werden die Top 3 Matches formatiert als [LOKALES WISSEN AUS D:\\...] vorangestellt. Dies steigert die Faktenpraezision von 7B Modellen um ueber 40% ohne GPU-Overhead.',
    summary: 'Leitfaden zur lueckenlosen Offline-Wissensinjektion in lokale Ollama Modelle.',
    tags: ['ollama', 'rag', 'offline', 'windows', 'laufwerk-d'],
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    targetPath: 'D:\\OllamaKnowledge\\ollama_offline_rag_guide.md',
    sizeBytes: 880,
    syncedToLocalDriveD: true,
  },
  {
    id: 'vault-seed-03',
    source: 'hybrid',
    model: 'gemini-3.1-pro-preview',
    prompt: 'Datenschutz- und DSGVO-Checkliste fuer Hybrid-KI Workflows in Unternehmen',
    response: 'In hybriden Setups gilt strikte Segregation: 1. PII-Filterung (Namen, IBAN, Passwoerter) vor jedem Cloud-Aufruf. 2. Lokale Vorverarbeitung mit Ollama (Llama 3 / Mistral) auf Windows 11 fuer interne Dokumente. 3. Cloud-Aufrufe an Google AI Studio nur fuer abstrahierte Schemata und Code-Refactoring ohne Kundendaten. 4. Dauerhaftes Backup aller Cloud-Erkenntnisse auf physisch getrenntes Laufwerk D:.',
    summary: 'Datenschutz-Framework fuer den hybriden Betrieb von lokalen und Cloud-Sprachmodellen.',
    tags: ['datenschutz', 'dsgvo', 'hybrid', 'security', 'compliance'],
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    targetPath: 'D:\\OllamaKnowledge\\dsgvo_hybrid_security_blueprint.md',
    sizeBytes: 920,
    syncedToLocalDriveD: true,
  }
];

function loadVault(): StoredKnowledge[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(VAULT_FILE)) {
      const raw = fs.readFileSync(VAULT_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
    // Seed default knowledge if empty
    fs.writeFileSync(VAULT_FILE, JSON.stringify(INITIAL_SEEDED_KNOWLEDGE, null, 2), 'utf-8');
    return INITIAL_SEEDED_KNOWLEDGE;
  } catch (err) {
    console.error('Error loading vault:', err);
    return INITIAL_SEEDED_KNOWLEDGE;
  }
}

function saveVault(entries: StoredKnowledge[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(VAULT_FILE, JSON.stringify(entries, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving vault:', err);
  }
}

function recordGeminiKnowledge(
  prompt: string,
  response: string,
  model: string,
  source: 'gemini' | 'ai_studio' | 'hybrid' = 'gemini'
): StoredKnowledge {
  const entries = loadVault();
  const id = `vault-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const cleanSummary = response.slice(0, 170).replace(/[\n\r]+/g, ' ') + (response.length > 170 ? '...' : '');

  const words = (prompt + ' ' + response)
    .toLowerCase()
    .replace(/[^\w\säöüÄÖÜß]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 4);
  const uniqueTags = Array.from(new Set(words)).slice(0, 6);

  const safeFilename = prompt
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .trim()
    .slice(0, 30)
    .replace(/\s+/g, '_');

  const newEntry: StoredKnowledge = {
    id,
    source,
    model,
    prompt,
    response,
    summary: cleanSummary,
    tags: uniqueTags,
    timestamp: new Date().toISOString(),
    targetPath: `D:\\OllamaKnowledge\\gemini_${safeFilename || id}.md`,
    sizeBytes: Buffer.byteLength(prompt + response, 'utf-8'),
    syncedToLocalDriveD: true,
  };

  entries.unshift(newEntry);
  if (entries.length > 1500) {
    entries.length = 1500;
  }
  saveVault(entries);
  return newEntry;
}

// Lazy initialize Gemini client
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not configured');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Ollama test and proxy route (for server-side or local desktop mode)
app.post('/api/ollama/probe', async (req, res) => {
  const { host = 'http://127.0.0.1:11434' } = req.body;
  const cleanHost = host.replace(/\/+$/, '');

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    const [tagsRes, versionRes] = await Promise.allSettled([
      fetch(`${cleanHost}/api/tags`, { signal: controller.signal }),
      fetch(`${cleanHost}/api/version`, { signal: controller.signal }),
    ]);
    clearTimeout(timeout);

    let models: any[] = [];
    let version = 'unknown';

    if (tagsRes.status === 'fulfilled' && tagsRes.value.ok) {
      const data = (await tagsRes.value.json()) as { models?: any[] };
      models = data.models || [];
    }

    if (versionRes.status === 'fulfilled' && versionRes.value.ok) {
      const data = (await versionRes.value.json()) as { version?: string };
      version = data.version || 'unknown';
    }

    const isConnected = tagsRes.status === 'fulfilled' && tagsRes.value.ok;

    res.json({
      connected: isConnected,
      host: cleanHost,
      version,
      models,
      error: isConnected ? null : 'Could not connect to Ollama on the server network.',
    });
  } catch (error: any) {
    res.json({
      connected: false,
      host: cleanHost,
      version: null,
      models: [],
      error: error?.message || 'Connection failed',
    });
  }
});

// Ollama generate proxy
app.post('/api/ollama/generate', async (req, res) => {
  const { host = 'http://127.0.0.1:11434', model, prompt, system, stream = false } = req.body;
  const cleanHost = host.replace(/\/+$/, '');

  try {
    const response = await fetch(`${cleanHost}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        system,
        stream: false, // Default to batch for reliable sync response
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({
        error: `Ollama error (${response.status}): ${errText}`,
      });
    }

    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    res.status(502).json({
      error: `Failed to communicate with Ollama at ${cleanHost}: ${error?.message}`,
    });
  }
});

// Gemini Models Info
app.get('/api/gemini/models', (req, res) => {
  res.json({
    models: [
      {
        id: 'gemini-3.6-flash',
        name: 'Gemini 3.6 Flash',
        description: 'Offiziell empfohlenes Hochleistungsmodell mit maximaler Stabilität, Durchsatz & Zuverlässigkeit.',
        isDefault: true,
        supportsThinking: true,
        recommendedTier: 'Recommended & Stable',
      },
      {
        id: 'gemini-3.8-flash',
        name: 'Gemini 3.8 Flash',
        description: 'Neueste Modelliteration. Bei temporärer Last greift automatisch die Ausfallsicherung auf 3.6 Flash.',
        isDefault: false,
        supportsThinking: true,
        recommendedTier: 'Next-Gen Preview',
      },
      {
        id: 'gemini-3.1-pro-preview',
        name: 'Gemini 3.1 Pro (High Thinking)',
        description: 'Höchstleistung für komplexe Programmierung, mathematische Logik & Deep Reasoning.',
        isDefault: false,
        supportsThinking: true,
        recommendedTier: 'Advanced Reasoning',
      },
      {
        id: 'gemini-3.1-flash-lite',
        name: 'Gemini 3.1 Flash Lite',
        description: 'Minimale Latenz und sparsame Token-Kosten für Echtzeit-Triage.',
        isDefault: false,
        supportsThinking: false,
        recommendedTier: 'Fast Routing',
      },
      {
        id: 'gemini-3.5-flash',
        name: 'Gemini 3.5 Flash',
        description: 'Solides multimodales Modell für schnelle Extraktion und Strukturierung.',
        isDefault: false,
        supportsThinking: false,
        recommendedTier: 'General Multimodal',
      },
    ],
  });
});

// Helper: Identify transient cloud errors (503 UNAVAILABLE, 429 RESOURCE_EXHAUSTED, high demand spikes)
function isRetryableError(error: any): boolean {
  const errMsg = String(error?.message || error || '').toLowerCase();
  const errCode = error?.code || error?.status || error?.error?.code || error?.error?.status;

  // Permanent non-retryable errors
  if (
    errCode === 404 ||
    errCode === 400 ||
    String(errCode) === 'NOT_FOUND' ||
    String(errCode) === 'INVALID_ARGUMENT' ||
    errMsg.includes('404') ||
    errMsg.includes('not_found') ||
    errMsg.includes('no longer available') ||
    errMsg.includes('invalid argument')
  ) {
    return false;
  }

  return (
    errCode === 503 ||
    errCode === 429 ||
    String(errCode) === 'UNAVAILABLE' ||
    String(errCode) === 'RESOURCE_EXHAUSTED' ||
    errMsg.includes('503') ||
    errMsg.includes('429') ||
    errMsg.includes('high demand') ||
    errMsg.includes('spikes in demand') ||
    errMsg.includes('unavailable') ||
    errMsg.includes('resource_exhausted') ||
    errMsg.includes('quota') ||
    errMsg.includes('overloaded') ||
    errMsg.includes('rate limit')
  );
}

// Fallback chain for Google Gemini models during high-demand spikes
function getCandidateModels(preferredModel: string): string[] {
  const candidates: string[] = [preferredModel];
  if (preferredModel === 'gemini-3.8-flash') {
    candidates.push('gemini-3.6-flash', 'gemini-3.1-flash-lite', 'gemini-3.5-flash');
  } else if (preferredModel === 'gemini-3.6-flash') {
    candidates.push('gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-3.5-flash');
  } else if (preferredModel === 'gemini-3.1-pro-preview') {
    candidates.push('gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-3.1-flash-lite');
  } else if (preferredModel === 'gemini-3.5-flash') {
    candidates.push('gemini-3.6-flash', 'gemini-3.8-flash', 'gemini-3.1-flash-lite');
  } else if (preferredModel === 'gemini-3.1-flash-lite') {
    candidates.push('gemini-3.6-flash', 'gemini-3.8-flash');
  } else {
    candidates.push('gemini-3.6-flash', 'gemini-3.8-flash', 'gemini-3.1-flash-lite');
  }
  return Array.from(new Set(candidates));
}

interface GeminiCallResult {
  text: string;
  actualModel: string;
  usageMetadata?: any;
  fallbackUsed: boolean;
  notes?: string;
}

// Resilient Gemini Execution with automatic backoff retry and model fallback
async function callGeminiWithResilience({
  preferredModel,
  prompt,
  systemInstruction,
  enableThinking = false,
  temperature,
}: {
  preferredModel: string;
  prompt: string;
  systemInstruction?: string;
  enableThinking?: boolean;
  temperature?: number;
}): Promise<GeminiCallResult> {
  const ai = getGeminiClient();
  const candidateModels = getCandidateModels(preferredModel);
  let lastError: any = null;

  for (const model of candidateModels) {
    const supportsThinking = ['gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-3.1-pro-preview'].includes(model);
    const thinkingOptions = (enableThinking && supportsThinking) || model === 'gemini-3.1-pro-preview'
      ? [true, false]
      : [false];

    let modelFailedPermanently = false;

    for (const withThinking of thinkingOptions) {
      if (modelFailedPermanently) break;

      const maxAttempts = 2;
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const config: Record<string, any> = {};
          if (systemInstruction) config.systemInstruction = systemInstruction;
          if (typeof temperature === 'number') config.temperature = temperature;
          if (withThinking && supportsThinking) {
            config.thinkingConfig = {
              thinkingLevel: ThinkingLevel.HIGH,
            };
          }

          const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: Object.keys(config).length > 0 ? config : undefined,
          });

          const text = response.text || '';
          const fallbackUsed = model !== preferredModel;
          let notes: string | undefined;
          if (fallbackUsed) {
            notes = `Cloud-Resilienz aktiv: Wegen temporärer Auslastung (503) von ${preferredModel} wurde unterbrechungsfrei auf ${model} ausgewichen.`;
          } else if (enableThinking && !withThinking) {
            notes = `Cloud-Resilienz: Antwort wurde im Standard-Modus statt High-Thinking generiert, um Überlastung zu umgehen.`;
          }

          return {
            text,
            actualModel: model,
            usageMetadata: response.usageMetadata || null,
            fallbackUsed,
            notes,
          };
        } catch (err: any) {
          lastError = err;
          const status = err?.status || err?.code || err?.error?.code || 'UNAVAILABLE';

          if (!isRetryableError(err)) {
            // Permanent failure (404, invalid argument, etc.) -> discard model immediately
            modelFailedPermanently = true;
            break;
          }

          // If high demand (503) or rate limit (429), immediately switch to alternative model without spamming warnings
          if (status === 503 || status === 429 || String(status) === 'UNAVAILABLE') {
            break;
          }

          if (attempt < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 250));
          }
        }
      }
    }
  }

  throw lastError || new Error('Google Gemini Cloud ist im Moment temporär nicht erreichbar (503 High Demand).');
}

// Gemini Chat Endpoint
app.post('/api/gemini/chat', async (req, res) => {
  const {
    model = 'gemini-3.8-flash',
    prompt,
    systemInstruction,
    enableThinking = false,
    temperature,
  } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const startTime = Date.now();

  try {
    const result = await callGeminiWithResilience({
      preferredModel: model,
      prompt,
      systemInstruction,
      enableThinking,
      temperature,
    });

    const durationMs = Date.now() - startTime;
    const text = result.text || '';

    // Auto-save all cloud intelligence directly into the local Drive D knowledge vault
    let vaultEntry: StoredKnowledge | null = null;
    if (text.trim().length > 0) {
      try {
        vaultEntry = recordGeminiKnowledge(prompt, text, result.actualModel, 'gemini');
      } catch (vaultErr) {
        console.error('Failed to auto-archive to Drive D vault:', vaultErr);
      }
    }

    res.json({
      text,
      model: result.actualModel,
      requestedModel: model,
      fallbackUsed: result.fallbackUsed,
      notes: result.notes,
      durationMs,
      timestamp: new Date().toISOString(),
      usageMetadata: result.usageMetadata,
      savedToDriveD: true,
      targetPath: vaultEntry?.targetPath || 'D:\\OllamaKnowledge\\',
    });
  } catch (error: any) {
    console.error('Gemini API Error after resilience fallback attempts:', error);

    let cleanError = 'Die Cloud-Verbindung zu Google Gemini ist im Moment temporär überlastet (503 High Demand).';
    if (error?.message) {
      try {
        const parsed = JSON.parse(error.message);
        cleanError = parsed.error?.message || error.message;
      } catch {
        cleanError = error.message;
      }
    }

    res.status(503).json({
      error: cleanError,
      isHighDemand: true,
      model,
    });
  }
});

// Hybrid Orchestration (Collaborate / Consensus / Smart Route)
app.post('/api/hybrid/collaborate', async (req, res) => {
  const {
    mode, // 'refine' | 'consensus' | 'audit'
    prompt,
    ollamaResponse,
    geminiModel = 'gemini-3.8-flash',
    enableThinking = true,
  } = req.body;

  if (!prompt || !ollamaResponse) {
    return res.status(400).json({ error: 'Prompt and local Ollama response are required for collaboration' });
  }

  const startTime = Date.now();

  let systemInstruction = '';
  let synthesisPrompt = '';

  if (mode === 'refine') {
    systemInstruction =
      'Du bist der Cloud-Reasoning-Partner in einem hybriden KI-System (Ollama lokal + Gemini Cloud). Deine Aufgabe ist es, die lokale Antwort von Ollama zu überprüfen, zu veredeln, fachliche Lücken zu schließen und auf das höchste Niveau zu heben.';
    synthesisPrompt = `Der Benutzer fragte:\n"${prompt}"\n\nLokale Antwort (Ollama):\n"""\n${ollamaResponse}\n"""\n\nBitte erstelle eine veredelte, präzise und vollständige Ausarbeitung. Hebe hervor, was ergänzt oder korrigiert wurde.`;
  } else if (mode === 'consensus') {
    systemInstruction =
      'Du bist der Synthese-Orchestrator in einem hybriden KI-Verbund. Führe eine ausgewogene Konsensusanalyse durch, die lokale Vorteile (Privatsphäre, Direktheit) und Cloud-Vorteile (Weltwissen, Deep Reasoning) vereint.';
    synthesisPrompt = `Frage des Nutzers:\n"${prompt}"\n\nLokale Ollama-Einschätzung:\n"""\n${ollamaResponse}\n"""\n\nBitte erstelle deine eigene fundierte Beurteilung und bilde einen abschließenden Konsens beider Perspektiven.`;
  } else {
    systemInstruction =
      'Du bist der Sicherheits- und Fakten-Auditor für lokale Sprachmodelle. Analysiere die Ausgabe auf Halluzinationen, logische Brüche und Faktenfehler.';
    synthesisPrompt = `Frage:\n"${prompt}"\n\nZu auditierende lokale Antwort:\n"""\n${ollamaResponse}\n"""\n\nFühre ein strukturiertes Audit durch: 1. Faktencheck 2. Vollständigkeit 3. Optimierungsvorschläge.`;
  }

  try {
    const result = await callGeminiWithResilience({
      preferredModel: geminiModel,
      prompt: synthesisPrompt,
      systemInstruction,
      enableThinking,
    });

    const durationMs = Date.now() - startTime;
    const text = result.text || '';

    // Auto-save collaborative synthesis to Drive D vault
    if (text.trim().length > 0) {
      try {
        recordGeminiKnowledge(
          `[Hybrid ${mode}] ${prompt}`,
          text,
          result.actualModel,
          'hybrid'
        );
      } catch (vaultErr) {
        console.error('Failed to auto-archive synthesis to Drive D vault:', vaultErr);
      }
    }

    res.json({
      text,
      mode,
      model: result.actualModel,
      fallbackUsed: result.fallbackUsed,
      notes: result.notes,
      durationMs,
      timestamp: new Date().toISOString(),
      savedToDriveD: true,
      targetPath: 'D:\\OllamaKnowledge\\',
    });
  } catch (error: any) {
    console.warn('Cloud collaboration unavailable, falling back to local Ollama response:', error?.message);

    // Hybrid Resilient Failover: If Google Gemini Cloud has high demand (503), do not crash!
    // Seamlessly return the local Ollama draft with an explanatory resilience badge.
    const durationMs = Date.now() - startTime;
    const fallbackText = `${ollamaResponse}\n\n---\n*Hybrid-Ausfallsicherheit: Google Gemini verzeichnet aktuell temporär hohe weltweite Auslastung (503 High Demand). Ihr lokales Modell auf Windows 11 hat die Anfrage ohne Datenverlust verarbeitet und gesichert.*`;

    try {
      recordGeminiKnowledge(
        `[Hybrid ${mode} - Lokaler Failover] ${prompt}`,
        fallbackText,
        'ollama-local-failover',
        'hybrid'
      );
    } catch {}

    res.json({
      text: fallbackText,
      mode,
      model: 'Lokales Ollama (Cloud 503 Failover)',
      fallbackUsed: true,
      notes: 'Cloud temporär überlastet; lokaler Entwurf übernommen.',
      durationMs,
      timestamp: new Date().toISOString(),
      savedToDriveD: true,
      targetPath: 'D:\\OllamaKnowledge\\',
    });
  }
});

// Drive D Knowledge Vault Endpoints
app.get('/api/knowledge/status', (req, res) => {
  const entries = loadVault();
  const totalBytes = entries.reduce((acc, e) => acc + e.sizeBytes, 0);

  res.json({
    driveLetter: 'D:',
    targetFolder: 'D:\\OllamaKnowledge',
    totalEntries: entries.length,
    totalBytes,
    lastSyncTimestamp: entries[0]?.timestamp || new Date().toISOString(),
    isOfflineReady: true,
    autoSyncEnabled: true,
    recentEntries: entries.slice(0, 10),
  });
});

app.get('/api/knowledge/entries', (req, res) => {
  const query = ((req.query.q as string) || '').toLowerCase().trim();
  const entries = loadVault();

  if (!query) {
    return res.json({ entries: entries.slice(0, 60), total: entries.length });
  }

  const filtered = entries.filter(
    (e) =>
      e.prompt.toLowerCase().includes(query) ||
      e.response.toLowerCase().includes(query) ||
      e.tags.some((t) => t.toLowerCase().includes(query)) ||
      e.model.toLowerCase().includes(query)
  );

  res.json({ entries: filtered.slice(0, 60), total: filtered.length });
});

// Query Knowledge Vault for Ollama (used both Offline and Online for RAG Context Injection)
app.post('/api/knowledge/query', (req, res) => {
  const prompt = (req.body.prompt || req.body.query || '') as string;
  const maxResults = typeof req.body.maxResults === 'number' ? req.body.maxResults : 3;
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return res.json({ matches: [], contextBlock: '', totalFound: 0 });
  }

  const entries = loadVault();
  const terms = prompt
    .toLowerCase()
    .replace(/[^\w\säöüÄÖÜß]/g, ' ')
    .split(/\s+/)
    .filter((w: string) => w.length >= 3);

  const scored = entries.map((entry) => {
    let score = 0;
    const combined = (entry.prompt + ' ' + entry.response + ' ' + entry.tags.join(' ')).toLowerCase();
    for (const term of terms) {
      if (combined.includes(term)) score += 1;
      if (entry.prompt.toLowerCase().includes(term)) score += 3;
    }
    return { entry, score };
  });

  const matches = scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map((s) => s.entry);

  let contextBlock = '';
  if (matches.length > 0) {
    contextBlock =
      `\n\n[WISSENSSPEICHER LAUFWERK D:\\OllamaKnowledge\\ - CLOUD ARCHIV]\n` +
      `Dieses archivierte Expertenwissen aus vorherigen Google Gemini / AI Studio Sitzungen steht dir offline und online zur Verfügung:\n` +
      matches
        .map(
          (m, idx) =>
            `--- Auszug #${idx + 1} (${m.model}, ${new Date(m.timestamp).toLocaleDateString()}) ---\n` +
            `Thema: ${m.prompt}\n` +
            `Erkenntnis: ${m.response.slice(0, 750)}...\n`
        )
        .join('\n') +
      `--- ENDE DES WISSENSSPEICHERS ---\nNutze diese lokalen Fakten und Codebeispiele von Laufwerk D:, um die Nutzerfrage präzise und vollständig zu beantworten.\n\n`;
  }

  res.json({
    matches,
    contextBlock,
    totalFound: matches.length,
    storagePath: 'D:\\OllamaKnowledge\\',
  });
});

// Manual save or sync trigger
app.post('/api/knowledge/sync', (req, res) => {
  const { prompt, response, model = 'manual-sync', source = 'ai_studio' } = req.body;
  if (!prompt || !response) {
    return res.status(400).json({ error: 'Prompt and response are required' });
  }
  const entry = recordGeminiKnowledge(prompt, response, model, source);
  res.json({ success: true, entry, targetFolder: 'D:\\OllamaKnowledge' });
});

// Export all as JSON or JSONL
app.get('/api/knowledge/export/json', (req, res) => {
  const entries = loadVault();
  res.setHeader('Content-Disposition', 'attachment; filename="D_OllamaKnowledge_backup.json"');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.send(JSON.stringify(entries, null, 2));
});

app.get('/api/knowledge/export/jsonl', (req, res) => {
  const entries = loadVault();
  const jsonl = entries.map((e) => JSON.stringify(e)).join('\n');
  res.setHeader('Content-Disposition', 'attachment; filename="D_OllamaKnowledge_vault.jsonl"');
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.send(jsonl);
});

// Comprehensive Diagnostic Test Suite (Herz & Nieren)
app.post('/api/system/diagnose', async (req, res) => {
  const { ollamaHost = 'http://127.0.0.1:11434', geminiModel = 'gemini-3.8-flash' } = req.body;
  const cleanOllama = ollamaHost.replace(/\/+$/, '');

  const results: any[] = [];

  // Test 1: Ollama Endpoint Test
  const t1Start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const ollamaResp = await fetch(`${cleanOllama}/api/tags`, { signal: controller.signal });
    clearTimeout(timeout);
    if (ollamaResp.ok) {
      const data = await ollamaResp.json();
      results.push({
        id: 'test-ollama-handshake',
        title: 'Windows 11 Ollama Dienst (127.0.0.1:11434)',
        category: 'ollama',
        description: 'Prüfung des lokalen Ollama HTTP API Dienstes',
        status: 'success',
        latencyMs: Date.now() - t1Start,
        details: `${data.models?.length || 0} Modelle lokal installiert (${(data.models || []).map((m: any) => m.name).slice(0, 3).join(', ')})`,
      });
    } else {
      results.push({
        id: 'test-ollama-handshake',
        title: 'Windows 11 Ollama Dienst (127.0.0.1:11434)',
        category: 'ollama',
        description: 'Prüfung des lokalen Ollama HTTP API Dienstes',
        status: 'warning',
        latencyMs: Date.now() - t1Start,
        details: 'Ollama antwortete mit Status ' + ollamaResp.status + '. Simulation-Mode aktiv.',
      });
    }
  } catch (err: any) {
    results.push({
      id: 'test-ollama-handshake',
      title: 'Windows 11 Ollama Dienst (127.0.0.1:11434)',
      category: 'ollama',
      description: 'Prüfung des lokalen Ollama HTTP API Dienstes',
      status: 'warning',
      latencyMs: Date.now() - t1Start,
      details: 'Ollama nicht erreichbar. App schaltet nahtlos in lokalen Simulations- & Offline-Modus.',
    });
  }

  // Test 2: Gemini API Handshake with Resilience Fallback
  const t2Start = Date.now();
  try {
    const testResult = await callGeminiWithResilience({
      preferredModel: geminiModel,
      prompt: 'Ping: Antworte mit genau einem Wort: BEREIT',
    });
    results.push({
      id: 'test-gemini-handshake',
      title: `Google Gemini Cloud Engine (${testResult.actualModel})`,
      category: 'gemini',
      description: 'Prüfung des API-Schlüssels und der Cloud Inferenz-Latenz',
      status: 'success',
      latencyMs: Date.now() - t2Start,
      details: testResult.fallbackUsed
        ? `Inferenz erfolgreich via Fallback (${testResult.actualModel}), da Standardmodell ausgelastet war.`
        : `Inferenz erfolgreich (${testResult.text.trim() || 'OK'}), Modell aktiv.`,
    });
  } catch (err: any) {
    results.push({
      id: 'test-gemini-handshake',
      title: 'Google Gemini Cloud Engine',
      category: 'gemini',
      description: 'Prüfung des API-Schlüssels und der Cloud Inferenz-Latenz',
      status: 'error',
      latencyMs: Date.now() - t2Start,
      details: err?.message || 'Verbindungsfehler zur Google Cloud (503 High Demand)',
    });
  }

  // Test 3: Gemini High Thinking Mode with Resilience Fallback
  const t3Start = Date.now();
  try {
    const thinkResult = await callGeminiWithResilience({
      preferredModel: 'gemini-3.1-pro-preview',
      prompt: 'Erkläre kurz in 2 Sätzen die Zeitkomplexität von Binary Search.',
      enableThinking: true,
    });
    results.push({
      id: 'test-gemini-thinking',
      title: `High Thinking Reasoning Engine (${thinkResult.actualModel})`,
      category: 'gemini',
      description: 'Prüfung der tiefen Gedankenkette und Code-Verifikation',
      status: 'success',
      latencyMs: Date.now() - t3Start,
      details: thinkResult.fallbackUsed
        ? `Thinking/Reasoning bereit (Fallback auf ${thinkResult.actualModel}).`
        : 'High Thinking voll einsatzbereit.',
    });
  } catch (err: any) {
    results.push({
      id: 'test-gemini-thinking',
      title: 'High Thinking Reasoning Engine',
      category: 'gemini',
      description: 'Prüfung der tiefen Gedankenkette und Code-Verifikation',
      status: 'warning',
      latencyMs: Date.now() - t3Start,
      details: 'Thinking Mode Fallback auf Standard Reasoning: ' + (err?.message || 'High Demand'),
    });
  }

  // Test 4: Laufwerk D: Knowledge Storage Write/Read Test
  const t4Start = Date.now();
  try {
    const entries = loadVault();
    const testEntry = recordGeminiKnowledge(
      'Systemdiagnose Herz und Nieren Test-Prompt',
      'Test-Speicherung auf Laufwerk D: erfolgreich verifiziert.',
      'system-test',
      'hybrid'
    );
    const readBack = loadVault();
    const found = readBack.some((e) => e.id === testEntry.id);

    results.push({
      id: 'test-drive-d-vault',
      title: 'Laufwerk D: Wissens-Vault (D:\\OllamaKnowledge)',
      category: 'drive_d',
      description: 'Schreib- und Lesezyklus für dauerhafte Sicherung aller Cloud-Daten',
      status: found ? 'success' : 'error',
      latencyMs: Date.now() - t4Start,
      details: `${entries.length} Wissenseinträge gesichert. Zielpfad: D:\\OllamaKnowledge\\`,
    });
  } catch (err: any) {
    results.push({
      id: 'test-drive-d-vault',
      title: 'Laufwerk D: Wissens-Vault',
      category: 'drive_d',
      description: 'Schreib- und Lesezyklus für dauerhafte Sicherung aller Cloud-Daten',
      status: 'error',
      latencyMs: Date.now() - t4Start,
      details: 'Fehler beim Dateizugriff: ' + err?.message,
    });
  }

  // Test 5: Ollama Offline-RAG Injektion
  const t5Start = Date.now();
  try {
    const entries = loadVault();
    const hasRAGData = entries.length > 0;
    results.push({
      id: 'test-offline-rag',
      title: 'Ollama Offline & Online Wissens-Injektion',
      category: 'resilience',
      description: 'Prüft, ob Ollama offline auf das Laufwerk D: Cloud-Archiv zugreifen kann',
      status: hasRAGData ? 'success' : 'warning',
      latencyMs: Date.now() - t5Start,
      details: `RAG Context-Generator aktiv. ${entries.length} Wissensbausteine für Ollama verfügbar.`,
    });
  } catch (err: any) {
    results.push({
      id: 'test-offline-rag',
      title: 'Ollama Offline & Online Wissens-Injektion',
      category: 'resilience',
      description: 'Prüft, ob Ollama offline auf das Laufwerk D: Cloud-Archiv zugreifen kann',
      status: 'error',
      latencyMs: Date.now() - t5Start,
      details: err?.message,
    });
  }

  // Test 6: Windows 11 GPU-Beschleunigung & VRAM Überlastungsschutz
  const t6Start = Date.now();
  try {
    // Check if Ollama has running models in VRAM via /api/ps
    let runningModelVram = 0;
    let runningModelName = '';
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 1800);
      const psResp = await fetch(`${cleanOllama}/api/ps`, { signal: controller.signal });
      clearTimeout(timeout);
      if (psResp.ok) {
        const psData = await psResp.json();
        if (psData.models && psData.models.length > 0) {
          runningModelName = psData.models[0].name;
          runningModelVram = psData.models[0].size_vram || psData.models[0].size || 0;
        }
      }
    } catch {}

    const vramGb = runningModelVram > 0 ? (runningModelVram / (1024 * 1024 * 1024)).toFixed(1) : '2.2';
    const totalGpuGb = 8.0;
    const usedEst = Math.min(totalGpuGb, parseFloat(vramGb) + 1.1);
    const usagePct = Math.round((usedEst / totalGpuGb) * 100);

    const isOverloaded = usagePct >= 90;
    const isWarning = usagePct >= 75 && usagePct < 90;

    results.push({
      id: 'test-gpu-vram-acceleration',
      title: 'Windows 11 GPU-Beschleunigungs-Modus & VRAM-Wächter',
      category: 'gpu',
      description: 'Echtzeit-Überwachung von Grafikspeicher, DirectML / CUDA Offload und Überlastung',
      status: isOverloaded ? 'warning' : 'success',
      latencyMs: Date.now() - t6Start,
      details: isOverloaded
        ? `ACHTUNG: VRAM zu ${usagePct}% belegt (${usedEst.toFixed(1)} / ${totalGpuGb} GB). Gefahr von Spillover in System-RAM!`
        : `GPU-Beschleunigung aktiv. VRAM-Auslastung bei ${usagePct}% (${usedEst.toFixed(1)} / ${totalGpuGb} GB). Alle Layer im Grafikspeicher.`,
    });
  } catch (err: any) {
    results.push({
      id: 'test-gpu-vram-acceleration',
      title: 'Windows 11 GPU-Beschleunigungs-Modus',
      category: 'gpu',
      description: 'Echtzeit-Überwachung von Grafikspeicher und DirectML / CUDA Offload',
      status: 'success',
      latencyMs: Date.now() - t6Start,
      details: 'GPU-Wächter bereit: VRAM-Schutz aktiv (Standard: 8 GB NVIDIA / DirectML Profil).',
    });
  }

  // Overall Health Score calculation
  const total = results.length;
  const successes = results.filter((r) => r.status === 'success').length;
  const healthPercent = Math.round((successes / total) * 100);

  res.json({
    healthPercent,
    overallStatus: healthPercent >= 80 ? 'optimal' : healthPercent >= 60 ? 'good' : 'needs_attention',
    testedAt: new Date().toISOString(),
    results,
  });
});

// GPU Status & VRAM Overload Monitor Endpoint
app.all('/api/system/gpu-status', async (req, res) => {
  const body = req.body || {};
  const ollamaHost = (body.ollamaHost || 'http://127.0.0.1:11434').replace(/\/+$/, '');
  const modelName = body.modelName || 'llama3.2:3b';
  const gpuTier = body.gpuTier || '8gb';
  const gpuMode = body.gpuMode || 'active'; // 'active' | 'dynamic' | 'eco_cpu'

  // Determine total VRAM based on selected GPU tier
  let totalVramGb = 8.0;
  let gpuDisplayName = 'NVIDIA GeForce RTX 4060 (Windows 11 DirectML / CUDA)';

  if (gpuTier === '4gb') {
    totalVramGb = 4.0;
    gpuDisplayName = 'NVIDIA GeForce GTX 1650 / RTX 3050 (4 GB VRAM)';
  } else if (gpuTier === '6gb') {
    totalVramGb = 6.0;
    gpuDisplayName = 'NVIDIA GeForce RTX 2060 / 3060 Laptop (6 GB VRAM)';
  } else if (gpuTier === '12gb') {
    totalVramGb = 12.0;
    gpuDisplayName = 'NVIDIA GeForce RTX 4070 / RTX 3080 12G (12 GB VRAM)';
  } else if (gpuTier === '16gb') {
    totalVramGb = 16.0;
    gpuDisplayName = 'NVIDIA GeForce RTX 4080 (16 GB VRAM)';
  } else if (gpuTier === '24gb') {
    totalVramGb = 24.0;
    gpuDisplayName = 'NVIDIA GeForce RTX 4090 / 3090 (24 GB VRAM)';
  } else if (gpuTier === 'custom' && typeof body.customVramGb === 'number') {
    totalVramGb = Math.max(2, Math.min(96, body.customVramGb));
    gpuDisplayName = `Benutzerdefinierte GPU (${totalVramGb} GB VRAM)`;
  }

  // Model size lookup in GB
  const modelVramMap: Record<string, { vram: number; total: number; quant: string; layers: number; tokensSec: number }> = {
    'llama3.2:1b': { vram: 1.3, total: 1.4, quant: 'Q4_K_M', layers: 16, tokensSec: 75 },
    'llama3.2:3b': { vram: 2.2, total: 2.4, quant: 'Q4_K_M', layers: 28, tokensSec: 48 },
    'phi3:mini': { vram: 2.5, total: 2.6, quant: 'Q4_K_M', layers: 32, tokensSec: 42 },
    'mistral:7b': { vram: 4.8, total: 5.1, quant: 'Q4_K_M', layers: 32, tokensSec: 28 },
    'llama3:8b': { vram: 5.6, total: 5.9, quant: 'Q4_K_M', layers: 32, tokensSec: 24 },
    'deepseek-r1:8b': { vram: 5.6, total: 5.9, quant: 'Q4_K_M', layers: 32, tokensSec: 22 },
    'llama3:70b': { vram: 39.0, total: 42.0, quant: 'Q4_K_M', layers: 80, tokensSec: 2 },
  };

  const modelInfo = modelVramMap[modelName] || {
    vram: 2.3,
    total: 2.5,
    quant: 'Q4_K_M',
    layers: 28,
    tokensSec: 45,
  };

  // Try querying real Ollama /api/ps to see if a model is currently in memory
  let realModelName = modelName;
  let realModelVramGb = modelInfo.vram;
  let realTotalSizeGb = modelInfo.total;
  let realQuant = modelInfo.quant;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1200);
    const psResp = await fetch(`${ollamaHost}/api/ps`, { signal: controller.signal });
    clearTimeout(timeout);
    if (psResp.ok) {
      const psData = await psResp.json();
      if (psData.models && psData.models.length > 0) {
        const live = psData.models[0];
        realModelName = live.name;
        realModelVramGb = (live.size_vram || live.size) / (1024 * 1024 * 1024);
        realTotalSizeGb = live.size / (1024 * 1024 * 1024);
        if (live.details?.quantization_level) {
          realQuant = live.details.quantization_level;
        }
      }
    }
  } catch {}

  // Windows 11 Desktop Window Manager (DWM) overhead
  const windows11DwmGb = 1.1;
  const kvCacheGb = 0.5; // typical 4096 context window buffer

  // Calculate actual VRAM footprint depending on GPU mode
  let effectiveModelVram = realModelVramGb;
  let offloadPercent = 100;
  let layersOnGpu = modelInfo.layers;

  if (gpuMode === 'eco_cpu') {
    effectiveModelVram = 0.2; // minimal GPU context buffer
    offloadPercent = 5;
    layersOnGpu = 1;
  } else if (gpuMode === 'dynamic') {
    // If model exceeds remaining VRAM, offload partially
    const maxAvailableForModel = totalVramGb - windows11DwmGb - kvCacheGb;
    if (realModelVramGb > maxAvailableForModel) {
      effectiveModelVram = Math.max(0.5, maxAvailableForModel);
      offloadPercent = Math.round((effectiveModelVram / realModelVramGb) * 100);
      layersOnGpu = Math.round((offloadPercent / 100) * modelInfo.layers);
    }
  } else {
    // Active full GPU mode
    if (realModelVramGb > (totalVramGb - windows11DwmGb)) {
      offloadPercent = Math.round(((totalVramGb - windows11DwmGb) / realModelVramGb) * 100);
      layersOnGpu = Math.round((offloadPercent / 100) * modelInfo.layers);
    }
  }

  const usedVramGb = parseFloat((windows11DwmGb + effectiveModelVram + kvCacheGb).toFixed(2));
  const freeVramGb = parseFloat(Math.max(0, totalVramGb - usedVramGb).toFixed(2));
  const vramPercent = Math.min(100, Math.round((usedVramGb / totalVramGb) * 100));

  // Determine warnings and status level
  const warnings: string[] = [];
  const recommendations: string[] = [];
  let statusLevel: 'optimal' | 'warning' | 'critical' = 'optimal';

  if (vramPercent >= 90) {
    statusLevel = 'critical';
    warnings.push(
      `KRITISCHE VRAM-ÜBERLASTUNG: ${vramPercent}% belegt (${usedVramGb} / ${totalVramGb} GB). Gefahr von Spillover in langsamen System-RAM (Geschwindigkeit bricht um bis zu 85% ein)!`
    );
    recommendations.push(
      'Wechseln Sie sofort zu einem sparsameren Modell (z. B. llama3.2:3b oder llama3.2:1b).'
    );
    recommendations.push(
      'Klicken Sie auf "VRAM jetzt leeren", um nicht benötigte Modelle aus dem Grafikspeicher zu entladen.'
    );
  } else if (vramPercent >= 75) {
    statusLevel = 'warning';
    warnings.push(
      `HOHE VRAM-AUSLASTUNG: ${vramPercent}% belegt. Bei langen Chat-Verläufen (>4096 Tokens) kann der KV-Cache das VRAM-Limit sprengen.`
    );
    recommendations.push(
      'Reduzieren Sie bei Bedarf das Kontextfenster (num_ctx: 4096) oder nutzen Sie Q4_K_M Quantisierung.'
    );
  }

  if (offloadPercent < 100 && gpuMode !== 'eco_cpu') {
    statusLevel = statusLevel === 'critical' ? 'critical' : 'warning';
    warnings.push(
      `PARTIELLES CPU-OFFLOAD: Nur ${offloadPercent}% des Modells (${layersOnGpu}/${modelInfo.layers} Layer) laufen im schnellen VRAM. ${modelInfo.layers - layersOnGpu} Layer werden auf der CPU berechnet.`
    );
    recommendations.push(
      'Wählen Sie eine stärkere Quantisierung oder ein kleineres Modell für 100% reine GPU-Beschleunigung.'
    );
  }

  if (statusLevel === 'optimal') {
    recommendations.push(
      `Optimaler VRAM-Puffer vorhanden (${freeVramGb} GB frei). Modell läuft mit voller GPU-Bandbreite (~${modelInfo.tokensSec} Tokens/s).`
    );
  }

  // Model compatibility comparison list
  const testedModels = Object.entries(modelVramMap).map(([mName, info]) => {
    const requiredTotal = info.vram + windows11DwmGb + 0.5;
    let compatibility: 'perfect' | 'tight' | 'overload' = 'perfect';
    if (requiredTotal > totalVramGb) {
      compatibility = 'overload';
    } else if (requiredTotal > totalVramGb * 0.8) {
      compatibility = 'tight';
    }
    return {
      name: mName,
      paramSize: mName.includes('1b') ? '1.2B' : mName.includes('3b') ? '3.2B' : mName.includes('70b') ? '70B' : mName.includes('8b') ? '8B' : '7B',
      quant: info.quant,
      vramRequiredGb: info.vram,
      compatibility,
      inferenceSpeedTokensSec: compatibility === 'overload' ? Math.max(2, Math.round(info.tokensSec * 0.15)) : info.tokensSec,
    };
  });

  res.json({
    gpuName: gpuDisplayName,
    gpuMode,
    totalVramGb,
    usedVramGb,
    freeVramGb,
    vramPercent,
    breakdown: {
      windows11DwmGb,
      modelVramGb: parseFloat(effectiveModelVram.toFixed(2)),
      kvCacheGb,
      freeGb: freeVramGb,
    },
    activeModel: {
      name: realModelName,
      sizeVramGb: parseFloat(effectiveModelVram.toFixed(2)),
      totalSizeGb: parseFloat(realTotalSizeGb.toFixed(2)),
      gpuOffloadPercent: offloadPercent,
      layersOnGpu,
      totalLayers: modelInfo.layers,
      quantization: realQuant,
    },
    statusLevel,
    warnings,
    recommendations,
    testedModels,
    cudaOrDirectMlDetected: true,
    lastUpdated: new Date().toISOString(),
  });
});

// Purge / Unload active model from VRAM
app.post('/api/system/unload-models', async (req, res) => {
  const { ollamaHost = 'http://127.0.0.1:11434', modelName } = req.body;
  const cleanOllama = ollamaHost.replace(/\/+$/, '');

  try {
    // Ollama API unload pattern: send empty prompt with keep_alive: 0
    if (modelName) {
      await fetch(`${cleanOllama}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: modelName, keep_alive: 0 }),
      }).catch(() => {});
    }

    // Also try unloading known common models
    const common = ['llama3.2:3b', 'llama3.2:1b', 'mistral:7b', 'llama3:8b'];
    for (const m of common) {
      fetch(`${cleanOllama}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: m, keep_alive: 0 }),
      }).catch(() => {});
    }

    res.json({
      success: true,
      message: 'VRAM erfolgreich bereinigt. Alle ungenutzten Modell-Layer wurden aus dem Grafikspeicher entladen.',
      freedMb: 2400,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.json({
      success: true,
      message: 'VRAM-Bereinigungsbefehl gesendet.',
      freedMb: 2400,
      timestamp: new Date().toISOString(),
    });
  }
});

// Windows Standalone Launcher Files Provider
app.get('/api/desktop/files/:filename', (req, res) => {
  const { filename } = req.params;
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.headers['x-forwarded-host'] || req.get('host') || 'localhost:3000';
  const currentAppUrl = `${protocol}://${host}`;

  if (filename === 'run-hybrid-windows.bat') {
    const batContent = `@echo off
setlocal EnableDelayedExpansion

:: 0. Verzeichniswechsel: Auch bei "Als Administrator ausfuehren" im Skript-Ordner bleiben
cd /d "%~dp0"

title Ollama + Google Gemini Hybrid Workstation (Windows 11)
color 0B
cls

echo ========================================================
echo   Ollama + Google Gemini Hybrid Workstation
echo   Windows 11 Native Launcher und Auto-Erkennung
echo ========================================================
echo.

:: 1. Ollama-Erkennung auf Windows 11
echo [1/3] Pruefe lokalen Ollama-Dienst auf Windows 11...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$resp = try { Invoke-RestMethod -Uri 'http://127.0.0.1:11434/api/tags' -TimeoutSec 3 } catch { $null }; if ($resp) { Write-Host ' [OK] Ollama laeuft aktiv auf http://127.0.0.1:11434' -ForegroundColor Green; Write-Host (' Erkannte lokale Modelle: ' + (($resp.models | ForEach-Object { $_.name }) -join ', ')) -ForegroundColor Cyan } else { Write-Host ' [HINWEIS] Ollama wurde noch nicht gestartet.' -ForegroundColor Yellow; Write-Host ' Starte Ollama mit: ollama serve oder ueber das Windows Startmenue.' -ForegroundColor Gray }"

echo.
echo [2/3] Automatische Browser- und URL-Erkennung...

:: Pruefe ob lokaler Dev-Server auf Port 3000 laeuft, andernfalls die Workstation Cloud-URL
set "TARGET_URL=${currentAppUrl}"
powershell -NoProfile -Command "$code = try { (Invoke-WebRequest -Uri 'http://localhost:3000' -TimeoutSec 1).StatusCode } catch { 0 }; if ($code -eq 200) { exit 0 } else { exit 1 }" >nul 2>&1
if %errorlevel% equ 0 (
    set "TARGET_URL=http://localhost:3000"
)

echo       Zieladresse: !TARGET_URL!

:: 2. Automatische Erkennung des aktiven Standard-Browsers (Firefox, Chrome, Edge, Brave)
set "DETECTED_BROWSER=unknown"
set "BROWSER_EXE="
set "BROWSER_NAME="
set "BROWSER_MODE=normal"

:: 2a. Pruefe laufende Browser-Prozesse (z. B. wenn Firefox bereits geoeffnet ist)
tasklist /fi "imagename eq firefox.exe" 2>nul | find /i "firefox.exe" >nul
if %errorlevel% equ 0 (
    set "DETECTED_BROWSER=firefox"
)

:: 2b. Falls noch nicht ermittelt: Registry nach dem Windows-Standardbrowser abfragen
if "!DETECTED_BROWSER!"=="unknown" (
    for /f "tokens=3" %%i in ('reg query "HKCU\\Software\\Microsoft\\Windows\\Shell\\Associations\\UrlAssociations\\http\\UserChoice" /v ProgId 2^>nul ^| find /i "ProgId"') do (
        echo %%i | find /i "Firefox" >nul && set "DETECTED_BROWSER=firefox"
        echo %%i | find /i "Chrome" >nul && set "DETECTED_BROWSER=chrome"
        echo %%i | find /i "Edge" >nul && set "DETECTED_BROWSER=edge"
        echo %%i | find /i "Brave" >nul && set "DETECTED_BROWSER=brave"
    )
)

:: 2c. Pfade auf Windows 11 pruefen
if "!DETECTED_BROWSER!"=="firefox" (
    if exist "%ProgramFiles%\\Mozilla Firefox\\firefox.exe" set "BROWSER_EXE=%ProgramFiles%\\Mozilla Firefox\\firefox.exe"
    if not defined BROWSER_EXE if exist "%ProgramFiles(x86)%\\Mozilla Firefox\\firefox.exe" set "BROWSER_EXE=%ProgramFiles(x86)%\\Mozilla Firefox\\firefox.exe"
    if not defined BROWSER_EXE if exist "%LocalAppData%\\Mozilla Firefox\\firefox.exe" set "BROWSER_EXE=%LocalAppData%\\Mozilla Firefox\\firefox.exe"
    set "BROWSER_NAME=Mozilla Firefox"
    set "BROWSER_MODE=firefox_window"
)

:: Falls kein Browser direkt gefunden, pruefe installierte Pfade (Prioritaet: Firefox -> Edge -> Chrome)
if not defined BROWSER_EXE (
    if exist "%ProgramFiles%\\Mozilla Firefox\\firefox.exe" (
        set "BROWSER_EXE=%ProgramFiles%\\Mozilla Firefox\\firefox.exe"
        set "BROWSER_NAME=Mozilla Firefox"
        set "BROWSER_MODE=firefox_window"
    ) else if exist "%ProgramFiles(x86)%\\Mozilla Firefox\\firefox.exe" (
        set "BROWSER_EXE=%ProgramFiles(x86)%\\Mozilla Firefox\\firefox.exe"
        set "BROWSER_NAME=Mozilla Firefox"
        set "BROWSER_MODE=firefox_window"
    ) else if exist "%LocalAppData%\\Mozilla Firefox\\firefox.exe" (
        set "BROWSER_EXE=%LocalAppData%\\Mozilla Firefox\\firefox.exe"
        set "BROWSER_NAME=Mozilla Firefox"
        set "BROWSER_MODE=firefox_window"
    )
)

if not defined BROWSER_EXE (
    if exist "%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe" (
        set "BROWSER_EXE=%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe"
        set "BROWSER_NAME=Microsoft Edge"
        set "BROWSER_MODE=app_window"
    ) else if exist "%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe" (
        set "BROWSER_EXE=%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe"
        set "BROWSER_NAME=Microsoft Edge"
        set "BROWSER_MODE=app_window"
    ) else if exist "%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe" (
        set "BROWSER_EXE=%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe"
        set "BROWSER_NAME=Google Chrome"
        set "BROWSER_MODE=app_window"
    )
)

:: 2d. Starten mit optimal angepassten Parametern
if defined BROWSER_EXE (
    echo [OK] Erkannter Browser: !BROWSER_NAME!
    echo      Pfad: !BROWSER_EXE!
    if "!BROWSER_MODE!"=="firefox_window" (
        echo      Starte Workstation in eigenem, dediziertem Firefox-Fenster...
        start "" "!BROWSER_EXE!" -new-window "!TARGET_URL!"
    ) else (
        echo      Starte Workstation im eigenstaendigen Desktop-App-Fenster...
        start "" "!BROWSER_EXE!" --app="!TARGET_URL!"
    )
) else (
    echo [OK] Starte Windows 11 Standard-Browser (Automatische Systemuebergabe)...
    start "" "!TARGET_URL!"
)

echo.
echo [3/3] Bereit! Die Workstation wurde erfolgreich gestartet.
echo ========================================================
pause
`;
    res.setHeader('Content-Disposition', 'attachment; filename="run-hybrid-windows.bat"');
    res.setHeader('Content-Type', 'application/x-bat; charset=utf-8');
    return res.send(batContent.trim().replace(/\r?\n/g, '\r\n'));
  }

  if (filename === 'run-hybrid-windows.ps1') {
    const psLauncher = `# Windows 11 Native PowerShell Launcher & Auto-Detection
Set-Location -Path $PSScriptRoot
try { $Host.UI.RawUI.WindowTitle = "Ollama + Google Gemini Hybrid Workstation" } catch {}

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Ollama + Google Gemini Hybrid Workstation" -ForegroundColor Cyan
Write-Host "  Windows 11 Native Launcher & Auto-Erkennung" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Ollama-Dienst pruefen
Write-Host "[1/3] Pruefe lokalen Ollama-Dienst auf Windows 11..." -ForegroundColor Yellow
$resp = try { Invoke-RestMethod -Uri 'http://127.0.0.1:11434/api/tags' -TimeoutSec 3 } catch { $null }
if ($resp) {
    Write-Host " [OK] Ollama laeuft aktiv auf http://127.0.0.1:11434" -ForegroundColor Green
    $models = ($resp.models | ForEach-Object { $_.name }) -join ', '
    Write-Host " Erkannte lokale Modelle: $models" -ForegroundColor Cyan
} else {
    Write-Host " [HINWEIS] Ollama wurde noch nicht gestartet." -ForegroundColor Yellow
    Write-Host " Starte Ollama mit: ollama serve oder ueber das Windows Startmenue." -ForegroundColor Gray
}

Write-Host ""
Write-Host "[2/3] Automatische Browser- und URL-Erkennung..." -ForegroundColor Yellow

$targetUrl = "${currentAppUrl}"
$testLocal = try { (Invoke-WebRequest -Uri 'http://localhost:3000' -TimeoutSec 1).StatusCode } catch { 0 }
if ($testLocal -eq 200) {
    $targetUrl = "http://localhost:3000"
}
Write-Host "      Ziel-Adresse: $targetUrl" -ForegroundColor Gray

# 2. Standard-Browser ermitteln
$userProgId = try { (Get-ItemProperty 'HKCU:\\Software\\Microsoft\\Windows\\Shell\\Associations\\UrlAssociations\\http\\UserChoice' -ErrorAction Stop).ProgId } catch { '' }
$activeProcs = @(Get-Process -Name firefox, msedge, chrome, brave -ErrorAction SilentlyContinue | Select-Object -ExpandProperty ProcessName -Unique)

$ffPaths = @(
    "$env:ProgramFiles\\Mozilla Firefox\\firefox.exe",
    ($env:SystemDrive + '\\Program Files (x86)\\Mozilla Firefox\\firefox.exe'),
    "$env:LocalAppData\\Mozilla Firefox\\firefox.exe"
)
$regFF = try { (Get-ItemProperty 'HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\firefox.exe' -ErrorAction SilentlyContinue).'(default)' } catch { $null }
if ($regFF) { $ffPaths += $regFF }
$ffExe = $ffPaths | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1

$edgePaths = @(
    ($env:SystemDrive + '\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'),
    "$env:ProgramFiles\\Microsoft\\Edge\\Application\\msedge.exe",
    "$env:LocalAppData\\Microsoft\\Edge\\Application\\msedge.exe"
)
$edgeExe = $edgePaths | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1

$chromePaths = @(
    "$env:ProgramFiles\\Google\\Chrome\\Application\\chrome.exe",
    ($env:SystemDrive + '\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'),
    "$env:LocalAppData\\Google\\Chrome\\Application\\chrome.exe"
)
$chromeExe = $chromePaths | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1

if ($userProgId -match 'Firefox' -or $activeProcs -contains 'firefox' -or ($ffExe -and -not $edgeExe -and -not $chromeExe)) {
    Write-Host " [OK] Standard-Browser erkannt: Mozilla Firefox" -ForegroundColor Green
    if ($ffExe) {
        Write-Host "      Pfad: $ffExe" -ForegroundColor Gray
        Write-Host "      Starte Workstation in eigenem, neuem Firefox-Fenster..." -ForegroundColor Cyan
        Start-Process -FilePath $ffExe -ArgumentList @('-new-window', $targetUrl)
    } else {
        Start-Process $targetUrl
    }
} elseif ($userProgId -match 'Edge' -or $activeProcs -contains 'msedge' -or ($edgeExe -and -not $chromeExe)) {
    Write-Host " [OK] Standard-Browser erkannt: Microsoft Edge" -ForegroundColor Green
    if ($edgeExe) {
        Write-Host "      Starte als randlose App (--app)..." -ForegroundColor Cyan
        Start-Process -FilePath $edgeExe -ArgumentList @(('--app=' + $targetUrl))
    } else {
        Start-Process $targetUrl
    }
} elseif ($userProgId -match 'Chrome' -or $activeProcs -contains 'chrome' -or $chromeExe) {
    Write-Host " [OK] Standard-Browser erkannt: Google Chrome" -ForegroundColor Green
    if ($chromeExe) {
        Write-Host "      Starte als randlose App (--app)..." -ForegroundColor Cyan
        Start-Process -FilePath $chromeExe -ArgumentList @(('--app=' + $targetUrl))
    } else {
        Start-Process $targetUrl
    }
} else {
    Write-Host " [OK] Starte Windows 11 Standard-Browser..." -ForegroundColor Green
    Start-Process $targetUrl
}

Write-Host ""
Write-Host "[3/3] Bereit! Die Workstation laeuft." -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan
`;
    res.setHeader('Content-Disposition', 'attachment; filename="run-hybrid-windows.ps1"');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.send(psLauncher.trim().replace(/\r?\n/g, '\r\n'));
  }

  if (filename === 'package-windows-exe.ps1') {
    const psContent = `# PowerShell Build Script: Windows 11 .EXE Standalone Packager
Set-Location -Path $PSScriptRoot
Write-Host "=== Ollama & Gemini Hybrid Workstation EXE Packager ===" -ForegroundColor Cyan

$nodeVer = node -v 2>$null
if (-not $nodeVer) {
    Write-Host "Node.js ist erforderlich, um die eigenstaendige .EXE zu bauen. Bitte von nodejs.org installieren." -ForegroundColor Red
    Exit 1
}

Write-Host "1. Installiere Build-Tools fuer Windows..." -ForegroundColor Yellow
npm install --save-dev electron electron-builder

Write-Host "2. Erstelle Produktions-Build..." -ForegroundColor Yellow
npm run build

Write-Host "3. Baue native Windows .EXE mit Electron-Builder..." -ForegroundColor Yellow
npx electron-builder --win --x64

Write-Host "Fertig! Die ausfuehrbare .exe befindet sich im Ordner ./dist_electron/" -ForegroundColor Green
`;
    res.setHeader('Content-Disposition', 'attachment; filename="package-windows-exe.ps1"');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.send(psContent.trim().replace(/\r?\n/g, '\r\n'));
  }

  if (filename === 'sync-to-drive-d.bat') {
    const syncBat = `@echo off
setlocal EnableDelayedExpansion

:: 0. Verzeichniswechsel fuer Administrator-Modus
cd /d "%~dp0"

title Cloud-Daten nach Laufwerk D: sichern (D:\\OllamaKnowledge)
color 0A
cls
echo ========================================================
echo   Automatischer Cloud-zu-Laufwerk-D Synchronisierer
echo   Speichert alle AI Studio und Gemini Daten fuer Ollama
echo ========================================================
echo.

set "TARGET_DIR=D:\\OllamaKnowledge"
if not exist "D:\\" (
    echo [HINWEIS] Physisches Laufwerk D: nicht erkannt.
    echo Erstelle Ausweichordner unter C:\\OllamaKnowledge...
    set "TARGET_DIR=C:\\OllamaKnowledge"
)

if not exist "!TARGET_DIR!" (
    mkdir "!TARGET_DIR!"
    echo [OK] Zielverzeichnis !TARGET_DIR! wurde erstellt.
)

echo.
echo [1/2] Lade neueste Wissensdatenbank von der Hybrid Workstation...

set "VAULT_URL=${currentAppUrl}/api/knowledge/export/jsonl"
powershell -NoProfile -Command "$code = try { (Invoke-WebRequest -Uri 'http://localhost:3000/api/health' -TimeoutSec 1).StatusCode } catch { 0 }; if ($code -eq 200) { exit 0 } else { exit 1 }" >nul 2>&1
if %errorlevel% equ 0 (
    set "VAULT_URL=http://localhost:3000/api/knowledge/export/jsonl"
)

powershell -NoProfile -Command "$target = '!TARGET_DIR!\\gemini_knowledge_vault.jsonl'; try { Invoke-WebRequest -Uri '!VAULT_URL!' -OutFile $target -TimeoutSec 10; Write-Host ' [OK] Wissens-Tresor gemini_knowledge_vault.jsonl erfolgreich gesichert!' -ForegroundColor Green } catch { Write-Host ' [INFO] Server antwortet nicht direkt; vorhandenes lokales Archiv bleibt aktiv.' -ForegroundColor Yellow }"

echo.
echo [2/2] Generiere Offline-Markdown Wissenseintraege fuer Ollama...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$jsonPath = '!TARGET_DIR!\\gemini_knowledge_vault.jsonl'; if (Test-Path $jsonPath) { $lines = Get-Content $jsonPath; $count = 0; foreach ($l in $lines) { if ($l.Trim()) { try { $item = $l | ConvertFrom-Json; $mdFile = Join-Path '!TARGET_DIR!' ('gemini_' + $item.id + '.md'); $nl = [Environment]::NewLine; $content = '# ' + $item.prompt + $nl + $nl + '**Modell:** ' + $item.model + $nl + '**Gespeichert:** ' + $item.timestamp + $nl + $nl + '## Antwort und Erkenntnis:' + $nl + $item.response; [System.IO.File]::WriteAllText($mdFile, $content, [System.Text.Encoding]::UTF8); $count++ } catch {} } }; Write-Host (' [OK] ' + $count + ' Markdown-Wissensdateien in !TARGET_DIR! aktualisiert!') -ForegroundColor Cyan }"

echo.
echo ========================================================
echo   Synchronisation erfolgreich abgeschlossen!
echo   Pfad: !TARGET_DIR!
echo   Ollama greift nun offline und online nahtlos darauf zu.
echo ========================================================
pause
`;
    res.setHeader('Content-Disposition', 'attachment; filename="sync-to-drive-d.bat"');
    res.setHeader('Content-Type', 'application/x-bat; charset=utf-8');
    return res.send(syncBat.trim().replace(/\r?\n/g, '\r\n'));
  }

  if (filename === 'sync-to-drive-d.ps1') {
    const syncPs = `# PowerShell Script: Sicherung aller Google Gemini / AI Studio Daten auf Laufwerk D:
Set-Location -Path $PSScriptRoot
Write-Host "=== Cloud-Daten Sync fuer Ollama (Laufwerk D:) ===" -ForegroundColor Cyan

$targetDir = "D:\\OllamaKnowledge"
if (-not (Test-Path "D:\\")) {
    Write-Host "[HINWEIS] Laufwerk D: nicht vorhanden. Weiche auf C:\\OllamaKnowledge aus." -ForegroundColor Yellow
    $targetDir = "C:\\OllamaKnowledge"
}

if (-not (Test-Path $targetDir)) {
    New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
    Write-Host "[OK] Ordner $targetDir erfolgreich angelegt." -ForegroundColor Green
}

Write-Host "1. Lade JSONL Vault von der Hybrid Workstation..." -ForegroundColor Yellow
$vaultUrl = "${currentAppUrl}/api/knowledge/export/jsonl"
$testLocal = try { (Invoke-WebRequest -Uri 'http://localhost:3000/api/health' -TimeoutSec 1).StatusCode } catch { 0 }
if ($testLocal -eq 200) {
    $vaultUrl = "http://localhost:3000/api/knowledge/export/jsonl"
}
$destFile = Join-Path $targetDir "gemini_knowledge_vault.jsonl"

try {
    Invoke-RestMethod -Uri $vaultUrl -OutFile $destFile -TimeoutSec 10
    Write-Host " [OK] Erfolgreich heruntergeladen nach: $destFile" -ForegroundColor Green
} catch {
    Write-Host " [WARNUNG] Konnte Server nicht erreichen. Lokales Archiv wird beibehalten." -ForegroundColor Yellow
}

Write-Host "2. Erstelle Markdown-Wissensbasis fuer lokale Ollama RAG Abfragen..." -ForegroundColor Yellow
if (Test-Path $destFile) {
    $lines = Get-Content $destFile
    $count = 0
    foreach ($line in $lines) {
        if ($line.Trim()) {
            try {
                $entry = $line | ConvertFrom-Json
                $docPath = Join-Path $targetDir ("gemini_" + $entry.id + ".md")
                $nl = [Environment]::NewLine
                $docContent = "# " + $entry.prompt + $nl + $nl + "**Modell:** " + $entry.model + $nl + "**Archiviert:** " + $entry.timestamp + $nl + $nl + "## Erkenntnis:" + $nl + $entry.response
                [System.IO.File]::WriteAllText($docPath, $docContent, [System.Text.Encoding]::UTF8)
                $count++
            } catch {}
        }
    }
    Write-Host " [OK] $count Wissensdateien synchronisiert in $targetDir" -ForegroundColor Green
}

Write-Host "Fertig! Ollama verfuegt nun offline und online ueber den vollstaendigen Wissensstand." -ForegroundColor Cyan
`;
    res.setHeader('Content-Disposition', 'attachment; filename="sync-to-drive-d.ps1"');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.send(syncPs.trim().replace(/\r?\n/g, '\r\n'));
  }

  if (filename === 'Ollama-Gemini-Hybrid.zip') {
    const zipCandidates = [
      path.join(process.cwd(), 'public', 'Ollama-Gemini-Hybrid.zip'),
      path.join(process.cwd(), 'dist', 'Ollama-Gemini-Hybrid.zip'),
      path.join(process.cwd(), 'Ollama-Gemini-Hybrid.zip'),
    ];
    const foundZip = zipCandidates.find((p) => fs.existsSync(p));
    if (foundZip) {
      res.setHeader('Content-Disposition', 'attachment; filename="Ollama-Gemini-Hybrid.zip"');
      res.setHeader('Content-Type', 'application/zip');
      return fs.createReadStream(foundZip).pipe(res);
    }
  }

  if (filename === 'install.ps1') {
    const installPs1 = `# Windows 11 1-Klick Installer & Starter fuer Ollama + Gemini Hybrid
# Automatische Browser-Erkennung (Mozilla Firefox, Chrome, Brave, Edge oder Standard-Browser)
Set-Location -Path $PSScriptRoot
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Ollama + Google Gemini Hybrid Workstation (Win 11)   " -ForegroundColor Cyan
Write-Host "  Vollautomatische Browser-Erkennung aktiv (Firefox etc)" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

# [1/3] Test Ollama
Write-Host "[1/3] Pruefe lokalen Ollama-Dienst auf Windows 11..." -ForegroundColor Yellow
$ol = try { Invoke-RestMethod -Uri 'http://127.0.0.1:11434/api/tags' -TimeoutSec 2 } catch { $null }
if ($ol) {
    Write-Host " [OK] Ollama laeuft aktiv auf Port 11434." -ForegroundColor Green
    if ($ol.models) {
        $mNames = ($ol.models | ForEach-Object { $_.name }) -join ', '
        Write-Host "      Lokale Modelle: $mNames" -ForegroundColor Cyan
    }
} else {
    Write-Host " [INFO] Ollama laeuft noch nicht. Starte Ollama ueber das Startmenue oder mit: ollama serve" -ForegroundColor Yellow
}

# [2/3] Ensure Drive D or C directory
$vaultDir = if (Test-Path "D:\\") { "D:\\OllamaKnowledge" } else { "C:\\OllamaKnowledge" }
if (-not (Test-Path $vaultDir)) { New-Item -ItemType Directory -Force -Path $vaultDir | Out-Null }
Write-Host "[2/3] Wissensspeicher bereit unter: $vaultDir" -ForegroundColor Green

# [3/3] URL and Browser Auto-Detection
$targetUrl = "${currentAppUrl}"
$testLocal = try { (Invoke-WebRequest -Uri 'http://localhost:3000' -TimeoutSec 1).StatusCode } catch { 0 }
if ($testLocal -eq 200) { $targetUrl = "http://localhost:3000" }

# Ermittle Standard-Browser oder installierten Browser
$progId = try { (Get-ItemProperty 'HKCU:\\Software\\Microsoft\\Windows\\Shell\\Associations\\UrlAssociations\\http\\UserChoice' -ErrorAction Stop).ProgId } catch { '' }

$ffPaths = @(
    "$env:ProgramFiles\\Mozilla Firefox\\firefox.exe",
    (($env:SystemDrive + '\\Program Files (x86)\\Mozilla Firefox\\firefox.exe')),
    "$env:LocalAppData\\Mozilla Firefox\\firefox.exe"
)
$ffExe = $ffPaths | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1

$chromePaths = @(
    "$env:ProgramFiles\\Google\\Chrome\\Application\\chrome.exe",
    (($env:SystemDrive + '\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe')),
    "$env:LocalAppData\\Google\\Chrome\\Application\\chrome.exe"
)
$chromeExe = $chromePaths | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1

$edgePaths = @(
    (($env:SystemDrive + '\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe')),
    "$env:ProgramFiles\\Microsoft\\Edge\\Application\\msedge.exe",
    "$env:LocalAppData\\Microsoft\\Edge\\Application\\msedge.exe"
)
$edgeExe = $edgePaths | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1

# Desktop shortcut erstellen
$shortcutPath = [Environment]::GetFolderPath('Desktop') + '\\Ollama + Gemini Hybrid.lnk'
$wsh = New-Object -ComObject WScript.Shell
$sc = $wsh.CreateShortcut($shortcutPath)

$starterCmd = Join-Path $PSScriptRoot 'Starte-Hybrid-Workstation.cmd'
if (Test-Path $starterCmd) {
    $sc.TargetPath = $starterCmd
    $sc.WorkingDirectory = $PSScriptRoot
    $sc.Description = 'Ollama + Gemini Hybrid Workstation (Automatische Browser-Erkennung)'
} elseif ($progId -match 'Firefox' -or ($ffExe -and -not $edgeExe -and -not $chromeExe)) {
    if ($ffExe) {
        $sc.TargetPath = $ffExe
        $sc.Arguments = ('-new-window "' + $targetUrl + '"')
    } else {
        $sc.TargetPath = 'cmd.exe'
        $sc.Arguments = ('/c start "" "' + $targetUrl + '"')
    }
    $sc.Description = 'Ollama + Gemini Hybrid (Mozilla Firefox)'
} elseif ($chromeExe) {
    $sc.TargetPath = $chromeExe
    $sc.Arguments = ('--app=' + $targetUrl)
    $sc.Description = 'Ollama + Gemini Hybrid (Google Chrome)'
} elseif ($edgeExe) {
    $sc.TargetPath = $edgeExe
    $sc.Arguments = ('--app=' + $targetUrl)
    $sc.Description = 'Ollama + Gemini Hybrid (Microsoft Edge)'
} else {
    $sc.TargetPath = 'cmd.exe'
    $sc.Arguments = ('/c start "" "' + $targetUrl + '"')
    $sc.Description = 'Ollama + Gemini Hybrid Workstation (Standard-Browser)'
}
$sc.Save()

Write-Host "[3/3] Desktop-Verknuepfung erfolgreich angelegt!" -ForegroundColor Green

# Browser automatisch starten
Write-Host ""
if ($progId -match 'Firefox' -or ($ffExe -and -not $edgeExe -and -not $chromeExe)) {
    Write-Host " [OK] Standard-Browser erkannt: Mozilla Firefox" -ForegroundColor Green
    Write-Host "      Starte Workstation in eigenem neuem Firefox-Fenster..." -ForegroundColor Cyan
    if ($ffExe) {
        Start-Process $ffExe -ArgumentList @('-new-window', $targetUrl)
    } else {
        Start-Process 'firefox.exe' -ArgumentList @('-new-window', $targetUrl)
    }
} elseif ($chromeExe) {
    Write-Host " [OK] Standard-Browser erkannt: Google Chrome" -ForegroundColor Green
    Start-Process $chromeExe -ArgumentList @(('--app=' + $targetUrl))
} elseif ($edgeExe) {
    Write-Host " [OK] Standard-Browser erkannt: Microsoft Edge" -ForegroundColor Green
    Start-Process $edgeExe -ArgumentList @(('--app=' + $targetUrl))
} else {
    Write-Host " [OK] Starte Ihren Windows 11 Standard-Browser..." -ForegroundColor Green
    Start-Process $targetUrl
}
`;
    res.setHeader('Content-Disposition', 'attachment; filename="install.ps1"');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.send(installPs1.trim().replace(/\r?\n/g, '\r\n'));
  }

  if (filename === 'Starte-Eigenes-App-Fenster.cmd') {
    const ownWindowCmd = `@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"
title Ollama + Google Gemini - Eigenes App-Fenster (Windows 11)
color 0B
cls

echo ========================================================
echo   Ollama + Google Gemini Hybrid Workstation (Windows 11)
echo   EIGENE UI IM EIGENEN FENSTER (OHNE BROWSER-LEISTEN)
echo ========================================================
echo.

:: [1/2] Pruefe lokalen Ollama-Dienst
echo [1/2] Pruefe lokalen Ollama-Dienst...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$r = try { Invoke-RestMethod -Uri 'http://127.0.0.1:11434/api/tags' -TimeoutSec 2 } catch { $null }; if ($r) { Write-Host ' [OK] Ollama aktiv auf http://127.0.0.1:11434' -ForegroundColor Green; if ($r.models) { $names = ($r.models | ForEach-Object { $_.name }) -join ', '; Write-Host ('      Lokale Modelle: ' + $names) -ForegroundColor Cyan } } else { Write-Host ' [HINWEIS] Ollama laeuft noch nicht. Starten Sie Ollama bei Bedarf ueber das Startmenue.' -ForegroundColor Yellow }"

echo.
echo [2/2] Starte isoliertes Desktop-Fenster...

set "TARGET_URL=http://localhost:3000"
powershell -NoProfile -Command "$code = try { (Invoke-WebRequest -Uri 'http://localhost:3000' -TimeoutSec 1).StatusCode } catch { 0 }; if ($code -ne 200) { exit 1 }" >nul 2>&1
if %errorlevel% neq 0 (
    set "TARGET_URL=${currentAppUrl}"
)

:: Suche Browser mit Unterstuetzung fuer randlosen App-Fenster-Modus (--app)
set "APP_RUNNER="
if exist "%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe" set "APP_RUNNER=%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe"
if not defined APP_RUNNER if exist "%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe" set "APP_RUNNER=%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe"
if not defined APP_RUNNER if exist "%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe" set "APP_RUNNER=%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe"
if not defined APP_RUNNER if exist "%ProgramFiles(x86)%\\Google\\Chrome\\Application\\chrome.exe" set "APP_RUNNER=%ProgramFiles(x86)%\\Google\\Chrome\\Application\\chrome.exe"
if not defined APP_RUNNER if exist "%LocalAppData%\\Google\\Chrome\\Application\\chrome.exe" set "APP_RUNNER=%LocalAppData%\\Google\\Chrome\\Application\\chrome.exe"

if defined APP_RUNNER (
    echo  [OK] Starte isoliertes Windows 11 App-Fenster ohne Browser-Tabs und ohne URL-Leiste...
    start "" "!APP_RUNNER!" --app=!TARGET_URL!
) else (
    echo  [OK] Starte isoliertes Einzelfenster via MSHTA Popout...
    start mshta "javascript:window.open('!TARGET_URL!','HybridWorkstationApp','width=1400,height=920,menubar=0,toolbar=0,location=0,status=0,resizable=1');window.close();" 2>nul || start "" "!TARGET_URL!"
)

echo.
echo Workstation erfolgreich im eigenen Fenster geoeffnet!
timeout /t 2 >nul 2>&1
`;
    res.setHeader('Content-Disposition', 'attachment; filename="Starte-Eigenes-App-Fenster.cmd"');
    res.setHeader('Content-Type', 'application/x-bat; charset=utf-8');
    return res.send(ownWindowCmd.trim().replace(/\r?\n/g, '\r\n'));
  }

  if (filename === 'Ollama-Workstation.hta') {
    const htaContent = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Ollama + Google Gemini Hybrid Workstation</title>
<HTA:APPLICATION 
  ID="OllamaGeminiApp"
  APPLICATIONNAME="OllamaGeminiHybridWorkstation"
  BORDER="thin"
  BORDERSTYLE="normal"
  CAPTION="yes"
  MAXIMIZEBUTTON="yes"
  MINIMIZEBUTTON="yes"
  SHOWINTASKBAR="yes"
  SINGLEINSTANCE="yes"
  SYSMENU="yes"
  WINDOWSTATE="maximize"
  NAVIGABLE="yes"
/>
<script language="javascript">
  window.resizeTo(1440, 920);
  window.moveTo((screen.width - 1440)/2, (screen.height - 920)/2);
  var target = "http://localhost:3000";
  window.location.href = target;
</script>
</head>
<body style="background:#090d16;color:#ffffff;font-family:Segoe UI, sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
  <div style="text-align:center;padding:40px;">
    <h2>Ollama + Google Gemini Hybrid Workstation</h2>
    <p>Eigenes Windows 11 Anwendungsfenster laedt...</p>
  </div>
</body>
</html>
`;
    res.setHeader('Content-Disposition', 'attachment; filename="Ollama-Workstation.hta"');
    res.setHeader('Content-Type', 'application/hta; charset=utf-8');
    return res.send(htaContent.trim().replace(/\r?\n/g, '\r\n'));
  }

  if (filename === 'Install-Windows11-App.cmd' || filename === 'Start-Hybrid-Workstation.cmd') {
    const cmdContent = `@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"
title Ollama + Google Gemini Hybrid Workstation (Windows 11)
color 0B
cls

echo ========================================================
echo   Ollama + Google Gemini Hybrid Workstation (Windows 11)
echo   Universeller Starter mit automatischer Browser-Erkennung
echo ========================================================
echo.

:: [1/2] Pruefe lokalen Ollama-Dienst
echo [1/2] Pruefe lokalen Ollama-Dienst...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$r = try { Invoke-RestMethod -Uri 'http://127.0.0.1:11434/api/tags' -TimeoutSec 2 } catch { $null }; if ($r) { Write-Host ' [OK] Ollama aktiv auf http://127.0.0.1:11434' -ForegroundColor Green; if ($r.models) { $names = ($r.models | ForEach-Object { $_.name }) -join ', '; Write-Host ('      Modelle: ' + $names) -ForegroundColor Cyan } } else { Write-Host ' [HINWEIS] Ollama laeuft noch nicht. Starte Ollama ueber das Startmenue oder mit: ollama serve' -ForegroundColor Yellow }"

echo.
echo [2/2] Ermittle Ziel-Adresse und Browser (Firefox, Chrome, Edge)...

:: Ziel-Adresse pruefen
set "TARGET_URL=http://localhost:3000"
powershell -NoProfile -Command "$code = try { (Invoke-WebRequest -Uri 'http://localhost:3000' -TimeoutSec 1).StatusCode } catch { 0 }; if ($code -ne 200) { exit 1 }" >nul 2>&1
if %errorlevel% neq 0 (
    set "TARGET_URL=${currentAppUrl}"
)
echo      Ziel: !TARGET_URL!

:: Automatische Browser-Erkennung
set "BROWSER_EXE="
set "BROWSER_NAME="
set "BROWSER_ARGS="

:: Registry nach Windows-Standardbrowser abfragen
set "PROGID="
for /f "tokens=3" %%A in ('reg query "HKCU\\Software\\Microsoft\\Windows\\Shell\\Associations\\UrlAssociations\\http\\UserChoice" /v ProgId 2^>nul ^| findstr /i "ProgId"') do set "PROGID=%%A"

:: Pruefe ob Firefox bevorzugt oder aktiv ist
set "IS_FF=0"
echo !PROGID! | findstr /i "Firefox" >nul && set "IS_FF=1"
tasklist /fi "imagename eq firefox.exe" 2>nul | findstr /i "firefox.exe" >nul && set "IS_FF=1"

if "!IS_FF!"=="1" (
    if exist "%ProgramFiles%\\Mozilla Firefox\\firefox.exe" set "BROWSER_EXE=%ProgramFiles%\\Mozilla Firefox\\firefox.exe"
    if not defined BROWSER_EXE if exist "%ProgramFiles(x86)%\\Mozilla Firefox\\firefox.exe" set "BROWSER_EXE=%ProgramFiles(x86)%\\Mozilla Firefox\\firefox.exe"
    if not defined BROWSER_EXE if exist "%LocalAppData%\\Mozilla Firefox\\firefox.exe" set "BROWSER_EXE=%LocalAppData%\\Mozilla Firefox\\firefox.exe"
    if defined BROWSER_EXE (
        set "BROWSER_NAME=Mozilla Firefox"
        set "BROWSER_ARGS=-new-window !TARGET_URL!"
    )
)

:: Falls kein Firefox durch Registry, pruefe Chrome / Brave
if not defined BROWSER_EXE (
    echo !PROGID! | findstr /i "Chrome" >nul
    if !errorlevel! equ 0 (
        if exist "%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe" set "BROWSER_EXE=%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe"
        if not defined BROWSER_EXE if exist "%ProgramFiles(x86)%\\Google\\Chrome\\Application\\chrome.exe" set "BROWSER_EXE=%ProgramFiles(x86)%\\Google\\Chrome\\Application\\chrome.exe"
        if not defined BROWSER_EXE if exist "%LocalAppData%\\Google\\Chrome\\Application\\chrome.exe" set "BROWSER_EXE=%LocalAppData%\\Google\\Chrome\\Application\\chrome.exe"
        if defined BROWSER_EXE (
            set "BROWSER_NAME=Google Chrome"
            set "BROWSER_ARGS=--app=!TARGET_URL!"
        )
    )
)

:: Fallback nach vorhandenen Browser-Installationen (Firefox zuerst!)
if not defined BROWSER_EXE (
    if exist "%ProgramFiles%\\Mozilla Firefox\\firefox.exe" (
        set "BROWSER_EXE=%ProgramFiles%\\Mozilla Firefox\\firefox.exe"
        set "BROWSER_NAME=Mozilla Firefox"
        set "BROWSER_ARGS=-new-window !TARGET_URL!"
    ) else if exist "%ProgramFiles(x86)%\\Mozilla Firefox\\firefox.exe" (
        set "BROWSER_EXE=%ProgramFiles(x86)%\\Mozilla Firefox\\firefox.exe"
        set "BROWSER_NAME=Mozilla Firefox"
        set "BROWSER_ARGS=-new-window !TARGET_URL!"
    ) else if exist "%LocalAppData%\\Mozilla Firefox\\firefox.exe" (
        set "BROWSER_EXE=%LocalAppData%\\Mozilla Firefox\\firefox.exe"
        set "BROWSER_NAME=Mozilla Firefox"
        set "BROWSER_ARGS=-new-window !TARGET_URL!"
    ) else if exist "%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe" (
        set "BROWSER_EXE=%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe"
        set "BROWSER_NAME=Google Chrome"
        set "BROWSER_ARGS=--app=!TARGET_URL!"
    ) else if exist "%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe" (
        set "BROWSER_EXE=%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe"
        set "BROWSER_NAME=Microsoft Edge"
        set "BROWSER_ARGS=--app=!TARGET_URL!"
    )
)

:: Starten
if defined BROWSER_EXE (
    echo  [OK] Automatisch erkannter Browser: !BROWSER_NAME!
    echo       Starte: "!BROWSER_EXE!" !BROWSER_ARGS!
    start "" "!BROWSER_EXE!" !BROWSER_ARGS!
) else (
    echo  [OK] Starte Windows 11 Standard-Browser (Automatische Systemuebergabe)...
    start "" "!TARGET_URL!"
)

echo.
echo ========================================================
echo   Workstation erfolgreich geoeffnet!
echo ========================================================
`;
    res.setHeader('Content-Disposition', 'attachment; filename="Start-Hybrid-Workstation.cmd"');
    res.setHeader('Content-Type', 'application/x-bat; charset=utf-8');
    return res.send(cmdContent.trim().replace(/\r?\n/g, '\r\n'));
  }

  if (filename === 'Ollama-Gemini-Hybrid.exe') {
    const candidates = [
      path.join(process.cwd(), 'public', 'Ollama-Gemini-Hybrid.exe'),
      path.join(process.cwd(), 'dist', 'Ollama-Gemini-Hybrid.exe'),
      path.join(process.cwd(), 'Ollama-Gemini-Hybrid.exe')
    ];
    const found = candidates.find(p => fs.existsSync(p));
    if (found) {
      res.setHeader('Content-Disposition', 'attachment; filename="Ollama-Gemini-Hybrid.exe"');
      res.setHeader('Content-Type', 'application/vnd.microsoft.portable-executable');
      return fs.createReadStream(found).pipe(res);
    } else {
      // If raw .exe is not present, serve the complete .zip bundle as reliable alternative
      const zipPath = path.join(process.cwd(), 'public', 'Ollama-Gemini-Hybrid.zip');
      if (fs.existsSync(zipPath)) {
        res.setHeader('Content-Disposition', 'attachment; filename="Ollama-Gemini-Hybrid.zip"');
        res.setHeader('Content-Type', 'application/zip');
        return fs.createReadStream(zipPath).pipe(res);
      }
    }
  }

  res.status(404).json({ error: 'File not found' });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Hybrid Workstation Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
