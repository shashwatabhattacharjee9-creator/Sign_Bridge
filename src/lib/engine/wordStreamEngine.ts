/**
 * FILE: WordStreamEngine
 * Sequential Word-by-Word Kinetic Narrative Engine.
 * Manages the pitch script stream and index progression.
 */

export const PITCH_WORD_STREAM: string[] = [
  'Hello',
  'everyone',
  'thank you',
  'for',
  'allowing',
  'us',
  'to',
  'present',
  'this.',
  'We',
  'are',
  'a',
  'bunch',
  'of',
  'tech',
  'enthusiastic',
  'students',
  'building',
  'SignBridge,',
  'an',
  'edge-native',
  'ISL',
  'recognition',
  'system.',
  'Thank you'
];

export class WordStreamManager {
  private currentIndex = 0;
  private recognizedTokens: string[] = [];

  public getCurrentWord(): string {
    return PITCH_WORD_STREAM[this.currentIndex % PITCH_WORD_STREAM.length];
  }

  public getNextWord(): string | null {
    if (this.currentIndex >= PITCH_WORD_STREAM.length) {
      this.currentIndex = 0; // Loop or cycle smoothly
    }
    return PITCH_WORD_STREAM[this.currentIndex];
  }

  public advance(): string {
    const word = PITCH_WORD_STREAM[this.currentIndex % PITCH_WORD_STREAM.length];
    this.recognizedTokens.push(word);
    this.currentIndex = (this.currentIndex + 1) % PITCH_WORD_STREAM.length;
    return word;
  }

  public getTokens(): string[] {
    return this.recognizedTokens;
  }

  public getCurrentIndex(): number {
    return this.currentIndex;
  }

  public getTotalWords(): number {
    return PITCH_WORD_STREAM.length;
  }

  public getFullSentence(): string {
    return this.recognizedTokens.join(' ');
  }

  public reset(): void {
    this.currentIndex = 0;
    this.recognizedTokens = [];
  }
}

export const wordStreamManager = new WordStreamManager();
