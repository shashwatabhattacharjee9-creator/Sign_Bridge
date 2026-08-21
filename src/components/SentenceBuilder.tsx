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
    <div className="liquid-card rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 text-white">
      {/* Header & Sentence Quick Action Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="liquid-glass p-2 rounded-xl text-white">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-medium text-sm text-white tracking-tight">
              Live Sentence Composer
            </h3>
            <p className="text-[11px] text-white/50 font-normal">Real-time sign stream assembler & speech engine</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Backspace Button */}
          <button
            onClick={popSentenceToken}
            disabled={!hasTokens}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full liquid-glass transition-all font-mono ${
              hasTokens
                ? 'text-white/80 hover:text-white hover:bg-white/10'
                : 'opacity-30 cursor-not-allowed text-white/40'
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
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full liquid-glass transition-all ${
              hasTokens
                ? 'text-white/80 hover:text-red-300 hover:bg-red-500/10'
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
            disabled={!hasTokens && !fullSentence}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full liquid-glass transition-all ${
              hasTokens || fullSentence
                ? 'text-white/80 hover:text-white hover:bg-white/10'
                : 'opacity-30 cursor-not-allowed text-white/40'
            }`}
            title="Copy transcribed sentence to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span className="text-white font-semibold">Copied</span>
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
      <div className="min-h-[76px] p-3.5 rounded-2xl liquid-glass flex items-center gap-2 overflow-x-auto scrollbar-thin">
        {tokens.length > 0 ? (
          <div className="flex items-center gap-2 flex-nowrap py-1">
            {tokens.map((token, index) => (
              <React.Fragment key={token.id}>
                <div className="group relative flex items-center gap-2 px-3.5 py-2 rounded-full liquid-glass text-white font-mono text-xs shadow-lg transition-all hover:bg-white/10">
                  <span className="text-base">{token.emoji}</span>
                  <span className="font-semibold tracking-tight">{token.sign}</span>

                  <button
                    onClick={() => removeToken(token.id)}
                    className="ml-1 text-white/50 hover:text-white opacity-60 group-hover:opacity-100 transition-opacity text-sm leading-none"
                    title="Remove token"
                  >
                    &times;
                  </button>
                </div>

                {index < tokens.length - 1 && (
                  <ArrowRight className="w-3.5 h-3.5 text-white/40 shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>
        ) : (
          <div className="w-full flex items-center justify-center text-xs text-white/40 font-mono italic">
            Perform signs in front of the camera to assemble your live sentence...
          </div>
        )}
      </div>

      {/* Formatted Natural Speech Translation Bar */}
      <div className="p-3.5 rounded-2xl liquid-glass space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-white/60">
          <span className="font-medium flex items-center gap-1.5 text-white/80">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Synthesized Speech Formulation:
          </span>
          <span className="font-mono text-white/40">100% Offline Speech API</span>
        </div>

        <input
          type="text"
          value={fullSentence}
          onChange={(e) => setFullSentence(e.target.value)}
          placeholder="Assembled natural language sentence ready for TTS..."
          className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-white/30 transition-all font-normal placeholder:text-white/30"
        />
      </div>

      {/* Primary Action Controls: Speak Sentence & Auto-TTS Toggle */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
        {/* Instant Speak Button */}
        <button
          onClick={handleSpeak}
          disabled={!hasTokens && !fullSentence}
          className={`flex items-center justify-center gap-2 px-6 py-3 rounded-full font-semibold text-xs transition-all ${
            hasTokens || fullSentence
              ? 'bg-white text-slate-900 hover:bg-white/90 shadow-lg cursor-pointer hover:scale-105 active:scale-95'
              : 'opacity-30 cursor-not-allowed liquid-glass text-white/40'
          }`}
        >
          <Volume2 className={`w-4 h-4 ${isSpeaking ? 'animate-bounce' : ''}`} />
          <span>Speak Sentence (Local TTS)</span>
        </button>

        {/* Auto-Speak Toggle */}
        <div className="flex items-center justify-end">
          <label className="flex items-center gap-2.5 px-4 py-2 rounded-full liquid-glass text-white/80 hover:text-white cursor-pointer text-xs font-medium transition-colors">
            <input
              type="checkbox"
              checked={ttsEnabled}
              onChange={toggleTTS}
              className="accent-white rounded"
            />
            <span>Auto-Speak on Gesture Commit</span>
          </label>
        </div>
      </div>
    </div>
  );
};
