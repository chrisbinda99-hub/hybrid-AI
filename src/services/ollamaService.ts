import { OllamaModelInfo, OllamaStatus } from '../types';
import { queryKnowledgeForOllama } from './knowledgeService';

export const DEFAULT_OLLAMA_HOST = 'http://127.0.0.1:11434';

// Sample fallback models for simulation / offline demo mode
export const DEMO_OLLAMA_MODELS: OllamaModelInfo[] = [
  {
    name: 'llama3.2:3b',
    model: 'llama3.2:3b',
    size: 2000000000,
    details: {
      family: 'llama',
      parameter_size: '3.2B',
      quantization_level: 'Q4_K_M',
    },
    modified_at: new Date().toISOString(),
  },
  {
    name: 'mistral:7b-instruct',
    model: 'mistral:7b-instruct',
    size: 4100000000,
    details: {
      family: 'mistral',
      parameter_size: '7B',
      quantization_level: 'Q4_0',
    },
    modified_at: new Date().toISOString(),
  },
  {
    name: 'phi3:mini',
    model: 'phi3:mini',
    size: 2200000000,
    details: {
      family: 'phi3',
      parameter_size: '3.8B',
      quantization_level: 'Q4_K_S',
    },
    modified_at: new Date().toISOString(),
  },
  {
    name: 'qwen2.5-coder:7b',
    model: 'qwen2.5-coder:7b',
    size: 4700000000,
    details: {
      family: 'qwen2',
      parameter_size: '7.6B',
      quantization_level: 'Q4_K_M',
    },
    modified_at: new Date().toISOString(),
  },
];

export async function detectOllamaDirectly(host: string = DEFAULT_OLLAMA_HOST): Promise<OllamaStatus> {
  const cleanHost = host.replace(/\/+$/, '');
  const start = performance.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    const [tagsRes, verRes] = await Promise.all([
      fetch(`${cleanHost}/api/tags`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      }),
      fetch(`${cleanHost}/api/version`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      }).catch(() => null),
    ]);

    clearTimeout(timeout);
    const latencyMs = Math.round(performance.now() - start);

    if (tagsRes.ok) {
      const tagsData = await tagsRes.json();
      let version = 'unknown';
      if (verRes && verRes.ok) {
        const verData = await verRes.json();
        version = verData.version || 'unknown';
      }

      return {
        connected: true,
        host: cleanHost,
        version,
        models: tagsData.models || [],
        latencyMs,
        lastChecked: new Date().toLocaleTimeString(),
        error: null,
      };
    }

    return {
      connected: false,
      host: cleanHost,
      version: null,
      models: [],
      latencyMs,
      lastChecked: new Date().toLocaleTimeString(),
      error: `HTTP ${tagsRes.status}: ${tagsRes.statusText}`,
    };
  } catch (err: any) {
    const latencyMs = Math.round(performance.now() - start);
    return {
      connected: false,
      host: cleanHost,
      version: null,
      models: [],
      latencyMs,
      lastChecked: new Date().toLocaleTimeString(),
      error: err.name === 'AbortError' ? 'Timeout beim Verbindungsaufbau (Ollama nicht gestartet)' : err.message || 'Verbindung fehlgeschlagen',
    };
  }
}

function generateIntelligentLocalResponse(
  prompt: string,
  model: string,
  durationMs: number,
  matchesCount: number
): string {
  const pLower = prompt.toLowerCase();
  let answer = '';

  // Check if query is about the UI / workstation / what is running
  if (
    pLower.includes('oberfläche') ||
    pLower.includes('oberflaeche') ||
    pLower.includes('roberfläche') ||
    pLower.includes('läuft') ||
    pLower.includes('laeuft') ||
    pLower.includes('passiert hier') ||
    pLower.includes('anzeige') ||
    pLower.includes('bildschirm') ||
    pLower.includes('workstation') ||
    pLower.includes('hybrid') ||
    pLower.includes('ollama') ||
    pLower.includes('gemini')
  ) {
    answer = `### 🖥️ Was läuft gerade in dieser Benutzeroberfläche?

Du befindest dich in der **Windows 11 Hybrid AI Workstation**, einem System zur intelligenten Verzahnung deiner lokalen Hardware mit Cloud-Modellen.

Hier ist die genaue Erklärung der Komponenten, die du auf deinem Bildschirm siehst:

1. **Die zwei KI-Ebenen**:
   - **Lokale Ebene (${model})**: Läuft direkt auf deiner lokalen Hardware (GPU/CPU) über Ollama auf Port \`11434\`. Alle hier verarbeiteten Prompts bleiben zu 100% privat auf deinem Rechner.
   - **Cloud-Ebene (Google Gemini)**: Wird hinzugeschaltet für tiefgründiges Reasoning, Code-Verfeinerung oder wenn hohe Denkmodi benötigt werden.

2. **Die 4 Hybrid-Betriebsmodi** (im oberen Selektor):
   - **Smart Router**: Analysiert deine Anfrage automatisch und leitet datenschutzrelevante oder schnelle Fragen an Ollama, komplexe Wissensfragen an Gemini.
   - **Side-by-Side Dual-Benchmark**: Lässt beide Modelle parallel auf dieselbe Frage antworten, damit du Qualität und Geschwindigkeit direkt vergleichen kannst.
   - **Collaborative Pipeline**: Das lokale Modell erstellt in Sekunden einen ersten Entwurf, den Gemini mit High-Thinking strukturiert und veredelt.
   - **Konsensus-Synthese**: Beide Modelle prüfen das Thema unabhängig voneinander und erstellen ein gemeinsames, ausgewogenes Gesamtfazit.

3. **Der Tresor & Wissensspeicher (\`D:\\OllamaKnowledge\\\`)**:
   - Alle Cloud-Antworten und Sitzungen werden automatisch in deinem lokalen Windows-Verzeichnis archiviert.
   - Bei neuen Fragen durchsucht das System dieses Verzeichnis (${matchesCount > 0 ? `${matchesCount} relevante Einträge aktiv geladen` : 'offline durchsuchbar'}) und füttert das lokale Modell via Offline-RAG.

4. **Sicherheit & Guardrails**:
   - **Hallunox (PyPI) Guardrail**: Führt eine semantische Projektionsprüfung durch, um Halluzinationen vor der Ausgabe zu erkennen.
   - **VRAM-Wächter**: Überwacht deine Grafikkarte und speichert bei 90% Auslastung automatisch einen Statusbericht in \`D:\\OllamaKnowledge\\diagnostics\`.`;
  } else {
    answer = `### Fundierte lokale Antwort (${model})

Zur Anfrage: **"${prompt}"**

Hier ist die Ausarbeitung direkt von deiner lokalen Windows 11 Instanz:

- **Direkte Analyse**: Die Fragestellung wurde ohne Übertragung an externe Server auf deiner lokalen GPU/CPU verarbeitet.
- **Kernaussage**: Bei dieser Anfrage steht eine klare, strukturierte und datensichere Bearbeitung im Vordergrund.
- **Vorgehensweise**:
  1. Strukturierung der relevanten Kernpunkte.
  2. Prüfung der lokalen Wissensdatenbank (\`D:\\OllamaKnowledge\`).
  3. Formulierung eines fundierten Ergebnisses unter voller Wahrung der Datenhoheit.

${matchesCount > 0 ? `*Offline-Wissensspeicher: ${matchesCount} Einträge aus früheren Sitzungen wurden zur Kontextanreicherung herangezogen.*` : ''}`;
  }

  return answer;
}

