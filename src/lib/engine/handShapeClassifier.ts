/**
 * FILE: Physical Hand Shape Classifier
 * Deterministic geometric classifier evaluating real-time MediaPipe landmark coordinates
 * against 6 intuitive hand shapes: OPEN_PALM, INDEX_POINT, PEACE_V, THUMBS_UP, CLOSED_FIST, OK_PINCH.
 */

export interface Landmark {
  x: number;
  y: number;
  z: number;
}

export type HandShape =
  | 'OPEN_PALM'
  | 'INDEX_POINT'
  | 'PEACE_V'
  | 'THUMBS_UP'
  | 'CLOSED_FIST'
  | 'OK_PINCH'
  | 'UNKNOWN';

export interface HandShapeResult {
  shape: HandShape;
  confidence: number;
  label: string;
}

export function identifyHandShape(landmarks: Landmark[]): HandShapeResult {
  if (!landmarks || landmarks.length < 21) {
    return { shape: 'UNKNOWN', confidence: 0, label: 'No Hand' };
  }

  const wrist = landmarks[0];
  const thumbTip = landmarks[4];
  const thumbIp = landmarks[3];
  const thumbMcp = landmarks[2];
  const indexTip = landmarks[8];
  const indexPip = landmarks[6];
  const indexMcp = landmarks[5];
  const middleTip = landmarks[12];
  const middlePip = landmarks[10];
  const middleMcp = landmarks[9];
  const ringTip = landmarks[16];
  const ringPip = landmarks[14];
  const ringMcp = landmarks[13];
  const pinkyTip = landmarks[20];
  const pinkyPip = landmarks[18];
  const pinkyMcp = landmarks[17];

  // Helper: Finger extension states
  const isExtended = (tip: Landmark, pip: Landmark) => tip.y < pip.y;
  const isCurled = (tip: Landmark, pip: Landmark) => tip.y > pip.y;

  const indexExt = isExtended(indexTip, indexPip);
  const middleExt = isExtended(middleTip, middlePip);
  const ringExt = isExtended(ringTip, ringPip);
  const pinkyExt = isExtended(pinkyTip, pinkyPip);

  // Thumb extended if thumbTip is elevated and outwards from wrist/MCP
  const thumbExt =
    (Math.abs(thumbTip.x - wrist.x) > 0.10 || thumbTip.y < thumbMcp.y) &&
    thumbTip.y < thumbIp.y;

  const dist = (p1: Landmark, p2: Landmark) =>
    Math.hypot(p1.x - p2.x, p1.y - p2.y);

  // 1. THUMBS UP (Thumb extended up, all 4 fingers curled)
  if (
    thumbExt &&
    thumbTip.y < indexMcp.y &&
    isCurled(indexTip, indexMcp) &&
    isCurled(middleTip, middleMcp) &&
    isCurled(ringTip, ringPip) &&
    isCurled(pinkyTip, pinkyPip)
  ) {
    return { shape: 'THUMBS_UP', confidence: 0.96, label: 'Thumbs Up' };
  }

  // 2. PEACE / V-SIGN (Index and Middle extended, Ring and Pinky curled)
  if (
    indexExt &&
    middleExt &&
    isCurled(ringTip, ringPip) &&
    isCurled(pinkyTip, pinkyPip)
  ) {
    return { shape: 'PEACE_V', confidence: 0.95, label: 'Peace / V-Sign' };
  }

  // 3. INDEX POINT (Only Index extended, others curled)
  if (
    indexExt &&
    isCurled(middleTip, middlePip) &&
    isCurled(ringTip, ringPip) &&
    isCurled(pinkyTip, pinkyPip)
  ) {
    return { shape: 'INDEX_POINT', confidence: 0.94, label: 'Index Point' };
  }

  // 4. OK / PINCH SIGN (Thumb tip close to Index tip, Middle & Ring extended)
  if (dist(thumbTip, indexTip) < 0.08 && middleExt && ringExt) {
    return { shape: 'OK_PINCH', confidence: 0.92, label: 'OK / Pinch' };
  }

  // 5. OPEN PALM (All 4 fingers extended)
  if (indexExt && middleExt && ringExt && pinkyExt) {
    return { shape: 'OPEN_PALM', confidence: 0.97, label: 'Open Palm' };
  }

  // 6. CLOSED FIST (All 4 fingers curled)
  if (
    isCurled(indexTip, indexMcp) &&
    isCurled(middleTip, middleMcp) &&
    isCurled(ringTip, ringPip) &&
    isCurled(pinkyTip, pinkyPip)
  ) {
    return { shape: 'CLOSED_FIST', confidence: 0.93, label: 'Closed Fist' };
  }

  return { shape: 'UNKNOWN', confidence: 0.4, label: 'Unknown Motion' };
}
