import { create } from 'zustand';
import {
  ClassificationResult,
  ClassificationScore,
  ISLSign,
  ISLSignCategory,
  PracticeTarget,
  SentenceToken,
  TelemetryMetrics,
} from '@/types/isl';
import { ISL_VOCABULARY } from '@/lib/engine/gestureLibrary';
import { audioLatchEngine } from '@/lib/audio/tts';
import { wordStreamManager, NextWordResult } from '@/lib/engine/wordStreamManager';
import { PRESENTATION_SCRIPT, TOTAL_SCRIPT_WORDS, ScriptStage } from '@/lib/engine/pitchScript';
import { kineticSynthesizer, KineticState } from '@/lib/engine/kineticSynthesizer';

export interface AppSettings {
  minConfidence: number;
  debounceFrames: number;
  enablePose: boolean;
  enableAudioFeedback: boolean;
  autoSpeakOnCommit: boolean;
  ttsRate: number;
  ttsPitch: number;
  ttsVoice: string;
  cameraMirror: boolean;
  drawLandmarks: boolean;
}

export interface SignBridgeState {
  // Core Tracking & Telemetry
  isTracking: boolean;
  isOffline: boolean;
  fps: number;
  latencyMs: number;
  currentSign: string | null;
  confidence: number;
  liveConfidence: number;
  kineticState: KineticState;
  holdProgress: number; // 0.0 to 1.0
  statusReadout: string;
  wristCoords: { x: number; y: number; z: number };

  // Multi-Stage Sequential Word Stream State
  activeStageIndex: number;
  activeStageTitle: string;
  activeStageBadge: string;
  displayedSentences: string[];
  isSessionComplete: boolean;
  currentWord: string;
  tokens: SentenceToken[];
  wordTokens: string[];
  sentenceTokens: string[];
  fullSentence: string;
  totalWordsAllStages: number;
  spokenWordsCount: number;
  isSpeaking: boolean;
  ttsEnabled: boolean;
  selectedSignCategory: ISLSignCategory | 'ALL';
  confidenceThreshold: number;

  // Additional Telemetry State
  detectionState: 'IDLE' | 'TRACKING' | 'COMMITTED';
  trackingSign: string | null;
  commitProgress: number;
  isUncertain: boolean;
  rankedScores: ClassificationScore[];
  motionDetected: boolean;
  telemetry: TelemetryMetrics;
  settings: AppSettings;
  practice: PracticeTarget | null;
  activeTab: 'hero' | 'vision' | 'practice' | 'translate' | 'vocabulary' | 'calibration';

  // Core Actions
  setTracking: (status: boolean) => void;
  updateTelemetry: (fpsOrPartial: number | Partial<TelemetryMetrics>, latency?: number) => void;
  setPrediction: (result: ClassificationResult) => void;
  addSentenceToken: (token: string) => void;
  clearSentence: () => void;
  popSentenceToken: () => void;
  toggleTTS: () => void;
  setConfidenceThreshold: (threshold: number) => void;

  // Kinetic Evaluation Dispatch
  setKineticEvaluation: (
    state: KineticState,
    confidence: number,
    progress: number,
    activeWord: string,
    statusReadout: string,
    wristCoords: { x: number; y: number; z: number },
    isComplete: boolean,
    latencyMs: number
  ) => void;

  // Word Stream Actions
  addWordResult: (result: NextWordResult, confidence: number) => void;
  addWordToken: (word: string, confidence: number) => void;
  addToken: (signId: any, confidence: number) => void;
  resetSession: () => void;
  resetScript: () => void;
  removeToken: (tokenId: string) => void;
  clearTokens: () => void;
  setFullSentence: (sentence: string) => void;
  speakSentence: () => Promise<void>;
  updateSettings: (partial: Partial<AppSettings>) => void;
  setActiveTab: (tab: 'hero' | 'vision' | 'practice' | 'translate' | 'vocabulary' | 'calibration') => void;
  startPractice: (signId: ISLSign) => void;
  stopPractice: () => void;
  updatePracticeProgress: (isMatch: boolean) => void;
}

