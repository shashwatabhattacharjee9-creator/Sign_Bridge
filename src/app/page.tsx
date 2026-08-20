'use client';

import React, { useState } from 'react';
import { useSignBridgeStore } from '@/store/useSignBridgeStore';
import { Header } from '@/components/Header';
import { VisionCanvas } from '@/components/VisionCanvas';
import { SentenceBuilder } from '@/components/SentenceBuilder';
import { TwoWayTranslator } from '@/components/TwoWayTranslator';
import { TelemetryPanel } from '@/components/TelemetryPanel';
import { VocabularyDirectory } from '@/components/VocabularyDirectory';
import { PracticeArena } from '@/components/PracticeArena';
import { CalibrationStudio } from '@/components/CalibrationStudio';
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
  const [rightTab, setRightTab] = useState<'telemetry' | 'calibration' | 'translate' | 'vocabulary' | 'practice'>('telemetry');

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#06090F] text-slate-100 font-sans selection:bg-brand-emerald selection:text-black">
      {/* Top Header with Title, Tagline, Offline Badge, and Controls */}
      <Header />

      {/* Master Responsive Presentation Dashboard */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-3 sm:p-5 lg:p-6 space-y-4">
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
              <div className="flex items-center bg-surface-100 p-1.5 rounded-xl border border-surface-200 shadow-inner gap-1 overflow-x-auto scrollbar-thin">
                <button
                  onClick={() => setRightTab('telemetry')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold shrink-0 transition-all ${
                    rightTab === 'telemetry'
                      ? 'bg-surface-300 text-brand-emerald shadow-md border border-surface-200'
                      : 'text-slate-400 hover:text-white hover:bg-surface-200/50'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Telemetry HUD</span>
                </button>

                <button
                  onClick={() => setRightTab('calibration')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold shrink-0 transition-all ${
                    rightTab === 'calibration'
                      ? 'bg-surface-300 text-brand-cyan shadow-md border border-surface-200'
                      : 'text-slate-400 hover:text-white hover:bg-surface-200/50'
                  }`}
                >
                  <Target className="w-3.5 h-3.5" />
                  <span>Calibrate</span>
                </button>

                <button
                  onClick={() => setRightTab('translate')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold shrink-0 transition-all ${
                    rightTab === 'translate'
                      ? 'bg-surface-300 text-brand-cyan shadow-md border border-surface-200'
                      : 'text-slate-400 hover:text-white hover:bg-surface-200/50'
                  }`}
                >
                  <Ear className="w-3.5 h-3.5" />
                  <span>2-Way</span>
                </button>

                <button
                  onClick={() => setRightTab('vocabulary')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold shrink-0 transition-all ${
                    rightTab === 'vocabulary'
                      ? 'bg-surface-300 text-slate-100 shadow-md border border-surface-200'
                      : 'text-slate-400 hover:text-white hover:bg-surface-200/50'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5 text-brand-amber" />
                  <span>30 Signs</span>
                </button>

                <button
                  onClick={() => setRightTab('practice')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold shrink-0 transition-all ${
                    rightTab === 'practice'
                      ? 'bg-surface-300 text-brand-amber shadow-md border border-surface-200'
                      : 'text-slate-400 hover:text-white hover:bg-surface-200/50'
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Practice</span>
                </button>
              </div>

              {/* Tabbed Content */}
              {rightTab === 'telemetry' && <TelemetryPanel />}
              {rightTab === 'calibration' && <CalibrationStudio />}
              {rightTab === 'translate' && <TwoWayTranslator />}
              {rightTab === 'vocabulary' && <VocabularyDirectory />}
              {rightTab === 'practice' && <PracticeArena />}
            </div>
          </div>
        ) : activeTab === 'calibration' ? (
          <div className="max-w-5xl mx-auto space-y-4">
            <CalibrationStudio />
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
      <footer className="border-t border-surface-200 bg-surface-50/60 py-4 px-4 sm:px-8 mt-6">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-brand-emerald animate-pulse" />
            <span className="font-bold text-white">SignBridge Architecture:</span>
            <span className="font-mono text-slate-400 hidden lg:inline">
              Webcam (30 FPS) &rarr; MediaPipe &rarr; Orthonormal Frame (63D) &rarr; Kinetic Boundary Gate &rarr; Web Worker Cosine Match &rarr; Offline TTS
            </span>
          </div>

          <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
            <span className="text-brand-emerald font-semibold">🔒 100% Zero-Cloud Privacy</span>
            <span>•</span>
            <span className="text-brand-cyan">Hardware Accelerated</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
