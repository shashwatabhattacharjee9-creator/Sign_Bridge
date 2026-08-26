'use client';

import React, { useState } from 'react';
import { useSignBridgeStore } from '@/store/useSignBridgeStore';
import InteractiveHoverButton from '@/components/ui/interactive-hover-button';
import {
  ArrowRight,
  Check,
  Copy,
  Cpu,
  Radio,
  Sparkles,
  Trash2,
  Volume2,
  Zap,
} from 'lucide-react';

export const SentenceBuilder: React.FC = () => {
  const tokens = useSignBridgeStore((s) => s.tokens);
  const fullSentence = useSignBridgeStore((s) => s.fullSentence);
  const currentWord = useSignBridgeStore((s) => s.currentWord);
  const activeEngine = useSignBridgeStore((s) => s.activeEngine);
  const inferenceType = useSignBridgeStore((s) => s.inferenceType);
  const latencyMs = useSignBridgeStore((s) => s.latencyMs);
  const isSpeaking = useSignBridgeStore((s) => s.isSpeaking);

  const resetBuffer = useSignBridgeStore((s) => s.resetBuffer);
  const removeToken = useSignBridgeStore((s) => s.removeToken);
  const speakSentence = useSignBridgeStore((s) => s.speakSentence);

  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!fullSentence?.trim()) return;

    navigator.clipboard.writeText(fullSentence);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = async () => {
    await speakSentence();
  };

  const hasTokens = tokens.length > 0;

  return (
    <div className="liquid-card rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 text-white">
      {/* Professional Commercial Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-white/5 gap-3">
        <div className="flex items-center gap-2.5">
          {/* Pulsing Emerald Live Indicator */}
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
          </div>

          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="font-semibold text-sm tracking-wide text-white uppercase font-mono">
                LIVE ISL RECOGNITION STREAM
              </h3>
              <span className="text-[10px] font-mono px-2.5 py-0.5 liquid-glass rounded-full text-cyan-300 font-medium">
                {tokens.length} {tokens.length === 1 ? 'Token' : 'Tokens'}
              </span>
            </div>
            <p className="text-[11px] text-white/50 font-normal">
              Autonomous kinetic gesture translation • Zero-cloud browser execution
            </p>
          </div>
        </div>

        {/* Enterprise Telemetry Pill Tags */}
        <div className="flex items-center gap-1.5 flex-wrap font-mono text-[10px] text-white/70">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full liquid-glass">
            <Cpu className="w-3 h-3 text-cyan-400" />
            <span>{activeEngine}</span>
          </div>

          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full liquid-glass">
            <Zap className="w-3 h-3 text-emerald-400" />
            <span>{inferenceType}</span>
          </div>

          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full liquid-glass">
            <span>Latency: {latencyMs || 16}ms</span>
          </div>
        </div>
      </div>

      {/* Live Recognized Tokens Strip */}
      <div className="min-h-[68px] p-3 rounded-2xl liquid-glass flex items-center overflow-x-auto scrollbar-none">
        {tokens.length > 0 ? (
          <div className="flex items-center gap-2 flex-nowrap py-1">
            {tokens.map((token, index) => (
              <React.Fragment key={token.id}>
                <div
                  className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all shrink-0 animate-in zoom-in-90 duration-150 ${
                    index === tokens.length - 1
                      ? 'bg-cyan-500/20 border border-cyan-400/50 text-cyan-100 shadow-md shadow-cyan-500/20'
                      : 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-200 hover:bg-cyan-500/20'
                  }`}
                >
                  <span className="tracking-tight">{token.label}</span>
                  <button
                    onClick={() => removeToken(token.id)}
                    className="ml-1 text-white/50 hover:text-white opacity-50 group-hover:opacity-100 transition-opacity text-sm leading-none cursor-pointer"
                    title="Remove token"
                  >
                    &times;
                  </button>
                </div>

                {index < tokens.length - 1 && (
                  <ArrowRight className="w-3 h-3 text-cyan-400/40 shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>
        ) : (
          <div className="w-full flex items-center justify-center text-xs text-white/40 font-mono italic">
            Articulate gestures naturally in camera view to stream recognized ISL tokens...
          </div>
        )}
      </div>

      {/* Continuous Assembled Sentence Transcript Box */}
      <div className="p-4 rounded-2xl liquid-glass space-y-1.5 border border-white/10 bg-white/[0.02]">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-medium flex items-center gap-1.5 text-white/80">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Continuous Recognized Transcript:</span>
          </span>

          {/* Equalizer Waveform during voice synthesis */}
          <div className="flex items-center gap-1.5">
            {isSpeaking ? (
              <div className="flex items-end gap-0.5 h-3.5">
                <span className="w-0.5 h-3 bg-cyan-400 animate-pulse" />
                <span className="w-0.5 h-2 bg-emerald-400 animate-bounce" />
                <span className="w-0.5 h-3.5 bg-cyan-300 animate-pulse" />
                <span className="w-0.5 h-1.5 bg-emerald-300 animate-bounce" />
                <span className="text-[10px] font-mono text-cyan-300 ml-1">Vocalizing...</span>
              </div>
            ) : (
              <span className="font-mono text-white/40 text-[10px]">
                {hasTokens ? 'Streaming Active' : 'Awaiting Input'}
              </span>
            )}
          </div>
        </div>

        <p className="text-sm font-normal leading-relaxed text-white/95 min-h-[44px]">
          {fullSentence || (
            <span className="italic text-white/30 text-xs font-mono">
              Recognized sentences will assemble continuously here...
            </span>
          )}
        </p>
      </div>

      {/* Discrete Standard Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
        {/* Interactive Hover Replay Button */}
        <InteractiveHoverButton
          text="Replay Transcript Audio"
          icon={<Volume2 className={`w-4 h-4 ${isSpeaking ? 'animate-bounce text-cyan-400' : ''}`} />}
          onClick={handleSpeak}
          disabled={!hasTokens}
          className="min-w-60 active:scale-95"
        />

        {/* Standard Control Buttons */}
        <div className="flex items-center justify-end gap-2">
          {/* Copy Text Button */}
          <button
            onClick={handleCopy}
            disabled={!hasTokens}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs rounded-full liquid-glass transition-all active:scale-95 font-medium ${
              hasTokens
                ? 'text-white/90 hover:text-white hover:bg-white/10 cursor-pointer'
                : 'opacity-30 cursor-not-allowed text-white/40'
            }`}
            title="Copy transcribed text to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Text</span>
              </>
            )}
          </button>

          {/* Clear Buffer Button */}
          <button
            onClick={resetBuffer}
            disabled={!hasTokens}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs rounded-full liquid-glass transition-all active:scale-95 font-medium ${
              hasTokens
                ? 'text-white/80 hover:text-red-300 hover:bg-red-500/10 cursor-pointer'
                : 'opacity-30 cursor-not-allowed text-white/40'
            }`}
            title="Clear recognition buffer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Buffer</span>
          </button>
        </div>
      </div>
    </div>
  );
};
