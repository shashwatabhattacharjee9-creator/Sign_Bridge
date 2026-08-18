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

export const PracticeArena: React.FC = () => {
  const { practice, startPractice, stopPractice, currentSign, confidence } = useSignBridgeStore();

  const activeSignId = practice?.signId || 'HELP';
  const targetSign = ISL_VOCABULARY[activeSignId];

  // Trigger confetti when success condition is met
  useEffect(() => {
    if (practice?.isSuccess) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10B981', '#06B6D4', '#F59E0B', '#34D399'],
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
      <div className="bg-surface-100 border border-surface-200 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="text-4xl p-3 rounded-2xl bg-surface-50 border border-surface-200 shadow-inner">
            {targetSign.emoji}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-brand-amber/10 text-brand-amber border border-brand-amber/20 font-semibold">
                Sign {currentIndex + 1} of {ISL_SIGNS_LIST.length}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {targetSign.motionType === 'dynamic' ? 'Dynamic' : 'Static'}
              </span>
            </div>

            <h2 className="text-2xl font-bold text-white tracking-wide mt-0.5">
              Practice: {targetSign.label}
            </h2>
            <p className="text-xs text-brand-emerald font-medium">
              {targetSign.hindiTranslation}
            </p>
          </div>
        </div>

        {/* Practice Hold Progress Gauge */}
        <div className="w-full md:w-80 bg-surface-50 border border-surface-200 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-brand-amber" />
              Mastery Hold Progress:
            </span>
            <span
              className={`font-bold ${
                practice?.isSuccess ? 'text-brand-emerald' : 'text-brand-amber'
              }`}
            >
              {holdProgressPct}%
            </span>
          </div>

          <div className="w-full h-2.5 rounded-full bg-surface-200 overflow-hidden">
            <div
              className={`h-full transition-all duration-100 ${
                practice?.isSuccess
                  ? 'bg-brand-emerald'
                  : 'bg-gradient-to-r from-brand-amber to-brand-emerald'
              }`}
              style={{ width: `${holdProgressPct}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>{practice?.feedback || 'Form sign in front of camera'}</span>
            {practice?.isSuccess && (
              <span className="text-brand-emerald font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Mastered!
              </span>
            )}
          </div>
        </div>

        {/* Navigation Arrows */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            className="p-2 rounded-xl bg-surface-50 hover:bg-surface-200 text-slate-300 border border-surface-200 transition-colors"
            title="Previous Sign"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNext}
            className="p-2 rounded-xl bg-surface-50 hover:bg-surface-200 text-slate-300 border border-surface-200 transition-colors"
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
          <div className="bg-surface-100 border border-surface-200 rounded-2xl p-5 shadow-lg space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-white uppercase tracking-wider">
              <GraduationCap className="w-4 h-4 text-brand-amber" />
              <span>Gesture Instructions:</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">{targetSign.description}</p>

            <div className="space-y-1.5 pt-1">
              {targetSign.instructions.map((inst, i) => (
                <div
                  key={i}
                  className="bg-surface-50 border border-surface-200/80 rounded-xl p-2.5 text-xs text-slate-300 flex items-start gap-2.5"
                >
                  <span className="w-4 h-4 rounded-full bg-brand-emerald/20 text-brand-emerald text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span>{inst}</span>
                </div>
              ))}
            </div>

            {/* Key anatomical triggers */}
            <div className="pt-2 border-t border-surface-200">
              <div className="text-[11px] font-mono text-slate-400 mb-1.5 font-semibold">
                Anatomical Landmark Triggers:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {targetSign.keyPoints.map((kp, i) => (
                  <span
                    key={i}
                    className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-surface-50 text-brand-cyan border border-surface-200"
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
