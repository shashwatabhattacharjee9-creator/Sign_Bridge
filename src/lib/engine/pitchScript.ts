/**
 * FILE: Contextual Interaction Sentence Banks
 * Categorized interaction banks for realistic campus helpdesk inquiries,
 * everyday assistive/healthcare interactions, witty live testing lines,
 * and quick emergency inquiries.
 * Completely free of introductory slide pitch scripts.
 */

export interface ContextualSentence {
  category: 'campus' | 'assistive' | 'witty' | 'emergency';
  tokens: string[];
}

export const CONTEXTUAL_INTERACTION_BANKS: ContextualSentence[] = [
  // --- Bank 1: Realistic Campus Helpdesk Interactions ---
  {
    category: 'campus',
    tokens: ['Where', 'is', 'the', 'student', 'registration', 'helpdesk?'],
  },
  {
    category: 'campus',
    tokens: ['I', 'need', 'assistance', 'with', 'my', 'course', 'fee', 'receipt.'],
  },
  {
    category: 'campus',
    tokens: ['Can', 'you', 'please', 'guide', 'me', 'to', 'the', 'central', 'library?'],
  },
  {
    category: 'campus',
    tokens: ['I', 'am', 'looking', 'for', 'the', 'administrative', 'office.'],
  },

  // --- Bank 2: Everyday Assistive & Healthcare Interactions ---
  {
    category: 'assistive',
    tokens: ['Hello,', 'thank', 'you', 'for', 'your', 'kind', 'help.'],
  },
  {
    category: 'assistive',
    tokens: ['Could', 'you', 'please', 'write', 'down', 'the', 'next', 'steps?'],
  },
  {
    category: 'assistive',
    tokens: ['I', 'need', 'to', 'meet', 'the', 'department', 'coordinator.'],
  },

  // --- Bank 3: Witty / Engaging Live Test Lines ---
  {
    category: 'witty',
    tokens: ['Testing', 'one', 'two', 'three...', 'the', 'edge', 'AI', 'is', 'running', 'on', 'pure', 'caffeine.'],
  },
  {
    category: 'witty',
    tokens: ['Zero', 'cloud', 'servers,', 'zero', 'lag,', 'and', 'one', 'hundred', 'percent', 'offline.'],
  },
  {
    category: 'witty',
    tokens: ['Our', 'code', 'has', 'many', 'features,', 'and', 'instant', 'translation', 'is', 'the', 'best', 'one.'],
  },
  {
    category: 'witty',
    tokens: ['Recognizing', 'gestures', 'in', 'real-time', 'with', 'sub-twenty', 'millisecond', 'precision.'],
  },

  // --- Bank 4: Quick Emergency Inquiries ---
  {
    category: 'emergency',
    tokens: ['Please', 'call', 'for', 'medical', 'assistance', 'immediately.'],
  },
  {
    category: 'emergency',
    tokens: ['I', 'need', 'a', 'glass', 'of', 'water,', 'please.'],
  },
];
