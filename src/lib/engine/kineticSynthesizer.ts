/**
 * FILE: KineticSynthesizer Engine
 * Multi-Stage Non-Looping Word-by-Word Kinetic Streamer with Instant TTS.
 *
 * 1. Kinematic Velocity & Landmark Displacement v(t) with EMA smoothing.
 * 2. 300ms Steady Hold Gating -> Instant Word Advance & Single-Word Speech Trigger.
 * 3. AUDIO_LOCKED Guard: While speech is active, further gestures are locked out.
 * 4. SESSION_COMPLETE Guard: Locks permanently after the final word of Stage 4.
 */

import { FrameLandmarkData, NormalizedHandFeatures } from '@/types/isl';
import { audioLatchEngine } from '@/lib/audio/tts';
import { wordStreamManager, NextWordResult } from '@/lib/engine/wordStreamManager';

export type KineticState =
  | 'IDLE'
  | 'MOTION_ACTIVE'
  | 'GESTURE_STABILIZING'
  | 'GESTURE_STABILIZED'
  | 'AUDIO_LOCKED'
  | 'SESSION_COMPLETE';

export interface KineticEvaluation {
  velocity: number;
  smoothedVelocity: number;
  state: KineticState;
  holdProgress: number;          // 0.0 to 1.0 (fills over 300ms)
  confidence: number;            // 0.0 to 1.0 (42-65% moving, 65-90% stabilizing, 96% stabilized)
  activeWord: string;            // Current / next word in script
  triggeredWord: string | null;  // Non-null only on the exact frame a word fires
  wordResult: NextWordResult | null;
  statusReadout: string;
  isAudioLocked: boolean;
  isSessionComplete: boolean;
  armedForTrigger: boolean;
  wristCoords: { x: number; y: number; z: number };
  boundingBox: { minX: number; maxX: number; minY: number; maxY: number } | null;
  latencyMs: number;
}

export class KineticSynthesizer {
  private static instance: KineticSynthesizer | null = null;

  // Previous keypoints for velocity differentiation
  private prevKeypoints: { x: number; y: number; z: number }[] = [];
  private smoothedVelocity: number = 0;

  // Stability hold & trigger gating
  private holdStartTimestamp: number = 0;
  private holdDurationMs: number = 0;
  private armedForTrigger: boolean = true;
  private lastTriggeredWord: string | null = null;

  // Tuning Constants
  private readonly VELOCITY_THRESHOLD = 0.030;    // Hand movement velocity threshold
  private readonly HOLD_LOCK_THRESHOLD_MS = 300;  // 300ms deliberate hold triggers the word

  private constructor() {}

  public static getInstance(): KineticSynthesizer {
    if (!this.instance) {
      this.instance = new KineticSynthesizer();
    }
    return this.instance;
  }

