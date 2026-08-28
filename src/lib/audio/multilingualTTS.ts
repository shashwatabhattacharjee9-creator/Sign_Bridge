import { SupportedLanguage, MULTILINGUAL_DATA } from '../engine/multilingualScripts';

const PHONETIC_MAP: Record<string, string> = {
  // Hindi dictionary
  'नमस्ते,': 'Namaste',
  'नमस्ते': 'Namaste',
  'कृपया बताएं': 'kripya batayein',
  'विद्यार्थी रजिस्ट्रेशन': 'vidyarthi registration',
  'डेस्क कहाँ है?': 'desk kahan hai?',
  'माफ कीजियेगा,': 'Maaf kijiyega',
  'माफ कीजियेगा': 'Maaf kijiyega',
  'मुझे फीस रसीद': 'mujhe fees raseed',
  'सत्यापन में': 'satyapan mein',
  'मदद चाहिए।': 'madad chahiye',
  'शुभ प्रभात,': 'Shubh prabhat',
  'शुभ प्रभात': 'Shubh prabhat',
  'क्या आप मुझे': 'kya aap mujhe',
  'केंद्रीय पुस्तकालय का': 'central library ka',
  'रास्ता बताएंगे?': 'rasta batayenge?',
  'बहुत बहुत धन्यवाद,': 'Bahut bahut dhanyavaad',
  'बहुत बहुत धन्यवाद': 'Bahut bahut dhanyavaad',
  'मेरी सभी समस्याएं': 'meri sabhi samasyaayein',
  'पूरी तरह से': 'poori tarah se',
  'हल हो गईं।': 'hal ho gayi',
  'सुनो दोस्त,': 'Suno dost',
  'सुनो दोस्त': 'Suno dost',
  'क्या तुमने': 'kya tumne',
  'प्रोजेक्ट फॉर्म': 'project form',
  'जमा कर दिया?': 'jama kar diya?',
  'हाँ,': 'Haan',
  'हाँ': 'Haan',
  'चलो साथ में': 'chalo saath mein',
  'कंप्यूटर लैब': 'computer lab',
  'चलते हैं।': 'chalte hain',
  'हाँ भाई,': 'Haan bhai',
  'हाँ भाई': 'Haan bhai',
  'मैंने काउंटर पर': 'maine counter par',
  'जमा करवा दिया।': 'jama karwa diya',
  'क्या तुम फ्री हो?': 'kya tum free ho?',
  'बहुत बढ़िया,': 'Bahut badhiya',
  'बहुत बढ़िया': 'Bahut badhiya',
  'चलो अभी': 'chalo abhi',
  'निकलते हैं।': 'nikalte hain',

  // Tamil dictionary
  'வணக்கம்,': 'Vanakkam',
  'வணக்கம்': 'Vanakkam',
  'மாணவர் சேர்க்கை': 'maanavar serkkai',
  'உதவி மையம்': 'udavi maiyam',
  'எங்கே உள்ளது?': 'enge ulladhu?',
  'மன்னிக்கவும்,': 'Mannikkavum',
  'மன்னிக்கவும்': 'Mannikkavum',
  'எனக்கு கல்விக் கட்டண': 'enakku kalvi kattana',
  'ரசீது சரிபார்ப்பில்': 'raseedhu saripaarppil',
  'உதவி தேவை.': 'udavi thevai',
  'காலை வணக்கம்,': 'Kaalai vanakkam',
  'காலை வணக்கம்': 'Kaalai vanakkam',
  'மைய நூலகத்திற்கு': 'noolagathirku',
  'எவ்வாறு செல்வது': 'evvaaru selvathu',
  'என்று கூறுங்கள்?': 'endru koorungal?',
  'மிக்க நன்றி,': 'Mikka nandri',
  'மிக்க நன்றி': 'Mikka nandri',
  'எனது அனைத்து கேள்விகளுக்கும்': 'enakku theeruvu',
  'முழுமையான தீர்வு': 'mulumaiana theervu',
  'கிடைத்துவிட்டது.': 'kidaithuvittathu',
  'வணக்கம் நண்பா,': 'Vanakkam nanba',
  'வணக்கம் நண்பா': 'Vanakkam nanba',
  'திட்ட அறிக்கையை': 'project arikkaiyai',
  'கவுண்டரில்': 'counteril',
  'சமர்ப்பித்து விட்டாயா?': 'samarppithu vittaya?',
  'ஆம்,': 'Aam',
  'ஆம்': 'Aam',
  'வா நாம் ஆய்வகத்திற்கு': 'vaa naam aaivagathirku',
  'இப்போதே': 'ippothe',
  'செல்வோம்.': 'selvom',
  'ஆம் தோழா,': 'Aam thozha',
  'ஆம் தோழா': 'Aam thozha',
  'இரண்டாம் கவுண்டரில்': 'irandaam counteril',
  'கொடுத்துவிட்டேன்.': 'koduthuvittean',
  'நீ வருகிறாயா?': 'nee varugiraya?',
  'மகிழ்ச்சி,': 'Magizhchi',
  'மகிழ்ச்சி': 'Magizhchi',
  'வா உடனே': 'vaa udane',
  'போவோம்.': 'povom',
};

