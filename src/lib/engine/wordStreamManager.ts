/**
 * FILE: WordStreamManager
 * Single-Pass Sequential Multi-Stage Stream Controller.
 * Progresses through the 4 stages word-by-word and locks upon completion without looping.
 */

import { PRESENTATION_SCRIPT, ScriptStage, TOTAL_SCRIPT_WORDS } from './pitchScript';

export interface NextWordResult {
  word: string;
  isStageEnd: boolean;
  isFinalWord: boolean;
  stageIndex: number;
  wordIndex: number;
  stage: ScriptStage;
}

export class WordStreamManager {
  private currentStageIndex = 0;
  private currentWordIndex = 0;
  private displayedSentences: string[] = [''];
  private isSessionComplete = false;
  private spokenWordsTotal = 0;

  public getActiveStage(): ScriptStage | null {
    if (this.currentStageIndex >= PRESENTATION_SCRIPT.length) return null;
    return PRESENTATION_SCRIPT[this.currentStageIndex];
  }

  public peekNextWord(): string | null {
    if (this.isSessionComplete) return null;
    const stage = PRESENTATION_SCRIPT[this.currentStageIndex];
    if (!stage) return null;
    return stage.words[this.currentWordIndex] || null;
  }

  public getNextWord(): NextWordResult | null {
    if (this.isSessionComplete) return null;

    const stage = PRESENTATION_SCRIPT[this.currentStageIndex];
    if (!stage) {
      this.isSessionComplete = true;
      return null;
    }

    const word = stage.words[this.currentWordIndex];
    const isStageEnd = this.currentWordIndex === stage.words.length - 1;
    const isFinalWord = isStageEnd && this.currentStageIndex === PRESENTATION_SCRIPT.length - 1;

    const result: NextWordResult = {
      word,
      isStageEnd,
      isFinalWord,
      stageIndex: this.currentStageIndex,
      wordIndex: this.currentWordIndex,
      stage,
    };

    // Append to current sentence buffer
    const lastIdx = this.displayedSentences.length - 1;
    this.displayedSentences[lastIdx] = (this.displayedSentences[lastIdx] + ' ' + word).trim();
    this.spokenWordsTotal += 1;

    // Advance indices
    if (isStageEnd) {
      if (isFinalWord) {
        this.isSessionComplete = true; // Lock system, do not loop
      } else {
        this.currentStageIndex += 1;
        this.currentWordIndex = 0;
        this.displayedSentences.push(''); // New line for next stage
      }
    } else {
      this.currentWordIndex += 1;
    }

    return result;
  }

  public getTranscript(): string[] {
    return this.displayedSentences;
  }

  public getIsComplete(): boolean {
    return this.isSessionComplete;
  }

  public getStageIndex(): number {
    return this.currentStageIndex;
  }

  public getWordIndex(): number {
    return this.currentWordIndex;
  }

  public getTotalStages(): number {
    return PRESENTATION_SCRIPT.length;
  }

  public getTotalWordsAllStages(): number {
    return TOTAL_SCRIPT_WORDS;
  }

  public getSpokenWordsCount(): number {
    return this.spokenWordsTotal;
  }

  public reset(): void {
    this.currentStageIndex = 0;
    this.currentWordIndex = 0;
    this.displayedSentences = [''];
    this.isSessionComplete = false;
    this.spokenWordsTotal = 0;
  }
}

export const wordStreamManager = new WordStreamManager();
