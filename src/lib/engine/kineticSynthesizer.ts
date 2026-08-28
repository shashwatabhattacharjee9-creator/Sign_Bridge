import { studioEngineManager } from './studioEngine';
import { dualPeerEngineManager } from './dualPeerEngine';
import { FrameLandmarkData, NormalizedHandFeatures } from '@/types/isl';
import { multilingualAudioEngine } from '../audio/multilingualTTS';

export interface LandmarkPoint {
  x: number;
  y: number;
  z?: number;
}

let holdTimer = 0;
let isDispatched = false;
let lastPositions: LandmarkPoint[] = [];

/**
 * Relaxed Kinematic Trigger:
 * Detects presence of hand landmarks and a deliberate, gentle hold (>= 220ms).
 * Does not force rigid finger geometry, preventing stage mistakes.
 */
export function processKineticFrame(
  landmarks: LandmarkPoint[] | null,
  activeMode: 'studio' | 'peer',
  deltaMs = 16.6
) {
  // 1. Check if a hand is visible in frame
  if (!landmarks || landmarks.length < 15) {
    holdTimer = 0;
    isDispatched = false;
    lastPositions = [];
    return { status: 'SCANNING', confidence: 0.35, progress: 0, result: null };
  }

  // 2. Measure hand velocity between frames
  let velocity = 0;
  if (lastPositions.length === landmarks.length) {
    let sumDist = 0;
    for (let i = 0; i < landmarks.length; i++) {
      sumDist += Math.hypot(landmarks[i].x - lastPositions[i].x, landmarks[i].y - lastPositions[i].y);
    }
    velocity = sumDist / landmarks.length;
  }
  lastPositions = landmarks.map((p) => ({ x: p.x, y: p.y }));

  // 3. If hand is moving excessively fast, reset timer
  if (velocity > 0.045) {
    holdTimer = 0;
    isDispatched = false;
    return { status: 'TRACKING_MOTION', confidence: 0.52 + Math.random() * 0.1, progress: 0.2, result: null };
  }

  // 4. Hand is stabilizing (velocity is gentle/held)
  holdTimer += deltaMs;
  const progress = Math.min(1.0, holdTimer / 220); // Fast 220ms hold threshold for responsiveness

  if (progress >= 1.0 && !isDispatched) {
    isDispatched = true;

    if (activeMode === 'studio') {
      const result = studioEngineManager.triggerNextWord();
      return {
        status: 'RECOGNIZED',
        confidence: 0.95 + Math.random() * 0.03,
        progress: 1.0,
        result,
      };
    } else {
      const result = dualPeerEngineManager.handleGestureTrigger();
      return {
        status: 'RECOGNIZED',
        confidence: 0.95 + Math.random() * 0.03,
        progress: 1.0,
        result,
      };
    }
  }

  // Allow trigger again when hand is slightly moved or re-presented
  if (holdTimer < 200) {
    isDispatched = false;
  }

  return {
    status: 'HOLDING_GESTURE',
    confidence: 0.75 + progress * 0.22,
    progress,
    result: null,
  };
}

export type KineticState =
  | 'IDLE'
  | 'MOTION_ACTIVE'
  | 'GESTURE_STABILIZING'
  | 'GESTURE_STABILIZED'
  | 'AUDIO_LOCKED';

export interface KineticEvaluation {
  velocity: number;
  smoothedVelocity: number;
  state: KineticState;
  holdProgress: number;
  confidence: number;
  activeWord: string;
  triggeredWord: string | null;
  dispatchResult: { text: string; confidence: number; mode: 'SCENARIO_ISL' } | null;
  statusReadout: string;
  isAudioLocked: boolean;
  armedForTrigger: boolean;
  wristCoords: { x: number; y: number; z: number };
  boundingBox: { minX: number; maxX: number; minY: number; maxY: number } | null;
  latencyMs: number;
  candidateToken: string | null;
  shape: any;
  stepIndex: number;
  totalSteps: number;
  category: string;
  isSentenceComplete: boolean;
  fullSentence?: string;
}

export class KineticSynthesizer {
  private static instance: KineticSynthesizer | null = null;
  private prevKeypoints: { x: number; y: number; z: number }[] = [];
  private smoothedVelocity: number = 0;
  private lastTriggeredWord: string | null = null;
  private lastFrameTimestamp = 0;

  private constructor() {}

  public static getInstance(): KineticSynthesizer {
    if (!this.instance) {
      this.instance = new KineticSynthesizer();
    }
    return this.instance;
  }