class MultilingualAudioEngine {
  private isSpeaking = false;
  private currentLanguage: SupportedLanguage = 'en';
  private voices: SpeechSynthesisVoice[] = [];
  private watchdogTimer: NodeJS.Timeout | null = null;

  constructor() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      this.loadVoices();
      window.speechSynthesis.onvoiceschanged = () => this.loadVoices();
    }
  }

  private loadVoices(): void {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    this.voices = window.speechSynthesis.getVoices();
  }

  public setLanguage(lang: SupportedLanguage): void {
    this.currentLanguage = lang;
    this.kill();
  }

  public getLanguage(): SupportedLanguage {
    return this.currentLanguage;
  }

  /**
   * Flexible speak function supporting both signatures:
   * 1. speak(text, lang)
   * 2. speak(text, phoneticFallback, lang, onDone)
   */
  public speak(
    text: string,
    arg2?: string | SupportedLanguage,
    arg3?: SupportedLanguage | (() => void),
    arg4?: () => void
  ): boolean {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      if (typeof arg3 === 'function') arg3();
      else if (typeof arg4 === 'function') arg4();
      return false;
    }

    // Resolve arguments polymorphism
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
    }

    // Force clear any stuck synthesizer queue (common Chrome/Edge bug)
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
    window.speechSynthesis.cancel();
    if (this.watchdogTimer) clearTimeout(this.watchdogTimer);

    this.isSpeaking = true;

    if (this.voices.length === 0) {
      this.loadVoices();
    }

    // Search for native voice matching language code or name
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

    // Determine speech text payload
    let speechPayload = text;
    if (matchedVoice) {
      // Native voice is present! Speak native Unicode directly
      speechPayload = text;
    } else {
      // Native voice absent: use phonetic transliteration
      if (phoneticFallback && phoneticFallback !== text) {
        speechPayload = phoneticFallback;
      } else if (PHONETIC_MAP[text.trim()]) {
        speechPayload = PHONETIC_MAP[text.trim()];
      } else if (targetLang !== 'en') {
        // Look up individual words in sentence if full phrase not in dictionary
        const words = text.split(' ');
        const translatedWords = words.map((w) => PHONETIC_MAP[w.trim()] || w);
        speechPayload = translatedWords.join(' ');
      }
    }

    const cleanText = speechPayload.replace(/[.,?!।]/g, '').trim();

    if (!cleanText) {
      this.isSpeaking = false;
      if (onDone) onDone();
      return false;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);

    if (matchedVoice) {
      utterance.voice = matchedVoice;
      utterance.lang = matchedVoice.lang || (targetLang === 'hi' ? 'hi-IN' : targetLang === 'ta' ? 'ta-IN' : 'en-IN');
    } else {
      // Fallback to default Indian English voice for phonetic pronunciation
      const inVoice =
        this.voices.find((v) => /IN/i.test(v.lang)) ||
        this.voices.find((v) => /^en/i.test(v.lang)) ||
        this.voices[0];
      if (inVoice) utterance.voice = inVoice;
      utterance.lang = 'en-IN';
    }

    utterance.rate = targetLang === 'en' ? 1.0 : 0.92;
    utterance.pitch = 1.0;

    const cleanup = () => {
      this.isSpeaking = false;
      if (this.watchdogTimer) clearTimeout(this.watchdogTimer);
      if (onDone) onDone();
    };

    utterance.onend = cleanup;
    utterance.onerror = (e) => {
      console.warn('TTS Warning (Handled):', e);
      cleanup();
    };

    // Watchdog: Force release speech lock after a generous threshold to prevent UI freezes
    this.watchdogTimer = setTimeout(cleanup, Math.max(1200, cleanText.length * 120));

    try {
      window.speechSynthesis.speak(utterance);
      return true;
    } catch (err) {
      console.error('Speech synthesis execution error:', err);
      cleanup();
      return false;
    }
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  public kill(): void {
    this.isSpeaking = false;
    if (this.watchdogTimer) clearTimeout(this.watchdogTimer);
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }
}

export const multilingualAudioEngine = new MultilingualAudioEngine();
export const multilingualSpeechEngine = multilingualAudioEngine;
export { MultilingualAudioEngine };
