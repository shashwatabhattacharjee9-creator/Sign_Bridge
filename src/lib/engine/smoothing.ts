import { ClassificationResult, ISLSign } from '@/types/isl';

export interface StabilizerOptions {
  windowSize?: number;          // Default 10 predictions
  majorityThreshold?: number;   // Default 0.70 (70%)
  confidenceGate?: number;      // Default 0.80
  cooldownMs?: number;          // Default 1200ms (1.2s)
}

/**
 * FILE 5: GestureStabilizer
 * Implements temporal hysteresis, sliding-window majority voting, and 1.2s cooldown debouncing.
 */
export class GestureStabilizer {
  private windowSize: number;
  private majorityThreshold: number;
  private confidenceGate: number;
  private cooldownMs: number;

  private window: ClassificationResult[];
  private lastCommittedSign: ISLSign | 'IDLE' = 'IDLE';
  private lastCommittedTimestamp: number = 0;
  private isNeutral: boolean = true;

  constructor(options: StabilizerOptions = {}) {
    this.windowSize = options.windowSize ?? 10;
    this.majorityThreshold = options.majorityThreshold ?? 0.70;
    this.confidenceGate = options.confidenceGate ?? 0.80;
    this.cooldownMs = options.cooldownMs ?? 1200;
    this.window = [];
  }

  /**
   * Updates configuration dynamically
   */
  public updateConfig(confidenceGate: number, windowSize: number = 10): void {
    this.confidenceGate = confidenceGate;
    this.windowSize = Math.max(3, windowSize);
  }

  /**
   * Resets internal stabilizer state
   */
  public reset(): void {
    this.window = [];
    this.lastCommittedSign = 'IDLE';
    this.lastCommittedTimestamp = 0;
    this.isNeutral = true;
  }

  /**
   * Ingests a new prediction and runs majority voting + cooldown checks
   */
  public stabilize(result: ClassificationResult): {
    stableSign: ISLSign | 'IDLE';
    confidence: number;
    shouldCommit: boolean;
    votePercentage: number;
  } {
    const now = Date.now();

    // 1. Confidence Gating: Reject predictions below threshold
    if (result.confidence < this.confidenceGate || result.sign === 'IDLE') {
      this.window.push({ ...result, sign: 'IDLE', confidence: 0 });
      this.isNeutral = true;
    } else {
      this.window.push(result);
    }

    // Maintain sliding window
    if (this.window.length > this.windowSize) {
      this.window.shift();
    }

    // 2. Majority Voting over the sliding window
    const counts: Record<string, { count: number; totalConfidence: number }> = {};
    for (const item of this.window) {
      if (item.sign === 'IDLE') continue;
      if (!counts[item.sign]) counts[item.sign] = { count: 0, totalConfidence: 0 };
      counts[item.sign].count++;
      counts[item.sign].totalConfidence += item.confidence;
    }

    let topSign: ISLSign | 'IDLE' = 'IDLE';
    let maxCount = 0;
    let avgConfidence = 0;

    for (const [signKey, data] of Object.entries(counts)) {
      if (data.count > maxCount) {
        maxCount = data.count;
        topSign = signKey as ISLSign;
        avgConfidence = data.totalConfidence / data.count;
      }
    }

    const voteRatio = this.window.length > 0 ? maxCount / this.window.length : 0;
    const isMajority = voteRatio >= this.majorityThreshold && topSign !== 'IDLE';
    const votePercentage = Math.round(voteRatio * 100);

    // 3. Cooldown Debounce (1.2s cooldown unless returned to neutral/idle state)
    let shouldCommit = false;

    if (isMajority) {
      const timeSinceLastCommit = now - this.lastCommittedTimestamp;
      const isNewSign = topSign !== this.lastCommittedSign;
      const isCooldownElapsed = timeSinceLastCommit >= this.cooldownMs;

      if (isNewSign || isCooldownElapsed || this.isNeutral) {
        shouldCommit = true;
        this.lastCommittedSign = topSign;
        this.lastCommittedTimestamp = now;
        this.isNeutral = false;
      }
    }

    return {
      stableSign: isMajority ? topSign : 'IDLE',
      confidence: isMajority ? Number(avgConfidence.toFixed(2)) : 0,
      shouldCommit,
      votePercentage,
    };
  }

  /**
   * Compatibility wrapper for UI processing
   */
  public process(rawResult: ClassificationResult): {
    smoothedSign: ISLSign | 'UNCERTAIN';
    smoothedConfidence: number;
    shouldCommit: boolean;
    committedSign: ISLSign | null;
    progressPercentage: number;
  } {
    const { stableSign, confidence, shouldCommit, votePercentage } = this.stabilize(rawResult);

    return {
      smoothedSign: stableSign === 'IDLE' ? 'UNCERTAIN' : stableSign,
      smoothedConfidence: confidence,
      shouldCommit,
      committedSign: shouldCommit ? (stableSign as ISLSign) : null,
      progressPercentage: Math.min(100, Math.round((votePercentage / (this.majorityThreshold * 100)) * 100)),
    };
  }
}

// Aliases for backward compatibility
export const TemporalDebounceSmoother = GestureStabilizer;
