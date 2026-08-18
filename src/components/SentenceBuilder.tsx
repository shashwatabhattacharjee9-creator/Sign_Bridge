'use client';

import React, { useState } from 'react';
import { useSignBridgeStore } from '@/store/useSignBridgeStore';
import { ISL_VOCABULARY } from '@/lib/engine/gestureLibrary';
import { ISLSign } from '@/types/isl';
import { ttsService } from '@/lib/audio/tts';
import {
  ArrowRight,
  Check,
  Copy,
  Delete,
  MessageSquare,
  Sparkles,
  Trash2,
  Volume2,
  VolumeX,
} from 'lucide-react';

export const SentenceBuilder: React.FC = () => {
  const {
    sentenceTokens,
    tokens,
    fullSentence,
    isSpeaking,
    ttsEnabled,
    popSentenceToken,
    clearSentence,
    toggleTTS,
    speakSentence,
    removeToken,
    setFullSentence,
  } = useSignBridgeStore();

  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const textToCopy =
      fullSentence ||
      sentenceTokens.map((s) => ISL_VOCABULARY[s as ISLSign]?.speechText || s).join(' ');

    if (!textToCopy.trim()) return;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = async () => {
    const textToSpeak =
      fullSentence.trim() ||
      sentenceTokens.map((s) => ISL_VOCABULARY[s as ISLSign]?.speechText || s).join(', ');

    if (!textToSpeak) return;
    await ttsService.speak(textToSpeak.replace(/•/g, ','));
  };

  const hasTokens = sentenceTokens.length > 0 || tokens.length > 0;

  return (
    <div className="bg-surface-100 border border-surface-200 rounded-2xl p-5 shadow-xl space-y-4 text-slate-200">
      {/* Header & Sentence Quick Action Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-surface-200/80">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-brand-cyan" />
          <h3 className="font-bold text-sm text-white uppercase tracking-wider">
            Live Sentence Builder
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {/* Backspace Button */}
          <button
            onClick={popSentenceToken}
            disabled={!hasTokens}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg border border-surface-200 transition-colors font-mono ${
              hasTokens
                ? 'bg-surface-50 hover:bg-surface-200 text-slate-300'
                : 'opacity-40 cursor-not-allowed bg-surface-50 text-slate-500'
            }`}
            title="Backspace: Remove last sign token"
          >
            <Delete className="w-3.5 h-3.5" />
            <span>Backspace</span>
          </button>

          {/* Clear All Button */}
          <button
            onClick={clearSentence}
            disabled={!hasTokens}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg border border-surface-200 transition-colors ${
              hasTokens
                ? 'bg-surface-50 hover:bg-red-500/20 text-slate-400 hover:text-red-400'
                : 'opacity-40 cursor-not-allowed bg-surface-50 text-slate-500'
            }`}
            title="Clear all tokens"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>

          {/* Copy Text Button */}
          <button
            onClick={handleCopy}
            disabled={!hasTokens && !fullSentence}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg border border-surface-200 transition-colors ${
              hasTokens || fullSentence
                ? 'bg-surface-50 hover:bg-surface-200 text-slate-300'
                : 'opacity-40 cursor-not-allowed bg-surface-50 text-slate-500'
            }`}
            title="Copy sentence to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-brand-emerald" />
                <span className="text-brand-emerald font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Live Token Stream Carousel */}
      <div className="min-h-[72px] p-3.5 rounded-xl bg-surface-50 border border-surface-200/80 flex items-center gap-2 overflow-x-auto scrollbar-thin">
        {tokens.length > 0 ? (
          <div className="flex items-center gap-2 flex-nowrap py-1">
            {tokens.map((token, index) => (
              <React.Fragment key={token.id}>
                <div className="group relative flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-surface-200 border border-surface-300 text-white font-mono text-xs shadow-md transition-all hover:border-brand-emerald">
                  <span className="text-base">{token.emoji}</span>
                  <span className="font-bold tracking-wide">{token.sign}</span>

                  <button
                    onClick={() => removeToken(token.id)}
                    className="ml-1 text-slate-400 hover:text-red-400 opacity-60 group-hover:opacity-100 transition-opacity text-sm leading-none"
                    title="Remove token"
                  >
                    &times;
                  </button>
                </div>

                {index < tokens.length - 1 && (
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>
        ) : (
          <div className="w-full flex items-center justify-center text-xs text-slate-500 font-mono italic">
            Perform stabilized ISL gestures in camera frame to build token stream...
          </div>
        )}
      </div>

      {/* Formatted Natural Speech Translation Bar */}
      <div className="p-3 rounded-xl bg-surface-50 border border-surface-200/80 space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span className="font-medium flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-brand-amber" />
            Synthesized Speech Formulation:
          </span>
          <span className="font-mono text-slate-500">100% Offline Web Speech API</span>
        </div>

        <input
          type="text"
          value={fullSentence}
          onChange={(e) => setFullSentence(e.target.value)}
          placeholder="Assembled natural language sentence..."
          className="w-full bg-surface-100 border border-surface-200 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-emerald transition-colors font-sans"
        />
      </div>

      {/* Primary Action Controls: Speak Sentence & Auto-TTS Toggle */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
        {/* Instant Speak Button */}
        <button
          onClick={handleSpeak}
          disabled={!hasTokens && !fullSentence}
          className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs shadow-lg transition-all ${
            hasTokens || fullSentence
              ? 'bg-gradient-to-r from-brand-emerald to-brand-emeraldLight hover:from-brand-emeraldDark hover:to-brand-emerald text-slate-950 shadow-brand-emerald/20 active:scale-95'
              : 'opacity-50 cursor-not-allowed bg-surface-200 text-slate-500'
          }`}
        >
          <Volume2 className={`w-4 h-4 ${isSpeaking ? 'animate-bounce' : ''}`} />
          <span>Speak Sentence (Offline TTS)</span>
        </button>

        {/* Auto-Speak Toggle */}
        <div className="flex items-center justify-end">
          <label className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-50 border border-surface-200 text-slate-300 hover:text-white cursor-pointer text-xs font-medium">
            <input
              type="checkbox"
              checked={ttsEnabled}
              onChange={toggleTTS}
              className="accent-brand-emerald"
            />
            <span>Auto-Speak on Token Commit</span>
          </label>
        </div>
      </div>
    </div>
  );
};
