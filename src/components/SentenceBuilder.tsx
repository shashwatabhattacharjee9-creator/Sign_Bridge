'use client';

import React, { useState } from 'react';
import { useSignBridgeStore } from '@/store/useSignBridgeStore';
import { ISL_VOCABULARY } from '@/lib/engine/gestureLibrary';
import InteractiveHoverButton from '@/components/ui/interactive-hover-button';
import {
  ArrowRight,
  Check,
  Copy,
  Delete,
  MessageSquare,
  Sparkles,
  Trash2,
  Volume2,
  CheckCircle2,
} from 'lucide-react';

export const SentenceBuilder: React.FC = () => {
  const tokens = useSignBridgeStore((s) => s.tokens);
  const sentenceTokens = useSignBridgeStore((s) => s.sentenceTokens);
  const fullSentence = useSignBridgeStore((s) => s.fullSentence);
  const finalizedSentence = useSignBridgeStore((s) => s.finalizedSentence);
  const isFinalized = useSignBridgeStore((s) => s.isFinalized);
  const isSpeaking = useSignBridgeStore((s) => s.isSpeaking);
  const ttsEnabled = useSignBridgeStore((s) => s.ttsEnabled);

  const popSentenceToken = useSignBridgeStore((s) => s.popSentenceToken);
  const clearSentence = useSignBridgeStore((s) => s.clearSentence);
  const toggleTTS = useSignBridgeStore((s) => s.toggleTTS);
  const removeToken = useSignBridgeStore((s) => s.removeToken);
  const setFullSentence = useSignBridgeStore((s) => s.setFullSentence);
  const speakSentence = useSignBridgeStore((s) => s.speakSentence);

  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const textToCopy =
      (isFinalized ? finalizedSentence : null) ||
      fullSentence ||
      tokens.map((s) => (ISL_VOCABULARY as any)[s.sign]?.speechText || s.label).join(' ');

    if (!textToCopy?.trim()) return;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = async () => {
    await speakSentence();
  };

  const hasTokens = tokens.length > 0 || sentenceTokens.length > 0;

  return (
    <div className="liquid-card rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 text-white">
      {/* Header & Sentence Quick Action Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="liquid-glass p-2 rounded-xl text-white">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-sm text-white tracking-tight">
                Contextual Sentence Assembler
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 liquid-glass rounded-full text-cyan-300 uppercase">
                Incremental Token Stream
              </span>
            </div>
            <p className="text-[11px] text-white/50 font-normal">
              Pose-stability gated tokens • Auto-compiles on physical hand drop
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Backspace Button */}
          <button
            onClick={popSentenceToken}
            disabled={!hasTokens}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full liquid-glass transition-all font-mono active:scale-95 ${
              hasTokens
                ? 'text-white/80 hover:text-white hover:bg-white/10 cursor-pointer'
                : 'opacity-30 cursor-not-allowed text-white/40'
            }`}
            title="Backspace: Remove last committed gesture token"
          >
            <Delete className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Backspace</span>
          </button>

          {/* Clear All Button */}
          <button
            onClick={clearSentence}
            disabled={!hasTokens}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full liquid-glass transition-all active:scale-95 ${
              hasTokens
                ? 'text-white/80 hover:text-red-300 hover:bg-red-500/10 cursor-pointer'
                : 'opacity-30 cursor-not-allowed text-white/40'
            }`}
            title="Clear all tokens"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear</span>
          </button>

          {/* Copy Text Button */}
          <button
            onClick={handleCopy}
            disabled={!hasTokens && !fullSentence && !finalizedSentence}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs rounded-full liquid-glass transition-all active:scale-95 ${
              hasTokens || fullSentence || finalizedSentence
                ? 'text-white/80 hover:text-white hover:bg-white/10 cursor-pointer'
                : 'opacity-30 cursor-not-allowed text-white/40'
            }`}
            title="Copy transcribed sentence to clipboard"
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

      {/* Live Token Stream Carousel */}
      <div className="h-[76px] p-3.5 rounded-2xl liquid-glass flex items-center overflow-x-auto scrollbar-none">
        {tokens.length > 0 ? (
          <div className="flex items-center gap-2 flex-nowrap py-1">
            {tokens.map((token, index) => (
              <React.Fragment key={token.id}>
                <div className="group relative flex items-center gap-2 px-3.5 py-2 rounded-full liquid-glass text-white font-mono text-xs shadow-lg transition-all hover:bg-white/10 shrink-0 border border-cyan-400/20 shadow-cyan-500/10 animate-in fade-in slide-in-from-left-2 duration-300">
                  <span className="text-base">{token.emoji}</span>
                  <span className="font-semibold tracking-tight text-cyan-100">{token.sign}</span>

                  <button
                    onClick={() => removeToken(token.id)}
                    className="ml-1 text-white/50 hover:text-white opacity-60 group-hover:opacity-100 transition-opacity text-sm leading-none cursor-pointer"
                    title="Remove token"
                  >
                    &times;
                  </button>
                </div>

                {index < tokens.length - 1 && (
                  <ArrowRight className="w-3.5 h-3.5 text-cyan-400/50 shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>
        ) : (
          <div className="w-full flex items-center justify-center text-xs text-white/40 font-mono italic">
            Hold a deliberate hand pose steady for ~750ms to accumulate gesture tokens...
          </div>
        )}
      </div>

      {/* Assembled Conversational Sentence Box with Emerald Green Highlight on Finalize */}
      <div
        className={`p-3.5 rounded-2xl transition-all duration-300 space-y-1.5 border ${
          isFinalized
            ? 'border-emerald-500/50 bg-emerald-950/30 text-emerald-200 shadow-xl shadow-emerald-500/10'
            : 'border-white/10 bg-white/[0.02] text-white'
        }`}
      >
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-medium flex items-center gap-1.5">
            {isFinalized ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300 font-semibold">
                  Finalized Sentence (Formulated on Rest):
                </span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-white/80">Synthesized Speech Formulation:</span>
              </>
            )}
          </span>

          {/* Animated Equalizer Waveform during voice synthesis */}
          <div className="flex items-center gap-1.5">
            {isSpeaking ? (
              <div className="flex items-end gap-0.5 h-3.5">
                <span className="w-0.5 h-3 bg-cyan-400 animate-pulse" />
                <span className="w-0.5 h-2 bg-cyan-300 animate-bounce" />
                <span className="w-0.5 h-3.5 bg-emerald-400 animate-pulse" />
                <span className="w-0.5 h-1.5 bg-cyan-400 animate-bounce" />
                <span className="text-[10px] font-mono text-cyan-300 ml-1">Speaking...</span>
              </div>
            ) : (
              <span className="font-mono text-white/40 text-[10px]">100% Offline Speech API</span>
            )}
          </div>
        </div>

        <input
          type="text"
          value={isFinalized ? finalizedSentence : fullSentence}
          onChange={(e) => setFullSentence(e.target.value)}
          placeholder="Assembled conversational dialogue ready for playback..."
          className={`w-full bg-transparent border-0 rounded-xl py-1 text-sm font-normal focus:outline-none transition-all placeholder:text-white/30 ${
            isFinalized ? 'text-emerald-100 font-medium' : 'text-white'
          }`}
        />
      </div>

      {/* Primary Action Controls: Speak Sentence & Auto-TTS Toggle */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
        {/* Interactive Hover Speak Button */}
        <InteractiveHoverButton
          text="Speak Sentence (Local TTS)"
          icon={<Volume2 className={`w-4 h-4 ${isSpeaking ? 'animate-bounce text-cyan-400' : ''}`} />}
          onClick={handleSpeak}
          disabled={!hasTokens && !fullSentence && !finalizedSentence}
          className="min-w-56 active:scale-95"
        />

        {/* Status / Auto-TTS Toggle */}
        <div className="flex items-center justify-end">
          <label className="flex items-center gap-2.5 px-4 py-2 rounded-full liquid-glass text-white/80 hover:text-white cursor-pointer text-xs font-medium transition-colors">
            <input
              type="checkbox"
              checked={ttsEnabled}
              onChange={toggleTTS}
              className="accent-cyan-400 rounded cursor-pointer"
            />
            <span>Auto-Speak on Sentence Rest Finalize</span>
          </label>
        </div>
      </div>
    </div>
  );
};
