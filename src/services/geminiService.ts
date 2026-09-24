import { GeminiModelInfo, ChatFileAttachment, GeneratedMediaItem, GenerationType } from '../types';

export const GEMINI_MODELS: GeminiModelInfo[] = [
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash (Multimodal)',
    description: 'Offiziell empfohlenes Hochleistungsmodell für Text, Bilder, Audio, Video & Dokumente mit High Thinking.',
    isDefault: true,
    supportsThinking: true,
    recommendedTier: 'Recommended & Stable',
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
    id: 'gemini-flash-latest',
    name: 'Gemini Flash Latest',
    description: 'Automatisches Cloud-Routing zur jeweils aktuellsten stabilen Inferenz-Instanz.',
    isDefault: false,
    supportsThinking: true,
    recommendedTier: 'Auto-Routing',
  },
  {
    id: 'gemini-3.1-pro-preview',
    name: 'Gemini 3.1 Pro (High Thinking)',
    description: 'Höchste Denkstufe für komplexe Programmierung, mathematische Logik & Deep Reasoning.',
    isDefault: false,
    supportsThinking: true,
    recommendedTier: 'Advanced Reasoning',
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

export interface GeminiResponseResult {
  text: string;
  durationMs: number;
  model: string;
  savedToDriveD?: boolean;
  targetPath?: string;
  notes?: string;
  generatedMedia?: GeneratedMediaItem[];
}

export async function generateGeminiResponse(
  model: string,
  prompt: string,
  systemInstruction?: string,
  enableThinking: boolean = false,
  files?: ChatFileAttachment[],
  generationType: GenerationType = 'chat',
  aspectRatio: string = '16:9',
  voice: string = 'Kore'
): Promise<GeminiResponseResult> {
  const response = await fetch('/api/gemini/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt,
      systemInstruction,
      enableThinking,
      files,
      generationType,
      aspectRatio,
      voice,
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
    generatedMedia: data.generatedMedia || [],
  };
}

export async function generateMultimodalImage(
  prompt: string,
  aspectRatio: string = '16:9'
): Promise<{ text: string; generatedMedia: GeneratedMediaItem[]; model: string }> {
  const response = await fetch('/api/multimodal/generate-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, aspectRatio }),
  });
  if (!response.ok) throw new Error(`Bildgenerierung fehlgeschlagen (Status ${response.status})`);
  return await response.json();
}

export async function generateMultimodalAudio(
  text: string,
  voice: string = 'Kore'
): Promise<{ text: string; generatedMedia: GeneratedMediaItem[]; model: string }> {
  const response = await fetch('/api/multimodal/generate-audio', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice }),
  });
  if (!response.ok) throw new Error(`Sprachgenerierung fehlgeschlagen (Status ${response.status})`);
  return await response.json();
}

export async function generateMultimodalVideo(
  prompt: string,
  aspectRatio: string = '16:9'
): Promise<{ text: string; generatedMedia: GeneratedMediaItem[]; model: string }> {
  const response = await fetch('/api/multimodal/generate-video', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, aspectRatio }),
  });
  if (!response.ok) throw new Error(`Videogenerierung fehlgeschlagen (Status ${response.status})`);
  return await response.json();
}

export async function generateMultimodalData(
  prompt: string,
  format: string = 'csv'
): Promise<{ text: string; generatedMedia: GeneratedMediaItem[]; model: string }> {
  const response = await fetch('/api/multimodal/generate-data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, format }),
  });
  if (!response.ok) throw new Error(`Datengenerierung fehlgeschlagen (Status ${response.status})`);
  return await response.json();
}

export async function collaborateHybrid(
  mode: 'refine' | 'consensus' | 'audit',
  prompt: string,
  ollamaResponse: string,
  geminiModel: string = 'gemini-3.8-flash',
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
