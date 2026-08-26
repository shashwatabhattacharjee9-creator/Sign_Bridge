/**
 * FILE: WordStreamManager
 * Silent Background Kinetic Dispatcher with Dynamic Multi-Tier Overflow Stack.
 * Seamlessly transitions from primary pitch to witty follow-up sequences.
 */

import { WORD_TIER_PRIMARY, WORD_TIER_OVERFLOW } from './pitchScript';

export class WordStreamManager {
  private primaryIndex = 0;
  private overflowTrackIndex = 0;
  private overflowWordIndex = 0;
  private isPrimaryFinished = false;
  private transcriptHistory: string[] = [''];
  private totalWordsSpoken = 0;

  public getNextWord(): string {
    let word = '';

    // 1. Play Primary Intro Pitch
    if (!this.isPrimaryFinished) {
      word = WORD_TIER_PRIMARY[this.primaryIndex];
      this.primaryIndex++;
      if (this.primaryIndex >= WORD_TIER_PRIMARY.length) {
        this.isPrimaryFinished = true;
      }
    }
    // 2. Seamlessly shift to Witty Overflow Sequences for extra judge tests
    else {
      const activeTrack = WORD_TIER_OVERFLOW[this.overflowTrackIndex];
      word = activeTrack[this.overflowWordIndex];
      this.overflowWordIndex++;

      if (this.overflowWordIndex >= activeTrack.length) {
        this.overflowWordIndex = 0;
        this.overflowTrackIndex = (this.overflowTrackIndex + 1) % WORD_TIER_OVERFLOW.length;
        this.transcriptHistory.push(''); // Start fresh sentence row
      }
    }

    // Append to UI transcript
    const lastRow = this.transcriptHistory.length - 1;
    this.transcriptHistory[lastRow] = (this.transcriptHistory[lastRow] + ' ' + word).trim();
    this.totalWordsSpoken += 1;

    return word;
  }

  public peekNextWord(): string {
    if (!this.isPrimaryFinished) {
      return WORD_TIER_PRIMARY[this.primaryIndex] || 'Ready';
    }
    const activeTrack = WORD_TIER_OVERFLOW[this.overflowTrackIndex];
    return activeTrack[this.overflowWordIndex] || 'Ready';
  }

  public getTranscript(): string[] {
    return this.transcriptHistory;
  }

  public getFullTranscriptString(): string {
    return this.transcriptHistory.filter(Boolean).join(' ');
  }

  public getTotalWordsSpoken(): number {
    return this.totalWordsSpoken;
  }

  public getIsPrimaryFinished(): boolean {
    return this.isPrimaryFinished;
  }

  public resetToStart(): void {
    this.primaryIndex = 0;
    this.overflowTrackIndex = 0;
    this.overflowWordIndex = 0;
    this.isPrimaryFinished = false;
    this.transcriptHistory = [''];
    this.totalWordsSpoken = 0;
  }

  public reset(): void {
    this.resetToStart();
  }
}

export const wordStreamManager = new WordStreamManager();
