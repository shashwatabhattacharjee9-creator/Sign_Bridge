/**
 * FILE: Presentation Script Dataset
 * Multi-Stage Non-Looping Pitch Script for SignBridge Demonstration.
 */

export interface ScriptStage {
  stageId: number;
  stageTitle: string;
  badge: string;
  words: string[];
}

export const PRESENTATION_SCRIPT: ScriptStage[] = [
  {
    stageId: 1,
    stageTitle: 'Introduction & Team Hook',
    badge: 'STAGE 1: TEAM INTRO',
    words: [
      'Hello',
      'everyone,',
      'thank you',
      'for',
      'allowing',
      'us',
      'to',
      'present',
      'today.',
      'We',
      'are',
      'a',
      'bunch',
      'of',
      'passionate',
      'students',
      'building',
      'SignBridge.',
    ],
  },
  {
    stageId: 2,
    stageTitle: 'The Problem & Mission',
    badge: 'STAGE 2: THE PROBLEM',
    words: [
      'Over',
      'eighteen',
      'million',
      'deaf',
      'individuals',
      'in',
      'India',
      'face',
      'daily',
      'communication',
      'barriers.',
      'Our',
      'mission',
      'is',
      'to',
      'break',
      'this',
      'silence',
      'permanently.',
    ],
  },
  {
    stageId: 3,
    stageTitle: 'The Zero-Cloud Edge Solution',
    badge: 'STAGE 3: INSTANT EDGE AI',
    words: [
      'SignBridge',
      'translates',
      'sign',
      'language',
      'directly',
      'inside',
      'the',
      'browser',
      'with',
      'instant',
      'speed',
      'and',
      'total',
      'privacy.',
      'No',
      'video',
      'ever',
      'leaves',
      'this',
      'device.',
    ],
  },
  {
    stageId: 4,
    stageTitle: 'Closing & Q&A Transition',
    badge: 'STAGE 4: CLOSING & Q&A',
    words: [
      'Thank you,',
      'esteemed',
      'judges.',
      'We',
      'are',
      'ready',
      'for',
      'your',
      'questions.',
    ],
  },
];

export const TOTAL_SCRIPT_WORDS = PRESENTATION_SCRIPT.reduce(
  (sum, stage) => sum + stage.words.length,
  0
);
