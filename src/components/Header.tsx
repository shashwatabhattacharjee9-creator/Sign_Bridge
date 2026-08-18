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
  Volume2,
  Wifi,
  WifiOff,
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
      <header className="sticky top-0 z-50 border-b border-surface-200 bg-background/90 backdrop-blur-md px-4 lg:px-8 py-3.5 flex items-center justify-between">
        {/* Brand & Tagline */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-emeraldDark to-brand-emerald text-white shadow-lg shadow-brand-emerald/20">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xl tracking-tight text-white">SignBridge</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-surface-100 text-brand-emerald border border-brand-emerald/30 font-semibold">
                ISL Edge AI
              </span>
            </div>
            <p className="text-xs text-slate-400 font-normal hidden sm:block">
              Zero-Cloud Real-Time Indian Sign Language Interpreter
            </p>
          </div>
        </div>

        {/* Navigation Switcher */}
        <nav className="flex items-center bg-surface-100/90 p-1 rounded-xl border border-surface-200 shadow-inner">
          <button
            onClick={() => setActiveTab('vision')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'vision'
                ? 'bg-surface-300 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-surface-200/50'
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-brand-emerald" />
            <span>Live Vision</span>
          </button>

          <button
            onClick={() => setActiveTab('practice')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'practice'
                ? 'bg-surface-300 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-surface-200/50'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 text-brand-amber" />
            <span>Practice Arena</span>
          </button>

          <button
            onClick={() => setActiveTab('translate')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'translate'
                ? 'bg-surface-300 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-surface-200/50'
            }`}
          >
            <Languages className="w-3.5 h-3.5 text-brand-cyan" />
            <span>2-Way Bridge</span>
          </button>

          <button
            onClick={() => setActiveTab('vocabulary')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'vocabulary'
                ? 'bg-surface-300 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-surface-200/50'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-slate-300" />
            <span>30 ISL Signs</span>
          </button>
        </nav>

        {/* Offline Badge & Settings Trigger */}
        <div className="flex items-center gap-3">
          {/* 100% Offline Status Badge */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-100 border border-surface-200 text-xs font-mono"
            title="All neural math, normalization, and speech synthesis run 100% locally in your browser."
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-emerald opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-emerald"></span>
            </span>
            <span className="text-slate-300 hidden md:inline">Client Local:</span>
            <span className="text-brand-emerald font-semibold flex items-center gap-1">
              <WifiOff className="w-3 h-3" />
              100% Offline
            </span>
          </div>

          {/* Settings Modal Toggle */}
          <button
            onClick={() => setShowSettingsModal(true)}
            className="p-2 rounded-lg bg-surface-100 hover:bg-surface-200 text-slate-300 border border-surface-200 transition-colors"
            title="Configure Vision & Inference Parameters"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-surface-100 border border-surface-200 rounded-2xl p-6 w-full max-w-lg shadow-2xl text-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-surface-200">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-brand-emerald" />
                <h3 className="font-semibold text-lg text-white">SignBridge System Settings</h3>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-400 hover:text-white text-xl leading-none"
              >
                &times;
              </button>
            </div>

            <div className="mt-5 space-y-4 text-xs">
              {/* Confidence Threshold */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="font-medium text-slate-300">Confidence Gate Threshold:</span>
                  <span className="font-mono text-brand-emerald">
                    {Math.round(settings.minConfidence * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.60"
                  max="0.95"
                  step="0.01"
                  value={settings.minConfidence}
                  onChange={(e) => updateSettings({ minConfidence: parseFloat(e.target.value) })}
                  className="w-full accent-brand-emerald"
                />
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Signs below this probability threshold are marked as UNCERTAIN.
                </p>
              </div>

              {/* Temporal Debounce Frames */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="font-medium text-slate-300">Debounce Consistency Frames:</span>
                  <span className="font-mono text-brand-cyan">{settings.debounceFrames} frames</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="12"
                  step="1"
                  value={settings.debounceFrames}
                  onChange={(e) => updateSettings({ debounceFrames: parseInt(e.target.value, 10) })}
                  className="w-full accent-brand-cyan"
                />
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Consecutive frame persistence required before committing a gesture token.
                </p>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <label className="flex items-center gap-2 p-2.5 rounded-lg bg-surface-50 border border-surface-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enablePose}
                    onChange={(e) => updateSettings({ enablePose: e.target.checked })}
                    className="accent-brand-emerald"
                  />
                  <span>Track Pose Skeleton</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-lg bg-surface-50 border border-surface-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.drawLandmarks}
                    onChange={(e) => updateSettings({ drawLandmarks: e.target.checked })}
                    className="accent-brand-emerald"
                  />
                  <span>Render Overlays</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-lg bg-surface-50 border border-surface-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.cameraMirror}
                    onChange={(e) => updateSettings({ cameraMirror: e.target.checked })}
                    className="accent-brand-emerald"
                  />
                  <span>Mirror Camera</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-lg bg-surface-50 border border-surface-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enableAudioFeedback}
                    onChange={(e) => updateSettings({ enableAudioFeedback: e.target.checked })}
                    className="accent-brand-emerald"
                  />
                  <span>Audio Chimes</span>
                </label>
              </div>

              {/* Speech Voice Selection */}
              <div className="pt-2">
                <label className="block font-medium text-slate-300 mb-1">
                  Offline Speech Voice (Web Speech API):
                </label>
                <select
                  value={settings.ttsVoice}
                  onChange={(e) => updateSettings({ ttsVoice: e.target.value })}
                  className="w-full bg-surface-50 border border-surface-200 rounded-lg p-2 text-slate-200 font-mono text-xs"
                >
                  <option value="">Default System Voice</option>
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
                className="px-5 py-2 rounded-xl bg-brand-emerald hover:bg-brand-emeraldLight text-slate-950 font-semibold text-xs transition-colors"
              >
                Apply & Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
