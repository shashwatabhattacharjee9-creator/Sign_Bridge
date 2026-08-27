/**
 * FILE: Deterministic ISL Rule Engine
 * Mathematical and geometric heuristic classifier evaluating physical ISL sign topologies.
 */

import { HandFeatureProfile } from './featureExtractor';
import { NormalizedHand } from './spatialNormalizer';

export interface RecognizedToken {
  sign: string;
  category: 'HELP' | 'HEALTH' | 'CAMPUS' | 'COMMON' | 'ALPHABET';
  confidence: number;
}

export function classifyISLGesture(
  feat: HandFeatureProfile,
  norm: NormalizedHand
): RecognizedToken | null {
  const {
    thumb,
    index,
    middle,
    ring,
    pinky,
    thumbIndexDistance,
    indexMiddleDistance,
    wristHeightRelative,
  } = feat;

  // 1. SIGN: "HELLO" (All fingers extended, palm elevated near upper frame/head)
  if (
    index.isExtended &&
    middle.isExtended &&
    ring.isExtended &&
    pinky.isExtended &&
    thumb.isExtended
  ) {
    if (wristHeightRelative < 0.45) {
      return { sign: 'HELLO', category: 'COMMON', confidence: 0.96 };
    }
    return { sign: 'OPEN PALM / STOP', category: 'COMMON', confidence: 0.94 };
  }

  // 2. SIGN: "THANK YOU" (Flat hand moving forward from chest/chin height)
  if (index.isExtended && middle.isExtended && ring.isExtended && pinky.isExtended) {
    if (wristHeightRelative >= 0.45 && wristHeightRelative <= 0.7) {
      return { sign: 'THANK YOU', category: 'COMMON', confidence: 0.95 };
    }
  }

  // 3. SIGN: "YES / AGREE" (Thumbs up: Thumb extended upwards, all four fingers curled)
  if (
    thumb.isExtended &&
    index.isCurled &&
    middle.isCurled &&
    ring.isCurled &&
    pinky.isCurled
  ) {
    if (norm.canonicalPoints[4].y < norm.canonicalPoints[2].y) {
      return { sign: 'YES / AGREE', category: 'COMMON', confidence: 0.97 };
    }
  }

  // 4. SIGN: "NO" / "DISAGREE" (Thumb, index, and middle tap together, ring/pinky curled)
  if (
    thumbIndexDistance < 0.25 &&
    index.isExtended &&
    middle.isExtended &&
    ring.isCurled &&
    pinky.isCurled
  ) {
    return { sign: 'NO', category: 'COMMON', confidence: 0.93 };
  }

  // 5. SIGN: "HELP / ASSISTANCE" (Closed fist held at chest level)
  if (
    thumb.isCurled &&
    index.isCurled &&
    middle.isCurled &&
    ring.isCurled &&
    pinky.isCurled
  ) {
    return { sign: 'HELP / ASSISTANCE', category: 'HELP', confidence: 0.95 };
  }

  // 6. SIGN: "WHERE / QUERY" (Only index finger pointing straight up)
  if (
    index.isExtended &&
    middle.isCurled &&
    ring.isCurled &&
    pinky.isCurled &&
    !thumb.isExtended
  ) {
    return { sign: 'WHERE / QUERY', category: 'CAMPUS', confidence: 0.94 };
  }

  // 7. SIGN: "WATER" (W-Shape: Index, Middle, Ring extended; Pinky curled)
  if (index.isExtended && middle.isExtended && ring.isExtended && pinky.isCurled) {
    return { sign: 'WATER', category: 'HEALTH', confidence: 0.92 };
  }

  // 8. SIGN: "DOCTOR / MEDICAL" (Letter 'D': Index points up, thumb and other fingers form circle)
  if (
    index.isExtended &&
    thumbIndexDistance < 0.35 &&
    middle.isCurled &&
    ring.isCurled &&
    pinky.isCurled
  ) {
    return { sign: 'DOCTOR / MEDICAL', category: 'HEALTH', confidence: 0.91 };
  }

  // 9. SIGN: "TWO / VERIFY" (V-Shape: Index and Middle extended and spread apart)
  if (
    index.isExtended &&
    middle.isExtended &&
    ring.isCurled &&
    pinky.isCurled &&
    indexMiddleDistance > 0.3
  ) {
    return { sign: 'TWO / VERIFY', category: 'COMMON', confidence: 0.95 };
  }

  // 10. SIGN: "ACCESSIBLE" (I Love You sign: Thumb, Index, Pinky extended; Middle and Ring curled)
  if (
    thumb.isExtended &&
    index.isExtended &&
    pinky.isExtended &&
    middle.isCurled &&
    ring.isCurled
  ) {
    return { sign: 'ACCESSIBLE', category: 'COMMON', confidence: 0.96 };
  }

  return null;
}
