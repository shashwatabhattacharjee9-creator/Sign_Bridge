import { SupportedLanguage, MULTILINGUAL_DATA } from './multilingualScripts';
import { multilingualAudioEngine } from '../audio/multilingualTTS';

class StudioEngineManager {
  private currentLanguage: SupportedLanguage = 'en';
  private scenarioIndex = 0;
  private wordIndex = 0;
  private currentTokens: string[] = [];
  private transcriptHistory: string[] = [];
  private lastTriggerTime = 0;

  public setLanguage(lang: SupportedLanguage): void {
    this.currentLanguage = lang;
    multilingualAudioEngine.setLanguage(lang);
    this.reset();
  }

  public getLanguage(): SupportedLanguage {
    return this.currentLanguage;
  }

  public triggerNextWord(): { token: string; isComplete: boolean; fullSentence?: string } | null {
    const now = Date.now();
    if (now - this.lastTriggerTime < 600 || multilingualAudioEngine.getIsSpeaking()) {
      return null;
    }
    this.lastTriggerTime = now;

    const scenarios = MULTILINGUAL_DATA[this.currentLanguage].studioScenarios;
    const activeScenario = scenarios[this.scenarioIndex % scenarios.length];
    if (!activeScenario || !activeScenario.flow || activeScenario.flow.length === 0) return null;

    const wordObj = activeScenario.flow[this.wordIndex];
    if (!wordObj) return null;

    // Instantly append token to UI
    this.currentTokens.push(wordObj.token);

    // Speak word with native audio + phonetic fallback
    multilingualAudioEngine.speak(
      wordObj.speechText,
      wordObj.phonetic,
      this.currentLanguage
    );

    this.wordIndex++;

    if (this.wordIndex >= activeScenario.flow.length) {
      const fullSentence = this.currentTokens.join(' ');
      this.transcriptHistory.push(fullSentence);

      this.wordIndex = 0;
      this.currentTokens = [];
      this.scenarioIndex = (this.scenarioIndex + 1) % scenarios.length;

      return { token: wordObj.token, isComplete: true, fullSentence };
    }

    return { token: wordObj.token, isComplete: false };
  }

  public getLiveTokens(): string[] {
    return this.currentTokens;
  }

  public getTranscript(): string[] {
    return this.transcriptHistory;
  }

  public getActiveCategory(): string {
    const scenarios = MULTILINGUAL_DATA[this.currentLanguage]?.studioScenarios;
    if (!scenarios || scenarios.length === 0) return 'Campus Helpdesk';
    return scenarios[this.scenarioIndex % scenarios.length]?.category || 'Campus Helpdesk';
  }

  public getWordIndex(): number {
    return this.wordIndex;
  }

  public getTotalWords(): number {
    const scenarios = MULTILINGUAL_DATA[this.currentLanguage]?.studioScenarios;
    if (!scenarios || scenarios.length === 0) return 4;
    return scenarios[this.scenarioIndex % scenarios.length]?.flow.length || 4;
  }

  public reset(): void {
    this.scenarioIndex = 0;
    this.wordIndex = 0;
    this.currentTokens = [];
    this.transcriptHistory = [];
    multilingualAudioEngine.kill();
  }
}

export const studioEngineManager = new StudioEngineManager();
