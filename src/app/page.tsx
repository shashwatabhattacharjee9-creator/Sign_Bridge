'use client';

import React, { useState } from 'react';
import { useSignBridgeStore } from '@/store/useSignBridgeStore';
import { Header } from '@/components/Header';
import { HeroSection } from '@/components/HeroSection';
import { VisionCanvas } from '@/components/VisionCanvas';
import { SentenceBuilder } from '@/components/SentenceBuilder';
import { TwoWayTranslator } from '@/components/TwoWayTranslator';
import { TelemetryPanel } from '@/components/TelemetryPanel';
import { VocabularyDirectory } from '@/components/VocabularyDirectory';
import { PracticeArena } from '@/components/PracticeArena';
import { QuickCalibrator } from '@/components/QuickCalibrator';
import { motion } from 'framer-motion';
import {
  Activity,
  BookOpen,
  Ear,
  GraduationCap,
  Layers,
  Radio,
  Sliders,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react';

export default function Home() {
  const { activeTab, setActiveTab } = useSignBridgeStore();
  const [rightTab, setRightTab] = useState<'telemetry' | 'calibrator' | 'translate' | 'vocabulary' | 'practice'>('telemetry');

  // If in Hero landing view, render the requested Fullscreen Hero Section directly
  if (activeTab === 'hero') {
    return (
      <main className="w-full h-screen overflow-hidden bg-black font-sans">
        <HeroSection
          onStartTranslating={() => setActiveTab('vision')}
          onPracticeSigns={() => setActiveTab('practice')}
          onOpenDictionary={() => setActiveTab('vocabulary')}
        />
      </main>
    );
  }

  const rightTabs = [
    { id: 'telemetry', label: 'Telemetry', icon: Activity },
    { id: 'calibrator', label: 'Calibrate', icon: Target },
    { id: 'translate', label: '2-Way', icon: Ear },
    { id: 'vocabulary', label: '30 Signs', icon: BookOpen },
    { id: 'practice', label: 'Practice', icon: GraduationCap },
  ] as const;

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black">
      {/* Top Header with Title, Tagline, Offline Badge, and Controls */}
      <Header />

      {/* Master Responsive Presentation Dashboard */}
      <main className="flex-1 max-w-[1640px] w-full mx-auto p-3 sm:p-5 lg:p-6 space-y-4">
        {activeTab === 'vision' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left Column (7 cols): VisionCanvas (Top) + SentenceBuilder (Bottom) */}
            <div className="lg:col-span-7 flex flex-col space-y-4">
              <VisionCanvas />
              <SentenceBuilder />
            </div>

            {/* Right Column (5 cols): Tabbed Sidebar */}
            <div className="lg:col-span-5 flex flex-col space-y-3">
              {/* Right Sidebar Quick Switcher Tabs with Framer Motion Spring Pill */}
              <div className="relative flex items-center liquid-glass p-1 rounded-full shadow-lg gap-0.5 overflow-x-auto scrollbar-thin">
                {rightTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = rightTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => setRightTab(tab.id as any)}
                      className={`relative flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-full text-xs font-medium shrink-0 transition-colors duration-200 z-10 select-none ${
                        isActive
                          ? 'text-black font-semibold'
                          : 'text-white/80 hover:text-white'
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeRightTabPill"
                          className="absolute inset-0 rounded-full bg-white shadow-sm z-[-1]"
                          transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                        />
                      )}
                      <Icon className="w-3.5 h-3.5 relative z-10" />
                      <span className="relative z-10">{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Tabbed Content */}
              {rightTab === 'telemetry' && <TelemetryPanel />}
              {rightTab === 'calibrator' && <QuickCalibrator />}
              {rightTab === 'translate' && <TwoWayTranslator />}
              {rightTab === 'vocabulary' && <VocabularyDirectory />}
              {rightTab === 'practice' && <PracticeArena />}
            </div>
          </div>
        ) : activeTab === 'calibration' ? (
          <div className="max-w-5xl mx-auto space-y-4">
            <QuickCalibrator />
          </div>
        ) : activeTab === 'practice' ? (
          <div className="space-y-4">
            <PracticeArena />
          </div>
        ) : activeTab === 'translate' ? (
          <div className="max-w-4xl mx-auto space-y-4">
            <TwoWayTranslator />
          </div>
        ) : (
          <div className="max-w-5xl mx-auto space-y-4">
            <VocabularyDirectory />
          </div>
        )}
      </main>

      {/* Technical Footnote & Edge-AI Pipeline Diagram */}
      <footer className="border-t border-white/5 bg-black/90 backdrop-blur-2xl py-4 px-5 sm:px-6 md:px-12 lg:px-16 mt-6">
        <div className="max-w-[1640px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-white/50">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="font-medium text-white">SignBridge Architecture:</span>
            <span className="font-mono text-white/40 hidden lg:inline">
              Webcam (30 FPS) &rarr; MediaPipe Landmarks &rarr; Adaptive Hysteresis &rarr; Fast DTW + Cosine Matcher &rarr; Native Offline TTS
            </span>
          </div>

          <div className="flex items-center gap-3 text-white/50 font-mono text-[11px]">
            <span className="text-white/80 font-medium">🔒 100% Client-Side Local</span>
            <span>•</span>
            <span className="text-white/80">Dynamic In-Browser Calibration</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
