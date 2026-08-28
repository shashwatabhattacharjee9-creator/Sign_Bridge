export type SupportedLanguage = 'en' | 'hi' | 'ta';

export interface ScriptWord {
  token: string;
  speechText: string;
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
  // 1. ENGLISH (INDIA) DATASET
  // ==========================================
  en: {
    id: 'en',
    label: 'English',
    nativeLabel: 'English',
    ttsLocale: 'en-IN',
    flag: '🇮🇳',
    studioScenarios: [
      {
        category: 'Campus Admissions & Helpdesk',
        flow: [
          { token: 'Hello,', speechText: 'Hello' },
          { token: 'where is', speechText: 'where is' },
          { token: 'the central admissions', speechText: 'the central admissions' },
          { token: 'and registration desk?', speechText: 'and registration desk?' },
        ],
      },
      {
        category: 'Accounts & Fee Clearance',
        flow: [
          { token: 'Excuse me,', speechText: 'Excuse me' },
          { token: 'I need assistance', speechText: 'I need assistance' },
          { token: 'with semester fee', speechText: 'with semester fee' },
          { token: 'receipt verification.', speechText: 'receipt verification' },
        ],
      },
      {
        category: 'Central Library & Archives',
        flow: [
          { token: 'Good morning,', speechText: 'Good morning' },
          { token: 'can you guide me', speechText: 'can you guide me' },
          { token: 'to the digital research', speechText: 'to the digital research' },
          { token: 'reference section?', speechText: 'reference section' },
        ],
      },
      {
        category: 'Department & Faculty Office',
        flow: [
          { token: 'Please inform me,', speechText: 'Please inform me' },
          { token: 'which floor is', speechText: 'which floor is' },
          { token: 'the department head', speechText: 'the department head' },
          { token: 'office located on?', speechText: 'office located on?' },
        ],
      },
      {
        category: 'Hostel & Residential Helpdesk',
        flow: [
          { token: 'Hello warden,', speechText: 'Hello warden' },
          { token: 'I want to collect', speechText: 'I want to collect' },
          { token: 'my hostel room allotment', speechText: 'my hostel room allotment' },
          { token: 'clearance slip.', speechText: 'clearance slip' },
        ],
      },
      {
        category: 'Campus Transit & Bus Route',
        flow: [
          { token: 'Excuse me,', speechText: 'Excuse me' },
          { token: 'which campus shuttle', speechText: 'which campus shuttle' },
          { token: 'goes toward', speechText: 'goes toward' },
          { token: 'the main railway station?', speechText: 'the main railway station' },
        ],
      },
      {
        category: 'Medical Clinic & Emergency Triage',
        flow: [
          { token: 'Urgent assistance,', speechText: 'Urgent assistance' },
          { token: 'I need to consult', speechText: 'I need to consult' },
          { token: 'the duty doctor', speechText: 'the duty doctor' },
          { token: 'for medical triage.', speechText: 'for medical triage' },
        ],
      },
      {
        category: 'General Resolution & Gratitude',
        flow: [
          { token: 'Thank you very much,', speechText: 'Thank you very much' },
          { token: 'that resolved', speechText: 'that resolved' },
          { token: 'my inquiry', speechText: 'my inquiry' },
          { token: 'completely today.', speechText: 'completely today' },
        ],
      },
    ],
    peerDialogue: {
      signerA: [
        [
          { token: 'Hey friend,', speechText: 'Hey friend' },
          { token: 'did you submit', speechText: 'did you submit' },
          { token: 'the project report', speechText: 'the project report' },
          { token: 'at the counter?', speechText: 'at the counter' },
        ],
        [
          { token: 'Yes,', speechText: 'Yes' },
          { token: 'let us head', speechText: 'let us head' },
          { token: 'to the cafeteria', speechText: 'to the cafeteria' },
          { token: 'for lunch now.', speechText: 'for lunch now' },
        ],
        [
          { token: 'See you', speechText: 'See you' },
          { token: 'in the evening', speechText: 'in the evening' },
          { token: 'near the main gate.', speechText: 'near the main gate' },
        ],
      ],
      signerB: [
        [
          { token: 'Yes,', speechText: 'Yes' },
          { token: 'I submitted it', speechText: 'I submitted it' },
          { token: 'and got the seal.', speechText: 'and got the seal' },
          { token: 'Are you free for lunch?', speechText: 'Are you free for lunch?' },
        ],
        [
          { token: 'Awesome,', speechText: 'Awesome' },
          { token: 'I am starving,', speechText: 'I am starving' },
          { token: 'let us walk together.', speechText: 'let us walk together' },
        ],
        [
          { token: 'Perfect,', speechText: 'Perfect' },
          { token: 'have a great', speechText: 'have a great' },
          { token: 'rest of the day!', speechText: 'rest of the day' },
        ],
      ],
    },
  },

