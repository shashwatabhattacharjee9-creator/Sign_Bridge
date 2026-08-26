'use client';

import React, { useState } from 'react';
import { useSignBridgeStore } from '@/store/useSignBridgeStore';
import { PITCH_WORD_STREAM } from '@/lib/engine/wordStreamEngine';
import InteractiveHoverButton from '@/components/ui/interactive-hover-button';
import {
  ArrowRight,
  Check,
  Copy,
  Delete,
  MessageSquare,
  RotateCcw,
  Sparkles,
  Trash2,
  Volume2,
  CheckCircle2,
} from 'lucide-react';

export const SentenceBuilder: React.FC = () => {
  const tokens = useSignBridgeStore((s) => s.tokens);
  const fullSentence = useSignBridgeStore((s) => s.fullSentence);
  const currentWord = useSignBridgeStore((s) => s.currentWord);
  const wordIndex = useSignBridgeStore((s) => s.wordIndex);
  const totalWords = useSignBridgeStore((s) => s.totalWords);
  const isSpeaking = useSignBridgeStore((s) => s.isSpeaking);
  const ttsEnabled = useSignBridgeStore((s) => s.ttsEnabled);

  const popSentenceToken = useSignBridgeStore((s) => s.popSentenceToken);
  const resetScript = useSignBridgeStore((s) => s.resetScript);
  const toggleTTS = useSignBridgeStore((s) => s.toggleTTS);
  const removeToken = useSignBridgeStore((s) => s.removeToken);
  const setFullSentence = useSignBridgeStore((s) => s.setFullSentence);
  const speakSentence = useSignBridgeStore((s) => s.speakSentence);

  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const textToCopy = fullSentence || tokens.map((s) => s.label).join(' ');
    if (!textToCopy?.trim()) return;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = async () => {
    await speakSentence();
  };

  const hasTokens = tokens.length > 0;

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
                Sequential Word-by-Word Stream
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 liquid-glass rounded-full text-cyan-300 uppercase">
                Word {Math.min(tokens.length, totalWords)} / {totalWords}
              </span>
            </div>
            <p className="text-[11px] text-white/50 font-normal">
              Execute a gesture hold to speak each pitch narrative token in real-time
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Reset Script Button */}
          <button
            onClick={resetScript}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full liquid-glass text-amber-300/80 hover:text-amber-200 hover:bg-amber-500/10 transition-all font-mono active:scale-95 cursor-pointer"
            title="Reset narrative script to beginning"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Script</span>
          </button>

          {/* Backspace Button */}
          <button
            onClick={popSentenceToken}
            disabled={!hasTokens}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full liquid-glass transition-all font-mono active:scale-95 ${
              hasTokens
                ? 'text-white/80 hover:text-white hover:bg-white/10 cursor-pointer'
                : 'opacity-30 cursor-not-allowed text-white/40'
            }`}
            title="Backspace: Remove last committed token"
          >
            <Delete className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Backspace</span>
          </button>

          {/* Copy Text Button */}
          <button
            onClick={handleCopy}
            disabled={!hasTokens && !fullSentence}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs rounded-full liquid-glass transition-all active:scale-95 ${
              hasTokens || fullSentence
                ? 'text-white/80 hover:text-white hover:bg-white/10 cursor-pointer'
                : 'opacity-30 cursor-not-allowed text-white/40'
            }`}
            title="Copy transcribed pitch to clipboard"
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

      {/* Real-Time Word Stream Strip */}
      <div className="min-h-[76px] p-3.5 rounded-2xl liquid-glass flex items-center overflow-x-auto scrollbar-none">
        {tokens.length > 0 ? (
          <div className="flex items-center gap-2 flex-nowrap py-1">
            {tokens.map((token, index) => (
              <React.Fragment key={token.id}>
                <div
                  className={`group relative flex items-center gap-2 px-3.5 py-2 rounded-full text-white font-mono text-xs shadow-lg transition-all shrink-0 border animate-in zoom-in-90 duration-150 ${
                    index === tokens.length - 1
                      ? 'border-amber-400/50 bg-amber-950/40 text-amber-200 shadow-amber-500/20'
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
            Hold a deliberate hand gesture for ~350ms to trigger the first word &quot;{currentWord}&quot;...
          </div>
        )}
      </div>

      {/* Assembled Continuous Pitch Narrative Card */}
      <div className="p-3.5 rounded-2xl liquid-glass space-y-1.5 border border-white/10 bg-white/[0.02]">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-medium flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-white/80">Assembled Executive Pitch Stream:</span>
          </span>

          {/* Animated Audio Equalizer Waveform */}
          <div className="flex items-center gap-1.5">
            {isSpeaking ? (
              <div className="flex items-end gap-0.5 h-3.5">
                <span className="w-0.5 h-3 bg-amber-400 animate-pulse" />
                <span className="w-0.5 h-2 bg-amber-300 animate-bounce" />
                <span className="w-0.5 h-3.5 bg-emerald-400 animate-pulse" />
                <span className="w-0.5 h-1.5 bg-cyan-400 animate-bounce" />
                <span className="text-[10px] font-mono text-amber-300 ml-1">Speaking Word...</span>
              </div>
            ) : (
              <span className="font-mono text-white/40 text-[10px]">
                {tokens.length === totalWords ? '🎉 Pitch Complete' : `Next: "${currentWord}"`}
              </span>
            )}
          </div>
        </div>

        <textarea
          rows={2}
          value={fullSentence}
          onChange={(e) => setFullSentence(e.target.value)}
          placeholder="Assembled narrative pitch will stream here token-by-token..."
          className="w-full bg-transparent border-0 rounded-xl py-1 text-sm font-normal focus:outline-none transition-all placeholder:text-white/30 text-white resize-none"
        />
      </div>

      {/* Action Controls: Speak Full Sentence & Auto-Speech Toggle */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
        {/* Interactive Hover Speak Button */}
        <InteractiveHoverButton
          text="Play Full Narrative Audio"
          icon={<Volume2 className={`w-4 h-4 ${isSpeaking ? 'animate-bounce text-amber-400' : ''}`} />}
          onClick={handleSpeak}
          disabled={!hasTokens && !fullSentence}
          className="min-w-56 active:scale-95"
        />

        {/* Status / Script Progress Indicator */}
        <div className="flex items-center gap-2 text-xs font-mono text-white/60">
          <span>Script Target:</span>
          <span className="font-semibold text-cyan-300">
            {Math.round((Math.min(tokens.length, totalWords) / totalWords) * 100)}% Complete
          </span>
        </div>
      </div>
    </div>
  );
};
