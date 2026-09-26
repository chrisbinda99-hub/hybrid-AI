export type AIEngine = 'ollama' | 'gemini' | 'hybrid' | 'solo_system' | 'matrix_swarm';

export type HybridMode =
  | 'smart_router'       // Automatically decides best engine (privacy/local vs reasoning/cloud)
  | 'side_by_side'       // Parallel side-by-side comparison of Ollama & Gemini
  | 'collaborative'      // 2-Stage pipeline: Local Ollama draft -> Gemini Pro High Thinking Polish
  | 'consensus'          // Both models generate, hybrid engine creates unified synthesis
  | 'matrix_swarm'       // 20 KI-Systeme Hybrid-Schwarm: Parallele Matrix-Ausführung & Konsens
  | 'solo_system';       // Einzelbetrieb: Genau 1 KI-System aus den 20 einzeln betreiben & bedienen

export type AISystemCategory =
  | 'local_ollama'
  | 'neuromorphic_slm'
  | 'google_gemini'
  | 'cloud_reasoning'
  | 'specialist_agent';

export interface AISystemDefinition {
  id: string;                   // 'sys-01' ... 'sys-20'
  systemNumber: number;         // 1 ... 20
  name: string;                 // e.g. "Ollama Llama 3.2 3B"
  shortName: string;            // e.g. "Llama 3.2"
  category: AISystemCategory;
  categoryLabel: string;        // e.g. "Lokale Ollama & Edge"
  architecture: string;         // e.g. "Meta Llama-3.2-3B-Instruct (GGUF 4_K_M)"
  parameters: string;           // e.g. "3.2B", "8B", "128 Cores SNN", "Flash 1M"
  role: string;                 // e.g. "Lokaler Edge-Generalist & DSGVO Gatekeeper"
  strengths: string[];          // e.g. ["Sub-50ms", "100% Offline", "Datenschutz"]
  status: 'online' | 'ready' | 'simulated' | 'standby';
  latencyMs: number;
  vramMb: number;
  enabledInHybrid: boolean;     // Ob dieses System im 20-KI Hybrid-Schwarm aktiv ist
  isSoloCapable: boolean;       // Einzeln lauffähig und bedienbar (alle 20 = true)
  endpointType: 'ollama' | 'gemini' | 'loihi2' | 'qwen_slm' | 'hallunox' | 'cloud_gateway';
  modelTarget: string;          // Target model identifier
  temperature: number;
  systemInstruction: string;
  badge: string;
  colorTheme: {
    bg: string;
    border: string;
    text: string;
    badgeBg: string;
  };
}

export interface SingleSystemExecutionResult {
  systemId: string;
  systemNumber: number;
  systemName: string;
  category: AISystemCategory;
  text: string;
  durationMs: number;
  tokensPerSec?: number;
  status: 'success' | 'warning' | 'error';
  modelTarget: string;
  architecture: string;
  parameters: string;
  role: string;
  timestamp: string;
  error?: string;
  metadata?: Record<string, any>;
}

export interface MatrixSwarmResult {
  masterSynthesis: string;
  consensusScore: number;       // 0 - 100% (z.B. 96.8%)
  activeSystemsCount: number;
  totalLatencyMs: number;
  fastestSystem: string;
  highestConfidenceSystem: string;
  agreedPoints: string[];
  uniqueInsights: { systemName: string; insight: string }[];
  systemResponses: SingleSystemExecutionResult[];
}

export type SwarmPresetId =
  | 'full_20_matrix'
  | 'top_5_fast'
  | 'local_offline_dsgvo'
  | 'deep_reasoning_council'
  | 'code_systems_squad';

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

export type MultimodalFileType = 'image' | 'video' | 'audio' | 'pdf' | 'code' | 'data' | 'text';

export type GenerationType = 'chat' | 'image' | 'audio' | 'video' | 'data' | 'autopilot';

export interface ChatFileAttachment {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  type: MultimodalFileType;
  dataUrl: string; // base64 data url
  thumbnailUrl?: string;
  textContent?: string;
  durationSeconds?: number;
  width?: number;
  height?: number;
}

