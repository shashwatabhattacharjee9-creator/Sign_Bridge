'use client';

import React, { useState, useEffect } from 'react';
import { useSignBridgeStore } from '@/store/useSignBridgeStore';
import { edgeDatabase, GestureLogRecord } from '@/lib/storage/edgeDatabase';
import {
  Activity,
  CheckCircle2,
  Cpu,
  Database,
  Download,
  Eye,
  Flame,
  Gauge,
  Hand,
  Layers,
  Lock,
  Radio,
  RefreshCw,
  Sliders,
  Sparkles,
  Timer,
  Trash2,
  Wifi,
  WifiOff,
  Zap,
} from 'lucide-react';

export const TelemetryPanel: React.FC = () => {
  const {
    fps,
    latencyMs,
    confidenceThreshold,
    setConfidenceThreshold,
    telemetry,
  } = useSignBridgeStore();

  const [onlineStatus, setOnlineStatus] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [recentLogs, setRecentLogs] = useState<GestureLogRecord[]>([]);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleOnline = () => setOnlineStatus(true);
    const handleOffline = () => setOnlineStatus(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Refresh recent IndexedDB logs periodically
    const refreshLogs = async () => {
      const logs = await edgeDatabase.getRecentLogs(6);
      setRecentLogs(logs);
    };

    refreshLogs();
    const interval = setInterval(refreshLogs, 2000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const handleExportDataset = async () => {
    setIsExporting(true);
    try {
      const jsonStr = await edgeDatabase.exportDatasetJSON();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SignBridge_EdgeDataset_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearLogs = async () => {
    await edgeDatabase.clearHistory();
    setRecentLogs([]);
  };

  const totalPoints = (telemetry.handsCount || 0) * 21 + (telemetry.poseDetected ? 33 : 0);

  const fpsColor =
    fps >= 24
      ? 'text-brand-emerald border-brand-emerald/30 bg-brand-emerald/10'
      : fps >= 15
      ? 'text-brand-amber border-brand-amber/30 bg-brand-amber/10'
      : 'text-red-400 border-red-500/30 bg-red-500/10';

  const fExt = telemetry.fingerExtensions;

  return (
    <div className="bg-surface-100 border border-surface-200 rounded-2xl p-5 shadow-xl space-y-4 text-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-surface-200">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-brand-emerald" />
          <h3 className="font-bold text-sm text-white uppercase tracking-wider">
            Edge-AI Live Telemetry HUD
          </h3>
        </div>

        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-brand-emerald/10 border border-brand-emerald/30 text-brand-emerald font-semibold flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-emerald animate-pulse" />
          Real-Time
        </span>
      </div>

      {/* 100% Local Privacy Guarantee Hero Banner */}
      <div className="p-3.5 rounded-xl bg-gradient-to-r from-brand-emerald/15 to-brand-cyan/15 border border-brand-emerald/30 space-y-1.5 shadow-sm">
        <div className="flex items-center gap-2 text-brand-emerald font-bold text-xs">
          <Lock className="w-4 h-4 text-brand-emerald shrink-0" />
          <span>🔒 100% LOCAL EDGE INFERENCE — ZERO CLOUD RELIANCE</span>
        </div>
        <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
          Zero-allocation WASM ring buffer & local IndexedDB storage pipeline. No video frames or voice data are ever uploaded to any cloud server.
        </p>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* FPS Gauge */}
        <div className={`p-3 rounded-xl border flex flex-col justify-between ${fpsColor}`}>
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Frame Rate</span>
            <Gauge className="w-3.5 h-3.5" />
          </div>
          <div className="mt-1">
            <span className="text-xl font-bold font-mono">{fps || 0}</span>
            <span className="text-xs ml-1 font-mono text-slate-400">FPS</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5">
            {fps >= 24 ? 'Optimal Target' : 'Adequate'}
          </span>
        </div>

        {/* Latency Gauge */}
        <div className="p-3 rounded-xl bg-surface-50 border border-surface-200 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Inference Latency</span>
            <Timer className="w-3.5 h-3.5 text-brand-cyan" />
          </div>
          <div className="mt-1">
            <span className="text-xl font-bold font-mono text-brand-cyan">{latencyMs || 0}</span>
            <span className="text-xs ml-1 font-mono text-slate-400">ms</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono mt-0.5">&lt; 35ms Real-Time</span>
        </div>

        {/* Active Landmarks Gauge */}
        <div className="p-3 rounded-xl bg-surface-50 border border-surface-200 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Active Points</span>
            <Hand className="w-3.5 h-3.5 text-brand-amber" />
          </div>
          <div className="mt-1">
            <span className="text-xl font-bold font-mono text-white">{totalPoints}</span>
            <span className="text-xs ml-1 font-mono text-slate-400">Points</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono mt-0.5">
            {telemetry.handsCount || 0} Hand(s) + {telemetry.poseDetected ? '33 Pose' : '0 Pose'}
          </span>
        </div>

        {/* Network Status Indicator */}
        <div className="p-3 rounded-xl bg-surface-50 border border-surface-200 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Edge Network</span>
            {!onlineStatus ? (
              <WifiOff className="w-3.5 h-3.5 text-brand-emerald" />
            ) : (
              <Wifi className="w-3.5 h-3.5 text-slate-400" />
            )}
          </div>
          <div className="mt-1">
            <span className="text-xs font-bold font-mono text-brand-emerald">
              {!onlineStatus ? 'OFFLINE' : 'ONLINE'}
            </span>
          </div>
          <span className="text-[10px] text-brand-emerald font-mono mt-0.5">
            Offline Edge Native
          </span>
        </div>
      </div>

      {/* Live Continuous Joint Kinematics Matrix */}
      {fExt && (
        <div className="p-3.5 rounded-xl bg-surface-50 border border-surface-200 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Hand className="w-3.5 h-3.5 text-brand-emerald" />
              Continuous Joint Kinematics:
            </span>
            {telemetry.detectedShape && telemetry.detectedShape !== 'UNKNOWN' && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-brand-cyan/20 text-brand-cyan font-bold border border-brand-cyan/30">
                Shape: {telemetry.detectedShape}
              </span>
            )}
          </div>

          <div className="grid grid-cols-5 gap-2 text-center font-mono text-[11px]">
            <div className="p-1.5 rounded-lg bg-surface-100 border border-surface-200">
              <span className="text-slate-400 block text-[9px]">Thumb</span>
              <span className={`font-bold ${fExt.thumb > 0.5 ? 'text-brand-emerald' : 'text-slate-500'}`}>
                {Math.round(fExt.thumb * 100)}%
              </span>
            </div>
            <div className="p-1.5 rounded-lg bg-surface-100 border border-surface-200">
              <span className="text-slate-400 block text-[9px]">Index</span>
              <span className={`font-bold ${fExt.index > 0.5 ? 'text-brand-emerald' : 'text-slate-500'}`}>
                {Math.round(fExt.index * 100)}%
              </span>
            </div>
            <div className="p-1.5 rounded-lg bg-surface-100 border border-surface-200">
              <span className="text-slate-400 block text-[9px]">Middle</span>
              <span className={`font-bold ${fExt.middle > 0.5 ? 'text-brand-emerald' : 'text-slate-500'}`}>
                {Math.round(fExt.middle * 100)}%
              </span>
            </div>
            <div className="p-1.5 rounded-lg bg-surface-100 border border-surface-200">
              <span className="text-slate-400 block text-[9px]">Ring</span>
              <span className={`font-bold ${fExt.ring > 0.5 ? 'text-brand-emerald' : 'text-slate-500'}`}>
                {Math.round(fExt.ring * 100)}%
              </span>
            </div>
            <div className="p-1.5 rounded-lg bg-surface-100 border border-surface-200">
              <span className="text-slate-400 block text-[9px]">Pinky</span>
              <span className={`font-bold ${fExt.pinky > 0.5 ? 'text-brand-emerald' : 'text-slate-500'}`}>
                {Math.round(fExt.pinky * 100)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Sensitivity & Confidence Cutoff Selector */}
      <div className="p-3.5 rounded-xl bg-surface-50 border border-surface-200 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-brand-cyan" />
            Classifier Confidence Cutoff:
          </span>
          <span className="font-mono text-brand-cyan font-bold">
            {Math.round(confidenceThreshold * 100)}% Threshold
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'High (60%)', value: 0.60 },
            { label: 'Balanced (70%)', value: 0.70 },
            { label: 'Standard (75%)', value: 0.75 },
            { label: 'Strict (82%)', value: 0.82 },
          ].map((preset) => (
            <button
              key={preset.value}
              onClick={() => setConfidenceThreshold(preset.value)}
              className={`py-1.5 px-2 rounded-lg text-xs font-mono font-semibold transition-all border ${
                confidenceThreshold === preset.value
                  ? 'bg-brand-cyan text-slate-950 border-brand-cyan shadow-md shadow-brand-cyan/20'
                  : 'bg-surface-100 hover:bg-surface-200 text-slate-400 border-surface-200'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Local Edge Database & Session Activity Stream */}
      <div className="p-3.5 rounded-xl bg-surface-50 border border-surface-200 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-brand-emerald" />
            Local IndexedDB Telemetry Stream:
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportDataset}
              disabled={isExporting || recentLogs.length === 0}
              className="text-[10px] font-mono text-brand-cyan hover:text-white flex items-center gap-1 transition-colors disabled:opacity-40"
              title="Download telemetry session log as JSON"
            >
              <Download className="w-3 h-3" />
              <span>Export JSON</span>
            </button>

            {recentLogs.length > 0 && (
              <button
                onClick={handleClearLogs}
                className="text-[10px] font-mono text-slate-500 hover:text-red-400 transition-colors"
                title="Clear local database logs"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {recentLogs.length > 0 ? (
          <div className="space-y-1.5 max-h-32 overflow-y-auto scrollbar-thin pr-1 font-mono text-[11px]">
            {recentLogs.map((log, idx) => (
              <div
                key={log.id || idx}
                className="flex items-center justify-between p-1.5 rounded-lg bg-surface-100 border border-surface-200 text-slate-300"
              >
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-emerald" />
                  <span className="font-bold text-white">{log.sign}</span>
                  <span className="text-[10px] text-brand-emerald">
                    {Math.round(log.confidence * 100)}%
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                  <span>{log.latencyMs}ms</span>
                  <span>{log.fps} FPS</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-3 text-center text-xs text-slate-500 font-mono italic">
            Perform gestures to record telemetry events in local IndexedDB...
          </div>
        )}
      </div>
    </div>
  );
};
