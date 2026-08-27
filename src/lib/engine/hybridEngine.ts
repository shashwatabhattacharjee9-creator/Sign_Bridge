/**
 * FILE: HybridEngineManager
 * Wraps ScenarioEngineManager for multi-scenario gesture sentence assembly.
 */

import { scenarioEngineManager } from './scenarioSentenceEngine';
import { identifyHandShape, Landmark } from './handShapeClassifier';
import { navigationStateManager } from './navigationState';

export interface GestureDispatchResult {
  text: string;
  confidence: number;
  mode: 'SCENARIO_ISL';
}

export class HybridEngineManager {
  public handleStableGesture(landmarks: Landmark[]): GestureDispatchResult | null {
    if (navigationStateManager.getActiveMode() !== 'studio') {
      return null;
    }

    if (!landmarks || landmarks.length < 21) return null;

    const { shape } = identifyHandShape(landmarks);
    if (shape === 'UNKNOWN') return null;

    const res = scenarioEngineManager.ingestGesture(shape);
    if (res.token) {
      return {
        text: res.token,
        confidence: 0.96,
        mode: 'SCENARIO_ISL',
      };
    }

    return null;
  }

  public peekNextWord(): string {
    const liveTokens = scenarioEngineManager.getLiveTokens();
    if (liveTokens.length > 0) {
      return liveTokens[liveTokens.length - 1];
    }
    return 'Ready for Gesture';
  }

  public getTranscript(): string[] {
    return scenarioEngineManager.getTranscripts();
  }

  public reset(): void {
    scenarioEngineManager.reset();
  }

  public resetStudio(): void {
    scenarioEngineManager.reset();
  }

  public resetToBeginning(): void {
    scenarioEngineManager.reset();
  }

  public resetToStart(): void {
    scenarioEngineManager.reset();
  }
}

export const hybridEngineManager = new HybridEngineManager();
export const dynamicStreamManager = hybridEngineManager;
export const wordStreamManager = hybridEngineManager;
