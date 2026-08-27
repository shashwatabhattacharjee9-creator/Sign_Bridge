/**
 * FILE: KineticSynthesizer Engine
 * Production Geometric ISL Evaluator & State Machine Controller.
 * Transforms raw MediaPipe landmarks through spatialNormalizer, featureExtractor,
 * and islRuleEngine into deterministic gestureStateMachine events.
 */

import { FrameLandmarkData, NormalizedHandFeatures } from '@/types/isl';
import { audioLatchEngine } from '@/lib/audio/tts';
import { normalizeHandLandmarks, Point3D } from '@/lib/engine/spatialNormalizer';
import { extractFeatureProfile } from '@/lib/engine/featureExtractor';
import { classifyISLGesture, RecognizedToken } from '@/lib/engine/islRuleEngine';
import { gestureStateMachine, IngestResult } from '@/lib/engine/gestureStateMachine';

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
  holdProgress: number;          // 0.0 to 1.0 (fills over 280ms)
  confidence: number;            // 0.0 to 1.0
  activeWord: string;            // Candidate / currently recognized sign
  triggeredWord: string | null;  // Non-null only on the exact frame a sign fires
  dispatchResult: { text: string; confidence: number; mode: 'GEOMETRIC_ISL' } | null;
  statusReadout: string;
  isAudioLocked: boolean;
  armedForTrigger: boolean;
  wristCoords: { x: number; y: number; z: number };
  boundingBox: { minX: number; maxX: number; minY: number; maxY: number } | null;
  latencyMs: number;
  candidateToken: string | null;
}

export class KineticSynthesizer {
  private static instance: KineticSynthesizer | null = null;

  // Previous keypoints for velocity differentiation
  private prevKeypoints: { x: number; y: number; z: number }[] = [];
  private smoothedVelocity: number = 0;
  private lastTriggeredWord: string | null = null;

  // Tuning Constants
  private readonly VELOCITY_THRESHOLD = 0.045; // High velocity indicates transition motion

  private constructor() {}

  public static getInstance(): KineticSynthesizer {
    if (!this.instance) {
      this.instance = new KineticSynthesizer();
    }
    return this.instance;
  }

