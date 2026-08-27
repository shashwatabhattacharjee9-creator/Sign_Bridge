/**
 * FILE: Topological Feature Extractor
 * Computes 3D joint flexion angles, extension states, and inter-finger distance metrics
 * from canonically normalized coordinates.
 */

import { Point3D, NormalizedHand } from './spatialNormalizer';

export interface FingerState {
  isExtended: boolean;
  isCurled: boolean;
  flexionAngle: number; // in degrees
}

export interface HandFeatureProfile {
  thumb: FingerState;
  index: FingerState;
  middle: FingerState;
  ring: FingerState;
  pinky: FingerState;
  thumbIndexDistance: number;
  thumbPinkyDistance: number;
  indexMiddleDistance: number;
  wristHeightRelative: number; // vertical positioning in viewport (0.0 = top, 1.0 = bottom)
}

function calculateAngle(a: Point3D, b: Point3D, c: Point3D): number {
  const ab = { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
  const cb = { x: c.x - b.x, y: c.y - b.y, z: c.z - b.z };
  const dot = ab.x * cb.x + ab.y * cb.y + ab.z * cb.z;
  const magAB = Math.hypot(ab.x, ab.y, ab.z);
  const magCB = Math.hypot(cb.x, cb.y, cb.z);
  if (magAB * magCB === 0) return 0;
  const cosine = Math.max(-1, Math.min(1, dot / (magAB * magCB)));
  return (Math.acos(cosine) * 180) / Math.PI;
}

export function extractFeatureProfile(norm: NormalizedHand, rawWristY: number): HandFeatureProfile {
  const p = norm.canonicalPoints;

  const getFinger = (tip: number, pip: number, mcp: number): FingerState => {
    const angle = calculateAngle(p[tip], p[pip], p[mcp]);
    // A straight extended finger has an angle > 140 deg; tightly curled has an angle < 100 deg
    return {
      isExtended: angle > 140 && p[tip].y < p[mcp].y,
      isCurled: angle < 100 || p[tip].y > p[pip].y,
      flexionAngle: angle,
    };
  };

  const dist = (i: number, j: number) =>
    Math.hypot(p[i].x - p[j].x, p[i].y - p[j].y, p[i].z - p[j].z);

  return {
    thumb: {
      isExtended: dist(4, 9) > 0.8,
      isCurled: dist(4, 9) < 0.4,
      flexionAngle: calculateAngle(p[4], p[3], p[2]),
    },
    index: getFinger(8, 6, 5),
    middle: getFinger(12, 10, 9),
    ring: getFinger(16, 14, 13),
    pinky: getFinger(20, 18, 17),
    thumbIndexDistance: dist(4, 8),
    thumbPinkyDistance: dist(4, 20),
    indexMiddleDistance: dist(8, 12),
    wristHeightRelative: rawWristY,
  };
}
