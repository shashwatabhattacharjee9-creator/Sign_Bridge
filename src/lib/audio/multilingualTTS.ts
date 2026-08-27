/**
 * FILE: Multilingual Speech Synthesizer
 * Dedicated speech engine binding to native Web Speech API voices for English, Hindi, and Tamil.
 */

import { SupportedLanguage, MULTILINGUAL_REGISTRY } from '../engine/multilingualScripts';

class MultilingualSpeechEngine {
  private isSpeaking = false;
  private currentLanguage: SupportedLanguage = 'en';

  public setLanguage(lang: SupportedLanguage) {
    this.currentLanguage = lang;
    this.kill();
  }

  public getLanguage(): SupportedLanguage {
    return this.currentLanguage;
  }

  public speak(text: string, lang?: SupportedLanguage, onDone?: () => void): boolean {
    if (typeof window === 'undefined' || !window.speechSynthesis) return false;
    if (this.isSpeaking) return false;

    this.isSpeaking = true;
    window.speechSynthesis.cancel();

    const targetLang = lang || this.currentLanguage;
    const config = MULTILINGUAL_REGISTRY[targetLang] || MULTILINGUAL_REGISTRY.en;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = config.ttsLocale;
    utterance.rate = targetLang === 'en' ? 1.0 : 0.95; // Slightly measured pace for regional scripts
    utterance.pitch = 1.0;

    // Pick best matching system voice
    const voices = window.speechSynthesis.getVoices();
    const matchedVoice =
      voices.find(
        (v) =>
          v.lang.startsWith(targetLang) ||
          v.lang.replace('_', '-').toLowerCase().includes(config.ttsLocale.toLowerCase())
      ) ||
      voices.find((v) => v.lang.includes('IN')) ||
      voices[0];

    if (matchedVoice) utterance.voice = matchedVoice;

    utterance.onend = () => {
      this.isSpeaking = false;
      if (onDone) onDone();
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
    };

    window.speechSynthesis.speak(utterance);
    return true;
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  public kill(): void {
    this.isSpeaking = false;
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }
}

export const multilingualSpeechEngine = new MultilingualSpeechEngine();