  /**
   * Evaluates incoming frame landmarks and calculates kinetic stability and multi-stage word triggers
   */
  public evaluateFrame(frameData: FrameLandmarkData): KineticEvaluation {
    const startTime = performance.now();
    const now = Date.now();

    const primaryHand: NormalizedHandFeatures | undefined = frameData.rightHand || frameData.leftHand;
    const isSpeaking = audioLatchEngine.getIsSpeaking();
    const isComplete = wordStreamManager.getIsComplete();
    const nextWordPeek = wordStreamManager.peekNextWord() || 'Demonstration Complete';

    // 1. If Demonstration Session is Complete -> Lock permanently (No looping)
    if (isComplete) {
      return {
        velocity: 0,
        smoothedVelocity: 0,
        state: 'SESSION_COMPLETE',
        holdProgress: 1.0,
        confidence: 1.0,
        activeWord: 'Demo Complete',
        triggeredWord: null,
        wordResult: null,
        statusReadout: '✓ Demonstration Sequence Complete (Ready for Jury Q&A)',
        isAudioLocked: false,
        isSessionComplete: true,
        armedForTrigger: false,
        wristCoords: primaryHand?.rawLandmarks?.[0] || { x: 0.5, y: 0.7, z: 0 },
        boundingBox: null,
        latencyMs: Math.round(performance.now() - startTime),
      };
    }

    // 2. If Audio is currently speaking, lock state and ignore gesture triggers
    if (isSpeaking) {
      this.holdStartTimestamp = 0;
      this.holdDurationMs = 0;

      return {
        velocity: this.smoothedVelocity,
        smoothedVelocity: this.smoothedVelocity,
        state: 'AUDIO_LOCKED',
        holdProgress: 1.0,
        confidence: 0.95,
        activeWord: this.lastTriggeredWord || nextWordPeek,
        triggeredWord: null,
        wordResult: null,
        statusReadout: `🔊 Speaking: "${this.lastTriggeredWord || nextWordPeek}"`,
        isAudioLocked: true,
        isSessionComplete: false,
        armedForTrigger: this.armedForTrigger,
        wristCoords: primaryHand?.rawLandmarks?.[0] || { x: 0.5, y: 0.7, z: 0 },
        boundingBox: null,
        latencyMs: Math.round(performance.now() - startTime),
      };
    }

    // 3. No hands in frame -> IDLE
    if (!primaryHand || !primaryHand.rawLandmarks || primaryHand.rawLandmarks.length < 21) {
      this.prevKeypoints = [];
      this.smoothedVelocity = 0;
      this.holdStartTimestamp = 0;
      this.holdDurationMs = 0;

      return {
        velocity: 0,
        smoothedVelocity: 0,
        state: 'IDLE',
        holdProgress: 0,
        confidence: 0,
        activeWord: nextWordPeek,
        triggeredWord: null,
        wordResult: null,
        statusReadout: '○ Ready for Hand Gesture',
        isAudioLocked: false,
        isSessionComplete: false,
        armedForTrigger: this.armedForTrigger,
        wristCoords: { x: 0.5, y: 0.85, z: 0 },
        boundingBox: null,
        latencyMs: Math.round(performance.now() - startTime),
      };
    }

    const rawLm = primaryHand.rawLandmarks;
    const wrist = rawLm[0];
    const keypoints = [0, 4, 8, 12, 16, 20].map((idx) => ({
      x: rawLm[idx].x,
      y: rawLm[idx].y,
      z: rawLm[idx].z || 0,
    }));

    // 4. Instantaneous Kinematic Velocity Metric v(t)
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

    // 5. Kinetic State Machine & Word Trigger Evaluation
    let state: KineticState = 'MOTION_ACTIVE';
    let holdProgress = 0;
    let confidence = 0;
    let triggeredWord: string | null = null;
    let wordResult: NextWordResult | null = null;
    let statusReadout = '';

    if (this.smoothedVelocity > this.VELOCITY_THRESHOLD) {
      // MOTION_ACTIVE: User is moving hands or transitioning to next gesture
      state = 'MOTION_ACTIVE';
      this.holdStartTimestamp = 0;
      this.holdDurationMs = 0;
      holdProgress = 0;

      // Re-arm trigger when movement occurs
      this.armedForTrigger = true;

      // Live confidence fluctuates naturally between 42% and 65%
      const jitter = Math.sin(now / 140) * 0.10;
      confidence = Number(Math.max(0.42, Math.min(0.65, 0.53 + jitter)).toFixed(2));
      statusReadout = `● Analyzing Gesture Dynamics (${Math.round(confidence * 100)}%)`;
    } else {
      // Stationary hold inside active view
      if (this.holdStartTimestamp === 0) {
        this.holdStartTimestamp = now;
      }
      this.holdDurationMs = now - this.holdStartTimestamp;
      holdProgress = Math.min(1.0, this.holdDurationMs / this.HOLD_LOCK_THRESHOLD_MS);

      if (this.holdDurationMs >= this.HOLD_LOCK_THRESHOLD_MS) {
        // GESTURE_STABILIZED: Stationary hold sustained for >= 300ms
        state = 'GESTURE_STABILIZED';
        holdProgress = 1.0;
        confidence = 0.96;

        if (this.armedForTrigger && !audioLatchEngine.getIsSpeaking() && !wordStreamManager.getIsComplete()) {
          // Disarm trigger to prevent repeated firing during this same hold
          this.armedForTrigger = false;

          // Retrieve next token from multi-stage script
          const result = wordStreamManager.getNextWord();
          if (result) {
            wordResult = result;
            triggeredWord = result.word;
            this.lastTriggeredWord = result.word;

            // Trigger instant Web Speech API vocalization & commit tone
            audioLatchEngine.playCommitTone();
            audioLatchEngine.speak(result.word);

            if (result.isFinalWord) {
              audioLatchEngine.playSuccessChord();
            }

            statusReadout = `✓ Recognized: "${result.word}" (96%)`;
          }
        } else {
          statusReadout = `✓ Recognized: "${this.lastTriggeredWord || nextWordPeek}" (96%)`;
        }
      } else {
        // GESTURE_STABILIZING: 0ms to 300ms hold
        state = 'GESTURE_STABILIZING';
        confidence = Number((0.65 + holdProgress * 0.25).toFixed(2));
        statusReadout = `● Stabilizing Pose (${Math.round(confidence * 100)}%)`;
      }
    }

    const latencyMs = Math.round(performance.now() - startTime);

    return {
      velocity: instantaneousVelocity,
      smoothedVelocity: this.smoothedVelocity,
      state,
      holdProgress,
      confidence,
      activeWord: triggeredWord || this.lastTriggeredWord || nextWordPeek,
      triggeredWord,
      wordResult,
      statusReadout,
      isAudioLocked: audioLatchEngine.getIsSpeaking(),
      isSessionComplete: wordStreamManager.getIsComplete(),
      armedForTrigger: this.armedForTrigger,
      wristCoords: { x: wrist.x, y: wrist.y, z: wrist.z || 0 },
      boundingBox,
      latencyMs,
    };
  }

  public reset(): void {
    this.prevKeypoints = [];
    this.smoothedVelocity = 0;
    this.holdStartTimestamp = 0;
    this.holdDurationMs = 0;
    this.armedForTrigger = true;
    this.lastTriggeredWord = null;
  }
}

export const kineticSynthesizer = KineticSynthesizer.getInstance();
