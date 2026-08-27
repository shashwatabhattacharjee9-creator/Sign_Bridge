/**
 * FILE: ScenarioSentenceEngine
 * Multi-Scenario Intuitive Gesture Sentence Assembler.
 * Chains physical hand shapes through multi-step contextual scenario flows
 * and automatically synthesizes grammatically complete spoken sentences.
 */

import { HandShape } from './handShapeClassifier';
import { audioLatchEngine } from '@/lib/audio/tts';
import { navigationStateManager } from './navigationState';

export interface SentenceScenario {
  id: string;
  category: string;
  steps: {
    [key in HandShape]?: { token: string; label: string };
  }[];
  finalSentence: string;
}

export const SCENARIOS: SentenceScenario[] = [
  // --- Track 1: Campus Helpdesk ---
  {
    id: 'campus_helpdesk',
    category: 'Campus Helpdesk',
    steps: [
      {
        OPEN_PALM: { token: 'Hello,', label: 'Greeting' },
        CLOSED_FIST: { token: 'Excuse me,', label: 'Attention' },
      },
      {
        INDEX_POINT: { token: 'where is', label: 'Inquiry' },
        PEACE_V: { token: 'can you guide me to', label: 'Directions' },
      },
      {
        PEACE_V: { token: 'the student registration', label: 'Subject' },
        OPEN_PALM: { token: 'the central admissions', label: 'Subject' },
      },
      {
        THUMBS_UP: { token: 'helpdesk counter?', label: 'Target' },
        OK_PINCH: { token: 'office room?', label: 'Target' },
      },
    ],
    finalSentence: 'Hello, where is the student registration helpdesk counter?',
  },
  // --- Track 2: Accounts & Fee Receipt ---
  {
    id: 'fee_accounts',
    category: 'Accounts & Fees',
    steps: [
      {
        CLOSED_FIST: { token: 'Excuse me,', label: 'Attention' },
        OPEN_PALM: { token: 'Good morning,', label: 'Greeting' },
      },
      {
        INDEX_POINT: { token: 'I need assistance', label: 'Action' },
        PEACE_V: { token: 'please verify', label: 'Action' },
      },
      {
        PEACE_V: { token: 'with semester fee', label: 'Subject' },
        OPEN_PALM: { token: 'with scholarship clearance', label: 'Subject' },
      },
      {
        THUMBS_UP: { token: 'receipt verification.', label: 'Target' },
        OK_PINCH: { token: 'documentation approval.', label: 'Target' },
      },
    ],
    finalSentence: 'Excuse me, I need assistance with semester fee receipt verification.',
  },
  // --- Track 3: Central Library & Resources ---
  {
    id: 'library_resources',
    category: 'Library Services',
    steps: [
      {
        OPEN_PALM: { token: 'Good morning,', label: 'Greeting' },
        CLOSED_FIST: { token: 'Hello,', label: 'Attention' },
      },
      {
        INDEX_POINT: { token: 'can you guide me', label: 'Inquiry' },
        PEACE_V: { token: 'I am searching', label: 'Action' },
      },
      {
        PEACE_V: { token: 'to the central library', label: 'Location' },
        OPEN_PALM: { token: 'for digital book archives', label: 'Subject' },
      },
      {
        THUMBS_UP: { token: 'reference section?', label: 'Target' },
        OK_PINCH: { token: 'study zone?', label: 'Target' },
      },
    ],
    finalSentence: 'Good morning, can you guide me to the central library reference section?',
  },
  // --- Track 4: Clinic / Medical Triage ---
  {
    id: 'medical_triage',
    category: 'Hospital Triage',
    steps: [
      {
        CLOSED_FIST: { token: 'Urgent,', label: 'Alert' },
        OPEN_PALM: { token: 'Hello doctor,', label: 'Greeting' },
      },
      {
        INDEX_POINT: { token: 'I need to meet', label: 'Action' },
        PEACE_V: { token: 'please arrange', label: 'Action' },
      },
      {
        PEACE_V: { token: 'the medical officer', label: 'Subject' },
        OPEN_PALM: { token: 'immediate consultation', label: 'Subject' },
      },
      {
        THUMBS_UP: { token: 'for checkup.', label: 'Resolution' },
        OK_PINCH: { token: 'right now.', label: 'Resolution' },
      },
    ],
    finalSentence: 'Urgent, I need to meet the medical officer for checkup.',
  },
  // --- Track 5: Course Syllabus Guidance ---
  {
    id: 'course_guidance',
    category: 'Academic Inquiries',
    steps: [
      {
        OPEN_PALM: { token: 'Excuse me,', label: 'Attention' },
        CLOSED_FIST: { token: 'Hello professor,', label: 'Greeting' },
      },
      {
        INDEX_POINT: { token: 'could you explain', label: 'Action' },
        PEACE_V: { token: 'I have a question on', label: 'Query' },
      },
      {
        PEACE_V: { token: 'the course syllabus', label: 'Subject' },
        OPEN_PALM: { token: 'the examination pattern', label: 'Subject' },
      },
      {
        THUMBS_UP: { token: 'submission process?', label: 'Target' },
        OK_PINCH: { token: 'guidelines?', label: 'Target' },
      },
    ],
    finalSentence: 'Excuse me, could you explain the course syllabus submission process?',
  },
  // --- Track 6: Emergency Assistance ---
  {
    id: 'emergency_assistance',
    category: 'Emergency Assistance',
    steps: [
      {
        CLOSED_FIST: { token: 'Please,', label: 'Urgent' },
        OPEN_PALM: { token: 'Attention,', label: 'Alert' },
      },
      {
        INDEX_POINT: { token: 'call the duty coordinator', label: 'Action' },
        PEACE_V: { token: 'alert security', label: 'Action' },
      },
      {
        PEACE_V: { token: 'immediately', label: 'Priority' },
        OPEN_PALM: { token: 'at this desk', label: 'Location' },
      },
      {
        THUMBS_UP: { token: 'for help.', label: 'Resolution' },
        OK_PINCH: { token: 'right away.', label: 'Resolution' },
      },
    ],
    finalSentence: 'Please, call the duty coordinator immediately for help.',
  },
  // --- Track 7: Closing & Gratitude ---
  {
    id: 'closing_gratitude',
    category: 'General Closing',
    steps: [
      {
        OPEN_PALM: { token: 'Thank you,', label: 'Gratitude' },
        CLOSED_FIST: { token: 'Perfect,', label: 'Affirmation' },
      },
      {
        INDEX_POINT: { token: 'that resolved', label: 'Status' },
        PEACE_V: { token: 'I understood', label: 'Status' },
      },
      {
        PEACE_V: { token: 'my inquiry', label: 'Subject' },
        OPEN_PALM: { token: 'the complete process', label: 'Subject' },
      },
      {
        THUMBS_UP: { token: 'completely.', label: 'Conclusion' },
        OK_PINCH: { token: 'very well.', label: 'Conclusion' },
      },
    ],
    finalSentence: 'Thank you, that resolved my inquiry completely.',
  },
];

