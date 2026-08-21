'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ISLSign, ISLSignDefinition } from '@/types/isl';
import { ISL_VOCABULARY } from '@/lib/engine/gestureLibrary';
import {
  ArrowLeft,
  ArrowRight,
  Ear,
  Eye,
  Hand,
  Info,
  Mic,
  MicOff,
  Play,
  RotateCcw,
  Sparkles,
  Volume2,
} from 'lucide-react';

export const TwoWayTranslator: React.FC = () => {
  const [inputText, setInputText] = useState<string>('Hello, do you need help or water?');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [matchedSigns, setMatchedSigns] = useState<ISLSignDefinition[]>([]);
  const [activeCardIndex, setActiveCardIndex] = useState<number>(0);
  const [isPlayingSequence, setIsPlayingSequence] = useState<boolean>(false);
  const [speechError, setSpeechError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  // Keyword dictionary mapping natural words to 30 ISL Sign Definitions
  const KEYWORD_MAP: Record<string, ISLSign> = {
    hello: 'HELLO',
    hi: 'HELLO',
    hey: 'HELLO',
    greetings: 'HELLO',
    namaste: 'NAMASTE',
    goodbye: 'GOODBYE',
    bye: 'GOODBYE',
    thanks: 'THANK_YOU',
    thank: 'THANK_YOU',
    please: 'PLEASE',
    sorry: 'SORRY',
    excuse: 'SORRY',
    yes: 'YES',
    yeah: 'YES',
    no: 'NO',
    nope: 'NO',
    okay: 'OKAY',
    ok: 'OKAY',
    fine: 'OKAY',
    help: 'HELP',
    assist: 'HELP',
    emergency: 'HELP',
    water: 'WATER',
    drink: 'WATER',
    food: 'FOOD',
    eat: 'FOOD',
    hungry: 'FOOD',
    medicine: 'MEDICINE',
    pills: 'MEDICINE',
    hospital: 'HOSPITAL',
    doctor: 'HOSPITAL',
    clinic: 'HOSPITAL',
    police: 'POLICE',
    cop: 'POLICE',
    bathroom: 'BATHROOM',
    toilet: 'BATHROOM',
    washroom: 'BATHROOM',
    restroom: 'BATHROOM',
    pain: 'PAIN',
    hurt: 'PAIN',
    danger: 'DANGER',
    hazard: 'DANGER',
    ambulance: 'AMBULANCE',
    teacher: 'TEACHER',
    sir: 'TEACHER',
    madam: 'TEACHER',
    professor: 'TEACHER',
    class: 'CLASS',
    classroom: 'CLASS',
    lesson: 'CLASS',
    go: 'GO',
    leave: 'GO',
    come: 'COME',
    here: 'COME',
    stop: 'STOP',
    halt: 'STOP',
    wait: 'WAIT',
    hold: 'WAIT',
    repeat: 'REPEAT',
    again: 'REPEAT',
    want: 'WANT',
    wish: 'WANT',
    need: 'NEED',
    require: 'NEED',
    must: 'NEED',
    learn: 'LEARN',
    study: 'LEARN',
    book: 'BOOK',
    read: 'BOOK',
    write: 'WRITE',
    notes: 'WRITE',
    friend: 'FRIEND',
    buddy: 'FRIEND',
  };

  // Parse natural English text into sequence of ISL Sign definitions
  const parseTextToISL = (text: string) => {
    if (!text.trim()) {
      setMatchedSigns([]);
      return;
    }

    const words = text
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, '')
      .split(/\s+/);

    const found: ISLSignDefinition[] = [];
    const seen = new Set<string>();

    for (const w of words) {
      const mappedId = KEYWORD_MAP[w];
      if (mappedId && ISL_VOCABULARY[mappedId] && !seen.has(mappedId)) {
        found.push(ISL_VOCABULARY[mappedId]);
        seen.add(mappedId);
      }
    }

    setMatchedSigns(found);
    setActiveCardIndex(0);
  };

  useEffect(() => {
    parseTextToISL(inputText);
  }, [inputText]);

  // Sequential visual player timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlayingSequence && matchedSigns.length > 0) {
      timer = setInterval(() => {
        setActiveCardIndex((prev) => {
          if (prev >= matchedSigns.length - 1) {
            setIsPlayingSequence(false);
            return 0;
          }
          return prev + 1;
        });
      }, 2500);
    }
    return () => clearInterval(timer);
  }, [isPlayingSequence, matchedSigns.length]);

  // Initialize Speech Recognition
  const toggleSpeechRecognition = () => {
    if (typeof window === 'undefined') return;

    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setSpeechError('Web Speech API is not supported in this browser. Please type text below.');
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.lang = 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setSpeechError('Microphone permission denied.');
        } else {
          setSpeechError(`Speech error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e: any) {
      setSpeechError(e.message || 'Speech recognition initialization failed.');
      setIsListening(false);
    }
  };

  const activeSign = matchedSigns[activeCardIndex] || matchedSigns[0];

  return (
    <div className="bg-[#0C111C]/90 border border-white/[0.08] rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 text-slate-200 backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Ear className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-white tracking-tight">Hearing ➔ Signer Two-Way Mode</h3>
            <p className="text-[11px] text-slate-400 font-normal">Speech-to-Visual ISL sequence translator</p>
          </div>
        </div>

        <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] text-cyan-400 font-semibold">
          Bi-Directional
        </span>
      </div>

      {/* Input Row: Speech Recognition Mic + Text Box */}
      <div className="space-y-2">
        <div className="relative flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Speak or type English phrase (e.g., 'Do you need help or water?')..."
            className="flex-1 bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-400 transition-all placeholder:text-slate-600"
          />

          <button
            onClick={toggleSpeechRecognition}
            className={`p-3 rounded-2xl border font-semibold text-xs flex items-center gap-2 transition-all shadow-lg cursor-pointer ${
              isListening
                ? 'bg-red-500 text-white border-red-400 animate-pulse shadow-red-950/50'
                : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-cyan-300'
            }`}
            title="Toggle Microphone (Speech-to-Text)"
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            <span className="hidden sm:inline">{isListening ? 'Listening...' : 'Voice Mic'}</span>
          </button>
        </div>

        {speechError && (
          <p className="text-xs text-red-400 flex items-center gap-1.5 font-mono">
            <Info className="w-3.5 h-3.5" /> {speechError}
          </p>
        )}
      </div>

      {/* Detected Mapped ISL Keywords Stream */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Parsed Signs ({matchedSigns.length}):
        </span>

        {matchedSigns.map((sign, idx) => (
          <button
            key={sign.id}
            onClick={() => {
              setActiveCardIndex(idx);
              setIsPlayingSequence(false);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium flex items-center gap-1.5 border transition-all ${
              activeCardIndex === idx
                ? 'bg-cyan-400 text-slate-950 border-cyan-400 font-bold shadow-lg shadow-cyan-950/40 scale-105'
                : 'bg-white/[0.03] hover:bg-white/[0.08] border-white/[0.06] text-slate-300'
            }`}
          >
            <span className="text-sm">{sign.emoji}</span>
            <span>{sign.id}</span>
          </button>
        ))}

        {matchedSigns.length === 0 && (
          <span className="text-xs text-slate-500 italic">No ISL keywords recognized yet.</span>
        )}
      </div>

      {/* Visual ISL Flashcard Display for Signer */}
      {activeSign ? (
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-4 shadow-inner">
          {/* Card Header & Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-emerald-500/20 border border-white/15 flex items-center justify-center text-2xl shadow-inner">
                {activeSign.emoji}
              </div>
              <div>
                <h4 className="font-semibold text-white text-base leading-tight tracking-tight">{activeSign.label}</h4>
                <p className="text-xs text-emerald-400 font-medium">{activeSign.hindiTranslation}</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Sequence Play / Pause */}
              <button
                onClick={() => setIsPlayingSequence(!isPlayingSequence)}
                disabled={matchedSigns.length <= 1}
                className={`p-2 rounded-xl border text-xs flex items-center gap-1.5 font-medium transition-all ${
                  isPlayingSequence
                    ? 'bg-emerald-400 text-slate-950 border-emerald-400 font-bold'
                    : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-slate-200'
                }`}
                title="Play sequential ISL flashcard player"
              >
                <Play className="w-3.5 h-3.5" />
                <span className="text-xs">{isPlayingSequence ? 'Playing' : 'Play Sequence'}</span>
              </button>

              {/* Prev */}
              <button
                onClick={() => setActiveCardIndex((prev) => Math.max(0, prev - 1))}
                disabled={activeCardIndex === 0}
                className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-300 disabled:opacity-25"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              <span className="text-xs font-mono px-2 text-slate-400">
                {activeCardIndex + 1}/{matchedSigns.length}
              </span>

              {/* Next */}
              <button
                onClick={() => setActiveCardIndex((prev) => Math.min(matchedSigns.length - 1, prev + 1))}
                disabled={activeCardIndex >= matchedSigns.length - 1}
                className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-300 disabled:opacity-25"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Description & Movement Instructions */}
          <div className="bg-black/40 rounded-2xl p-4 border border-white/[0.06] space-y-2 text-xs">
            <p className="text-slate-300 leading-relaxed font-sans">{activeSign.description}</p>

            <div className="pt-1.5 space-y-1">
              <span className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider block">
                How To Sign:
              </span>
              <ul className="list-disc list-inside text-slate-400 space-y-1 font-mono text-[11px]">
                {activeSign.instructions.map((ins, i) => (
                  <li key={i}>{ins}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center space-y-2">
          <Eye className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-xs text-slate-400">
            Type or speak sentences like <strong className="text-white">&ldquo;Do you want water or food?&rdquo;</strong> to generate sequential ISL visual flashcards.
          </p>
        </div>
      )}
    </div>
  );
};
