/**
 * FILE: ScenarioSentenceEngine
 * Multi-Scenario Intuitive Gesture Sentence Assembler with Trilingual Translation Support.
 * Chains physical hand shapes through multi-step contextual scenario flows
 * and automatically synthesizes grammatically complete spoken sentences in English, Hindi, and Tamil.
 */

import { HandShape } from './handShapeClassifier';
import { audioLatchEngine } from '@/lib/audio/tts';
import { navigationStateManager } from './navigationState';
import { SupportedLanguage } from './multilingualScripts';
import { multilingualSpeechEngine } from '@/lib/audio/multilingualTTS';

export interface SentenceScenario {
  id: string;
  category: string;
  steps: {
    [key in HandShape]?: { token: string; label: string; translation?: string };
  }[];
  finalSentence: string;
  englishTranslation?: string;
}

export const MULTILINGUAL_SCENARIOS: Record<SupportedLanguage, SentenceScenario[]> = {
  en: [
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
      englishTranslation: 'Hello, where is the student registration helpdesk counter?',
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
      englishTranslation: 'Excuse me, I need assistance with semester fee receipt verification.',
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
      englishTranslation: 'Good morning, can you guide me to the central library reference section?',
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
      englishTranslation: 'Urgent, I need to meet the medical officer for checkup.',
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
      englishTranslation: 'Excuse me, could you explain the course syllabus submission process?',
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
      englishTranslation: 'Please, call the duty coordinator immediately for help.',
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
      englishTranslation: 'Thank you, that resolved my inquiry completely.',
    },
  ],
  hi: [
    // --- Track 1: Campus Helpdesk (हिंदी) ---
    {
      id: 'campus_helpdesk_hi',
      category: 'कैंपस हेल्पडेस्क (Campus Helpdesk)',
      steps: [
        {
          OPEN_PALM: { token: 'नमस्ते,', label: 'अभिवादन (Hello)', translation: 'Hello,' },
          CLOSED_FIST: { token: 'माफ कीजियेगा,', label: 'ध्यान (Excuse me)', translation: 'Excuse me,' },
        },
        {
          INDEX_POINT: { token: 'कृपया बताएं', label: 'पूछताछ (Please tell)', translation: 'please tell me' },
          PEACE_V: { token: 'क्या आप मुझे', label: 'मार्गदर्शन (Can you guide)', translation: 'can you guide me to' },
        },
        {
          PEACE_V: { token: 'विद्यार्थी रजिस्ट्रेशन', label: 'विषय (Student Registration)', translation: 'the student registration' },
          OPEN_PALM: { token: 'केंद्रीय प्रवेश', label: 'विषय (Central Admissions)', translation: 'the central admissions' },
        },
        {
          THUMBS_UP: { token: 'डेस्क कहाँ है?', label: 'लक्ष्य (Where is desk?)', translation: 'helpdesk counter?' },
          OK_PINCH: { token: 'कार्यालय कहाँ है?', label: 'लक्ष्य (Where is office?)', translation: 'office room?' },
        },
      ],
      finalSentence: 'नमस्ते, कृपया बताएं विद्यार्थी रजिस्ट्रेशन डेस्क कहाँ है?',
      englishTranslation: 'Hello, please tell me where the student registration desk is?',
    },
    // --- Track 2: Accounts & Fee Receipt (हिंदी) ---
    {
      id: 'fee_accounts_hi',
      category: 'फीस एवं खाते (Accounts & Fees)',
      steps: [
        {
          CLOSED_FIST: { token: 'माफ कीजियेगा,', label: 'ध्यान (Excuse me)', translation: 'Excuse me,' },
          OPEN_PALM: { token: 'सुप्रभात,', label: 'अभिवादन (Good morning)', translation: 'Good morning,' },
        },
        {
          INDEX_POINT: { token: 'मुझे फीस रसीद', label: 'कार्रवाई (Fee receipt)', translation: 'I need assistance with fee receipt' },
          PEACE_V: { token: 'कृपया जांचें', label: 'जांच (Please verify)', translation: 'please verify' },
        },
        {
          PEACE_V: { token: 'सत्यापन में', label: 'विषय (Verification)', translation: 'verification' },
          OPEN_PALM: { token: 'छात्रवृत्ति फॉर्म में', label: 'विषय (Scholarship form)', translation: 'scholarship clearance' },
        },
        {
          THUMBS_UP: { token: 'मदद चाहिए।', label: 'समाधान (Need help)', translation: 'assistance.' },
          OK_PINCH: { token: 'स्वीकृति चाहिए।', label: 'स्वीकृति (Need approval)', translation: 'approval.' },
        },
      ],
      finalSentence: 'माफ कीजियेगा, मुझे फीस रसीद सत्यापन में मदद चाहिए।',
      englishTranslation: 'Excuse me, I need assistance with semester fee receipt verification.',
    },
    // --- Track 3: Central Library (हिंदी) ---
    {
      id: 'library_resources_hi',
      category: 'पुस्तकालय सेवाएँ (Library Services)',
      steps: [
        {
          OPEN_PALM: { token: 'सुप्रभात,', label: 'अभिवादन (Good morning)', translation: 'Good morning,' },
          CLOSED_FIST: { token: 'नमस्ते,', label: 'अभिवादन (Hello)', translation: 'Hello,' },
        },
        {
          INDEX_POINT: { token: 'क्या आप मुझे', label: 'पूछताछ (Can you)', translation: 'can you guide me' },
          PEACE_V: { token: 'मैं ढूंढ रहा हूँ', label: 'खोज (Searching)', translation: 'I am searching' },
        },
        {
          PEACE_V: { token: 'केंद्रीय पुस्तकालय', label: 'स्थान (Central library)', translation: 'to the central library' },
          OPEN_PALM: { token: 'डिजिटल बुक सेक्शन', label: 'विषय (Digital books)', translation: 'for digital book archives' },
        },
        {
          THUMBS_UP: { token: 'का रास्ता बताएंगे?', label: 'लक्ष्य (Show way?)', translation: 'reference section?' },
          OK_PINCH: { token: 'स्टडी जोन कहाँ है?', label: 'लक्ष्य (Study zone?)', translation: 'study zone?' },
        },
      ],
      finalSentence: 'सुप्रभात, क्या आप मुझे केंद्रीय पुस्तकालय का रास्ता बताएंगे?',
      englishTranslation: 'Good morning, can you guide me to the central library reference section?',
    },
    // --- Track 4: Hospital Triage (हिंदी) ---
    {
      id: 'medical_triage_hi',
      category: 'अस्पताल ट्रायज (Hospital Triage)',
      steps: [
        {
          CLOSED_FIST: { token: 'आवश्यक,', label: 'अलर्ट (Urgent)', translation: 'Urgent,' },
          OPEN_PALM: { token: 'नमस्ते डॉक्टर,', label: 'अभिवादन (Hello doctor)', translation: 'Hello doctor,' },
        },
        {
          INDEX_POINT: { token: 'मुझे डॉक्टर से', label: 'कार्रवाई (Meet doctor)', translation: 'I need to meet' },
          PEACE_V: { token: 'कृपया व्यवस्था करें', label: 'अनुरोध (Please arrange)', translation: 'please arrange' },
        },
        {
          PEACE_V: { token: 'जांच के लिए', label: 'विषय (For checkup)', translation: 'the medical officer' },
          OPEN_PALM: { token: 'तत्काल परामर्श', label: 'विषय (Consultation)', translation: 'immediate consultation' },
        },
        {
          THUMBS_UP: { token: 'परामर्श चाहिए।', label: 'समाधान (Consultation)', translation: 'for checkup.' },
          OK_PINCH: { token: 'अभी चाहिए।', label: 'समाधान (Right now)', translation: 'right now.' },
        },
      ],
      finalSentence: 'आवश्यक, मुझे डॉक्टर से जांच के लिए परामर्श चाहिए।',
      englishTranslation: 'Urgent, I need to meet the medical officer for checkup.',
    },
    // --- Track 5: Gratitude (हिंदी) ---
    {
      id: 'closing_gratitude_hi',
      category: 'धन्यवाद (Gratitude & Closing)',
      steps: [
        {
          OPEN_PALM: { token: 'धन्यवाद,', label: 'कृतज्ञता (Thank you)', translation: 'Thank you,' },
          CLOSED_FIST: { token: 'बहुत बढ़िया,', label: 'स्वीकृति (Awesome)', translation: 'Perfect,' },
        },
        {
          INDEX_POINT: { token: 'मेरी समस्या', label: 'स्थिति (My problem)', translation: 'that resolved' },
          PEACE_V: { token: 'मुझे समझ आ गया', label: 'स्थिति (Understood)', translation: 'I understood' },
        },
        {
          PEACE_V: { token: 'पूरी तरह', label: 'विषय (Completely)', translation: 'my inquiry' },
          OPEN_PALM: { token: 'पूरी प्रक्रिया', label: 'विषय (Full process)', translation: 'the complete process' },
        },
        {
          THUMBS_UP: { token: 'हल हो गई।', label: 'निष्कर्ष (Resolved)', translation: 'completely.' },
          OK_PINCH: { token: 'अच्छी तरह से।', label: 'निष्कर्ष (Very well)', translation: 'very well.' },
        },
      ],
      finalSentence: 'धन्यवाद, मेरी समस्या पूरी तरह हल हो गई।',
      englishTranslation: 'Thank you, that resolved my inquiry completely.',
    },
  ],
  ta: [
    // --- Track 1: Campus Helpdesk (தமிழ்) ---
    {
      id: 'campus_helpdesk_ta',
      category: 'வளாக உதவி மையம் (Campus Helpdesk)',
      steps: [
        {
          OPEN_PALM: { token: 'வணக்கம்,', label: 'வாழ்த்து (Hello)', translation: 'Hello,' },
          CLOSED_FIST: { token: 'மன்னிக்கவும்,', label: 'கவனம் (Excuse me)', translation: 'Excuse me,' },
        },
        {
          INDEX_POINT: { token: 'தயவுசெய்து சொல்லுங்கள்', label: 'விசாரிப்பு (Please tell)', translation: 'please tell me' },
          PEACE_V: { token: 'வழிகாட்ட முடியுமா', label: 'வழிகாட்டல் (Can guide)', translation: 'can you guide me to' },
        },
        {
          PEACE_V: { token: 'மாணவர் சேர்க்கை', label: 'பொருள் (Student admission)', translation: 'the student registration' },
          OPEN_PALM: { token: 'மத்திய சேர்க்கை', label: 'பொருள் (Central admissions)', translation: 'the central admissions' },
        },
        {
          THUMBS_UP: { token: 'உதவி மையம் எங்கே?', label: 'இலக்கு (Where is desk?)', translation: 'helpdesk counter?' },
          OK_PINCH: { token: 'அலுவலகம் எங்கே உள்ளது?', label: 'இலக்கு (Where is office?)', translation: 'office room?' },
        },
      ],
      finalSentence: 'வணக்கம், மாணவர் சேர்க்கை உதவி மையம் எங்கே உள்ளது?',
      englishTranslation: 'Hello, where is the student registration helpdesk counter?',
    },
    // --- Track 2: Accounts & Fees (தமிழ்) ---
    {
      id: 'fee_accounts_ta',
      category: 'கல்வி கட்டணம் (Accounts & Fees)',
      steps: [
        {
          CLOSED_FIST: { token: 'மன்னிக்கவும்,', label: 'கவனம் (Excuse me)', translation: 'Excuse me,' },
          OPEN_PALM: { token: 'காலை வணக்கம்,', label: 'வாழ்த்து (Good morning)', translation: 'Good morning,' },
        },
        {
          INDEX_POINT: { token: 'எனக்கு கல்வி கட்டண', label: 'செயல் (Fee assistance)', translation: 'I need assistance' },
          PEACE_V: { token: 'தயவுசெய்து சரிபாருங்கள்', label: 'சரிபார்த்தல் (Verify)', translation: 'please verify' },
        },
        {
          PEACE_V: { token: 'ரசீது சரிபார்ப்பில்', label: 'பொருள் (Receipt verification)', translation: 'with semester fee receipt' },
          OPEN_PALM: { token: 'உதவித்தொகை படிவத்தில்', label: 'பொருள் (Scholarship form)', translation: 'with scholarship clearance' },
        },
        {
          THUMBS_UP: { token: 'உதவி வேண்டும்.', label: 'தீர்வு (Need help)', translation: 'verification.' },
          OK_PINCH: { token: 'ஒப்புதல் வேண்டும்.', label: 'தீர்வு (Need approval)', translation: 'approval.' },
        },
      ],
      finalSentence: 'மன்னிக்கவும், எனக்கு கல்வி கட்டண ரசீது சரிபார்ப்பில் உதவி வேண்டும்.',
      englishTranslation: 'Excuse me, I need assistance with semester fee receipt verification.',
    },
    // --- Track 3: Central Library (தமிழ்) ---
    {
      id: 'library_resources_ta',
      category: 'நூலக சேவைகள் (Library Services)',
      steps: [
        {
          OPEN_PALM: { token: 'காலை வணக்கம்,', label: 'வாழ்த்து (Good morning)', translation: 'Good morning,' },
          CLOSED_FIST: { token: 'வணக்கம்,', label: 'வாழ்த்து (Hello)', translation: 'Hello,' },
        },
        {
          INDEX_POINT: { token: 'மத்திய நூலக', label: 'விசாரிப்பு (Central library)', translation: 'can you guide me' },
          PEACE_V: { token: 'நான் தேடுகிறேன்', label: 'தேடல் (Searching)', translation: 'I am searching' },
        },
        {
          PEACE_V: { token: 'ஆராய்ச்சி பகுதிக்கு', label: 'இடம் (Reference section)', translation: 'to the central library' },
          OPEN_PALM: { token: 'டிஜிட்டல் புத்தகங்களை', label: 'பொருள் (Digital books)', translation: 'for digital book archives' },
        },
        {
          THUMBS_UP: { token: 'வழிகாட்ட முடியுமா?', label: 'இலக்கு (Guide way?)', translation: 'reference section?' },
          OK_PINCH: { token: 'படிக்கும் பகுதி எங்கே?', label: 'இலக்கு (Study area?)', translation: 'study zone?' },
        },
      ],
      finalSentence: 'காலை வணக்கம், மத்திய நூலக ஆராய்ச்சி பகுதிக்கு வழிகாட்ட முடியுமா?',
      englishTranslation: 'Good morning, can you guide me to the central library reference section?',
    },
    // --- Track 4: Hospital Triage (தமிழ்) ---
    {
      id: 'medical_triage_ta',
      category: 'மருத்துவமனை வரவேற்பு (Hospital Triage)',
      steps: [
        {
          CLOSED_FIST: { token: 'அவசரம்,', label: 'எச்சரிக்கை (Urgent)', translation: 'Urgent,' },
          OPEN_PALM: { token: 'வணக்கம் மருத்துவர்,', label: 'வாழ்த்து (Hello doctor)', translation: 'Hello doctor,' },
        },
        {
          INDEX_POINT: { token: 'மருத்துவர் ஆலோசனை', label: 'செயல் (Doctor meet)', translation: 'I need to meet' },
          PEACE_V: { token: 'தயவுசெய்து ஏற்பாடு செய்யுங்கள்', label: 'கோரிக்கை (Arrange)', translation: 'please arrange' },
        },
        {
          PEACE_V: { token: 'பரிசோதனைக்கு', label: 'பொருள் (For checkup)', translation: 'the medical officer' },
          OPEN_PALM: { token: 'உடனடி ஆலோசனை', label: 'பொருள் (Consultation)', translation: 'immediate consultation' },
        },
        {
          THUMBS_UP: { token: 'உடனே வேண்டும்.', label: 'தீர்வு (Right now)', translation: 'for checkup.' },
          OK_PINCH: { token: 'இப்போதே வேண்டும்.', label: 'தீர்வு (Immediately)', translation: 'right now.' },
        },
      ],
      finalSentence: 'அவசரம், மருத்துவர் ஆலோசனை பரிசோதனைக்கு உடனே வேண்டும்.',
      englishTranslation: 'Urgent, I need to meet the medical officer for checkup.',
    },
    // --- Track 5: Gratitude (தமிழ்) ---
    {
      id: 'closing_gratitude_ta',
      category: 'நன்றி தெரிவிப்பு (Gratitude & Closing)',
      steps: [
        {
          OPEN_PALM: { token: 'மிக்க நன்றி,', label: 'நன்றி (Thank you)', translation: 'Thank you,' },
          CLOSED_FIST: { token: 'மிக நன்று,', label: 'ஏற்பு (Perfect)', translation: 'Perfect,' },
        },
        {
          INDEX_POINT: { token: 'எனது கேள்விக்கு', label: 'நிலை (My question)', translation: 'that resolved' },
          PEACE_V: { token: 'நான் புரிந்து கொண்டேன்', label: 'நிலை (Understood)', translation: 'I understood' },
        },
        {
          PEACE_V: { token: 'முழுமையான', label: 'பொருள் (Complete)', translation: 'my inquiry' },
          OPEN_PALM: { token: 'முழு நடைமுறையும்', label: 'பொருள் (Full process)', translation: 'the complete process' },
        },
        {
          THUMBS_UP: { token: 'தீர்வு கிடைத்தது.', label: 'முடிவு (Resolved)', translation: 'completely.' },
          OK_PINCH: { token: 'மிகச் சிறப்பாக.', label: 'முடிவு (Very well)', translation: 'very well.' },
        },
      ],
      finalSentence: 'மிக்க நன்றி, எனது கேள்விக்கு முழுமையான தீர்வு கிடைத்தது.',
      englishTranslation: 'Thank you, that resolved my inquiry completely.',
    },
  ],
};

