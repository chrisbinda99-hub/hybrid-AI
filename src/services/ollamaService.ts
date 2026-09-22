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
      console.warn('Knowledge query skipped:', kErr);
    }
  }

  if (isDemoMode) {
    await new Promise((res) => setTimeout(res, 600 + Math.random() * 500));
    const durationMs = Math.round(performance.now() - start);

    let driveDNotice = '';
    if (matchesCount > 0) {
      driveDNotice = `\n\n📁 [Offline-Wissensspeicher D:\\OllamaKnowledge\\ aktiv]\nEs wurden ${matchesCount} archivierte Wissenseinträge aus vorherigen Cloud-Sitzungen offline geladen und in die Antwort integriert.`;
    }

    return {
      text: `[Lokale KI Ollama (${model}) auf Windows 11]\n\nDies ist die lokale, datenschutzkonforme Antwort generiert auf Ihrem System.\n\nZur Anfrage: "${prompt}"\n\n- Lokale Inferenz ohne Cloud-Übertragung\n- Latenz: ${durationMs}ms\n- Modell: ${model}\n- Status: Lokal verarbeitet auf Ihrer GPU/CPU.${driveDNotice}`,
      durationMs,
      driveDKnowledgeUsed: matchesCount,
      targetPath: 'D:\\OllamaKnowledge',
    };
  }

  const cleanHost = host.replace(/\/+$/, '');
  const effectiveSystemPrompt = contextSnippet
    ? `${systemPrompt || 'Du bist ein hilfsbereiter, lokaler KI-Assistent auf Windows 11.'}\n${contextSnippet}`
    : systemPrompt;

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
    console.warn('Direct Ollama call failed, trying server proxy...', directErr);
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
