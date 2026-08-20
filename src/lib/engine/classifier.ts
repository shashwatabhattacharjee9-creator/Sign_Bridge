import {
  ClassificationResult,
  ClassificationScore,
  FrameLandmarkData,
  ISLSign,
  NormalizedHandFeatures,
  SignAnchor,
} from '@/types/isl';
import { TemporalBuffer } from './temporalBuffer';
import { GestureBoundaryGate } from './gestureGate';
import { anchorRegistry, ISL_VOCABULARY } from './gestureLibrary';

/**
 * Computes cosine similarity between two feature vectors
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length || vecA.length === 0) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

const SIGN_DYNAMIC_MAP: Record<ISLSign, boolean> = {
  HELP: false,
  WATER: true,
  FOOD: true,
  MEDICINE: true,
  HOSPITAL: true,
  POLICE: false,
  BATHROOM: true,
  PAIN: true,
  DANGER: false,
  AMBULANCE: true,
  TEACHER: true,
  CLASS: true,
  GO: true,
  COME: true,
  STOP: false,
  WAIT: true,
  REPEAT: true,
  WANT: true,
  NEED: true,
  LEARN: true,
  BOOK: true,
  WRITE: true,
  HELLO: true,
  GOODBYE: true,
  THANK_YOU: true,
  PLEASE: true,
  SORRY: true,
  YES: true,
  NO: true,
  OKAY: false,
  NAMASTE: false,
  FRIEND: false,
  IDLE: false,
};

/**
 * FILE 4: ISLClassifier
 * High-Precision Orthonormal Cosine Matching + Kinematic State Machine + Margin Gating
 */
export class ISLClassifier {
  private static boundaryGate = new GestureBoundaryGate(0.88, 0.12);

  public static setThresholds(minConfidence: number, minMargin: number = 0.12): void {
    this.boundaryGate.updateThresholds(minConfidence, minMargin);
  }

