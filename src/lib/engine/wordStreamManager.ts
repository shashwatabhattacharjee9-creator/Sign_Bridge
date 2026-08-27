/**
 * FILE: DynamicStreamManager & Word Stream Controller
 * Non-repeating contextual sentence streamer and direct ISL token transcript manager.
 */

import { CONTEXTUAL_INTERACTION_BANKS, ContextualSentence } from './pitchScript';

export class DynamicStreamManager {
  private usedBankIndices: Set<number> = new Set();
  private currentSentence: string[] = [];
  private currentWordIndex = 0;
  private transcriptHistory: string[] = [''];

  /**
   * Loads a new randomized sentence from the bank without immediate repeats
   */
  private loadNextSentence(): void {
    if (this.usedBankIndices.size >= CONTEXTUAL_INTERACTION_BANKS.length) {
      this.usedBankIndices.clear(); // Reset pool once all sentences have been played
    }

    const availableIndices = CONTEXTUAL_INTERACTION_BANKS
      .map((_, idx) => idx)
      .filter((idx) => !this.usedBankIndices.has(idx));

    const selectedIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    this.usedBankIndices.add(selectedIndex);

    this.currentSentence = CONTEXTUAL_INTERACTION_BANKS[selectedIndex].tokens;
    this.currentWordIndex = 0;

    // Start a new transcript row if current one already has tokens
    const lastRow = this.transcriptHistory[this.transcriptHistory.length - 1];
    if (lastRow && lastRow.trim().length > 0) {
      this.transcriptHistory.push('');
    }
  }

  /**
   * Advances and returns the next word in the active sentence pool
   */
  public getNextToken(): string {
    if (this.currentSentence.length === 0 || this.currentWordIndex >= this.currentSentence.length) {
      this.loadNextSentence();
    }

    const word = this.currentSentence[this.currentWordIndex];
    this.currentWordIndex++;

    const lastRowIndex = this.transcriptHistory.length - 1;
    this.transcriptHistory[lastRowIndex] = (this.transcriptHistory[lastRowIndex] + ' ' + word).trim();

    return word;
  }

  /**
   * Appends an atomic genuine ISL sign detected by geometric classifier directly
   */
  public appendDirectSign(signText: string): void {
    const lastRowIndex = this.transcriptHistory.length - 1;
    this.transcriptHistory[lastRowIndex] = (this.transcriptHistory[lastRowIndex] + ' ' + signText).trim();
  }

  /**
   * Previews the next upcoming word
   */
  public peekNextToken(): string {
    if (this.currentSentence.length === 0 || this.currentWordIndex >= this.currentSentence.length) {
      return 'Ready';
    }
    return this.currentSentence[this.currentWordIndex] || 'Ready';
  }

  public peekNextWord(): string {
    return this.peekNextToken();
  }

  public getTranscript(): string[] {
    return this.transcriptHistory;
  }

  public reset(): void {
    this.usedBankIndices.clear();
    this.currentSentence = [];
    this.currentWordIndex = 0;
    this.transcriptHistory = [''];
  }

  public resetToStart(): void {
    this.reset();
  }

  public resetStudio(): void {
    this.reset();
  }

  public resetToBeginning(): void {
    this.reset();
  }
}

export const dynamicStreamManager = new DynamicStreamManager();
export const wordStreamManager = dynamicStreamManager;
