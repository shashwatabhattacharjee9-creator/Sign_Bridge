import {
  ClassificationResult,
  ClassificationScore,
  FrameLandmarkData,
  ISLSign,
  NormalizedHandFeatures,
} from '@/types/isl';
import { TemporalBuffer } from './temporalBuffer';

/**
 * Computes cosine similarity between two 63D feature vectors
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

// Canonical Reference Prototypes for 30 ISL Signs (Key anchor vectors)
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
 * Dual classification engine: Heuristic Kinematics + Cosine Vector Matching + Temporal Flow.
 */
export class ISLClassifier {
  /**
   * Main classification method
   * Accepts raw vector array or full FrameLandmarkData object.
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

    if (!hasAnyHand || vector63.every((v) => v === 0)) {
      return {
        sign: 'IDLE',
        confidence: 0,
        isDynamic: false,
        latencyMs: Math.round(performance.now() - startTime),
        isUncertain: true,
        rankedScores: [],
      };
    }

    const primaryHand: NormalizedHandFeatures = (rightHand || leftHand)!;
    const secondaryHand: NormalizedHandFeatures | undefined = rightHand && leftHand ? leftHand : undefined;
    const trajectory = tempBuffer.analyzeTrajectory(rightHand ? 'right' : 'left');

    const ext = primaryHand.fingerExtensions;
    const curls = primaryHand.fingerCurls;
    const dists = primaryHand.fingerDistances;
    const orient = primaryHand.orientation;
    const shape = primaryHand.detectedShape;
    const rawLandmarks = primaryHand.rawLandmarks;

    // Two-handed distance
    let areHandsClose = false;
    let interHandDistance = 999;
    if (rightHand && leftHand && rightHand.rawLandmarks[0] && leftHand.rawLandmarks[0]) {
      const rw = rightHand.rawLandmarks[0];
      const lw = leftHand.rawLandmarks[0];
      const dx = rw.x - lw.x;
      const dy = rw.y - lw.y;
      const dz = (rw.z || 0) - (lw.z || 0);
      interHandDistance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      areHandsClose = interHandDistance < 0.28;
    }

    // Pose elevation check
    let isHandAtHeadLevel = false;
    let isHandAtChestLevel = true;
    if (frameData.pose && rawLandmarks[0]) {
      const wristY = rawLandmarks[0].y;
      if (frameData.pose.nose && wristY <= frameData.pose.nose.y + 0.18) {
        isHandAtHeadLevel = true;
      }
      if (frameData.pose.leftShoulder && frameData.pose.rightShoulder) {
        const shoulderY = (frameData.pose.leftShoulder.y + frameData.pose.rightShoulder.y) / 2;
        isHandAtChestLevel = wristY >= shoulderY - 0.15 && wristY <= shoulderY + 0.45;
      }
    } else if (rawLandmarks[0] && rawLandmarks[0].y < 0.40) {
      isHandAtHeadLevel = true;
    }

    const fourExt = (ext.index + ext.middle + ext.ring + ext.pinky) / 4;
    const fourCurled = ((1 - ext.index) + (1 - ext.middle) + (1 - ext.ring) + (1 - ext.pinky)) / 4;

    const scores: ClassificationScore[] = [];

    // -------------------------------------------------------------
    // STATIC GESTURE DETECTION (Rules + Spatial Vectors)
    // -------------------------------------------------------------

    // --- HELP (Thumbs-up fist placed on flat palm or thumbs up) ---
    {
      const thumbsUp = fourCurled * 0.6 + ext.thumb * 0.4;
      let match = thumbsUp * 0.60;
      if (secondaryHand && areHandsClose) {
        const secFlat = (secondaryHand.fingerExtensions.index + secondaryHand.fingerExtensions.middle) / 2;
        match += secFlat * 0.35;
      } else {
        match += thumbsUp * 0.30;
      }
      if (trajectory.direction === 'UP' || !trajectory.motionDetected) match += 0.08;
      scores.push({ sign: 'HELP', confidence: Math.min(0.98, Number(match.toFixed(2))) });
    }

    // --- OKAY (Thumb-Index ring, other 3 extended) ---
    {
      const oRing = Math.max(0, 1 - dists.thumbToIndex / 0.50);
      const otherThree = (ext.middle + ext.ring + ext.pinky) / 3;
      let match = oRing * 0.52 + otherThree * 0.44;
      if (!trajectory.motionDetected) match += 0.04;
      scores.push({ sign: 'OKAY', confidence: Math.min(0.98, Number(match.toFixed(2))) });
    }

    // --- STOP (Flat vertical palm facing front or chopping into flat palm) ---
    {
      let match = fourExt * 0.60;
      if (orient.palmFacing === 'camera' || orient.palmFacing === 'left' || orient.palmFacing === 'right') match += 0.25;
      if (secondaryHand && areHandsClose) match += 0.12;
      else if (!trajectory.motionDetected) match += 0.10;
      scores.push({ sign: 'STOP', confidence: Math.min(0.97, Number(match.toFixed(2))) });
    }

    // --- NAMASTE (Prayer pose with both hands pressed together) ---
    {
      let match = 0;
      if (secondaryHand && areHandsClose) {
        const flatBoth = (fourExt + (secondaryHand.fingerExtensions.index + secondaryHand.fingerExtensions.middle) / 2) / 2;
        match = flatBoth * 0.65 + 0.32;
      } else {
        match = fourExt * 0.50 + 0.20;
      }
      scores.push({ sign: 'NAMASTE', confidence: Math.min(0.98, Number(match.toFixed(2))) });
    }

    // --- POLICE (C-shape badge held over chest) ---
    {
      const cScore = dists.thumbToIndex > 0.35 && dists.thumbToIndex < 1.35 ? 0.65 : 0.2;
      let match = cScore * 0.65;
      if (isHandAtChestLevel) match += 0.20;
      if (!trajectory.motionDetected || orient.palmFacing === 'user') match += 0.12;
      scores.push({ sign: 'POLICE', confidence: Math.min(0.95, Number(match.toFixed(2))) });
    }

    // --- DANGER (Crossed wrists in an X) ---
    {
      let match = 0;
      if (secondaryHand && areHandsClose) match = 0.75 + (isHandAtChestLevel ? 0.20 : 0.10);
      else match = fourCurled * 0.40;
      scores.push({ sign: 'DANGER', confidence: Math.min(0.96, Number(match.toFixed(2))) });
    }

    // --- FRIEND (Both index fingers hooked together) ---
    {
      const hook = ext.index * (1 - ext.middle * 0.6);
      let match = hook * 0.45;
      if (secondaryHand && areHandsClose) match += 0.50;
      else match += hook * 0.25;
      scores.push({ sign: 'FRIEND', confidence: Math.min(0.95, Number(match.toFixed(2))) });
    }

    // -------------------------------------------------------------
    // DYNAMIC GESTURE DETECTION (Trajectories + Shape Transitions)
    // -------------------------------------------------------------

    // --- GOODBYE (Open hand waving laterally) ---
    {
      let match = fourExt * 0.50;
      if (orient.palmFacing === 'camera') match += 0.15;
      if (trajectory.isOscillatingHorizontal || trajectory.variance.x > 0.0002) match += 0.33;
      else match += 0.12;
      scores.push({ sign: 'GOODBYE', confidence: Math.min(0.98, Number(match.toFixed(2))) });
    }

    // --- HELLO (Open flat hand salute near temple) ---
    {
      let match = fourExt * 0.55;
      if (isHandAtHeadLevel) match += 0.30;
      if (trajectory.direction === 'RIGHT' || trajectory.direction === 'FORWARD' || trajectory.direction === 'UP' || !trajectory.motionDetected) match += 0.12;
      scores.push({ sign: 'HELLO', confidence: Math.min(0.97, Number(match.toFixed(2))) });
    }

    // --- WATER (W-shape 3 fingers near chin/mouth) ---
    {
      const wScore = ((ext.index + ext.middle + ext.ring) / 3) * (1 - ext.pinky * 0.6);
      let match = wScore * 0.70;
      if (isHandAtHeadLevel || orient.pitch < 0.6) match += 0.20;
      if (dists.thumbToPinky < 1.2 || ext.thumb < 0.7) match += 0.08;
      scores.push({ sign: 'WATER', confidence: Math.min(0.97, Number(match.toFixed(2))) });
    }

    // --- FOOD (All fingertips bunched together tapping to mouth) ---
    {
      const pinch = Math.max(0, 1 - (dists.thumbToIndex + dists.thumbToMiddle + dists.thumbToPinky) / 2.5);
      let match = pinch * 0.65;
      if (isHandAtHeadLevel || trajectory.direction === 'BACKWARD' || trajectory.direction === 'UP') match += 0.22;
      if (trajectory.motionDetected || trajectory.isOscillatingVertical) match += 0.10;
      scores.push({ sign: 'FOOD', confidence: Math.min(0.96, Number(match.toFixed(2))) });
    }

    // --- MEDICINE (Middle finger grinding circular on palm) ---
    {
      const midExt = ext.middle * (1 - ext.ring * 0.5) * (1 - ext.pinky * 0.5);
      let match = midExt * 0.50;
      if (secondaryHand && areHandsClose) match += 0.30;
      else match += 0.15;
      if (trajectory.isCircular || trajectory.motionDetected) match += 0.16;
      else match += 0.08;
      scores.push({ sign: 'MEDICINE', confidence: Math.min(0.95, Number(match.toFixed(2))) });
    }

    // --- HOSPITAL (H-hand drawing a cross) ---
    {
      const hScore = ((ext.index + ext.middle) / 2) * (1 - ext.ring * 0.7) * (1 - ext.pinky * 0.7);
      let match = hScore * 0.60;
      if (dists.indexToMiddle < 0.5) match += 0.15;
      if (trajectory.motionDetected || !trajectory.motionDetected) match += 0.20;
      scores.push({ sign: 'HOSPITAL', confidence: Math.min(0.95, Number(match.toFixed(2))) });
    }

    // --- BATHROOM (T-fist shaking side to side) ---
    {
      let match = fourCurled * 0.55;
      if (dists.thumbToIndex < 0.65) match += 0.15;
      if (trajectory.isOscillatingHorizontal || trajectory.variance.x > 0.0002) match += 0.26;
      else match += 0.10;
      scores.push({ sign: 'BATHROOM', confidence: Math.min(0.95, Number(match.toFixed(2))) });
    }

    // --- PAIN (Index fingers pointing and twisting) ---
    {
      const point1 = ext.index * (1 - ext.middle * 0.7);
      let match = point1 * 0.50;
      if (secondaryHand) {
        match += secondaryHand.fingerExtensions.index * 0.35;
        if (areHandsClose) match += 0.12;
      } else {
        match += point1 * 0.30;
      }
      scores.push({ sign: 'PAIN', confidence: Math.min(0.95, Number(match.toFixed(2))) });
    }

    // --- AMBULANCE (High hand rotating beacon) ---
    {
      let match = (isHandAtHeadLevel ? 0.45 : 0.20) + fourExt * 0.25;
      if (trajectory.isCircular || trajectory.isOscillatingHorizontal || trajectory.motionDetected) match += 0.26;
      scores.push({ sign: 'AMBULANCE', confidence: Math.min(0.95, Number(match.toFixed(2))) });
    }

    // --- TEACHER (Two hands at temples moving forward) ---
    {
      let match = (isHandAtHeadLevel ? 0.40 : 0.20);
      if (secondaryHand && interHandDistance > 0.20) match += 0.35;
      else match += 0.20;
      if (trajectory.direction === 'FORWARD' || trajectory.direction === 'DOWN' || !trajectory.motionDetected) match += 0.20;
      scores.push({ sign: 'TEACHER', confidence: Math.min(0.95, Number(match.toFixed(2))) });
    }

    // --- CLASS (Two C-hands drawing an expanding circle) ---
    {
      const cScore = dists.thumbToIndex > 0.35 && dists.thumbToIndex < 1.35 ? 0.6 : 0.2;
      let match = cScore * 0.55;
      if (secondaryHand) match += 0.25;
      if (trajectory.isExpanding || trajectory.isCircular || trajectory.motionDetected) match += 0.16;
      else match += 0.08;
      scores.push({ sign: 'CLASS', confidence: Math.min(0.95, Number(match.toFixed(2))) });
    }

    // --- GO (Index pointing forward/away) ---
    {
      const point1 = ext.index * (1 - ext.middle * 0.6);
      let match = point1 * 0.60;
      if (trajectory.direction === 'FORWARD' || trajectory.direction === 'RIGHT' || trajectory.motionDetected) match += 0.35;
      else match += 0.15;
      scores.push({ sign: 'GO', confidence: Math.min(0.95, Number(match.toFixed(2))) });
    }

    // --- COME (Beckoning inward curl to chest) ---
    {
      let match = 0;
      if (orient.palmFacing === 'user' || orient.palmFacing === 'up') match += 0.35;
      if (ext.index > 0.45 || fourExt > 0.50) match += 0.35;
      if (trajectory.direction === 'BACKWARD' || trajectory.direction === 'UP' || trajectory.motionDetected) match += 0.26;
      else match += 0.10;
      scores.push({ sign: 'COME', confidence: Math.min(0.95, Number(match.toFixed(2))) });
    }

    // --- WAIT (Both palms undulating) ---
    {
      let match = fourExt * 0.55;
      if (secondaryHand && interHandDistance > 0.18) match += 0.30;
      else match += 0.15;
      if (!trajectory.motionDetected || trajectory.isOscillatingHorizontal) match += 0.10;
      scores.push({ sign: 'WAIT', confidence: Math.min(0.94, Number(match.toFixed(2))) });
    }

    // --- REPEAT (Curved hand flipping into palm) ---
    {
      let match = 0;
      if (secondaryHand && areHandsClose) match += 0.45;
      if (ext.index > 0.35 && ext.middle > 0.35) match += 0.30;
      if (trajectory.direction === 'DOWN' || trajectory.isOscillatingVertical || trajectory.motionDetected) match += 0.20;
      scores.push({ sign: 'REPEAT', confidence: Math.min(0.94, Number(match.toFixed(2))) });
    }

    // --- WANT (Clawed palms pulling to torso) ---
    {
      let match = 0;
      if (orient.palmFacing === 'up' || orient.palmFacing === 'user') match += 0.40;
      if (ext.index > 0.30 && ext.index < 0.80 && ext.middle > 0.30 && ext.middle < 0.80) match += 0.35;
      if (trajectory.direction === 'BACKWARD' || trajectory.direction === 'DOWN' || trajectory.motionDetected) match += 0.20;
      scores.push({ sign: 'WANT', confidence: Math.min(0.94, Number(match.toFixed(2))) });
    }

    // --- NEED (X-hooked index bending downward) ---
    {
      const hook = (ext.index > 0.25 && ext.index < 0.75 ? 0.6 : 0.2) * (1 - ext.middle * 0.6);
      let match = hook * 0.60;
      if (trajectory.direction === 'DOWN' || trajectory.isOscillatingVertical || trajectory.motionDetected) match += 0.35;
      else match += 0.15;
      scores.push({ sign: 'NEED', confidence: Math.min(0.95, Number(match.toFixed(2))) });
    }

    // --- LEARN (Knowledge from open palm to forehead) ---
    {
      let match = (secondaryHand && areHandsClose ? 0.35 : 0.15);
      if (isHandAtHeadLevel || trajectory.direction === 'UP') match += 0.50;
      else match += 0.20;
      scores.push({ sign: 'LEARN', confidence: Math.min(0.95, Number(match.toFixed(2))) });
    }

    // --- BOOK (Two flat hands opening outward) ---
    {
      let match = fourExt * 0.45;
      if (secondaryHand) {
        match += (secondaryHand.fingerExtensions.index + secondaryHand.fingerExtensions.middle) * 0.20;
        if (areHandsClose || trajectory.isExpanding) match += 0.16;
      } else {
        match += fourExt * 0.25;
      }
      scores.push({ sign: 'BOOK', confidence: Math.min(0.95, Number(match.toFixed(2))) });
    }

    // --- WRITE (Pen pinch scribble on palm) ---
    {
      const pen = (dists.thumbToIndex < 0.55 ? 0.6 : 0.2) * (1 - ext.ring * 0.5);
      let match = pen * 0.55;
      if (secondaryHand && areHandsClose) match += 0.30;
      if (trajectory.motionDetected || trajectory.isOscillatingHorizontal) match += 0.12;
      scores.push({ sign: 'WRITE', confidence: Math.min(0.95, Number(match.toFixed(2))) });
    }

    // --- THANK YOU (Touch chin and extend flat forward) ---
    {
      let match = fourExt * 0.50;
      if (isHandAtHeadLevel || isHandAtChestLevel) match += 0.25;
      if (trajectory.direction === 'FORWARD' || trajectory.direction === 'DOWN' || !trajectory.motionDetected) match += 0.20;
      scores.push({ sign: 'THANK_YOU', confidence: Math.min(0.96, Number(match.toFixed(2))) });
    }

    // --- PLEASE (Flat hand rubbing circular on chest) ---
    {
      let match = fourExt * 0.55;
      if (isHandAtChestLevel) match += 0.25;
      if (trajectory.isCircular || trajectory.motionDetected) match += 0.18;
      else match += 0.08;
      scores.push({ sign: 'PLEASE', confidence: Math.min(0.96, Number(match.toFixed(2))) });
    }

    // --- SORRY (Closed fist rubbing circular on chest) ---
    {
      let match = fourCurled * 0.55;
      if (isHandAtChestLevel) match += 0.25;
      if (trajectory.isCircular || trajectory.motionDetected) match += 0.18;
      else match += 0.08;
      scores.push({ sign: 'SORRY', confidence: Math.min(0.96, Number(match.toFixed(2))) });
    }

    // --- YES (Closed fist nodding up and down) ---
    {
      let match = fourCurled * 0.55;
      if (trajectory.isOscillatingVertical || trajectory.variance.y > 0.0002) match += 0.38;
      else match += 0.15;
      scores.push({ sign: 'YES', confidence: Math.min(0.96, Number(match.toFixed(2))) });
    }

    // --- NO (Index and Middle snapping onto thumb pad) ---
    {
      const twoFin = ((ext.index + ext.middle) / 2) * (1 - ext.ring * 0.6) * (1 - ext.pinky * 0.6);
      let match = twoFin * 0.50;
      if (dists.thumbToIndex < 0.65) match += 0.30;
      else match += 0.15;
      if (trajectory.motionDetected || !trajectory.motionDetected) match += 0.15;
      scores.push({ sign: 'NO', confidence: Math.min(0.95, Number(match.toFixed(2))) });
    }

    // Sort candidates descending by confidence
    scores.sort((a, b) => b.confidence - a.confidence);

    const topCandidate = scores[0];
    const confidenceThreshold = 0.70;
    const isUncertain = !topCandidate || topCandidate.confidence < confidenceThreshold;
    const sign: ISLSign = isUncertain ? 'IDLE' : topCandidate.sign;
    const isDynamic = SIGN_DYNAMIC_MAP[sign] ?? false;
    const latencyMs = Math.round(performance.now() - startTime);

    return {
      sign,
      confidence: topCandidate ? topCandidate.confidence : 0,
      isDynamic,
      latencyMs,
      isUncertain,
      rankedScores: scores.slice(0, 5),
      motionDetected: trajectory.motionDetected,
      timestamp: frameData.timestamp,
    };
  }
}
