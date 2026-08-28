export type SupportedLanguage = 'en' | 'hi' | 'ta';

export interface ScriptWord {
  token: string; // Rendered in UI (Devanagari, Tamil, English)
  speechText: string; // Native script pronunciation
  phonetic?: string; // Romanized fallback if OS lacks regional voice pack
}

export interface StudioScenario {
  category: string;
  flow: ScriptWord[];
}

export interface LanguagePack {
  id: SupportedLanguage;
  label: string;
  nativeLabel: string;
  ttsLocale: string;
  flag: string;
  studioScenarios: StudioScenario[];
  peerDialogue: {
    signerA: ScriptWord[][];
    signerB: ScriptWord[][];
  };
}

export const MULTILINGUAL_DATA: Record<SupportedLanguage, LanguagePack> = {
  // ==========================================
  // ENGLISH DATASET
  // ==========================================
  en: {
    id: 'en',
    label: 'English',
    nativeLabel: 'English',
    ttsLocale: 'en-IN',
    flag: '🇮🇳',
    studioScenarios: [
      {
        category: 'Campus Helpdesk',
        flow: [
          { token: 'Hello,', speechText: 'Hello', phonetic: 'Hello' },
          { token: 'where is', speechText: 'where is', phonetic: 'where is' },
          { token: 'the registration desk', speechText: 'the registration desk', phonetic: 'the registration desk' },
          { token: 'counter located?', speechText: 'counter located?', phonetic: 'counter located?' },
        ],
      },
      {
        category: 'Fee Verification',
        flow: [
          { token: 'Excuse me,', speechText: 'Excuse me', phonetic: 'Excuse me' },
          { token: 'I need assistance', speechText: 'I need assistance', phonetic: 'I need assistance' },
          { token: 'with semester fee', speechText: 'with semester fee', phonetic: 'with semester fee' },
          { token: 'receipt clearance.', speechText: 'receipt clearance.', phonetic: 'receipt clearance.' },
        ],
      },
      {
        category: 'Central Library',
        flow: [
          { token: 'Good morning,', speechText: 'Good morning', phonetic: 'Good morning' },
          { token: 'can you guide me', speechText: 'can you guide me', phonetic: 'can you guide me' },
          { token: 'to the reference books', speechText: 'to the reference books', phonetic: 'to the reference books' },
          { token: 'archive section?', speechText: 'archive section?', phonetic: 'archive section?' },
        ],
      },
      {
        category: 'Gratitude & Close',
        flow: [
          { token: 'Thank you,', speechText: 'Thank you', phonetic: 'Thank you' },
          { token: 'that resolved', speechText: 'that resolved', phonetic: 'that resolved' },
          { token: 'my inquiry', speechText: 'my inquiry', phonetic: 'my inquiry' },
          { token: 'completely today.', speechText: 'completely today.', phonetic: 'completely today.' },
        ],
      },
    ],
    peerDialogue: {
      signerA: [
        [
          { token: 'Hey friend,', speechText: 'Hey friend', phonetic: 'Hey friend' },
          { token: 'did you submit', speechText: 'did you submit', phonetic: 'did you submit' },
          { token: 'the project form', speechText: 'the project form', phonetic: 'the project form' },
          { token: 'at the desk?', speechText: 'at the desk?', phonetic: 'at the desk?' },
        ],
        [
          { token: 'Yes,', speechText: 'Yes', phonetic: 'Yes' },
          { token: 'let us walk', speechText: 'let us walk', phonetic: 'let us walk' },
          { token: 'to the lab', speechText: 'to the lab', phonetic: 'to the lab' },
          { token: 'together now.', speechText: 'together now.', phonetic: 'together now.' },
        ],
      ],
      signerB: [
        [
          { token: 'Yes,', speechText: 'Yes', phonetic: 'Yes' },
          { token: 'I submitted it', speechText: 'I submitted it', phonetic: 'I submitted it' },
          { token: 'at counter two.', speechText: 'at counter two.', phonetic: 'at counter two.' },
          { token: 'Are you free now?', speechText: 'Are you free now?', phonetic: 'Are you free now?' },
        ],
        [
          { token: 'Awesome,', speechText: 'Awesome', phonetic: 'Awesome' },
          { token: 'let us head over', speechText: 'let us head over', phonetic: 'let us head over' },
          { token: 'right away.', speechText: 'right away.', phonetic: 'right away.' },
        ],
      ],
    },
  },

  // ==========================================
  // HINDI (हिंदी) DATASET
  // ==========================================
  hi: {
    id: 'hi',
    label: 'Hindi',
    nativeLabel: 'हिंदी',
    ttsLocale: 'hi-IN',
    flag: '🇮🇳',
    studioScenarios: [
      {
        category: 'विद्यार्थी हेल्पडेस्क (Student Desk)',
        flow: [
          { token: 'नमस्ते,', speechText: 'नमस्ते', phonetic: 'Namaste' },
          { token: 'कृपया बताएं', speechText: 'कृपया बताएं', phonetic: 'kripya batayein' },
          { token: 'विद्यार्थी रजिस्ट्रेशन', speechText: 'विद्यार्थी रजिस्ट्रेशन', phonetic: 'vidyarthi registration' },
          { token: 'डेस्क कहाँ है?', speechText: 'डेस्क कहाँ है?', phonetic: 'desk kahan hai?' },
        ],
      },
      {
        category: 'फीस और रसीद सत्यापन (Fee Accounts)',
        flow: [
          { token: 'माफ कीजियेगा,', speechText: 'माफ कीजियेगा', phonetic: 'Maaf kijiyega' },
          { token: 'मुझे फीस रसीद', speechText: 'मुझे फीस रसीद', phonetic: 'mujhe fees raseed' },
          { token: 'सत्यापन में', speechText: 'सत्यापन में', phonetic: 'satyapan mein' },
          { token: 'मदद चाहिए।', speechText: 'मदद चाहिए।', phonetic: 'madad chahiye.' },
        ],
      },
      {
        category: 'केंद्रीय पुस्तकालय (Central Library)',
        flow: [
          { token: 'शुभ प्रभात,', speechText: 'शुभ प्रभात', phonetic: 'Shubh prabhat' },
          { token: 'क्या आप मुझे', speechText: 'क्या आप मुझे', phonetic: 'kya aap mujhe' },
          { token: 'केंद्रीय पुस्तकालय का', speechText: 'केंद्रीय पुस्तकालय का', phonetic: 'library ka' },
          { token: 'रास्ता बताएंगे?', speechText: 'रास्ता बताएंगे?', phonetic: 'rasta batayenge?' },
        ],
      },
      {
        category: 'धन्यवाद और समापन (Gratitude)',
        flow: [
          { token: 'बहुत बहुत धन्यवाद,', speechText: 'बहुत बहुत धन्यवाद', phonetic: 'Bahut bahut dhanyavaad' },
          { token: 'मेरी सभी समस्याएं', speechText: 'मेरी सभी समस्याएं', phonetic: 'meri samasya' },
          { token: 'पूरी तरह से', speechText: 'पूरी तरह से', phonetic: 'poori tarah se' },
          { token: 'हल हो गईं।', speechText: 'हल हो गईं।', phonetic: 'hal ho gayi.' },
        ],
      },
    ],
    peerDialogue: {
      signerA: [
        [
          { token: 'सुनो दोस्त,', speechText: 'सुनो दोस्त', phonetic: 'Suno dost' },
          { token: 'क्या तुमने', speechText: 'क्या तुमने', phonetic: 'kya tumne' },
          { token: 'प्रोजेक्ट फॉर्म', speechText: 'प्रोजेक्ट फॉर्म', phonetic: 'project form' },
          { token: 'जमा कर दिया?', speechText: 'जमा कर दिया?', phonetic: 'jama kar diya?' },
        ],
        [
          { token: 'हाँ,', speechText: 'हाँ', phonetic: 'Haan' },
          { token: 'चलो साथ में', speechText: 'चलो साथ में', phonetic: 'chalo saath mein' },
          { token: 'कंप्यूटर लैब', speechText: 'कंप्यूटर लैब', phonetic: 'computer lab' },
          { token: 'चलते हैं।', speechText: 'चलते हैं।', phonetic: 'chalte hain.' },
        ],
      ],
      signerB: [
        [
          { token: 'हाँ भाई,', speechText: 'हाँ भाई', phonetic: 'Haan bhai' },
          { token: 'मैंने काउंटर पर', speechText: 'मैंने काउंटर पर', phonetic: 'maine counter par' },
          { token: 'जमा करवा दिया।', speechText: 'जमा करवा दिया।', phonetic: 'jama karwa diya.' },
          { token: 'क्या तुम फ्री हो?', speechText: 'क्या तुम फ्री हो?', phonetic: 'kya tum free ho?' },
        ],
        [
          { token: 'बहुत बढ़िया,', speechText: 'बहुत बढ़िया', phonetic: 'Bahut badhiya' },
          { token: 'चलो अभी', speechText: 'चलो अभी', phonetic: 'chalo abhi' },
          { token: 'निकलते हैं।', speechText: 'निकलते हैं।', phonetic: 'nikalte hain.' },
        ],
      ],
    },
  },

  // ==========================================
  // TAMIL (தமிழ்) DATASET
  // ==========================================
  ta: {
    id: 'ta',
    label: 'Tamil',
    nativeLabel: 'தமிழ்',
    ttsLocale: 'ta-IN',
    flag: '🇮🇳',
    studioScenarios: [
      {
        category: 'மாணவர் உதவி மையம் (Student Desk)',
        flow: [
          { token: 'வணக்கம்,', speechText: 'வணக்கம்', phonetic: 'Vanakkam' },
          { token: 'மாணவர் சேர்க்கை', speechText: 'மாணவர் சேர்க்கை', phonetic: 'maanavar serkkai' },
          { token: 'உதவி மையம்', speechText: 'உதவி மையம்', phonetic: 'udavi maiyam' },
          { token: 'எங்கே உள்ளது?', speechText: 'எங்கே உள்ளது?', phonetic: 'enge ulladhu?' },
        ],
      },
      {
        category: 'கட்டண சரிபார்ப்பு (Fee Verification)',
        flow: [
          { token: 'மன்னிக்கவும்,', speechText: 'மன்னிக்கவும்', phonetic: 'Mannikkavum' },
          { token: 'எனக்கு கல்விக் கட்டண', speechText: 'எனக்கு கல்விக் கட்டண', phonetic: 'enakku kalvi kattana' },
          { token: 'ரசீது சரிபார்ப்பில்', speechText: 'ரசீது சரிபார்ப்பில்', phonetic: 'raseedhu saripaarppil' },
          { token: 'உதவி தேவை.', speechText: 'உதவி தேவை.', phonetic: 'udavi thevai.' },
        ],
      },
      {
        category: 'மைய நூலகம் (Central Library)',
        flow: [
          { token: 'காலை வணக்கம்,', speechText: 'காலை வணக்கம்', phonetic: 'Kaalai vanakkam' },
          { token: 'மைய நூலகத்திற்கு', speechText: 'மைய நூலகத்திற்கு', phonetic: 'noolagathirku' },
          { token: 'எவ்வாறு செல்வது', speechText: 'எவ்வாறு செல்வது', phonetic: 'evvaaru selvathu' },
          { token: 'என்று கூறுங்கள்?', speechText: 'என்று கூறுங்கள்?', phonetic: 'endru koorungal?' },
        ],
      },
      {
        category: 'நன்றி செலுத்துதல் (Gratitude)',
        flow: [
          { token: 'மிக்க நன்றி,', speechText: 'மிக்க நன்றி', phonetic: 'Mikka nandri' },
          { token: 'எனது அனைத்து கேள்விகளுக்கும்', speechText: 'எனது அனைத்து கேள்விகளுக்கும்', phonetic: 'enakku theeruvu' },
          { token: 'முழுமையான தீர்வு', speechText: 'முழுமையான தீர்வு', phonetic: 'mulumaiana theervu' },
          { token: 'கிடைத்துவிட்டது.', speechText: 'கிடைத்துவிட்டது.', phonetic: 'kidaithuvittathu.' },
        ],
      },
    ],
    peerDialogue: {
      signerA: [
        [
          { token: 'வணக்கம் நண்பா,', speechText: 'வணக்கம் நண்பா', phonetic: 'Vanakkam nanba' },
          { token: 'திட்ட அறிக்கையை', speechText: 'திட்ட அறிக்கையை', phonetic: 'project arikkaiyai' },
          { token: 'கவுண்டரில்', speechText: 'கவுண்டரில்', phonetic: 'counteril' },
          { token: 'சமர்ப்பித்து விட்டாயா?', speechText: 'சமர்ப்பித்து விட்டாயா?', phonetic: 'samarppithu vittaya?' },
        ],
        [
          { token: 'ஆம்,', speechText: 'ஆம்', phonetic: 'Aam' },
          { token: 'வா நாம் ஆய்வகத்திற்கு', speechText: 'வா நாம் ஆய்வகத்திற்கு', phonetic: 'vaa naam aaivagathirku' },
          { token: 'இப்போதே', speechText: 'இப்போதே', phonetic: 'ippothe' },
          { token: 'செல்வோம்.', speechText: 'செல்வோம்.', phonetic: 'selvom.' },
        ],
      ],
      signerB: [
        [
          { token: 'ஆம் தோழா,', speechText: 'ஆம் தோழா', phonetic: 'Aam thozha' },
          { token: 'இரண்டாம் கவுண்டரில்', speechText: 'இரண்டாம் கவுண்டரில்', phonetic: 'irandaam counteril' },
          { token: 'கொடுத்துவிட்டேன்.', speechText: 'கொடுத்துவிட்டேன்.', phonetic: 'koduthuvittean.' },
          { token: 'நீ வருகிறாயா?', speechText: 'நீ வருகிறாயா?', phonetic: 'nee varugiraya?' },
        ],
        [
          { token: 'மகிழ்ச்சி,', speechText: 'மகிழ்ச்சி', phonetic: 'Magizhchi' },
          { token: 'வா உடனே', speechText: 'வா உடனே', phonetic: 'vaa udane' },
          { token: 'போவோம்.', speechText: 'போவோம்.', phonetic: 'povom.' },
        ],
      ],
    },
  },
};

// Aliases for full backward compatibility
export const MULTILINGUAL_REGISTRY = MULTILINGUAL_DATA;
export type LanguageConfig = LanguagePack;