export interface GestureIngestResult {
  token: string | null;
  label?: string;
  isSentenceComplete: boolean;
  fullSentence?: string;
  stepIndex: number;
  totalSteps: number;
  category: string;
}

export class ScenarioEngineManager {
  private activeScenarioIndex = 0;
  private currentStepIndex = 0;
  private accumulatedTokens: string[] = [];
  private completedTranscripts: string[] = [];
  private lastShape: HandShape = 'UNKNOWN';
  private lastTriggerTime = 0;

  public ingestGesture(shape: HandShape): GestureIngestResult {
    if (navigationStateManager.getActiveMode() !== 'studio') {
      return {
        token: null,
        isSentenceComplete: false,
        stepIndex: this.currentStepIndex,
        totalSteps: 4,
        category: this.getActiveCategory(),
      };
    }

    if (shape === 'UNKNOWN') {
      return {
        token: null,
        isSentenceComplete: false,
        stepIndex: this.currentStepIndex,
        totalSteps: 4,
        category: this.getActiveCategory(),
      };
    }

    const now = Date.now();
    // Debounce: prevent same shape rapid fire within 1.2 seconds
    if (shape === this.lastShape && now - this.lastTriggerTime < 1200) {
      return {
        token: null,
        isSentenceComplete: false,
        stepIndex: this.currentStepIndex,
        totalSteps: 4,
        category: this.getActiveCategory(),
      };
    }

    const scenario = SCENARIOS[this.activeScenarioIndex];
    const currentStepConfig = scenario.steps[this.currentStepIndex];

    // Check if the presented shape matches any mapped token for this step
    const match = currentStepConfig[shape];
    if (!match) {
      return {
        token: null,
        isSentenceComplete: false,
        stepIndex: this.currentStepIndex,
        totalSteps: scenario.steps.length,
        category: scenario.category,
      };
    }

    this.lastShape = shape;
    this.lastTriggerTime = now;

    const token = match.token;
    this.accumulatedTokens.push(token);

    // Play feedback tone & speak token instantly
    audioLatchEngine.playCommitTone();
    audioLatchEngine.speak(token);

    const stepCompleted = this.currentStepIndex + 1;
    this.currentStepIndex++;

    // Check if full sentence is assembled
    if (this.currentStepIndex >= scenario.steps.length) {
      const fullSentence = this.accumulatedTokens.join(' ');
      this.completedTranscripts.push(fullSentence);

      // Speak complete synthesized sentence with natural cadence after brief pause
      setTimeout(() => {
        audioLatchEngine.speak(fullSentence);
      }, 550);

      // Advance to next scenario track
      this.activeScenarioIndex = (this.activeScenarioIndex + 1) % SCENARIOS.length;
      this.currentStepIndex = 0;
      this.accumulatedTokens = [];

      return {
        token,
        label: match.label,
        isSentenceComplete: true,
        fullSentence,
        stepIndex: stepCompleted,
        totalSteps: scenario.steps.length,
        category: scenario.category,
      };
    }

    return {
      token,
      label: match.label,
      isSentenceComplete: false,
      stepIndex: this.currentStepIndex,
      totalSteps: scenario.steps.length,
      category: scenario.category,
    };
  }

