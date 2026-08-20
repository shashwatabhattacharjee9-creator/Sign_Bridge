import {
  HandLandmarks,
  HandState,
  Landmark3D,
  NormalizedHandFeatures,
  PoseFeatures,
  PoseLandmarks,
  RecognizedHandShape,
  FingerCurlState,
  FingerExtensionScores,
  HandOrientation,
  TwoHandRelativeFeatures,
} from '@/types/isl';

// Static Zero-Allocation Typed Memory Pools for 60 FPS sub-millisecond execution
const STATIC_VECTOR_63 = new Float32Array(63);
const STATIC_VECTOR_126 = new Float32Array(126);
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
 * Orthonormal 3D Feature Normalizer (Viewpoint & Scale Invariant Canonical Frame)
 *
 * 1. Palm Coordinate Frame Construction:
 *    - Origin O = Wrist (Landmark 0)
 *    - Vector V1 = Index MCP (5) - O
 *    - Vector V2 = Pinky MCP (17) - O
 *    - Palm Normal N = (V1 x V2) / ||V1 x V2|| (Z-axis)
 *    - In-plane Transverse U = V1 / ||V1|| (Y-axis)
 *    - Orthogonal Transverse W = N x U (X-axis)
 *    - Rotation Matrix R = [W, U, N]^T
 *
 * 2. Transformation & Scale Invariance:
 *    - Rotate all 21 points: P'_i = R * (P_i - O)
 *    - Normalize magnitude using palm length ||V1||
 *    - Output: Deterministic 63-element feature vector.
 */
export function normalizeHandLandmarksOrthonormal(landmarks: Landmark3D[]): number[] {
  if (!landmarks || landmarks.length < 21) {
    STATIC_VECTOR_63.fill(0);
    return Array.from(STATIC_VECTOR_63);
  }

  const o = landmarks[0]; // Wrist origin
  const idxMCP = landmarks[5]; // Index MCP
  const pkyMCP = landmarks[17]; // Pinky MCP

  // V1 = Index MCP - Origin
  const v1x = idxMCP.x - o.x;
  const v1y = idxMCP.y - o.y;
  const v1z = (idxMCP.z || 0) - (o.z || 0);
  const palmLength = Math.sqrt(v1x * v1x + v1y * v1y + v1z * v1z) || 1e-4;

  // In-plane Y-axis: U = V1 / ||V1||
  const ux = v1x / palmLength;
  const uy = v1y / palmLength;
  const uz = v1z / palmLength;

  // V2 = Pinky MCP - Origin
  const v2x = pkyMCP.x - o.x;
  const v2y = pkyMCP.y - o.y;
  const v2z = (pkyMCP.z || 0) - (o.z || 0);

  // Cross Product: C = V1 x V2
  const cx = v1y * v2z - v1z * v2y;
  const cy = v1z * v2x - v1x * v2z;
  const cz = v1x * v2y - v1y * v2x;
  const cNorm = Math.sqrt(cx * cx + cy * cy + cz * cz) || 1e-4;

  // Palm Normal Z-axis: N = C / ||C||
  const nz = cz / cNorm;
  const ny = cy / cNorm;
  const nx = cx / cNorm;

  // Orthogonal X-axis: W = N x U
  const wx = ny * uz - nz * uy;
  const wy = nz * ux - nx * uz;
  const wz = nx * uy - ny * ux;

  // Scale factor: 1.0 / palmLength
  const invScale = 1.0 / palmLength;

  // Transform all 21 points into canonical orthonormal frame
  for (let i = 0; i < 21; i++) {
    const pt = landmarks[i];
    const dx = pt.x - o.x;
    const dy = pt.y - o.y;
    const dz = (pt.z || 0) - (o.z || 0);

    // Matrix multiplication: P' = R * d
    // Row 0 = W (X-axis)
    // Row 1 = U (Y-axis)
    // Row 2 = N (Z-axis)
    let px = (wx * dx + wy * dy + wz * dz) * invScale;
    let py = (ux * dx + uy * dy + uz * dz) * invScale;
    let pz = (nx * dx + ny * dy + nz * dz) * invScale;

    // Numerical clipping to reject outlier sensor noise
    if (px > 4.0) px = 4.0; else if (px < -4.0) px = -4.0;
    if (py > 4.0) py = 4.0; else if (py < -4.0) py = -4.0;
    if (pz > 4.0) pz = 4.0; else if (pz < -4.0) pz = -4.0;

    const offset = i * 3;
    STATIC_VECTOR_63[offset] = px;
    STATIC_VECTOR_63[offset + 1] = py;
    STATIC_VECTOR_63[offset + 2] = pz;
  }

  return Array.from(STATIC_VECTOR_63);
}

// Alias for standard call
export const normalizeHandLandmarks = normalizeHandLandmarksOrthonormal;

/**
 * Computes two-hand relative spatial anchoring
 */
export function computeTwoHandRelative(
  leftHandLandmarks?: Landmark3D[],
  rightHandLandmarks?: Landmark3D[],
  poseFeatures?: PoseFeatures
): TwoHandRelativeFeatures | undefined {
  if (!leftHandLandmarks || !rightHandLandmarks || leftHandLandmarks.length < 1 || rightHandLandmarks.length < 1) {
    return undefined;
  }

  const lw = leftHandLandmarks[0];
  const rw = rightHandLandmarks[0];

  const dx = rw.x - lw.x;
  const dy = rw.y - lw.y;
  const dz = (rw.z || 0) - (lw.z || 0);

  const rawDist = Math.sqrt(dx * dx + dy * dy + dz * dz);
  const shoulderSpan = poseFeatures?.shoulderSpan || 1.0;
  const normalizedDistance = rawDist / shoulderSpan;

  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  return {
    relativeDistance: Number(normalizedDistance.toFixed(3)),
    relativeVector: [
      Number((dx / shoulderSpan).toFixed(3)),
      Number((dy / shoulderSpan).toFixed(3)),
      Number((dz / shoulderSpan).toFixed(3)),
    ],
    leftToRightAngle: Number(angle.toFixed(1)),
    normalizedByShoulder: !!poseFeatures,
  };
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
 * Rich Feature Extraction combining Orthonormal 63D vector, hand state, and orientation
 */
export function extractHandFeatures(landmarks: Landmark3D[]): NormalizedHandFeatures {
  const vector63 = normalizeHandLandmarksOrthonormal(landmarks);
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

export function normalizePoseLandmarks(poseLandmarks: PoseLandmarks): PoseFeatures | undefined {
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
