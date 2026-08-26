/**
 * FILE: AudioLatchEngine & Speech Services
 * Strict Non-Overlapping Audio Latch with Native Web Speech API & Deadlock Watchdog.
 * Zero external cloud reliance.
 */

export interface TTSOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  lang?: string;
  voiceURI?: string;
}

export class AudioLatchEngine {
  private isSpeaking = false;
  private audioCtx: AudioContext | null = null;
  private watchdogTimer: any = null;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtxClass =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * Speaks a single word instantly and enforces strict isSpeaking lock
   */
  public speak(word: string, onFinish?: () => void): boolean {
    if (typeof window === 'undefined' || !window.speechSynthesis || !word || word.trim() === '') return false;
    if (this.isSpeaking) return false; // Hard lock against overlapping speech

    this.isSpeaking = true;
    window.speechSynthesis.cancel();
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    // Clean punctuation from speech string for natural vocalization
    const cleanWord = word.replace(/[,.]/g, '').trim();
    const utterance = new SpeechSynthesisUtterance(cleanWord || word);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.lang = 'en-IN';

    const voices = window.speechSynthesis.getVoices();
    const voice =
      voices.find((v) => v.lang.includes('en-IN')) ||
      voices.find((v) => v.lang.includes('en-GB')) ||
      voices.find((v) => v.name.includes('Natural')) ||
      voices.find((v) => v.localService) ||
      voices[0];

    if (voice) utterance.voice = voice;

    // Safety watchdog timer (in case onend does not fire in browser)
    if (this.watchdogTimer) clearTimeout(this.watchdogTimer);
    const estimatedDurationMs = Math.max(650, cleanWord.length * 150 + 300);
    this.watchdogTimer = setTimeout(() => {
      if (this.isSpeaking) {
        this.isSpeaking = false;
        if (onFinish) onFinish();
      }
    }, estimatedDurationMs + 600);

    utterance.onend = () => {
      if (this.watchdogTimer) clearTimeout(this.watchdogTimer);
      this.isSpeaking = false;
      if (onFinish) onFinish();
    };

    utterance.onerror = () => {
      if (this.watchdogTimer) clearTimeout(this.watchdogTimer);
      this.isSpeaking = false;
    };

    window.speechSynthesis.speak(utterance);
    return true;
  }

  public speakWord(word: string, onDone?: () => void): boolean {
    return this.speak(word, onDone);
  }

  /**
   * Speaks full multi-word string for whole-script playback
   */
  public speakFull(text: string, rate: number = 1.0, pitch: number = 1.0, options?: TTSOptions): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !window.speechSynthesis || !text || text.trim() === '') {
        resolve();
        return;
      }

      window.speechSynthesis.cancel();
      if (window.speechSynthesis.paused) window.speechSynthesis.resume();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate ?? options?.rate ?? 1.0;
      utterance.pitch = pitch ?? options?.pitch ?? 1.0;
      utterance.volume = options?.volume ?? 1.0;
      utterance.lang = options?.lang || 'en-IN';

      const voices = window.speechSynthesis.getVoices();
      const voice =
        (options?.voiceURI ? voices.find((v) => v.voiceURI === options.voiceURI) : null) ||
        voices.find((v) => v.lang.includes('en-IN')) ||
        voices.find((v) => v.lang.includes('en-GB')) ||
        voices[0];

      if (voice) utterance.voice = voice;

      utterance.onend = () => {
        this.isSpeaking = false;
        resolve();
      };
      utterance.onerror = () => {
        this.isSpeaking = false;
        resolve();
      };

      this.isSpeaking = true;
      window.speechSynthesis.speak(utterance);
    });
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  public forceReset(): void {
    this.isSpeaking = false;
    if (this.watchdogTimer) clearTimeout(this.watchdogTimer);
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }

  public reset(): void {
    this.forceReset();
  }

  public stop(): void {
    this.forceReset();
  }

  /**
   * Acoustic chime on token commit
   */
  public playCommitTone(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(620.0, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(940.0, ctx.currentTime + 0.07);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {
      // Audio context silenced
    }
  }

  /**
   * Celebratory chord on stage complete or full demo completion
   */
  public playSuccessChord(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.05);

        gain.gain.setValueAtTime(0.1, ctx.currentTime + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.05 + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + idx * 0.05);
        osc.stop(ctx.currentTime + idx * 0.05 + 0.3);
      });
    } catch {
      // Audio context silenced
    }
  }
}

export const audioLatchEngine = new AudioLatchEngine();
export const wordSpeechController = audioLatchEngine;
export const speechEngine = audioLatchEngine;
export const offlineTTS = audioLatchEngine;
export const ttsService = audioLatchEngine;
