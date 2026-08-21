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

  // If in Hero landing view, render the requested Fullscreen Hero Section
  if (activeTab === 'hero') {
    return (
      <main className="w-full h-screen overflow-hidden bg-[#07090E] font-sans">
        <HeroSection
          onStartTranslating={() => setActiveTab('vision')}
          onPracticeSigns={() => setActiveTab('practice')}
          onOpenDictionary={() => setActiveTab('vocabulary')}
        />
      </main>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-ambient-mesh text-slate-100 font-sans selection:bg-emerald-400 selection:text-slate-950">
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
              {/* Right Sidebar Quick Switcher Tabs */}
              <div className="flex items-center bg-white/[0.03] p-1.5 rounded-2xl border border-white/[0.08] shadow-inner gap-1 overflow-x-auto scrollbar-thin backdrop-blur-xl">
                <button
                  onClick={() => setRightTab('telemetry')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                    rightTab === 'telemetry'
                      ? 'bg-white/10 text-emerald-400 shadow-md border border-white/15'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Telemetry</span>
                </button>

                <button
                  onClick={() => setRightTab('calibrator')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                    rightTab === 'calibrator'
                      ? 'bg-white/10 text-cyan-400 shadow-md border border-white/15'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <Target className="w-3.5 h-3.5" />
                  <span>Calibrate</span>
                </button>

                <button
                  onClick={() => setRightTab('translate')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                    rightTab === 'translate'
                      ? 'bg-white/10 text-cyan-400 shadow-md border border-white/15'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <Ear className="w-3.5 h-3.5" />
                  <span>2-Way</span>
                </button>

                <button
                  onClick={() => setRightTab('vocabulary')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                    rightTab === 'vocabulary'
                      ? 'bg-white/10 text-slate-100 shadow-md border border-white/15'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                  <span>30 Signs</span>
                </button>

                <button
                  onClick={() => setRightTab('practice')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                    rightTab === 'practice'
                      ? 'bg-white/10 text-amber-400 shadow-md border border-white/15'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Practice</span>
                </button>
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
      <footer className="border-t border-white/[0.08] bg-[#07090E]/80 backdrop-blur-2xl py-4 px-4 sm:px-8 mt-6">
        <div className="max-w-[1640px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-white">SignBridge Architecture:</span>
            <span className="font-mono text-slate-400 hidden lg:inline">
              Webcam (30 FPS) &rarr; MediaPipe Landmarks &rarr; Adaptive Hysteresis &rarr; Fast DTW + Cosine Matcher &rarr; Native Offline TTS
            </span>
          </div>

          <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
            <span className="text-emerald-400 font-semibold">🔒 100% Client-Side Local</span>
            <span>•</span>
            <span className="text-cyan-400">Dynamic In-Browser Calibration</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
