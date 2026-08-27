/**
 * FILE: Multilingual Token Dictionary & Script Registry
 * Full trilingual localization suite for English (en-IN), Hindi (hi-IN), and Tamil (ta-IN).
 * Contains localized token arrays for single-user studio mode and multi-turn peer tele-dialogue.
 */

export type SupportedLanguage = 'en' | 'hi' | 'ta';

export interface ScriptWord {
  token: string;
  speechText: string;
}

export interface LanguageConfig {
  id: SupportedLanguage;
  label: string;
  nativeLabel: string;
  ttsLocale: string;
  flag: string;
  singleStudioFlows: ScriptWord[][];
  peerDialogueFlows: {
    signerA: ScriptWord[][];
    signerB: ScriptWord[][];
  };
}

export const MULTILINGUAL_REGISTRY: Record<SupportedLanguage, LanguageConfig> = {
  en: {
    id: 'en',
    label: 'English (India)',
    nativeLabel: 'English',
    ttsLocale: 'en-IN',
    flag: '🇮🇳',
    singleStudioFlows: [
      [
        { token: 'Hello,', speechText: 'Hello' },
        { token: 'where is', speechText: 'where is' },
        { token: 'the student registration', speechText: 'the student registration' },
        { token: 'helpdesk counter?', speechText: 'helpdesk counter?' },
      ],
      [
        { token: 'Excuse me,', speechText: 'Excuse me' },
        { token: 'I need assistance', speechText: 'I need assistance' },
        { token: 'with semester fee', speechText: 'with semester fee' },
        { token: 'receipt verification.', speechText: 'receipt verification' },
      ],
      [
        { token: 'Thank you,', speechText: 'Thank you' },
        { token: 'that resolved', speechText: 'that resolved' },
        { token: 'my inquiry', speechText: 'my inquiry' },
        { token: 'completely.', speechText: 'completely' },
      ],
    ],
    peerDialogueFlows: {
      signerA: [
        [
          { token: 'Hey,', speechText: 'Hey' },
          { token: 'did you finish', speechText: 'did you finish' },
          { token: 'the semester', speechText: 'the semester' },
          { token: 'registration form?', speechText: 'registration form' },
        ],
        [
          { token: 'Yes,', speechText: 'Yes' },
          { token: 'let us go', speechText: 'let us go' },
          { token: 'to the lab', speechText: 'to the lab' },
          { token: 'together right now.', speechText: 'together right now' },
        ],
      ],
      signerB: [
        [
          { token: 'Yes,', speechText: 'Yes' },
          { token: 'I submitted it', speechText: 'I submitted it' },
          { token: 'at counter two.', speechText: 'at counter two' },
          { token: 'Are you heading', speechText: 'Are you heading' },
          { token: 'to the lab next?', speechText: 'to the lab next' },
        ],
        [
          { token: 'Awesome,', speechText: 'Awesome' },
          { token: 'let us', speechText: 'let us' },
          { token: 'move now.', speechText: 'move now' },
        ],
      ],
    },
  },
  hi: {
    id: 'hi',
    label: 'Hindi (हिंदी)',
    nativeLabel: 'हिंदी',
    ttsLocale: 'hi-IN',
    flag: '🇮🇳',
    singleStudioFlows: [
      [
        { token: 'नमस्ते,', speechText: 'नमस्ते' },
        { token: 'कृपया बताएं', speechText: 'कृपया बताएं' },
        { token: 'विद्यार्थी रजिस्ट्रेशन', speechText: 'विद्यार्थी रजिस्ट्रेशन' },
        { token: 'डेस्क कहाँ है?', speechText: 'डेस्क कहाँ है?' },
      ],
      [
        { token: 'माफ कीजियेगा,', speechText: 'माफ कीजियेगा' },
        { token: 'मुझे फीस रसीद', speechText: 'मुझे फीस रसीद' },
        { token: 'सत्यापन में', speechText: 'सत्यापन में' },
        { token: 'मदद चाहिए।', speechText: 'मदद चाहिए।' },
      ],
      [
        { token: 'धन्यवाद,', speechText: 'धन्यवाद' },
        { token: 'मेरी समस्या', speechText: 'मेरी समस्या' },
        { token: 'हल हो गई।', speechText: 'हल हो गई।' },
      ],
    ],
    peerDialogueFlows: {
      signerA: [
        [
          { token: 'सुनो,', speechText: 'सुनो' },
          { token: 'क्या तुमने', speechText: 'क्या तुमने' },
          { token: 'रजिस्ट्रेशन फॉर्म', speechText: 'रजिस्ट्रेशन फॉर्म' },
          { token: 'जमा कर दिया?', speechText: 'जमा कर दिया?' },
        ],
        [
          { token: 'हाँ,', speechText: 'हाँ' },
          { token: 'चलो साथ में', speechText: 'चलो साथ में' },
          { token: 'कंप्यूटर लैब', speechText: 'कंप्यूटर लैब' },
          { token: 'चलते हैं।', speechText: 'चलते हैं।' },
        ],
      ],
      signerB: [
        [
          { token: 'हाँ भाई,', speechText: 'हाँ भाई' },
          { token: 'काउंटर नंबर दो पर', speechText: 'काउंटर नंबर दो पर' },
          { token: 'जमा हो गया।', speechText: 'जमा हो गया।' },
          { token: 'क्या तुम लैब जा रहे हो?', speechText: 'क्या तुम लैब जा रहे हो?' },
        ],
        [
          { token: 'बहुत बढ़िया,', speechText: 'बहुत बढ़िया' },
          { token: 'चलो अभी', speechText: 'चलो अभी' },
          { token: 'निकलते हैं।', speechText: 'निकलते हैं।' },
        ],
      ],
    },
  },
  ta: {
    id: 'ta',
    label: 'Tamil (தமிழ்)',
    nativeLabel: 'தமிழ்',
    ttsLocale: 'ta-IN',
    flag: '🇮🇳',
    singleStudioFlows: [
      [
        { token: 'வணக்கம்,', speechText: 'வணக்கம்' },
        { token: 'மாணவர் சேர்க்கை', speechText: 'மாணவர் சேர்க்கை' },
        { token: 'உதவி மையம்', speechText: 'உதவி மையம்' },
        { token: 'எங்கே உள்ளது?', speechText: 'எங்கே உள்ளது?' },
      ],
      [
        { token: 'மன்னிக்கவும்,', speechText: 'மன்னிக்கவும்' },
        { token: 'எனக்கு கல்வி கட்டண', speechText: 'எனக்கு கல்வி கட்டண' },
        { token: 'ரசீது சரிபார்ப்பில்', speechText: 'ரசீது சரிபார்ப்பில்' },
        { token: 'உதவி வேண்டும்.', speechText: 'உதவி வேண்டும்.' },
      ],
      [
        { token: 'மிக்க நன்றி,', speechText: 'மிக்க நன்றி' },
        { token: 'எனது கேள்விக்கு', speechText: 'எனது கேள்விக்கு' },
        { token: 'தீர்வு கிடைத்தது.', speechText: 'தீர்வு கிடைத்தது.' },
      ],
    ],
    peerDialogueFlows: {
      signerA: [
        [
          { token: 'வணக்கம் தோழா,', speechText: 'வணக்கம் தோழா' },
          { token: 'பதிவு படிவத்தை', speechText: 'பதிவு படிவத்தை' },
          { token: 'சமர்ப்பித்து', speechText: 'சமர்ப்பித்து' },
          { token: 'விட்டாயா?', speechText: 'விட்டாயா?' },
        ],
        [
          { token: 'சரி,', speechText: 'சரி' },
          { token: 'நாம் இருவரும்', speechText: 'நாம் இருவரும்' },
          { token: 'ஆய்வகத்திற்கு', speechText: 'ஆய்வகத்திற்கு' },
          { token: 'இப்போதே செல்வோம்.', speechText: 'இப்போதே செல்வோம்.' },
        ],
      ],
      signerB: [
        [
          { token: 'ஆம்,', speechText: 'ஆம்' },
          { token: 'இரண்டாம் கவுண்டரில்', speechText: 'இரண்டாம் கவுண்டரில்' },
          { token: 'கொடுத்துவிட்டேன்.', speechText: 'கொடுத்துவிட்டேன்.' },
          { token: 'அடுத்து லேப் செல்கிறாயா?', speechText: 'அடுத்து லேப் செல்கிறாயா?' },
        ],
        [
          { token: 'மகிழ்ச்சி,', speechText: 'மகிழ்ச்சி' },
          { token: 'வா உடனே', speechText: 'வா உடனே' },
          { token: 'கிளம்புவோம்.', speechText: 'கிளம்புவோம்.' },
        ],
      ],
    },
  },
};