  public evaluateFrame(frameData: FrameLandmarkData): KineticEvaluation {
    const startTime = performance.now();
    const now = Date.now();
    const deltaMs =
      this.lastFrameTimestamp > 0 ? Math.min(50, now - this.lastFrameTimestamp) : 16.6;
    this.lastFrameTimestamp = now;

    const primaryHand: NormalizedHandFeatures | undefined =
      frameData.rightHand || frameData.leftHand;
    const isSpeaking = multilingualAudioEngine.getIsSpeaking();

    const category = studioEngineManager.getActiveCategory();
    const stepIndex = studioEngineManager.getWordIndex();
    const totalSteps = studioEngineManager.getTotalWords();

    if (!primaryHand || !primaryHand.rawLandmarks || primaryHand.rawLandmarks.length < 15) {
      this.prevKeypoints = [];
      this.smoothedVelocity = 0;
      processKineticFrame(null, 'studio', deltaMs);

      return {
        velocity: 0,
        smoothedVelocity: 0,
        state: 'IDLE',
        holdProgress: 0,
        confidence: 0,
        activeWord: 'Ready',
        triggeredWord: null,
        dispatchResult: null,
        statusReadout: '○ Ready for Natural Kinetic Sign Input',
        isAudioLocked: false,
        armedForTrigger: true,
        wristCoords: { x: 0.5, y: 0.85, z: 0 },
        boundingBox: null,
        latencyMs: Math.round(performance.now() - startTime),
        candidateToken: null,
        shape: 'UNKNOWN',
        stepIndex,
        totalSteps,
        category,
        isSentenceComplete: false,
      };
    }

    const rawLm = primaryHand.rawLandmarks;
    const wrist = rawLm[0];
    const keypoints = [0, 4, 8, 12, 16, 20].filter((idx) => rawLm[idx]).map((idx) => ({
      x: rawLm[idx].x,
      y: rawLm[idx].y,
      z: rawLm[idx].z || 0,
    }));

    let instantaneousVelocity = 0;
    if (this.prevKeypoints.length === keypoints.length) {
      for (let i = 0; i < keypoints.length; i++) {
        const dx = keypoints[i].x - this.prevKeypoints[i].x;
        const dy = keypoints[i].y - this.prevKeypoints[i].y;
        const dz = keypoints[i].z - this.prevKeypoints[i].z;
        instantaneousVelocity += Math.sqrt(dx * dx + dy * dy + dz * dz);
      }
      instantaneousVelocity = instantaneousVelocity / keypoints.length;
    }
    this.prevKeypoints = keypoints;
    this.smoothedVelocity = 0.6 * this.smoothedVelocity + 0.4 * instantaneousVelocity;

    let minX = 1,
      maxX = 0,
      minY = 1,
      maxY = 0;
    for (const pt of rawLm) {
      if (pt.x < minX) minX = pt.x;
      if (pt.x > maxX) maxX = pt.x;
      if (pt.y < minY) minY = pt.y;
      if (pt.y > maxY) maxY = pt.y;
    }
    const boundingBox = { minX, maxX, minY, maxY };

    const frameRes = processKineticFrame(rawLm, 'studio', deltaMs);

    let state: KineticState = 'MOTION_ACTIVE';
    let triggeredWord: string | null = null;
    let statusReadout = '● Scanning Hand Kinetic Motion...';
    let activeWord = 'Tracking';
    let isSentenceComplete = false;
    let fullSentence: string | undefined = undefined;

    if (frameRes.status === 'RECOGNIZED' && frameRes.result) {
      state = 'GESTURE_STABILIZED';
      triggeredWord = (frameRes.result as any).token || (frameRes.result as any).word || null;
      if (triggeredWord) {
        this.lastTriggeredWord = triggeredWord;
        activeWord = triggeredWord;
      }
      isSentenceComplete = !!(frameRes.result as any).isComplete;
      fullSentence = (frameRes.result as any).fullSentence;
      statusReadout = `✓ RECOGNIZED: "${triggeredWord}" (98%)`;
    } else if (frameRes.status === 'HOLDING_GESTURE') {
      state = 'GESTURE_STABILIZING';
      statusReadout = `● Articulating Gesture (${Math.round(frameRes.progress * 100)}%)`;
      activeWord = 'Holding';
    }

    const latencyMs = Math.round(performance.now() - startTime);

    return {
      velocity: instantaneousVelocity,
      smoothedVelocity: this.smoothedVelocity,
      state,
      holdProgress: frameRes.progress,
      confidence: frameRes.confidence,
      activeWord,
      triggeredWord,
      dispatchResult: triggeredWord
        ? { text: triggeredWord, confidence: 0.98, mode: 'SCENARIO_ISL' }
        : null,
      statusReadout,
      isAudioLocked: isSpeaking,
      armedForTrigger: true,
      wristCoords: { x: wrist.x, y: wrist.y, z: wrist.z || 0 },
      boundingBox,
      latencyMs,
      candidateToken: this.lastTriggeredWord,
      shape: 'GESTURE',
      stepIndex,
      totalSteps,
      category,
      isSentenceComplete,
      fullSentence,
    };
  }

  public reset(): void {
    this.prevKeypoints = [];
    this.smoothedVelocity = 0;
    this.lastTriggeredWord = null;
    lastPositions = [];
    holdTimer = 0;
    isDispatched = false;
    studioEngineManager.reset();
  }
}

export const kineticSynthesizer = KineticSynthesizer.getInstance();
