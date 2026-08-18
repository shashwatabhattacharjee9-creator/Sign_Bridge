import {
  HandLandmarks,
  HandState,
  Landmark3D,
  NormalizedHandFeatures,
  PoseLandmarks,
  RecognizedHandShape,
  FingerCurlState,
  FingerExtensionScores,
  HandOrientation,
} from '@/types/isl';

// Static Memory Pool to completely eliminate Garbage Collection thrashing
const STATIC_VECTOR_63 = new Float32Array(63);
const STATIC_ANGLES_5 = [0, 0, 0, 0, 0];

/**
 * Calculates 3D Euclidean distance between two landmarks
 */
export function distance3D(p1: Landmark3D, p2: Landmark3D): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dz = (p1.z || 0) - (p2.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Calculates 2D Euclidean distance
 */
export function distance2D(p1: Landmark3D, p2: Landmark3D): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculates flexion angle between 3 points in degrees (p1 - vertex - p3)
 */
export function angleBetweenPoints(p1: Landmark3D, vertex: Landmark3D, p3: Landmark3D): number {
  const v1x = p1.x - vertex.x;
  const v1y = p1.y - vertex.y;
  const v1z = (p1.z || 0) - (vertex.z || 0);

  const v2x = p3.x - vertex.x;
  const v2y = p3.y - vertex.y;
  const v2z = (p3.z || 0) - (vertex.z || 0);

  const dot = v1x * v2x + v1y * v2y + v1z * v2z;
  const mag1 = Math.sqrt(v1x * v1x + v1y * v1y + v1z * v1z);
  const mag2 = Math.sqrt(v2x * v2x + v2y * v2y + v2z * v2z);

  if (mag1 * mag2 === 0) return 0;
  const cosTheta = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
  return (Math.acos(cosTheta) * 180) / Math.PI;
}

/**
 * Calculates flexion angles (MCP to PIP to TIP) for all 5 digits
 */
export function calculateFingerAngles(landmarks: Landmark3D[]): number[] {
  if (!landmarks || landmarks.length < 21) {
    return [0, 0, 0, 0, 0];
  }

  STATIC_ANGLES_5[0] = Number(angleBetweenPoints(landmarks[2], landmarks[3], landmarks[4]).toFixed(1));
  STATIC_ANGLES_5[1] = Number(angleBetweenPoints(landmarks[5], landmarks[6], landmarks[8]).toFixed(1));
  STATIC_ANGLES_5[2] = Number(angleBetweenPoints(landmarks[9], landmarks[10], landmarks[12]).toFixed(1));
  STATIC_ANGLES_5[3] = Number(angleBetweenPoints(landmarks[13], landmarks[14], landmarks[16]).toFixed(1));
  STATIC_ANGLES_5[4] = Number(angleBetweenPoints(landmarks[17], landmarks[18], landmarks[20]).toFixed(1));

  return [...STATIC_ANGLES_5];
}

/**
 * Robust Coordinate Normalization:
 * 1. Origin Translation: Shift all 21 points so Wrist (0) is at (0, 0, 0).
 * 2. Scale Invariance: Compute Euclidean distance between Wrist (0) and Middle Finger MCP (9). Scale by 1.0 / distance.
 * 3. Max-Min Bounding: Clip normalized values between [-2.0, 2.0] to reject sensor spikes.
 * 4. Output: Flatten into a 63-element vector [x0, y0, z0, x1, y1, z1, ...].
 */
export function normalizeHandLandmarks(landmarks: Landmark3D[]): number[] {
  if (!landmarks || landmarks.length < 21) {
    return new Array(63).fill(0);
  }

  const wrist = landmarks[0];
  const middleMCP = landmarks[9];

  let scale = distance3D(wrist, middleMCP);
  if (scale < 0.0001) scale = 1.0;
  const invScale = 1.0 / scale;

  for (let i = 0; i < 21; i++) {
    const pt = landmarks[i];
    let nx = (pt.x - wrist.x) * invScale;
    let ny = (pt.y - wrist.y) * invScale;
    let nz = ((pt.z || 0) - (wrist.z || 0)) * invScale;

    if (nx > 2.0) nx = 2.0; else if (nx < -2.0) nx = -2.0;
    if (ny > 2.0) ny = 2.0; else if (ny < -2.0) ny = -2.0;
    if (nz > 2.0) nz = 2.0; else if (nz < -2.0) nz = -2.0;

    const offset = i * 3;
    STATIC_VECTOR_63[offset] = nx;
    STATIC_VECTOR_63[offset + 1] = ny;
    STATIC_VECTOR_63[offset + 2] = nz;
  }

  return Array.from(STATIC_VECTOR_63);
}

/**
 * Computes continuous extension score for a 4-joint finger [0.0 = curled, 1.0 = extended]
 */
function computeExtension(
  raw: Landmark3D[],
  mcpIdx: number,
  pipIdx: number,
  dipIdx: number,
  tipIdx: number
): number {
  const wrist = raw[0];
  const mcp = raw[mcpIdx];
  const pip = raw[pipIdx];
  const dip = raw[dipIdx];
  const tip = raw[tipIdx];

  const pipAngle = angleBetweenPoints(mcp, pip, dip);
  const dipAngle = angleBetweenPoints(pip, dip, tip);
  const angleScore = Math.max(0, Math.min(1, ((pipAngle + dipAngle) / 2 - 90) / 75));

  const dTipWrist = distance3D(tip, wrist);
  const dPipWrist = distance3D(pip, wrist);
  const distScore = dPipWrist > 0.001 ? Math.max(0, Math.min(1, (dTipWrist / dPipWrist - 0.8) / 0.6)) : 0.5;

  return Math.min(1, Math.max(0, angleScore * 0.55 + distScore * 0.45));
}

/**
 * Computes thumb extension score [0.0 = curled, 1.0 = extended]
 */
function computeThumbExtension(raw: Landmark3D[], scale: number): number {
  const mcp = raw[2];
  const ip = raw[3];
  const tip = raw[4];
  const pinkyMcp = raw[17];
  const indexMcp = raw[5];

  const ipAngle = angleBetweenPoints(mcp, ip, tip);
  const angleScore = Math.max(0, Math.min(1, (ipAngle - 100) / 60));

  const dTipPinky = distance3D(tip, pinkyMcp);
  const dMcpPinky = distance3D(mcp, pinkyMcp);
  const reachScore = dMcpPinky > 0.001 ? Math.max(0, Math.min(1, (dTipPinky / dMcpPinky - 0.8) / 0.5)) : 0.5;

  const dTipIndex = distance3D(tip, indexMcp) / (scale || 1.0);
  const spreadScore = Math.max(0, Math.min(1, (dTipIndex - 0.3) / 0.6));

  return Math.min(1, Math.max(0, angleScore * 0.4 + reachScore * 0.35 + spreadScore * 0.25));
}

/**
 * Helper detecting finger extension states (Open, Closed, Pinching, etc.)
 */
export function getHandState(landmarks: Landmark3D[]): HandState {
  if (!landmarks || landmarks.length < 21) {
    return {
      isOpen: false,
      isClosed: false,
      isPinching: false,
      fingerCurls: {
        isThumbCurled: false,
        isIndexCurled: false,
        isMiddleCurled: false,
        isRingCurled: false,
        isPinkyCurled: false,
      },
      fingerExtensions: { thumb: 0, index: 0, middle: 0, ring: 0, pinky: 0 },
      angles: [0, 0, 0, 0, 0],
      detectedShape: 'UNKNOWN',
    };
  }

  const scale = distance3D(landmarks[0], landmarks[9]) || 1.0;
  const angles = calculateFingerAngles(landmarks);

  const thumbExt = computeThumbExtension(landmarks, scale);
  const indexExt = computeExtension(landmarks, 5, 6, 7, 8);
  const middleExt = computeExtension(landmarks, 9, 10, 11, 12);
  const ringExt = computeExtension(landmarks, 13, 14, 15, 16);
  const pinkyExt = computeExtension(landmarks, 17, 18, 19, 20);

  const fingerExtensions: FingerExtensionScores = {
    thumb: Number(thumbExt.toFixed(2)),
    index: Number(indexExt.toFixed(2)),
    middle: Number(middleExt.toFixed(2)),
    ring: Number(ringExt.toFixed(2)),
    pinky: Number(pinkyExt.toFixed(2)),
  };

  const fingerCurls: FingerCurlState = {
    isThumbCurled: thumbExt < 0.45,
    isIndexCurled: indexExt < 0.50,
    isMiddleCurled: middleExt < 0.50,
    isRingCurled: ringExt < 0.50,
    isPinkyCurled: pinkyExt < 0.50,
  };

  const fourExtAvg = (indexExt + middleExt + ringExt + pinkyExt) / 4;
  const fourCurledAvg = ((1 - indexExt) + (1 - middleExt) + (1 - ringExt) + (1 - pinkyExt)) / 4;

  const isOpen = fourExtAvg > 0.65;
  const isClosed = fourCurledAvg > 0.65;
  const thumbIndexDist = distance3D(landmarks[4], landmarks[8]) / scale;
  const isPinching = thumbIndexDist < 0.45;

  let detectedShape: RecognizedHandShape = 'UNKNOWN';
  if (isOpen) {
    detectedShape = 'OPEN_PALM';
  } else if (isClosed) {
    detectedShape = thumbExt > 0.65 ? 'THUMBS_UP' : 'FIST';
  } else if (isPinching && middleExt > 0.50 && ringExt > 0.45) {
    detectedShape = 'OK_SHAPE';
  } else if (indexExt > 0.65 && middleExt > 0.65 && ringExt > 0.55 && pinkyExt < 0.45) {
    detectedShape = 'W_SHAPE';
  } else if (indexExt > 0.65 && middleExt > 0.65 && ringExt < 0.45 && pinkyExt < 0.45) {
    detectedShape = 'PEACE_2';
  } else if (indexExt > 0.65 && middleExt < 0.45 && ringExt < 0.45 && pinkyExt < 0.45) {
    detectedShape = 'POINT_1';
  } else if (thumbExt > 0.60 && pinkyExt > 0.60 && middleExt < 0.45 && ringExt < 0.45) {
    detectedShape = 'Y_SHAPE';
  } else if (isPinching) {
    detectedShape = 'PINCH_FOOD';
  } else if (thumbIndexDist > 0.35 && thumbIndexDist < 1.3) {
    detectedShape = 'C_SHAPE';
  }

  return {
    isOpen,
    isClosed,
    isPinching,
    fingerCurls,
    fingerExtensions,
    angles,
    detectedShape,
  };
}

/**
 * Rich Feature Extraction combining 63D vector, hand state, and orientation
 */
export function extractHandFeatures(landmarks: Landmark3D[]): NormalizedHandFeatures {
  const vector63 = normalizeHandLandmarks(landmarks);
  const handState = getHandState(landmarks);
  const scale = distance3D(landmarks[0] || { x: 0, y: 0, z: 0 }, landmarks[9] || { x: 0, y: 0, z: 0 }) || 1.0;

  const wrist = landmarks[0] || { x: 0, y: 0, z: 0 };
  const middleMCP = landmarks[9] || { x: 0, y: 0, z: 0 };

  const fingerDistances = landmarks.length >= 21 ? {
    thumbToIndex: distance3D(landmarks[4], landmarks[8]) / scale,
    thumbToMiddle: distance3D(landmarks[4], landmarks[12]) / scale,
    indexToMiddle: distance3D(landmarks[8], landmarks[12]) / scale,
    thumbToPinky: distance3D(landmarks[4], landmarks[20]) / scale,
    indexTipToWrist: distance3D(landmarks[8], landmarks[0]) / scale,
  } : { thumbToIndex: 0, thumbToMiddle: 0, indexToMiddle: 0, thumbToPinky: 0, indexTipToWrist: 0 };

  const v1 = landmarks.length >= 21 ? {
    x: landmarks[5].x - wrist.x,
    y: landmarks[5].y - wrist.y,
    z: (landmarks[5].z || 0) - (wrist.z || 0),
  } : { x: 0, y: 0, z: 0 };

  const v2 = landmarks.length >= 21 ? {
    x: landmarks[17].x - wrist.x,
    y: landmarks[17].y - wrist.y,
    z: (landmarks[17].z || 0) - (wrist.z || 0),
  } : { x: 0, y: 0, z: 0 };

  const normalZ = v1.x * v2.y - v1.y * v2.x;
  let palmFacing: HandOrientation['palmFacing'] = 'camera';
  if (normalZ > 0.003) {
    palmFacing = 'camera';
  } else if (normalZ < -0.003) {
    palmFacing = 'user';
  } else if (Math.abs(v1.y) > Math.abs(v1.x)) {
    palmFacing = v1.y < 0 ? 'up' : 'down';
  } else {
    palmFacing = v1.x < 0 ? 'left' : 'right';
  }

  const pitch = (middleMCP.y - wrist.y) / scale;
  const yaw = (middleMCP.x - wrist.x) / scale;
  const roll = normalZ / scale;

  return {
    vector63,
    wristDistance: scale,
    fingerCurls: handState.fingerCurls,
    fingerExtensions: handState.fingerExtensions,
    detectedShape: handState.detectedShape,
    shapeConfidence: 0.85,
    fingerDistances,
    orientation: { pitch, yaw, roll, palmFacing },
    rawLandmarks: landmarks,
  };
}

export function normalizePoseLandmarks(poseLandmarks: PoseLandmarks) {
  if (!poseLandmarks || poseLandmarks.length < 33) return undefined;

  const leftShoulder = poseLandmarks[11];
  const rightShoulder = poseLandmarks[12];
  const leftElbow = poseLandmarks[13];
  const rightElbow = poseLandmarks[14];
  const leftWrist = poseLandmarks[15];
  const rightWrist = poseLandmarks[16];
  const nose = poseLandmarks[0];

  const shoulderSpan = distance3D(leftShoulder, rightShoulder) || 1.0;

  return {
    nose,
    leftShoulder,
    rightShoulder,
    leftElbow,
    rightElbow,
    leftWrist,
    rightWrist,
    shoulderSpan,
  };
}