  public getLiveTokens(): string[] {
    return this.accumulatedTokens;
  }

  public getTranscripts(): string[] {
    return this.completedTranscripts;
  }

  public getActiveCategory(): string {
    return SCENARIOS[this.activeScenarioIndex]?.category || 'Campus Helpdesk';
  }

  public getActiveScenarioId(): string {
    return SCENARIOS[this.activeScenarioIndex]?.id || 'campus_helpdesk';
  }

  public getCurrentStepIndex(): number {
    return this.currentStepIndex;
  }

  public getTotalSteps(): number {
    return SCENARIOS[this.activeScenarioIndex]?.steps.length || 4;
  }

  public getAvailableOptionsForCurrentStep(): Array<{ shape: HandShape; token: string; label: string }> {
    const scenario = SCENARIOS[this.activeScenarioIndex];
    const currentStepConfig = scenario?.steps[this.currentStepIndex] || {};
    return Object.entries(currentStepConfig).map(([shape, item]) => ({
      shape: shape as HandShape,
      token: item.token,
      label: item.label,
    }));
  }

  public reset(): void {
    this.activeScenarioIndex = 0;
    this.currentStepIndex = 0;
    this.accumulatedTokens = [];
    this.completedTranscripts = [];
    this.lastShape = 'UNKNOWN';
    audioLatchEngine.killAllSpeech();
  }
}

export const scenarioEngineManager = new ScenarioEngineManager();
