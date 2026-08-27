'use client';

import React, { useEffect, useState } from 'react';
import { useSignBridgeStore } from '@/store/useSignBridgeStore';
import { motion, AnimatePresence } from 'framer-motion';
import InteractiveHoverButton from '@/components/ui/interactive-hover-button';
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
  Users,
} from 'lucide-react';

import { navigationStateManager, AppMode } from '@/lib/engine/navigationState';
import { audioLatchEngine } from '@/lib/audio/tts';

export const Header: React.FC = () => {
  const { activeTab, setActiveTab, telemetry, updateTelemetry, settings, updateSettings } = useSignBridgeStore();
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  const handleTabClick = (tabKey: any) => {
    audioLatchEngine.killAllSpeech();
    const appMode: AppMode = tabKey === 'vision' ? 'studio' : (tabKey as AppMode);
    navigationStateManager.setMode(appMode);
    setActiveTab(tabKey);
  };

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

  const navItems = [
    { id: 'hero', label: 'Overview', icon: Home, hideOnSmall: true },
    { id: 'vision', label: 'Studio', icon: Camera, hideOnSmall: false },
    { id: 'peer', label: 'Peer Chat', icon: Users, hideOnSmall: false },
    { id: 'calibration', label: 'Calibrate', icon: Target, hideOnSmall: false },
    { id: 'practice', label: 'Practice', icon: GraduationCap, hideOnSmall: true },
    { id: 'translate', label: '2-Way', icon: Languages, hideOnSmall: true },
    { id: 'vocabulary', label: '30 Signs', icon: BookOpen, hideOnSmall: true },
  ] as const;

  return (
    <>
      <header className="sticky top-0 z-40 w-full px-5 sm:px-6 md:px-12 lg:px-16 py-3.5 sm:py-4 flex items-center justify-between border-b border-white/5 bg-black/90 backdrop-blur-2xl transition-all">
        {/* Brand & Identity */}
        <motion.div
          onClick={() => handleTabClick('hero')}
          className="group flex items-center gap-3 cursor-pointer select-none"
          title="Return to Landing Overview"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {/* Waveform Diamond SVG Logo */}
          <svg
            className="w-7 h-7 shrink-0 text-white transition-transform duration-300 group-hover:rotate-6"
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
        </motion.div>

        {/* Smooth Animated Segmented Navigation Bar */}
        <nav className="relative flex items-center liquid-glass rounded-full p-1 shadow-lg gap-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors duration-200 z-10 select-none ${
                  isActive ? 'text-black font-semibold' : 'text-white/80 hover:text-white'
                }`}
              >
                {/* Floating Gliding Active Indicator Pill */}
                {isActive && (
                  <motion.div
                    layoutId="activeNavPill"
                    className="absolute inset-0 rounded-full bg-white shadow-sm z-[-1]"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}

                <Icon className="w-3.5 h-3.5 relative z-10" />
                <span className={`relative z-10 ${item.hideOnSmall ? 'hidden sm:inline' : ''}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Status Pill & Settings Controls */}
        <div className="flex items-center gap-3">
          {/* Edge Privacy Shield Pill */}
          <div
            className="liquid-glass rounded-full px-3.5 py-1.5 flex items-center gap-2 text-xs select-none shadow-sm"
            title="Zero cloud streaming. Neural vision calculations and voice synthesis execute 100% in your browser."
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            <span className="text-white/60 hidden md:inline text-[11px]">Privacy:</span>
            <span className="text-white text-[11px] font-medium flex items-center gap-1">
              <WifiOff className="w-3 h-3 text-white" />
              100% Local
            </span>
          </div>

          {/* Settings Trigger with Interactive Hover Animation */}
          <motion.button
            onClick={() => setShowSettingsModal(true)}
            className="liquid-glass rounded-full p-2 text-white/80 hover:text-white hover:bg-white/10 transition-all focus:outline-none cursor-pointer"
            whileHover={{ scale: 1.08, rotate: 15 }}
            whileTap={{ scale: 0.92 }}
            title="Configure System Engine Parameters"
          >
            <Sliders className="w-4 h-4" />
          </motion.button>
        </div>
      </header>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettingsModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-[#0A0A0A] border border-white/10 rounded-3xl p-6 sm:p-7 w-full max-w-lg shadow-2xl text-white"
              initial={{ scale: 0.94, y: 10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.94, y: 10, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            >
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
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center text-lg transition-colors cursor-pointer"
                >
                  &times;
                </button>
              </div>

              <div className="mt-5 space-y-4 text-xs">
                {/* Confidence Threshold */}
                <div className="p-3.5 rounded-2xl liquid-glass space-y-1.5">
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
                <div className="p-3.5 rounded-2xl liquid-glass space-y-1.5">
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
                  <label className="flex items-center gap-2.5 p-3 rounded-2xl liquid-glass hover:bg-white/5 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={settings.enablePose}
                      onChange={(e) => updateSettings({ enablePose: e.target.checked })}
                      className="rounded accent-white"
                    />
                    <span className="text-xs text-white/90">Pose Skeleton</span>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 rounded-2xl liquid-glass hover:bg-white/5 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={settings.drawLandmarks}
                      onChange={(e) => updateSettings({ drawLandmarks: e.target.checked })}
                      className="rounded accent-white"
                    />
                    <span className="text-xs text-white/90">Render Overlay</span>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 rounded-2xl liquid-glass hover:bg-white/5 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={settings.cameraMirror}
                      onChange={(e) => updateSettings({ cameraMirror: e.target.checked })}
                      className="rounded accent-white"
                    />
                    <span className="text-xs text-white/90">Mirror Camera</span>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 rounded-2xl liquid-glass hover:bg-white/5 cursor-pointer transition-colors">
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
                <div className="p-3.5 rounded-2xl liquid-glass space-y-1.5">
                  <label className="block font-medium text-white/90">
                    Offline Speech Synthesizer Voice:
                  </label>
                  <select
                    value={settings.ttsVoice}
                    onChange={(e) => updateSettings({ ttsVoice: e.target.value })}
                    className="w-full bg-black border border-white/10 rounded-xl p-2.5 text-white/90 font-mono text-xs focus:outline-none focus:border-white/30"
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
                <InteractiveHoverButton
                  text="Apply Parameters"
                  onClick={() => setShowSettingsModal(false)}
                  className="min-w-44"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
