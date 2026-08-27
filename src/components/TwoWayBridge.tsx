'use client';

import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Send, MessageSquare, Volume2, Sparkles, Languages, Check } from 'lucide-react';

export interface SignCard {
  label: string;
  desc: string;
  icon: string;
}

const SIGN_DICTIONARY: Record<string, SignCard> = {
  hello: { label: 'HELLO', desc: 'Open palm wave near temple', icon: '👋' },
  hi: { label: 'HELLO', desc: 'Open palm wave near temple', icon: '👋' },
  help: { label: 'HELP / ASSIST', desc: 'Closed fist over open palm', icon: '🤝' },
  fees: { label: 'FEES / PAYMENT', desc: 'Rubbing thumb and index at counter', icon: '💳' },
  fee: { label: 'FEES / PAYMENT', desc: 'Rubbing thumb and index at counter', icon: '💳' },
  payment: { label: 'PAYMENT COUNTER', desc: 'Hand tapping card swipe motion', icon: '💳' },
  library: { label: 'LIBRARY', desc: 'Circle "L" shape in the air', icon: '📚' },
  book: { label: 'BOOK / STUDY', desc: 'Palms opening like a book', icon: '📖' },
  form: { label: 'REGISTRATION FORM', desc: 'Index finger writing on flat left palm', icon: '📝' },
  registration: { label: 'REGISTRATION', desc: 'Two fingers stamping on palm', icon: '📋' },
  doctor: { label: 'DOCTOR / MEDICAL', desc: 'Tapping wrist pulse with two fingers', icon: '🩺' },
  hospital: { label: 'HOSPITAL / CLINIC', desc: 'Drawing cross on upper arm with thumb', icon: '🏥' },
  medicine: { label: 'MEDICINE / PHARMACY', desc: 'Grinding palm with thumb motion', icon: '💊' },
  where: { label: 'WHERE / LOCATION', desc: 'Index finger pointing up with gentle shake', icon: '📍' },
  location: { label: 'LOCATION / DESK', desc: 'Index finger pointing down at spot', icon: '📍' },
  yes: { label: 'YES / APPROVED', desc: 'Fist nodding up and down', icon: '👍' },
  approved: { label: 'APPROVED / OK', desc: 'Thumbs up double tap', icon: '✅' },
  no: { label: 'NO / WAIT', desc: 'Index and middle finger snap to thumb', icon: '✋' },
  wait: { label: 'PLEASE WAIT', desc: 'Open palm facing forward gently holding', icon: '⏳' },
  water: { label: 'WATER', desc: '"W" three fingers tapping chin', icon: '💧' },
  receipt: { label: 'RECEIPT / PROOF', desc: 'Flat hand peeling off receipt slip', icon: '🧾' },
  office: { label: 'ADMIN OFFICE', desc: 'Hands forming rectangular roof/door shape', icon: '🏢' },
  emergency: { label: 'EMERGENCY', desc: 'Shaking "E" hand formation rapidly', icon: '🚨' },
  thank: { label: 'THANK YOU', desc: 'Fingertips touching chin moving forward', icon: '🙏' },
  thanks: { label: 'THANK YOU', desc: 'Fingertips touching chin moving forward', icon: '🙏' },
};

interface Props {
  onOfficerResponse?: (text: string) => void;
}

export default function TwoWayBridge({ onOfficerResponse }: Props) {
  const [inputText, setInputText] = useState('');
  const [activeSigns, setActiveSigns] = useState<SignCard[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [copied, setCopied] = useState(false);

  const processInput = (text: string) => {
    const words = text.toLowerCase().split(/\s+/);
    const matched: SignCard[] = [];

    words.forEach((word) => {
      const clean = word.replace(/[^a-z]/g, '');
      if (SIGN_DICTIONARY[clean]) {
        matched.push(SIGN_DICTIONARY[clean]);
      }
    });

    // Default fallback if no direct keyword matches
    if (matched.length === 0 && text.trim().length > 0) {
      matched.push({ label: 'MESSAGE RECEIVED', desc: text, icon: '💬' });
    }

    setActiveSigns(matched);
    if (onOfficerResponse && text.trim()) {
      onOfficerResponse(text.trim());
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    processInput(inputText);
    setInputText('');
  };

  const toggleMic = () => {
    if (typeof window === 'undefined') return;

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser. Please type officer response.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = 'en-IN';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        processInput(transcript);
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-semibold text-white tracking-wide uppercase">
              Desk Officer &rarr; Visual Sign Output
            </h3>
            <p className="text-[10px] text-slate-400">Reverse Hearing-to-Deaf Communication Channel</p>
          </div>
        </div>
        <span className="text-[10px] sm:text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-medium">
          2-Way Bridge
        </span>
      </div>

      {/* Visual Sign Output Cards */}
      <div className="min-h-[110px] p-3 rounded-xl bg-slate-950/80 border border-white/5 flex items-center justify-center">
        {activeSigns.length === 0 ? (
          <p className="text-xs text-slate-500 italic text-center py-2">
            Officer speech or typed response will convert into visual ISL gesture cue cards here...
          </p>
        ) : (
          <div className="flex flex-wrap gap-2.5 w-full justify-center">
            {activeSigns.map((sign, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-950 border border-cyan-500/30 text-white shadow-lg animate-in zoom-in-95 duration-200"
              >
                <span className="text-2xl sm:text-3xl select-none">{sign.icon}</span>
                <div>
                  <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider">{sign.label}</h4>
                  <p className="text-[11px] text-slate-300 max-w-[200px] leading-tight mt-0.5">{sign.desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Action Preset Response Chips */}
      <div className="flex flex-wrap gap-1.5 items-center">
        <span className="text-[10px] font-mono text-slate-500 uppercase mr-1">Presets:</span>
        {[
          'Submit form at desk',
          'Fees receipt verified',
          'Library on 2nd floor',
          'Doctor is arriving now',
          'Please wait here',
        ].map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => {
              setInputText(preset);
              processInput(preset);
            }}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-[11px] text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            {preset}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSend} className="flex gap-2">
        <button
          type="button"
          onClick={toggleMic}
          className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
            isListening
              ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse'
              : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
          }`}
          title={isListening ? 'Listening... click to stop' : 'Click to Speak via Microphone'}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type or speak officer response (e.g. 'Submit registration form at library')..."
          className="flex-1 bg-slate-950/90 border border-white/10 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors placeholder:text-slate-600 font-sans"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-cyan-600/20 cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Translate</span>
        </button>
      </form>
    </div>
  );
}

export { TwoWayBridge };
