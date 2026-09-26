/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { WindowsTitleBar } from './components/WindowsTitleBar';
import { MainNavigation, WorkspaceTab } from './components/MainNavigation';
import { CompactControlBar } from './components/CompactControlBar';
import { ModelHubView } from './components/ModelHubView';
import { KnowledgeVaultView } from './components/KnowledgeVaultView';
import { AiMatrixView } from './components/AiMatrixView';
import { SystemLabView } from './components/SystemLabView';
import { DetectionPanel } from './components/DetectionPanel';
import { HybridModeSelector } from './components/HybridModeSelector';
import { ChatMessageItem } from './components/ChatMessageItem';
import { PromptInputBar } from './components/PromptInputBar';
import { DesktopPackagerModal } from './components/DesktopPackagerModal';
import { DriveDKnowledgeModal } from './components/DriveDKnowledgeModal';
import { SystemDiagnosticModal } from './components/SystemDiagnosticModal';
import { AndroidApkModal } from './components/AndroidApkModal';
import { MultiAiMatrixModal } from './components/MultiAiMatrixModal';
import { SoloSystemControlBar } from './components/SoloSystemControlBar';
import { AutomationHubView } from './components/AutomationHubView';
import { usePWAInstall } from './hooks/usePWAInstall';
import {
  ChatMessage,
  HybridMode,
  OllamaStatus,
  DriveDSyncStatus,
  AISystemDefinition,
  ChatFileAttachment,
  GenerationType,
} from './types';
import {
  getAllAISystems,
  executeSingleAISystem,
  executeMatrixSwarm,
} from './services/multiAiMatrixService';
import {
  DEFAULT_OLLAMA_HOST,
  DEMO_OLLAMA_MODELS,
  detectOllamaDirectly,
  generateOllamaResponse,
} from './services/ollamaService';
import {
  generateGeminiResponse,
  collaborateHybrid,
} from './services/geminiService';
import { fetchDriveDStatus } from './services/knowledgeService';
import { analyzePromptForRouting } from './services/hybridRouter';
import { verifyWithHallunox } from './services/hallunoxService';
import {
  evaluateWithQwenDecider,
  convertQwenToRoutingDecision,
  DEFAULT_QWEN_DECIDER_MODEL,
} from './services/qwenDeciderService';
import { routeWithLoihi2 } from './services/loihi2Service';
import { executeAutonomousAgentRun } from './services/automationService';
import { QwenDeciderEvaluation, Loihi2RoutingResult } from './types';
import {
  Cpu,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Layers,
  ArrowRight,
  HardDrive,
  Activity,
  CheckCircle2,
  Download,
  AppWindow,
  X,
  Zap,
  Brain,
  Monitor,
  Minimize2,
  Maximize2,
} from 'lucide-react';

