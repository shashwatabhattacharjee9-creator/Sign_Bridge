'use client';

import React from 'react';
import { GraduationCap, HeartPulse, AlertTriangle, Building2, Globe } from 'lucide-react';
import { SupportedLanguage, MULTILINGUAL_REGISTRY } from '@/lib/engine/multilingualScripts';
import { scenarioEngineManager } from '@/lib/engine/scenarioSentenceEngine';
import { studioEngineManager } from '@/lib/engine/studioEngine';
import { multilingualSpeechEngine } from '@/lib/audio/multilingualTTS';

export type TriageMode = 'campus' | 'healthcare' | 'emergency';

interface Props {
  activeMode: TriageMode;
  onModeChange: (mode: TriageMode) => void;
  activeLanguage?: SupportedLanguage;
  onLanguageChange?: (lang: SupportedLanguage) => void;
}

export default function ContextSelector({
  activeMode,
  onModeChange,
  activeLanguage = 'en',
  onLanguageChange,
}: Props) {
  const modes = [
    {
      id: 'campus',
      label: 'Campus Helpdesk',
      subtext: 'Admissions & Library',
      icon: GraduationCap,
      color: 'border-blue-500/40 text-blue-300 bg-blue-500/10 shadow-blue-500/10',
    },
    {
      id: 'healthcare',
      label: 'Hospital Triage',
      subtext: 'Clinic & Pharmacy',
      icon: HeartPulse,
      color: 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10 shadow-emerald-500/10',
    },
    {
      id: 'emergency',
      label: 'Emergency Counter',
      subtext: 'Urgent Desk',
      icon: AlertTriangle,
      color: 'border-amber-500/40 text-amber-300 bg-amber-500/10 shadow-amber-500/10',
    },
  ];

  const handleLang = (lang: SupportedLanguage) => {
    studioEngineManager.setLanguage(lang);
    scenarioEngineManager.setLanguage(lang);
    multilingualSpeechEngine.setLanguage(lang);
    if (onLanguageChange) onLanguageChange(lang);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 sm:p-3.5 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-xl">
      <div className="flex items-center gap-2.5">
        <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-white/80">
          <Building2 className="w-4 h-4 text-cyan-400" />
        </div>
        <div>
          <span className="text-xs font-semibold text-white uppercase tracking-wider block">
            Institutional Triage Profile
          </span>
          <span className="text-[10px] text-slate-400 font-mono">Select active workflow context</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {/* Domain Triage Chips */}
        <div className="flex flex-wrap gap-1.5">
          {modes.map((m) => {
            const Icon = m.icon;
            const isActive = activeMode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => onModeChange(m.id as TriageMode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                  isActive
                    ? `${m.color} shadow-lg scale-105 font-semibold`
                    : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* Global Trilingual Selector */}
        <div className="flex items-center gap-1 p-0.5 rounded-xl bg-slate-950/80 border border-white/10">
          {(Object.keys(MULTILINGUAL_REGISTRY) as SupportedLanguage[]).map((lKey) => {
            const cfg = MULTILINGUAL_REGISTRY[lKey];
            const isAct = activeLanguage === lKey;
            return (
              <button
                key={lKey}
                onClick={() => handleLang(lKey)}
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
    </div>
  );
}

export { ContextSelector };
