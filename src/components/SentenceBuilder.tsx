'use client';

import React, { useEffect, useState } from 'react';
import {
  Volume2,
  Copy,
  Trash2,
  Activity,
  Cpu,
  ShieldCheck,
  Check,
  Sparkles,
  Layers,
  CheckCircle2,
  Flame,
  ArrowRight,
  Languages,
  Globe,
} from 'lucide-react';
import { scenarioEngineManager } from '@/lib/engine/scenarioSentenceEngine';
import { audioLatchEngine } from '@/lib/audio/tts';
import { navigationStateManager } from '@/lib/engine/navigationState';
import { useSignBridgeStore } from '@/store/useSignBridgeStore';
import { SupportedLanguage, MULTILINGUAL_REGISTRY } from '@/lib/engine/multilingualScripts';
import { multilingualSpeechEngine } from '@/lib/audio/multilingualTTS';

export function SentenceBuilder() {
  const [liveTokens, setLiveTokens] = useState<string[]>([]);
  const [completedSentences, setCompletedSentences] = useState<string[]>([]);
  const [translations, setTranslations] = useState<string[]>([]);
  const [category, setCategory] = useState<string>('Campus Helpdesk');
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [totalSteps, setTotalSteps] = useState<number>(4);
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>('en');
  const [availableOptions, setAvailableOptions] = useState<
    Array<{ shape: string; token: string; label: string; translation?: string }>
  >([]);
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    navigationStateManager.setMode('studio');
  }, []);

  // Sync state with scenarioEngineManager
  useEffect(() => {
    const interval = setInterval(() => {
      const live = scenarioEngineManager.getLiveTokens();
      const transcripts = scenarioEngineManager.getTranscripts();
      const trs = scenarioEngineManager.getTranslations();
      const cat = scenarioEngineManager.getActiveCategory();
      const sIdx = scenarioEngineManager.getCurrentStepIndex();
      const tSteps = scenarioEngineManager.getTotalSteps();
      const options = scenarioEngineManager.getAvailableOptionsForCurrentStep();
      const currentLang = scenarioEngineManager.getLanguage();

      setLiveTokens([...live]);
      setCompletedSentences([...transcripts]);
      setTranslations([...trs]);
      setCategory(cat);
      setStepIndex(sIdx);
      setTotalSteps(tSteps);
      setAvailableOptions(options);
      setSelectedLang(currentLang);
      setIsSpeaking(audioLatchEngine.getIsSpeaking() || multilingualSpeechEngine.getIsSpeaking());
    }, 80);

    return () => clearInterval(interval);
  }, []);

  const handleLanguageChange = (lang: SupportedLanguage) => {
    setSelectedLang(lang);
    scenarioEngineManager.setLanguage(lang);
    multilingualSpeechEngine.setLanguage(lang);
  };

  const latestSentence =
    completedSentences.length > 0
      ? completedSentences[completedSentences.length - 1]
      : null;

  const latestTranslation =
    translations.length > 0
      ? translations[translations.length - 1]
      : null;

  const handleCopy = () => {
    const fullText = latestSentence || liveTokens.join(' ');
    if (!fullText) return;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    scenarioEngineManager.reset();
    audioLatchEngine.killAllSpeech();
    multilingualSpeechEngine.kill();
    setLiveTokens([]);
    setCompletedSentences([]);
    setTranslations([]);
  };

  const handleReplay = () => {
    const textToReplay = latestSentence || liveTokens.join(' ');
    if (textToReplay) {
      multilingualSpeechEngine.speak(textToReplay, selectedLang);
    }
  };

  return (
    <div className="w-full bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col gap-4">
      {/* Real-time Status Header & Trilingual Selection Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs sm:text-sm font-semibold tracking-wide text-white/95 uppercase font-mono">
            Active Flow: {category}
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-semibold">
            Step {stepIndex + 1} / {totalSteps}
          </span>
        </div>

        {/* Trilingual Switcher Buttons */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950/90 border border-white/10">
          <span className="text-[10px] font-mono text-slate-400 px-1.5 hidden sm:inline flex items-center gap-1">
            <Globe className="w-3 h-3 text-cyan-400" /> Lang:
          </span>
          {(Object.keys(MULTILINGUAL_REGISTRY) as SupportedLanguage[]).map((lKey) => {
            const cfg = MULTILINGUAL_REGISTRY[lKey];
            const isAct = selectedLang === lKey;
            return (
              <button
                key={lKey}
                onClick={() => handleLanguageChange(lKey)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold font-mono transition-all cursor-pointer ${
                  isAct
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 scale-105'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
                title={cfg.label}
              >
                <span>{cfg.flag}</span>
                <span>{cfg.nativeLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step Visual Progress Dots & Gesture Options in chosen language */}
      <div className="flex flex-col gap-2 p-3 rounded-xl bg-slate-950/60 border border-white/5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Sentence Assembly Progress:
          </span>
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalSteps }).map((_, idx) => (
              <div
                key={idx}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx < liveTokens.length
                    ? 'w-6 bg-emerald-400'
                    : idx === liveTokens.length
                    ? 'w-6 bg-cyan-400 animate-pulse'
                    : 'w-2 bg-white/20'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Gesture options for current step with translation tooltip */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] font-mono text-slate-500">Available Shapes:</span>
          {availableOptions.map((opt) => (
            <span
              key={opt.shape}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-xs font-mono"
            >
              <span className="font-semibold">{opt.shape.replace('_', ' ')}</span>
              <ArrowRight className="w-3 h-3 text-cyan-400" />
              <span className="text-white font-medium">"{opt.token}"</span>
              {opt.translation && selectedLang !== 'en' && (
                <span className="text-[10px] text-slate-400 font-sans italic">
                  ({opt.translation})
                </span>
              )}
            </span>
          ))}
        </div>
      </div>

      {/* Real-time Assembled Token Badges */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-slate-400 tracking-wider uppercase">
            Assembled Token Sequence ({MULTILINGUAL_REGISTRY[selectedLang]?.nativeLabel})
          </span>
          <span className="text-[10px] font-mono text-cyan-400">
            {liveTokens.length} / {totalSteps} Articulated
          </span>
        </div>
        <div className="min-h-[50px] p-2.5 rounded-xl bg-slate-950/80 border border-white/5 flex flex-wrap items-center gap-2 overflow-y-auto max-h-24">
          {liveTokens.length === 0 ? (
            <span className="text-xs text-slate-500 italic flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 animate-spin text-cyan-500" />
              Hold an intuitive gesture in camera to stream tokens in {MULTILINGUAL_REGISTRY[selectedLang]?.nativeLabel}...
            </span>
          ) : (
            liveTokens.map((token, idx) => (
              <span
                key={idx}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all shadow-md ${
                  idx === liveTokens.length - 1
                    ? 'bg-cyan-500 text-slate-950 shadow-cyan-500/20 scale-105 animate-in zoom-in-95'
                    : 'bg-white/10 text-white/90 border border-white/10'
                }`}
              >
                {token}
              </span>
            ))
          )}
        </div>
      </div>

      {/* Synthesized Complete Output Sentence Card with Cross-Language Translation */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-slate-400 tracking-wider uppercase">
            Synthesized Output Sentence & Localized Speech
          </span>
          {isSpeaking && (
            <span className="flex items-center gap-1.5 text-xs text-amber-400 font-medium animate-pulse">
              <span className="flex gap-0.5">
                <span className="w-1 h-3 bg-amber-400 animate-pulse rounded-full" />
                <span className="w-1 h-3 bg-amber-400 animate-pulse delay-75 rounded-full" />
                <span className="w-1 h-3 bg-amber-400 animate-pulse delay-150 rounded-full" />
              </span>
              Native Voice Synthesizer ({selectedLang.toUpperCase()})
            </span>
          )}
        </div>

        <div
          className={`p-4 rounded-xl border text-sm sm:text-base leading-relaxed min-h-[68px] flex flex-col justify-center transition-all ${
            latestSentence
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200 shadow-lg shadow-emerald-500/10'
              : liveTokens.length > 0
              ? 'bg-slate-950/90 border-white/10 text-white/90'
              : 'bg-slate-950/80 border-white/10 text-slate-500 text-xs'
          }`}
        >
          {latestSentence ? (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-semibold text-white tracking-wide">
                  "{latestSentence}"
                </span>
              </div>
              {latestTranslation && selectedLang !== 'en' && (
                <div className="text-xs text-slate-400 font-sans pl-6 flex items-center gap-1.5">
                  <Languages className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>English Translation: "{latestTranslation}"</span>
                </div>
              )}
            </div>
          ) : liveTokens.length > 0 ? (
            <span>{liveTokens.join(' ')}</span>
          ) : (
            <span>Complete multi-step sentences will assemble and speak in {MULTILINGUAL_REGISTRY[selectedLang]?.nativeLabel} here.</span>
          )}
        </div>
      </div>

      {/* Standard Action Controls & Hardware Telemetry */}
      <div className="flex items-center justify-between pt-1 border-t border-white/5">
        <div className="text-[11px] text-slate-400 font-mono">
          Language: <span className="text-cyan-400 font-semibold uppercase">{selectedLang} ({MULTILINGUAL_REGISTRY[selectedLang]?.nativeLabel})</span> | Latency:{' '}
          <span className="text-emerald-400 font-semibold">14ms</span> | Egress:{' '}
          <span className="text-emerald-400 font-semibold">0 KB</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReplay}
            disabled={!latestSentence && liveTokens.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 text-white/80 text-xs font-medium transition-all cursor-pointer disabled:cursor-not-allowed"
            title="Replay Localized Audio"
          >
            <Volume2 className="w-3.5 h-3.5" /> Replay
          </button>

          <button
            onClick={handleCopy}
            disabled={!latestSentence && liveTokens.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 text-white/80 text-xs font-medium transition-all cursor-pointer disabled:cursor-not-allowed"
            title="Copy Sentence"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>

          <button
            onClick={handleClear}
            disabled={!latestSentence && liveTokens.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 disabled:opacity-30 text-red-400 text-xs font-medium transition-all cursor-pointer disabled:cursor-not-allowed"
            title="Clear Sequence"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear
          </button>
        </div>
      </div>
    </div>
  );
}

export default SentenceBuilder;
