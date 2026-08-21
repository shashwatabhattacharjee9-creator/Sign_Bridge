'use client';

import React, { useState } from 'react';
import { useSignBridgeStore } from '@/store/useSignBridgeStore';
import { ISL_VOCABULARY } from '@/lib/engine/gestureLibrary';
import { ISLSign } from '@/types/isl';
import { offlineTTS } from '@/lib/audio/tts';
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
  CornerDownLeft,
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
    await offlineTTS.speak(textToSpeak.replace(/•/g, ','));
  };

  const hasTokens = sentenceTokens.length > 0 || tokens.length > 0;

  return (
    <div className="bg-[#0C111C]/90 border border-white/[0.08] rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 text-slate-200 backdrop-blur-xl">
      {/* Header & Sentence Quick Action Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-white tracking-tight">
              Live Sentence Composer
            </h3>
            <p className="text-[11px] text-slate-400 font-normal">Real-time sign stream assembler & speech engine</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Backspace Button */}
          <button
            onClick={popSentenceToken}
            disabled={!hasTokens}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl border border-white/10 transition-all font-mono ${
              hasTokens
                ? 'bg-white/[0.03] hover:bg-white/10 text-slate-300 hover:text-white'
                : 'opacity-35 cursor-not-allowed bg-white/[0.01] text-slate-600'
            }`}
            title="Backspace: Remove last committed token"
          >
            <Delete className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Backspace</span>
          </button>

          {/* Clear All Button */}
          <button
            onClick={clearSentence}
            disabled={!hasTokens}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl border border-white/10 transition-all ${
              hasTokens
                ? 'bg-white/[0.03] hover:bg-red-500/15 text-slate-400 hover:text-red-300 hover:border-red-500/30'
                : 'opacity-35 cursor-not-allowed bg-white/[0.01] text-slate-600'
            }`}
            title="Clear all tokens"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear</span>
          </button>

          {/* Copy Text Button */}
          <button
            onClick={handleCopy}
            disabled={!hasTokens && !fullSentence}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl border border-white/10 transition-all ${
              hasTokens || fullSentence
                ? 'bg-white/[0.03] hover:bg-white/10 text-slate-300 hover:text-white'
                : 'opacity-35 cursor-not-allowed bg-white/[0.01] text-slate-600'
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
      <div className="min-h-[76px] p-3.5 rounded-2xl bg-black/40 border border-white/[0.06] flex items-center gap-2 overflow-x-auto scrollbar-thin">
        {tokens.length > 0 ? (
          <div className="flex items-center gap-2 flex-nowrap py-1">
            {tokens.map((token, index) => (
              <React.Fragment key={token.id}>
                <div className="group relative flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/[0.06] border border-white/15 text-white font-mono text-xs shadow-lg transition-all hover:border-emerald-400 hover:bg-white/10">
                  <span className="text-lg">{token.emoji}</span>
                  <span className="font-semibold tracking-tight">{token.sign}</span>

                  <button
                    onClick={() => removeToken(token.id)}
                    className="ml-1 text-slate-400 hover:text-red-400 opacity-60 group-hover:opacity-100 transition-opacity text-sm leading-none"
                    title="Remove token"
                  >
                    &times;
                  </button>
                </div>

                {index < tokens.length - 1 && (
                  <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>
        ) : (
          <div className="w-full flex items-center justify-center text-xs text-slate-500 font-mono italic">
            Perform signs in front of the camera to assemble your live sentence...
          </div>
        )}
      </div>

      {/* Formatted Natural Speech Translation Bar */}
      <div className="p-3.5 rounded-2xl bg-black/40 border border-white/[0.06] space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span className="font-medium flex items-center gap-1.5 text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Synthesized Speech Formulation:
          </span>
          <span className="font-mono text-slate-500">100% Offline Speech API</span>
        </div>

        <input
          type="text"
          value={fullSentence}
          onChange={(e) => setFullSentence(e.target.value)}
          placeholder="Assembled natural language sentence ready for TTS..."
          className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-400 transition-all font-normal placeholder:text-slate-600"
        />
      </div>

      {/* Primary Action Controls: Speak Sentence & Auto-TTS Toggle */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
        {/* Instant Speak Button */}
        <button
          onClick={handleSpeak}
          disabled={!hasTokens && !fullSentence}
          className={`flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-semibold text-xs shadow-xl transition-all ${
            hasTokens || fullSentence
              ? 'bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 shadow-emerald-950/40 hover:scale-105 active:scale-95 cursor-pointer'
              : 'opacity-40 cursor-not-allowed bg-white/10 text-slate-500'
          }`}
        >
          <Volume2 className={`w-4 h-4 ${isSpeaking ? 'animate-bounce' : ''}`} />
          <span>Speak Sentence (Local TTS)</span>
        </button>

        {/* Auto-Speak Toggle */}
        <div className="flex items-center justify-end">
          <label className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-slate-300 hover:text-white cursor-pointer text-xs font-medium transition-colors">
            <input
              type="checkbox"
              checked={ttsEnabled}
              onChange={toggleTTS}
              className="accent-emerald-400 rounded"
            />
            <span>Auto-Speak on Gesture Commit</span>
          </label>
        </div>
      </div>
    </div>
  );
};
