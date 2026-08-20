import {
  ClassificationScore,
  FrameLandmarkData,
  GesturePhase,
  ISLSign,
  Landmark3D,
  SignAnchor,
} from '@/types/isl';

export interface KineticEnergyState {
  energy: number;
  phase: GesturePhase;
  inSigningSpace: boolean;
  elevation: 'HEAD' | 'CHEST' | 'WAIST' | 'BELOW_WAIST';
  isSuppressed: boolean;
}

export interface MarginGateResult {
  accepted: boolean;
  topSign: ISLSign;
  confidence: number;
  margin: number;
  reason: string;
  rankedScores: ClassificationScore[];
}

/**
 * CORE LOGIC: Dynamic Boundary, Energy Gate & NULL Class Filter
 *
 * Implements:
 * 1. Instantaneous landmark velocity / kinetic energy tracker: E(t) = sum ||P_i(t) - P_i(t-1)||^2
 * 2. 4-Phase Kinematic State Machine: REST -> PREPARATION -> STROKE -> RETRACTION
 * 3. Margin-based Top vs Runner-Up Confidence Gating (Score >= 0.88 && Margin >= 0.12)
 */
export class GestureBoundaryGate {
  private prevTips: Landmark3D[] = [];
  private prevTimestamp: number = 0;
  private currentPhase: GesturePhase = 'REST';
  private phaseHoldFrames: number = 0;

  // Energy thresholds
  private readonly E_NOISE = 0.0006;
  private readonly E_PREP = 0.0020;
  private readonly E_RETRACT = 0.0150;

  // Gating thresholds
  private minConfidenceScore: number = 0.88;
  private minMarginDelta: number = 0.12;

  constructor(minConfidence: number = 0.88, minMargin: number = 0.12) {
    this.minConfidenceScore = minConfidence;
    this.minMarginDelta = minMargin;
  }

  public updateThresholds(minConfidence: number, minMargin: number = 0.12): void {
    this.minConfidenceScore = minConfidence;
    this.minMarginDelta = minMargin;
  }

  /**
   * Tracks Instantaneous Kinetic Energy & Phase State Machine
   */
  public evaluateEnergyAndPhase(frameData: FrameLandmarkData): KineticEnergyState {
    const primaryHand = frameData.rightHand || frameData.leftHand;
    const rawLandmarks = primaryHand?.rawLandmarks || [];
    const timestamp = frameData.timestamp || Date.now();

    if (rawLandmarks.length < 21) {
      this.currentPhase = 'REST';
      this.prevTips = [];
      return {
        energy: 0,
        phase: 'REST',
        inSigningSpace: false,
        elevation: 'BELOW_WAIST',
        isSuppressed: true,
      };
    }

    // Key anatomical tips: Wrist (0), Thumb (4), Index (8), Middle (12), Ring (16), Pinky (20)
    const tipIndices = [0, 4, 8, 12, 16, 20];
    const currentTips: Landmark3D[] = tipIndices.map((i) => rawLandmarks[i]);

    let energy = 0;
    if (this.prevTips.length === 6) {
      for (let i = 0; i < 6; i++) {
        const p1 = this.prevTips[i];
        const p2 = currentTips[i];
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dz = (p2.z || 0) - (p1.z || 0);
        energy += dx * dx + dy * dy + dz * dz;
      }
    }

    this.prevTips = currentTips;
    this.prevTimestamp = timestamp;

    // Elevation & Signing Space Detection
    const wristY = rawLandmarks[0].y;
    let elevation: KineticEnergyState['elevation'] = 'CHEST';
    let inSigningSpace = true;

    if (frameData.pose && frameData.pose.nose && frameData.pose.leftShoulder) {
      const noseY = frameData.pose.nose.y;
      const shoulderY = (frameData.pose.leftShoulder.y + frameData.pose.rightShoulder.y) / 2;

      if (wristY < noseY + 0.10) {
        elevation = 'HEAD';
        inSigningSpace = true;
      } else if (wristY <= shoulderY + 0.35) {
        elevation = 'CHEST';
        inSigningSpace = true;
      } else if (wristY <= shoulderY + 0.65) {
        elevation = 'WAIST';
        inSigningSpace = true;
      } else {
        elevation = 'BELOW_WAIST';
        inSigningSpace = false;
      }
    } else {
      if (wristY < 0.35) elevation = 'HEAD';
      else if (wristY < 0.70) elevation = 'CHEST';
      else if (wristY < 0.88) elevation = 'WAIST';
      else {
        elevation = 'BELOW_WAIST';
        inSigningSpace = false;
      }
    }

    // Kinematic Phase State Transitions
    const prevPhase = this.currentPhase;

    if (!inSigningSpace || (energy < this.E_NOISE && elevation === 'BELOW_WAIST')) {
      this.currentPhase = 'REST';
    } else if (this.currentPhase === 'REST') {
      if (inSigningSpace && energy >= this.E_PREP) {
        this.currentPhase = 'PREPARATION';
      }
    } else if (this.currentPhase === 'PREPARATION') {
      if (energy < this.E_PREP * 2.5 && energy >= this.E_NOISE) {
        this.currentPhase = 'STROKE';
      } else if (wristY > 0.85) {
        this.currentPhase = 'RETRACTION';
      }
    } else if (this.currentPhase === 'STROKE') {
      if (energy > this.E_RETRACT && wristY > 0.75) {
        this.currentPhase = 'RETRACTION';
      } else if (energy < this.E_NOISE && elevation === 'BELOW_WAIST') {
        this.currentPhase = 'REST';
      }
    } else if (this.currentPhase === 'RETRACTION') {
      if (!inSigningSpace || energy < this.E_NOISE) {
        this.currentPhase = 'REST';
      } else if (inSigningSpace && energy < this.E_PREP) {
        this.currentPhase = 'STROKE';
      }
    }

    if (this.currentPhase === prevPhase) {
      this.phaseHoldFrames++;
    } else {
      this.phaseHoldFrames = 0;
    }

    // Output is suppressed during REST or RETRACTION to eliminate exit-gesture misfires
    const isSuppressed = this.currentPhase === 'REST' || this.currentPhase === 'RETRACTION';

    return {
      energy: Number(energy.toFixed(5)),
      phase: this.currentPhase,
      inSigningSpace,
      elevation,
      isSuppressed,
    };
  }

