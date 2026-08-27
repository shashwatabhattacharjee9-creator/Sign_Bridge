/**
 * FILE: GestureStateMachine
 * Temporal Hysteresis & Atomic Speech Synthesizer.
 * Enforces a 280ms physical hold requirement and a 1400ms debounce cooldown.
 */

import { RecognizedToken } from './islRuleEngine';
import { audioLatchEngine } from '@/lib/audio/tts';
import { navigationStateManager } from './navigationState';

export interface IngestResult {
  firedToken: string | null;
  candidateToken: string | null;
  progress: number;
  confidence: number;
}

export class GestureStateMachine {
  private activeCandidate: string | null = null;
  private activeCandidateConfidence = 0;
  private candidateStartTime = 0;
  private lastFiredToken: string | null = null;
  private lastFiredTime = 0;
  private readonly STABILITY_THRESHOLD_MS = 280; // Must sustain pose for 280ms
  private readonly DEBOUNCE_COOLDOWN_MS = 1400; // Do not re-trigger same sign for 1.4s

  private tokenHistory: string[] = [];

  public ingestFrame(candidate: RecognizedToken | null, now = Date.now()): IngestResult {
    // If navigating in Practice or Calibrate, do not fire studio tokens
    if (navigationStateManager.getActiveMode() !== 'studio') {
      return { firedToken: null, candidateToken: null, progress: 0, confidence: 0 };
    }

    if (!candidate) {
      this.activeCandidate = null;
      this.activeCandidateConfidence = 0;
      this.candidateStartTime = 0;
      return { firedToken: null, candidateToken: null, progress: 0, confidence: 0 };
    }

    if (candidate.sign !== this.activeCandidate) {
      this.activeCandidate = candidate.sign;
      this.activeCandidateConfidence = candidate.confidence;
      this.candidateStartTime = now;
      return {
        firedToken: null,
        candidateToken: candidate.sign,
        progress: 0.1,
        confidence: candidate.confidence,
      };
    }

    const elapsed = now - this.candidateStartTime;
    const progress = Math.min(1.0, elapsed / this.STABILITY_THRESHOLD_MS);

    if (progress >= 1.0) {
      // Check debounce constraints
      if (
        candidate.sign === this.lastFiredToken &&
        now - this.lastFiredTime < this.DEBOUNCE_COOLDOWN_MS
      ) {
        return {
          firedToken: null,
          candidateToken: candidate.sign,
          progress: 1.0,
          confidence: candidate.confidence,
        };
      }

      this.lastFiredToken = candidate.sign;
      this.lastFiredTime = now;
      this.tokenHistory.push(candidate.sign);

      // Trigger immediate offline speech synthesis and chime
      audioLatchEngine.playCommitTone();
      audioLatchEngine.speak(candidate.sign);

      return {
        firedToken: candidate.sign,
        candidateToken: candidate.sign,
        progress: 1.0,
        confidence: candidate.confidence,
      };
    }

    return {
      firedToken: null,
      candidateToken: candidate.sign,
      progress,
      confidence: candidate.confidence,
    };
  }

  public getTranscript(): string[] {
    return this.tokenHistory;
  }

  public clear(): void {
    this.activeCandidate = null;
    this.activeCandidateConfidence = 0;
    this.candidateStartTime = 0;
    this.lastFiredToken = null;
    this.lastFiredTime = 0;
    this.tokenHistory = [];
    audioLatchEngine.killAllSpeech();
  }

  public reset(): void {
    this.clear();
  }

  public resetStudio(): void {
    this.clear();
  }

  public resetToBeginning(): void {
    this.clear();
  }
}

export const gestureStateMachine = new GestureStateMachine();
