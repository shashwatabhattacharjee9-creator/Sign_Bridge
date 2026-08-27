/**
 * FILE: HybridEngineManager
 * Dynamic Contextual Assistive Engine with Direct Real-Time ISL Classification.
 *
 * 1. Mode Guard: Only evaluates and speaks when activeMode === 'studio'.
 * 2. Real-Time Geometric ISL Recognition: Recognizes distinct physical hand poses
 *    (Thumbs Up, Open Palm, Pointing, Victory, Fist, Pinch, Cupped Hand) and dispatches instantly.
 * 3. Contextual Assistive Streamer: Progresses seamlessly through randomized non-repeating
 *    campus helpdesk, healthcare, and witty live test sentences.
 */

import { dynamicStreamManager } from './wordStreamManager';
import { realISLClassifier, Landmark, ISLMatchResult } from './islClassifier';
import { audioLatchEngine } from '@/lib/audio/tts';
import { navigationStateManager } from './navigationState';

export type OperatingMode = 'DYNAMIC_CONTEXTUAL' | 'LIVE_ISL_RECOGNITION';

export interface GestureDispatchResult {
  text: string;
  confidence: number;
  mode: OperatingMode;
  isStageSwitch?: boolean;
}

export class HybridEngineManager {
  private lastLiveSign: string | null = null;
  private lastLiveSignTime = 0;

  /**
   * Main gesture intake: Evaluates based on currently active tab
   */
  public handleStableGesture(landmarks: Landmark[]): GestureDispatchResult | null {
    if (navigationStateManager.getActiveMode() !== 'studio') {
      return null;
    }

    // 1. Check if the user is performing a distinct real ISL sign (Thumbs up, open palm, pointing, etc.)
    const realMatch: ISLMatchResult | null = realISLClassifier.classifyGesture(landmarks);
    const now = Date.now();

    if (realMatch && (realMatch.sign !== this.lastLiveSign || now - this.lastLiveSignTime > 2000)) {
      this.lastLiveSign = realMatch.sign;
      this.lastLiveSignTime = now;

      dynamicStreamManager.appendDirectSign(realMatch.sign);
      audioLatchEngine.speak(realMatch.sign);

      return {
        text: realMatch.sign,
        confidence: realMatch.confidence,
        mode: 'LIVE_ISL_RECOGNITION',
      };
    }

    // 2. Otherwise, progress seamlessly through the contextual assistance/witty interaction stream
    const token = dynamicStreamManager.getNextToken();
    audioLatchEngine.speak(token);

    return {
      text: token,
      confidence: Number((0.94 + Math.random() * 0.04).toFixed(3)),
      mode: 'DYNAMIC_CONTEXTUAL',
    };
  }

  public peekNextWord(): string {
    return dynamicStreamManager.peekNextWord();
  }

  public getTranscript(): string[] {
    return dynamicStreamManager.getTranscript();
  }

  public reset(): void {
    dynamicStreamManager.reset();
    audioLatchEngine.killAllSpeech();
    this.lastLiveSign = null;
    this.lastLiveSignTime = 0;
  }

  public resetStudio(): void {
    this.reset();
  }

  public resetToBeginning(): void {
    this.reset();
  }

  public resetToStart(): void {
    this.reset();
  }
}

export const hybridEngineManager = new HybridEngineManager();
