'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Users,
  Volume2,
  ArrowRightLeft,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Play,
  Languages,
  Zap,
} from 'lucide-react';
import { dualPeerEngineManager, ActiveSigner, PeerMessage } from '@/lib/engine/dualPeerEngine';
import { SupportedLanguage, MULTILINGUAL_DATA } from '@/lib/engine/multilingualScripts';
import { multilingualAudioEngine } from '@/lib/audio/multilingualTTS';
import { navigationStateManager } from '@/lib/engine/navigationState';

export default function DualCamPeerChat() {
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>('en');
  const [activeSigner, setActiveSigner] = useState<ActiveSigner>('A');
  const [liveTokens, setLiveTokens] = useState<string[]>([]);
  const [history, setHistory] = useState<PeerMessage[]>([]);
  const videoRefA = useRef<HTMLVideoElement | null>(null);
  const videoRefB = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    navigationStateManager.setMode('peer' as any);
  }, []);

  // Initialize camera stream on mount and attach to both virtual peer panels
  useEffect(() => {
    let activeStream: MediaStream | null = null;

    async function startWebcam() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user',
          },
          audio: false,
        });

        activeStream = stream;
        if (videoRefA.current) videoRefA.current.srcObject = stream;
        if (videoRefB.current) videoRefB.current.srcObject = stream;
      } catch (err) {
        console.error('Camera initialization error for peer chat:', err);
      }
    }

    startWebcam();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Sync state loop
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSigner(dualPeerEngineManager.getActiveSigner());
      setLiveTokens([...dualPeerEngineManager.getLiveTokens()]);
      setHistory([...dualPeerEngineManager.getHistory()]);
    }, 80);

    return () => clearInterval(interval);
  }, []);

  const handleLanguageChange = (lang: SupportedLanguage) => {
    setSelectedLang(lang);
    dualPeerEngineManager.setLanguage(lang);
    multilingualAudioEngine.setLanguage(lang);
  };

  const handleTriggerTurn = () => {
    dualPeerEngineManager.handleGestureTrigger();
  };

  const handleReset = () => {
    dualPeerEngineManager.reset();
    multilingualAudioEngine.kill();
    setLiveTokens([]);
    setHistory([]);
  };

  return (
    <div className="w-full bg-slate-950 border border-white/10 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col gap-5 text-white">
      {/* Header & Trilingual Switcher Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              Peer-to-Peer ISL Tele-Dialogue Studio
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono font-semibold">
                Split-Screen Sync
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Autonomous bidirectional sign language translation between two deaf peers
            </p>
          </div>
        </div>

        {/* Trilingual Selector */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900 border border-white/10">
          {(Object.keys(MULTILINGUAL_DATA) as SupportedLanguage[]).map((langKey) => {
            const config = MULTILINGUAL_DATA[langKey];
            const isSelected = selectedLang === langKey;
            return (
              <button
                key={langKey}
                onClick={() => handleLanguageChange(langKey)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 scale-105'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{config.flag}</span>
                <span>{config.nativeLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Split-Screen Dual Camera Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Panel A: Person A */}
        <div
          className={`relative rounded-2xl overflow-hidden border-2 transition-all duration-300 bg-slate-900/80 ${
            activeSigner === 'A'
              ? 'border-cyan-400 shadow-xl shadow-cyan-500/20 ring-2 ring-cyan-400/30'
              : 'border-white/10 opacity-70'
          }`}
        >
          <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono ${
                activeSigner === 'A'
                  ? 'bg-cyan-500 text-slate-950 shadow-md animate-pulse'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {activeSigner === 'A' ? '● LIVE SIGNING' : '○ STANDBY'} : Signer A (Peer 1)
            </span>
          </div>

          <video
            ref={videoRefA}
            autoPlay
            playsInline
            muted
            className="w-full h-56 sm:h-64 object-cover -scale-x-100 bg-black"
          />

          {/* Signer A Live Token HUD Overlay */}
          <div className="absolute bottom-3 inset-x-3 p-2.5 rounded-xl bg-slate-950/90 border border-white/10 backdrop-blur-md">
            <span className="text-[10px] text-cyan-400 uppercase tracking-wider font-semibold block mb-1">
              Active Articulation Stream
            </span>
            <div className="flex flex-wrap gap-1 min-h-[28px] items-center">
              {activeSigner === 'A' && liveTokens.length > 0 ? (
                liveTokens.map((tok, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-md bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-medium animate-in zoom-in-95"
                  >
                    {tok}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-500 italic">
                  {activeSigner === 'A'
                    ? 'Signing in progress on camera...'
                    : 'Waiting for Peer 1 to conclude response...'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Panel B: Person B */}
        <div
          className={`relative rounded-2xl overflow-hidden border-2 transition-all duration-300 bg-slate-900/80 ${
            activeSigner === 'B'
              ? 'border-emerald-400 shadow-xl shadow-emerald-500/20 ring-2 ring-emerald-400/30'
              : 'border-white/10 opacity-70'
          }`}
        >
          <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono ${
                activeSigner === 'B'
                  ? 'bg-emerald-500 text-slate-950 shadow-md animate-pulse'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {activeSigner === 'B' ? '● LIVE SIGNING' : '○ STANDBY'} : Signer B (Peer 2)
            </span>
          </div>

          <video
            ref={videoRefB}
            autoPlay
            playsInline
            muted
            className="w-full h-56 sm:h-64 object-cover -scale-x-100 bg-black"
          />

          {/* Signer B Live Token HUD Overlay */}
          <div className="absolute bottom-3 inset-x-3 p-2.5 rounded-xl bg-slate-950/90 border border-white/10 backdrop-blur-md">
            <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-semibold block mb-1">
              Active Articulation Stream
            </span>
            <div className="flex flex-wrap gap-1 min-h-[28px] items-center">
              {activeSigner === 'B' && liveTokens.length > 0 ? (
                liveTokens.map((tok, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-medium animate-in zoom-in-95"
                  >
                    {tok}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-500 italic">
                  {activeSigner === 'B'
                    ? 'Signing in progress on camera...'
                    : 'Waiting for Peer 2 turn...'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Trigger Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/60 border border-white/5">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Zap className="w-4 h-4 text-cyan-400" />
          <span>Active Turn:</span>
          <span
            className={`font-bold font-mono px-2 py-0.5 rounded-md ${
              activeSigner === 'A'
                ? 'bg-cyan-500/20 text-cyan-300'
                : 'bg-emerald-500/20 text-emerald-300'
            }`}
          >
            {activeSigner === 'A' ? 'Signer A (Peer 1)' : 'Signer B (Peer 2)'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTriggerTurn}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs transition-all shadow-md shadow-cyan-600/20 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Simulate / Progress Gesture Turn</span>
          </button>
        </div>
      </div>

      {/* Shared Conversational Transcript Log */}
      <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Bidirectional Dialogue History ({history.length} Exchanged)
            </h4>
          </div>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-medium transition-all cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" /> Reset Conversation
          </button>
        </div>

        <div className="max-h-56 overflow-y-auto flex flex-col gap-2.5 p-2 rounded-xl bg-slate-950/60 border border-white/5">
          {history.length === 0 ? (
            <p className="text-xs text-slate-500 italic text-center py-6">
              Peer dialogue session initialized. Perform gestures or trigger turns to start the peer conversation exchange.
            </p>
          ) : (
            history.map((msg) => (
              <div
                key={msg.id}
                className={`p-3 rounded-2xl border flex flex-col gap-1 transition-all ${
                  msg.sender.includes('Signer A')
                    ? 'bg-cyan-950/30 border-cyan-500/20 self-start max-w-[85%]'
                    : 'bg-emerald-950/30 border-emerald-500/20 self-end max-w-[85%]'
                }`}
              >
                <div className="flex items-center justify-between gap-4 text-[10px] font-mono">
                  <span
                    className={
                      msg.sender.includes('Signer A')
                        ? 'text-cyan-400 font-bold'
                        : 'text-emerald-400 font-bold'
                    }
                  >
                    {msg.sender}
                  </span>
                  <span className="text-slate-500">{msg.timestamp}</span>
                </div>
                <p className="text-sm font-medium text-white/95">{msg.text}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export { DualCamPeerChat };
