import { HybridRoutingDecision } from '../types';

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
      confidence: 0.95,
      reason: 'Sensible/vertrauliche Daten erkannt. Routet automatisch zur lokalen Ollama-Instanz für 100% Datenschutz ohne Cloud-Transfer.',
      indicators: {
        isPrivacySensitive,
        isComplexReasoning,
        isCodingTask,
        isGeneralChat,
      },
    };
  }

  if (isComplexReasoning) {
    return {
      chosenEngine: 'gemini',
      confidence: 0.92,
      reason: 'Komplexe Logik & Deep Reasoning angefordert. Routet an Google Gemini Studio mit High Thinking für höchste Präzision.',
      indicators: {
        isPrivacySensitive,
        isComplexReasoning,
        isCodingTask,
        isGeneralChat,
      },
    };
  }

  if (isCodingTask) {
    return {
      chosenEngine: 'gemini',
      confidence: 0.84,
      reason: 'Programmieraufgabe erkannt. Routet an Google Gemini für fortgeschrittene Synthese und Syntaxanalyse.',
      indicators: {
        isPrivacySensitive,
        isComplexReasoning,
        isCodingTask,
        isGeneralChat,
      },
    };
  }

  return {
    chosenEngine: 'gemini',
    confidence: 0.75,
    reason: 'Allgemeine Anfrage. Routet an Google Gemini 3.8 Flash für schnellste Latenz.',
    indicators: {
      isPrivacySensitive,
      isComplexReasoning,
      isCodingTask,
      isGeneralChat,
    },
  };
}
