import {
  ClassificationResult,
  FrameLandmarkData,
  ISLSign,
  SignAnchor,
  WorkerConfigMessage,
  WorkerProcessFrameMessage,
  WorkerResultMessage,
  WorkerUpdateAnchorsMessage,
} from '@/types/isl';
import { ISLClassifier } from '@/lib/engine/classifier';
import { TemporalBuffer } from '@/lib/engine/temporalBuffer';
import { GestureStabilizer } from '@/lib/engine/smoothing';
import { anchorRegistry } from '@/lib/engine/gestureLibrary';

const ctx: Worker = self as any;

const temporalBuffer = new TemporalBuffer(30);
const stabilizer = new GestureStabilizer({
  confidenceGate: 0.88,
  windowSize: 8,
  cooldownMs: 1100,
});

ctx.onmessage = (event: MessageEvent) => {
  const data = event.data;
  if (!data || !data.type) return;

  switch (data.type) {
    case 'PROCESS_FRAME': {
      const msg = data as WorkerProcessFrameMessage;
      const frameData = msg.frameData;
      const startTime = performance.now();

      temporalBuffer.push(frameData);
      const rawResult = ISLClassifier.classify(frameData, temporalBuffer);

      const {
        smoothedSign,
        smoothedConfidence,
        shouldCommit,
        committedSign,
        progressPercentage,
      } = stabilizer.process(rawResult);

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

      const response: WorkerResultMessage & { shouldCommit: boolean; committedSign: ISLSign | null; progressPercentage: number } = {
        type: 'FRAME_RESULT',
        result,
        shouldCommit,
        committedSign,
        progressPercentage,
        telemetryPartial: {
          confidence: Math.round(smoothedConfidence * 100),
          handsCount,
          poseDetected: !!frameData.pose,
          bufferDepth: temporalBuffer.size(),
          activeSign: smoothedSign === 'UNCERTAIN' ? 'NONE' : smoothedSign,
          detectedShape: primaryHand?.detectedShape,
          fingerExtensions: primaryHand?.fingerExtensions,
          phase: rawResult.phase,
          kineticEnergy: rawResult.kineticEnergy,
        },
      };

      ctx.postMessage(response);
      break;
    }

    case 'UPDATE_ANCHORS': {
      const msg = data as WorkerUpdateAnchorsMessage;
      if (msg.anchors) {
        anchorRegistry.loadAnchors(msg.anchors);
      }
      break;
    }

    case 'UPDATE_CONFIG': {
      const msg = data as WorkerConfigMessage;
      if (msg.confidenceGate !== undefined) {
        stabilizer.updateConfig(msg.confidenceGate, (msg.debounceFrames || 3) * 2);
        ISLClassifier.setThresholds(msg.confidenceGate, 0.12);
      }
      break;
    }

    default:
      break;
  }
};