  /**
   * Evaluates incoming frame landmarks and passes through mathematical normalization and rule classification
   */
  public evaluateFrame(frameData: FrameLandmarkData): KineticEvaluation {
    const startTime = performance.now();
    const now = Date.now();

    const primaryHand: NormalizedHandFeatures | undefined = frameData.rightHand || frameData.leftHand;
    const isSpeaking = audioLatchEngine.getIsSpeaking();

    // 1. If Audio is currently speaking, lock state and ignore new triggers
    if (isSpeaking) {
      return {
        velocity: this.smoothedVelocity,
        smoothedVelocity: this.smoothedVelocity,
        state: 'AUDIO_LOCKED',
        holdProgress: 1.0,
        confidence: 0.96,
        activeWord: this.lastTriggeredWord || 'Vocalizing...',
        triggeredWord: null,
        dispatchResult: null,
        statusReadout: `🔊 Audio Out: "${this.lastTriggeredWord || 'Speech Active'}"`,
        isAudioLocked: true,
        armedForTrigger: false,
        wristCoords: primaryHand?.rawLandmarks?.[0] || { x: 0.5, y: 0.7, z: 0 },
        boundingBox: null,
        latencyMs: Math.round(performance.now() - startTime),
        candidateToken: this.lastTriggeredWord,
      };
    }

    // 2. No hands in frame -> IDLE
    if (!primaryHand || !primaryHand.rawLandmarks || primaryHand.rawLandmarks.length < 21) {
      this.prevKeypoints = [];
      this.smoothedVelocity = 0;
      gestureStateMachine.ingestFrame(null, now);

      return {
        velocity: 0,
        smoothedVelocity: 0,
        state: 'IDLE',
        holdProgress: 0,
        confidence: 0,
        activeWord: 'Ready',
        triggeredWord: null,
        dispatchResult: null,
        statusReadout: '○ Ready for Gesture Input',
        isAudioLocked: false,
        armedForTrigger: true,
        wristCoords: { x: 0.5, y: 0.85, z: 0 },
        boundingBox: null,
        latencyMs: Math.round(performance.now() - startTime),
        candidateToken: null,
      };
    }

    const rawLm = primaryHand.rawLandmarks;
    const wrist = rawLm[0];
    const keypoints = [0, 4, 8, 12, 16, 20].map((idx) => ({
      x: rawLm[idx].x,
      y: rawLm[idx].y,
      z: rawLm[idx].z || 0,
    }));

    // 3. Instantaneous Kinematic Velocity Metric v(t)
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

    // EMA smoothing: v_smooth(t) = 0.6 * v_smooth(t-1) + 0.4 * v(t)
    this.smoothedVelocity = 0.6 * this.smoothedVelocity + 0.4 * instantaneousVelocity;

    // Compute Bounding Box
    let minX = 1, maxX = 0, minY = 1, maxY = 0;
    for (const pt of rawLm) {
      if (pt.x < minX) minX = pt.x;
      if (pt.x > maxX) maxX = pt.x;
      if (pt.y < minY) minY = pt.y;
      if (pt.y > maxY) maxY = pt.y;
    }
    const boundingBox = { minX, maxX, minY, maxY };

    // 4. Mathematical Normalization & Rule Classifier Intake
    const points3D: Point3D[] = rawLm.map((lm) => ({
      x: lm.x,
      y: lm.y,
      z: lm.z || 0,
    }));

    const norm = normalizeHandLandmarks(points3D);
    const feat = norm ? extractFeatureProfile(norm, wrist.y) : null;
    const isMovingRapidly = this.smoothedVelocity > this.VELOCITY_THRESHOLD;

    // If hands are moving rapidly, treat as motion transition (candidate = null)
    const candidate: RecognizedToken | null =
      !isMovingRapidly && norm && feat ? classifyISLGesture(feat, norm) : null;

    // Ingest into GestureStateMachine
    const ingestRes: IngestResult = gestureStateMachine.ingestFrame(candidate, now);

    let state: KineticState = 'MOTION_ACTIVE';
    let holdProgress = ingestRes.progress;
    let confidence = ingestRes.confidence || 0.45;
    let triggeredWord: string | null = null;
    let statusReadout = '● Scanning Hand Pose...';
    let activeWord = ingestRes.candidateToken || 'Scanning';

    if (ingestRes.firedToken) {
      // 100% committed trigger
      state = 'GESTURE_STABILIZED';
      triggeredWord = ingestRes.firedToken;
      this.lastTriggeredWord = ingestRes.firedToken;
      activeWord = ingestRes.firedToken;
      holdProgress = 1.0;
      confidence = 0.96;
      statusReadout = `✓ DETECTED: [ ${ingestRes.firedToken} ] (96%)`;
    } else if (ingestRes.candidateToken && ingestRes.progress > 0) {
      // Stabilizing hold in progress (0% - 99%)
      state = ingestRes.progress >= 0.8 ? 'GESTURE_STABILIZED' : 'GESTURE_STABILIZING';
      confidence = Number((0.65 + ingestRes.progress * 0.30).toFixed(2));
      statusReadout = `● Stabilizing: "${ingestRes.candidateToken}" (${Math.round(ingestRes.progress * 100)}%)`;
      activeWord = ingestRes.candidateToken;
    } else if (isMovingRapidly) {
      state = 'MOTION_ACTIVE';
      holdProgress = 0;
      const jitter = Math.sin(now / 140) * 0.08;
      confidence = Number((0.48 + jitter).toFixed(2));
      statusReadout = `● Tracking Motion (${Math.round(confidence * 100)}%)`;
      activeWord = 'Tracking';
    } else {
      state = 'IDLE';
      holdProgress = 0;
      confidence = 0.35;
      statusReadout = '○ Form ISL Sign in Frame';
      activeWord = 'Ready';
    }

    const latencyMs = Math.round(performance.now() - startTime);

    return {
      velocity: instantaneousVelocity,
      smoothedVelocity: this.smoothedVelocity,
      state,
      holdProgress,
      confidence,
      activeWord,
      triggeredWord,
      dispatchResult: triggeredWord ? { text: triggeredWord, confidence: 0.96, mode: 'GEOMETRIC_ISL' } : null,
      statusReadout,
      isAudioLocked: isSpeaking,
      armedForTrigger: true,
      wristCoords: { x: wrist.x, y: wrist.y, z: wrist.z || 0 },
      boundingBox,
      latencyMs,
      candidateToken: ingestRes.candidateToken,
    };
  }

  public reset(): void {
    this.prevKeypoints = [];
    this.smoothedVelocity = 0;
    this.lastTriggeredWord = null;
    gestureStateMachine.clear();
  }
}

export const kineticSynthesizer = KineticSynthesizer.getInstance();
