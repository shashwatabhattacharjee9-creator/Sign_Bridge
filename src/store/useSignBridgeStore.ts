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
import { offlineTTS } from '@/lib/audio/tts';

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

export type KineticPhase = 'IDLE' | 'TRACKING' | 'LOCKED' | 'COOLDOWN';

export interface SignBridgeState {
  // Core Spec Properties
  isTracking: boolean;
  isOffline: boolean;
  fps: number;
  latencyMs: number;
  currentSign: ISLSign | null;
  confidence: number; // 0.0 - 1.0
  liveConfidence: number; // Real-time continuous confidence
  kineticPhase: KineticPhase;
  kineticEnergy: number;
  isStabilized: boolean;
  sentenceTokens: string[];
  activeTokens: string[];
  ttsEnabled: boolean;
  selectedSignCategory: ISLSignCategory | 'ALL';
  confidenceThreshold: number;

  // Adaptive Hysteresis & HUD State
  detectionState: 'IDLE' | 'TRACKING' | 'COMMITTED';
  trackingSign: ISLSign | null;
  commitProgress: number; // 0.0 - 1.0 (or 0 - 100%)
  isUncertain: boolean;
  rankedScores: ClassificationScore[];
  motionDetected: boolean;
  tokens: SentenceToken[];
  fullSentence: string;
  isSpeaking: boolean;
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

  // Kinetic Synthesizer State Updates
  setKineticState: (
    phase: KineticPhase,
    liveConfidence: number,
    commitProgress: number,
    activeSign: ISLSign | null,
    kineticEnergy: number
  ) => void;

  // Extended Helper Actions
  setClassification: (
    result: ClassificationResult,
    commitProgress: number,
    detectionState?: 'IDLE' | 'TRACKING' | 'COMMITTED'
  ) => void;
  addToken: (signId: ISLSign, confidence: number) => void;
  removeToken: (tokenId: string) => void;
  clearTokens: () => void;
  setFullSentence: (sentence: string) => void;
  generateNaturalSentence: () => void;
  speakSentence: () => Promise<void>;
  updateSettings: (partial: Partial<AppSettings>) => void;
  setActiveTab: (tab: 'hero' | 'vision' | 'practice' | 'translate' | 'vocabulary' | 'calibration') => void;
  startPractice: (signId: ISLSign) => void;
  stopPractice: () => void;
  updatePracticeProgress: (isMatch: boolean) => void;
}

function constructNaturalGrammar(tokens: SentenceToken[]): string {
  if (tokens.length === 0) return '';
  const rawWords = tokens.map((t) => ISL_VOCABULARY[t.sign]?.speechText || t.label);

  // Natural contextual smoothing
  if (rawWords.length >= 3) {
    return rawWords.join(' • ');
  }
  return rawWords.join(' • ');
}

