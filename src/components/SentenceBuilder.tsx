'use client';

import React, { useState } from 'react';
import { useSignBridgeStore } from '@/store/useSignBridgeStore';
import { PRESENTATION_SCRIPT } from '@/lib/engine/pitchScript';
import InteractiveHoverButton from '@/components/ui/interactive-hover-button';
import {
  ArrowRight,
  Check,
  Copy,
  Delete,
  MessageSquare,
  RotateCcw,
  Sparkles,
  Volume2,
  CheckCircle2,
  Layers,
  Award,
} from 'lucide-react';

export const SentenceBuilder: React.FC = () => {
  const tokens = useSignBridgeStore((s) => s.tokens);
  const displayedSentences = useSignBridgeStore((s) => s.displayedSentences);
  const fullSentence = useSignBridgeStore((s) => s.fullSentence);
  const currentWord = useSignBridgeStore((s) => s.currentWord);
  const activeStageIndex = useSignBridgeStore((s) => s.activeStageIndex);
  const activeStageBadge = useSignBridgeStore((s) => s.activeStageBadge);
  const isSessionComplete = useSignBridgeStore((s) => s.isSessionComplete);
  const spokenWordsCount = useSignBridgeStore((s) => s.spokenWordsCount);
  const totalWordsAllStages = useSignBridgeStore((s) => s.totalWordsAllStages);
  const isSpeaking = useSignBridgeStore((s) => s.isSpeaking);

  const resetSession = useSignBridgeStore((s) => s.resetSession);
  const removeToken = useSignBridgeStore((s) => s.removeToken);
  const speakSentence = useSignBridgeStore((s) => s.speakSentence);

  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const textToCopy = displayedSentences.join('\n\n').trim() || fullSentence;
    if (!textToCopy?.trim()) return;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = async () => {
    await speakSentence();
  };

  const hasTokens = tokens.length > 0 || spokenWordsCount > 0;
  const progressPercent = Math.round((spokenWordsCount / totalWordsAllStages) * 100);

  return (
    <div className="liquid-card rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 text-white">
      {/* Header & Quick Action Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="liquid-glass p-2 rounded-xl text-white">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-sm text-white tracking-tight">
                4-Stage Sequential Kinetic Stream
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 liquid-glass rounded-full text-cyan-300 uppercase">
                {spokenWordsCount} / {totalWordsAllStages} Words ({progressPercent}%)
              </span>
            </div>
            <p className="text-[11px] text-white/50 font-normal">
              Physical hand pauses stream 4 pitch narrative stages word-by-word
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Reset Demo Session Button */}
          <button
            onClick={resetSession}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full liquid-glass text-amber-300/90 hover:text-amber-200 hover:bg-amber-500/10 transition-all font-mono active:scale-95 cursor-pointer"
            title="Reset entire demonstration session"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Demo Session</span>
          </button>

          {/* Copy Text Button */}
          <button
            onClick={handleCopy}
            disabled={!hasTokens}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs rounded-full liquid-glass transition-all active:scale-95 ${
              hasTokens
                ? 'text-white/80 hover:text-white hover:bg-white/10 cursor-pointer'
                : 'opacity-30 cursor-not-allowed text-white/40'
            }`}
            title="Copy entire presentation transcript to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 4-Stage Sleek Progress Pill Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {PRESENTATION_SCRIPT.map((stage, idx) => {
          const isCompleted = activeStageIndex > idx || isSessionComplete;
          const isCurrent = activeStageIndex === idx && !isSessionComplete;

          return (
            <div
              key={stage.stageId}
              className={`p-2.5 rounded-2xl border transition-all duration-300 flex flex-col gap-1 ${
                isCurrent
                  ? 'border-cyan-400/50 bg-cyan-950/30 text-white shadow-lg shadow-cyan-500/10'
                  : isCompleted
                  ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-200'
                  : 'border-white/5 bg-white/[0.02] text-white/40'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="font-semibold">{stage.badge}</span>
                {isCompleted ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : isCurrent ? (
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-white/20" />
                )}
              </div>
              <span className="text-xs font-medium truncate">{stage.stageTitle}</span>
            </div>
          );
        })}
      </div>

      {/* Demonstration Complete Green Banner */}
      {isSessionComplete && (
        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-400/40 text-emerald-200 flex items-center justify-between shadow-xl shadow-emerald-500/15 animate-in zoom-in-95 duration-300">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-400/20 text-emerald-300">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-emerald-100">
                ✓ Demonstration Sequence Complete
              </h4>
              <p className="text-xs text-emerald-300/80">
                All 4 stages spoken in real-time. System is locked and ready for Jury Q&A.
              </p>
            </div>
          </div>

          <button
            onClick={resetSession}
            className="px-4 py-2 rounded-full liquid-glass text-xs font-semibold text-emerald-100 hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
          >
            Run Demo Again
          </button>
        </div>
      )}

      {/* Live Pop-in Token Chips Carousel */}
      <div className="min-h-[70px] p-3.5 rounded-2xl liquid-glass flex items-center overflow-x-auto scrollbar-none">
        {tokens.length > 0 ? (
          <div className="flex items-center gap-2 flex-nowrap py-1">
            {tokens.map((token, index) => (
              <React.Fragment key={token.id}>
                <div
                  className={`group relative flex items-center gap-2 px-3.5 py-1.5 rounded-full text-white font-mono text-xs shadow-lg transition-all shrink-0 border animate-in zoom-in-90 duration-150 ${
                    index === tokens.length - 1
                      ? 'border-amber-400/60 bg-amber-950/50 text-amber-200 shadow-amber-500/25'
                      : 'border-cyan-400/20 liquid-glass text-cyan-100'
                  }`}
                >
                  <span className="font-semibold tracking-tight">{token.label}</span>
                  <button
                    onClick={() => removeToken(token.id)}
                    className="ml-1 text-white/50 hover:text-white opacity-60 group-hover:opacity-100 transition-opacity text-sm leading-none cursor-pointer"
                    title="Remove token"
                  >
                    &times;
                  </button>
                </div>

                {index < tokens.length - 1 && (
                  <ArrowRight className="w-3.5 h-3.5 text-cyan-400/40 shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>
        ) : (
          <div className="w-full flex items-center justify-center text-xs text-white/40 font-mono italic">
            Hold a deliberate hand gesture for ~300ms to trigger the first word &quot;{currentWord}&quot;...
          </div>
        )}
      </div>

      {/* Multi-Stage Assembled Transcript Container */}
      <div className="space-y-2.5">
        {PRESENTATION_SCRIPT.map((stage, stageIdx) => {
          const stageText = displayedSentences[stageIdx] || '';
          if (!stageText && stageIdx > activeStageIndex) return null;

          return (
            <div
              key={stage.stageId}
              className={`p-3.5 rounded-2xl transition-all duration-300 border ${
                activeStageIndex === stageIdx && !isSessionComplete
                  ? 'border-cyan-400/40 bg-cyan-950/20 text-white'
                  : stageText
                  ? 'border-emerald-500/30 bg-emerald-950/10 text-emerald-100'
                  : 'border-white/5 bg-white/[0.01] text-white/40'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="font-mono font-semibold text-cyan-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  {stage.badge}: {stage.stageTitle}
                </span>

                {activeStageIndex === stageIdx && isSpeaking && (
                  <div className="flex items-end gap-0.5 h-3.5">
                    <span className="w-0.5 h-3 bg-amber-400 animate-pulse" />
                    <span className="w-0.5 h-2 bg-amber-300 animate-bounce" />
                    <span className="w-0.5 h-3.5 bg-emerald-400 animate-pulse" />
                    <span className="w-0.5 h-1.5 bg-cyan-400 animate-bounce" />
                    <span className="text-[10px] font-mono text-amber-300 ml-1">Speaking Word...</span>
                  </div>
                )}
              </div>

              <p className="text-sm font-normal leading-relaxed text-white/90">
                {stageText || (
                  <span className="italic text-white/30 text-xs">
                    Stage pending gesture activation...
                  </span>
                )}
              </p>
            </div>
          );
        })}
      </div>

      {/* Action Controls: Speak Full Transcript & Script Summary */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
        {/* Interactive Hover Speak Button */}
        <InteractiveHoverButton
          text="Play Complete Presentation Audio"
          icon={<Volume2 className={`w-4 h-4 ${isSpeaking ? 'animate-bounce text-amber-400' : ''}`} />}
          onClick={handleSpeak}
          disabled={!hasTokens}
          className="min-w-64 active:scale-95"
        />

        {/* Script Progress Indicator */}
        <div className="flex items-center gap-2 text-xs font-mono text-white/60">
          <span>Active Target:</span>
          <span className="font-semibold text-cyan-300">
            {isSessionComplete ? '✓ Presentation Finished' : `"${currentWord}"`}
          </span>
        </div>
      </div>
    </div>
  );
};
