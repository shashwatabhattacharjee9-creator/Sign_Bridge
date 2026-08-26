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
import { speechEngine, offlineTTS } from '@/lib/audio/tts';
import { KineticState, SpatialZone, GrossHandShape } from '@/lib/engine/kineticSynthesizer';

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
  spatialZone: SpatialZone;
  handShape: GrossHandShape;
  isResting: boolean;
  restDurationMs: number;

  // Token Buffer & Contextual Sentence Assembler
  tokens: SentenceToken[];
  sentenceTokens: string[];
  activeTokens: string[];
  fullSentence: string;
  finalizedSentence: string;
  isFinalized: boolean;
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
    candidateSign: string | null,
    statusReadout: string,
    wristCoords: { x: number; y: number; z: number },
    spatialZone: SpatialZone,
    handShape: GrossHandShape,
    isResting: boolean,
    restDurationMs: number,
    latencyMs: number
  ) => void;

  // Token Actions
  addToken: (tokenLabel: string, confidence: number) => void;
  removeToken: (tokenId: string) => void;
  clearTokens: () => void;
  setFullSentence: (sentence: string) => void;
  finalizeSentenceOnRest: () => void;
  speakSentence: () => Promise<void>;
  updateSettings: (partial: Partial<AppSettings>) => void;
  setActiveTab: (tab: 'hero' | 'vision' | 'practice' | 'translate' | 'vocabulary' | 'calibration') => void;
  startPractice: (signId: ISLSign) => void;
  stopPractice: () => void;
  updatePracticeProgress: (isMatch: boolean) => void;
}

/**
 * Natural language grammar compiler for discrete token streams
 */
