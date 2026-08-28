'use client';

import { SupportedLanguage, MULTILINGUAL_DATA } from '../engine/multilingualScripts';

// Complete dictionary of phonetic pronunciations and translations
const PHONETIC_MAP: Record<string, string> = {
  // Hindi Scenarios & Tokens
  'नमस्ते,': 'Namaste',
  'नमस्ते': 'Namaste',
  'कृपया बताएं': 'Kripya batayein',
  'विद्यार्थी रजिस्ट्रेशन': 'Vidyarthi registration',
  'डेस्क कहाँ है?': 'Desk kahan hai',
  'माफ कीजियेगा,': 'Maaf kijiyega',
  'माफ कीजियेगा': 'Maaf kijiyega',
  'मुझे फीस रसीद': 'Mujhe fees raseed',
  'सत्यापन में': 'Satyapan mein',
  'मदद चाहिए।': 'Madad chahiye',
  'मदद चाहिए': 'Madad chahiye',
  'शुभ प्रभात,': 'Shubh prabhat',
  'शुभ प्रभात': 'Shubh prabhat',
  'क्या आप मुझे': 'Kya aap mujhe',
  'केंद्रीय पुस्तकालय का': 'Central library ka',
  'केंद्रीय पुस्तकालय': 'Central library',
  'रास्ता बताएंगे?': 'Rasta batayenge',
  'बहुत बहुत धन्यवाद,': 'Bahut bahut dhanyavaad',
  'बहुत बहुत धन्यवाद': 'Bahut bahut dhanyavaad',
  'मेरी सभी समस्याएं': 'Meri sabhi samasyaayein',
  'पूरी तरह से': 'Poori tarah se',
  'हल हो गईं।': 'Hal ho gayi',
  'हल हो गईं': 'Hal ho gayi',
  'सुनो दोस्त,': 'Suno dost',
  'सुनो दोस्त': 'Suno dost',
  'क्या तुमने': 'Kya tumne',
  'प्रोजेक्ट फॉर्म': 'Project form',
  'जमा कर दिया?': 'Jama kar diya',
  'हाँ,': 'Haan',
  'हाँ': 'Haan',
  'चलो साथ में': 'Chalo saath mein',
  'कंप्यूटर लैब': 'Computer lab',
  'चलते हैं।': 'Chalte hain',
  'चलते हैं': 'Chalte hain',
  'हाँ भाई,': 'Haan bhai',
  'हाँ भाई': 'Haan bhai',
  'मैंने काउंटर पर': 'Maine counter par',
  'जमा करवा दिया।': 'Jama karwa diya',
  'क्या तुम फ्री हो?': 'Kya tum free ho',
  'बहुत बढ़िया,': 'Bahut badhiya',
  'बहुत बढ़िया': 'Bahut badhiya',
  'चलो अभी': 'Chalo abhi',
  'निकलते हैं।': 'Nikalte hain',

  // Tamil Scenarios & Tokens
  'வணக்கம்,': 'Vanakkam',
  'வணக்கம்': 'Vanakkam',
  'மாணவர் சேர்க்கை': 'Maanavar serkkai',
  'உதவி மையம்': 'Udavi maiyam',
  'எங்கே உள்ளது?': 'Enge ulladhu',
  'மன்னிக்கவும்,': 'Mannikkavum',
  'மன்னிக்கவும்': 'Mannikkavum',
  'எனக்கு கல்விக் கட்டண': 'Enakku kalvi kattana',
  'ரசீது சரிபார்ப்பில்': 'Raseedhu saripaarppil',
  'உதவி தேவை.': 'Udavi thevai',
  'உதவி தேவை': 'Udavi thevai',
  'காலை வணக்கம்,': 'Kaalai vanakkam',
  'காலை வணக்கம்': 'Kaalai vanakkam',
  'மைய நூலகத்திற்கு': 'Noolagathirku',
  'எவ்வாறு செல்வது': 'Evvaaru selvathu',
  'என்று கூறுங்கள்?': 'Endru koorungal',
  'மிக்க நன்றி,': 'Mikka nandri',
  'மிக்க நன்றி': 'Mikka nandri',
  'எனது அனைத்து கேள்விகளுக்கும்': 'Enakku theeruvu',
  'முழுமையான தீர்வு': 'Mulumaiana theervu',
  'கிடைத்துவிட்டது.': 'Kidaithuvittathu',
  'வணக்கம் நண்பா,': 'Vanakkam nanba',
  'வணக்கம் நண்பா': 'Vanakkam nanba',
  'திட்ட அறிக்கையை': 'Project arikkaiyai',
  'கவுண்டரில்': 'Counteril',
  'சமர்ப்பித்து விட்டாயா?': 'Samarppithu vittaya',
  'ஆம்,': 'Aam',
  'ஆம்': 'Aam',
  'வா நாம் ஆய்வகத்திற்கு': 'Vaa naam aaivagathirku',
  'இப்போதே': 'Ippothe',
  'செல்வோம்.': 'Selvom',
  'ஆம் தோழா,': 'Aam thozha',
  'ஆம் தோழா': 'Aam thozha',
  'இரண்டாம் கவுண்டரில்': 'Irandaam counteril',
  'கொடுத்துவிட்டேன்.': 'Koduthuvittean',
  'நீ வருகிறாயா?': 'Nee varugiraya',
  'மகிழ்ச்சி,': 'Magizhchi',
  'மகிழ்ச்சி': 'Magizhchi',
  'வா உடனே': 'Vaa udane',
  'போவோம்.': 'Povom',

  // English Scenarios & Tokens
  'Hello,': 'Hello',
  'where is': 'where is',
  'the registration desk': 'the registration desk',
  'counter located?': 'counter located',
  'Excuse me,': 'Excuse me',
  'I need assistance': 'I need assistance',
  'with semester fee': 'with semester fee',
  'receipt clearance.': 'receipt clearance',
  'Good morning,': 'Good morning',
  'can you guide me': 'can you guide me',
  'to the reference books': 'to the reference books',
  'archive section?': 'archive section',
  'Thank you,': 'Thank you',
  'that resolved': 'that resolved',
  'my inquiry': 'my inquiry',
  'completely today.': 'completely today',
};

