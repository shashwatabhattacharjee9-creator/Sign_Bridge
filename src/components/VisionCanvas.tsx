'use client';

import React, { useEffect, useRef, useState, memo } from 'react';
import { useSignBridgeStore } from '@/store/useSignBridgeStore';
import { MediaPipePipeline, HAND_CONNECTIONS, POSE_UPPER_CONNECTIONS } from '@/lib/mediapipe/landmarkExtractor';
import { kineticSynthesizer, KineticSynthesizer, KineticEvaluation } from '@/lib/engine/kineticSynthesizer';
import { ISL_VOCABULARY } from '@/lib/engine/gestureLibrary';
import { edgeDatabase } from '@/lib/storage/edgeDatabase';
import {
  CameraOff,
  FlipHorizontal,
  Layers,
  Sparkles,
  Zap,
  Activity,
  AlertCircle,
  Hand,
  WifiOff,
  Timer,
  Cpu,
  Lock,
  ShieldCheck,
  CheckCircle2,
  Volume2,
} from 'lucide-react';

interface PointTrail {
  x: number;
  y: number;
  age: number;
}

export const VisionCanvas: React.FC = memo(() => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Persistent Engine & Stream References (survive all React re-renders)
  const pipelineRef = useRef<MediaPipePipeline | null>(null);
  const synthesizerRef = useRef<KineticSynthesizer | null>(kineticSynthesizer);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const isInitializedRef = useRef<boolean>(false);
  const isMountedRef = useRef<boolean>(true);

  // Dynamic vector motion trails behind the 5 fingertips
  const fingertipTrailsRef = useRef<PointTrail[][]>([[], [], [], [], []]);
  const lastLockedSignFeedbackRef = useRef<{ sign: string; conf: number; timestamp: number } | null>(null);
  const lastStateDispatchRef = useRef<number>(0);

  // Read settings without triggering effect restarts
  const settings = useSignBridgeStore((s) => s.settings);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const updateSettings = useSignBridgeStore((s) => s.updateSettings);

  // Local mount status & error (one-time only)
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);

  // Keep pipeline config updated dynamically without restarting video
  useEffect(() => {
    if (pipelineRef.current) {
      pipelineRef.current.updateConfig({
        enablePose: settings.enablePose,
        drawLandmarks: false,
        isMirrored: settings.cameraMirror,
      });
    }
  }, [settings.enablePose, settings.cameraMirror, settings.drawLandmarks]);

  /**
   * High-Performance Cyber-Telemetry Canvas HUD Renderer
   */
  const renderCyberTelemetryHUD = (
    canvas: HTMLCanvasElement,
    handsResults: any,
    poseResults: any,
    evaluation: KineticEvaluation
  ) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    if (settingsRef.current.cameraMirror) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    const now = Date.now();
    const isRecentLock =
      lastLockedSignFeedbackRef.current &&
      now - lastLockedSignFeedbackRef.current.timestamp < 350;

    const isLocked = evaluation.state === 'GESTURE_LOCK' || isRecentLock;
    const isStabilizing = evaluation.state === 'POSE_STABILIZING';
    const isMoving = evaluation.state === 'DYNAMIC_MOTION';

    // 1. Draw Upper Pose Connectors & Nodes (High-Contrast Cyan #06B6D4)
    if (poseResults && poseResults.poseLandmarks && settingsRef.current.enablePose) {
      const pLm = poseResults.poseLandmarks;

      ctx.strokeStyle = 'rgba(6, 182, 212, 0.35)';
      ctx.lineWidth = 2.5;

      for (const [startIdx, endIdx] of POSE_UPPER_CONNECTIONS) {
        const p1 = pLm[startIdx];
        const p2 = pLm[endIdx];
        if (p1 && p2 && (p1.visibility ?? 1) > 0.5 && (p2.visibility ?? 1) > 0.5) {
          ctx.beginPath();
          ctx.moveTo(p1.x * canvas.width, p1.y * canvas.height);
          ctx.lineTo(p2.x * canvas.width, p2.y * canvas.height);
          ctx.stroke();
        }
      }

      for (const idx of [0, 11, 12, 13, 14, 15, 16]) {
        const pt = pLm[idx];
        if (pt && (pt.visibility ?? 1) > 0.5) {
          ctx.beginPath();
          ctx.arc(pt.x * canvas.width, pt.y * canvas.height, 4, 0, 2 * Math.PI);
          ctx.fillStyle = '#06B6D4';
          ctx.shadowColor = '#06B6D4';
          ctx.shadowBlur = 6;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
    }

    // 2. Draw Hand Skeletons, Displacement Trails, Bounding Box with Delta-V, and Wrist Confidence Ring
    if (handsResults && handsResults.multiHandLandmarks && handsResults.multiHandLandmarks.length > 0) {
      for (let h = 0; h < handsResults.multiHandLandmarks.length; h++) {
        const rawLm = handsResults.multiHandLandmarks[h];

        // Compute Bounding Box
        let minX = 1,
          maxX = 0,
          minY = 1,
          maxY = 0;
        for (const pt of rawLm) {
          if (pt.x < minX) minX = pt.x;
          if (pt.x > maxX) maxX = pt.x;
          if (pt.y < minY) minY = pt.y;
          if (pt.y > maxY) maxY = pt.y;
        }

        const pad = 0.035;
        const boxX = Math.max(0, (minX - pad) * canvas.width);
        const boxY = Math.max(0, (minY - pad) * canvas.height);
        const boxW = Math.min(canvas.width - boxX, (maxX - minX + pad * 2) * canvas.width);
        const boxH = Math.min(canvas.height - boxY, (maxY - minY + pad * 2) * canvas.height);

        // Render Thin Corner Brackets Around Detected Hands
        ctx.strokeStyle = isLocked
          ? '#F59E0B'
          : isStabilizing
          ? '#10B981'
          : isMoving
          ? 'rgba(6, 182, 212, 0.85)'
          : 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = isLocked ? 2.5 : isStabilizing ? 2.0 : 1.6;

        const cornerLen = 14;
        // Top-Left corner
        ctx.beginPath();
        ctx.moveTo(boxX, boxY + cornerLen);
        ctx.lineTo(boxX, boxY);
        ctx.lineTo(boxX + cornerLen, boxY);
        ctx.stroke();

        // Top-Right corner
        ctx.beginPath();
        ctx.moveTo(boxX + boxW - cornerLen, boxY);
        ctx.lineTo(boxX + boxW, boxY);
        ctx.lineTo(boxX + boxW, boxY + cornerLen);
        ctx.stroke();

        // Bottom-Left corner
        ctx.beginPath();
        ctx.moveTo(boxX, boxY + boxH - cornerLen);
        ctx.lineTo(boxX, boxY + boxH);
        ctx.lineTo(boxX + cornerLen, boxY + boxH);
        ctx.stroke();

        // Bottom-Right corner
        ctx.beginPath();
        ctx.moveTo(boxX + boxW - cornerLen, boxY + boxH);
        ctx.lineTo(boxX + boxW, boxY + boxH);
        ctx.lineTo(boxX + boxW, boxY + boxH - cornerLen);
        ctx.stroke();

        // Live Floating Coordinate Readout: X: 0.48 | Y: 0.32 | Δv: 0.02
        const wrist = rawLm[0];
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillStyle = isLocked ? '#F59E0B' : isStabilizing ? '#10B981' : '#06B6D4';
        const coordText = `X: ${wrist.x.toFixed(2)} | Y: ${wrist.y.toFixed(2)} | Δv: ${evaluation.smoothedVelocity.toFixed(2)}`;
        ctx.fillText(coordText, boxX, Math.max(12, boxY - 6));

        // Floating Lock Banner above hand on gesture lock
        const lockedFeedback = lastLockedSignFeedbackRef.current;
        if (isLocked && (evaluation.candidateSign || lockedFeedback)) {
          const displaySign = evaluation.candidateSign || lockedFeedback?.sign || '';
          const displayConf = Math.round((evaluation.confidence || lockedFeedback?.conf || 0.94) * 100);
          const lockLabel = `RECOGNIZED: "${displaySign}" (${displayConf}%)`;

          ctx.font = 'bold 12px "JetBrains Mono", sans-serif';
          ctx.fillStyle = '#000000';
          const labelWidth = ctx.measureText(lockLabel).width;
          ctx.fillRect(boxX, Math.max(20, boxY - 26), labelWidth + 16, 20);
          ctx.fillStyle = '#F59E0B';
          ctx.fillText(lockLabel, boxX + 8, Math.max(34, boxY - 12));
        }

        // Emerald Bone Connectors (#10B981 / Gold on Lock)
        ctx.strokeStyle = isLocked ? '#F59E0B' : '#10B981';
        ctx.lineWidth = 2.6;

        for (const [i1, i2] of HAND_CONNECTIONS) {
          const pt1 = rawLm[i1];
          const pt2 = rawLm[i2];
          if (pt1 && pt2) {
            ctx.beginPath();
            ctx.moveTo(pt1.x * canvas.width, pt1.y * canvas.height);
            ctx.lineTo(pt2.x * canvas.width, pt2.y * canvas.height);
            ctx.stroke();
          }
        }

        // Fingertip Vector Motion Trails (during dynamic motion)
        const tipIndices = [4, 8, 12, 16, 20];
        tipIndices.forEach((tipIdx, fingerNo) => {
          const tipPt = rawLm[tipIdx];
          if (tipPt) {
            const currentTrail = fingertipTrailsRef.current[fingerNo] || [];
            currentTrail.push({
              x: tipPt.x * canvas.width,
              y: tipPt.y * canvas.height,
              age: 0,
            });

            if (currentTrail.length > 8) currentTrail.shift();

            if (isMoving || isLocked) {
              for (let t = 0; t < currentTrail.length - 1; t++) {
                const pA = currentTrail[t];
                const pB = currentTrail[t + 1];
                const alpha = ((t + 1) / currentTrail.length) * 0.45;
                ctx.strokeStyle = isLocked
                  ? `rgba(245, 158, 11, ${alpha})`
                  : `rgba(6, 182, 212, ${alpha})`;
                ctx.lineWidth = (t + 1) * 0.8;
                ctx.beginPath();
                ctx.moveTo(pA.x, pA.y);
                ctx.lineTo(pB.x, pB.y);
                ctx.stroke();
              }
            }

            fingertipTrailsRef.current[fingerNo] = currentTrail;
          }
        });

        // Draw 21 Hand Joints (Cyan Nodes / Gold Flash on Lock)
        for (let i = 0; i < rawLm.length; i++) {
          const pt = rawLm[i];
          const isFingertip = tipIndices.includes(i);
          const isWrist = i === 0;

          const radius = isFingertip ? 5.5 : isWrist ? 6.5 : 3.5;

          ctx.beginPath();
          ctx.arc(pt.x * canvas.width, pt.y * canvas.height, radius, 0, 2 * Math.PI);

          if (isLocked) {
            ctx.fillStyle = '#F59E0B';
            ctx.shadowColor = '#F59E0B';
            ctx.shadowBlur = 10;
          } else if (isFingertip) {
            ctx.fillStyle = '#06B6D4';
            ctx.shadowColor = '#06B6D4';
            ctx.shadowBlur = 8;
          } else if (isWrist) {
            ctx.fillStyle = '#FFFFFF';
            ctx.shadowColor = '#FFFFFF';
            ctx.shadowBlur = 6;
          } else {
            ctx.fillStyle = '#10B981';
            ctx.shadowBlur = 0;
          }

          ctx.fill();
          ctx.shadowBlur = 0;

          // 3. Dynamic Wrist Confidence Ring (Progress Arc)
          // When moving: stays dim cyan & empty (0%)
          // When stabilizing: smoothly fills with emerald stroke (0% -> 100%) over 750ms
          if (isWrist) {
            const arcRadius = 18;
            const startAngle = -Math.PI / 2;
            const endAngle = startAngle + 2 * Math.PI * evaluation.holdProgress;

            // Background ring track
            ctx.beginPath();
            ctx.arc(pt.x * canvas.width, pt.y * canvas.height, arcRadius, 0, 2 * Math.PI);
            ctx.strokeStyle = isMoving
              ? 'rgba(6, 182, 212, 0.2)'
              : 'rgba(255, 255, 255, 0.15)';
            ctx.lineWidth = 2.8;
            ctx.stroke();

            // Active fill progress arc
            if (evaluation.holdProgress > 0) {
              ctx.beginPath();
              ctx.arc(pt.x * canvas.width, pt.y * canvas.height, arcRadius, startAngle, endAngle);
              ctx.strokeStyle = isLocked ? '#F59E0B' : '#10B981';
              ctx.lineWidth = 3.2;
              ctx.stroke();
            }
          }
        }
      }
    }

    ctx.restore();
  };

  /**
   * One-Time Strict Mount Effect for Camera & Inference Engine
   */
  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;
    isMountedRef.current = true;

    async function startVision() {
      setCameraError(null);
      await edgeDatabase.initialize();

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 360 },
            aspectRatio: 16 / 9,
            facingMode: 'user',
            frameRate: { ideal: 30, max: 30 },
          },
          audio: false,
        });

        if (!isMountedRef.current) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        mediaStreamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        const pipeline = new MediaPipePipeline({
          enablePose: settingsRef.current.enablePose,
          drawLandmarks: false,
          isMirrored: settingsRef.current.cameraMirror,
        });

        await pipeline.initialize(videoRef.current || undefined);
        pipelineRef.current = pipeline;

        if (videoRef.current && canvasRef.current) {
          canvasRef.current.width = videoRef.current.videoWidth || 640;
          canvasRef.current.height = videoRef.current.videoHeight || 360;

          pipeline.start(videoRef.current, canvasRef.current, {
            onFrame: (frameData, calculatedFps, currentLatency) => {
              if (!isMountedRef.current) return;
              const now = performance.now();

              // Evaluate frame with KineticSynthesizer
              const evaluation = synthesizerRef.current?.evaluateFrame(frameData) || {
                velocity: 0,
                smoothedVelocity: 0,
                spatialZone: 'REST' as const,
                handShape: 'UNKNOWN' as const,
                state: 'IDLE' as const,
                holdProgress: 0,
                confidence: 0,
                candidateSign: null,
                lockedSign: null,
                statusReadout: '○ Neutral / Idle Zone',
                isResting: true,
                restDurationMs: 0,
                isTwoHanded: false,
                wristCoords: { x: 0.5, y: 0.85, z: 0 },
                boundingBox: null,
                latencyMs: currentLatency,
              };

              // Gesture Lock Trigger: Dispatch exactly ONE atomic token
              if (evaluation.state === 'GESTURE_LOCK' && evaluation.lockedSign && evaluation.lockedSign !== 'IDLE') {
                useSignBridgeStore.getState().addToken(evaluation.lockedSign, evaluation.confidence);

                lastLockedSignFeedbackRef.current = {
                  sign: evaluation.lockedSign,
                  conf: evaluation.confidence,
                  timestamp: Date.now(),
                };

                edgeDatabase.logGesture({
                  timestamp: Date.now(),
                  sign: evaluation.lockedSign as any,
                  confidence: evaluation.confidence,
                  latencyMs: evaluation.latencyMs || currentLatency,
                  motionDetected: true,
                  fps: calculatedFps || 30,
                  dominantHand: 'right',
                });
              }

              // Sentence Finalization on Hand Rest (Hand drop or left camera for >= 1.2s)
              if (
                evaluation.isResting &&
                evaluation.restDurationMs >= (synthesizerRef.current?.getRestFinalizeThreshold() || 1200)
              ) {
                useSignBridgeStore.getState().finalizeSentenceOnRest();
              }

              // Practice target evaluation
              const currentPractice = useSignBridgeStore.getState().practice;
              if (currentPractice && currentPractice.signId) {
                const isMatch = evaluation.candidateSign === currentPractice.signId;
                useSignBridgeStore.getState().updatePracticeProgress(isMatch);
              }

              // Throttled UI state synchronization (<= 12 Hz) or immediate on lock
              const isLockEvent = evaluation.state === 'GESTURE_LOCK';
              const isDispatchDue = now - lastStateDispatchRef.current >= 80;

              if (isLockEvent || isDispatchDue) {
                lastStateDispatchRef.current = now;

                useSignBridgeStore.getState().setKineticEvaluation(
                  evaluation.state,
                  evaluation.confidence,
                  evaluation.holdProgress,
                  evaluation.candidateSign,
                  evaluation.statusReadout,
                  evaluation.wristCoords,
                  evaluation.spatialZone,
                  evaluation.handShape,
                  evaluation.isResting,
                  evaluation.restDurationMs,
                  evaluation.latencyMs || currentLatency
                );

                const handsCount = (frameData.rightHand ? 1 : 0) + (frameData.leftHand ? 1 : 0);
                useSignBridgeStore.getState().updateTelemetry({
                  fps: calculatedFps || 30,
                  latencyMs: evaluation.latencyMs || currentLatency,
                  confidence: Math.round(evaluation.confidence * 100),
                  handsCount,
                  poseDetected: !!frameData.pose,
                  activeSign: evaluation.candidateSign || 'NONE',
                  phase: evaluation.spatialZone === 'REST' ? 'REST' : 'STROKE',
                  kineticEnergy: evaluation.velocity,
                  detectionState:
                    evaluation.state === 'GESTURE_LOCK'
                      ? 'COMMITTED'
                      : evaluation.state === 'POSE_STABILIZING' || evaluation.state === 'DYNAMIC_MOTION'
                      ? 'TRACKING'
                      : 'IDLE',
                });
              }

              // Direct canvas HUD overlay pass (Runs 60 FPS in hardware context)
              if (canvasRef.current && settingsRef.current.drawLandmarks) {
                renderCyberTelemetryHUD(
                  canvasRef.current,
                  (pipelineRef.current as any)?.latestHandsResults,
                  (pipelineRef.current as any)?.latestPoseResults,
                  evaluation
                );
              }
            },
            onError: (err) => console.error('Pipeline frame error:', err),
          });
        }

        setCameraActive(true);
        useSignBridgeStore.getState().setTracking(true);
      } catch (err: any) {
        console.error('Camera startup error:', err);
        useSignBridgeStore.getState().setTracking(false);
        setCameraError(
          err.name === 'NotAllowedError'
            ? 'Camera permission denied. Please allow camera access in your browser settings.'
            : `Camera initialization error: ${err.message || 'Unknown hardware error'}`
        );
      } finally {
        if (isMountedRef.current) setInitialLoading(false);
      }
    }

    startVision();

    return () => {
      isMountedRef.current = false;
      isInitializedRef.current = false;
      useSignBridgeStore.getState().setTracking(false);

      if (pipelineRef.current) {
        pipelineRef.current.destroy();
        pipelineRef.current = null;
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
    };
  }, []);

  // UI state subscriptions via fine-grained store selectors
  const currentSign = useSignBridgeStore((s) => s.currentSign);
  const liveConfidence = useSignBridgeStore((s) => s.liveConfidence);
  const kineticState = useSignBridgeStore((s) => s.kineticState);
  const holdProgress = useSignBridgeStore((s) => s.holdProgress);
  const statusReadout = useSignBridgeStore((s) => s.statusReadout);
  const spatialZone = useSignBridgeStore((s) => s.spatialZone);
  const isFinalized = useSignBridgeStore((s) => s.isFinalized);
  const finalizedSentence = useSignBridgeStore((s) => s.finalizedSentence);
  const fps = useSignBridgeStore((s) => s.fps);
  const latencyMs = useSignBridgeStore((s) => s.latencyMs);

  const displayConfidence = Math.round(liveConfidence * 100);
  const displayProgress = Math.round(holdProgress * 100);

  return (
    <div className="relative w-full flex flex-col items-center justify-center rounded-3xl border border-white/10 shadow-2xl bg-black/80 backdrop-blur-xl overflow-hidden group select-none transition-all">
      {/* Dynamic Ambient Glow Behind Bezel */}
      <div
        className={`absolute -inset-1 rounded-3xl opacity-30 blur-2xl transition-all duration-700 pointer-events-none -z-10 ${
          isFinalized
            ? 'bg-emerald-500/30'
            : kineticState === 'GESTURE_LOCK'
            ? 'bg-amber-500/20'
            : kineticState === 'POSE_STABILIZING'
            ? 'bg-emerald-500/15'
            : kineticState === 'DYNAMIC_MOTION'
            ? 'bg-cyan-500/15'
            : 'bg-white/5'
        }`}
      />

      {/* 16:9 Cinema-Grade Viewport Container */}
      <div className="relative w-full aspect-[16/9] max-h-[480px] bg-black flex items-center justify-center overflow-hidden">
        {/* Corner Tech Reticles */}
        <div className="absolute top-4 left-4 w-3.5 h-3.5 border-t-2 border-l-2 border-cyan-400/60 z-20 pointer-events-none rounded-tl" />
        <div className="absolute top-4 right-4 w-3.5 h-3.5 border-t-2 border-r-2 border-cyan-400/60 z-20 pointer-events-none rounded-tr" />
        <div className="absolute bottom-4 left-4 w-3.5 h-3.5 border-b-2 border-l-2 border-cyan-400/60 z-20 pointer-events-none rounded-bl" />
        <div className="absolute bottom-4 right-4 w-3.5 h-3.5 border-b-2 border-r-2 border-cyan-400/60 z-20 pointer-events-none rounded-br" />

        {/* Video Stream (Permanently Mounted in DOM) */}
        <video
          ref={videoRef}
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover ${
            settings.cameraMirror ? '-scale-x-100' : ''
          } ${cameraActive ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
        />

        {/* 2D Canvas Skeletal Overlay (Hardware-Accelerated 60 FPS) */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10"
        />

        {/* First-Time Initialization Subtle Loader */}
        {initialLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md z-20 space-y-3 pointer-events-none">
            <div className="w-9 h-9 border-2 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin" />
            <p className="text-xs font-mono text-white/80 tracking-wide">Starting Local Edge Engine...</p>
          </div>
        )}

        {/* Camera Permission/Error Screen */}
        {cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 z-20 p-6 text-center space-y-3">
            <div className="w-10 h-10 rounded-2xl liquid-glass text-white/90 flex items-center justify-center">
              <CameraOff className="w-5 h-5" />
            </div>
            <h4 className="text-white font-medium text-sm">Camera Unavailable</h4>
            <p className="text-xs text-white/60 max-w-xs">{cameraError}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2 liquid-glass text-xs text-white rounded-full font-medium transition-all hover:bg-white/10 active:scale-95 cursor-pointer"
            >
              Retry Camera
            </button>
          </div>
        )}

        {/* HUD Top-Left: Status Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-20 pointer-events-none font-mono text-[10px]">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full liquid-glass shadow-lg text-white">
            <span className={`w-2 h-2 rounded-full ${fps >= 24 ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className="font-semibold text-[11px]">FRAME RATE: {fps ? fps.toFixed(1) : '30.0'} FPS</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded-full liquid-glass shadow-sm text-white/90">
            <Timer className="w-3 h-3 text-cyan-400" />
            <span>ENGINE LATENCY: {latencyMs || 16}ms</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full liquid-glass text-white/70">
            <Cpu className="w-3 h-3 text-emerald-400" />
            <span>INFERENCE: Edge WASM (Simd-Accelerated)</span>
          </div>
        </div>

        {/* HUD Top-Center: Live Dynamic Status HUD Pill */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none hidden sm:block">
          <div
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full liquid-glass text-xs font-medium shadow-xl border backdrop-blur-xl transition-all duration-200 ${
              kineticState === 'GESTURE_LOCK'
                ? 'border-amber-400/40 bg-amber-950/40 text-amber-300'
                : kineticState === 'POSE_STABILIZING'
                ? 'border-emerald-400/30 bg-emerald-950/30 text-emerald-300'
                : kineticState === 'DYNAMIC_MOTION'
                ? 'border-cyan-400/20 bg-cyan-950/20 text-cyan-300'
                : 'border-white/10 text-white/60'
            }`}
          >
            <span className="font-mono text-[11px] uppercase tracking-wider font-semibold">
              {statusReadout || '○ Neutral / Idle Zone'}
            </span>
          </div>
        </div>

        {/* HUD Top-Right: 100% Offline Active Badge & Camera Toggles */}
        <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
          <div
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full liquid-glass text-xs font-mono font-medium text-emerald-400 shadow-xl backdrop-blur-xl"
            title="100% Client-Side Local Execution Guarantee"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
            <span className="hidden sm:inline">100% OFFLINE EDGE ACTIVE</span>
            <span className="sm:hidden">OFFLINE</span>
          </div>

          {/* Quick Controls */}
          <div className="flex items-center gap-1 pointer-events-auto liquid-glass p-1 rounded-full shadow-lg">
            <button
              onClick={() => updateSettings({ cameraMirror: !settings.cameraMirror })}
              className={`p-1.5 rounded-full transition-all text-xs cursor-pointer active:scale-95 ${
                settings.cameraMirror ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white'
              }`}
              title="Mirror Camera Horizontal"
            >
              <FlipHorizontal className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => updateSettings({ drawLandmarks: !settings.drawLandmarks })}
              className={`p-1.5 rounded-full transition-all text-xs cursor-pointer active:scale-95 ${
                settings.drawLandmarks ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white'
              }`}
              title="Toggle Skeleton Overlay"
            >
              <Layers className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* HUD Bottom: Floating Sign Card with Articulation Progress & Spatial Status */}
        <div className="absolute bottom-4 left-4 right-4 z-20">
          <div className="p-3.5 rounded-2xl liquid-glass shadow-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-bold transition-all ${
                  isFinalized
                    ? 'bg-emerald-400 text-black scale-105 shadow-lg shadow-emerald-400/40'
                    : kineticState === 'GESTURE_LOCK'
                    ? 'bg-amber-400 text-black scale-105 shadow-lg shadow-amber-400/30'
                    : currentSign
                    ? 'liquid-glass text-white'
                    : 'bg-white/[0.04] text-white/40'
                }`}
              >
                {isFinalized ? '✓' : currentSign ? (ISL_VOCABULARY as any)[currentSign]?.emoji || '✋' : '✋'}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm sm:text-base text-white tracking-tight">
                    {isFinalized
                      ? 'Sentence Finalized on Rest'
                      : currentSign
                      ? `Candidate: ${currentSign}`
                      : 'Bring hand into frame to synthesize ISL...'}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 liquid-glass rounded-full text-cyan-300 uppercase">
                    Zone: {spatialZone}
                  </span>
                  {kineticState !== 'IDLE' && (
                    <span className="text-[10px] font-mono px-2 py-0.5 liquid-glass rounded-full text-white/70 uppercase hidden sm:inline">
                      {kineticState}
                    </span>
                  )}
                </div>

                <p className="text-xs text-white/60 mt-0.5 font-normal max-w-xl truncate">
                  {isFinalized
                    ? finalizedSentence
                    : currentSign && (ISL_VOCABULARY as any)[currentSign]
                    ? (ISL_VOCABULARY as any)[currentSign].instructions[0] || (ISL_VOCABULARY as any)[currentSign].description
                    : 'Hold steady for ~750ms to register deliberate gestures'}
                </p>
              </div>
            </div>

            {/* Confidence & Hold Progress Bar */}
            <div className="flex flex-col items-end gap-1.5 min-w-[130px]">
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-white/50 text-[11px]">Match:</span>
                <span className="font-semibold text-white">
                  {displayConfidence > 0 ? `${displayConfidence}%` : '--'}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className={`h-full transition-all duration-100 rounded-full ${
                    isFinalized
                      ? 'bg-emerald-400'
                      : kineticState === 'GESTURE_LOCK'
                      ? 'bg-amber-400'
                      : 'bg-gradient-to-r from-cyan-400 to-emerald-400'
                  }`}
                  style={{ width: `${displayProgress}%` }}
                />
              </div>

              <span className="text-[10px] text-white/50 font-mono">
                {isFinalized
                  ? '✓ Sentence Finalized'
                  : kineticState === 'GESTURE_LOCK'
                  ? '✓ Token Locked'
                  : kineticState === 'POSE_STABILIZING'
                  ? `Stabilizing: ${displayProgress}%`
                  : kineticState === 'DYNAMIC_MOTION'
                  ? 'Analyzing Motion...'
                  : kineticState === 'COOLDOWN'
                  ? 'Cooldown...'
                  : 'Ready'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

VisionCanvas.displayName = 'VisionCanvas';