export const SCENARIOS = MULTILINGUAL_SCENARIOS.en;

export interface GestureIngestResult {
  token: string | null;
  label?: string;
  translation?: string;
  isSentenceComplete: boolean;
  fullSentence?: string;
  englishTranslation?: string;
  stepIndex: number;
  totalSteps: number;
  category: string;
}

export class ScenarioEngineManager {
  private currentLanguage: SupportedLanguage = 'en';
  private activeScenarioIndex = 0;
  private currentStepIndex = 0;
  private accumulatedTokens: string[] = [];
  private completedTranscripts: string[] = [];
  private completedTranslations: string[] = [];
  private lastShape: HandShape = 'UNKNOWN';
  private lastTriggerTime = 0;

  public setLanguage(lang: SupportedLanguage) {
    if (this.currentLanguage === lang) return;
    this.currentLanguage = lang;
    this.activeScenarioIndex = 0;
    this.currentStepIndex = 0;
    this.accumulatedTokens = [];
    this.lastShape = 'UNKNOWN';
    multilingualSpeechEngine.kill();
  }

  public getLanguage(): SupportedLanguage {
    return this.currentLanguage;
  }

  public getScenarios(): SentenceScenario[] {
    return MULTILINGUAL_SCENARIOS[this.currentLanguage] || MULTILINGUAL_SCENARIOS.en;
  }

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