class MultilingualAudioEngine {
  private isSpeaking = false;
  private currentLanguage: SupportedLanguage = 'en';
  private voices: SpeechSynthesisVoice[] = [];
  private activeUtterance: SpeechSynthesisUtterance | null = null;
  private watchdogTimer: NodeJS.Timeout | null = null;
  private audioCtx: AudioContext | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initVoices();
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = () => this.initVoices();
      }

      // Unlock browser audio context on any user interaction
      const unlock = () => {
        this.getAudioContext();
        window.removeEventListener('click', unlock);
        window.removeEventListener('keydown', unlock);
        window.removeEventListener('touchstart', unlock);
      };
      window.addEventListener('click', unlock, { once: true });
      window.addEventListener('keydown', unlock, { once: true });
      window.addEventListener('touchstart', unlock, { once: true });
    }
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      if (!this.audioCtx) {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtxClass) {
          this.audioCtx = new AudioCtxClass();
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
    } catch {
      // AudioContext unavailable
    }
    return this.audioCtx;
  }

  private initVoices(): void {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
      this.voices = window.speechSynthesis.getVoices() || [];
    } catch {
      this.voices = [];
    }
  }

  public setLanguage(lang: SupportedLanguage): void {
    this.currentLanguage = lang;
    this.kill();
  }

  public getLanguage(): SupportedLanguage {
    return this.currentLanguage;
  }

  /**
   * Play high-resonance audio feedback tone (always works in all browsers)
   */
  public playFeedbackTone(frequency = 580, durationMs = 90): void {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(frequency * 1.35, ctx.currentTime + durationMs / 1000);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + durationMs / 1000);
    } catch {
      // Audio feedback failed silently
    }
  }

  /**
   * Universal, resilient speak function with zero blocking
   */
  public speak(
    text: string,
    arg2?: string | SupportedLanguage,
    arg3?: SupportedLanguage | (() => void),
    arg4?: () => void
  ): boolean {
    // Play instant tone feedback so user always gets immediate confirmation
    this.playFeedbackTone(620, 110);

    if (typeof window === 'undefined' || !window.speechSynthesis) {
      if (typeof arg3 === 'function') arg3();
      else if (typeof arg4 === 'function') arg4();
      return false;
    }

    // Resolve polymorphic arguments
    let phoneticFallback: string | undefined;
    let targetLang: SupportedLanguage = this.currentLanguage;
    let onDone: (() => void) | undefined;

    if (arg2 === 'en' || arg2 === 'hi' || arg2 === 'ta') {
      targetLang = arg2;
      if (typeof arg3 === 'function') onDone = arg3;
    } else if (typeof arg2 === 'string') {
      phoneticFallback = arg2;
      if (arg3 === 'en' || arg3 === 'hi' || arg3 === 'ta') {
        targetLang = arg3;
      }
      if (typeof arg4 === 'function') onDone = arg4;
    } else if (typeof arg2 === 'function') {
      onDone = arg2;
    }

    // Always keep voices list populated
    if (this.voices.length === 0) {
      this.initVoices();
    }

    // Search for native voice matching target language
    let matchedVoice: SpeechSynthesisVoice | undefined;
    if (targetLang === 'hi') {
      matchedVoice = this.voices.find(
        (v) =>
          /hi[-_]IN|hindi|^hi$/i.test(v.lang) ||
          /hindi|swara|madhur|kalpana|hemant|ananya/i.test(v.name)
      );
    } else if (targetLang === 'ta') {
      matchedVoice = this.voices.find(
        (v) =>
          /ta[-_]IN|tamil|^ta$/i.test(v.lang) ||
          /tamil|valluvar|iniya|kavya/i.test(v.name)
      );
    } else {
      matchedVoice =
        this.voices.find(
          (v) =>
            /en[-_]IN|indian/i.test(v.lang) ||
            /india|neerja|prabhat|ravi|heera/i.test(v.name)
        ) ||
        this.voices.find((v) => /^en/i.test(v.lang)) ||
        this.voices[0];
    }

    // Determine the speech text payload
    let speechPayload = text;
    if (matchedVoice) {
      // Native regional voice is available: use native script
      speechPayload = text;
    } else {
      // Native voice missing: lookup romanized phonetic pronunciation
      if (phoneticFallback && phoneticFallback !== text) {
        speechPayload = phoneticFallback;
      } else if (PHONETIC_MAP[text.trim()]) {
        speechPayload = PHONETIC_MAP[text.trim()];
      } else if (targetLang !== 'en') {
        const words = text.split(' ');
        const translatedWords = words.map((w) => PHONETIC_MAP[w.trim()] || w);
        speechPayload = translatedWords.join(' ');
      }
    }

    // Clean punctuation
    const cleanText = speechPayload.replace(/[.,?!।]/g, '').trim();
    if (!cleanText) {
      if (onDone) onDone();
      return false;
    }

    // Force clear previous utterance & resume synthesizer
    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      window.speechSynthesis.cancel();
    } catch {
      // Handled
    }

    if (this.watchdogTimer) {
      clearTimeout(this.watchdogTimer);
      this.watchdogTimer = null;
    }

    this.isSpeaking = true;

    try {
      const utterance = new SpeechSynthesisUtterance(cleanText);
      // Retain instance reference on window to prevent Chrome V8 garbage-collection bug
      (window as any).__signbridge_utterance = utterance;
      this.activeUtterance = utterance;

      if (matchedVoice) {
        utterance.voice = matchedVoice;
        utterance.lang = matchedVoice.lang || (targetLang === 'hi' ? 'hi-IN' : targetLang === 'ta' ? 'ta-IN' : 'en-IN');
      } else {
        const defaultVoice =
          this.voices.find((v) => /IN/i.test(v.lang)) ||
          this.voices.find((v) => /^en/i.test(v.lang)) ||
          this.voices[0];
        if (defaultVoice) utterance.voice = defaultVoice;
        utterance.lang = 'en-IN';
      }

      utterance.rate = targetLang === 'en' ? 1.0 : 0.92;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      const cleanup = () => {
        this.isSpeaking = false;
        this.activeUtterance = null;
        if ((window as any).__signbridge_utterance === utterance) {
          (window as any).__signbridge_utterance = null;
        }
        if (this.watchdogTimer) {
          clearTimeout(this.watchdogTimer);
          this.watchdogTimer = null;
        }
        if (onDone) onDone();
      };

      utterance.onend = cleanup;
      utterance.onerror = (e) => {
        console.warn('TTS Warning (Handled):', e);
        cleanup();
      };

      // Watchdog: automatically free speech state after 1.5s max to prevent any UI freezes
      this.watchdogTimer = setTimeout(cleanup, Math.min(2200, Math.max(900, cleanText.length * 100)));

      window.speechSynthesis.speak(utterance);
      return true;
    } catch (err) {
      console.warn('Speech synthesis invocation failed:', err);
      this.isSpeaking = false;
      if (onDone) onDone();
      return false;
    }
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  public kill(): void {
    this.isSpeaking = false;
    this.activeUtterance = null;
    if (this.watchdogTimer) {
      clearTimeout(this.watchdogTimer);
      this.watchdogTimer = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Handled
      }
    }
  }
}

export const multilingualAudioEngine = new MultilingualAudioEngine();
export const multilingualSpeechEngine = multilingualAudioEngine;
export { MultilingualAudioEngine };