export const useSignBridgeStore = create<SignBridgeState>((set, get) => ({
  // Initial State
  isTracking: false,
  isOffline: false,
  fps: 30,
  latencyMs: 16,
  currentSign: PRESENTATION_SCRIPT[0].words[0],
  confidence: 0,
  liveConfidence: 0,
  kineticState: 'IDLE',
  holdProgress: 0,
  statusReadout: '○ Ready for Hand Gesture',
  wristCoords: { x: 0.5, y: 0.85, z: 0 },

  activeStageIndex: 0,
  activeStageTitle: PRESENTATION_SCRIPT[0].stageTitle,
  activeStageBadge: PRESENTATION_SCRIPT[0].badge,
  displayedSentences: [''],
  isSessionComplete: false,
  currentWord: PRESENTATION_SCRIPT[0].words[0],
  tokens: [],
  wordTokens: [],
  sentenceTokens: [],
  fullSentence: '',
  totalWordsAllStages: TOTAL_SCRIPT_WORDS,
  spokenWordsCount: 0,
  isSpeaking: false,
  ttsEnabled: true,
  selectedSignCategory: 'ALL',
  confidenceThreshold: 0.74,

  detectionState: 'IDLE',
  trackingSign: null,
  commitProgress: 0,
  isUncertain: true,
  rankedScores: [],
  motionDetected: false,

  telemetry: {
    fps: 30,
    latencyMs: 16,
    confidence: 0,
    isOffline: false,
    handsCount: 0,
    poseDetected: false,
    frameCount: 0,
    bufferDepth: 0,
    activeSign: 'NONE',
    phase: 'REST',
    kineticEnergy: 0,
    detectionState: 'IDLE',
  },

  settings: {
    minConfidence: 0.74,
    debounceFrames: 4,
    enablePose: true,
    enableAudioFeedback: true,
    autoSpeakOnCommit: true,
    ttsRate: 1.0,
    ttsPitch: 1.0,
    ttsVoice: '',
    cameraMirror: true,
    drawLandmarks: true,
  },

  practice: null,
  activeTab: 'hero',

  // Actions
  setTracking: (status: boolean) => {
    set({ isTracking: status });
  },

  setKineticEvaluation: (
    state,
    confidence,
    progress,
    activeWord,
    statusReadout,
    wristCoords,
    isComplete,
    latencyMs
  ) => {
    const isSpeaking = audioLatchEngine.getIsSpeaking();
    const currentStage = wordStreamManager.getActiveStage() || PRESENTATION_SCRIPT[PRESENTATION_SCRIPT.length - 1];

    const detectionState: 'IDLE' | 'TRACKING' | 'COMMITTED' =
      state === 'GESTURE_STABILIZED'
        ? 'COMMITTED'
        : state === 'GESTURE_STABILIZING' || state === 'MOTION_ACTIVE'
        ? 'TRACKING'
        : 'IDLE';

    set((s) => ({
      kineticState: state,
      liveConfidence: confidence,
      confidence,
      holdProgress: progress,
      commitProgress: progress,
      currentSign: activeWord,
      trackingSign: activeWord,
      currentWord: activeWord,
      statusReadout,
      wristCoords,
      latencyMs,
      isSpeaking,
      isSessionComplete: isComplete,
      activeStageIndex: wordStreamManager.getStageIndex(),
      activeStageTitle: currentStage.stageTitle,
      activeStageBadge: currentStage.badge,
      spokenWordsCount: wordStreamManager.getSpokenWordsCount(),
      detectionState,
      telemetry: {
        ...s.telemetry,
        confidence: Math.round(confidence * 100),
        activeSign: activeWord || 'NONE',
        latencyMs,
        detectionState,
      },
    }));
  },

  updateTelemetry: (fpsOrPartial, latency) => {
    if (typeof fpsOrPartial === 'number') {
      const fpsVal = fpsOrPartial;
      const latVal = latency ?? 0;
      set((state) => ({
        fps: fpsVal,
        latencyMs: latVal,
        telemetry: {
          ...state.telemetry,
          fps: fpsVal,
          latencyMs: latVal,
        },
      }));
    } else {
      const partial = fpsOrPartial;
      set((state) => ({
        fps: partial.fps ?? state.fps,
        latencyMs: partial.latencyMs ?? state.latencyMs,
        isOffline: partial.isOffline ?? state.isOffline,
        telemetry: {
          ...state.telemetry,
          ...partial,
        },
      }));
    }
  },

  setPrediction: (result: ClassificationResult) => {
    set({
      currentSign: result.sign === 'IDLE' ? null : result.sign,
      confidence: result.confidence,
      latencyMs: result.latencyMs,
    });
  },

  addSentenceToken: (token: string) => {
    get().addWordToken(token, get().confidence);
  },

  clearSentence: () => {
    get().resetSession();
  },

  popSentenceToken: () => {
    const current = get().tokens;
    if (current.length > 0) {
      get().removeToken(current[current.length - 1].id);
    }
  },

  toggleTTS: () => {
    set((state) => ({
      ttsEnabled: !state.ttsEnabled,
    }));
  },

  setConfidenceThreshold: (threshold: number) => {
    set((state) => ({
      confidenceThreshold: threshold,
      settings: {
        ...state.settings,
        minConfidence: threshold,
      },
    }));
  },

  addWordResult: (result: NextWordResult, confidence: number) => {
    const newToken: SentenceToken = {
      id: `${result.word}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sign: result.word as any,
      label: result.word,
      emoji: '💬',
      timestamp: Date.now(),
      confidence,
    };

    const newTokens = [...get().tokens, newToken];
    const newWordTokens = newTokens.map((t) => t.label);
    const transcript = wordStreamManager.getTranscript();
    const newFullSentence = transcript.join('\n\n');
    const nextWord = wordStreamManager.peekNextWord() || 'Demonstration Complete';
    const activeStage = wordStreamManager.getActiveStage() || PRESENTATION_SCRIPT[PRESENTATION_SCRIPT.length - 1];

    set({
      tokens: newTokens,
      wordTokens: newWordTokens,
      sentenceTokens: newWordTokens,
      displayedSentences: [...transcript],
      fullSentence: newFullSentence,
      currentWord: nextWord,
      activeStageIndex: wordStreamManager.getStageIndex(),
      activeStageTitle: activeStage.stageTitle,
      activeStageBadge: activeStage.badge,
      spokenWordsCount: wordStreamManager.getSpokenWordsCount(),
      isSessionComplete: wordStreamManager.getIsComplete(),
      detectionState: 'COMMITTED',
    });
  },

  addWordToken: (word: string, confidence: number) => {
    if (!word) return;

    const newToken: SentenceToken = {
      id: `${word}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sign: word as any,
      label: word,
      emoji: '💬',
      timestamp: Date.now(),
      confidence,
    };

    const newTokens = [...get().tokens, newToken];
    const newWordTokens = newTokens.map((t) => t.label);
    const transcript = wordStreamManager.getTranscript();

    set({
      tokens: newTokens,
      wordTokens: newWordTokens,
      sentenceTokens: newWordTokens,
      displayedSentences: [...transcript],
      fullSentence: transcript.join('\n\n'),
      spokenWordsCount: wordStreamManager.getSpokenWordsCount(),
      isSessionComplete: wordStreamManager.getIsComplete(),
      detectionState: 'COMMITTED',
    });
  },

  addToken: (signId: any, confidence: number) => {
    const signDef = (ISL_VOCABULARY as any)[signId];
    const label = signDef ? signDef.label : String(signId);
    get().addWordToken(label, confidence);
  },

  resetSession: () => {
    wordStreamManager.reset();
    audioLatchEngine.forceReset();
    kineticSynthesizer.reset();

    const firstStage = PRESENTATION_SCRIPT[0];

    set({
      tokens: [],
      wordTokens: [],
      sentenceTokens: [],
      displayedSentences: [''],
      fullSentence: '',
      activeStageIndex: 0,
      activeStageTitle: firstStage.stageTitle,
      activeStageBadge: firstStage.badge,
      currentWord: firstStage.words[0],
      spokenWordsCount: 0,
      isSessionComplete: false,
      detectionState: 'IDLE',
      kineticState: 'IDLE',
      currentSign: firstStage.words[0],
      trackingSign: null,
      statusReadout: '○ Ready for Hand Gesture',
    });
  },

  resetScript: () => {
    get().resetSession();
  },

  removeToken: (tokenId: string) => {
    const newTokens = get().tokens.filter((t) => t.id !== tokenId);
    const newWordTokens = newTokens.map((t) => t.label);
    set({
      tokens: newTokens,
      wordTokens: newWordTokens,
      sentenceTokens: newWordTokens,
      fullSentence: newWordTokens.join(' '),
    });
  },

  clearTokens: () => {
    get().resetSession();
  },

  setFullSentence: (sentence: string) => {
    set({ fullSentence: sentence });
  },

  speakSentence: async () => {
    const { displayedSentences, fullSentence, settings } = get();
    const textToSpeak = displayedSentences.join('. ').trim() || fullSentence;
    if (!textToSpeak) return;

    set({ isSpeaking: true });
    try {
      await audioLatchEngine.speakFull(textToSpeak, settings.ttsRate, settings.ttsPitch, {
        voiceURI: settings.ttsVoice,
      });
    } finally {
      set({ isSpeaking: false });
    }
  },

  updateSettings: (partial: Partial<AppSettings>) => {
    set((state) => ({
      settings: {
        ...state.settings,
        ...partial,
      },
      confidenceThreshold: partial.minConfidence ?? state.confidenceThreshold,
      ttsEnabled: partial.autoSpeakOnCommit ?? state.ttsEnabled,
    }));
  },

  setActiveTab: (tab) => {
    set({ activeTab: tab });
  },

  startPractice: (signId: ISLSign) => {
    if (signId === 'IDLE') return;
    set({
      activeTab: 'practice',
      practice: {
        signId,
        targetHoldingFrames: 10,
        currentHoldingFrames: 0,
        isSuccess: false,
        feedback: `Hold the "${ISL_VOCABULARY[signId]?.label || signId}" sign steadily in front of the camera...`,
      },
    });
  },

  stopPractice: () => {
    set({ practice: null });
  },

  updatePracticeProgress: (isMatch: boolean) => {
    const practice = get().practice;
    if (!practice) return;

    if (practice.isSuccess) return;

    let nextFrames = practice.currentHoldingFrames;
    if (isMatch) {
      nextFrames += 1;
    } else {
      nextFrames = Math.max(0, nextFrames - 1);
    }

    const isSuccess = nextFrames >= practice.targetHoldingFrames;
    if (isSuccess && !practice.isSuccess) {
      if (get().settings.enableAudioFeedback) {
        audioLatchEngine.playSuccessChord();
      }
    }

    set({
      practice: {
        ...practice,
        currentHoldingFrames: nextFrames,
        isSuccess,
        feedback: isSuccess
          ? '🎉 Excellent! Mastered!'
          : isMatch
          ? `Holding steady... ${Math.round((nextFrames / practice.targetHoldingFrames) * 100)}%`
          : 'Form the sign shown above...',
      },
    });
  },
}));
