import { SupportedLanguage, MULTILINGUAL_DATA } from '../engine/multilingualScripts';

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

  public speak(
    text: string,
    phoneticFallback?: string,
    lang?: SupportedLanguage,
    onDone?: () => void
  ): boolean {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      if (onDone) onDone();
      return false;
    }

    // Force clear any stuck synthesizer queue (common Chrome bug)
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
    window.speechSynthesis.cancel();
    if (this.watchdogTimer) clearTimeout(this.watchdogTimer);

    this.isSpeaking = true;
    const targetLang = lang || this.currentLanguage;

    if (this.voices.length === 0) {
      this.loadVoices();
    }

    // Search for native voice matching language code or name
    let matchedVoice: SpeechSynthesisVoice | undefined;
    if (targetLang === 'hi') {
      matchedVoice = this.voices.find(
        (v) => /hi[-_]IN|hindi|hi/i.test(v.lang) || /hindi/i.test(v.name)
      );
    } else if (targetLang === 'ta') {
      matchedVoice = this.voices.find(
        (v) => /ta[-_]IN|tamil|ta/i.test(v.lang) || /tamil/i.test(v.name)
      );
    } else {
      matchedVoice = this.voices.find(
        (v) => /en[-_]IN|indian/i.test(v.lang) || /india/i.test(v.name)
      );
    }

    // Determine speech payload: use phonetic transliteration if native voice is missing on the OS
    const speechText = matchedVoice ? text : phoneticFallback || text;
    const cleanText = speechText.replace(/[.,?!।]/g, '').trim();

    if (!cleanText) {
      this.isSpeaking = false;
      if (onDone) onDone();
      return false;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);

    if (matchedVoice) {
      utterance.voice = matchedVoice;
      utterance.lang = matchedVoice.lang;
    } else {
      // Fallback to default Indian English voice for phonetic pronunciation
      const inVoice = this.voices.find((v) => /IN/i.test(v.lang)) || this.voices[0];
      if (inVoice) utterance.voice = inVoice;
      utterance.lang = 'en-IN';
    }

    utterance.rate = targetLang === 'en' ? 1.0 : 0.9;
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
