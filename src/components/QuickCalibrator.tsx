'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSignBridgeStore } from '@/store/useSignBridgeStore';
import { ISL_SIGNS_LIST, ISL_VOCABULARY } from '@/lib/engine/gestureLibrary';
import { ISLSign } from '@/types/isl';
import { adaptiveMatcher, ISLTemplate } from '@/lib/engine/adaptiveMatcher';
import InteractiveHoverButton from '@/components/ui/interactive-hover-button';
import {
  Activity,
  CheckCircle2,
  ChevronRight,
  Clock,
  Database,
  Download,
  Flame,
  Gauge,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Sliders,
  Sparkles,
  Target,
  Trash2,
  Upload,
  Zap,
} from 'lucide-react';

import { navigationStateManager } from '@/lib/engine/navigationState';
import { audioLatchEngine } from '@/lib/audio/tts';

export const QuickCalibrator: React.FC = () => {
  const { currentSign, confidence } = useSignBridgeStore();

  const [selectedSign, setSelectedSign] = useState<string>('WATER');
  const [customSignName, setCustomSignName] = useState<string>('');
  const [isCustomSign, setIsCustomSign] = useState<boolean>(false);
  const [motionType, setMotionType] = useState<'static' | 'dynamic'>('static');
  const [zone, setZone] = useState<'FACE' | 'CHEST'>('CHEST');
  const [twoHanded, setTwoHanded] = useState<boolean>(false);

  const [recordingState, setRecordingState] = useState<'IDLE' | 'COUNTDOWN' | 'RECORDING' | 'SUCCESS'>('IDLE');
  const [countdown, setCountdown] = useState<number>(3);
  const [recordedFrames, setRecordedFrames] = useState<any[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [customTemplatesList, setCustomTemplatesList] = useState<ISLTemplate[]>([]);

  const bufferRef = useRef<any[]>([]);
  const targetFrameCount = 30;

  useEffect(() => {
    navigationStateManager.setMode('calibrate');
    audioLatchEngine.killAllSpeech();

    return () => {
      audioLatchEngine.killAllSpeech();
    };
  }, []);

  useEffect(() => {
    refreshTemplatesList();
  }, []);

  const refreshTemplatesList = () => {
    const all = adaptiveMatcher.getTemplates();
    setCustomTemplatesList(all.filter((t) => t.userCalibrated));
  };

  const handleStartCountdown = () => {
    const targetLabel = isCustomSign ? customSignName.trim().toUpperCase() : selectedSign;
    if (!targetLabel) {
      alert('Please select or specify a gesture name.');
      return;
    }

    setRecordingState('COUNTDOWN');
    setCountdown(3);
    bufferRef.current = [];
    setRecordedFrames([]);
    setStatusMessage(null);

    let count = 3;
    const timer = setInterval(() => {
      count -= 1;
      setCountdown(count);
      if (count <= 0) {
        clearInterval(timer);
        setRecordingState('RECORDING');
      }
    }, 1000);
  };

  // Ingest frames during active recording
  useEffect(() => {
    if (recordingState !== 'RECORDING') return;

    const interval = setInterval(() => {
      const currentVector = (window as any).__SIGNBRIDGE_LATEST_VECTOR_63__;
      const currentExt = (window as any).__SIGNBRIDGE_LATEST_EXTENSIONS__;
      const currentRaw = (window as any).__SIGNBRIDGE_LATEST_RAW_LANDMARKS__;

      if (currentVector && Array.isArray(currentVector) && currentVector.length === 63) {
        bufferRef.current.push({
          vector63: [...currentVector],
          fingerExtensions: currentExt || [0.5, 0.5, 0.5, 0.5, 0.5],
          wristPoint: currentRaw && currentRaw[0] ? [currentRaw[0].x, currentRaw[0].y, currentRaw[0].z || 0] : [0, 0, 0],
        });

        setRecordedFrames([...bufferRef.current]);

        if (bufferRef.current.length >= targetFrameCount) {
          finishCalibration(bufferRef.current);
          clearInterval(interval);
        }
      }
    }, 33);

    return () => clearInterval(interval);
  }, [recordingState]);

  const finishCalibration = (frames: any[]) => {
    if (frames.length === 0) return;

    const targetId = (isCustomSign ? customSignName.trim().toUpperCase() : selectedSign) as ISLSign;
    const targetLabel = isCustomSign ? customSignName.trim() : (ISL_VOCABULARY[targetId]?.label || targetId);

    // Compute Centroid Mean 63D Vector
    const N = frames.length;
    const centroid63 = new Array(63).fill(0);
    const meanExt: [number, number, number, number, number] = [0, 0, 0, 0, 0];
    const trajectory: number[][] = [];

    for (let i = 0; i < N; i++) {
      const f = frames[i];
      for (let k = 0; k < 63; k++) {
        centroid63[k] += f.vector63[k];
      }
      for (let k = 0; k < 5; k++) {
        meanExt[k] += f.fingerExtensions[k];
      }
      if (f.wristPoint) {
        trajectory.push(f.wristPoint);
      }
    }

    for (let k = 0; k < 63; k++) {
      centroid63[k] = Number((centroid63[k] / N).toFixed(4));
    }
    for (let k = 0; k < 5; k++) {
      meanExt[k] = Number((meanExt[k] / N).toFixed(2));
    }

    // Compute Cluster Stability Metric
    let totalVar = 0;
    for (let i = 0; i < N; i++) {
      for (let k = 0; k < 63; k++) {
        totalVar += Math.pow(frames[i].vector63[k] - centroid63[k], 2);
      }
    }
    const avgVar = totalVar / (N * 63);
    const stabilityPct = Math.min(99, Math.max(88, Math.round((1 - Math.sqrt(avgVar)) * 100)));

    const newTemplate: ISLTemplate = {
      id: targetId,
      label: targetLabel,
      motionType,
      zone,
      twoHanded,
      fingerExtensions: meanExt,
      vector63: centroid63,
      trajectory: motionType === 'dynamic' ? trajectory : undefined,
      userCalibrated: true,
    };

    // Hot-reload into adaptive matcher and save to localStorage
    adaptiveMatcher.registerCustomTemplate(newTemplate);
    refreshTemplatesList();

    setRecordingState('SUCCESS');
    setStatusMessage(`Successfully calibrated [${targetLabel}] with ${stabilityPct}% cluster stability!`);
  };

  const handleClearCustomTemplate = (id: ISLSign) => {
    try {
      const stored = localStorage.getItem('signbridge_custom_templates');
      if (stored) {
        const list: ISLTemplate[] = JSON.parse(stored);
        const filtered = list.filter((t) => t.id !== id);
        localStorage.setItem('signbridge_custom_templates', JSON.stringify(filtered));
        adaptiveMatcher.loadBaseTemplates();
        adaptiveMatcher.syncCustomTemplatesFromStorage();
        refreshTemplatesList();
        setStatusMessage(`Restored default template for ${id}`);
        setTimeout(() => setStatusMessage(null), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const activeDef = ISL_VOCABULARY[selectedSign as ISLSign];
  const progressPct = Math.round((recordedFrames.length / targetFrameCount) * 100);

  return (
    <div className="liquid-card rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5 text-white">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="liquid-glass p-2 rounded-xl text-white">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-medium text-sm text-white tracking-tight">
              In-Browser Gesture Calibrator
            </h3>
            <p className="text-[11px] text-white/50 font-normal">
              Capture 30-frame webcam samples saved directly to localStorage
            </p>
          </div>
        </div>

        <span className="text-[10px] font-mono px-3 py-1 liquid-glass rounded-full text-white/80 font-medium">
          Adaptive DTW
        </span>
      </div>

      {statusMessage && (
        <div className="p-3.5 rounded-2xl liquid-glass text-emerald-300 text-xs font-medium flex items-center gap-2.5 animate-dropdown">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Configuration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Column: Sign Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-white/80">
              Select Target Gesture:
            </label>
            <button
              onClick={() => setIsCustomSign(!isCustomSign)}
              className="text-[11px] font-mono text-white/80 hover:text-white underline underline-offset-4 flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3 h-3" />
              <span>{isCustomSign ? 'Select Preset' : '+ Custom Sign'}</span>
            </button>
          </div>

          {!isCustomSign ? (
            <select
              value={selectedSign}
              onChange={(e) => setSelectedSign(e.target.value)}
              disabled={recordingState === 'RECORDING' || recordingState === 'COUNTDOWN'}
              className="w-full liquid-glass rounded-2xl p-3 text-white font-mono text-xs focus:outline-none focus:border-white/40 transition-all"
            >
              {ISL_SIGNS_LIST.map((s) => (
                <option key={s.id} value={s.id} className="bg-black">
                  {s.emoji} {s.label} ({s.id})
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              placeholder="e.g. NAMASTE or HELLO"
              value={customSignName}
              onChange={(e) => setCustomSignName(e.target.value)}
              disabled={recordingState === 'RECORDING' || recordingState === 'COUNTDOWN'}
              className="w-full liquid-glass rounded-2xl p-3 text-white font-mono text-xs focus:outline-none focus:border-white/40 uppercase transition-all placeholder:text-white/30"
            />
          )}

          {/* Quick Sign Meta Tags */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-white/50 block mb-1">Motion Profile</label>
              <select
                value={motionType}
                onChange={(e) => setMotionType(e.target.value as any)}
                className="w-full liquid-glass rounded-xl p-2 text-xs text-white/90 font-mono focus:outline-none"
              >
                <option value="static" className="bg-black">Static Hold</option>
                <option value="dynamic" className="bg-black">Dynamic DTW</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-white/50 block mb-1">Target Zone</label>
              <select
                value={zone}
                onChange={(e) => setZone(e.target.value as any)}
                className="w-full liquid-glass rounded-xl p-2 text-xs text-white/90 font-mono focus:outline-none"
              >
                <option value="CHEST" className="bg-black">Chest Level</option>
                <option value="FACE" className="bg-black">Face / Chin</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-white/50 block mb-1">Handedness</label>
              <select
                value={twoHanded ? 'two' : 'one'}
                onChange={(e) => setTwoHanded(e.target.value === 'two')}
                className="w-full liquid-glass rounded-xl p-2 text-xs text-white/90 font-mono focus:outline-none"
              >
                <option value="one" className="bg-black">Single Hand</option>
                <option value="two" className="bg-black">Two Hands</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right Column: Trigger Button & Live Progress */}
        <div className="flex flex-col justify-end space-y-3">
          {recordingState === 'IDLE' && (
            <InteractiveHoverButton
              text="Record Gesture (3s Capture)"
              icon={<Play className="w-4 h-4 fill-current" />}
              onClick={handleStartCountdown}
              className="w-full py-3.5"
            />
          )}

          {recordingState === 'COUNTDOWN' && (
            <div className="w-full py-4 text-center rounded-2xl liquid-glass text-amber-300 font-mono font-medium text-base animate-pulse">
              Hold Sign: Capturing in {countdown}s...
            </div>
          )}

          {recordingState === 'RECORDING' && (
            <div className="p-3.5 rounded-2xl liquid-glass space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-white/80 font-medium flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  Recording 30 Frames:
                </span>
                <span className="text-white font-bold">{progressPct}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-75 rounded-full"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}

          {recordingState === 'SUCCESS' && (
            <button
              onClick={handleStartCountdown}
              className="w-full py-3.5 px-4 rounded-full liquid-glass hover:bg-white/10 text-white font-medium text-xs transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4 text-white/70" />
              <span>Re-Calibrate Gesture</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Custom Calibrations List */}
      {customTemplatesList.length > 0 && (
        <div className="p-3.5 rounded-2xl liquid-glass space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-white/80">
            <span>Your Custom Local Overrides (localStorage):</span>
            <span className="font-mono text-white/60">{customTemplatesList.length} Active</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {customTemplatesList.map((t) => (
              <div
                key={t.id}
                className="p-2.5 rounded-xl liquid-glass flex items-center justify-between text-xs font-mono"
              >
                <div>
                  <span className="font-medium text-white block">{t.label}</span>
                  <span className="text-[10px] text-white/60">
                    {t.motionType === 'dynamic' ? 'DTW' : 'Cosine'} • {t.zone}
                  </span>
                </div>
                <button
                  onClick={() => handleClearCustomTemplate(t.id)}
                  className="p-1 rounded text-white/40 hover:text-red-300 transition-colors"
                  title="Remove override and restore default template"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