export function compileNaturalSentence(tokens: SentenceToken[]): string {
  if (tokens.length === 0) return '';
  const rawSigns = tokens.map((t) => t.sign.toUpperCase().replace(/_/g, ' '));
  const textKey = rawSigns.join(' ');

  // Exact Contextual Sequences
  if (textKey === 'HELLO HELP' || textKey === 'HELLO NEED HELP') {
    return 'Hello, I need help.';
  }
  if (textKey === 'HELLO THANK YOU' || textKey === 'HELLO THANKS') {
    return 'Hello, thank you very much.';
  }
  if (textKey === 'HELLO PLEASE') {
    return 'Hello, please assist me.';
  }
  if (textKey === 'HELLO STUDENT DESK' || textKey === 'HELLO DESK') {
    return 'Hello, I am looking for the student administrative helpdesk.';
  }
  if (textKey === 'WHERE DESK' || textKey === 'WHERE HELP') {
    return 'Excuse me, where is the helpdesk located?';
  }
  if (textKey === 'HELP PLEASE' || textKey === 'PLEASE HELP') {
    return 'I need assistance, please help.';
  }
  if (textKey === 'STUDENT DESK') {
    return 'Student administrative helpdesk.';
  }
  if (textKey === 'HELLO') {
    return 'Hello, greetings!';
  }
  if (textKey === 'HELP') {
    return 'Help is requested.';
  }
  if (textKey === 'PLEASE') {
    return 'Please.';
  }
  if (textKey === 'THANK YOU') {
    return 'Thank you.';
  }

  // Fallback: Concatenate with clean natural formatting
  const formatted = tokens
    .map((t) => (ISL_VOCABULARY as any)[t.sign]?.speechText || t.label)
    .join(', ');

  return formatted ? `${formatted}.` : '';
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
  kineticState: 'IDLE',
  holdProgress: 0,
  statusReadout: '○ Neutral / Idle Zone',
  wristCoords: { x: 0.5, y: 0.85, z: 0 },
  spatialZone: 'REST',
  handShape: 'UNKNOWN',
  isResting: true,
  restDurationMs: 0,

  tokens: [],
  sentenceTokens: [],
  activeTokens: [],
  fullSentence: '',
  finalizedSentence: '',
  isFinalized: false,
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
    autoSpeakOnCommit: false,
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
    candidateSign,
    statusReadout,
    wristCoords,
    spatialZone,
    handShape,
    isResting,
    restDurationMs,
    latencyMs
  ) => {
    const detectionState: 'IDLE' | 'TRACKING' | 'COMMITTED' =
      state === 'GESTURE_LOCK'
        ? 'COMMITTED'
        : state === 'POSE_STABILIZING' || state === 'DYNAMIC_MOTION'
        ? 'TRACKING'
        : 'IDLE';

    set((s) => ({
      kineticState: state,
      liveConfidence: confidence,
      confidence,
      holdProgress: progress,
      commitProgress: progress,
      currentSign: candidateSign,
      trackingSign: candidateSign,
      statusReadout,
      wristCoords,
      spatialZone,
      handShape,
      isResting,
      restDurationMs,
      latencyMs,
      detectionState,
      telemetry: {
        ...s.telemetry,
        confidence: Math.round(confidence * 100),
        activeSign: candidateSign || 'NONE',
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
    get().addToken(token, get().confidence);
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

  addToken: (tokenLabel: string, confidence: number) => {
    if (!tokenLabel || tokenLabel === 'IDLE') return;

    // Check if token already present as last token to avoid duplicates
    const existing = get().tokens;
    if (existing.length > 0 && existing[existing.length - 1].sign === (tokenLabel as any)) {
      return;
    }

    const signDef = (ISL_VOCABULARY as any)[tokenLabel];
    const emoji = signDef ? signDef.emoji : '✨';
    const label = signDef ? signDef.label : tokenLabel;

    const newToken: SentenceToken = {
      id: `${tokenLabel}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sign: tokenLabel as any,
      label,
      emoji,
      timestamp: Date.now(),
      confidence,
    };

    const newTokens = [...get().tokens, newToken];
    const rawTokens = newTokens.map((t) => t.sign as string);
    const naturalText = compileNaturalSentence(newTokens);

    set({
      tokens: newTokens,
      sentenceTokens: rawTokens,
      activeTokens: rawTokens,
      fullSentence: naturalText,
      isFinalized: false,
    });

    if (get().settings.enableAudioFeedback) {
      speechEngine.playCommitTone();
    }
  },

  removeToken: (tokenId: string) => {
    const newTokens = get().tokens.filter((t) => t.id !== tokenId);
    const rawTokens = newTokens.map((t) => t.sign as string);
    set({
      tokens: newTokens,
      sentenceTokens: rawTokens,
      activeTokens: rawTokens,
      fullSentence: compileNaturalSentence(newTokens),
      isFinalized: false,
    });
  },

  clearTokens: () => {
    set({
      tokens: [],
      sentenceTokens: [],
      activeTokens: [],
      fullSentence: '',
      finalizedSentence: '',
      isFinalized: false,
      currentSign: null,
      trackingSign: null,
    });
    speechEngine.stop();
  },

  setFullSentence: (sentence: string) => {
    set({ fullSentence: sentence });
  },

  finalizeSentenceOnRest: () => {
    const { tokens, isFinalized, fullSentence, ttsEnabled } = get();
    if (tokens.length === 0 || isFinalized) return;

    const compiled = fullSentence.trim() || compileNaturalSentence(tokens);
    if (!compiled) return;

    set({
      finalizedSentence: compiled,
      isFinalized: true,
    });

    // Speak strictly ONCE via SpeechEngine
    if (ttsEnabled) {
      speechEngine.speakNarrative(compiled);
    }
  },

  speakSentence: async () => {
    const { finalizedSentence, fullSentence, tokens, settings } = get();
    const textToSpeak =
      finalizedSentence ||
      fullSentence ||
      compileNaturalSentence(tokens) ||
      tokens.map((t) => (ISL_VOCABULARY as any)[t.sign]?.speechText || t.label).join(', ');

    if (!textToSpeak) return;

    set({ isSpeaking: true });
    try {
      await speechEngine.speak(textToSpeak.replace(/•/g, ','), settings.ttsRate, settings.ttsPitch, {
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
        speechEngine.playSuccessChord();
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