  /**
   * Margin-Based Confidence Gate:
   * Requires top score >= minConfidenceScore AND margin delta (top - runner_up) >= minMarginDelta.
   * If rejected, returns accepted: false and topSign: 'IDLE' (__NULL__).
   */
  public evaluateMarginGate(scores: ClassificationScore[]): MarginGateResult {
    if (!scores || scores.length === 0) {
      return {
        accepted: false,
        topSign: 'IDLE',
        confidence: 0,
        margin: 0,
        reason: 'Empty candidate list',
        rankedScores: [],
      };
    }

    // Sort descending
    const sorted = [...scores].sort((a, b) => b.confidence - a.confidence);
    const top = sorted[0];
    const runnerUp = sorted.length > 1 ? sorted[1] : { sign: 'IDLE' as ISLSign, confidence: 0 };

    const margin = Number((top.confidence - runnerUp.confidence).toFixed(3));

    // Evaluate margin and confidence gate
    if (top.confidence < this.minConfidenceScore) {
      return {
        accepted: false,
        topSign: 'IDLE',
        confidence: top.confidence,
        margin,
        reason: `Score ${Math.round(top.confidence * 100)}% below threshold ${Math.round(this.minConfidenceScore * 100)}%`,
        rankedScores: sorted.slice(0, 5),
      };
    }

    if (margin < this.minMarginDelta && runnerUp.confidence > 0.50) {
      return {
        accepted: false,
        topSign: 'IDLE',
        confidence: top.confidence,
        margin,
        reason: `Ambiguous margin ${margin} < required delta ${this.minMarginDelta} against ${runnerUp.sign}`,
        rankedScores: sorted.slice(0, 5),
      };
    }

    return {
      accepted: true,
      topSign: top.sign,
      confidence: top.confidence,
      margin,
      reason: `Verified ${top.sign} with ${Math.round(top.confidence * 100)}% match and margin +${margin}`,
      rankedScores: sorted.slice(0, 5),
    };
  }

  public reset(): void {
    this.prevTips = [];
    this.prevTimestamp = 0;
    this.currentPhase = 'REST';
    this.phaseHoldFrames = 0;
  }
}
