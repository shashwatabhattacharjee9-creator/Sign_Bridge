'use client';

import React, { useEffect } from 'react';
import { useSignBridgeStore } from '@/store/useSignBridgeStore';
import { ISL_VOCABULARY, ISL_SIGNS_LIST } from '@/lib/engine/gestureLibrary';
import { VisionCanvas } from './VisionCanvas';
import { TelemetryPanel } from './TelemetryPanel';
import {
  Award,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  RotateCcw,
  Sparkles,
  Trophy,
} from 'lucide-react';
import confetti from 'canvas-confetti';

import { navigationStateManager } from '@/lib/engine/navigationState';
import { audioLatchEngine } from '@/lib/audio/tts';

export const PracticeArena: React.FC = () => {
  const { practice, startPractice, stopPractice, currentSign, confidence } = useSignBridgeStore();

  useEffect(() => {
    navigationStateManager.setMode('practice');
    audioLatchEngine.killAllSpeech();

    return () => {
      audioLatchEngine.killAllSpeech();
    };
  }, []);

  const activeSignId = practice?.signId || 'HELP';
  const targetSign = ISL_VOCABULARY[activeSignId];

  // Trigger confetti when success condition is met
  useEffect(() => {
    if (practice?.isSuccess) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFFFFF', '#10B981', '#06B6D4', '#F59E0B'],
      });
    }
  }, [practice?.isSuccess]);

  const currentIndex = ISL_SIGNS_LIST.findIndex((s) => s.id === activeSignId);

  const handleNext = () => {
    const nextIndex = (currentIndex + 1) % ISL_SIGNS_LIST.length;
    startPractice(ISL_SIGNS_LIST[nextIndex].id);
  };

  const handlePrev = () => {
    const prevIndex = (currentIndex - 1 + ISL_SIGNS_LIST.length) % ISL_SIGNS_LIST.length;
    startPractice(ISL_SIGNS_LIST[prevIndex].id);
  };

  const holdProgressPct = practice
    ? Math.min(100, Math.round((practice.currentHoldingFrames / practice.targetHoldingFrames) * 100))
    : 0;

  return (
    <div className="space-y-6">
      {/* Top Practice Target Guide Banner */}
      <div className="liquid-card rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4 text-white">
        <div className="flex items-center gap-4">
          <div className="text-4xl p-3.5 rounded-2xl liquid-glass shadow-inner">
            {targetSign.emoji}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase px-2.5 py-0.5 liquid-glass rounded-full text-white/80 font-medium">
                Sign {currentIndex + 1} of {ISL_SIGNS_LIST.length}
              </span>
              <span className="text-xs text-white/50 font-mono">
                {targetSign.motionType === 'dynamic' ? 'Dynamic Trajectory' : 'Static Pose'}
              </span>
            </div>

            <h2 className="text-2xl font-medium text-white tracking-tight mt-1">
              Practice: {targetSign.label}
            </h2>
            <p className="text-xs text-white/70 font-normal">
              {targetSign.hindiTranslation}
            </p>
          </div>
        </div>

        {/* Practice Hold Progress Gauge */}
        <div className="w-full md:w-80 liquid-glass rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-white/60 flex items-center gap-1.5 font-medium">
              <Trophy className="w-3.5 h-3.5 text-amber-300" />
              Mastery Hold Progress:
            </span>
            <span
              className={`font-semibold ${
                practice?.isSuccess ? 'text-emerald-400' : 'text-white'
              }`}
            >
              {holdProgressPct}%
            </span>
          </div>

          <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className={`h-full transition-all duration-100 rounded-full ${
                practice?.isSuccess
                  ? 'bg-white'
                  : 'bg-gradient-to-r from-white/40 via-white/80 to-white'
              }`}
              style={{ width: `${holdProgressPct}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-white/50 font-mono">
            <span>{practice?.feedback || 'Hold sign in front of camera'}</span>
            {practice?.isSuccess && (
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Mastered!
              </span>
            )}
          </div>
        </div>

        {/* Navigation Arrows */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            className="p-2.5 rounded-full liquid-glass text-white/70 hover:text-white hover:bg-white/10 transition-all"
            title="Previous Sign"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNext}
            className="p-2.5 rounded-full liquid-glass text-white/70 hover:text-white hover:bg-white/10 transition-all"
            title="Next Sign"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Practice Workspace: Camera + Live Instructions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 Columns: Vision Canvas */}
        <div className="lg:col-span-7">
          <VisionCanvas />
        </div>

        {/* Right 5 Columns: Step Guide & Live Telemetry */}
        <div className="lg:col-span-5 space-y-4">
          {/* Detailed Instructions Card */}
          <div className="liquid-card rounded-3xl p-5 sm:p-6 shadow-2xl space-y-3 text-white">
            <div className="flex items-center gap-2 text-xs font-medium text-white tracking-tight">
              <GraduationCap className="w-4 h-4 text-white/70" />
              <span>Gesture Instructions:</span>
            </div>

            <p className="text-xs text-white/80 leading-relaxed font-sans font-normal">{targetSign.description}</p>

            <div className="space-y-2 pt-1">
              {targetSign.instructions.map((inst, i) => (
                <div
                  key={i}
                  className="liquid-glass rounded-xl p-3 text-xs text-white/80 flex items-start gap-2.5 font-sans"
                >
                  <span className="w-4 h-4 rounded-full bg-white/20 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span>{inst}</span>
                </div>
              ))}
            </div>

            {/* Key anatomical triggers */}
            <div className="pt-2 border-t border-white/5">
              <div className="text-[11px] font-mono text-white/60 mb-1.5 font-medium">
                Key Landmark Triggers:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {targetSign.keyPoints.map((kp, i) => (
                  <span
                    key={i}
                    className="text-[10px] font-mono px-2.5 py-1 rounded-full liquid-glass text-white/80"
                  >
                    {kp}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <TelemetryPanel />
        </div>
      </div>
    </div>
  );
};
