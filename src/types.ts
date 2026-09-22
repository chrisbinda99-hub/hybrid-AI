export type AIEngine = 'ollama' | 'gemini' | 'hybrid';

export type HybridMode =
  | 'smart_router'       // Automatically decides best engine (privacy/local vs reasoning/cloud)
  | 'side_by_side'       // Parallel side-by-side comparison of Ollama & Gemini
  | 'collaborative'      // 2-Stage pipeline: Local Ollama draft -> Gemini Pro High Thinking Polish
  | 'consensus';         // Both models generate, hybrid engine creates unified synthesis

export interface OllamaModelInfo {
  name: string;
  model: string;
  size: number;
  digest?: string;
  details?: {
    format?: string;
    family?: string;
    families?: string[];
    parameter_size?: string;
    quantization_level?: string;
  };
  modified_at?: string;
}

export interface OllamaStatus {
  connected: boolean;
  host: string;
  version: string | null;
  models: OllamaModelInfo[];
  runningModels?: string[];
  latencyMs?: number;
  lastChecked?: string;
  error?: string | null;
}

export interface GeminiModelInfo {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  supportsThinking: boolean;
  recommendedTier: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  engine: AIEngine;
  modelName: string;
  timestamp: string;
  durationMs?: number;
  thinkingContent?: string;
  metadata?: {
    mode?: HybridMode;
    routedReason?: string;
    ollamaPart?: {
      content: string;
      model: string;
      durationMs: number;
    };
    geminiPart?: {
      content: string;
      model: string;
      durationMs: number;
    };
    synthesis?: string;
    savedToDriveD?: boolean;
    targetPath?: string;
    driveDKnowledgeUsed?: number;
    hallunoxVerification?: HallunoxVerificationResult;
  };
}

export interface HybridRoutingDecision {
  chosenEngine: 'ollama' | 'gemini';
  confidence: number;
  reason: string;
  indicators: {
    isPrivacySensitive: boolean;
    isComplexReasoning: boolean;
    isCodingTask: boolean;
    isGeneralChat: boolean;
  };
}

export interface KnowledgeEntry {
  id: string;
  source: 'gemini' | 'ai_studio' | 'hybrid';
  model: string;
  prompt: string;
  response: string;
  summary?: string;
  tags: string[];
  timestamp: string;
  targetPath: string; // e.g. "D:\\OllamaKnowledge\\..."
  sizeBytes: number;
  syncedToLocalDriveD: boolean;
}

export interface DriveDSyncStatus {
  driveLetter: 'D:';
  targetFolder: string;
  totalEntries: number;
  totalBytes: number;
  lastSyncTimestamp: string;
  isOfflineReady: boolean;
  autoSyncEnabled: boolean;
  recentEntries: KnowledgeEntry[];
}

export interface DiagnosticTestResult {
  id: string;
  title: string;
  category: 'ollama' | 'gemini' | 'drive_d' | 'hybrid' | 'resilience' | 'gpu';
  description: string;
  status: 'idle' | 'running' | 'success' | 'warning' | 'error';
  latencyMs?: number;
  details?: string;
  diagnosticOutput?: string;
}

export type GpuAccelerationMode = 'active' | 'dynamic' | 'eco_cpu';

export interface VramModelProfile {
  name: string;
  paramSize: string;
  quant: string;
  vramRequiredGb: number;
  compatibility: 'perfect' | 'tight' | 'overload';
  inferenceSpeedTokensSec: number;
}

export interface GpuStatusInfo {
  gpuName: string;
  gpuMode: GpuAccelerationMode;
  totalVramGb: number;
  usedVramGb: number;
  freeVramGb: number;
  vramPercent: number;
  breakdown: {
    windows11DwmGb: number;
    modelVramGb: number;
    kvCacheGb: number;
    freeGb: number;
  };
  activeModel: {
    name: string;
    sizeVramGb: number;
    totalSizeGb: number;
    gpuOffloadPercent: number;
    layersOnGpu: number;
    totalLayers: number;
    quantization: string;
  };
  statusLevel: 'optimal' | 'warning' | 'critical';
  warnings: string[];
  recommendations: string[];
  testedModels: VramModelProfile[];
  cudaOrDirectMlDetected: boolean;
  lastUpdated: string;
}

export interface HallunoxStatus {
  installed: boolean;
  serviceRunning: boolean;
  url: string;
  version?: string;
  mode: 'live' | 'simulation' | 'offline';
  backend: 'direct_python' | 'fastapi_bridge';
  lastChecked: string;
  message?: string;
  pypiPackage: string;
  installCommand: string;
}

export interface HallunoxVerificationResult {
  verified: boolean;
  alignmentScore: number; // 0 - 100%
  hallucinationRisk: 'none' | 'low' | 'moderate' | 'high';
  hiddenStateConfidence: number; // 0 - 100%
  semanticProjectionSimilarity: number; // 0.0 - 1.0
  flaggedTokens: string[];
  explanation: string;
  mitigationApplied: boolean;
  calibratedPrompt?: string;
  latencyMs: number;
  timestamp: string;
  engine: 'hallunox-pypi' | 'hallunox-bridge-fallback';
}

