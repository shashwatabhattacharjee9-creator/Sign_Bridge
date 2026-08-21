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
  Target,
  Timer,
  Trash2,
  Wifi,
  WifiOff,
  Zap,
  ShieldCheck,
} from 'lucide-react';

export const TelemetryPanel: React.FC = () => {
  const {
    fps,
    latencyMs,
    confidenceThreshold,
    setConfidenceThreshold,
    telemetry,
    setActiveTab,
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

  const fExt = telemetry.fingerExtensions;
  const currentPhase = telemetry.phase || 'REST';

  return (
    <div className="bg-[#0C111C]/90 border border-white/[0.08] rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 text-slate-200 backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-white tracking-tight">
              Edge Telemetry & Pipeline
            </h3>
            <p className="text-[11px] text-slate-400 font-normal">Real-time local vector math & kinematics</p>
          </div>
        </div>

        <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold flex items-center gap-1.5 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Worker Ready
        </span>
      </div>

      {/* 100% Local Privacy Guarantee Hero Banner */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-transparent border border-emerald-500/25 space-y-1.5 shadow-inner">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-300 font-semibold text-xs tracking-tight">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>100% CLIENT-SIDE LOCAL INFERENCE</span>
          </div>
          <button
            onClick={() => setActiveTab('calibration')}
            className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
          >
            <Target className="w-3 h-3" />
            <span>Calibrate</span>
          </button>
        </div>
        <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
          Orthonormal 3D coordinate normalization + kinetic energy boundary segmentation running locally with zero latency.
        </p>
      </div>

      {/* Primary 4-Metric Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* FPS Gauge */}
        <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.07] flex flex-col justify-between hover:border-white/15 transition-all">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Frame Rate</span>
            <Gauge className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="mt-1">
            <span className="text-xl font-bold font-mono text-white">{fps || 30}</span>
            <span className="text-xs ml-1 font-mono text-slate-400">FPS</span>
          </div>
          <span className="text-[10px] text-emerald-400 font-mono mt-0.5">
            {fps >= 24 ? '● 60 FPS Target' : '● Adaptive 30'}
          </span>
        </div>

        {/* Latency Gauge */}
        <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.07] flex flex-col justify-between hover:border-white/15 transition-all">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Latency</span>
            <Timer className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="mt-1">
            <span className="text-xl font-bold font-mono text-cyan-400">{latencyMs || 14}</span>
            <span className="text-xs ml-1 font-mono text-slate-400">ms</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5">&lt; 20ms Real-Time</span>
        </div>

        {/* Kinematic Phase State */}
        <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.07] flex flex-col justify-between hover:border-white/15 transition-all">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Phase</span>
            <Flame className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="mt-1">
            <span className="text-sm font-bold font-mono text-white">{currentPhase}</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5">
            Energy: {(telemetry.kineticEnergy || 0).toFixed(4)}
          </span>
        </div>

        {/* Network Status Indicator */}
        <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.07] flex flex-col justify-between hover:border-white/15 transition-all">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Edge Network</span>
            {!onlineStatus ? (
              <WifiOff className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Wifi className="w-3.5 h-3.5 text-slate-400" />
            )}
          </div>
          <div className="mt-1">
            <span className="text-xs font-bold font-mono text-emerald-400">
              {!onlineStatus ? 'OFFLINE' : 'ONLINE'}
            </span>
          </div>
          <span className="text-[10px] text-emerald-400 font-mono mt-0.5">
            Edge Native
          </span>
        </div>
      </div>

      {/* Live Continuous Joint Kinematics Matrix */}
      {fExt && (
        <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-2">
              <Hand className="w-3.5 h-3.5 text-emerald-400" />
              Continuous Joint Flexion:
            </span>
            {telemetry.detectedShape && telemetry.detectedShape !== 'UNKNOWN' && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/30">
                Shape: {telemetry.detectedShape}
              </span>
            )}
          </div>

          <div className="grid grid-cols-5 gap-2 text-center font-mono text-[11px]">
            <div className="p-2 rounded-xl bg-black/40 border border-white/[0.06]">
              <span className="text-slate-400 block text-[9px]">Thumb</span>
              <span className={`font-bold ${fExt.thumb > 0.5 ? 'text-emerald-400' : 'text-slate-500'}`}>
                {Math.round(fExt.thumb * 100)}%
              </span>
            </div>
            <div className="p-2 rounded-xl bg-black/40 border border-white/[0.06]">
              <span className="text-slate-400 block text-[9px]">Index</span>
              <span className={`font-bold ${fExt.index > 0.5 ? 'text-emerald-400' : 'text-slate-500'}`}>
                {Math.round(fExt.index * 100)}%
              </span>
            </div>
            <div className="p-2 rounded-xl bg-black/40 border border-white/[0.06]">
              <span className="text-slate-400 block text-[9px]">Middle</span>
              <span className={`font-bold ${fExt.middle > 0.5 ? 'text-emerald-400' : 'text-slate-500'}`}>
                {Math.round(fExt.middle * 100)}%
              </span>
            </div>
            <div className="p-2 rounded-xl bg-black/40 border border-white/[0.06]">
              <span className="text-slate-400 block text-[9px]">Ring</span>
              <span className={`font-bold ${fExt.ring > 0.5 ? 'text-emerald-400' : 'text-slate-500'}`}>
                {Math.round(fExt.ring * 100)}%
              </span>
            </div>
            <div className="p-2 rounded-xl bg-black/40 border border-white/[0.06]">
              <span className="text-slate-400 block text-[9px]">Pinky</span>
              <span className={`font-bold ${fExt.pinky > 0.5 ? 'text-emerald-400' : 'text-slate-500'}`}>
                {Math.round(fExt.pinky * 100)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Sensitivity & Confidence Cutoff Selector */}
      <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-300 flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            Classifier Gate Sensitivity:
          </span>
          <span className="font-mono text-cyan-400 font-bold">
            {Math.round(confidenceThreshold * 100)}% Trigger
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Relaxed (75%)', value: 0.75 },
            { label: 'Standard (82%)', value: 0.82 },
            { label: 'Strict (88%)', value: 0.88 },
            { label: 'Ultra (92%)', value: 0.92 },
          ].map((preset) => (
            <button
              key={preset.value}
              onClick={() => setConfidenceThreshold(preset.value)}
              className={`py-1.5 px-2 rounded-xl text-xs font-mono font-medium transition-all border ${
                confidenceThreshold === preset.value
                  ? 'bg-cyan-400 text-slate-950 border-cyan-400 font-semibold shadow-lg shadow-cyan-950/40'
                  : 'bg-white/[0.03] hover:bg-white/[0.08] text-slate-400 border-white/[0.06]'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Local Edge Database & Session Activity Stream */}
      <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-300 flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            Local IndexedDB Telemetry Stream:
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportDataset}
              disabled={isExporting || recentLogs.length === 0}
              className="text-[11px] font-mono text-cyan-400 hover:text-white flex items-center gap-1 transition-colors disabled:opacity-40"
              title="Download telemetry session log as JSON"
            >
              <Download className="w-3 h-3" />
              <span>Export JSON</span>
            </button>

            {recentLogs.length > 0 && (
              <button
                onClick={handleClearLogs}
                className="text-[11px] font-mono text-slate-500 hover:text-red-400 transition-colors"
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
                className="flex items-center justify-between p-2 rounded-xl bg-black/40 border border-white/[0.06] text-slate-300"
              >
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="font-bold text-white">{log.sign}</span>
                  <span className="text-[10px] text-emerald-400">
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