export const useSignBridgeStore = create<SignBridgeState>((set, get) => ({
  // Initial State
  isTracking: false,
  isOffline: false,
  fps: 30,
  latencyMs: 18,
  currentSign: null,
  confidence: 0,
  liveConfidence: 0,
  kineticPhase: 'IDLE',
  kineticEnergy: 0,
  isStabilized: false,
  sentenceTokens: [],
  activeTokens: [],
  ttsEnabled: true,
  selectedSignCategory: 'ALL',
  confidenceThreshold: 0.74,

  // Adaptive Hysteresis & HUD State
  detectionState: 'IDLE',
  trackingSign: null,
  commitProgress: 0,
  isUncertain: true,
  rankedScores: [],
  motionDetected: false,
  tokens: [],
  fullSentence: '',
  isSpeaking: false,

  telemetry: {
    fps: 30,
    latencyMs: 18,
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

  setKineticState: (phase, liveConfidence, commitProgress, activeSign, kineticEnergy) => {
    const detectionState: 'IDLE' | 'TRACKING' | 'COMMITTED' =
      phase === 'LOCKED'
        ? 'COMMITTED'
        : phase === 'TRACKING'
        ? 'TRACKING'
        : 'IDLE';

    set((state) => ({
      kineticPhase: phase,
      liveConfidence,
      commitProgress,
      confidence: liveConfidence,
      currentSign: activeSign,
      trackingSign: activeSign,
      kineticEnergy,
      detectionState,
      telemetry: {
        ...state.telemetry,
        confidence: Math.round(liveConfidence * 100),
        activeSign: activeSign || 'NONE',
        kineticEnergy,
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
    const isCleared = result.sign !== 'IDLE' && result.confidence >= get().confidenceThreshold;
    set({
      currentSign: result.sign === 'IDLE' ? null : result.sign,
      confidence: result.confidence,
      isStabilized: isCleared,
      latencyMs: result.latencyMs,
    });
  },

  addSentenceToken: (token: string) => {
    const validSign = token as ISLSign;
    get().addToken(validSign, get().confidence);
  },

  clearSentence: () => {
    get().clearTokens();
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
      settings: {
        ...state.settings,
        autoSpeakOnCommit: !state.ttsEnabled,
      },
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

  setClassification: (
    result: ClassificationResult,
    commitProgress: number,
    detectionState?: 'IDLE' | 'TRACKING' | 'COMMITTED'
  ) => {
    const isCleared = result.sign !== 'IDLE' && result.confidence >= get().confidenceThreshold;
    const computedDetectionState =
      detectionState ||
      (result.sign === 'IDLE'
        ? 'IDLE'
        : commitProgress >= 1.0
        ? 'COMMITTED'
        : 'TRACKING');

    set({
      currentSign: result.sign === 'IDLE' ? null : result.sign,
      trackingSign: result.sign === 'IDLE' ? null : result.sign,
      confidence: result.confidence,
      liveConfidence: result.confidence,
      commitProgress,
      detectionState: computedDetectionState,
      isStabilized: isCleared,
      isUncertain: result.isUncertain ?? (result.sign === 'IDLE'),
      rankedScores: result.rankedScores ?? [],
      motionDetected: result.motionDetected ?? false,
      latencyMs: result.latencyMs,
    });
  },

  addToken: (signId: ISLSign, confidence: number) => {
    if (signId === 'IDLE') return;
    const signDef = ISL_VOCABULARY[signId];
    if (!signDef) return;

    const newToken: SentenceToken = {
      id: `${signId}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sign: signId,
      label: signDef.label,
      emoji: signDef.emoji,
      timestamp: Date.now(),
      confidence,
    };

    const newTokens = [...get().tokens, newToken];
    const rawTokens = newTokens.map((t) => t.sign);
    const naturalText = constructNaturalGrammar(newTokens);

    set({
      tokens: newTokens,
      sentenceTokens: rawTokens,
      activeTokens: rawTokens,
      fullSentence: naturalText,
      detectionState: 'COMMITTED',
    });

    const settings = get().settings;
    if (settings.enableAudioFeedback) {
      offlineTTS.playCommitTone();
    }

    if ((settings.autoSpeakOnCommit || get().ttsEnabled) && signDef.speechText) {
      offlineTTS.speak(signDef.speechText, settings.ttsRate, settings.ttsPitch, {
        voiceURI: settings.ttsVoice,
      });
    }

    // Reset detection state after pulse
    setTimeout(() => {
      if (get().detectionState === 'COMMITTED') {
        set({ detectionState: 'IDLE' });
      }
    }, 800);
  },

  removeToken: (tokenId: string) => {
    const newTokens = get().tokens.filter((t) => t.id !== tokenId);
    const rawTokens = newTokens.map((t) => t.sign);
    set({
      tokens: newTokens,
      sentenceTokens: rawTokens,
      activeTokens: rawTokens,
      fullSentence: constructNaturalGrammar(newTokens),
    });
  },

  clearTokens: () => {
    set({
      tokens: [],
      sentenceTokens: [],
      activeTokens: [],
      fullSentence: '',
      detectionState: 'IDLE',
      kineticPhase: 'IDLE',
      currentSign: null,
      trackingSign: null,
    });
    offlineTTS.stop();
  },

  setFullSentence: (sentence: string) => {
    set({ fullSentence: sentence });
  },

  generateNaturalSentence: () => {
    const tokens = get().tokens;
    set({ fullSentence: constructNaturalGrammar(tokens) });
  },

  speakSentence: async () => {
    const { fullSentence, tokens, settings } = get();
    const textToSpeak =
      fullSentence.trim() ||
      tokens.map((t) => ISL_VOCABULARY[t.sign]?.speechText || t.label).join(', ');

    if (!textToSpeak) return;

    set({ isSpeaking: true });
    try {
      await offlineTTS.speak(textToSpeak.replace(/•/g, ','), settings.ttsRate, settings.ttsPitch, {
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
        offlineTTS.playSuccessChord();
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
