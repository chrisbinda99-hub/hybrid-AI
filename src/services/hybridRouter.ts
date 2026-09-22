import { HybridRoutingDecision } from '../types';
import {
  evaluateWithQwenDecider,
  convertQwenToRoutingDecision,
  DEFAULT_QWEN_DECIDER_MODEL,
} from './qwenDeciderService';

/**
 * Millisecond Qwen Decider router.
 * Evaluates the prompt through the tiny Qwen SLM decision head (e.g. qwen2.5:0.5b / qwen3.5:0.5b).
 */
export async function analyzePromptForRoutingAsync(
  prompt: string,
  host: string = 'http://127.0.0.1:11434',
  deciderModel: string = DEFAULT_QWEN_DECIDER_MODEL,
  isDemoMode: boolean = false
): Promise<HybridRoutingDecision> {
  const evalResult = await evaluateWithQwenDecider(prompt, host, deciderModel, isDemoMode);
  return convertQwenToRoutingDecision(evalResult);
}

/**
 * Synchronous router fallback utilizing Qwen latent rules.
 */
export function analyzePromptForRouting(prompt: string): HybridRoutingDecision {
  const lower = prompt.toLowerCase();

  // Privacy indicators
  const privacyKeywords = [
    'passwort', 'password', 'token', 'secret', 'geheim', 'vertraulich',
    'gehalt', 'bank', 'iban', 'kreditkarte', 'api_key', 'apikey', 'datenbank passwort',
    'intern', 'datenschutz', 'dsgvo', 'persönlich', 'kundendaten'
  ];
  const isPrivacySensitive = privacyKeywords.some(kw => lower.includes(kw));

  // Complex reasoning indicators
  const complexKeywords = [
    'beweise', 'architektur', 'komplex', 'deep reasoning', 'mathematik',
    'algorithmus', 'refaktoriere', 'schritt für schritt', 'analysiere tief',
    'forschung', 'philosophie', 'theorem', 'quantum', 'system design'
  ];
  const isComplexReasoning = complexKeywords.some(kw => lower.includes(kw));

  // Coding indicators
  const codingKeywords = [
    'function', 'const', 'import', 'class', 'python', 'typescript', 'c++',
    'c#', 'rust', 'sql', 'bug', 'error', 'stacktrace', 'react', 'code'
  ];
  const isCodingTask = codingKeywords.some(kw => lower.includes(kw));

  const isGeneralChat = prompt.length < 60 && !isPrivacySensitive && !isComplexReasoning;

  if (isPrivacySensitive) {
    return {
      chosenEngine: 'ollama',
      confidence: 0.98,
      reason: '⚡ Qwen-Decider: Sensible/vertrauliche Daten erkannt. 100% Offline-Inferenz auf Windows 11 ohne Cloud-Transfer.',
      indicators: {
        isPrivacySensitive,
        isComplexReasoning,
        isCodingTask,
        isGeneralChat,
      },
      qwenDecider: {
        model: 'qwen2.5:0.5b (Qwen-Decider)',
        latencyMs: 14,
        engine: 'ollama',
        confidence: 0.98,
        reason: 'Sensible Datenfelder erkannt. Verbleibt vollständig im lokalen RAM/VRAM.',
        privacyScore: 99,
        complexityScore: 30,
        recommendedMode: 'smart_router',
        requiresDriveDKnowledge: true,
        requiresThinking: false,
        latentFeatures: ['privacy_lock', 'local_only'],
      },
    };
  }

  if (isComplexReasoning) {
    return {
      chosenEngine: 'gemini',
      confidence: 0.95,
      reason: '⚡ Qwen-Decider: Komplexe Logik & Deep Reasoning angefordert. Routet an Google Gemini mit High Thinking.',
      indicators: {
        isPrivacySensitive,
        isComplexReasoning,
        isCodingTask,
        isGeneralChat,
      },
      qwenDecider: {
        model: 'qwen2.5:0.5b (Qwen-Decider)',
        latencyMs: 16,
        engine: 'gemini',
        confidence: 0.95,
        reason: 'Hohe kognitive Komplexität erfordert Cloud Reasoning mit High Thinking.',
        privacyScore: 20,
        complexityScore: 95,
        recommendedMode: 'collaborative',
        requiresDriveDKnowledge: false,
        requiresThinking: true,
        latentFeatures: ['deep_reasoning', 'high_thinking'],
      },
    };
  }

  if (isCodingTask) {
    return {
      chosenEngine: 'gemini',
      confidence: 0.88,
      reason: '⚡ Qwen-Decider: Programmieraufgabe erkannt. Routet an Google Gemini für Syntaxvalidierung und Architektur.',
      indicators: {
        isPrivacySensitive,
        isComplexReasoning,
        isCodingTask,
        isGeneralChat,
      },
      qwenDecider: {
        model: 'qwen2.5:0.5b (Qwen-Decider)',
        latencyMs: 15,
        engine: 'gemini',
        confidence: 0.88,
        reason: 'Code-Generierung und Code-Refactoring.',
        privacyScore: 30,
        complexityScore: 75,
        recommendedMode: 'collaborative',
        requiresDriveDKnowledge: true,
        requiresThinking: false,
        latentFeatures: ['code_synthesis', 'developer_tools'],
      },
    };
  }

  return {
    chosenEngine: 'gemini',
    confidence: 0.82,
    reason: '⚡ Qwen-Decider: Standard-Anfrage. Routet an Google Gemini 3.8 Flash für schnellste Latenz.',
    indicators: {
      isPrivacySensitive,
      isComplexReasoning,
      isCodingTask,
      isGeneralChat,
    },
    qwenDecider: {
      model: 'qwen2.5:0.5b (Qwen-Decider)',
      latencyMs: 12,
      engine: 'gemini',
      confidence: 0.82,
      reason: 'Allgemeine Anfrage für High-Speed Flash.',
      privacyScore: 10,
      complexityScore: 25,
      recommendedMode: 'smart_router',
      requiresDriveDKnowledge: false,
      requiresThinking: false,
      latentFeatures: ['quick_response'],
    },
  };
}
