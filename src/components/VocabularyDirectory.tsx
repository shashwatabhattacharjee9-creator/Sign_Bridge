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
    <div className="liquid-card rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 text-white">
      {/* Header & Stats */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="liquid-glass p-2 rounded-xl text-white">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-medium text-sm text-white tracking-tight">
              30 Core ISL Lexicon Directory
            </h3>
            <p className="text-[11px] text-white/50 font-normal">Indian Sign Language vocabulary & motion profiles</p>
          </div>
        </div>

        <span className="text-[11px] font-mono px-3 py-1 liquid-glass rounded-full text-white/80 font-medium">
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
                className={`px-4 py-2 rounded-full text-xs font-medium flex items-center gap-2 shrink-0 transition-all ${
                  isSelected
                    ? 'bg-white text-black font-semibold shadow-md'
                    : 'liquid-glass text-white/70 hover:text-white hover:bg-white/10'
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
          <Search className="w-4 h-4 text-white/40 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter signs by English name, Hindi translation, or motion description..."
            className="w-full liquid-glass rounded-full pl-11 pr-4 py-3 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 transition-all"
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
              className="liquid-glass rounded-2xl p-4 transition-all shadow-sm flex flex-col justify-between space-y-3 hover:bg-white/5 group"
            >
              {/* Card Top */}
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{sign.emoji}</span>
                    <div>
                      <h4 className="font-medium text-sm text-white group-hover:text-white transition-colors">
                        {sign.label}
                      </h4>
                      <p className="text-[11px] text-white/60 font-normal">
                        {sign.hindiTranslation}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-mono font-medium px-2.5 py-0.5 rounded-full uppercase ${
                      isEmergency
                        ? 'bg-red-500/20 text-red-300'
                        : 'liquid-glass text-white/60'
                    }`}
                  >
                    {group}
                  </span>
                </div>

                <p className="text-xs text-white/70 mt-2 line-clamp-2 leading-relaxed font-sans font-normal">
                  {sign.description}
                </p>
              </div>

              {/* Action Buttons: Practice Arena & Rapid Simulate Test */}
              <div className="pt-2.5 border-t border-white/5 flex items-center justify-between gap-2">
                <button
                  onClick={() => startPractice(sign.id)}
                  className="flex-1 px-3 py-1.5 rounded-full liquid-glass text-white/80 hover:text-white hover:bg-white/10 text-[11px] font-medium flex items-center justify-center gap-1.5 transition-all"
                  title="Practice this gesture with live camera feedback"
                >
                  <GraduationCap className="w-3.5 h-3.5 text-white/70" />
                  <span>Practice</span>
                </button>

                <button
                  onClick={() => handleSimulateSign(sign)}
                  className="px-3 py-1.5 rounded-full liquid-glass text-white/90 hover:bg-white/10 text-[11px] font-medium flex items-center gap-1.5 transition-all"
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
          <div className="col-span-full py-8 text-center text-white/40 text-xs font-mono">
            No matching signs found for &ldquo;{searchQuery}&rdquo;.
          </div>
        )}
      </div>
    </div>
  );
};
