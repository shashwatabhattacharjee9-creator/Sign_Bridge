'use client';

import React, { useState } from 'react';
import { useSignBridgeStore } from '@/store/useSignBridgeStore';
import { ISL_VOCABULARY, ISL_SIGNS_LIST } from '@/lib/engine/gestureLibrary';
import { ISLSign, ISLSignCategory, ISLSignDefinition } from '@/types/isl';
import {
  BookOpen,
  CheckCircle,
  ExternalLink,
  Flame,
  GraduationCap,
  HeartPulse,
  Layers,
  MessageCircle,
  Play,
  Search,
  Sparkles,
  Zap,
} from 'lucide-react';

export const VocabularyDirectory: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const { addToken, setPrediction, startPractice } = useSignBridgeStore();

  const categories = [
    { id: 'ALL', label: 'All 30 Signs', icon: Layers },
    { id: 'EMERGENCY', label: 'Emergency', icon: HeartPulse },
    { id: 'NEEDS', label: 'Needs', icon: Flame },
    { id: 'CAMPUS', label: 'Campus', icon: GraduationCap },
    { id: 'GREETINGS', label: 'Greetings', icon: MessageCircle },
    { id: 'ACTIONS', label: 'Actions', icon: Zap },
  ];

  // Map sign categories
  const getCategoryGroup = (sign: ISLSignDefinition): string => {
    if (['HELP', 'MEDICINE', 'HOSPITAL', 'POLICE', 'DANGER', 'AMBULANCE', 'PAIN'].includes(sign.id)) {
      return 'EMERGENCY';
    }
    if (['WATER', 'FOOD', 'BATHROOM', 'WANT', 'NEED'].includes(sign.id)) {
      return 'NEEDS';
    }
    if (['TEACHER', 'CLASS', 'BOOK', 'WRITE', 'LEARN'].includes(sign.id)) {
      return 'CAMPUS';
    }
    if (['HELLO', 'GOODBYE', 'THANK_YOU', 'PLEASE', 'SORRY', 'NAMASTE', 'FRIEND'].includes(sign.id)) {
      return 'GREETINGS';
    }
    return 'ACTIONS';
  };

  const filteredSigns = ISL_SIGNS_LIST.filter((sign) => {
    const group = getCategoryGroup(sign);
    const matchesCategory =
      selectedCategory === 'ALL' ||
      group === selectedCategory ||
      sign.category.toUpperCase() === selectedCategory;

    const matchesSearch =
      sign.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sign.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sign.hindiTranslation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sign.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  // Rapid manual injection test
  const handleSimulateSign = (sign: ISLSignDefinition) => {
    setPrediction({
      sign: sign.id,
      confidence: 0.96,
      isDynamic: sign.motionType === 'dynamic',
      latencyMs: 12,
      isUncertain: false,
    });
    addToken(sign.id, 0.96);
  };

  return (
    <div className="bg-[#0C111C]/90 border border-white/[0.08] rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 text-slate-200 backdrop-blur-xl">
      {/* Header & Stats */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-white tracking-tight">
              30 Core ISL Lexicon Directory
            </h3>
            <p className="text-[11px] text-slate-400 font-normal">Indian Sign Language vocabulary & motion profiles</p>
          </div>
        </div>

        <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] text-emerald-400 font-semibold">
          {filteredSigns.length} Signs Loaded
        </span>
      </div>

      {/* Category Tabs & Search Bar */}
      <div className="space-y-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-semibold flex items-center gap-2 shrink-0 transition-all border ${
                  isSelected
                    ? 'bg-emerald-400 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-950/40'
                    : 'bg-white/[0.03] hover:bg-white/[0.08] text-slate-400 border-white/[0.06] hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter signs by English name, Hindi translation, or motion description..."
            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-11 pr-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-400 transition-all"
          />
        </div>
      </div>

      {/* Grid of Sign Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[440px] overflow-y-auto pr-1 scrollbar-thin">
        {filteredSigns.map((sign) => {
          const group = getCategoryGroup(sign);
          const isEmergency = group === 'EMERGENCY';

          return (
            <div
              key={sign.id}
              className="bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] hover:border-white/15 rounded-2xl p-4 transition-all shadow-sm flex flex-col justify-between space-y-3 group"
            >
              {/* Card Top */}
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{sign.emoji}</span>
                    <div>
                      <h4 className="font-semibold text-sm text-white group-hover:text-emerald-300 transition-colors">
                        {sign.label}
                      </h4>
                      <p className="text-[11px] text-slate-400 font-medium">
                        {sign.hindiTranslation}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border uppercase ${
                      isEmergency
                        ? 'bg-red-500/15 text-red-400 border-red-500/30'
                        : 'bg-white/[0.04] text-slate-400 border-white/10'
                    }`}
                  >
                    {group}
                  </span>
                </div>

                <p className="text-xs text-slate-300 mt-2 line-clamp-2 leading-relaxed font-sans font-normal">
                  {sign.description}
                </p>
              </div>

              {/* Action Buttons: Practice Arena & Rapid Simulate Test */}
              <div className="pt-2.5 border-t border-white/[0.06] flex items-center justify-between gap-2">
                <button
                  onClick={() => startPractice(sign.id)}
                  className="flex-1 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/10 text-[11px] font-medium flex items-center justify-center gap-1.5 transition-all"
                  title="Practice this gesture with live camera feedback"
                >
                  <GraduationCap className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Practice</span>
                </button>

                <button
                  onClick={() => handleSimulateSign(sign)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/25 text-[11px] font-semibold flex items-center gap-1.5 transition-all"
                  title="Inject mock vector into sentence builder"
                >
                  <Play className="w-3 h-3" />
                  <span>Test Token</span>
                </button>
              </div>
            </div>
          );
        })}

        {filteredSigns.length === 0 && (
          <div className="col-span-full py-8 text-center text-slate-500 text-xs font-mono">
            No matching signs found for &ldquo;{searchQuery}&rdquo;.
          </div>
        )}
      </div>
    </div>
  );
};
