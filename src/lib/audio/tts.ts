/**
 * FILE: OfflineTTSService & SpeechEngine
 * Native Client-Side Speech Synthesis with Single-Fire Latch & Deadlock Watchdog.
 * Zero external cloud reliance.
 */

export interface TTSOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  lang?: string;
  voiceURI?: string;
}

export class SpeechEngine {
  private isSpeaking = false;
  private hasSpokenCurrentSentence = false;
  private audioCtx: AudioContext | null = null;

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
   * Speaks the finalized conversational sentence strictly ONCE.
   */
  public speakNarrative(text: string, onComplete?: () => void): void {
    if (typeof window === 'undefined' || !window.speechSynthesis || !text || text.trim() === '') return;
    if (this.isSpeaking || this.hasSpokenCurrentSentence) return;

    this.isSpeaking = true;
    this.hasSpokenCurrentSentence = true;
    window.speechSynthesis.cancel(); // Stop any pending utterances

    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.lang = 'en-IN';

    // Auto-select Indian English or high-clarity voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice =
      voices.find((v) => v.lang.includes('en-IN')) ||
      voices.find((v) => v.lang.includes('en-GB')) ||
      voices.find((v) => v.name.includes('Natural')) ||
      voices[0];

    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onend = () => {
      this.isSpeaking = false;
      if (onComplete) onComplete();
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
    };

    window.speechSynthesis.speak(utterance);
  }

  /**
   * Direct speak method for manual buttons or practice arena.
   */
  public speak(text: string, rate: number = 1.0, pitch: number = 1.0, options?: TTSOptions): Promise<void> {
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
      const preferredVoice =
        (options?.voiceURI ? voices.find((v) => v.voiceURI === options.voiceURI) : null) ||
        voices.find((v) => v.lang.includes('en-IN')) ||
        voices.find((v) => v.lang.includes('en-GB')) ||
        voices[0];

      if (preferredVoice) utterance.voice = preferredVoice;

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

  /**
   * Resets the speech lock when hands drop to rest or reset.
   */
  public resetLock(): void {
    this.hasSpokenCurrentSentence = false;
    this.isSpeaking = false;
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  public stop(): void {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking = false;
  }

  /**
   * Plays a crisp high-frequency acoustic chime when a gesture token commits.
   */
  public playCommitTone(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880.0, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {
      // Audio context silenced
    }
  }

  /**
   * Plays a triumphant celebratory chord on mastery completion.
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

export const speechEngine = new SpeechEngine();
export const ttsService = speechEngine;
export const offlineTTS = speechEngine;
