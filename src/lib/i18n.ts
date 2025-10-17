import { useEffect, useMemo, useState } from 'react';
import { settingsManager } from './historyManager';

// Minimal i18n dictionary (English/Hindi) for key UI strings
const dict = {
  en: {
    appName: 'AI Assistant',
    subtitle: 'Chat + Voice + AI Tools',
    chat: 'Chat',
    voice: 'Voice',
    aiTools: 'AI Tools',
    chatHeader: 'Chat Assistant',
    chatTagline: 'Have a conversation with your AI assistant',
    settings: 'Settings',
    profile: 'Profile',
    notifications: 'Notifications',
    home: 'Home',
    chatPlaceholder: 'Type your message...',
    newChat: 'New Chat',
    send: 'Send',
    tokenUsedToday: 'Used today',
    upgradePlan: 'Upgrade plan',
    performanceReduceLoad: 'Reduce Load',
    performanceDesc: 'Toggle for a faster, more efficient experience',
    language: 'Language',
    english: 'English',
    hindi: 'Hindi',
    reminderInApp: 'In-app notification',
    reminderEmail: 'Email notification',
    saveChanges: 'Save Changes',
    resetDefaults: 'Reset to Defaults',
    pricing: 'Pricing',
    logout: 'Logout',
    // Voice
    voiceAssistantTitle: 'Voice Assistant',
    voiceAssistantSubtitle: 'Speak naturally and let AI understand you',
    startRecording: 'Start Recording',
    stopRecording: 'Stop Recording',
    history: 'History',
    transcript: 'Transcript',
    recognized: 'Recognized',
    assistant: 'Assistant',
    noRecordingsYet: 'No recordings yet',
    deleteRecordingQuestion: 'Delete this recording?',
    youLabel: 'You',
    assistantLabel: 'Assistant',
    dailyTokenLimitReached: 'Daily token limit reached',
    dailyTokenLimitMessage: "You've used your daily token limit. To continue, add your own API key or upgrade your plan.",
    addApiKey: 'Add API Key',
    viewPricing: 'View Pricing',
    deleteConversationQuestion: 'Delete this conversation?',
    demoAiResponse: 'I understand your message. This is a demo response. In a real application, this would connect to an AI service.',
  },
  hi: {
    appName: 'एआई सहायक',
    subtitle: 'चैट • वॉइस • एआई टूल्स',
    chat: 'चैट',
    voice: 'वॉइस',
    aiTools: 'एआई टूल्स',
    chatHeader: 'चैट सहायक',
    chatTagline: 'अपने एआई सहायक के साथ बातचीत करें',
    settings: 'सेटिंग्स',
    profile: 'प्रोफ़ाइल',
    notifications: 'सूचनाएं',
    home: 'होम',
    chatPlaceholder: 'अपना संदेश लिखें...',
    newChat: 'नया चैट',
    send: 'भेजें',
    tokenUsedToday: 'आज उपयोग',
    upgradePlan: 'प्लान अपग्रेड करें',
    performanceReduceLoad: 'कम लोड',
    performanceDesc: 'तेज़ और कुशल अनुभव के लिए टॉगल',
    language: 'भाषा',
    english: 'अंग्रेज़ी',
    hindi: 'हिंदी',
    reminderInApp: 'इन-ऐप सूचना',
    reminderEmail: 'ईमेल सूचना',
    saveChanges: 'परिवर्तन सहेजें',
    resetDefaults: 'डिफ़ॉल्ट पर रीसेट',
    pricing: 'मूल्य निर्धारण',
    logout: 'लॉगआउट',
    // Voice
    voiceAssistantTitle: 'वॉइस सहायक',
    voiceAssistantSubtitle: 'स्वाभाविक रूप से बोलें और एआई आपको समझे',
    startRecording: 'रिकॉर्डिंग शुरू करें',
    stopRecording: 'रिकॉर्डिंग रोकें',
    history: 'इतिहास',
    transcript: 'ट्रांसक्रिप्ट',
    recognized: 'पहचाना गया',
    assistant: 'सहायक',
    noRecordingsYet: 'अभी कोई रिकॉर्डिंग नहीं',
    deleteRecordingQuestion: 'क्या आप यह रिकॉर्डिंग हटाना चाहते हैं?',
    youLabel: 'आप',
    assistantLabel: 'सहायक',
    dailyTokenLimitReached: 'दैनिक टोकन सीमा पूरी हो गई',
    dailyTokenLimitMessage: 'आपने आज की टोकन सीमा का उपयोग कर लिया है। जारी रखने के लिए अपनी API कुंजी जोड़ें या अपना प्लान अपग्रेड करें।',
    addApiKey: 'API कुंजी जोड़ें',
    viewPricing: 'मूल्य देखें',
    deleteConversationQuestion: 'क्या आप यह बातचीत हटाना चाहते हैं?',
    demoAiResponse: 'मैंने आपका संदेश समझ लिया। यह एक डेमो प्रतिक्रिया है। असली एप्लिकेशन में, यह किसी एआई सेवा से जुड़ेगा।',
  }
};

export function t(key: keyof typeof dict['en']): string {
  const lang = settingsManager.get().language || 'en';
  const table = dict[lang as 'en'|'hi'] || dict.en;
  return (table as any)[key] || key;
}

export function useI18n() {
  const [lang, setLang] = useState<'en'|'hi'>(settingsManager.get().language || 'en');
  useEffect(() => {
    const onSettings = (e: any) => setLang((e?.detail?.language) || settingsManager.get().language || 'en');
    window.addEventListener('ai_settings_updated', onSettings as any);
    return () => window.removeEventListener('ai_settings_updated', onSettings as any);
  }, []);
  const table = useMemo(()=> dict[lang] || dict.en, [lang]);
  return { lang, table, t: (key: keyof typeof dict['en']) => (table as any)[key] || key };
}
