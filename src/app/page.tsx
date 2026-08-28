'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSignBridgeStore } from '@/store/useSignBridgeStore';
import { Header } from '@/components/Header';
import { HeroSection } from '@/components/HeroSection';
import { VisionCanvas } from '@/components/VisionCanvas';
import { SentenceBuilder } from '@/components/SentenceBuilder';
import { TwoWayBridge } from '@/components/TwoWayBridge';
import { ContextSelector, TriageMode } from '@/components/ContextSelector';
import { TranscriptAuditLogger, AuditLogEntry } from '@/components/TranscriptAuditLogger';
import { DualCamPeerChat } from '@/components/DualCamPeerChat';
import { TelemetryPanel } from '@/components/TelemetryPanel';
import { VocabularyDirectory } from '@/components/VocabularyDirectory';
import { PracticeArena } from '@/components/PracticeArena';
import { QuickCalibrator } from '@/components/QuickCalibrator';
import { motion } from 'framer-motion';
import {
  Activity,
  BookOpen,
  Ear,
  GraduationCap,
  Layers,
  MessageSquare,
  Radio,
  Sliders,
  Sparkles,
  Target,
  Zap,
  Users,
  Camera,
} from 'lucide-react';

import { navigationStateManager, AppMode } from '@/lib/engine/navigationState';
import { audioLatchEngine } from '@/lib/audio/tts';
import { SupportedLanguage } from '@/lib/engine/multilingualScripts';
import { scenarioEngineManager } from '@/lib/engine/scenarioSentenceEngine';
import { studioEngineManager } from '@/lib/engine/studioEngine';
import { multilingualSpeechEngine } from '@/lib/audio/multilingualTTS';

