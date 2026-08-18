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
    <div className="bg-surface-100 border border-surface-200 rounded-2xl p-5 shadow-xl space-y-4 text-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-surface-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-cyan/20 text-brand-cyan flex items-center justify-center font-bold">
            <Ear className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white">Hearing ➔ Signer Mode</h3>
            <p className="text-[11px] text-slate-400">Speech-to-Visual ISL sequence translator</p>
          </div>
        </div>

        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-surface-50 border border-surface-200 text-brand-cyan">
          Two-Way Bridge
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
            className="flex-1 bg-surface-50 border border-surface-200 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-cyan transition-colors"
          />

          <button
            onClick={toggleSpeechRecognition}
            className={`p-2.5 rounded-xl border font-semibold text-xs flex items-center gap-1.5 transition-all shadow-md ${
              isListening
                ? 'bg-red-500 text-white border-red-400 animate-pulse'
                : 'bg-surface-50 hover:bg-surface-200 border-surface-200 text-brand-cyan'
            }`}
            title="Toggle Microphone (Speech-to-Text)"
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            <span className="hidden sm:inline">{isListening ? 'Listening...' : 'Voice Input'}</span>
          </button>
        </div>

        {speechError && (
          <p className="text-xs text-red-400 flex items-center gap-1">
            <Info className="w-3 h-3" /> {speechError}
          </p>
        )}
      </div>

      {/* Detected Mapped ISL Keywords Stream */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs text-slate-400 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-brand-amber" /> Parsed Signs ({matchedSigns.length}):
        </span>

        {matchedSigns.map((sign, idx) => (
          <button
            key={sign.id}
            onClick={() => {
              setActiveCardIndex(idx);
              setIsPlayingSequence(false);
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 border transition-all ${
              activeCardIndex === idx
                ? 'bg-brand-cyan text-slate-950 border-brand-cyan font-bold shadow-md shadow-brand-cyan/20'
                : 'bg-surface-50 hover:bg-surface-200 border-surface-200 text-slate-300'
            }`}
          >
            <span>{sign.emoji}</span>
            <span>{sign.id}</span>
          </button>
        ))}

        {matchedSigns.length === 0 && (
          <span className="text-xs text-slate-500 italic">No ISL keywords recognized yet.</span>
        )}
      </div>

      {/* Visual ISL Flashcard Display for Signer */}
      {activeSign ? (
        <div className="p-4 rounded-xl bg-surface-50 border border-surface-200/90 space-y-3 shadow-inner">
          {/* Card Header & Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{activeSign.emoji}</span>
              <div>
                <h4 className="font-bold text-white text-base leading-tight">{activeSign.label}</h4>
                <p className="text-xs text-brand-emerald font-medium">{activeSign.hindiTranslation}</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Sequence Play / Pause */}
              <button
                onClick={() => setIsPlayingSequence(!isPlayingSequence)}
                disabled={matchedSigns.length <= 1}
                className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 font-semibold ${
                  isPlayingSequence
                    ? 'bg-brand-emerald text-slate-950 border-brand-emerald'
                    : 'bg-surface-200 hover:bg-surface-300 border-surface-300 text-slate-300'
                }`}
                title="Play sequential ISL flashcard player"
              >
                <Play className="w-3 h-3" />
                <span className="text-[10px]">{isPlayingSequence ? 'Playing' : 'Play Sequence'}</span>
              </button>

              {/* Prev */}
              <button
                onClick={() => setActiveCardIndex((prev) => Math.max(0, prev - 1))}
                disabled={activeCardIndex === 0}
                className="p-1.5 rounded-lg bg-surface-200 hover:bg-surface-300 border border-surface-300 text-slate-300 disabled:opacity-30"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>

              <span className="text-xs font-mono px-1.5 text-slate-400">
                {activeCardIndex + 1}/{matchedSigns.length}
              </span>

              {/* Next */}
              <button
                onClick={() => setActiveCardIndex((prev) => Math.min(matchedSigns.length - 1, prev + 1))}
                disabled={activeCardIndex >= matchedSigns.length - 1}
                className="p-1.5 rounded-lg bg-surface-200 hover:bg-surface-300 border border-surface-300 text-slate-300 disabled:opacity-30"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Description & Movement Instructions */}
          <div className="bg-surface-100 rounded-lg p-3 border border-surface-200 space-y-1.5 text-xs">
            <p className="text-slate-300 leading-relaxed font-sans">{activeSign.description}</p>

            <div className="pt-1 space-y-1">
              <span className="text-[11px] font-semibold text-brand-cyan uppercase tracking-wider block">
                How To Sign:
              </span>
              <ul className="list-disc list-inside text-slate-400 space-y-0.5 font-mono text-[11px]">
                {activeSign.instructions.map((ins, i) => (
                  <li key={i}>{ins}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 rounded-xl bg-surface-50 border border-surface-200 text-center space-y-2">
          <Eye className="w-8 h-8 text-slate-500 mx-auto" />
          <p className="text-xs text-slate-400">
            Type or speak sentences like <strong className="text-white">&ldquo;Do you want water or food?&rdquo;</strong> to generate sequential ISL visual flashcards.
          </p>
        </div>
      )}
    </div>
  );
};
