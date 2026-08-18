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
    <div className="bg-surface-100 border border-surface-200 rounded-2xl p-5 shadow-xl space-y-4 text-slate-200">
      {/* Header & Stats */}
      <div className="flex items-center justify-between pb-3 border-b border-surface-200">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-brand-emerald" />
          <h3 className="font-bold text-sm text-white uppercase tracking-wider">
            30 Core ISL Signs Directory
          </h3>
        </div>

        <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-brand-emerald/10 border border-brand-emerald/30 text-brand-emerald font-semibold">
          {filteredSigns.length} Signs Listed
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
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-all border ${
                  isSelected
                    ? 'bg-brand-emerald text-slate-950 border-brand-emerald shadow-md shadow-brand-emerald/20'
                    : 'bg-surface-50 hover:bg-surface-200 text-slate-400 border-surface-200 hover:text-white'
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
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter signs by English name, Hindi translation, or movement description..."
            className="w-full bg-surface-50 border border-surface-200 rounded-xl pl-9.5 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-emerald transition-colors"
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
              className="bg-surface-50 hover:bg-surface-50/80 border border-surface-200/90 hover:border-brand-emerald/50 rounded-xl p-3.5 transition-all shadow-sm flex flex-col justify-between space-y-2.5 group"
            >
              {/* Card Top */}
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{sign.emoji}</span>
                    <div>
                      <h4 className="font-bold text-sm text-white group-hover:text-brand-emerald transition-colors">
                        {sign.label}
                      </h4>
                      <p className="text-[11px] text-slate-400 font-medium">
                        {sign.hindiTranslation}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-md border uppercase ${
                      isEmergency
                        ? 'bg-red-500/20 text-red-400 border-red-500/30'
                        : 'bg-surface-200 text-slate-400 border-surface-300'
                    }`}
                  >
                    {group}
                  </span>
                </div>

                <p className="text-xs text-slate-300 mt-2 line-clamp-2 leading-relaxed font-sans">
                  {sign.description}
                </p>
              </div>

              {/* Action Buttons: Practice Arena & Rapid Simulate Test */}
              <div className="pt-2 border-t border-surface-200/80 flex items-center justify-between gap-2">
                <button
                  onClick={() => startPractice(sign.id)}
                  className="flex-1 px-2 py-1 rounded-lg bg-surface-200 hover:bg-surface-300 text-slate-300 hover:text-white border border-surface-300 text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors"
                  title="Practice this gesture with live camera feedback"
                >
                  <GraduationCap className="w-3 h-3 text-brand-cyan" />
                  <span>Practice</span>
                </button>

                <button
                  onClick={() => handleSimulateSign(sign)}
                  className="px-2.5 py-1 rounded-lg bg-brand-emerald/10 hover:bg-brand-emerald/20 text-brand-emerald border border-brand-emerald/30 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                  title="Inject mock vector into sentence builder"
                >
                  <Play className="w-3 h-3" />
                  <span>Test UI</span>
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