  // ==========================================
  // 2. HINDI (हिंदी) DATASET
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
          { token: 'नमस्ते,', speechText: 'नमस्ते' },
          { token: 'कृपया बताएं', speechText: 'कृपया बताएं' },
          { token: 'विद्यार्थी रजिस्ट्रेशन', speechText: 'विद्यार्थी रजिस्ट्रेशन' },
          { token: 'हेल्पडेस्क कहाँ है?', speechText: 'हेल्पडेस्क कहाँ है?' },
        ],
      },
      {
        category: 'फीस और रसीद सत्यापन (Fee Accounts)',
        flow: [
          { token: 'माफ कीजियेगा,', speechText: 'माफ कीजियेगा' },
          { token: 'मुझे सेमेस्टर फीस', speechText: 'मुझे सेमेस्टर फीस' },
          { token: 'रसीद सत्यापन में', speechText: 'रसीद सत्यापन में' },
          { token: 'सहायता चाहिए।', speechText: 'सहायता चाहिए।' },
        ],
      },
      {
        category: 'केंद्रीय पुस्तकालय (Central Library)',
        flow: [
          { token: 'शुभ प्रभात,', speechText: 'शुभ प्रभात' },
          { token: 'क्या आप मुझे', speechText: 'क्या आप मुझे' },
          { token: 'केंद्रीय पुस्तकालय का', speechText: 'केंद्रीय पुस्तकालय का' },
          { token: 'रास्ता बता सकते हैं?', speechText: 'रास्ता बता सकते हैं?' },
        ],
      },
      {
        category: 'विभागाध्यक्ष कार्यालय (Department Office)',
        flow: [
          { token: 'कृपया जानकारी दें,', speechText: 'कृपया जानकारी दें' },
          { token: 'विभाग प्रमुख का', speechText: 'विभाग प्रमुख का' },
          { token: 'कार्यालय किस मंजिल पर', speechText: 'कार्यालय किस मंजिल पर' },
          { token: 'स्थित है?', speechText: 'स्थित है?' },
        ],
      },
      {
        category: 'छात्रावास सहायता (Hostel Support)',
        flow: [
          { token: 'नमस्ते वार्डन सर,', speechText: 'नमस्ते वार्डन सर' },
          { token: 'मुझे छात्रावास कमरा', speechText: 'मुझे छात्रावास कमरा' },
          { token: 'आवंटन पत्र', speechText: 'आवंटन पत्र' },
          { token: 'प्राप्त करना है।', speechText: 'प्राप्त करना है।' },
        ],
      },
      {
        category: 'परिवहन सेवा (Campus Transport)',
        flow: [
          { token: 'कृपया बताएं,', speechText: 'कृपया बताएं' },
          { token: 'मुख्य रेलवे स्टेशन', speechText: 'मुख्य रेलवे स्टेशन' },
          { token: 'जाने वाली बस', speechText: 'जाने वाली बस' },
          { token: 'कब आएगी?', speechText: 'कब आएगी?' },
        ],
      },
      {
        category: 'चिकित्सालय आपातकाल (Medical Clinic)',
        flow: [
          { token: 'आपातकालीन सहायता,', speechText: 'आपातकालीन सहायता' },
          { token: 'मुझे जांच के लिए', speechText: 'मुझे जांच के लिए' },
          { token: 'ड्यूटी डॉक्टर से', speechText: 'ड्यूटी डॉक्टर से' },
          { token: 'तुरंत मिलना है।', speechText: 'तुरंत मिलना है।' },
        ],
      },
      {
        category: 'धन्यवाद और समापन (Gratitude)',
        flow: [
          { token: 'बहुत बहुत धन्यवाद,', speechText: 'बहुत बहुत धन्यवाद' },
          { token: 'मेरी सभी समस्याएं', speechText: 'मेरी सभी समस्याएं' },
          { token: 'पूरी तरह से', speechText: 'पूरी तरह से' },
          { token: 'हल हो गईं।', speechText: 'हल हो गईं।' },
        ],
      },
    ],
    peerDialogue: {
      signerA: [
        [
          { token: 'सुनो दोस्त,', speechText: 'सुनो दोस्त' },
          { token: 'क्या तुमने', speechText: 'क्या तुमने' },
          { token: 'प्रोजेक्ट रिपोर्ट', speechText: 'प्रोजेक्ट रिपोर्ट' },
          { token: 'जमा कर दी?', speechText: 'जमा कर दी?' },
        ],
        [
          { token: 'हाँ,', speechText: 'हाँ' },
          { token: 'चलो साथ में', speechText: 'चलो साथ में' },
          { token: 'कैंटीन में', speechText: 'कैंटीन में' },
          { token: 'खाना खाते हैं।', speechText: 'खाना खाते हैं।' },
        ],
        [
          { token: 'शाम को', speechText: 'शाम को' },
          { token: 'मुख्य गेट पर', speechText: 'मुख्य गेट पर' },
          { token: 'मिलते हैं।', speechText: 'मिलते हैं।' },
        ],
      ],
      signerB: [
        [
          { token: 'हाँ भाई,', speechText: 'हाँ भाई' },
          { token: 'मैंने काउंटर पर', speechText: 'मैंने काउंटर पर' },
          { token: 'जमा करवा दिया।', speechText: 'जमा करवा दिया।' },
          { token: 'क्या तुम लंच के लिए फ्री हो?', speechText: 'क्या तुम लंच के लिए फ्री हो?' },
        ],
        [
          { token: 'बहुत बढ़िया,', speechText: 'बहुत बढ़िया' },
          { token: 'मुझे बहुत भूख लगी है,', speechText: 'मुझे बहुत भूख लगी है' },
          { token: 'चलो साथ चलते हैं।', speechText: 'चलो साथ चलते हैं।' },
        ],
        [
          { token: 'बिल्कुल सही,', speechText: 'बिल्कुल सही' },
          { token: 'तुम्हारा दिन', speechText: 'तुम्हारा दिन' },
          { token: 'शुभ रहे!', speechText: 'शुभ रहे!' },
        ],
      ],
    },
  },

  // ==========================================
  // 3. TAMIL (தமிழ்) DATASET
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
          { token: 'வணக்கம்,', speechText: 'வணக்கம்' },
          { token: 'மாணவர் சேர்க்கை', speechText: 'மாணவர் சேர்க்கை' },
          { token: 'உதவி மையம்', speechText: 'உதவி மையம்' },
          { token: 'எங்கே உள்ளது?', speechText: 'எங்கே உள்ளது?' },
        ],
      },
      {
        category: 'கட்டண சரிபார்ப்பு (Fee Verification)',
        flow: [
          { token: 'மன்னிக்கவும்,', speechText: 'மன்னிக்கவும்' },
          { token: 'எனக்கு கல்விக் கட்டண', speechText: 'எனக்கு கல்விக் கட்டண' },
          { token: 'ரசீது சரிபார்ப்பில்', speechText: 'ரசீது சரிபார்ப்பில்' },
          { token: 'உதவி தேவை.', speechText: 'உதவி தேவை.' },
        ],
      },
      {
        category: 'மைய நூலகம் (Central Library)',
        flow: [
          { token: 'காலை வணக்கம்,', speechText: 'காலை வணக்கம்' },
          { token: 'மைய நூலகத்தின்', speechText: 'மைய நூலகத்தின்' },
          { token: 'ஆராய்ச்சி பிரிவிற்கு', speechText: 'ஆராய்ச்சி பிரிவிற்கு' },
          { token: 'வழிகாட்ட முடியுமா?', speechText: 'வழிகாட்ட முடியுமா?' },
        ],
      },
      {
        category: 'துறை தலைவர் அலுவலகம் (HOD Office)',
        flow: [
          { token: 'தயவுசெய்து கூறுங்கள்,', speechText: 'தயவுசெய்து கூறுங்கள்' },
          { token: 'துறை தலைவர்', speechText: 'துறை தலைவர்' },
          { token: 'அலுவலகம் எந்த தளத்தில்', speechText: 'அலுவலகம் எந்த தளத்தில்' },
          { token: 'உள்ளது?', speechText: 'உள்ளது?' },
        ],
      },
      {
        category: 'விடுதி நிர்வாகம் (Hostel Support)',
        flow: [
          { token: 'வணக்கம் வார்டன்,', speechText: 'வணக்கம் வார்டன்' },
          { token: 'எனது விடுதி அறை', speechText: 'எனது விடுதி அறை' },
          { token: 'ஒதுக்கீட்டு படிவத்தை', speechText: 'ஒதுக்கீட்டு படிவத்தை' },
          { token: 'பெற வேண்டும்.', speechText: 'பெற வேண்டும்.' },
        ],
      },
      {
        category: 'வளாக பேருந்து (Campus Transit)',
        flow: [
          { token: 'மன்னிக்கவும்,', speechText: 'மன்னிக்கவும்' },
          { token: 'முக்கிய ரயில் நிலையம்', speechText: 'முக்கிய ரயில் நிலையம்' },
          { token: 'செல்லும் பேருந்து', speechText: 'செல்லும் பேருந்து' },
          { token: 'எப்போது வரும்?', speechText: 'எப்போது வரும்?' },
        ],
      },
      {
        category: 'மருத்துவ அவசர உதவி (Medical Clinic)',
        flow: [
          { token: 'அவசர உதவி,', speechText: 'அவசர உதவி' },
          { token: 'பரிசோதனைக்காக', speechText: 'பரிசோதனைக்காக' },
          { token: 'மருத்துவரை உடனே', speechText: 'மருத்துவரை உடனே' },
          { token: 'பார்க்க வேண்டும்.', speechText: 'பார்க்க வேண்டும்.' },
        ],
      },
      {
        category: 'நன்றி செலுத்துதல் (Gratitude)',
        flow: [
          { token: 'மிக்க நன்றி,', speechText: 'மிக்க நன்றி' },
          { token: 'எனது அனைத்து கேள்விகளுக்கும்', speechText: 'எனது அனைத்து கேள்விகளுக்கும்' },
          { token: 'முழுமையான தீர்வு', speechText: 'முழுமையான தீர்வு' },
          { token: 'கிடைத்துவிட்டது.', speechText: 'கிடைத்துவிட்டது.' },
        ],
      },
    ],
    peerDialogue: {
      signerA: [
        [
          { token: 'வணக்கம் நண்பா,', speechText: 'வணக்கம் நண்பா' },
          { token: 'திட்ட அறிக்கையை', speechText: 'திட்ட அறிக்கையை' },
          { token: 'கவுண்டரில்', speechText: 'கவுண்டரில்' },
          { token: 'சமர்ப்பித்து விட்டாயா?', speechText: 'சமர்ப்பித்து விட்டாயா?' },
        ],
        [
          { token: 'ஆம்,', speechText: 'ஆம்' },
          { token: 'வா நாம் உணவகத்திற்கு', speechText: 'வா நாம் உணவகத்திற்கு' },
          { token: 'மதிய உணவுக்கு', speechText: 'மதிய உணவுக்கு' },
          { token: 'செல்லலாம்.', speechText: 'செல்லலாம்.' },
        ],
        [
          { token: 'மாலையில்', speechText: 'மாலையில்' },
          { token: 'முக்கிய நுழைவாயிலில்', speechText: 'முக்கிய நுழைவாயிலில்' },
          { token: 'சந்திப்போம்.', speechText: 'சந்திப்போம்.' },
        ],
      ],
      signerB: [
        [
          { token: 'ஆம் தோழா,', speechText: 'ஆம் தோழா' },
          { token: 'இரண்டாம் கவுண்டரில்', speechText: 'இரண்டாம் கவுண்டரில்' },
          { token: 'கொடுத்துவிட்டேன்.', speechText: 'கொடுத்துவிட்டேன்.' },
          { token: 'நீ மதிய உணவுக்கு வருகிறாயா?', speechText: 'நீ மதிய உணவுக்கு வருகிறாயா?' },
        ],
        [
          { token: 'மகிழ்ச்சி,', speechText: 'மகிழ்ச்சி' },
          { token: 'எனக்கு பசிக்கிறது,', speechText: 'எனக்கு பசிக்கிறது' },
          { token: 'வா உடனே போவோம்.', speechText: 'வா உடனே போவோம்.' },
        ],
        [
          { token: 'சிறப்பு,', speechText: 'சிறப்பு' },
          { token: 'இனிய நாளாக', speechText: 'இனிய நாளாக' },
          { token: 'அமைய வாழ்த்துகள்!', speechText: 'அமைய வாழ்த்துகள்!' },
        ],
      ],
    },
  },
};

// Aliases for full backward compatibility
export const MULTILINGUAL_REGISTRY = MULTILINGUAL_DATA;
export type LanguageConfig = LanguagePack;