export default function Home() {
  const { activeTab, setActiveTab, tokens } = useSignBridgeStore();
  const [triageMode, setTriageMode] = useState<TriageMode>('campus');
  const [studioSubMode, setStudioSubMode] = useState<'single' | 'peer'>('single');
  const [studioLang, setStudioLang] = useState<SupportedLanguage>('en');
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([
    {
      sender: 'Desk Officer',
      text: 'Welcome to the Helpdesk. Please sign or type your query.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [rightTab, setRightTab] = useState<
    'bridge' | 'telemetry' | 'calibrator' | 'vocabulary' | 'practice'
  >('bridge');
  const lastProcessedTokenCountRef = useRef<number>(0);

  const switchTab = (tab: any) => {
    audioLatchEngine.killAllSpeech();
    const appMode: AppMode = tab === 'vision' ? 'studio' : (tab as AppMode);
    navigationStateManager.setMode(appMode);
    setActiveTab(tab);
  };

  // Sync newly detected signs from the Deaf User into the audit log
  useEffect(() => {
    if (tokens.length > lastProcessedTokenCountRef.current) {
      const newTokens = tokens.slice(lastProcessedTokenCountRef.current);
      lastProcessedTokenCountRef.current = tokens.length;

      const phrase = newTokens.map((t) => t.label).join(' ');
      if (phrase.trim()) {
        setAuditLogs((prev) => [
          ...prev,
          {
            sender: 'Deaf User',
            text: phrase,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } else if (tokens.length === 0) {
      lastProcessedTokenCountRef.current = 0;
    }
  }, [tokens]);

  const handleOfficerResponse = (text: string) => {
    if (!text.trim()) return;
    setAuditLogs((prev) => [
      ...prev,
      {
        sender: 'Desk Officer',
        text: text.trim(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const handleClearAuditLogs = () => {
    setAuditLogs([]);
  };

  // If in Hero landing view, render the requested Fullscreen Hero Section directly
  if (activeTab === 'hero') {
    return (
      <main className="w-full h-screen overflow-hidden bg-black font-sans">
        <HeroSection
          onStartTranslating={() => switchTab('vision')}
          onPracticeSigns={() => switchTab('practice')}
          onOpenDictionary={() => switchTab('vocabulary')}
        />
      </main>
    );
  }

  const rightTabs = [
    { id: 'bridge', label: '2-Way Bridge', icon: MessageSquare },
    { id: 'telemetry', label: 'Telemetry', icon: Activity },
    { id: 'calibrator', label: 'Calibrate', icon: Target },
    { id: 'vocabulary', label: '30 Signs', icon: BookOpen },
    { id: 'practice', label: 'Practice', icon: GraduationCap },
  ] as const;

  const getDomainTitle = () => {
    switch (triageMode) {
      case 'campus':
        return 'Campus Helpdesk & Academic Admissions';
      case 'healthcare':
        return 'Hospital Triage & Medical Reception';
      case 'emergency':
        return 'Emergency Response & Urgency Counter';
      default:
        return 'Institutional Helpdesk';
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black">
      {/* Top Header with Title, Tagline, Offline Badge, and Controls */}
      <Header />

      {/* Master Responsive Platform Dashboard */}
      <main className="flex-1 max-w-[1640px] w-full mx-auto p-3 sm:p-5 lg:p-6 space-y-4">
        {/* Studio Mode Switcher: Single Helpdesk vs Split-Screen Peer Studio */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-white/90 uppercase font-mono tracking-wider">
              Studio Environment:
            </span>
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950/80 border border-white/10">
            <button
              onClick={() => {
                setStudioSubMode('single');
                switchTab('vision');
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'vision' && studioSubMode === 'single'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Single Studio (Helpdesk Triage)</span>
            </button>

            <button
              onClick={() => {
                setStudioSubMode('peer');
                switchTab('peer');
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'peer' || (activeTab === 'vision' && studioSubMode === 'peer')
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Split-Screen Peer Studio</span>
            </button>
          </div>
        </div>

        {activeTab === 'peer' || (activeTab === 'vision' && studioSubMode === 'peer') ? (
          <div className="space-y-4">
            <DualCamPeerChat />
          </div>
        ) : activeTab === 'vision' ? (
          <div className="space-y-4">
            {/* Institutional Workflow Context Selector Banner with Trilingual Selector */}
            <ContextSelector
              activeMode={triageMode}
              onModeChange={setTriageMode}
              activeLanguage={studioLang}
              onLanguageChange={(lang) => {
                setStudioLang(lang);
                studioEngineManager.setLanguage(lang);
                scenarioEngineManager.setLanguage(lang);
                multilingualSpeechEngine.setLanguage(lang);
              }}
            />

            {/* Main Interactive Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Left Column (7 cols): Live Webcam Vision Stream + HUD */}
              <div className="lg:col-span-7 flex flex-col space-y-4">
                <VisionCanvas />
                <SentenceBuilder />
              </div>

              {/* Right Column (5 cols): 2-Way Communication Bridge & Sidebar Switcher */}
              <div className="lg:col-span-5 flex flex-col space-y-3">
                {/* Right Sidebar Switcher Tabs */}
                <div className="relative flex items-center liquid-glass p-1 rounded-full shadow-lg gap-0.5 overflow-x-auto scrollbar-thin">
                  {rightTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = rightTab === tab.id;

                    return (
                      <button
                        key={tab.id}
                        onClick={() => setRightTab(tab.id as any)}
                        className={`relative flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-full text-xs font-medium shrink-0 transition-colors duration-200 z-10 select-none ${
                          isActive
                            ? 'text-black font-semibold'
                            : 'text-white/80 hover:text-white'
                        }`}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="activeRightTabPill"
                            className="absolute inset-0 rounded-full bg-white shadow-sm z-[-1]"
                            transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                          />
                        )}
                        <Icon className="w-3.5 h-3.5 relative z-10" />
                        <span className="relative z-10">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Tabbed Content: Defaulting to 2-Way Bridge for instant bidirectional chat */}
                {rightTab === 'bridge' && <TwoWayBridge onOfficerResponse={handleOfficerResponse} />}
                {rightTab === 'telemetry' && <TelemetryPanel />}
                {rightTab === 'calibrator' && <QuickCalibrator />}
                {rightTab === 'vocabulary' && <VocabularyDirectory />}
                {rightTab === 'practice' && <PracticeArena />}
              </div>
            </div>

            {/* Bottom Section: Full Institutional Interaction Audit Logger & Export */}
            <div className="pt-2">
              <TranscriptAuditLogger
                transcripts={auditLogs}
                onClear={handleClearAuditLogs}
                deploymentContext={getDomainTitle()}
              />
            </div>
          </div>
        ) : activeTab === 'calibration' ? (
          <div className="max-w-5xl mx-auto space-y-4">
            <QuickCalibrator />
          </div>
        ) : activeTab === 'practice' ? (
          <div className="space-y-4">
            <PracticeArena />
          </div>
        ) : activeTab === 'translate' ? (
          <div className="max-w-4xl mx-auto space-y-4">
            <TwoWayBridge onOfficerResponse={handleOfficerResponse} />
          </div>
        ) : (
          <div className="max-w-5xl mx-auto space-y-4">
            <VocabularyDirectory />
          </div>
        )}
      </main>

      {/* Technical Footnote & Edge-AI Pipeline Diagram */}
      <footer className="border-t border-white/5 bg-black/90 backdrop-blur-2xl py-4 px-5 sm:px-6 md:px-12 lg:px-16 mt-6">
        <div className="max-w-[1640px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-white/50">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium text-white">SignBridge Full-Stack Platform:</span>
            <span className="font-mono text-white/40 hidden lg:inline">
              Edge WASM (30 FPS) &bull; Trilingual Synthesis (EN/HI/TA) &bull; Split-Screen Peer Studio &bull; 0 Egress
            </span>
          </div>

          <div className="flex items-center gap-3 text-white/50 font-mono text-[11px]">
            <span className="text-emerald-400 font-medium font-mono">🔒 100% Client-Side Local</span>
            <span>&bull;</span>
            <span className="text-white/80">Bidirectional Accessibility Suite</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
