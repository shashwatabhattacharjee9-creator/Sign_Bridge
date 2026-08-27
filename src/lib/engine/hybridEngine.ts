/**
 * FILE: HybridEngineManager
 * Direct bridge connecting mathematical ISL gesture engine and state machine.
 */

import { normalizeHandLandmarks, Point3D } from './spatialNormalizer';
import { extractFeatureProfile } from './featureExtractor';
import { classifyISLGesture, RecognizedToken } from './islRuleEngine';
import { gestureStateMachine, IngestResult } from './gestureStateMachine';
import { Landmark } from './islClassifier';
import { navigationStateManager } from './navigationState';

export interface GestureDispatchResult {
  text: string;
  confidence: number;
  mode: 'GEOMETRIC_ISL';
}

export class HybridEngineManager {
  /**
   * Main gesture intake: Evaluates geometric normalization and rule classifier
   */
  public handleStableGesture(landmarks: Landmark[]): GestureDispatchResult | null {
    if (navigationStateManager.getActiveMode() !== 'studio') {
      return null;
    }

    if (!landmarks || landmarks.length < 21) return null;

    const points3D: Point3D[] = landmarks.map((lm) => ({
      x: lm.x,
      y: lm.y,
      z: lm.z || 0,
    }));

    const norm = normalizeHandLandmarks(points3D);
    if (!norm) return null;

    const rawWristY = landmarks[0].y;
    const feat = extractFeatureProfile(norm, rawWristY);
    const candidate: RecognizedToken | null = classifyISLGesture(feat, norm);

    const res: IngestResult = gestureStateMachine.ingestFrame(candidate);

    if (res.firedToken) {
      return {
        text: res.firedToken,
        confidence: res.confidence || 0.95,
        mode: 'GEOMETRIC_ISL',
      };
    }

    return null;
  }

  public evaluateDirect(landmarks: Point3D[]): IngestResult {
    if (navigationStateManager.getActiveMode() !== 'studio') {
      return { firedToken: null, candidateToken: null, progress: 0, confidence: 0 };
    }

    const norm = normalizeHandLandmarks(landmarks);
    if (!norm) {
      return gestureStateMachine.ingestFrame(null);
    }

    const rawWristY = landmarks[0]?.y ?? 0.7;
    const feat = extractFeatureProfile(norm, rawWristY);
    const candidate = classifyISLGesture(feat, norm);
    return gestureStateMachine.ingestFrame(candidate);
  }

  public peekNextWord(): string {
    return 'Ready for Gesture';
  }

  public getTranscript(): string[] {
    return gestureStateMachine.getTranscript();
  }

  public reset(): void {
    gestureStateMachine.clear();
  }

  public resetStudio(): void {
    gestureStateMachine.clear();
  }

  public resetToBeginning(): void {
    gestureStateMachine.clear();
  }

  public resetToStart(): void {
    gestureStateMachine.clear();
  }
}

export const hybridEngineManager = new HybridEngineManager();
export const dynamicStreamManager = hybridEngineManager;
export const wordStreamManager = hybridEngineManager;