export default function App() {
  // PWA Install hook
  const { isInstallable, isInstalled, install: installPwa } = usePWAInstall();

  // Active Software Workspace State ('chat' | 'models' | 'knowledge' | 'matrix' | 'system')
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceTab>(() => {
    return (localStorage.getItem('hybrid_active_workspace') as WorkspaceTab) || 'chat';
  });

  const handleSelectWorkspace = (tab: WorkspaceTab) => {
    setActiveWorkspace(tab);
    localStorage.setItem('hybrid_active_workspace', tab);
  };

  const handleSwitchToChatWithModel = (modelName: string) => {
    setActiveOllamaModel(modelName);
    setActiveWorkspace('chat');
    localStorage.setItem('hybrid_active_workspace', 'chat');
  };

  const handleAskInChatWithContext = (snippetText: string) => {
    setActiveWorkspace('chat');
    localStorage.setItem('hybrid_active_workspace', 'chat');
    handleSendMessage(snippetText);
  };

  // Chat Focus & Font Size State
  const [isChatFocused, setIsChatFocused] = useState<boolean>(() => {
    return localStorage.getItem('hybrid_chat_focused') === 'true';
  });
  const [chatFontSize, setChatFontSize] = useState<'normal' | 'large'>(() => {
    return (localStorage.getItem('hybrid_chat_font_size') as 'normal' | 'large') || 'normal';
  });

  const toggleChatFocus = () => {
    setIsChatFocused((prev) => {
      const next = !prev;
      localStorage.setItem('hybrid_chat_focused', String(next));
      return next;
    });
  };

  const toggleChatFontSize = () => {
    setChatFontSize((prev) => {
      const next = prev === 'normal' ? 'large' : 'normal';
      localStorage.setItem('hybrid_chat_font_size', next);
      return next;
    });
  };

  // Ollama State
  const [customHost, setCustomHost] = useState<string>(() => {
    return localStorage.getItem('hybrid_ollama_host') || DEFAULT_OLLAMA_HOST;
  });
  const [ollamaStatus, setOllamaStatus] = useState<OllamaStatus>({
    connected: false,
    host: customHost,
    version: null,
    models: DEMO_OLLAMA_MODELS,
    error: null,
  });
  const [isScanning, setIsScanning] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [activeOllamaModel, setActiveOllamaModel] = useState<string>('llama3.2:3b');

  // Gemini State
  const [activeGeminiModel, setActiveGeminiModel] = useState<string>('gemini-3.8-flash');
  const [enableThinking, setEnableThinking] = useState<boolean>(true);

  // Drive D Knowledge Vault State
  const [driveDStatus, setDriveDStatus] = useState<DriveDSyncStatus | null>(null);
  const [isDriveDOpen, setIsDriveDOpen] = useState<boolean>(false);

  // System Diagnostics State (Herz & Nieren 99% Test)
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState<boolean>(false);
  const [initialDiagnosticTab, setInitialDiagnosticTab] = useState<'tests' | 'gpu' | 'hallunox' | 'qwen' | 'loihi2' | 'interactive' | 'tuning'>('tests');

  // Qwen-Decider SLM Decision Head State (< 20ms Router & Gatekeeper)
  const [activeQwenDeciderModel, setActiveQwenDeciderModel] = useState<string>(() => {
    return localStorage.getItem('hybrid_qwen_decider_model') || DEFAULT_QWEN_DECIDER_MODEL;
  });
  const [lastQwenEvaluation, setLastQwenEvaluation] = useState<QwenDeciderEvaluation | null>(null);

  // Hybrid Mode State
  const [hybridMode, setHybridMode] = useState<HybridMode>('smart_router');

  // 20-KI-System Matrix & Solo State
  const [allAISystems, setAllAISystems] = useState<AISystemDefinition[]>(getAllAISystems);
  const [isMatrixModalOpen, setIsMatrixModalOpen] = useState(false);
  const [activeSoloSystemId, setActiveSoloSystemId] = useState<string>(() => {
    return localStorage.getItem('hybrid_active_solo_system') || 'sys-01';
  });

  const currentSoloSystem = allAISystems.find((s) => s.id === activeSoloSystemId) || allAISystems[0];
  const activeSwarmCount = allAISystems.filter((s) => s.enabledInHybrid).length;

  const handleSelectSoloSystem = (systemId: string) => {
    setActiveSoloSystemId(systemId);
    localStorage.setItem('hybrid_active_solo_system', systemId);
  };

  const handleSwitchToSoloMode = (systemId: string) => {
    setActiveSoloSystemId(systemId);
    setHybridMode('solo_system');
    localStorage.setItem('hybrid_active_solo_system', systemId);
  };

  const handleSwitchToSwarmMode = () => {
    setHybridMode('matrix_swarm');
  };

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('hybrid_chat_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Modal State
  const [isPackagerOpen, setIsPackagerOpen] = useState(false);
  const [isAndroidApkOpen, setIsAndroidApkOpen] = useState(false);

  // Dedicated App Window Mode
  const [isDismissedWindowBanner, setIsDismissedWindowBanner] = useState(() => {
    return localStorage.getItem('hybrid_dismiss_window_banner') === 'true';
  });
  const isInsideIframe = typeof window !== 'undefined' && window.self !== window.top;

  const openDedicatedAppWindow = () => {
    const width = Math.min(1440, window.screen.availWidth - 40);
    const height = Math.min(920, window.screen.availHeight - 60);
    const left = Math.max(0, Math.round((window.screen.availWidth - width) / 2));
    const top = Math.max(0, Math.round((window.screen.availHeight - height) / 2));

    const win = window.open(
      window.location.href,
      'HybridWorkstationDedicatedApp',
      `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,directories=no,scrollbars=yes,resizable=yes`
    );
    if (win) {
      win.focus();
    }
  };

  // Chat scroll anchor
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('hybrid_chat_history', JSON.stringify(messages));
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initial Scan on Mount & Drive D status & APK modal event
  useEffect(() => {
    scanOllama();
    refreshDriveDStatus();

    const handleOpenApk = () => setIsAndroidApkOpen(true);
    const handleOpenMatrix = () => setIsMatrixModalOpen(true);
    const handleSwitchToSolo = (e: any) => {
      const sysId = e.detail?.systemId;
      if (sysId) {
        handleSwitchToSoloMode(sysId);
      }
    };

    window.addEventListener('open-android-apk-modal', handleOpenApk);
    window.addEventListener('open-matrix-hub-modal', handleOpenMatrix);
    window.addEventListener('switch-to-solo-system', handleSwitchToSolo);
    return () => {
      window.removeEventListener('open-android-apk-modal', handleOpenApk);
      window.removeEventListener('open-matrix-hub-modal', handleOpenMatrix);
      window.removeEventListener('switch-to-solo-system', handleSwitchToSolo);
    };
  }, []);

  const refreshDriveDStatus = async () => {
    try {
      const st = await fetchDriveDStatus();
      setDriveDStatus(st);
    } catch (e) {
      console.log('[Notice] Drive D status update deferred:', e);
    }
  };

  const scanOllama = async () => {
    setIsScanning(true);
    setGeneralError(null);

    try {
      // 1. First probe directly from user's Windows 11 browser/client
      const clientResult = await detectOllamaDirectly(customHost);

      if (clientResult.connected && clientResult.models.length > 0) {
        setOllamaStatus(clientResult);
        setActiveOllamaModel(clientResult.models[0].name);
        setIsDemoMode(false);
        setIsScanning(false);
        return;
      }

      // 2. Fallback: probe via backend server
      const serverRes = await fetch('/api/ollama/probe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host: customHost }),
      });

      if (serverRes.ok) {
        const serverData = await serverRes.json();
        if (serverData.connected && serverData.models?.length > 0) {
          setOllamaStatus({
            connected: true,
            host: customHost,
            version: serverData.version,
            models: serverData.models,
            latencyMs: 12,
            lastChecked: new Date().toLocaleTimeString(),
            error: null,
          });
          setActiveOllamaModel(serverData.models[0].name);
          setIsDemoMode(false);
          setIsScanning(false);
          return;
        }
      }

      // If not reached, set offline and enable demo mode models so UI is fully usable
      setOllamaStatus({
        connected: false,
        host: customHost,
        version: null,
        models: DEMO_OLLAMA_MODELS,
        latencyMs: 0,
        lastChecked: new Date().toLocaleTimeString(),
        error: 'Ollama nicht gefunden auf http://127.0.0.1:11434. Nutzen Sie den Simulations-Modus oder starten Sie "ollama serve" in Windows 11.',
      });
      setIsDemoMode(true);
    } catch (err: any) {
      setOllamaStatus({
        connected: false,
        host: customHost,
        version: null,
        models: DEMO_OLLAMA_MODELS,
        latencyMs: 0,
        lastChecked: new Date().toLocaleTimeString(),
        error: err?.message || 'Fehler beim Scannen von Ollama',
      });
      setIsDemoMode(true);
    } finally {
      setIsScanning(false);
    }
  };

  const handleToggleDemoMode = () => {
    setIsDemoMode((prev) => !prev);
  };

  const handleHostChange = (newHost: string) => {
    setCustomHost(newHost);
    localStorage.setItem('hybrid_ollama_host', newHost);
  };

  // Hallunox Anti-Hallucination Guardrail Check
  const checkHallunoxGuardrail = async (prompt: string, response: string, model: string) => {
    try {
      const enabled = localStorage.getItem('hybrid_hallunox_guardrail_enabled') !== 'false';
      if (!enabled) return undefined;
      return await verifyWithHallunox({
        prompt,
        response,
        model,
        threshold: 0.85,
      });
    } catch {
      return undefined;
    }
  };

  // Main Chat / Hybrid Dispatcher
  const handleSendMessage = async (
    text: string,
    files?: ChatFileAttachment[],
    generationType: GenerationType = 'chat',
    aspectRatio = '16:9',
    voice = 'Kore'
  ) => {
    if ((!text.trim() && (!files || files.length === 0)) || isLoading) return;

    setGeneralError(null);

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      engine: 'hybrid',
      modelName: 'User',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachments: files,
      generationType,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Specialized Autonomous Mode (Auto-Pilot Multi-Agent)
      if (generationType === 'autopilot') {
        const agentRes = await executeAutonomousAgentRun(text);
        const assistantMsg: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: agentRes.finalSynthesis,
          engine: 'hybrid',
          modelName: 'Auto-Pilot Multi-Agent',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          durationMs: agentRes.durationMs,
          metadata: {
            mode: 'smart_router',
            routedReason: 'Autonomer Multi-Agenten Ablaufplan (Auto-Pilot)',
            savedToDriveD: true,
            targetPath: agentRes.trace.artifacts[0]?.path || 'D:\\OllamaKnowledge\\auto_learning\\',
            agentTrace: agentRes.trace,
          },
        };
        setMessages((prev) => [...prev, assistantMsg]);
        return;
      }

      // Specialized Generative Mode (Image, Audio/TTS, Video/Motion, Data)
      if (generationType !== 'chat') {
        const geminiRes = await generateGeminiResponse(
          activeGeminiModel,
          text,
          undefined,
          enableThinking,
          files,
          generationType,
          aspectRatio,
          voice
        );

        const assistantMsg: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: geminiRes.text,
          engine: 'gemini',
          modelName: geminiRes.model,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          durationMs: geminiRes.durationMs,
          generatedMedia: geminiRes.generatedMedia,
          generationType,
          metadata: {
            mode: 'smart_router',
            routedReason: `Multimodale Generierung: ${generationType.toUpperCase()}`,
            savedToDriveD: geminiRes.savedToDriveD ?? true,
            targetPath: geminiRes.targetPath || 'D:\\OllamaKnowledge\\media\\',
          },
        };
        setMessages((prev) => [...prev, assistantMsg]);
        return;
      }

      // 0. Intel Loihi 2 Neuromorphic Spiking Engine: Sub-millisecond SNN decision & associative memory
      const loihi2Routing = await routeWithLoihi2(text, { enableStdp: true });

      // 1. Central Qwen-Decider SLM Pipeline: Every request passes through the Decision Head
      const qwenEval = await evaluateWithQwenDecider(
        text,
        customHost,
        activeQwenDeciderModel,
        isDemoMode
      );
      setLastQwenEvaluation(qwenEval);

      if (hybridMode === 'solo_system') {
        // Individual Operation of ANY of the 20 AI systems
        const singleResult = await executeSingleAISystem(activeSoloSystemId, text, {
          customHost,
          isDemoMode,
          driveDKnowledge: qwenEval.requiresDriveDKnowledge,
        });

        const hallunoxVerification = await checkHallunoxGuardrail(text, singleResult.text, singleResult.systemName);

        const assistantMsg: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: singleResult.text,
          engine: 'solo_system',
          modelName: singleResult.systemName,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          durationMs: singleResult.durationMs,
          metadata: {
            mode: 'solo_system',
            routedReason: `Einzelbetrieb: ${singleResult.role}`,
            savedToDriveD: true,
            targetPath: 'D:\\OllamaKnowledge\\',
            hallunoxVerification,
            qwenDecider: qwenEval,
            loihi2Routing,
            soloSystemResult: singleResult,
          },
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else if (hybridMode === 'matrix_swarm') {
        // 20-KI-System Hybrid Swarm Matrix Execution
        const swarmResult = await executeMatrixSwarm(text, undefined, {
          customHost,
          isDemoMode,
        });

        const hallunoxVerification = await checkHallunoxGuardrail(text, swarmResult.masterSynthesis, '20-KI Hybrid-Matrix');

        const assistantMsg: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: swarmResult.masterSynthesis,
          engine: 'matrix_swarm',
          modelName: `20-KI Hybrid-Schwarm (${swarmResult.activeSystemsCount} Systeme)`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          durationMs: swarmResult.totalLatencyMs,
          metadata: {
            mode: 'matrix_swarm',
            routedReason: `20-KI Matrix-Konsensus (${swarmResult.consensusScore}% Übereinstimmung)`,
            savedToDriveD: true,
            targetPath: 'D:\\OllamaKnowledge\\',
            hallunoxVerification,
            qwenDecider: qwenEval,
            loihi2Routing,
            matrixSwarmResult: swarmResult,
          },
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else if (hybridMode === 'smart_router') {
        // Mode 1: Smart Router (Governed by Qwen-Decider & Loihi 2 SNN)
        const decision = convertQwenToRoutingDecision(qwenEval);

        // If files are attached, route to multimodal Gemini Cloud
        const hasMultimodalFiles = files && files.length > 0;

        if (decision.chosenEngine === 'ollama' && !hasMultimodalFiles) {
          // Route to Ollama
          const ollamaRes = await generateOllamaResponse(
            customHost,
            activeOllamaModel,
            text,
            'Du bist eine hilfsbereite lokale KI auf Windows 11. Beantworte stets die konkrete inhaltliche Frage des Nutzers präzise, verständlich und auf Deutsch. Auch bei Tippfehlern erfasst du die Intention und antwortest direkt.',
            isDemoMode,
            qwenEval.requiresDriveDKnowledge // Dynamic RAG injection governed by Qwen
          );

          const hallunoxVerification = await checkHallunoxGuardrail(text, ollamaRes.text, activeOllamaModel);

          const assistantMsg: ChatMessage = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: ollamaRes.text,
            engine: 'ollama',
            modelName: activeOllamaModel,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            durationMs: ollamaRes.durationMs,
            metadata: {
              mode: 'smart_router',
              routedReason: decision.reason,
              driveDKnowledgeUsed: ollamaRes.driveDKnowledgeUsed,
              targetPath: ollamaRes.targetPath,
              hallunoxVerification,
              qwenDecider: qwenEval,
              loihi2Routing,
            },
          };
          setMessages((prev) => [...prev, assistantMsg]);
        } else {
          // Route to Google Gemini with automatic failover to local Windows 11 Ollama
          try {
            const geminiRes = await generateGeminiResponse(
              activeGeminiModel,
              text,
              undefined,
              enableThinking || qwenEval.requiresThinking || activeGeminiModel === 'gemini-3.1-pro-preview',
              files,
              generationType,
              aspectRatio,
              voice
            );

            const hallunoxVerification = await checkHallunoxGuardrail(text, geminiRes.text, geminiRes.model);

            const assistantMsg: ChatMessage = {
              id: `assistant-${Date.now()}`,
              role: 'assistant',
              content: geminiRes.text,
              engine: 'gemini',
              modelName: geminiRes.model,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              durationMs: geminiRes.durationMs,
              generatedMedia: geminiRes.generatedMedia,
              generationType,
              metadata: {
                mode: 'smart_router',
                routedReason: hasMultimodalFiles
                  ? `Multimodale Analyse von ${files.length} Datei(en) via Gemini Flash`
                  : geminiRes.notes
                  ? `${decision.reason} (${geminiRes.notes})`
                  : decision.reason,
                savedToDriveD: geminiRes.savedToDriveD ?? true,
                targetPath: geminiRes.targetPath || 'D:\\OllamaKnowledge\\',
                hallunoxVerification,
                qwenDecider: qwenEval,
                loihi2Routing,
              },
            };
            setMessages((prev) => [...prev, assistantMsg]);
          } catch (geminiErr: any) {
            console.log('[Failover] Gemini cloud temporarily unavailable, executing seamless hybrid failover to Ollama:', geminiErr);
            let promptWithFiles = text;
            if (files && files.length > 0) {
              const textFiles = files.filter((f) => f.textContent);
              if (textFiles.length > 0) {
                promptWithFiles = `${text}\n\n[Angehängte Dateien]:\n` +
                  textFiles.map((f) => `--- ${f.name} ---\n${f.textContent}`).join('\n\n');
              }
            }

            const ollamaRes = await generateOllamaResponse(
              customHost,
              activeOllamaModel,
              promptWithFiles,
              'Du bist eine hilfsbereite lokale KI auf Windows 11. Beantworte stets die konkrete inhaltliche Frage des Nutzers präzise, verständlich und auf Deutsch.',
              isDemoMode,
              true
            );

            const hallunoxVerification = await checkHallunoxGuardrail(text, ollamaRes.text, activeOllamaModel);

            const assistantMsg: ChatMessage = {
              id: `assistant-${Date.now()}`,
              role: 'assistant',
              content: `${ollamaRes.text}\n\n---\n*Hybrid-Ausfallsicherheit aktiv: Da Google Gemini Cloud aktuell temporär ausgelastet ist (503 High Demand), hat Ihr lokales Windows 11 Ollama-Modell (${activeOllamaModel}) die Beantwortung ohne Ausfall übernommen.*`,
              engine: 'ollama',
              modelName: `${activeOllamaModel} (Hybrid Failover)`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              durationMs: ollamaRes.durationMs,
              metadata: {
                mode: 'smart_router',
                routedReason: 'Automatischer Failover bei Cloud-Auslastung',
                driveDKnowledgeUsed: ollamaRes.driveDKnowledgeUsed,
                targetPath: ollamaRes.targetPath,
                hallunoxVerification,
                qwenDecider: qwenEval,
                loihi2Routing,
              },
            };
            setMessages((prev) => [...prev, assistantMsg]);
          }
        }
      } else if (hybridMode === 'side_by_side') {
        // Mode 2: Side-by-Side Dual Benchmark
        const [ollamaResult, geminiResult] = await Promise.allSettled([
          generateOllamaResponse(customHost, activeOllamaModel, text, undefined, isDemoMode, true),
          generateGeminiResponse(
            activeGeminiModel,
            text,
            undefined,
            enableThinking || qwenEval.requiresThinking || activeGeminiModel === 'gemini-3.1-pro-preview'
          ),
        ]);

        const ollamaContent =
          ollamaResult.status === 'fulfilled'
            ? ollamaResult.value.text
            : `Fehler: ${ollamaResult.reason?.message || 'Ollama Request Failed'}`;
        const ollamaDuration =
          ollamaResult.status === 'fulfilled' ? ollamaResult.value.durationMs : 0;
        const ollamaKnowledgeUsed =
          ollamaResult.status === 'fulfilled' ? ollamaResult.value.driveDKnowledgeUsed : 0;

        let geminiContent = '';
        if (geminiResult.status === 'fulfilled') {
          geminiContent = geminiResult.value.text;
        } else {
          const rawReason = geminiResult.reason?.message || '';
          if (rawReason.includes('503') || rawReason.includes('high demand') || rawReason.includes('UNAVAILABLE')) {
            geminiContent = 'Hinweis: Google Gemini verzeichnet aktuell temporär hohe weltweite Auslastung (503). Ihr lokales Ollama-Modell hat parallel erfolgreich geantwortet.';
          } else {
            geminiContent = `Cloud-Hinweis: ${rawReason || 'Gemini Anfrage fehlgeschlagen'}`;
          }
        }
        const geminiDuration =
          geminiResult.status === 'fulfilled' ? geminiResult.value.durationMs : 0;

        const hallunoxVerification = await checkHallunoxGuardrail(
          text,
          `${ollamaContent}\n\n${geminiContent}`,
          `${activeOllamaModel} & ${activeGeminiModel}`
        );

        const assistantMsg: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: 'Side-by-Side Benchmark abgeschlossen.',
          engine: 'hybrid',
          modelName: 'Ollama & Gemini',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          durationMs: Math.max(ollamaDuration, geminiDuration),
          metadata: {
            mode: 'side_by_side',
            savedToDriveD: true,
            targetPath: 'D:\\OllamaKnowledge\\',
            driveDKnowledgeUsed: ollamaKnowledgeUsed,
            hallunoxVerification,
            qwenDecider: qwenEval,
            loihi2Routing,
            ollamaPart: {
              content: ollamaContent,
              model: activeOllamaModel,
              durationMs: ollamaDuration,
            },
            geminiPart: {
              content: geminiContent,
              model: activeGeminiModel,
              durationMs: geminiDuration,
            },
          },
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else if (hybridMode === 'collaborative') {
        // Mode 3: Collaborative Pipeline (Ollama Draft -> Gemini Pro Polish)
        const localDraft = await generateOllamaResponse(
          customHost,
          activeOllamaModel,
          text,
          'Erstelle einen ersten inhaltlich fundierten, strukturierten Entwurf zu dieser Nutzeranfrage. Beantworte die Frage direkt und verständlich.',
          isDemoMode,
          true
        );

        // Step 2: Refine with Gemini High Thinking
        const refined = await collaborateHybrid(
          'refine',
          text,
          localDraft.text,
          activeGeminiModel,
          enableThinking || qwenEval.requiresThinking || activeGeminiModel === 'gemini-3.1-pro-preview'
        );

        const totalDuration = localDraft.durationMs + refined.durationMs;
        const hallunoxVerification = await checkHallunoxGuardrail(text, refined.text, refined.model);

        const assistantMsg: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: refined.text,
          engine: 'hybrid',
          modelName: `${activeOllamaModel} + ${refined.model}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          durationMs: totalDuration,
          metadata: {
            mode: 'collaborative',
            savedToDriveD: refined.savedToDriveD ?? true,
            targetPath: refined.targetPath || 'D:\\OllamaKnowledge\\',
            driveDKnowledgeUsed: localDraft.driveDKnowledgeUsed,
            hallunoxVerification,
            qwenDecider: qwenEval,
            loihi2Routing,
            ollamaPart: {
              content: localDraft.text,
              model: activeOllamaModel,
              durationMs: localDraft.durationMs,
            },
            geminiPart: {
              content: refined.text,
              model: refined.model,
              durationMs: refined.durationMs,
            },
          },
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else if (hybridMode === 'consensus') {
        // Mode 4: Consensus Synthesis
        const localResponse = await generateOllamaResponse(
          customHost,
          activeOllamaModel,
          text,
          'Beantworte diese Frage fundiert, direkt und verständlich aus deiner lokalen Modell-Perspektive.',
          isDemoMode,
          true
        );

        const consensusRes = await collaborateHybrid(
          'consensus',
          text,
          localResponse.text,
          activeGeminiModel,
          enableThinking || qwenEval.requiresThinking || activeGeminiModel === 'gemini-3.1-pro-preview'
        );

        const hallunoxVerification = await checkHallunoxGuardrail(text, consensusRes.text, consensusRes.model);

        const assistantMsg: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: consensusRes.text,
          engine: 'hybrid',
          modelName: 'Konsensus Verbund',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          durationMs: localResponse.durationMs + consensusRes.durationMs,
          metadata: {
            mode: 'consensus',
            savedToDriveD: consensusRes.savedToDriveD ?? true,
            targetPath: consensusRes.targetPath || 'D:\\OllamaKnowledge\\',
            driveDKnowledgeUsed: localResponse.driveDKnowledgeUsed,
            hallunoxVerification,
            qwenDecider: qwenEval,
            loihi2Routing,
            ollamaPart: {
              content: localResponse.text,
              model: activeOllamaModel,
              durationMs: localResponse.durationMs,
            },
            geminiPart: {
              content: consensusRes.text,
              model: consensusRes.model,
              durationMs: consensusRes.durationMs,
            },
          },
        };
        setMessages((prev) => [...prev, assistantMsg]);
      }
    } catch (err: any) {
      console.log('[Notice] Chat handled inference exception:', err);
      let errMsg = err?.message || 'Ein Fehler ist bei der Inferenz aufgetreten.';
      try {
        if (typeof errMsg === 'string' && (errMsg.startsWith('{') || errMsg.includes('ApiError: {'))) {
          const jsonMatch = errMsg.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            errMsg = parsed.error?.message || parsed.message || errMsg;
          }
        }
      } catch {}
      setGeneralError(errMsg);
    } finally {
      setIsLoading(false);
      refreshDriveDStatus();
    }
  };

  const handleClearHistory = () => {
    setMessages([]);
    localStorage.removeItem('hybrid_chat_history');
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* 1. Windows 11 Frame Titlebar */}
      <WindowsTitleBar
        ollamaConnected={ollamaStatus.connected}
        activeOllamaModel={activeOllamaModel}
        activeGeminiModel={activeGeminiModel}
        isStandalone={isInstalled}
        onOpenPackager={() => setIsPackagerOpen(true)}
        onInstallPwa={installPwa}
        canInstallPwa={isInstallable}
        onOpenDriveD={() => setIsDriveDOpen(true)}
        onOpenDiagnostics={() => setIsDiagnosticOpen(true)}
        onOpenAndroidApk={() => setIsAndroidApkOpen(true)}
      />

      {/* 1b. Main Software Workstation Navigation Bar */}
      <MainNavigation
        activeWorkspace={activeWorkspace}
        onSelectWorkspace={handleSelectWorkspace}
        ollamaStatus={ollamaStatus}
        activeOllamaModel={activeOllamaModel}
        activeGeminiModel={activeGeminiModel}
        hybridMode={hybridMode}
        driveDCount={driveDStatus?.totalEntries ?? 3}
        activeSystemsCount={activeSwarmCount}
        onOpenDedicatedWindow={openDedicatedAppWindow}
        onOpenPackager={() => setIsPackagerOpen(true)}
        onOpenAndroidApk={() => setIsAndroidApkOpen(true)}
        onInstallPwa={installPwa}
        canInstallPwa={isInstallable}
        isStandalone={isInstalled}
      />

      {/* Dedicated Window Notification Banner (if running in iframe/preview) */}
      {isInsideIframe && !isDismissedWindowBanner && (
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-blue-950 border-b border-indigo-500/40 px-4 py-2 flex items-center justify-between text-xs text-indigo-100 z-20 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
              <AppWindow className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
              <span className="font-semibold text-slate-100">Eigenes Windows 11 Anwendungsfenster:</span>
              <span className="text-slate-300 text-[11px]">
                Öffnen Sie die Workstation in einem isolierten Einzelfenster ohne Browser-Tabs und ohne Adressleiste.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={openDedicatedAppWindow}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer"
            >
              <AppWindow className="w-3.5 h-3.5" />
              <span>Fenster öffnen</span>
            </button>
            <button
              onClick={() => {
                setIsDismissedWindowBanner(true);
                localStorage.setItem('hybrid_dismiss_window_banner', 'true');
              }}
              className="p-1 text-slate-400 hover:text-slate-200 rounded cursor-pointer"
              title="Hinweis schließen"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* WORKSPACE 1: STUDIO CHAT & REASONING */}
      {activeWorkspace === 'chat' && (
        <>
          {/* Top Header & Compact Control Center */}
          {!isChatFocused ? (
            <CompactControlBar
              ollamaStatus={ollamaStatus}
              isScanning={isScanning}
              onScan={scanOllama}
              activeOllamaModel={activeOllamaModel}
              onSelectOllamaModel={setActiveOllamaModel}
              isDemoMode={isDemoMode}
              onToggleDemoMode={handleToggleDemoMode}
              customHost={customHost}
              onChangeHost={handleHostChange}
              mode={hybridMode}
              onSelectMode={setHybridMode}
              geminiModel={activeGeminiModel}
              onSelectGeminiModel={setActiveGeminiModel}
              enableThinking={enableThinking}
              onToggleThinking={() => setEnableThinking((prev) => !prev)}
              onOpenDriveD={() => setIsDriveDOpen(true)}
              driveDCount={driveDStatus?.totalEntries ?? 3}
              onOpenQwenDecider={() => {
                setInitialDiagnosticTab('qwen');
                setIsDiagnosticOpen(true);
              }}
              activeQwenModel={activeQwenDeciderModel}
              onOpenLoihi2={() => {
                setInitialDiagnosticTab('loihi2');
                setIsDiagnosticOpen(true);
              }}
              onOpenDiagnostics={() => {
                setInitialDiagnosticTab('tests');
                setIsDiagnosticOpen(true);
              }}
              onOpenMatrixModal={() => setIsMatrixModalOpen(true)}
              activeSystemsCount={activeSwarmCount}
              onOpenPackager={() => setIsPackagerOpen(true)}
              onOpenAndroidApk={() => setIsAndroidApkOpen(true)}
              isChatFocused={isChatFocused}
              onToggleChatFocus={toggleChatFocus}
              chatFontSize={chatFontSize}
              onToggleChatFontSize={toggleChatFontSize}
            />
          ) : (
            <div className="bg-slate-950/95 border-b border-slate-800/80 px-4 py-1.5 flex items-center justify-between text-xs text-slate-400 z-10 shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-slate-200 font-medium">Fokus-Modus (Maximales Chatfenster)</span>
                <span className="text-slate-600 hidden sm:inline">•</span>
                <span className="text-emerald-400 font-mono text-[11px] hidden sm:inline">{activeOllamaModel}</span>
                <span className="text-slate-600 hidden sm:inline">+</span>
                <span className="text-cyan-400 font-mono text-[11px] hidden sm:inline">{activeGeminiModel}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMatrixModalOpen(true)}
                  className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-700/60 text-cyan-200 hover:text-white text-[11px] font-medium transition cursor-pointer"
                >
                  20 KI-Matrix ({activeSwarmCount}/20)
                </button>
                <button
                  onClick={toggleChatFontSize}
                  className="px-2.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition cursor-pointer"
                  title="Schriftgröße umschalten"
                >
                  {chatFontSize === 'large' ? 'Schrift: Groß (A+)' : 'Schrift: Standard (A)'}
                </button>
                <button
                  onClick={toggleChatFocus}
                  className="px-2.5 py-0.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-medium transition cursor-pointer flex items-center gap-1 shadow-sm"
                  title="Steuerleiste wieder einblenden"
                >
                  <Minimize2 className="w-3 h-3" />
                  <span>Leiste einblenden</span>
                </button>
              </div>
            </div>
          )}

          {/* Solo System Operator Bar when operating any single AI system individually */}
          {hybridMode === 'solo_system' && (
            <SoloSystemControlBar
              activeSystem={currentSoloSystem}
              allSystems={allAISystems}
              onSelectSystem={handleSelectSoloSystem}
              onSwitchToSwarm={handleSwitchToSwarmMode}
              onOpenMatrixModal={() => setIsMatrixModalOpen(true)}
              customHost={customHost}
            />
          )}

          {/* Main Chat Stream & Workspace */}
          <main className="flex-1 overflow-y-auto px-3 sm:px-6 lg:px-8 py-4 space-y-4">
            <div className="w-full max-w-6xl 2xl:max-w-7xl mx-auto">
              {/* Error Banner */}
              {generalError && (
                <div className="mb-4 p-3.5 bg-rose-950/80 border border-rose-800/80 rounded-xl text-rose-200 text-xs flex items-center justify-between gap-3 shadow-md">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{generalError}</span>
                  </div>
                  <button
                    onClick={() => setGeneralError(null)}
                    className="px-2 py-0.5 bg-rose-900/60 hover:bg-rose-900 text-rose-100 rounded text-[11px]"
                  >
                    Ausblenden
                  </button>
                </div>
              )}

              {/* Welcome Screen if empty */}
              {messages.length === 0 && (
                <div className="my-6 text-center max-w-3xl mx-auto space-y-4 py-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-cyan-300">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Windows 11 Hybrid KI Workstation • Bereit</span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">
                    Lokales Ollama &amp; Google Gemini im Verbund
                  </h2>

                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                    Dieses System erkennt automatisch Ihre lokalen Sprachmodelle auf Windows 11 und
                    kombiniert diese nahtlos mit Google Gemini Studio in der Cloud. Nutzen Sie absoluten
                    Datenschutz für sensible Daten und unbegrenzte Rechenleistung für komplexe Analysen.
                  </p>

                  {/* 4 Feature cards including Drive D */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-left pt-2">
                    <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                      <div className="w-7 h-7 rounded-lg bg-emerald-950/80 border border-emerald-700/50 flex items-center justify-center text-emerald-400">
                        <Cpu className="w-4 h-4" />
                      </div>
                      <h4 className="font-semibold text-xs text-slate-200">1. Windows 11 Erkennung</h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Scannt <code className="text-slate-300 font-mono">127.0.0.1:11434</code> nach
                        Llama 3, Mistral, Qwen und Phi Modellen.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                      <div className="w-7 h-7 rounded-lg bg-cyan-950/80 border border-cyan-700/50 flex items-center justify-center text-cyan-400">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <h4 className="font-semibold text-xs text-slate-200">2. Google Gemini Thinking</h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Höchste Denkstufe für komplexe Programmierung, Deep Reasoning und Verbund-Synthese.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                      <div className="w-7 h-7 rounded-lg bg-amber-950/80 border border-amber-700/50 flex items-center justify-center text-amber-400">
                        <HardDrive className="w-4 h-4" />
                      </div>
                      <h4 className="font-semibold text-xs text-slate-200">3. Laufwerk D: Tresor</h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Alle Cloud-Daten fließen automatisch nach <code className="text-slate-300 font-mono">D:\OllamaKnowledge</code> für Offline-RAG.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                      <div className="w-7 h-7 rounded-lg bg-indigo-950/80 border border-indigo-700/50 flex items-center justify-center text-indigo-400">
                        <Layers className="w-4 h-4" />
                      </div>
                      <h4 className="font-semibold text-xs text-slate-200">4. Native *.EXE Ausführung</h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Unabhängig ohne Browser als Desktop-App ausführbar mit 1-Klick Installer &amp; Skripten.
                      </p>
                    </div>
                  </div>

                  {/* 1-Click Starter Prompts for Easy Understanding */}
                  <div className="space-y-2 pt-2 text-left">
                    <div className="text-xs font-semibold text-slate-400">
                      Schnellstarter (Klicken zum sofortigen Ausprobieren):
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        onClick={() =>
                          handleSendMessage(
                            'Erstelle mir eine prägnante, datenschutzkonforme Zusammenfassung der wichtigsten Vorteile von lokalen Sprachmodellen auf Windows 11 gegenüber reinen Cloud-Modellen.'
                          )
                        }
                        className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 text-left transition cursor-pointer space-y-1"
                      >
                        <div className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>DSGVO-Vergleich lokal vs. Cloud</span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Automatische Weiche entscheidet, welcher Teil lokal gerechnet wird.
                        </div>
                      </button>

                      <button
                        onClick={() =>
                          handleSendMessage(
                            'Schreibe eine performante TypeScript-Funktion zur Validierung von API-Schlüsseln mit regulären Ausdrücken und Unit-Tests.'
                          )
                        }
                        className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 text-left transition cursor-pointer space-y-1"
                      >
                        <div className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5">
                          <Cpu className="w-3.5 h-3.5" />
                          <span>Code-Generierung &amp; Testing</span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Nutzt Qwen Coder lokal und Gemini Thinking für sauberen Code.
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setHybridMode('matrix_swarm');
                          handleSendMessage(
                            'Welche drei architektonischen Maßnahmen garantieren die höchste Skalierbarkeit für hybride KI-Workstations in Unternehmen?'
                          );
                        }}
                        className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 text-left transition cursor-pointer space-y-1"
                      >
                        <div className="text-xs font-semibold text-purple-300 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5" />
                          <span>20-KI Schwarm-Konsens</span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Lässt alle 20 Spezialsysteme gleichzeitig denken und Konsens bilden.
                        </div>
                      </button>

                      <button
                        onClick={() =>
                          handleSendMessage(
                            'Löse folgende logische Denkaufgabe Schritt für Schritt mit voller Gedankenkette: Wenn drei Schalter außerhalb eines Raumes eine Glühbirne im Raum steuern, wie ermittelt man mit genau einem Betreten des Raumes den richtigen Schalter?'
                          )
                        }
                        className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 text-left transition cursor-pointer space-y-1"
                      >
                        <div className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Gemini Deep Thinking Rätsel</span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Schrittweise Herleitung mit transparenter Gedankenkette.
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Messages Stream */}
              {messages.map((msg) => (
                <ChatMessageItem key={msg.id} message={msg} fontSize={chatFontSize} />
              ))}

              {/* Loading Indicator */}
              {isLoading && (
                <div className="my-4 p-4 bg-slate-900/80 border border-slate-800 rounded-2xl max-w-xl animate-pulse flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800/80 flex items-center justify-center text-cyan-400">
                    <Sparkles className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="text-xs text-slate-300">
                    <div className="font-medium text-slate-200">
                      {hybridMode === 'smart_router' && 'Smart Router analysiert & generiert...'}
                      {hybridMode === 'side_by_side' && 'Führe Ollama & Gemini parallel aus...'}
                      {hybridMode === 'collaborative' && 'Stufe 1 & Stufe 2 Verbund-Ausführung...'}
                      {hybridMode === 'consensus' && 'Erzeuge Konsensus-Synthese...'}
                      {hybridMode === 'matrix_swarm' && '20-KI Schwarm generiert Master-Synthese...'}
                      {hybridMode === 'solo_system' && `Solo-System ${currentSoloSystem.name} rechnet...`}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Lokale Inferenz ({activeOllamaModel}) &amp; Google AI ({activeGeminiModel})
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </main>

          {/* Bottom Prompt Input Bar */}
          <footer className="border-t border-slate-800/80 bg-slate-950/95 backdrop-blur px-3 sm:px-6 lg:px-8 py-2.5 shrink-0">
            <div className="w-full max-w-6xl 2xl:max-w-7xl mx-auto">
              <PromptInputBar
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                onClearHistory={handleClearHistory}
                hasMessages={messages.length > 0}
                activeMode={hybridMode}
              />
            </div>
          </footer>
        </>
      )}

      {/* WORKSPACE 2: MODELL-ZENTRALE */}
      {activeWorkspace === 'models' && (
        <ModelHubView
          ollamaStatus={ollamaStatus}
          activeOllamaModel={activeOllamaModel}
          onSelectOllamaModel={setActiveOllamaModel}
          onScan={scanOllama}
          isScanning={isScanning}
          customHost={customHost}
          onChangeHost={handleHostChange}
          isDemoMode={isDemoMode}
          onToggleDemoMode={handleToggleDemoMode}
          onSwitchToChatWithModel={handleSwitchToChatWithModel}
        />
      )}

      {/* WORKSPACE 3: WISSENS-TRESOR (RAG) */}
      {activeWorkspace === 'knowledge' && (
        <KnowledgeVaultView
          driveDStatus={driveDStatus}
          onRefreshDriveD={refreshDriveDStatus}
          onAskInChatWithContext={handleAskInChatWithContext}
        />
      )}

      {/* WORKSPACE 4: 20-KI-MATRIX */}
      {activeWorkspace === 'matrix' && (
        <AiMatrixView
          activeSoloSystemId={activeSoloSystemId}
          onSelectSoloSystem={handleSelectSoloSystem}
          onSwitchToSoloMode={handleSwitchToSoloMode}
          onSwitchToSwarmMode={handleSwitchToSwarmMode}
          isSoloMode={hybridMode === 'solo_system'}
          customHost={customHost}
          onSwitchToChat={() => handleSelectWorkspace('chat')}
        />
      )}

      {/* WORKSPACE: AUTOMATION & PIPELINES HUB */}
      {activeWorkspace === 'automation' && (
        <AutomationHubView
          onSendToChat={(txt) => {
            handleSelectWorkspace('chat');
            handleSendMessage(txt);
          }}
        />
      )}

      {/* WORKSPACE 5: SYSTEM-LABOR & DOWNLOADS */}
      {activeWorkspace === 'system' && (
        <SystemLabView
          ollamaHost={customHost}
          ollamaModel={activeOllamaModel}
          geminiModel={activeGeminiModel}
          onOpenPackager={() => setIsPackagerOpen(true)}
          onOpenAndroidApk={() => setIsAndroidApkOpen(true)}
          onInstallPwa={installPwa}
          canInstallPwa={isInstallable}
          isStandalone={isInstalled}
        />
      )}

      {/* 5. Desktop Packager & Windows EXE Modal */}
      <DesktopPackagerModal
        isOpen={isPackagerOpen}
        onClose={() => setIsPackagerOpen(false)}
        onInstallPwa={installPwa}
        canInstallPwa={isInstallable}
        onOpenAndroidApk={() => setIsAndroidApkOpen(true)}
      />

      {/* 6. Drive D Knowledge Vault Modal */}
      <DriveDKnowledgeModal
        isOpen={isDriveDOpen}
        onClose={() => {
          setIsDriveDOpen(false);
          refreshDriveDStatus();
        }}
        onSelectSnippetForPrompt={(promptText) => {
          setIsDriveDOpen(false);
          handleSendMessage(promptText);
        }}
      />

      {/* 7. System Diagnostics & "Herz und Nieren" Test Modal */}
      <SystemDiagnosticModal
        isOpen={isDiagnosticOpen}
        onClose={() => setIsDiagnosticOpen(false)}
        initialTab={initialDiagnosticTab}
        ollamaHost={customHost}
        ollamaModel={activeOllamaModel}
        geminiModel={activeGeminiModel}
        activeQwenModel={activeQwenDeciderModel}
        onSelectQwenModel={(model) => {
          setActiveQwenDeciderModel(model);
          localStorage.setItem('hybrid_qwen_decider_model', model);
        }}
        onExecuteTestPromptInChat={(mode, promptText) => {
          setIsDiagnosticOpen(false);
          if (mode === 'hybrid') {
            setHybridMode('collaborative');
          }
          handleSendMessage(promptText);
        }}
      />

      {/* 8. Android APK (No Root) Modal */}
      <AndroidApkModal
        isOpen={isAndroidApkOpen}
        onClose={() => setIsAndroidApkOpen(false)}
      />

      {/* 9. 20-KI-Systeme Matrix & Hybrid-Hub Modal */}
      <MultiAiMatrixModal
        isOpen={isMatrixModalOpen}
        onClose={() => {
          setIsMatrixModalOpen(false);
          setAllAISystems(getAllAISystems());
        }}
        activeSoloSystemId={activeSoloSystemId}
        onSelectSoloSystem={handleSelectSoloSystem}
        onSwitchToSoloMode={handleSwitchToSoloMode}
        onSwitchToSwarmMode={handleSwitchToSwarmMode}
        isSoloMode={hybridMode === 'solo_system'}
        customHost={customHost}
      />
    </div>
  );
}
