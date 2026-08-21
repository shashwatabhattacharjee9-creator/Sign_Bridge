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
  Maximize2,
  Scan,
} from 'lucide-react';

export const VisionCanvas: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const pipelineRef = useRef<MediaPipePipeline | null>(null);
  const temporalBufferRef = useRef<TemporalBuffer>(new TemporalBuffer(30));

  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  // Throttled state dispatching
  const lastStateDispatchRef = useRef<number>(0);
  const lastCommittedSignRef = useRef<string>('IDLE');

  // Store bindings
  const {
    currentSign,
    confidence,
    fps,
    latencyMs,
    detectionState,
    commitProgress,
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
            ? 'Camera access permission denied. Please allow camera access in browser.'
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
  const confidencePct = Math.round(confidence * 100);
  const progressPct = Math.round(commitProgress * 100);

  return (
    <div className="relative w-full flex flex-col items-center justify-center bg-[#0C111C]/90 rounded-3xl border border-white/[0.08] overflow-hidden shadow-2xl backdrop-blur-xl group">
      {/* 16:9 Cinema-Grade Viewport Container */}
      <div className="relative w-full aspect-[16/9] max-h-[480px] bg-black flex items-center justify-center overflow-hidden">
        {/* Corner Tech Reticle Overlay */}
        <div className="absolute top-3 left-3 w-3 h-3 border-t-2 border-l-2 border-white/20 z-20 pointer-events-none rounded-tl" />
        <div className="absolute top-3 right-3 w-3 h-3 border-t-2 border-r-2 border-white/20 z-20 pointer-events-none rounded-tr" />
        <div className="absolute bottom-3 left-3 w-3 h-3 border-b-2 border-l-2 border-white/20 z-20 pointer-events-none rounded-bl" />
        <div className="absolute bottom-3 right-3 w-3 h-3 border-b-2 border-r-2 border-white/20 z-20 pointer-events-none rounded-br" />

        {/* Video Stream */}
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

        {/* Initializing Spinner */}
        {isInitializing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#07090E]/90 backdrop-blur-md z-20 space-y-3">
            <div className="w-11 h-11 border-2 border-white/10 border-t-emerald-400 rounded-full animate-spin" />
            <p className="text-xs font-mono text-slate-300 tracking-wide">Starting Local Vision Pipeline...</p>
          </div>
        )}

        {/* Error Screen */}
        {cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#07090E]/95 z-20 p-6 text-center space-y-3">
            <div className="w-11 h-11 rounded-2xl bg-red-500/15 text-red-400 flex items-center justify-center border border-red-500/30">
              <CameraOff className="w-5 h-5" />
            </div>
            <h4 className="text-white font-semibold text-sm">Camera Unavailable</h4>
            <p className="text-xs text-slate-400 max-w-xs">{cameraError}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2 bg-white/10 hover:bg-white/20 text-xs text-white rounded-xl font-medium transition-all"
            >
              Retry Camera
            </button>
          </div>
        )}

        {/* HUD Top-Left: Glass Metrics (FPS & Latency) */}
        <div className="absolute top-4 left-4 flex items-center gap-2 z-20 pointer-events-none font-mono text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-lg text-white">
            <span className={`w-2 h-2 rounded-full ${fps >= 24 ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className="font-semibold text-[11px]">{fps || 30} FPS</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-lg text-cyan-300 text-[11px]">
            <Timer className="w-3 h-3 text-cyan-400" />
            <span>{latencyMs || 12}ms</span>
          </div>
        </div>

        {/* HUD Top-Right: State Indicator & Controls */}
        <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
          {/* Dynamic Detection State Badge */}
          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-mono font-semibold shadow-xl backdrop-blur-xl transition-all ${
              detectionState === 'COMMITTED'
                ? 'bg-emerald-400 text-slate-950 border-emerald-300 scale-105 shadow-emerald-950/50'
                : detectionState === 'TRACKING'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-black/50 text-slate-400 border-white/10'
            }`}
          >
            {detectionState === 'COMMITTED' ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>COMMITTED</span>
              </>
            ) : detectionState === 'TRACKING' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>TRACKING: {currentSign}</span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                <span>SCANNING</span>
              </>
            )}
          </div>

          {/* Quick Controls */}
          <div className="flex items-center gap-1 pointer-events-auto bg-black/50 backdrop-blur-xl p-1 rounded-xl border border-white/10 shadow-lg">
            <button
              onClick={() => updateSettings({ cameraMirror: !settings.cameraMirror })}
              className={`p-1.5 rounded-lg transition-all text-xs ${
                settings.cameraMirror ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Mirror Camera Horizontal"
            >
              <FlipHorizontal className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => updateSettings({ drawLandmarks: !settings.drawLandmarks })}
              className={`p-1.5 rounded-lg transition-all text-xs ${
                settings.drawLandmarks ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-white'
              }`}
              title="Toggle Skeleton Overlay"
            >
              <Layers className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* HUD Bottom: Floating Luxury Sign Card */}
        <div className="absolute bottom-4 left-4 right-4 z-20">
          <div className="p-3.5 rounded-2xl bg-black/60 backdrop-blur-2xl border border-white/10 shadow-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-inner transition-all ${
                  detectionState === 'COMMITTED'
                    ? 'bg-emerald-400 text-slate-950 scale-105 shadow-emerald-400/30'
                    : activeSignDef
                    ? 'bg-gradient-to-tr from-emerald-500/30 to-cyan-500/30 text-white border border-white/15'
                    : 'bg-white/[0.04] text-slate-400 border border-white/[0.06]'
                }`}
              >
                {activeSignDef ? activeSignDef.emoji : '✋'}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm sm:text-base text-white tracking-tight">
                    {activeSignDef ? activeSignDef.label : 'Waiting for gesture in frame...'}
                  </span>
                  {activeSignDef && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold uppercase">
                      {activeSignDef.category}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-400 mt-0.5">
                  {activeSignDef ? activeSignDef.hindiTranslation : 'Elevate hand to chest or face area to sign'}
                </p>
              </div>
            </div>

            {/* Confidence & Commit Progress Bar */}
            <div className="flex flex-col items-end gap-1.5 min-w-[130px]">
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-slate-400 text-[11px]">Match:</span>
                <span
                  className={`font-bold ${
                    confidencePct >= 74
                      ? 'text-emerald-400'
                      : confidencePct >= 58
                      ? 'text-amber-400'
                      : 'text-slate-400'
                  }`}
                >
                  {confidencePct}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className={`h-full transition-all duration-100 rounded-full ${
                    detectionState === 'COMMITTED'
                      ? 'bg-emerald-400'
                      : 'bg-gradient-to-r from-amber-400 via-emerald-400 to-cyan-400'
                  }`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              <span className="text-[10px] text-slate-400 font-mono">
                {detectionState === 'COMMITTED'
                  ? '✓ Token Committed'
                  : detectionState === 'TRACKING'
                  ? `Holding: ${progressPct}%`
                  : 'Hysteresis Ready'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
