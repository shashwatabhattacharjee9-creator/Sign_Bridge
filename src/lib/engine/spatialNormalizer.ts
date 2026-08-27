/**
 * FILE: Mathematical Spatial Normalizer & Orthonormal Mapping
 * Transforms 21 raw MediaPipe landmarks into a scale- and rotation-invariant reference frame.
 * Origin (0,0,0) is centered at Landmark 0 (Wrist).
 */

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface NormalizedHand {
  canonicalPoints: Point3D[];
  palmNormal: Point3D;
  palmFacing: 'CAMERA' | 'AWAY' | 'LEFT' | 'RIGHT' | 'UP' | 'DOWN';
  scaleFactor: number;
}

/**
 * Transforms 21 raw landmarks into a scale- and rotation-invariant reference frame.
 * Origin (0,0,0) is centered at Landmark 0 (Wrist).
 */
export function normalizeHandLandmarks(rawPoints: Point3D[]): NormalizedHand | null {
  if (!rawPoints || rawPoints.length < 21) return null;

  const wrist = rawPoints[0];

  // 1. Translation: Shift origin to Wrist (0,0,0)
  const translated = rawPoints.map((p) => ({
    x: p.x - wrist.x,
    y: p.y - wrist.y,
    z: (p.z || 0) - (wrist.z || 0),
  }));

  // 2. Scale Invariance: Compute palm baseline (Wrist to Middle MCP distance - landmark 9)
  const scale = Math.hypot(translated[9].x, translated[9].y, translated[9].z) || 1.0;
  const scaled = translated.map((p) => ({
    x: p.x / scale,
    y: p.y / scale,
    z: p.z / scale,
  }));

  // 3. Compute Palm Normal Vector via Cross Product: (IndexMCP - Wrist) x (PinkyMCP - Wrist)
  const v1 = scaled[5];  // Index MCP
  const v2 = scaled[17]; // Pinky MCP
  const normal: Point3D = {
    x: v1.y * v2.z - v1.z * v2.y,
    y: v1.z * v2.x - v1.x * v2.z,
    z: v1.x * v2.y - v1.y * v2.x,
  };
  const normMag = Math.hypot(normal.x, normal.y, normal.z) || 1.0;
  const unitNormal: Point3D = {
    x: normal.x / normMag,
    y: normal.y / normMag,
    z: normal.z / normMag,
  };

  let facing: NormalizedHand['palmFacing'] = 'CAMERA';
  if (unitNormal.z > 0.4) facing = 'CAMERA';
  else if (unitNormal.z < -0.4) facing = 'AWAY';
  else if (unitNormal.x > 0.4) facing = 'RIGHT';
  else if (unitNormal.x < -0.4) facing = 'LEFT';
  else if (unitNormal.y > 0.4) facing = 'DOWN';
  else facing = 'UP';

  return {
    canonicalPoints: scaled,
    palmNormal: unitNormal,
    palmFacing: facing,
    scaleFactor: scale,
  };
}
