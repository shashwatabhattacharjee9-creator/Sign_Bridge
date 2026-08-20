'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSignBridgeStore } from '@/store/useSignBridgeStore';
import { MediaPipePipeline } from '@/lib/mediapipe/landmarkExtractor';
import { adaptiveMatcher } from '@/lib/engine/adaptiveMatcher';
import { TemporalBuffer } from '@/lib/engine/temporalBuffer';
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
  Lock,
  Target,
  CheckCircle2,
} from 'lucide-react';

export const VisionCanvas: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const pipelineRef = useRef<MediaPipePipeline | null>(null);
  const temporalBufferRef = useRef<TemporalBuffer>(new TemporalBuffer(30));

  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  // Throttled React state dispatching
  const lastStateDispatchRef = useRef<number>(0);
  const lastCommittedSignRef = useRef<string>('IDLE');

  // Store bindings
  const {
    currentSign,
    confidence,
    fps,
    latencyMs,
    detectionState,
    trackingSign,
    commitProgress,
    confidenceThreshold,
    setTracking,
    updateTelemetry,
    setClassification,
    addToken,
    practice,
    updatePracticeProgress,
    settings,
    updateSettings,
    telemetry,
  } = useSignBridgeStore();

  useEffect(() => {
    if (pipelineRef.current) {
      pipelineRef.current.updateConfig({
        enablePose: settings.enablePose,
        drawLandmarks: settings.drawLandmarks,
        isMirrored: settings.cameraMirror,
      });
    }
  }, [settings]);

  const handleFrame = useCallback(
    (frameData: any, calculatedFps: number, currentLatency: number) => {
      const now = performance.now();

      // Expose latest landmarks for QuickCalibrator live recording
      const pHand = frameData.rightHand || frameData.leftHand;
      if (pHand && typeof window !== 'undefined') {
        if (pHand.vector63) (window as any).__SIGNBRIDGE_LATEST_VECTOR_63__ = pHand.vector63;
        if (pHand.fingerExtensions) (window as any).__SIGNBRIDGE_LATEST_EXTENSIONS__ = [
          pHand.fingerExtensions.thumb,
          pHand.fingerExtensions.index,
          pHand.fingerExtensions.middle,
          pHand.fingerExtensions.ring,
          pHand.fingerExtensions.pinky,
        ];
        if (pHand.rawLandmarks) (window as any).__SIGNBRIDGE_LATEST_RAW_LANDMARKS__ = pHand.rawLandmarks;
      }

      // Ingest frame into circular temporal buffer
      temporalBufferRef.current.push(frameData);

      // Run In-Browser Adaptive DTW & Hysteresis Matching Engine
      const { result, matcherState } = adaptiveMatcher.evaluateFrame(
        frameData,
        temporalBufferRef.current
      );

      // Handle token commitment
      if (matcherState.isCommitted && matcherState.committedSign && matcherState.committedSign !== 'IDLE') {
        addToken(matcherState.committedSign, result.confidence);

        edgeDatabase.logGesture({
          timestamp: Date.now(),
          sign: matcherState.committedSign,
          confidence: result.confidence,
          latencyMs: result.latencyMs,
          motionDetected: result.motionDetected ?? false,
          fps: calculatedFps || 30,
          dominantHand: 'right',
        });
      }

      // Handle practice arena matching
      if (practice && practice.signId) {
        const isMatch = matcherState.currentSign === practice.signId;
        updatePracticeProgress(isMatch);
      }

      // Throttled UI State Synchronization (<= 10 Hz) or immediate on gesture transitions
      const isSignTransition = matcherState.currentSign !== lastCommittedSignRef.current;
      const isDispatchDue = now - lastStateDispatchRef.current >= 90;

      if (isSignTransition || isDispatchDue || matcherState.isCommitted) {
        lastStateDispatchRef.current = now;
        lastCommittedSignRef.current = matcherState.currentSign;

        const currentDetectionState: 'IDLE' | 'TRACKING' | 'COMMITTED' =
          matcherState.isCommitted
            ? 'COMMITTED'
            : matcherState.currentSign === 'IDLE'
            ? 'IDLE'
            : 'TRACKING';

        setClassification(result, matcherState.commitProgress, currentDetectionState);

        const handsCount = (frameData.rightHand ? 1 : 0) + (frameData.leftHand ? 1 : 0);
        updateTelemetry({
          fps: calculatedFps,
          latencyMs: result.latencyMs || currentLatency,
          confidence: Math.round(result.confidence * 100),
          handsCount,
          poseDetected: !!frameData.pose,
          bufferDepth: temporalBufferRef.current.size(),
          activeSign: matcherState.currentSign === 'IDLE' ? 'NONE' : matcherState.currentSign,
          detectedShape: pHand?.detectedShape,
          fingerExtensions: pHand?.fingerExtensions,
          phase: result.phase,
          kineticEnergy: result.kineticEnergy,
          detectionState: currentDetectionState,
        });
      }
    },
    [setClassification, updateTelemetry, addToken, practice, updatePracticeProgress]
  );

  useEffect(() => {
    let stream: MediaStream | null = null;
    let isMounted = true;

    async function startVision() {
      setIsInitializing(true);
      setCameraError(null);

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
  const currentPhase = telemetry.phase || 'REST';

  const fpsColorClass =
    fps >= 24
      ? 'text-brand-emerald bg-surface-100/90 border-brand-emerald/30'
      : fps >= 15
      ? 'text-brand-amber bg-surface-100/90 border-brand-amber/30'
      : 'text-red-400 bg-surface-100/90 border-red-500/30';

  const confidencePct = Math.round(confidence * 100);
  const progressPct = Math.round(commitProgress * 100);

  return (
    <div className="relative w-full flex flex-col items-center justify-center bg-surface-100 rounded-2xl border border-surface-200 overflow-hidden shadow-2xl">
      {/* 16:9 Responsive Viewport Container */}
      <div className="relative w-full aspect-[16/9] max-h-[480px] bg-black flex items-center justify-center overflow-hidden">
        {/* Video Stream */}
        <video
          ref={videoRef}
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover ${
            settings.cameraMirror ? '-scale-x-100' : ''
          } ${cameraActive ? 'opacity-100' : 'opacity-0'}`}
        />

        {/* 2D Canvas Skeletal Overlay (Hardware-Accelerated 60 FPS) */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10"
        />

        {/* Initializing Spinner */}
        {isInitializing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-50/90 z-20 space-y-3">
            <div className="w-10 h-10 border-3 border-surface-200 border-t-brand-emerald rounded-full animate-spin" />
            <p className="text-xs font-mono text-slate-300">Initializing Vision & DTW Matcher...</p>
          </div>
        )}

        {/* Error Screen */}
        {cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-50/95 z-20 p-6 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center">
              <CameraOff className="w-5 h-5" />
            </div>
            <h4 className="text-white font-bold text-sm">Camera Unavailable</h4>
            <p className="text-xs text-slate-400 max-w-xs">{cameraError}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-surface-200 hover:bg-surface-300 text-xs text-white rounded-xl font-medium"
            >
              Retry Camera
            </button>
          </div>
        )}

        {/* HUD Top-Left: FPS Badge & Latency */}
        <div className="absolute top-3 left-3 flex items-center gap-2 z-20 pointer-events-none font-mono text-xs">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border backdrop-blur-md ${fpsColorClass}`}>
            <Gauge className="w-3.5 h-3.5" />
            <span className="font-bold">{fps || 30} FPS</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-surface-100/90 backdrop-blur-md border border-surface-200 text-slate-200">
            <Timer className="w-3.5 h-3.5 text-brand-cyan" />
            <span>{latencyMs || 12} ms</span>
          </div>
        </div>

        {/* HUD Top-Right: Adaptive Detection State Pill & Controls */}
        <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
          {/* Dynamic Detection State Badge */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-mono font-bold shadow-md backdrop-blur-md transition-all ${
              detectionState === 'COMMITTED'
                ? 'bg-brand-emerald text-slate-950 border-brand-emerald animate-bounce'
                : detectionState === 'TRACKING'
                ? 'bg-brand-amber/20 text-brand-amber border-brand-amber/50 animate-pulse'
                : 'bg-slate-900/80 text-slate-400 border-slate-700'
            }`}
          >
            {detectionState === 'COMMITTED' ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>COMMITTED: {currentSign}</span>
              </>
            ) : detectionState === 'TRACKING' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-brand-amber animate-ping" />
                <span>TRACKING: {currentSign} ({progressPct}%)</span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                <span>IDLE (REST)</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-1 pointer-events-auto bg-surface-100/90 backdrop-blur-md p-1 rounded-xl border border-surface-200">
            <button
              onClick={() => updateSettings({ cameraMirror: !settings.cameraMirror })}
              className={`p-1.5 rounded-lg transition-colors text-xs ${
                settings.cameraMirror ? 'bg-surface-200 text-white' : 'text-slate-400 hover:text-white'
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

        {/* HUD Bottom: Floating Active Sign Pill */}
        <div className="absolute bottom-3 left-3 right-3 z-20">
          <div className="p-3 rounded-xl bg-surface-100/90 backdrop-blur-md border border-surface-200/90 shadow-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl font-bold shadow-inner transition-colors ${
                  detectionState === 'COMMITTED'
                    ? 'bg-brand-emerald text-slate-950 scale-105 shadow-brand-emerald/40'
                    : activeSignDef
                    ? 'bg-gradient-to-tr from-brand-emeraldDark to-brand-emerald text-white shadow-brand-emerald/30'
                    : 'bg-surface-50 text-slate-400 border border-surface-200'
                }`}
              >
                {activeSignDef ? activeSignDef.emoji : '✋'}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white tracking-wide">
                    {activeSignDef ? activeSignDef.label : 'Waiting for gesture in signing zone...'}
                  </span>
                  {activeSignDef && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-brand-emerald/15 text-brand-emerald border border-brand-emerald/30 font-bold uppercase">
                      {activeSignDef.category}
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-400">
                  {activeSignDef ? activeSignDef.hindiTranslation : 'Elevate hand to chest/face area to initiate sign'}
                </p>
              </div>
            </div>

            {/* Confidence & Progress Bar */}
            <div className="flex flex-col items-end gap-1 min-w-[130px]">
              <div className="flex items-center gap-1.5 text-xs font-mono">
                <span className="text-slate-400">Match:</span>
                <span
                  className={`font-bold ${
                    confidencePct >= 74
                      ? 'text-brand-emerald'
                      : confidencePct >= 58
                      ? 'text-brand-amber'
                      : 'text-slate-400'
                  }`}
                >
                  {confidencePct}%
                </span>
              </div>

              {/* Progress Arc / Bar */}
              <div className="w-full h-2 rounded-full bg-surface-200 overflow-hidden">
                <div
                  className={`h-full transition-all duration-100 ${
                    detectionState === 'COMMITTED'
                      ? 'bg-brand-emerald'
                      : 'bg-gradient-to-r from-brand-amber to-brand-emerald'
                  }`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              <span className="text-[9px] text-slate-400 font-mono">
                {detectionState === 'COMMITTED'
                  ? '✓ Token Added'
                  : detectionState === 'TRACKING'
                  ? `Hold Steady (${progressPct}%)`
                  : 'Hysteresis Gated'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
