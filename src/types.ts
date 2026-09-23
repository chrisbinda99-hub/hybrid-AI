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
    qwenDecider?: QwenDeciderEvaluation;
    loihi2Routing?: Loihi2RoutingResult;
  };
}

export interface Loihi2SpikePoint {
  t: number;       // time step (0 - 50 ticks)
  neuronId: number; // 0 - 64
  layer: 'encoder' | 'lif_hidden' | 'inhibitory' | 'decision_population';
}

export interface Loihi2SpikeData {
  spikes: Loihi2SpikePoint[];
  totalSpikeCount: number;
  sparsityPercent: number; // e.g. 96.8%
}

export interface Loihi2MembraneTrace {
  neuronName: string;
  threshold: number;
  voltages: number[]; // V(t) across timesteps
  spikeTimes: number[];
}

export interface Loihi2RoutingResult {
  engine: 'ollama' | 'gemini' | 'hybrid';
  confidence: number;
  latencyMs: number;       // e.g. 0.48 ms
  latencyUs: number;       // e.g. 480 microseconds
  energyMicroJoules: number; // e.g. 15.4 uJ
  powerMw: number;         // e.g. 38.2 mW
  gpuPowerComparisonMw: number; // 35,000 mW
  energySavedPercent: number; // 99.89%
  spikesFiredTotal: number;
  sparsityPercent: number;
  neuromorphicCoreId: number; // e.g. 42
  stdpWeightUpdated: boolean;
  driveDMemoryMatch?: {
    key: string;
    score: number;
    fileSnippet?: string;
  };
  reason: string;
  recommendedMode: HybridMode;
  privacyRiskScore: number;
  complexityScore: number;
  spikeData: Loihi2SpikeData;
  membraneTraces: Loihi2MembraneTrace[];
  isHardwareLoihi2: boolean;
  lavaVersion: string;
}

export interface Loihi2Status {
  online: boolean;
  hardwareConnected: boolean;
  chipName: string;
  neuroCores: number;
  activeNeurons: number;
  synapseCount: number;
  spikeEncoding: string;
  powerMw: number;
  gpuPowerComparisonMw: number;
  energySavingsPercent: number;
  averageLatencyUs: number;
  stdpLearningActive: boolean;
  plasticSynapseCount: number;
  associativeMemorySlots: number;
  mode: 'loihi2_hardware' | 'lava_snn_emulator';
  lastChecked: string;
}

export type KevQuestionType = 'boolean' | 'choice' | 'score';

export interface KevQuestion {
  id: string;
  title: string;
  type: KevQuestionType;
  options?: string[]; // for choice
  min?: number;       // for score
  max?: number;       // for score
}

export interface KevDecisionResult {
  id: string;
  type: KevQuestionType;
  value: string | boolean | number;
  probabilities: Record<string, number>;
  confidence: number;
}

export interface KevSystemOneResponse {
  model: string;
  latencyMs: number;
  decisions: Record<string, KevDecisionResult>;
  blockCausalMaskApplied: boolean;
  forwardPassCount: number; // 1
  version?: string;
}

export interface QwenDeciderEvaluation {
  model: string;              // e.g. "kev-0.5b (Qwen-LoRA v0.1.0)" or "qwen2.5:0.5b"
  latencyMs: number;          // e.g. 14ms
  engine: 'ollama' | 'gemini' | 'hybrid';
  confidence: number;         // 0.0 - 1.0 (e.g. 0.98)
  reason: string;
  privacyScore: number;       // 0 - 100%
  complexityScore: number;    // 0 - 100%
  recommendedMode: HybridMode; // smart_router, collaborative, consensus, side_by_side
  requiresDriveDKnowledge: boolean;
  requiresThinking: boolean;
  latentFeatures?: string[];
  // Kev Decision Engine extensions (Jared Palmer / TypeSafe System One v0.1.0)
  kevVersion?: string;
  isKevModel?: boolean;
  calibratedProbabilities?: {
    engine?: Record<string, number>;
    privacy?: Record<string, number>;
    driveD?: Record<string, number>;
    thinking?: Record<string, number>;
    modes?: Record<string, number>;
  };
  kevDecisions?: Record<string, KevDecisionResult>;
  blockCausalMaskApplied?: boolean;
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
  qwenDecider?: QwenDeciderEvaluation;
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

export interface QwenDeciderStatus {
  serviceRunning: boolean;
  deciderModelAvailable: boolean;
  activeModel: string;
  availableModels: string[];
  ollamaConnected: boolean;
  targetLatencyMs: number;
  lastChecked: string;
}

