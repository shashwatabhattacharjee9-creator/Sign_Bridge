'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSignBridgeStore } from '@/store/useSignBridgeStore';
import { MediaPipePipeline } from '@/lib/mediapipe/landmarkExtractor';
import { TemporalBuffer } from '@/lib/engine/temporalBuffer';
import { ISLClassifier } from '@/lib/engine/classifier';
import { GestureStabilizer } from '@/lib/engine/smoothing';
import { ISL_VOCABULARY } from '@/lib/engine/gestureLibrary';
import { edgeDatabase } from '@/lib/storage/edgeDatabase';
import {
  Camera,
  CameraOff,
  FlipHorizontal,
  Layers,
  Sparkles,
  Zap,
  Activity,
  AlertCircle,
  Hand,
  WifiOff,
  Gauge,
  Timer,
  Database,
} from 'lucide-react';

export const VisionCanvas: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const pipelineRef = useRef<MediaPipePipeline | null>(null);
  const temporalBufferRef = useRef<TemporalBuffer>(new TemporalBuffer(30));
  const stabilizerRef = useRef<GestureStabilizer>(
    new GestureStabilizer({ confidenceGate: 0.70, windowSize: 8, cooldownMs: 1000 })
  );

  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  // Performance Optimization: Throttle high-frequency React state updates
  const lastTelemetryDispatchRef = useRef<number>(0);
  const lastRecognizedSignRef = useRef<string>('IDLE');

  // Store bindings
  const {
    currentSign,
    confidence,
    fps,
    latencyMs,
    isOffline,
    isStabilized,
    confidenceThreshold,
    setTracking,
    updateTelemetry,
    setPrediction,
    setClassification,
    addToken,
    practice,
    updatePracticeProgress,
    settings,
    updateSettings,
    telemetry,
  } = useSignBridgeStore();

  // Keep stabilizer synchronized with store settings
  useEffect(() => {
    stabilizerRef.current.updateConfig(confidenceThreshold, settings.debounceFrames * 2);
    if (pipelineRef.current) {
      pipelineRef.current.updateConfig({
        enablePose: settings.enablePose,
        drawLandmarks: settings.drawLandmarks,
        isMirrored: settings.cameraMirror,
      });
    }
  }, [confidenceThreshold, settings]);

  // Main high-performance frame processing loop
  const handleFrame = useCallback(
    (frameData: any, calculatedFps: number, currentLatency: number) => {
      const now = performance.now();

      // 1. Ingest frame into pre-allocated ring buffer (Zero dynamic memory allocation)
      temporalBufferRef.current.push(frameData);

      // 2. Classify gesture using ISLClassifier
      const rawResult = ISLClassifier.classify(frameData, temporalBufferRef.current);

      // 3. Apply GestureStabilizer (sliding-window majority voting + debounce)
      const {
        smoothedSign,
        smoothedConfidence,
        shouldCommit,
        committedSign,
        progressPercentage,
      } = stabilizerRef.current.process(rawResult);

      const stabilizedSign = smoothedSign === 'UNCERTAIN' ? 'IDLE' : smoothedSign;

      // 4. Token Commitment Event (Semantic State Change)
      if (shouldCommit && committedSign && committedSign !== 'IDLE') {
        addToken(committedSign, smoothedConfidence);

        // Backend-first edge database event logging
        edgeDatabase.logGesture({
          timestamp: Date.now(),
          sign: committedSign,
          confidence: smoothedConfidence,
          latencyMs: currentLatency,
          motionDetected: rawResult.motionDetected ?? false,
          fps: calculatedFps,
          dominantHand: frameData.rightHand ? 'right' : 'left',
        });
      }

      // 5. Practice Mode Progress Tracking
      if (practice && practice.signId) {
        const isMatch = smoothedSign === practice.signId;
        updatePracticeProgress(isMatch);
      }

      // 6. Throttled UI State Synchronization (Batched at ~8.3 Hz to eliminate React thread starvation)
      const isSignTransition = stabilizedSign !== lastRecognizedSignRef.current;
      const isTelemetryDue = now - lastTelemetryDispatchRef.current >= 120; // 120ms throttle

      if (isSignTransition || isTelemetryDue || shouldCommit) {
        lastTelemetryDispatchRef.current = now;
        lastRecognizedSignRef.current = stabilizedSign;

        const primaryHand = frameData.rightHand || frameData.leftHand;
        const handsCount = (frameData.rightHand ? 1 : 0) + (frameData.leftHand ? 1 : 0);

        setClassification(
          {
            ...rawResult,
            sign: stabilizedSign,
            confidence: smoothedConfidence,
            isUncertain: smoothedSign === 'UNCERTAIN' || smoothedSign === 'IDLE',
            latencyMs: currentLatency,
          },
          progressPercentage
        );

        updateTelemetry({
          fps: calculatedFps,
          latencyMs: currentLatency,
          confidence: Math.round(smoothedConfidence * 100),
          handsCount,
          poseDetected: !!frameData.pose,
          bufferDepth: temporalBufferRef.current.size(),
          activeSign: smoothedSign === 'UNCERTAIN' ? 'NONE' : smoothedSign,
          detectedShape: primaryHand?.detectedShape,
          fingerExtensions: primaryHand?.fingerExtensions,
        });
      }
    },
    [
      setClassification,
      updateTelemetry,
      addToken,
      practice,
      updatePracticeProgress,
    ]
  );

  // Setup video stream, MediaPipe pipeline, and Edge Database
  useEffect(() => {
    let stream: MediaStream | null = null;
    let isMounted = true;

    async function startVision() {
      setIsInitializing(true);
      setCameraError(null);

      // Initialize local edge database
      await edgeDatabase.initialize();

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 360 },
            aspectRatio: 16 / 9,
            facingMode: 'user',
            frameRate: { ideal: 30, max: 30 },
          },
          audio: false,
        });

        if (!isMounted) return;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        const pipeline = new MediaPipePipeline({
          enablePose: settings.enablePose,
          drawLandmarks: settings.drawLandmarks,
          isMirrored: settings.cameraMirror,
        });

        await pipeline.initialize(videoRef.current || undefined);
        pipelineRef.current = pipeline;

        if (videoRef.current && canvasRef.current) {
          canvasRef.current.width = videoRef.current.videoWidth || 640;
          canvasRef.current.height = videoRef.current.videoHeight || 360;

          pipeline.start(videoRef.current, canvasRef.current, {
            onFrame: handleFrame,
            onError: (err) => console.error('Pipeline frame error:', err),
          });
        }

        setCameraActive(true);
        setTracking(true);
      } catch (err: any) {
        console.error('Camera startup error:', err);
        setTracking(false);
        setCameraError(
          err.name === 'NotAllowedError'
            ? 'Camera access permission denied. Please allow camera in browser.'
            : `Camera initialization error: ${err.message || 'Unknown device error'}`
        );
      } finally {
        if (isMounted) setIsInitializing(false);
      }
    }

    startVision();

    return () => {
      isMounted = false;
      setTracking(false);
      if (pipelineRef.current) {
        pipelineRef.current.destroy();
        pipelineRef.current = null;
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [handleFrame, settings.enablePose, settings.drawLandmarks, settings.cameraMirror, setTracking]);

  const activeSignDef = currentSign && currentSign !== 'IDLE' ? ISL_VOCABULARY[currentSign] : null;
  const fExt = telemetry.fingerExtensions;

  const fpsColorClass =
    fps >= 24 ? 'text-brand-emerald bg-brand-emerald/10 border-brand-emerald/30' :
    fps >= 15 ? 'text-brand-amber bg-brand-amber/10 border-brand-amber/30' :
    'text-red-400 bg-red-500/10 border-red-500/30';

  const confidencePct = Math.round(confidence * 100);

  return (
    <div className="relative w-full flex flex-col items-center justify-center bg-surface-50 rounded-2xl border border-surface-200 overflow-hidden shadow-2xl">
      {/* 16:9 Responsive Video/Canvas Container */}
      <div className="relative w-full aspect-[16/9] max-h-[560px] bg-[#06090F] flex items-center justify-center overflow-hidden">
        {/* Mirrored Video Element */}
        <video
          ref={videoRef}
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover ${
            settings.cameraMirror ? '-scale-x-100' : ''
          } ${cameraActive ? 'opacity-100' : 'opacity-0'}`}
        />

        {/* Calibrated 2D Canvas Skeletal Overlay */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10"
        />

        {/* Loading Spinner */}
        {isInitializing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 z-20 space-y-3">
            <div className="w-12 h-12 border-4 border-surface-200 border-t-brand-emerald rounded-full animate-spin" />
            <p className="text-sm font-mono text-slate-300">Initializing Local Edge-AI Pipeline...</p>
          </div>
        )}

        {/* Camera Error Message */}
        {cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/95 z-20 p-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center">
              <CameraOff className="w-6 h-6" />
            </div>
            <h4 className="text-white font-semibold">Webcam Not Available</h4>
            <p className="text-xs text-slate-400 max-w-sm">{cameraError}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-surface-200 hover:bg-surface-300 text-xs text-white rounded-lg transition-colors font-medium"
            >
              Retry Camera Connection
            </button>
          </div>
        )}

        {/* HUD OVERLAYS */}
        {/* Top-Left: Live FPS Badge & Inference Latency */}
        <div className="absolute top-3 left-3 flex items-center gap-2 z-20 pointer-events-none font-mono text-xs">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border backdrop-blur-md ${fpsColorClass}`}>
            <Gauge className="w-3.5 h-3.5" />
            <span className="font-bold">{fps || 0} FPS</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-background/80 backdrop-blur-md border border-surface-200 text-slate-300">
            <Timer className="w-3.5 h-3.5 text-brand-cyan" />
            <span>{latencyMs || 0} ms</span>
          </div>
        </div>

        {/* Top-Right: Offline Status Pill & Overlay Controls */}
        <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-background/85 backdrop-blur-md border border-brand-emerald/40 text-[11px] font-mono text-brand-emerald font-semibold shadow-lg pointer-events-none">
            <Database className="w-3.5 h-3.5" />
            <span>EDGE DB ACTIVE</span>
          </div>

          <div className="flex items-center gap-1 pointer-events-auto bg-background/80 backdrop-blur-md p-1 rounded-xl border border-surface-200">
            <button
              onClick={() => updateSettings({ cameraMirror: !settings.cameraMirror })}
              className={`p-1.5 rounded-lg transition-colors text-xs ${
                settings.cameraMirror ? 'bg-surface-300 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Mirror Camera Horizontal"
            >
              <FlipHorizontal className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => updateSettings({ drawLandmarks: !settings.drawLandmarks })}
              className={`p-1.5 rounded-lg transition-colors text-xs ${
                settings.drawLandmarks ? 'bg-brand-emerald/20 text-brand-emerald' : 'text-slate-400 hover:text-white'
              }`}
              title="Toggle Skeleton Overlay"
            >
              <Layers className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Finger Status Indicators */}
        {fExt && cameraActive && (
          <div className="absolute top-12 left-3 z-20 pointer-events-none hidden sm:flex items-center gap-1 bg-background/85 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-surface-200 text-[10px] font-mono shadow-md">
            <span className="text-slate-400 mr-1 flex items-center gap-1">
              <Hand className="w-3 h-3 text-brand-emerald" /> Fingers:
            </span>
            <span className={`px-1.5 py-0.5 rounded font-bold ${fExt.thumb > 0.5 ? 'bg-brand-emerald/20 text-brand-emerald' : 'bg-surface-200 text-slate-500'}`}>
              T
            </span>
            <span className={`px-1.5 py-0.5 rounded font-bold ${fExt.index > 0.5 ? 'bg-brand-emerald/20 text-brand-emerald' : 'bg-surface-200 text-slate-500'}`}>
              I
            </span>
            <span className={`px-1.5 py-0.5 rounded font-bold ${fExt.middle > 0.5 ? 'bg-brand-emerald/20 text-brand-emerald' : 'bg-surface-200 text-slate-500'}`}>
              M
            </span>
            <span className={`px-1.5 py-0.5 rounded font-bold ${fExt.ring > 0.5 ? 'bg-brand-emerald/20 text-brand-emerald' : 'bg-surface-200 text-slate-500'}`}>
              R
            </span>
            <span className={`px-1.5 py-0.5 rounded font-bold ${fExt.pinky > 0.5 ? 'bg-brand-emerald/20 text-brand-emerald' : 'bg-surface-200 text-slate-500'}`}>
              P
            </span>
            {telemetry.detectedShape && telemetry.detectedShape !== 'UNKNOWN' && (
              <span className="ml-1.5 px-2 py-0.5 rounded bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/30 font-semibold">
                {telemetry.detectedShape}
              </span>
            )}
          </div>
        )}

        {/* Bottom-Center: Floating Active Sign Pill */}
        <div className="absolute bottom-3 left-3 right-3 z-20">
          <div className="p-3.5 rounded-xl bg-background/90 backdrop-blur-md border border-surface-200/80 shadow-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-bold shadow-inner ${
                  activeSignDef
                    ? 'bg-gradient-to-tr from-brand-emeraldDark to-brand-emerald text-white'
                    : 'bg-surface-100 text-slate-500 border border-surface-200'
                }`}
              >
                {activeSignDef ? activeSignDef.emoji : '❓'}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base text-white tracking-wide">
                    {activeSignDef ? activeSignDef.label : 'Scanning Gestures...'}
                  </span>
                  {activeSignDef && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-brand-emerald/20 text-brand-emerald border border-brand-emerald/30 font-semibold uppercase">
                      {activeSignDef.category}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-400">
                  {activeSignDef
                    ? activeSignDef.hindiTranslation
                    : 'Position hand clearly in camera view'}
                </p>
              </div>
            </div>

            {/* Confidence & Stabilization Progress Bar */}
            <div className="flex flex-col items-end gap-1.5 min-w-[130px]">
              <div className="flex items-center gap-1.5 text-xs font-mono">
                <span className="text-slate-400">Confidence:</span>
                <span
                  className={`font-semibold ${
                    confidencePct >= 75
                      ? 'text-brand-emerald'
                      : confidencePct >= 50
                      ? 'text-brand-amber'
                      : 'text-slate-500'
                  }`}
                >
                  {confidencePct}%
                </span>
              </div>

              <div className="w-full h-2 rounded-full bg-surface-100 overflow-hidden border border-surface-200">
                <div
                  className="h-full bg-gradient-to-r from-brand-cyan to-brand-emerald transition-all duration-75"
                  style={{ width: `${confidencePct}%` }}
                />
              </div>

              <span className="text-[10px] text-slate-500 font-mono">
                {isStabilized
                  ? '✓ Gesture Stabilized'
                  : confidencePct > 0
                  ? `Tracking (${confidencePct}%)`
                  : 'Hold for commit'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
