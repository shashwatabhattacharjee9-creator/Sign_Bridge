'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSignBridgeStore } from '@/store/useSignBridgeStore';
import { ISL_SIGNS_LIST, ISL_VOCABULARY, anchorRegistry } from '@/lib/engine/gestureLibrary';
import { ISLSign, SignAnchor } from '@/types/isl';
import { edgeDatabase } from '@/lib/storage/edgeDatabase';
import {
  Activity,
  Award,
  CheckCircle2,
  ChevronRight,
  Clock,
  Database,
  Download,
  Flame,
  Gauge,
  GraduationCap,
  Play,
  Radio,
  RefreshCw,
  RotateCcw,
  Sliders,
  Sparkles,
  Target,
  Upload,
  Zap,
} from 'lucide-react';

export const CalibrationStudio: React.FC = () => {
  const { telemetry, currentSign, confidence } = useSignBridgeStore();

  const [selectedSign, setSelectedSign] = useState<ISLSign>('HELP');
  const [recordingState, setRecordingState] = useState<'IDLE' | 'COUNTDOWN' | 'RECORDING' | 'COMPLETED'>('IDLE');
  const [countdown, setCountdown] = useState<number>(3);
  const [recordedFrames, setRecordedFrames] = useState<number[][]>([]);
  const [targetFrameCount] = useState<number>(60);
  const [calculatedAnchor, setCalculatedAnchor] = useState<SignAnchor | null>(null);
  const [allCustomAnchors, setAllCustomAnchors] = useState<Record<string, SignAnchor>>({});
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  const isRecordingRef = useRef<boolean>(false);
  const bufferRef = useRef<number[][]>([]);

  useEffect(() => {
    setAllCustomAnchors(anchorRegistry.getAllAnchors());
  }, []);

  const startCalibrationSequence = () => {
    setRecordingState('COUNTDOWN');
    setCountdown(3);
    bufferRef.current = [];
    setRecordedFrames([]);
    setCalculatedAnchor(null);

    let count = 3;
    const countTimer = setInterval(() => {
      count -= 1;
      setCountdown(count);
      if (count <= 0) {
        clearInterval(countTimer);
        setRecordingState('RECORDING');
        isRecordingRef.current = true;
      }
    }, 1000);
  };

  // Capture frames from store/worker during active recording
  useEffect(() => {
    if (recordingState !== 'RECORDING') return;

    const interval = setInterval(() => {
      // Ingest recent normalized vector
      const currentVector = (window as any).__SIGNBRIDGE_LATEST_VECTOR_63__;
      if (currentVector && Array.isArray(currentVector) && currentVector.length === 63) {
        bufferRef.current.push([...currentVector]);
        setRecordedFrames([...bufferRef.current]);

        if (bufferRef.current.length >= targetFrameCount) {
          isRecordingRef.current = false;
          finishCalibration(bufferRef.current);
          clearInterval(interval);
        }
      }
    }, 33);

    return () => clearInterval(interval);
  }, [recordingState, targetFrameCount]);

  const finishCalibration = (frames: number[][]) => {
    if (frames.length === 0) return;

    // 1. Compute Centroid Mean Vector: V_anchor = (1/N) * sum(V_i)
    const centroid = new Array(63).fill(0);
    const variance = new Array(63).fill(0);
    const N = frames.length;

    for (let i = 0; i < N; i++) {
      const vec = frames[i];
      for (let k = 0; k < 63; k++) {
        centroid[k] += vec[k];
      }
    }
    for (let k = 0; k < 63; k++) {
      centroid[k] = centroid[k] / N;
    }

    // 2. Compute Variance Bounds: sigma^2 = (1/N) * sum (V_ik - C_k)^2
    for (let i = 0; i < N; i++) {
      const vec = frames[i];
      for (let k = 0; k < 63; k++) {
        variance[k] += Math.pow(vec[k] - centroid[k], 2);
      }
    }
    for (let k = 0; k < 63; k++) {
      variance[k] = Number((variance[k] / N).toFixed(5));
      centroid[k] = Number(centroid[k].toFixed(4));
    }

    const anchor: SignAnchor = {
      sign: selectedSign,
      vector63: centroid,
      twoHanded: ISL_VOCABULARY[selectedSign]?.twoHanded || false,
      variance,
      sampleCount: N,
      lastUpdated: Date.now(),
    };

    setCalculatedAnchor(anchor);
    setRecordingState('COMPLETED');

    // Hot-reload into in-memory anchor registry and notify active worker
    anchorRegistry.updateAnchor(anchor);
    if ((window as any).__SIGNBRIDGE_WORKER_BRIDGE__) {
      (window as any).__SIGNBRIDGE_WORKER_BRIDGE__.updateAnchors(anchorRegistry.getAllAnchors());
    }

    setAllCustomAnchors(anchorRegistry.getAllAnchors());
    setExportMessage(`Successfully calibrated and hot-loaded "${selectedSign}"!`);
    setTimeout(() => setExportMessage(null), 4000);
  };

  const handleExportJSON = () => {
    const dataset = {
      version: '2.0.0',
      exportedAt: Date.now(),
      anchors: allCustomAnchors,
    };
    const jsonStr = JSON.stringify(dataset, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `isl_anchors_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.anchors) {
          anchorRegistry.loadAnchors(parsed.anchors);
          if ((window as any).__SIGNBRIDGE_WORKER_BRIDGE__) {
            (window as any).__SIGNBRIDGE_WORKER_BRIDGE__.updateAnchors(parsed.anchors);
          }
          setAllCustomAnchors(anchorRegistry.getAllAnchors());
          setExportMessage('Calibration profile imported and applied successfully!');
          setTimeout(() => setExportMessage(null), 4000);
        }
      } catch (err) {
        alert('Invalid JSON calibration dataset file.');
      }
    };
    reader.readAsText(file);
  };

  const activeDef = ISL_VOCABULARY[selectedSign];
  const progressPct = Math.round((recordedFrames.length / targetFrameCount) * 100);

  return (
    <div className="bg-surface-100 border border-surface-200 rounded-2xl p-5 shadow-xl space-y-6 text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-surface-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-cyan/15 text-brand-cyan flex items-center justify-center border border-brand-cyan/30 shadow-inner">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white tracking-wide">
              ISL Anchor Calibration Studio
            </h3>
            <p className="text-xs text-slate-400">
              Record 60-frame orthonormal anchor clusters and hot-reload canonical vectors
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-50 hover:bg-surface-200 border border-surface-200 text-xs font-mono text-slate-300 cursor-pointer transition-colors">
            <Upload className="w-3.5 h-3.5 text-brand-cyan" />
            <span>Import Profile</span>
            <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
          </label>

          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-50 hover:bg-surface-200 border border-surface-200 text-xs font-mono text-brand-emerald transition-colors"
            title="Download full anchors dataset as JSON"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {exportMessage && (
        <div className="p-3 rounded-xl bg-brand-emerald/10 border border-brand-emerald/30 text-brand-emerald text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{exportMessage}</span>
        </div>
      )}

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Sign Selector & Recording Controls */}
        <div className="lg:col-span-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Select Target Gesture to Calibrate:
            </label>
            <select
              value={selectedSign}
              onChange={(e) => setSelectedSign(e.target.value as ISLSign)}
              disabled={recordingState === 'COUNTDOWN' || recordingState === 'RECORDING'}
              className="w-full bg-surface-50 border border-surface-200 rounded-xl p-2.5 text-white font-mono text-xs focus:outline-none focus:border-brand-cyan"
            >
              {ISL_SIGNS_LIST.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.emoji} {s.label} ({s.id})
                </option>
              ))}
            </select>
          </div>

          {/* Active Sign Info Card */}
          <div className="p-4 rounded-xl bg-surface-50 border border-surface-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-3xl">{activeDef?.emoji}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-surface-200 text-slate-300">
                {activeDef?.twoHanded ? 'Two-Handed' : 'Single Hand'}
              </span>
            </div>
            <h4 className="font-bold text-white text-sm">{activeDef?.label}</h4>
            <p className="text-xs text-brand-emerald font-medium">{activeDef?.hindiTranslation}</p>
            <p className="text-xs text-slate-400 leading-relaxed">{activeDef?.description}</p>
          </div>

          {/* Action Trigger */}
          <div className="space-y-3">
            {recordingState === 'IDLE' && (
              <button
                onClick={startCalibrationSequence}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-emerald hover:opacity-90 text-slate-950 font-bold text-xs shadow-lg shadow-brand-emerald/15 transition-all flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Start 60-Frame Recording</span>
              </button>
            )}

            {recordingState === 'COUNTDOWN' && (
              <div className="w-full py-4 text-center rounded-xl bg-brand-amber/15 border border-brand-amber/30 text-brand-amber font-mono font-bold text-lg animate-pulse">
                Get Ready: Starting in {countdown}s...
              </div>
            )}

            {recordingState === 'RECORDING' && (
              <div className="p-4 rounded-xl bg-surface-50 border border-brand-cyan/40 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-brand-cyan font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-brand-cyan animate-ping" />
                    Recording Orthonormal Vectors:
                  </span>
                  <span className="text-white font-bold">{progressPct}%</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-surface-200 overflow-hidden">
                  <div
                    className="h-full bg-brand-cyan transition-all duration-75"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-400 text-center font-mono">
                  Captured {recordedFrames.length} / {targetFrameCount} frames
                </p>
              </div>
            )}

            {recordingState === 'COMPLETED' && (
              <button
                onClick={startCalibrationSequence}
                className="w-full py-3 px-4 rounded-xl bg-surface-50 hover:bg-surface-200 border border-surface-200 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4 text-brand-cyan" />
                <span>Re-Record Calibration</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Cluster Statistics & Variance Heatmap */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-4 rounded-xl bg-surface-50 border border-surface-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-brand-emerald" />
                Live Cluster Centroid & Variance:
              </span>
              {calculatedAnchor && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-brand-emerald/20 text-brand-emerald border border-brand-emerald/30 font-bold">
                  ✓ Hot-Loaded (63D)
                </span>
              )}
            </div>

            {calculatedAnchor ? (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                  <div className="p-2 rounded-lg bg-surface-100 border border-surface-200">
                    <span className="text-slate-400 block text-[10px]">Samples</span>
                    <span className="font-bold text-white">{calculatedAnchor.sampleCount}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-surface-100 border border-surface-200">
                    <span className="text-slate-400 block text-[10px]">Dimensionality</span>
                    <span className="font-bold text-brand-cyan">63-D Unit</span>
                  </div>
                  <div className="p-2 rounded-lg bg-surface-100 border border-surface-200">
                    <span className="text-slate-400 block text-[10px]">Model State</span>
                    <span className="font-bold text-brand-emerald">Active</span>
                  </div>
                </div>

                {/* Mini Variance Vector Spectrum */}
                <div>
                  <span className="text-[10px] font-mono text-slate-400 block mb-1">
                    Normalized Coordinate Variance Spectrum:
                  </span>
                  <div className="flex items-end gap-0.5 h-10 w-full bg-surface-100 p-1 rounded-lg border border-surface-200 overflow-hidden">
                    {calculatedAnchor.variance?.slice(0, 42).map((val, idx) => (
                      <div
                        key={idx}
                        className="flex-1 bg-brand-emerald/30 rounded-xs flex flex-col justify-end"
                        style={{ height: '100%' }}
                        title={`Dimension ${idx}: variance ${val}`}
                      >
                        <div
                          className="bg-brand-emerald rounded-xs"
                          style={{ height: `${Math.min(100, Math.max(10, val * 2000))}%` }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-500 font-mono italic">
                Select a gesture and start recording to generate a calibrated centroid vector...
              </div>
            )}
          </div>

          {/* Active Anchors Summary Table */}
          <div className="p-4 rounded-xl bg-surface-50 border border-surface-200 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span>Active Calibrated Sign Registry:</span>
              <span className="font-mono text-brand-cyan">{Object.keys(allCustomAnchors).length} Anchors</span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-36 overflow-y-auto pr-1 scrollbar-thin text-xs font-mono">
              {Object.keys(allCustomAnchors).map((signKey) => (
                <div
                  key={signKey}
                  className="p-1.5 rounded-lg bg-surface-100 border border-surface-200 text-slate-300 flex items-center justify-between text-[11px]"
                >
                  <span className="font-bold text-white">{signKey}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-emerald" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
