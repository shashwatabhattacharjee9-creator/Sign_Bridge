/**
 * FILE: DualPeerEngineManager
 * Autonomous turn-taking controller for split-screen peer-to-peer sign dialogue.
 */

import { SupportedLanguage, MULTILINGUAL_DATA, ScriptWord } from './multilingualScripts';
import { multilingualAudioEngine } from '../audio/multilingualTTS';

export type ActiveSigner = 'A' | 'B';

export interface PeerMessage {
  id: string;
  sender: 'Signer A (Peer 1)' | 'Signer B (Peer 2)';
  text: string;
  timestamp: string;
  lang: SupportedLanguage;
}

class DualPeerEngineManager {
  private activeSigner: ActiveSigner = 'A';
  private currentLanguage: SupportedLanguage = 'en';
  private roundIndex = 0;
  private wordIndex = 0;
  private currentTokens: string[] = [];
  private conversationHistory: PeerMessage[] = [];
  private lastTriggerTime = 0;

  public setLanguage(lang: SupportedLanguage) {
    this.currentLanguage = lang;
    this.reset();
  }

  public getLanguage(): SupportedLanguage {
    return this.currentLanguage;
  }

  public getActiveSigner(): ActiveSigner {
    return this.activeSigner;
  }

  public getLiveTokens(): string[] {
    return this.currentTokens;
  }

  public getHistory(): PeerMessage[] {
    return this.conversationHistory;
  }

  public handleGestureTrigger(): {
    word: string;
    isTurnComplete: boolean;
    activeSigner: ActiveSigner;
    fullSentence?: string;
  } | null {
    const now = Date.now();
    // Forgiving 650ms debounce
    if (now - this.lastTriggerTime < 650 || multilingualAudioEngine.getIsSpeaking()) {
      return null;
    }
    this.lastTriggerTime = now;

    const langConfig = MULTILINGUAL_DATA[this.currentLanguage] || MULTILINGUAL_DATA.en;
    const peerFlows = langConfig.peerDialogue;
    const activeStream: ScriptWord[][] =
      this.activeSigner === 'A' ? peerFlows.signerA : peerFlows.signerB;

    const currentSentenceWords = activeStream[this.roundIndex % activeStream.length];
    if (!currentSentenceWords || currentSentenceWords.length === 0) return null;

    const item = currentSentenceWords[this.wordIndex];
    if (!item) return null;

    this.currentTokens.push(item.token);
    multilingualAudioEngine.speak(item.speechText, this.currentLanguage);

    this.wordIndex++;

    // Check if current signer finished their sentence
    if (this.wordIndex >= currentSentenceWords.length) {
      const fullSentence = this.currentTokens.join(' ');

      this.conversationHistory.push({
        id: Math.random().toString(36).substring(2, 9),
        sender: this.activeSigner === 'A' ? 'Signer A (Peer 1)' : 'Signer B (Peer 2)',
        text: fullSentence,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        lang: this.currentLanguage,
      });

      // Switch turn to the other peer!
      const previousSigner = this.activeSigner;
      this.activeSigner = previousSigner === 'A' ? 'B' : 'A';
      this.wordIndex = 0;
      this.currentTokens = [];

      if (previousSigner === 'B') {
        this.roundIndex++; // Complete dialogue round finished
      }

      return {
        word: item.token,
        isTurnComplete: true,
        activeSigner: previousSigner,
        fullSentence,
      };
    }

    return {
      word: item.token,
      isTurnComplete: false,
      activeSigner: this.activeSigner,
    };
  }

  public reset(): void {
    this.activeSigner = 'A';
    this.roundIndex = 0;
    this.wordIndex = 0;
    this.currentTokens = [];
    this.conversationHistory = [];
    multilingualAudioEngine.kill();
  }
}

export const dualPeerEngineManager = new DualPeerEngineManager();