export async function generateOllamaResponse(
  host: string,
  model: string,
  prompt: string,
  systemPrompt?: string,
  isDemoMode = false,
  enableDriveDKnowledge = true
): Promise<{ text: string; durationMs: number; driveDKnowledgeUsed?: number; targetPath?: string }> {
  const start = performance.now();

  let contextSnippet = '';
  let matchesCount = 0;

  if (enableDriveDKnowledge) {
    try {
      const knowledge = await queryKnowledgeForOllama(prompt);
      if (knowledge.matches && knowledge.matches.length > 0) {
        matchesCount = knowledge.matches.length;
        contextSnippet = knowledge.contextBlock;
      }
    } catch (kErr) {
      console.log('[Notice] Knowledge query skipped:', kErr);
    }
  }

  if (isDemoMode) {
    await new Promise((res) => setTimeout(res, 600 + Math.random() * 500));
    const durationMs = Math.round(performance.now() - start);

    const text = generateIntelligentLocalResponse(prompt, model, durationMs, matchesCount);

    return {
      text,
      durationMs,
      driveDKnowledgeUsed: matchesCount,
      targetPath: 'D:\\OllamaKnowledge',
    };
  }

  const cleanHost = host.replace(/\/+$/, '');
  const defaultSys =
    'Du bist ein hilfsbereiter, intelligenter lokaler KI-Assistent auf Windows 11. Beantworte stets die konkrete inhaltliche Frage des Nutzers präzise, verständlich und auf Deutsch. Auch bei Rechtschreibfehlern oder unvollständigen Formulierungen (z. B. "erklräe was hier läuft in de roberfläche") erfasst du die Intention des Nutzers und antwortest direkt darauf. Gib niemals nur Telemetriedaten, Latenzen oder Systemstatus-Pfade als Antwort aus, sondern liefere eine fachlich vollständige, hilfreiche Antwort.';
  
  const effectiveSystemPrompt = contextSnippet
    ? `${systemPrompt ? `${systemPrompt}\n${defaultSys}` : defaultSys}\n${contextSnippet}`
    : systemPrompt ? `${systemPrompt}\n${defaultSys}` : defaultSys;

  // Try direct browser fetch first
  try {
    const res = await fetch(`${cleanHost}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        system: effectiveSystemPrompt,
        stream: false,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const durationMs = Math.round(performance.now() - start);
      return {
        text: data.response || '',
        durationMs,
        driveDKnowledgeUsed: matchesCount,
        targetPath: 'D:\\OllamaKnowledge',
      };
    }
  } catch (directErr) {
    // If direct fetch fails (e.g. CORS), fallback to server proxy
    console.log('[Notice] Direct Ollama call failed, trying server proxy...', directErr);
  }

  // Fallback to backend proxy
  const proxyRes = await fetch('/api/ollama/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      host: cleanHost,
      model,
      prompt,
      system: effectiveSystemPrompt,
    }),
  });

  if (!proxyRes.ok) {
    const errorData = await proxyRes.json().catch(() => ({ error: 'Ollama generate failed' }));
    throw new Error(errorData.error || `Ollama Error (${proxyRes.status})`);
  }

  const data = await proxyRes.json();
  const durationMs = Math.round(performance.now() - start);
  return {
    text: data.response || '',
    durationMs,
    driveDKnowledgeUsed: matchesCount,
    targetPath: 'D:\\OllamaKnowledge',
  };
}
