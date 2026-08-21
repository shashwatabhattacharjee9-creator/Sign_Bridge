'use client';

import React, { useEffect, useState } from 'react';
import { useSignBridgeStore } from '@/store/useSignBridgeStore';
import {
  Activity,
  BookOpen,
  Camera,
  GraduationCap,
  Languages,
  Radio,
  Sliders,
  Sparkles,
  Target,
  Volume2,
  Wifi,
  WifiOff,
  Home,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export const Header: React.FC = () => {
  const { activeTab, setActiveTab, telemetry, updateTelemetry, settings, updateSettings } = useSignBridgeStore();
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    // Monitor online/offline network status locally
    const handleNetworkChange = () => {
      const isOff = typeof navigator !== 'undefined' ? !navigator.onLine : false;
      updateTelemetry({ isOffline: isOff });
    };

    window.addEventListener('online', handleNetworkChange);
    window.addEventListener('offline', handleNetworkChange);
    handleNetworkChange();

    // Populate local speech voices
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const loadVoices = () => {
        const vList = window.speechSynthesis.getVoices();
        setVoices(vList);
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      window.removeEventListener('online', handleNetworkChange);
      window.removeEventListener('offline', handleNetworkChange);
    };
  }, [updateTelemetry]);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#07090E]/80 backdrop-blur-2xl px-4 sm:px-6 lg:px-10 py-3 flex items-center justify-between transition-all">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3.5">
          <div
            onClick={() => setActiveTab('hero')}
            className="group flex items-center gap-3 cursor-pointer select-none"
            title="Return to Overview Landing"
          >
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500/20 via-emerald-400/30 to-cyan-500/20 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-950/40 group-hover:scale-105 transition-transform">
              {/* Waveform Diamond SVG Logo */}
              <svg className="w-5 h-5" viewBox="0 0 28 28" fill="none">
                <path
                  d="M14 2L26 14L14 26L2 14L14 2Z"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinejoin="round"
                />
                <path
                  d="M7 14C9.5 11 11.5 11 14 14C16.5 17 18.5 17 21 14"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-base sm:text-lg tracking-tight text-white group-hover:text-emerald-300 transition-colors">
                  SignBridge
                </span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-medium">
                  Edge AI
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden xl:block font-normal">
                100% Client-Side Indian Sign Language Neural Bridge
              </p>
            </div>
          </div>
        </div>

        {/* Minimalist Segmented Navigation Switcher */}
        <nav className="flex items-center bg-white/[0.03] p-1 rounded-2xl border border-white/[0.08] shadow-inner backdrop-blur-md">
          <button
            onClick={() => setActiveTab('hero')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'hero'
                ? 'bg-white/10 text-white shadow-sm border border-white/15 font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('vision')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'vision'
                ? 'bg-white/10 text-emerald-400 shadow-sm border border-white/15 font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Studio</span>
          </button>

          <button
            onClick={() => setActiveTab('calibration')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'calibration'
                ? 'bg-white/10 text-cyan-400 shadow-sm border border-white/15 font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Calibrate</span>
          </button>

          <button
            onClick={() => setActiveTab('practice')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'practice'
                ? 'bg-white/10 text-amber-400 shadow-sm border border-white/15 font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Practice</span>
          </button>

          <button
            onClick={() => setActiveTab('translate')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'translate'
                ? 'bg-white/10 text-cyan-400 shadow-sm border border-white/15 font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Languages className="w-3.5 h-3.5" />
            <span className="hidden md:inline">2-Way Bridge</span>
          </button>

          <button
            onClick={() => setActiveTab('vocabulary')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'vocabulary'
                ? 'bg-white/10 text-slate-100 shadow-sm border border-white/15 font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">30 Signs</span>
          </button>
        </nav>

        {/* Status Pill & Settings Controls */}
        <div className="flex items-center gap-3">
          {/* Edge Privacy Shield Pill */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/[0.08] border border-emerald-500/25 text-xs font-mono select-none"
            title="Zero cloud streaming. Neural vision calculations and voice synthesis execute 100% in your browser."
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
            <span className="text-slate-300 hidden md:inline text-[11px]">Edge Local:</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1 text-[11px]">
              <WifiOff className="w-3 h-3" />
              100% Offline
            </span>
          </div>

          {/* Settings Trigger */}
          <button
            onClick={() => setShowSettingsModal(true)}
            className="p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/[0.08] transition-all hover:scale-105 active:scale-95"
            title="Configure System Engine Parameters"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-[#0D131F]/95 border border-white/10 rounded-3xl p-6 sm:p-7 w-full max-w-lg shadow-2xl text-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-base text-white">System Calibration & Engine</h3>
                  <p className="text-xs text-slate-400 font-normal">Fine-tune detection gates and synthesis</p>
                </div>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center text-lg transition-colors"
              >
                &times;
              </button>
            </div>

            <div className="mt-5 space-y-4 text-xs">
              {/* Confidence Threshold */}
              <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                <div className="flex justify-between mb-1.5">
                  <span className="font-medium text-slate-300">Confidence Gate Threshold:</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {Math.round(settings.minConfidence * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.55"
                  max="0.95"
                  step="0.01"
                  value={settings.minConfidence}
                  onChange={(e) => updateSettings({ minConfidence: parseFloat(e.target.value) })}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Signs below this threshold are held in hysteresis buffer or filtered as IDLE.
                </p>
              </div>

              {/* Temporal Debounce Frames */}
              <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                <div className="flex justify-between mb-1.5">
                  <span className="font-medium text-slate-300">Commit Consistency Window:</span>
                  <span className="font-mono text-cyan-400 font-bold">{settings.debounceFrames} frames</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="10"
                  step="1"
                  value={settings.debounceFrames}
                  onChange={(e) => updateSettings({ debounceFrames: parseInt(e.target.value, 10) })}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Consecutive frame persistence required before committing gesture tokens.
                </p>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/10 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={settings.enablePose}
                    onChange={(e) => updateSettings({ enablePose: e.target.checked })}
                    className="accent-emerald-400 rounded"
                  />
                  <span className="text-xs text-slate-300">Pose Skeleton</span>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/10 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={settings.drawLandmarks}
                    onChange={(e) => updateSettings({ drawLandmarks: e.target.checked })}
                    className="accent-emerald-400 rounded"
                  />
                  <span className="text-xs text-slate-300">Render Overlay</span>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/10 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={settings.cameraMirror}
                    onChange={(e) => updateSettings({ cameraMirror: e.target.checked })}
                    className="accent-emerald-400 rounded"
                  />
                  <span className="text-xs text-slate-300">Mirror Camera</span>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/10 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={settings.enableAudioFeedback}
                    onChange={(e) => updateSettings({ enableAudioFeedback: e.target.checked })}
                    className="accent-emerald-400 rounded"
                  />
                  <span className="text-xs text-slate-300">Audio Chimes</span>
                </label>
              </div>

              {/* Speech Voice Selection */}
              <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                <label className="block font-medium text-slate-300 mb-1.5">
                  Offline Speech Synthesizer Voice:
                </label>
                <select
                  value={settings.ttsVoice}
                  onChange={(e) => updateSettings({ ttsVoice: e.target.value })}
                  className="w-full bg-[#090D16] border border-white/10 rounded-xl p-2.5 text-slate-200 font-mono text-xs focus:outline-none focus:border-emerald-400"
                >
                  <option value="">Default Native System Voice</option>
                  {voices.map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-6 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-semibold text-xs transition-all shadow-lg shadow-emerald-950/40 hover:scale-105 active:scale-95"
              >
                Apply Parameters
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
