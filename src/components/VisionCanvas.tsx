'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSignBridgeStore } from '@/store/useSignBridgeStore';
import { MediaPipePipeline } from '@/lib/mediapipe/landmarkExtractor';
import { VisionProcessorBridge } from '@/lib/engine/workerBridge';
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
} from 'lucide-react';

export const VisionCanvas: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const pipelineRef = useRef<MediaPipePipeline | null>(null);
  const workerBridgeRef = useRef<VisionProcessorBridge | null>(null);

  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  // Performance: Throttle React state dispatches to <= 10 Hz (100ms)
  const lastStateDispatchRef = useRef<number>(0);
  const lastCommittedSignRef = useRef<string>('IDLE');

  // Store bindings
  const {
    currentSign,
    confidence,
    fps,
    latencyMs,
    isStabilized,
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
    if (workerBridgeRef.current) {
      workerBridgeRef.current.updateConfig(confidenceThreshold, settings.debounceFrames);
    }
    if (pipelineRef.current) {
      pipelineRef.current.updateConfig({
        enablePose: settings.enablePose,
        drawLandmarks: settings.drawLandmarks,
        isMirrored: settings.cameraMirror,
      });
    }
  }, [confidenceThreshold, settings]);

  const handleWorkerResult = useCallback(
    (
      result: any,
      commitInfo: { shouldCommit: boolean; committedSign: any; progressPercentage: number },
      telemetryPartial: any
    ) => {
      const now = performance.now();
      const stabilizedSign = result.sign;

      if (commitInfo.shouldCommit && commitInfo.committedSign && commitInfo.committedSign !== 'IDLE') {
        addToken(commitInfo.committedSign, result.confidence);

        edgeDatabase.logGesture({
          timestamp: Date.now(),
          sign: commitInfo.committedSign,
          confidence: result.confidence,
          latencyMs: result.latencyMs,
          motionDetected: result.motionDetected ?? false,
          fps: telemetry.fps || 30,
          dominantHand: 'right',
        });
      }

      if (practice && practice.signId) {
        const isMatch = stabilizedSign === practice.signId;
        updatePracticeProgress(isMatch);
      }

      // Throttled UI State Synchronization (<= 10 Hz) or immediate on gesture transition
      const isSignTransition = stabilizedSign !== lastCommittedSignRef.current;
      const isDispatchDue = now - lastStateDispatchRef.current >= 100;

      if (isSignTransition || isDispatchDue || commitInfo.shouldCommit) {
        lastStateDispatchRef.current = now;
        lastCommittedSignRef.current = stabilizedSign;

        setClassification(result, commitInfo.progressPercentage);
        updateTelemetry(telemetryPartial);
      }
    },
    [setClassification, updateTelemetry, addToken, practice, updatePracticeProgress, telemetry.fps]
  );

  const handleFrame = useCallback(
    (frameData: any, calculatedFps: number, currentLatency: number) => {
      // Expose vector for Calibration Studio recording
      const pHand = frameData.rightHand || frameData.leftHand;
      if (pHand && pHand.vector63 && typeof window !== 'undefined') {
        (window as any).__SIGNBRIDGE_LATEST_VECTOR_63__ = pHand.vector63;
      }

      // Route frame processing to dedicated Web Worker
      if (workerBridgeRef.current) {
        workerBridgeRef.current.processFrame(frameData);
      }
    },
    []
  );

  useEffect(() => {
    let stream: MediaStream | null = null;
    let isMounted = true;

    async function startVision() {
      setIsInitializing(true);
      setCameraError(null);

      await edgeDatabase.initialize();

      // Initialize Web Worker Bridge
      const bridge = new VisionProcessorBridge();
      bridge.setCallback({
        onResult: handleWorkerResult,
      });
      bridge.updateConfig(confidenceThreshold, settings.debounceFrames);
      workerBridgeRef.current = bridge;
      if (typeof window !== 'undefined') {
        (window as any).__SIGNBRIDGE_WORKER_BRIDGE__ = bridge;
      }

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
      if (workerBridgeRef.current) {
        workerBridgeRef.current.destroy();
        workerBridgeRef.current = null;
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [handleFrame, handleWorkerResult, settings.enablePose, settings.drawLandmarks, settings.cameraMirror, setTracking]);

  const activeSignDef = currentSign && currentSign !== 'IDLE' ? ISL_VOCABULARY[currentSign] : null;
  const currentPhase = telemetry.phase || 'REST';

  const phaseBadgeClass =
    currentPhase === 'STROKE'
      ? 'bg-brand-emerald/20 text-brand-emerald border-brand-emerald/40'
      : currentPhase === 'PREPARATION'
      ? 'bg-brand-cyan/20 text-brand-cyan border-brand-cyan/40'
      : currentPhase === 'RETRACTION'
      ? 'bg-brand-amber/20 text-brand-amber border-brand-amber/40'
      : 'bg-slate-800 text-slate-400 border-slate-700';

  const fpsColorClass =
    fps >= 24
      ? 'text-brand-emerald bg-surface-100/90 border-brand-emerald/30'
      : fps >= 15
      ? 'text-brand-amber bg-surface-100/90 border-brand-amber/30'
      : 'text-red-400 bg-surface-100/90 border-red-500/30';

  const confidencePct = Math.round(confidence * 100);

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
            <p className="text-xs font-mono text-slate-300">Initializing Web Worker Vision Loop...</p>
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
            <span>{latencyMs || 18} ms</span>
          </div>
        </div>

        {/* HUD Top-Right: Phase State & Controls */}
        <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-mono font-bold shadow-sm backdrop-blur-md ${phaseBadgeClass}`}>
            <span>PHASE: {currentPhase}</span>
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
                className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl font-bold shadow-inner ${
                  activeSignDef
                    ? 'bg-gradient-to-tr from-brand-emeraldDark to-brand-emerald text-white shadow-brand-emerald/30'
                    : 'bg-surface-50 text-slate-400 border border-surface-200'
                }`}
              >
                {activeSignDef ? activeSignDef.emoji : '✋'}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white tracking-wide">
                    {activeSignDef ? activeSignDef.label : currentPhase === 'REST' ? 'Hands Resting (NULL)' : 'Scanning Signs...'}
                  </span>
                  {activeSignDef && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-brand-emerald/15 text-brand-emerald border border-brand-emerald/30 font-bold uppercase">
                      {activeSignDef.category}
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-400">
                  {activeSignDef ? activeSignDef.hindiTranslation : 'Place hands in camera frame to initiate sign'}
                </p>
              </div>
            </div>

            {/* Confidence & Progress Bar */}
            <div className="flex flex-col items-end gap-1 min-w-[120px]">
              <div className="flex items-center gap-1.5 text-xs font-mono">
                <span className="text-slate-400">Confidence:</span>
                <span
                  className={`font-bold ${
                    confidencePct >= 85
                      ? 'text-brand-emerald'
                      : confidencePct >= 60
                      ? 'text-brand-amber'
                      : 'text-slate-400'
                  }`}
                >
                  {confidencePct}%
                </span>
              </div>

              <div className="w-full h-2 rounded-full bg-surface-200 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brand-cyan to-brand-emerald transition-all duration-75"
                  style={{ width: `${confidencePct}%` }}
                />
              </div>

              <span className="text-[9px] text-slate-500 font-mono">
                {isStabilized ? '✓ Stabilized' : 'Orthonormal Gated'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
