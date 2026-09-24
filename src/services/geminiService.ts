import { GeminiModelInfo } from '../types';

export const GEMINI_MODELS: GeminiModelInfo[] = [
  {
    id: 'gemini-3.5-flash',
    name: 'Gemini 3.5 Flash',
    description: 'Offiziell empfohlenes Hochleistungsmodell mit maximaler Stabilität, Durchsatz & Verfügbarkeit.',
    isDefault: true,
    supportsThinking: true,
    recommendedTier: 'Recommended & Stable',
  },
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    description: 'Neueste Modelliteration mit High Thinking. Bei Lastspitzen greift nahtloser Resilienz-Fallback.',
    isDefault: false,
    supportsThinking: true,
    recommendedTier: 'Next-Gen Flagship',
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash Lite',
    description: 'Minimale Latenz und sparsame Token-Kosten für Echtzeit-Triage & Routing.',
    isDefault: false,
    supportsThinking: false,
    recommendedTier: 'Ultra Low Latency',
  },
  {
    id: 'gemini-3.1-pro-preview',
    name: 'Gemini 3.1 Pro (High Thinking)',
    description: 'Höchste Denkstufe für komplexe Programmierung, mathematische Logik & Deep Reasoning.',
    isDefault: false,
    supportsThinking: true,
    recommendedTier: 'Advanced Reasoning',
  },
  {
    id: 'gemini-flash-latest',
    name: 'Gemini Flash Latest',
    description: 'Automatisches Cloud-Routing zur jeweils aktuellsten stabilen Inferenz-Instanz.',
    isDefault: false,
    supportsThinking: true,
    recommendedTier: 'Auto-Routing',
  },
];

function extractErrorMessage(errObj: any, fallback: string): string {
  if (!errObj) return fallback;
  if (typeof errObj === 'string') {
    try {
      const parsed = JSON.parse(errObj);
      return parsed.error?.message || parsed.message || errObj;
    } catch {
      return errObj;
    }
  }
  if (errObj.error) {
    if (typeof errObj.error === 'string') {
      try {
        const parsed = JSON.parse(errObj.error);
        return parsed.error?.message || parsed.message || errObj.error;
      } catch {
        return errObj.error;
      }
    }
    if (errObj.error.message) return errObj.error.message;
  }
  return errObj.message || fallback;
}

export async function generateGeminiResponse(
  model: string,
  prompt: string,
  systemInstruction?: string,
  enableThinking: boolean = false
): Promise<{ text: string; durationMs: number; model: string; savedToDriveD?: boolean; targetPath?: string; notes?: string }> {
  const response = await fetch('/api/gemini/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt,
      systemInstruction,
      enableThinking,
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => null);
    const message = extractErrorMessage(errData, `Gemini API Status ${response.status}`);
    throw new Error(message);
  }

  const data = await response.json();
  return {
    text: data.text,
    durationMs: data.durationMs,
    model: data.model,
    savedToDriveD: data.savedToDriveD ?? true,
    targetPath: data.targetPath || 'D:\\OllamaKnowledge\\',
    notes: data.notes,
  };
}

export async function collaborateHybrid(
  mode: 'refine' | 'consensus' | 'audit',
  prompt: string,
  ollamaResponse: string,
  geminiModel: string = 'gemini-3.6-flash',
  enableThinking: boolean = true
): Promise<{ text: string; durationMs: number; model: string; savedToDriveD?: boolean; targetPath?: string; notes?: string }> {
  const response = await fetch('/api/hybrid/collaborate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode,
      prompt,
      ollamaResponse,
      geminiModel,
      enableThinking,
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => null);
    const message = extractErrorMessage(errData, `Hybrid API Status ${response.status}`);
    throw new Error(message);
  }

  const data = await response.json();
  return {
    text: data.text,
    durationMs: data.durationMs,
    model: data.model,
    savedToDriveD: data.savedToDriveD ?? true,
    targetPath: data.targetPath || 'D:\\OllamaKnowledge\\',
    notes: data.notes,
  };
}