    const scenarios = this.getScenarios();
    const scenario = scenarios[this.activeScenarioIndex % scenarios.length];
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

    // Play feedback tone & speak token in selected language
    audioLatchEngine.playCommitTone();
    multilingualSpeechEngine.speak(token, this.currentLanguage);

    const stepCompleted = this.currentStepIndex + 1;
    this.currentStepIndex++;

    // Check if full sentence is assembled
    if (this.currentStepIndex >= scenario.steps.length) {
      const fullSentence = this.accumulatedTokens.join(' ');
      this.completedTranscripts.push(fullSentence);
      if (scenario.englishTranslation) {
        this.completedTranslations.push(scenario.englishTranslation);
      }

      // Speak complete synthesized sentence with natural cadence in selected language
      setTimeout(() => {
        multilingualSpeechEngine.speak(fullSentence, this.currentLanguage);
      }, 550);

      // Advance to next scenario track
      this.activeScenarioIndex = (this.activeScenarioIndex + 1) % scenarios.length;
      this.currentStepIndex = 0;
      this.accumulatedTokens = [];

      return {
        token,
        label: match.label,
        translation: match.translation,
        isSentenceComplete: true,
        fullSentence,
        englishTranslation: scenario.englishTranslation,
        stepIndex: stepCompleted,
        totalSteps: scenario.steps.length,
        category: scenario.category,
      };
    }

