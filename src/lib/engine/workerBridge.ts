import {
  ClassificationResult,
  FrameLandmarkData,
  ISLSign,
  SignAnchor,
  TelemetryMetrics,
} from '@/types/isl';
import { ISLClassifier } from './classifier';
import { TemporalBuffer } from './temporalBuffer';
import { GestureStabilizer } from './smoothing';
import { anchorRegistry } from './gestureLibrary';

export interface WorkerBridgeCallback {
  onResult: (
    result: ClassificationResult,
    commitInfo: { shouldCommit: boolean; committedSign: ISLSign | null; progressPercentage: number },
    telemetryPartial: Partial<TelemetryMetrics>
  ) => void;
}

export class VisionProcessorBridge {
  private worker: Worker | null = null;
  private callback: WorkerBridgeCallback | null = null;
  private isWorkerSupported: boolean = false;

  // Synchronous fallback instance
  private fallbackTemporalBuffer: TemporalBuffer = new TemporalBuffer(30);
  private fallbackStabilizer: GestureStabilizer = new GestureStabilizer({
    confidenceGate: 0.88,
    windowSize: 8,
    cooldownMs: 1100,
  });

  constructor() {
    if (typeof window !== 'undefined' && typeof Worker !== 'undefined') {
      try {
        this.worker = new Worker(
          new URL('../../workers/visionProcessor.worker.ts', import.meta.url),
          { type: 'module' }
        );

        this.worker.onmessage = (event: MessageEvent) => {
          const data = event.data;
          if (data && data.type === 'FRAME_RESULT' && this.callback) {
            this.callback.onResult(
              data.result,
              {
                shouldCommit: data.shouldCommit,
                committedSign: data.committedSign,
                progressPercentage: data.progressPercentage,
              },
              data.telemetryPartial
            );
          }
        };

        this.worker.onerror = (err) => {
          console.warn('Vision worker error, falling back to local thread processing:', err);
          this.isWorkerSupported = false;
        };

        this.isWorkerSupported = true;
      } catch (e) {
        console.warn('Web Worker construction failed, using synchronous engine:', e);
        this.isWorkerSupported = false;
      }
    }
  }

  public setCallback(callback: WorkerBridgeCallback): void {
    this.callback = callback;
  }

  public processFrame(frameData: FrameLandmarkData): void {
    if (this.worker && this.isWorkerSupported) {
      this.worker.postMessage({
        type: 'PROCESS_FRAME',
        frameData,
        timestamp: frameData.timestamp || Date.now(),
      });
    } else {
      // Direct Thread Execution Fallback
      const startTime = performance.now();
      this.fallbackTemporalBuffer.push(frameData);
      const rawResult = ISLClassifier.classify(frameData, this.fallbackTemporalBuffer);

      const {
        smoothedSign,
        smoothedConfidence,
        shouldCommit,
        committedSign,
        progressPercentage,
      } = this.fallbackStabilizer.process(rawResult);

      const stabilizedSign: ISLSign = smoothedSign === 'UNCERTAIN' ? 'IDLE' : smoothedSign;
      const primaryHand = frameData.rightHand || frameData.leftHand;
      const handsCount = (frameData.rightHand ? 1 : 0) + (frameData.leftHand ? 1 : 0);

      const result: ClassificationResult = {
        ...rawResult,
        sign: stabilizedSign,
        confidence: smoothedConfidence,
        isUncertain: smoothedSign === 'UNCERTAIN' || smoothedSign === 'IDLE',
        latencyMs: Math.round(performance.now() - startTime),
      };

      if (this.callback) {
        this.callback.onResult(
          result,
          { shouldCommit, committedSign, progressPercentage },
          {
            confidence: Math.round(smoothedConfidence * 100),
            handsCount,
            poseDetected: !!frameData.pose,
            bufferDepth: this.fallbackTemporalBuffer.size(),
            activeSign: smoothedSign === 'UNCERTAIN' ? 'NONE' : smoothedSign,
            detectedShape: primaryHand?.detectedShape,
            fingerExtensions: primaryHand?.fingerExtensions,
            phase: rawResult.phase,
            kineticEnergy: rawResult.kineticEnergy,
          }
        );
      }
    }
  }

  public updateAnchors(anchors: Record<string, SignAnchor>): void {
    if (this.worker && this.isWorkerSupported) {
      this.worker.postMessage({
        type: 'UPDATE_ANCHORS',
        anchors,
      });
    }
    anchorRegistry.loadAnchors(anchors);
  }

  public updateConfig(confidenceGate: number, debounceFrames: number): void {
    if (this.worker && this.isWorkerSupported) {
      this.worker.postMessage({
        type: 'UPDATE_CONFIG',
        confidenceGate,
        debounceFrames,
      });
    }
    this.fallbackStabilizer.updateConfig(confidenceGate, debounceFrames * 2);
    ISLClassifier.setThresholds(confidenceGate, 0.12);
  }

  public destroy(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.callback = null;
  }
}
