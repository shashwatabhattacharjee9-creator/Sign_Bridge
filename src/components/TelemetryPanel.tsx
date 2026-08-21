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
    <div className="liquid-card rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 text-white">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="liquid-glass p-2 rounded-xl text-white">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-medium text-sm text-white tracking-tight">
              Edge Telemetry & Pipeline
            </h3>
            <p className="text-[11px] text-white/50 font-normal">Real-time local vector math & kinematics</p>
          </div>
        </div>

        <span className="text-[10px] font-mono px-3 py-1 liquid-glass rounded-full text-emerald-400 font-semibold flex items-center gap-1.5 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Worker Ready
        </span>
      </div>

      {/* 100% Local Privacy Guarantee Hero Banner */}
      <div className="p-4 rounded-2xl liquid-glass space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-medium text-xs tracking-tight">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>100% CLIENT-SIDE LOCAL INFERENCE</span>
          </div>
          <button
            onClick={() => setActiveTab('calibration')}
            className="text-[11px] font-mono text-white/80 hover:text-white flex items-center gap-1 transition-colors underline underline-offset-4"
          >
            <Target className="w-3 h-3" />
            <span>Calibrate</span>
          </button>
        </div>
        <p className="text-[11px] text-white/60 font-sans leading-relaxed">
          Orthonormal 3D coordinate normalization + kinetic energy boundary segmentation running locally with zero latency.
        </p>
      </div>

      {/* Primary 4-Metric Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* FPS Gauge */}
        <div className="p-3.5 rounded-2xl liquid-glass flex flex-col justify-between hover:bg-white/5 transition-all">
          <div className="flex items-center justify-between text-[11px] font-mono text-white/50">
            <span>Frame Rate</span>
            <Gauge className="w-3.5 h-3.5 text-white/70" />
          </div>
          <div className="mt-1">
            <span className="text-xl font-bold font-mono text-white">{fps || 30}</span>
            <span className="text-xs ml-1 font-mono text-white/40">FPS</span>
          </div>
          <span className="text-[10px] text-emerald-400 font-mono mt-0.5">
            {fps >= 24 ? '● 60 FPS Target' : '● Adaptive 30'}
          </span>
        </div>

        {/* Latency Gauge */}
        <div className="p-3.5 rounded-2xl liquid-glass flex flex-col justify-between hover:bg-white/5 transition-all">
          <div className="flex items-center justify-between text-[11px] font-mono text-white/50">
            <span>Latency</span>
            <Timer className="w-3.5 h-3.5 text-white/70" />
          </div>
          <div className="mt-1">
            <span className="text-xl font-bold font-mono text-white">{latencyMs || 14}</span>
            <span className="text-xs ml-1 font-mono text-white/40">ms</span>
          </div>
          <span className="text-[10px] text-white/50 font-mono mt-0.5">&lt; 20ms Real-Time</span>
        </div>

        {/* Kinematic Phase State */}
        <div className="p-3.5 rounded-2xl liquid-glass flex flex-col justify-between hover:bg-white/5 transition-all">
          <div className="flex items-center justify-between text-[11px] font-mono text-white/50">
            <span>Phase</span>
            <Flame className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="mt-1">
            <span className="text-sm font-bold font-mono text-white">{currentPhase}</span>
          </div>
          <span className="text-[10px] text-white/50 font-mono mt-0.5">
            Energy: {(telemetry.kineticEnergy || 0).toFixed(4)}
          </span>
        </div>

        {/* Network Status Indicator */}
        <div className="p-3.5 rounded-2xl liquid-glass flex flex-col justify-between hover:bg-white/5 transition-all">
          <div className="flex items-center justify-between text-[11px] font-mono text-white/50">
            <span>Network</span>
            {!onlineStatus ? (
              <WifiOff className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Wifi className="w-3.5 h-3.5 text-white/40" />
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
        <div className="p-3.5 rounded-2xl liquid-glass space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-white/80 flex items-center gap-2">
              <Hand className="w-3.5 h-3.5 text-white/70" />
              Continuous Joint Flexion:
            </span>
            {telemetry.detectedShape && telemetry.detectedShape !== 'UNKNOWN' && (
              <span className="text-[10px] font-mono px-2 py-0.5 liquid-glass rounded-full text-white/80 font-semibold">
                Shape: {telemetry.detectedShape}
              </span>
            )}
          </div>

          <div className="grid grid-cols-5 gap-2 text-center font-mono text-[11px]">
            <div className="p-2 rounded-xl liquid-glass">
              <span className="text-white/40 block text-[9px]">Thumb</span>
              <span className="font-bold text-white">
                {Math.round(fExt.thumb * 100)}%
              </span>
            </div>
            <div className="p-2 rounded-xl liquid-glass">
              <span className="text-white/40 block text-[9px]">Index</span>
              <span className="font-bold text-white">
                {Math.round(fExt.index * 100)}%
              </span>
            </div>
            <div className="p-2 rounded-xl liquid-glass">
              <span className="text-white/40 block text-[9px]">Middle</span>
              <span className="font-bold text-white">
                {Math.round(fExt.middle * 100)}%
              </span>
            </div>
            <div className="p-2 rounded-xl liquid-glass">
              <span className="text-white/40 block text-[9px]">Ring</span>
              <span className="font-bold text-white">
                {Math.round(fExt.ring * 100)}%
              </span>
            </div>
            <div className="p-2 rounded-xl liquid-glass">
              <span className="text-white/40 block text-[9px]">Pinky</span>
              <span className="font-bold text-white">
                {Math.round(fExt.pinky * 100)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Sensitivity & Confidence Cutoff Selector */}
      <div className="p-3.5 rounded-2xl liquid-glass space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-white/80 flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-white/70" />
            Classifier Gate Sensitivity:
          </span>
          <span className="font-mono text-white font-semibold">
            {Math.round(confidenceThreshold * 100)}% Trigger
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Relaxed 75%', value: 0.75 },
            { label: 'Standard 82%', value: 0.82 },
            { label: 'Strict 88%', value: 0.88 },
            { label: 'Ultra 92%', value: 0.92 },
          ].map((preset) => (
            <button
              key={preset.value}
              onClick={() => setConfidenceThreshold(preset.value)}
              className={`py-2 px-2 rounded-full text-xs font-mono font-medium transition-all ${
                confidenceThreshold === preset.value
                  ? 'bg-white text-black font-semibold shadow-md'
                  : 'liquid-glass text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Local Edge Database & Session Activity Stream */}
      <div className="p-3.5 rounded-2xl liquid-glass space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-white/80 flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-white/70" />
            Local IndexedDB Telemetry Stream:
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportDataset}
              disabled={isExporting || recentLogs.length === 0}
              className="text-[11px] font-mono text-white/80 hover:text-white flex items-center gap-1 transition-colors disabled:opacity-30 underline underline-offset-4"
              title="Download telemetry session log as JSON"
            >
              <Download className="w-3 h-3" />
              <span>Export JSON</span>
            </button>

            {recentLogs.length > 0 && (
              <button
                onClick={handleClearLogs}
                className="text-[11px] font-mono text-white/40 hover:text-red-300 transition-colors"
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
                className="flex items-center justify-between p-2 rounded-xl liquid-glass text-white/80"
              >
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="font-medium text-white">{log.sign}</span>
                  <span className="text-[10px] text-white/60">
                    {Math.round(log.confidence * 100)}%
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-white/40">
                  <span>{log.latencyMs}ms</span>
                  <span>{log.fps} FPS</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-3 text-center text-xs text-white/40 font-mono italic">
            Perform gestures to record telemetry events in local IndexedDB...
          </div>
        )}
      </div>
    </div>
  );
};
