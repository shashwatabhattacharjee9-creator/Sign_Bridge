/**
 * FILE 1: OfflineTTSService
 * 100% Client-Side Native Web Speech Synthesis Engine with Deadlock Watchdog.
 * Zero external cloud reliance.
 */

export interface TTSOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  lang?: string;
  voiceURI?: string;
}

export class OfflineTTSService {
  private synth: SpeechSynthesis | null = null;
  private audioCtx: AudioContext | null = null;
  private cachedVoice: SpeechSynthesisVoice | null = null;
  private watchdogTimer: any = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.initVoices();
      if (this.synth) {
        this.synth.onvoiceschanged = () => this.initVoices();
      }
    }
  }

  private initVoices(): void {
    if (!this.synth) return;
    const voices = this.synth.getVoices();
    this.cachedVoice =
      voices.find((v) => v.lang === 'en-IN') ||
      voices.find((v) => v.lang.startsWith('en')) ||
      voices[0] ||
      null;
  }

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

  public getVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    return this.synth.getVoices();
  }

  /**
   * Speaks the provided text using local offline speech synthesis.
   * Includes an internal watchdog timer that prevents Chromium's native speech synthesis deadlocks.
   */
  public speak(text: string, rate: number = 1.0, pitch: number = 1.0, options?: TTSOptions): Promise<void> {
    return new Promise((resolve) => {
      if (!this.synth || !text || text.trim() === '') {
        resolve();
        return;
      }

      const isEmergency = /HELP|EMERGENCY|MEDICINE|HOSPITAL|DANGER|POLICE|AMBULANCE/i.test(text);

      if (isEmergency || this.synth.speaking) {
        this.synth.cancel();
      }

      // Chrome SpeechSynthesis deadlock prevention
      if (this.synth.paused) {
        this.synth.resume();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate ?? options?.rate ?? 1.0;
      utterance.pitch = pitch ?? options?.pitch ?? 1.0;
      utterance.volume = options?.volume ?? 1.0;
      utterance.lang = options?.lang || 'en-IN';

      if (options?.voiceURI) {
        const voices = this.getVoices();
        const chosen = voices.find((v) => v.voiceURI === options.voiceURI);
        if (chosen) utterance.voice = chosen;
      } else if (this.cachedVoice) {
        utterance.voice = this.cachedVoice;
      }

      // Start Watchdog to prevent long utterance lockup in browser
      if (this.watchdogTimer) clearInterval(this.watchdogTimer);
      this.watchdogTimer = setInterval(() => {
        if (!this.synth || !this.synth.speaking) {
          clearInterval(this.watchdogTimer);
        } else {
          this.synth.pause();
          this.synth.resume();
        }
      }, 3000);

      utterance.onend = () => {
        if (this.watchdogTimer) clearInterval(this.watchdogTimer);
        resolve();
      };

      utterance.onerror = () => {
        if (this.watchdogTimer) clearInterval(this.watchdogTimer);
        resolve();
      };

      this.synth.speak(utterance);
    });
  }

  /**
   * Immediately halts any ongoing speech synthesis.
   */
  public stop(): void {
    if (this.synth) {
      this.synth.cancel();
    }
    if (this.watchdogTimer) {
      clearInterval(this.watchdogTimer);
    }
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

export const ttsService = new OfflineTTSService();
export const offlineTTS = ttsService;