export interface GeneratedMediaItem {
  id: string;
  type: 'image' | 'audio' | 'video' | 'data';
  title: string;
  description?: string;
  url: string; // data URL or /api/media/...
  mimeType: string;
  aspectRatio?: string;
  promptUsed?: string;
  modelUsed?: string;
  sizeBytes?: number;
  durationSeconds?: number;
  targetPath?: string; // e.g. D:\OllamaKnowledge\media\...
  codeSnippet?: string;
  language?: string;
  downloadFilename: string;
  thumbnailUrl?: string;
  subtitles?: string[];
  playbackSpeed?: number;
}

export interface CodeExecutionResult {
  id: string;
  language: string;
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
  success: boolean;
  executedAt: string;
  scriptFile?: string;
}

export interface AgentMilestone {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  toolUsed?: string;
  durationMs?: number;
  outputSnippet?: string;
}

export interface AgentExecutionTrace {
  goal: string;
  status: 'planning' | 'executing' | 'verifying' | 'completed' | 'failed';
  milestones: AgentMilestone[];
  artifacts: {
    type: 'code' | 'file' | 'media' | 'knowledge';
    name: string;
    path?: string;
    url?: string;
  }[];
  totalDurationMs: number;
  hallunoxPassed: boolean;
  savedToKnowledgeVault: boolean;
}

export interface WebSearchResultItem {
  title: string;
  snippet: string;
  url: string;
  source: string;
}

export interface AutomationPipelineSettings {
  autoPilot: boolean;
  autoRunCode: boolean;
  autoOptimizePrompt: boolean;
  autoWebSearch: boolean;
  autoVerifyHallunox: boolean;
  autoArchiveDriveD: boolean;
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
  attachments?: ChatFileAttachment[];
  generatedMedia?: GeneratedMediaItem[];
  generationType?: GenerationType;
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
    matrixSwarmResult?: MatrixSwarmResult;
    soloSystemResult?: SingleSystemExecutionResult;
    agentTrace?: AgentExecutionTrace;
    codeExecutionResults?: Record<string, CodeExecutionResult>;
    webSearchResults?: WebSearchResultItem[];
    promptOptimizedFrom?: string;
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

export type KevModelId = 'kev-0.8b' | 'kev-4b' | 'kev-9b' | 'qwen2.5:0.5b';

export interface KevFamilyMember {
  id: KevModelId;
  name: string;
  baseArchitecture: string; // e.g. "Qwen3.5-0.8B", "Qwen3.5-4B", "Qwen3.5-9B"
  parameters: string;       // "0.8B", "4B", "9B"
  latencyMs: number;        // 8ms, 22ms, 48ms
  vramMb: number;           // 620MB, 2400MB, 5800MB
  targetProfile: string;    // "Edge & Sub-10ms Gatekeeper", "Balanced Precision Head", "Deep Governance & Policy Head"
  strengths: string[];
  isDefault?: boolean;
}

export interface KevBenchmarkItemResult {
  modelId: KevModelId;
  modelName: string;
  baseArchitecture: string;
  latencyMs: number;
  vramMb: number;
  engine: 'ollama' | 'gemini' | 'hybrid';
  confidence: number;
  recommendedMode: HybridMode;
  privacyScore: number;
  complexityScore: number;
  entropy: number;
  reason: string;
  requiresDriveD: boolean;
  requiresThinking: boolean;
}

export interface KevFamilyBenchmarkResult {
  prompt: string;
  timestamp: string;
  results: KevBenchmarkItemResult[];
  fastestModel: string;
  highestConfidenceModel: string;
}

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
  model: string;              // e.g. "kev-0.8b (Qwen3.5-0.8B)" or "kev-4b (Qwen3.5-4B)" or "kev-9b (Qwen3.5-9B)"
  latencyMs: number;          // e.g. 7.4ms
  engine: 'ollama' | 'gemini' | 'hybrid';
  confidence: number;         // 0.0 - 1.0 (e.g. 0.98)
  reason: string;
  privacyScore: number;       // 0 - 100%
  complexityScore: number;    // 0 - 100%
  recommendedMode: HybridMode; // smart_router, collaborative, consensus, side_by_side
  requiresDriveDKnowledge: boolean;
  requiresThinking: boolean;
  latentFeatures?: string[];
  // Kev Decision Engine extensions (Jared Palmer / TypeSafe System One v0.1.0 on Qwen3.5)
  kevVersion?: string;
  isKevModel?: boolean;
  qwenBaseArchitecture?: string; // "Qwen3.5-0.8B", "Qwen3.5-4B", "Qwen3.5-9B"
  entropy?: number;              // Latent entropy (0.01 - 1.0)
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