  /**
   * Main classification pipeline
   */
  public static classify(
    input: number[] | FrameLandmarkData,
    buffer?: TemporalBuffer
  ): ClassificationResult {
    const startTime = performance.now();
    const tempBuffer = buffer || new TemporalBuffer(30);

    let frameData: FrameLandmarkData;
    let vector63: number[];

    if (Array.isArray(input)) {
      vector63 = input;
      frameData = {
        timestamp: Date.now(),
        rightHand: {
          vector63: input,
          wristDistance: 1,
          fingerCurls: {
            isThumbCurled: false,
            isIndexCurled: false,
            isMiddleCurled: false,
            isRingCurled: false,
            isPinkyCurled: false,
          },
          fingerExtensions: { thumb: 0.5, index: 0.5, middle: 0.5, ring: 0.5, pinky: 0.5 },
          detectedShape: 'UNKNOWN',
          shapeConfidence: 0.5,
          fingerDistances: { thumbToIndex: 0.5, thumbToMiddle: 0.5, indexToMiddle: 0.2, thumbToPinky: 1.0, indexTipToWrist: 1.0 },
          orientation: { pitch: 0, yaw: 0, roll: 0, palmFacing: 'camera' },
          rawLandmarks: [],
        },
      };
    } else {
      frameData = input;
      const pHand = frameData.rightHand || frameData.leftHand;
      vector63 = pHand ? pHand.vector63 : new Array(63).fill(0);
    }

    const rightHand = frameData.rightHand;
    const leftHand = frameData.leftHand;
    const hasAnyHand = !!(rightHand || leftHand);

    // 1. Kinetic Energy & 4-Phase Boundary Evaluation
    const energyState = this.boundaryGate.evaluateEnergyAndPhase(frameData);

    // If hands are at rest, in retraction, or not in signing space -> Immediate strict NULL
    if (!hasAnyHand || vector63.every((v) => v === 0) || energyState.isSuppressed) {
      return {
        sign: 'IDLE',
        confidence: 0,
        isDynamic: false,
        latencyMs: Math.round(performance.now() - startTime),
        isUncertain: true,
        rankedScores: [],
        phase: energyState.phase,
        kineticEnergy: energyState.energy,
        margin: 0,
      };
    }

    const primaryHand: NormalizedHandFeatures = (rightHand || leftHand)!;
    const secondaryHand: NormalizedHandFeatures | undefined = rightHand && leftHand ? leftHand : undefined;
    const trajectory = tempBuffer.analyzeTrajectory(rightHand ? 'right' : 'left');

    const ext = primaryHand.fingerExtensions;
    const curls = primaryHand.fingerCurls;
    const dists = primaryHand.fingerDistances;
    const orient = primaryHand.orientation;
    const rawLandmarks = primaryHand.rawLandmarks;

    // Two-handed relative metrics
    const areHandsClose = frameData.twoHandRelative
      ? frameData.twoHandRelative.relativeDistance < 0.35
      : false;

    // Elevation flags
    const isHandAtHeadLevel = energyState.elevation === 'HEAD';
    const isHandAtChestLevel = energyState.elevation === 'CHEST';

    const fourExt = (ext.index + ext.middle + ext.ring + ext.pinky) / 4;
    const fourCurled = ((1 - ext.index) + (1 - ext.middle) + (1 - ext.ring) + (1 - ext.pinky)) / 4;

    const scores: ClassificationScore[] = [];
    const allAnchors = anchorRegistry.getAllAnchors();

    // 2. Cosine Vector Similarity against Orthonormal Prototypes
    for (const [signKey, anchor] of Object.entries(allAnchors)) {
      if (anchor.twoHanded && !secondaryHand) continue;

      const sim = cosineSimilarity(vector63, anchor.vector63);
      if (sim > 0.70) {
        scores.push({
          sign: signKey as ISLSign,
          confidence: Number(sim.toFixed(3)),
          matchReason: 'Orthonormal Cosine Match',
        });
      }
    }

    // 3. Kinematics & Trajectory Heuristic Boosts
    // HELP
    {
      const thumbsUp = fourCurled * 0.55 + ext.thumb * 0.45;
      let match = thumbsUp * 0.60;
      if (secondaryHand && areHandsClose) match += 0.35;
      if (isHandAtChestLevel) match += 0.05;
      scores.push({ sign: 'HELP', confidence: Math.min(0.98, Number(match.toFixed(3))) });
    }

    // OKAY
    {
      const oRing = Math.max(0, 1 - dists.thumbToIndex / 0.50);
      const otherThree = (ext.middle + ext.ring + ext.pinky) / 3;
      const match = oRing * 0.52 + otherThree * 0.44 + (orient.palmFacing === 'camera' ? 0.04 : 0);
      scores.push({ sign: 'OKAY', confidence: Math.min(0.98, Number(match.toFixed(3))) });
    }

    // WATER
    {
      const wScore = ((ext.index + ext.middle + ext.ring) / 3) * (1 - ext.pinky * 0.6);
      let match = wScore * 0.70;
      if (isHandAtHeadLevel || orient.pitch < 0.6) match += 0.22;
      if (dists.thumbToPinky < 1.2 || ext.thumb < 0.7) match += 0.06;
      scores.push({ sign: 'WATER', confidence: Math.min(0.97, Number(match.toFixed(3))) });
    }

    // STOP
    {
      let match = fourExt * 0.60;
      if (orient.palmFacing === 'camera' || orient.palmFacing === 'left' || orient.palmFacing === 'right') match += 0.25;
      if (secondaryHand && areHandsClose) match += 0.12;
      scores.push({ sign: 'STOP', confidence: Math.min(0.97, Number(match.toFixed(3))) });
    }

    // HELLO
    {
      let match = fourExt * 0.55;
      if (isHandAtHeadLevel) match += 0.30;
      if (trajectory.direction === 'RIGHT' || trajectory.direction === 'FORWARD' || trajectory.direction === 'UP') match += 0.12;
      scores.push({ sign: 'HELLO', confidence: Math.min(0.97, Number(match.toFixed(3))) });
    }

    // NAMASTE
    {
      let match = 0;
      if (secondaryHand && areHandsClose) {
        const flatBoth = (fourExt + (secondaryHand.fingerExtensions.index + secondaryHand.fingerExtensions.middle) / 2) / 2;
        match = flatBoth * 0.65 + 0.32;
      }
      scores.push({ sign: 'NAMASTE', confidence: Math.min(0.98, Number(match.toFixed(3))) });
    }

    // FOOD
    {
      const pinch = Math.max(0, 1 - (dists.thumbToIndex + dists.thumbToMiddle + dists.thumbToPinky) / 2.5);
      let match = pinch * 0.65;
      if (isHandAtHeadLevel || trajectory.direction === 'BACKWARD' || trajectory.direction === 'UP') match += 0.22;
      if (trajectory.motionDetected || trajectory.isOscillatingVertical) match += 0.10;
      scores.push({ sign: 'FOOD', confidence: Math.min(0.96, Number(match.toFixed(3))) });
    }

    // MEDICINE
    {
      const midExt = ext.middle * (1 - ext.ring * 0.5) * (1 - ext.pinky * 0.5);
      let match = midExt * 0.50;
      if (secondaryHand && areHandsClose) match += 0.30;
      if (trajectory.isCircular || trajectory.motionDetected) match += 0.16;
      scores.push({ sign: 'MEDICINE', confidence: Math.min(0.95, Number(match.toFixed(3))) });
    }

    // POLICE
    {
      const cScore = dists.thumbToIndex > 0.35 && dists.thumbToIndex < 1.35 ? 0.65 : 0.2;
      let match = cScore * 0.65;
      if (isHandAtChestLevel) match += 0.22;
      if (orient.palmFacing === 'user') match += 0.10;
      scores.push({ sign: 'POLICE', confidence: Math.min(0.95, Number(match.toFixed(3))) });
    }

    // GOODBYE
    {
      let match = fourExt * 0.50;
      if (orient.palmFacing === 'camera') match += 0.15;
      if (trajectory.isOscillatingHorizontal || trajectory.variance.x > 0.0002) match += 0.33;
      scores.push({ sign: 'GOODBYE', confidence: Math.min(0.98, Number(match.toFixed(3))) });
    }

    // Aggregate maximum score per sign
    const bestBySign: Record<string, ClassificationScore> = {};
    for (const item of scores) {
      if (!bestBySign[item.sign] || item.confidence > bestBySign[item.sign].confidence) {
        bestBySign[item.sign] = item;
      }
    }
    const deduplicatedScores = Object.values(bestBySign);

    // 4. Strict Margin Gating (Top vs Runner-Up >= 0.12 && Top >= 0.88)
    const gateResult = this.boundaryGate.evaluateMarginGate(deduplicatedScores);

    const sign: ISLSign = gateResult.accepted ? gateResult.topSign : 'IDLE';
    const isDynamic = SIGN_DYNAMIC_MAP[sign] ?? false;
    const latencyMs = Math.round(performance.now() - startTime);

    return {
      sign,
      confidence: gateResult.confidence,
      isDynamic,
      latencyMs,
      isUncertain: !gateResult.accepted,
      rankedScores: gateResult.rankedScores,
      motionDetected: trajectory.motionDetected,
      timestamp: frameData.timestamp,
      phase: energyState.phase,
      kineticEnergy: energyState.energy,
      margin: gateResult.margin,
    };
  }
}
