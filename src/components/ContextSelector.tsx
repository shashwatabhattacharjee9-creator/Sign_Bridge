'use client';

import React from 'react';
import { GraduationCap, HeartPulse, AlertTriangle, ShieldCheck, Building2 } from 'lucide-react';

export type TriageMode = 'campus' | 'healthcare' | 'emergency';

interface Props {
  activeMode: TriageMode;
  onModeChange: (mode: TriageMode) => void;
}

export default function ContextSelector({ activeMode, onModeChange }: Props) {
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

      <div className="flex flex-wrap gap-2">
        {modes.map((m) => {
          const Icon = m.icon;
          const isActive = activeMode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => onModeChange(m.id as TriageMode)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
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
    </div>
  );
}

export { ContextSelector };
