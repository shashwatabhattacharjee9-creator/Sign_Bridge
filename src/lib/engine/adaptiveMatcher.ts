import {
  ClassificationResult,
  ClassificationScore,
  FrameLandmarkData,
  ISLSign,
  Landmark3D,
} from '@/types/isl';
import { TemporalBuffer } from './temporalBuffer';
import rawTemplatesData from '@/data/isl_templates.json';

export interface ISLTemplate {
  id: ISLSign;
  label: string;
  motionType: 'static' | 'dynamic';
  zone: 'FACE' | 'CHEST' | 'NEUTRAL';
  twoHanded: boolean;
  fingerExtensions: [number, number, number, number, number];
  vector63: number[];
  trajectory?: number[][];
  userCalibrated?: boolean;
}

export interface MatcherState {
  currentSign: ISLSign;
  confidence: number;
  trackingSign: ISLSign | null;
  trackingFrames: number;
  commitProgress: number; // 0.0 - 1.0 (4 frames -> 1.0)
  isCommitted: boolean;
  committedSign: ISLSign | null;
  zone: 'REST' | 'ACTIVE';
  elevation: 'FACE' | 'CHEST' | 'REST';
}

/**
 * Fast Dynamic Time Warping (DTW) calculation between two 3D point series
 */
export function fastDTW3D(seriesA: number[][], seriesB: number[][]): number {
  const n = seriesA.length;
  const m = seriesB.length;
  if (n === 0 || m === 0) return 999;

  // Initialize DP cost table
  const cost: number[][] = Array.from({ length: n + 1 }, () =>
    new Array(m + 1).fill(Infinity)
  );
  cost[0][0] = 0;

  for (let i = 1; i <= n; i++) {
    const a = seriesA[i - 1];
    for (let j = 1; j <= m; j++) {
      const b = seriesB[j - 1];
      const dx = a[0] - b[0];
      const dy = a[1] - b[1];
      const dz = (a[2] || 0) - (b[2] || 0);
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      cost[i][j] = dist + Math.min(cost[i - 1][j], cost[i][j - 1], cost[i - 1][j - 1]);
    }
  }

  const totalDist = cost[n][m];
  const pathLength = Math.max(n, m);
  return totalDist / pathLength;
}

/**
 * Computes Cosine Similarity between two 1D float arrays
 */
export function computeCosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * CORE ENGINE: Adaptive Hysteresis & Matcher
 * Features:
 * 1. Natural Signing Zone Gating
 * 2. Dual-Threshold Hysteresis Gating (T_enter = 0.74, T_hold = 0.58)
 * 3. Static Cosine + Finger Flexion Fusion
 * 4. Dynamic Gesture Evaluator via Fast DTW
 * 5. Dynamic in-browser template hot-reloading from localStorage
 */
export class AdaptiveMatcher {
  private static instance: AdaptiveMatcher | null = null;

  // Templates dictionary
  private templates: Map<string, ISLTemplate> = new Map();

  // Hysteresis thresholds
  private readonly T_ENTER = 0.74;
  private readonly T_HOLD = 0.58;
  private readonly REQUIRED_COMMIT_FRAMES = 4;

  // Tracking state
  private activeCandidate: ISLSign | null = null;
  private candidateFrames: number = 0;
  private lastCommitTime: number = 0;
  private readonly COMMIT_COOLDOWN_MS = 900;

  constructor() {
    this.loadBaseTemplates();
    this.syncCustomTemplatesFromStorage();
  }

  public static getInstance(): AdaptiveMatcher {
    if (!this.instance) {
      this.instance = new AdaptiveMatcher();
    }
    return this.instance;
  }

  /**
   * Load pre-bundled templates
   */
  public loadBaseTemplates(): void {
    const rawList = (rawTemplatesData as any).templates || [];
    for (const t of rawList) {
      this.templates.set(t.id, t);
    }
  }

