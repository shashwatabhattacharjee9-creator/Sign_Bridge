'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useSignBridgeStore } from '@/store/useSignBridgeStore';
import {
  Activity,
  BookOpen,
  Camera,
  ChevronDown,
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
      <header className="sticky top-0 z-40 w-full px-5 sm:px-6 md:px-12 lg:px-16 py-3.5 sm:py-4 flex items-center justify-between border-b border-white/5 bg-[#07090E]/80 backdrop-blur-2xl transition-all">
        {/* Brand & Identity */}
        <div
          onClick={() => setActiveTab('hero')}
          className="group flex items-center gap-3 cursor-pointer select-none"
          title="Return to Landing Overview"
        >
          {/* Waveform Diamond SVG Logo */}
          <svg
            className="w-7 h-7 shrink-0 text-white"
            viewBox="0 0 28 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M14 2L26 14L14 26L2 14L14 2Z"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinejoin="round"
              strokeOpacity="0.9"
            />
            <path
              d="M7 14C9.5 11 11.5 11 14 14C16.5 17 18.5 17 21 14"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeOpacity="0.5"
            />
          </svg>
          <div className="flex items-center gap-2">
            <span className="text-white text-lg font-medium tracking-tight group-hover:text-white/80 transition-colors">
              SignBridge
            </span>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 liquid-glass rounded-full text-white/70 font-medium hidden sm:inline">
              Edge AI
            </span>
          </div>
        </div>

        {/* Minimalist Segmented Navigation Switcher */}
        <nav className="flex items-center liquid-glass rounded-full p-1 shadow-lg gap-0.5">
          <button
            onClick={() => setActiveTab('hero')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
              activeTab === 'hero'
                ? 'bg-white text-slate-900 font-semibold shadow-sm'
                : 'text-white/80 hover:text-white hover:bg-white/5'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('vision')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
              activeTab === 'vision'
                ? 'bg-white text-slate-900 font-semibold shadow-sm'
                : 'text-white/80 hover:text-white hover:bg-white/5'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Studio</span>
          </button>

          <button
            onClick={() => setActiveTab('calibration')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
              activeTab === 'calibration'
                ? 'bg-white text-slate-900 font-semibold shadow-sm'
                : 'text-white/80 hover:text-white hover:bg-white/5'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Calibrate</span>
          </button>

          <button
            onClick={() => setActiveTab('practice')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
              activeTab === 'practice'
                ? 'bg-white text-slate-900 font-semibold shadow-sm'
                : 'text-white/80 hover:text-white hover:bg-white/5'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Practice</span>
          </button>

          <button
            onClick={() => setActiveTab('translate')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
              activeTab === 'translate'
                ? 'bg-white text-slate-900 font-semibold shadow-sm'
                : 'text-white/80 hover:text-white hover:bg-white/5'
            }`}
          >
            <Languages className="w-3.5 h-3.5" />
            <span className="hidden md:inline">2-Way</span>
          </button>

          <button
            onClick={() => setActiveTab('vocabulary')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
              activeTab === 'vocabulary'
                ? 'bg-white text-slate-900 font-semibold shadow-sm'
                : 'text-white/80 hover:text-white hover:bg-white/5'
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
            className="liquid-glass rounded-full px-3.5 py-1.5 flex items-center gap-2 text-xs select-none shadow-sm"
            title="Zero cloud streaming. Neural vision calculations and voice synthesis execute 100% in your browser."
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
            <span className="text-white/60 hidden md:inline text-[11px]">Privacy:</span>
            <span className="text-white text-[11px] font-medium flex items-center gap-1">
              <WifiOff className="w-3 h-3 text-emerald-400" />
              100% Local
            </span>
          </div>

          {/* Settings Trigger */}
          <button
            onClick={() => setShowSettingsModal(true)}
            className="liquid-glass rounded-full p-2 text-white/80 hover:text-white hover:bg-white/10 transition-all focus:outline-none"
            title="Configure System Engine Parameters"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-dropdown">
          <div className="bg-[#0F172A]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-7 w-full max-w-lg shadow-2xl text-white">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="liquid-glass p-2 rounded-xl text-white">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-medium text-base text-white">System Settings</h3>
                  <p className="text-xs text-white/60 font-normal">Fine-tune detection gates and synthesis</p>
                </div>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center text-lg transition-colors"
              >
                &times;
              </button>
            </div>

            <div className="mt-5 space-y-4 text-xs">
              {/* Confidence Threshold */}
              <div className="p-3.5 rounded-xl liquid-glass space-y-1.5">
                <div className="flex justify-between">
                  <span className="font-medium text-white/90">Confidence Trigger Threshold:</span>
                  <span className="font-mono text-white font-semibold">
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
                  className="w-full cursor-pointer"
                />
                <p className="text-[11px] text-white/50">
                  Signs below this threshold are held in hysteresis buffer or filtered as IDLE.
                </p>
              </div>

              {/* Temporal Debounce Frames */}
              <div className="p-3.5 rounded-xl liquid-glass space-y-1.5">
                <div className="flex justify-between">
                  <span className="font-medium text-white/90">Commit Consistency Window:</span>
                  <span className="font-mono text-white font-semibold">{settings.debounceFrames} frames</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="10"
                  step="1"
                  value={settings.debounceFrames}
                  onChange={(e) => updateSettings({ debounceFrames: parseInt(e.target.value, 10) })}
                  className="w-full cursor-pointer"
                />
                <p className="text-[11px] text-white/50">
                  Consecutive frame persistence required before committing gesture tokens.
                </p>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <label className="flex items-center gap-2.5 p-3 rounded-xl liquid-glass hover:bg-white/5 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={settings.enablePose}
                    onChange={(e) => updateSettings({ enablePose: e.target.checked })}
                    className="rounded accent-white"
                  />
                  <span className="text-xs text-white/90">Pose Skeleton</span>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-xl liquid-glass hover:bg-white/5 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={settings.drawLandmarks}
                    onChange={(e) => updateSettings({ drawLandmarks: e.target.checked })}
                    className="rounded accent-white"
                  />
                  <span className="text-xs text-white/90">Render Overlay</span>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-xl liquid-glass hover:bg-white/5 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={settings.cameraMirror}
                    onChange={(e) => updateSettings({ cameraMirror: e.target.checked })}
                    className="rounded accent-white"
                  />
                  <span className="text-xs text-white/90">Mirror Camera</span>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-xl liquid-glass hover:bg-white/5 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={settings.enableAudioFeedback}
                    onChange={(e) => updateSettings({ enableAudioFeedback: e.target.checked })}
                    className="rounded accent-white"
                  />
                  <span className="text-xs text-white/90">Audio Chimes</span>
                </label>
              </div>

              {/* Speech Voice Selection */}
              <div className="p-3.5 rounded-xl liquid-glass space-y-1.5">
                <label className="block font-medium text-white/90">
                  Offline Speech Synthesizer Voice:
                </label>
                <select
                  value={settings.ttsVoice}
                  onChange={(e) => updateSettings({ ttsVoice: e.target.value })}
                  className="w-full bg-[#0F172A] border border-white/10 rounded-lg p-2.5 text-white/90 font-mono text-xs focus:outline-none focus:border-white/30"
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
                className="px-6 py-2.5 rounded-full bg-white text-slate-900 font-semibold text-xs transition-all hover:bg-white/90 shadow-lg"
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