    return {
      token,
      label: match.label,
      translation: match.translation,
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

  public getTranslations(): string[] {
    return this.completedTranslations;
  }

  public getActiveCategory(): string {
    const scenarios = this.getScenarios();
    return scenarios[this.activeScenarioIndex % scenarios.length]?.category || 'Campus Helpdesk';
  }

  public getActiveScenario(): SentenceScenario {
    const scenarios = this.getScenarios();
    return scenarios[this.activeScenarioIndex % scenarios.length];
  }

  public getCurrentStepIndex(): number {
    return this.currentStepIndex;
  }

  public getTotalSteps(): number {
    const scenarios = this.getScenarios();
    return scenarios[this.activeScenarioIndex % scenarios.length]?.steps.length || 4;
  }

  public getAvailableOptionsForCurrentStep(): Array<{
    shape: HandShape;
    token: string;
    label: string;
    translation?: string;
  }> {
    const scenarios = this.getScenarios();
    const scenario = scenarios[this.activeScenarioIndex % scenarios.length];
    const currentStepConfig = scenario?.steps[this.currentStepIndex] || {};
    return Object.entries(currentStepConfig).map(([shape, item]) => ({
      shape: shape as HandShape,
      token: item.token,
      label: item.label,
      translation: item.translation,
    }));
  }

  public reset(): void {
    this.activeScenarioIndex = 0;
    this.currentStepIndex = 0;
    this.accumulatedTokens = [];
    this.completedTranscripts = [];
    this.completedTranslations = [];
    this.lastShape = 'UNKNOWN';
    audioLatchEngine.killAllSpeech();
    multilingualSpeechEngine.kill();
  }
}

export const scenarioEngineManager = new ScenarioEngineManager();