  /**
   * Hot-reloads custom user-recorded templates from localStorage
   */
  public syncCustomTemplatesFromStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem('signbridge_custom_templates');
      if (stored) {
        const customTemplates: ISLTemplate[] = JSON.parse(stored);
        for (const t of customTemplates) {
          this.templates.set(t.id, { ...t, userCalibrated: true });
        }
      }
    } catch (e) {
      console.warn('Failed to load custom templates from localStorage:', e);
    }
  }

  /**
   * Save or update a single template dynamically
   */
  public registerCustomTemplate(template: ISLTemplate): void {
    this.templates.set(template.id, { ...template, userCalibrated: true });
    if (typeof window !== 'undefined') {
      try {
        const customList: ISLTemplate[] = [];
        this.templates.forEach((v) => {
          if (v.userCalibrated) customList.push(v);
        });
        localStorage.setItem('signbridge_custom_templates', JSON.stringify(customList));
      } catch (e) {
        console.error('Failed to persist custom template:', e);
      }
    }
  }

  public getTemplates(): ISLTemplate[] {
    return Array.from(this.templates.values());
  }

  public resetTracking(): void {
    this.activeCandidate = null;
    this.candidateFrames = 0;
  }

  /**
   * Main frame evaluation
   */
  public evaluateFrame(
    frameData: FrameLandmarkData,
    buffer?: TemporalBuffer
  ): {
    result: ClassificationResult;
    matcherState: MatcherState;
  } {
    const startTime = performance.now();
    const primaryHand = frameData.rightHand || frameData.leftHand;
    const secondaryHand = frameData.rightHand && frameData.leftHand ? frameData.leftHand : undefined;

    // 1. Natural Signing Zone Filter
    let elevation: MatcherState['elevation'] = 'REST';
    let inSigningZone = false;

    if (primaryHand && primaryHand.rawLandmarks && primaryHand.rawLandmarks.length >= 21) {
      const wristY = primaryHand.rawLandmarks[0].y;

      if (frameData.pose && frameData.pose.leftShoulder && frameData.pose.rightShoulder) {
        const shoulderY = (frameData.pose.leftShoulder.y + frameData.pose.rightShoulder.y) / 2;
        const noseY = frameData.pose.nose ? frameData.pose.nose.y : shoulderY - 0.25;

        if (wristY <= noseY + 0.12) {
          elevation = 'FACE';
          inSigningZone = true;
        } else if (wristY <= shoulderY + 0.40) {
          elevation = 'CHEST';
          inSigningZone = true;
        } else {
          elevation = 'REST';
          inSigningZone = false;
        }
      } else {
        if (wristY < 0.40) {
          elevation = 'FACE';
          inSigningZone = true;
        } else if (wristY <= 0.82) {
          elevation = 'CHEST';
          inSigningZone = true;
        } else {
          elevation = 'REST';
          inSigningZone = false;
        }
      }
    }

    // If hands are resting below ribcage or not visible -> Reset tracking to IDLE
    if (!primaryHand || !inSigningZone) {
      this.resetTracking();
      const emptyResult: ClassificationResult = {
        sign: 'IDLE',
        confidence: 0,
        isDynamic: false,
        latencyMs: Math.round(performance.now() - startTime),
        isUncertain: true,
        rankedScores: [],
        phase: 'REST',
        kineticEnergy: 0,
        margin: 0,
      };
      const emptyState: MatcherState = {
        currentSign: 'IDLE',
        confidence: 0,
        trackingSign: null,
        trackingFrames: 0,
        commitProgress: 0,
        isCommitted: false,
        committedSign: null,
        zone: 'REST',
        elevation: 'REST',
      };
      return { result: emptyResult, matcherState: emptyState };
    }

    // 2. Candidate Evaluation across all templates
    const vector63 = primaryHand.vector63;
    const currentExt = [
      primaryHand.fingerExtensions.thumb,
      primaryHand.fingerExtensions.index,
      primaryHand.fingerExtensions.middle,
      primaryHand.fingerExtensions.ring,
      primaryHand.fingerExtensions.pinky,
    ];

    const scores: ClassificationScore[] = [];

    // Extract recent trajectory from buffer for DTW
    const recentTrajectory: number[][] = [];
    if (buffer) {
      const frames = buffer.getRecentFrames(15);
      for (const f of frames) {
        const h = f.rightHand || f.leftHand;
        if (h && h.rawLandmarks && h.rawLandmarks[0]) {
          recentTrajectory.push([h.rawLandmarks[0].x, h.rawLandmarks[0].y, h.rawLandmarks[0].z || 0]);
        }
      }
    }

    this.templates.forEach((template) => {
      // Two-handed filter
      if (template.twoHanded && !secondaryHand) return;

      // Static matching: 0.65 Cosine + 0.35 Finger Curl Fusion
      const sCosine = computeCosineSimilarity(vector63, template.vector63);

      let curlDiff = 0;
      for (let i = 0; i < 5; i++) {
        curlDiff += Math.abs(currentExt[i] - template.fingerExtensions[i]);
      }
      const sCurl = Math.max(0, 1 - curlDiff / 4.0);

      let totalScore = 0.65 * sCosine + 0.35 * sCurl;

      // Dynamic trajectory matching via Fast DTW
      if (template.motionType === 'dynamic' && template.trajectory && template.trajectory.length > 0) {
        if (recentTrajectory.length >= 4) {
          const dtwDist = fastDTW3D(recentTrajectory, template.trajectory);
          const sDtw = Math.max(0, 1 - dtwDist / 0.40);
          totalScore = totalScore * 0.45 + sDtw * 0.55;
        }
      }

      // Zone bias boost
      if (template.zone === elevation) {
        totalScore += 0.05;
      }

      scores.push({
        sign: template.id,
        confidence: Math.min(0.99, Number(totalScore.toFixed(3))),
        matchReason: template.motionType === 'dynamic' ? 'DTW + Static Fusion' : 'Cosine + Finger Angle Fusion',
      });
    });

    // Sort descending
    scores.sort((a, b) => b.confidence - a.confidence);
    const topCandidate = scores.length > 0 ? scores[0] : { sign: 'IDLE' as ISLSign, confidence: 0 };
    const runnerUp = scores.length > 1 ? scores[1] : { sign: 'IDLE' as ISLSign, confidence: 0 };
    const margin = Number((topCandidate.confidence - runnerUp.confidence).toFixed(3));

    // 3. Adaptive Dual-Threshold Hysteresis Gating
    let shouldCommit = false;
    let committedSign: ISLSign | null = null;
    const now = performance.now();

    if (this.activeCandidate === null) {
      // Must hit activation threshold T_ENTER (0.74)
      if (topCandidate.confidence >= this.T_ENTER) {
        this.activeCandidate = topCandidate.sign;
        this.candidateFrames = 1;
      }
    } else {
      // Check if current active candidate still satisfies T_HOLD (0.58)
      const activeMatch = scores.find((s) => s.sign === this.activeCandidate);
      const activeConfidence = activeMatch ? activeMatch.confidence : 0;

      if (activeConfidence >= this.T_HOLD) {
        this.candidateFrames += 1;

        // Commit Rule: 4 consecutive frames holding above T_HOLD
        if (
          this.candidateFrames >= this.REQUIRED_COMMIT_FRAMES &&
          now - this.lastCommitTime > this.COMMIT_COOLDOWN_MS
        ) {
          shouldCommit = true;
          committedSign = this.activeCandidate;
          this.lastCommitTime = now;
          this.candidateFrames = 0; // Reset frame count post-commit
        }
      } else {
        // Switched or dropped below T_HOLD -> Check if new candidate hits T_ENTER
        if (topCandidate.confidence >= this.T_ENTER && topCandidate.sign !== this.activeCandidate) {
          this.activeCandidate = topCandidate.sign;
          this.candidateFrames = 1;
        } else {
          this.resetTracking();
        }
      }
    }

    const commitProgress = Math.min(1.0, this.candidateFrames / this.REQUIRED_COMMIT_FRAMES);

    const classificationResult: ClassificationResult = {
      sign: this.activeCandidate || 'IDLE',
      confidence: topCandidate.confidence,
      isDynamic: this.activeCandidate ? this.templates.get(this.activeCandidate)?.motionType === 'dynamic' : false,
      latencyMs: Math.round(performance.now() - startTime),
      isUncertain: this.activeCandidate === null,
      rankedScores: scores.slice(0, 5),
      phase: inSigningZone ? 'STROKE' : 'REST',
      kineticEnergy: 0.005,
      margin,
    };

    const matcherState: MatcherState = {
      currentSign: this.activeCandidate || 'IDLE',
      confidence: topCandidate.confidence,
      trackingSign: this.activeCandidate,
      trackingFrames: this.candidateFrames,
      commitProgress,
      isCommitted: shouldCommit,
      committedSign,
      zone: inSigningZone ? 'ACTIVE' : 'REST',
      elevation,
    };

    return {
      result: classificationResult,
      matcherState,
    };
  }
}

export const adaptiveMatcher = AdaptiveMatcher.getInstance();
