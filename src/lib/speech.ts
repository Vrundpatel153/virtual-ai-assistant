import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { settingsManager } from './historyManager';

export type ASRState = 'idle' | 'listening' | 'processing' | 'responding';

export type VoiceLocale = 'en-US' | 'hi-IN';
export interface SpeakOptions {
  locale?: VoiceLocale;
  rateOverride?: number;
  pitchOverride?: number;
  disableSanitize?: boolean;
}

type ExtendedSpeechSynthesis = SpeechSynthesis & {
  onvoiceschanged?: (() => void) | null;
};

const synth: ExtendedSpeechSynthesis | null =
  typeof window !== 'undefined' && typeof window.speechSynthesis !== 'undefined'
    ? (window.speechSynthesis as ExtendedSpeechSynthesis)
    : null;

const HINDI_REGEX = /[\u0900-\u097F]/;
const ROMANIZED_HINDI_REGEX = /\b(kaise|kya|haan|nahi|nahin|theek|thik|mai|main|hoon|ho|tum|aap|hum|acha|achha|accha|bahut|shukriya|dhanyava?d|namaste|namaskar|pranam|kripya|kripaya|kripaa|krupya|dost|bhai|behen|swaagat|swagat|hello\s*ji|namaste\s*ji)\b/i;
const URL_REGEX = /(https?:\/\/|www\.)\S+/gi;
const MARKDOWN_SYMBOLS = /[*_`~>|#{}\[\]()<>]/g;
const BULLET_CHARS = /[•·▪●]/g;
const MULTI_SPACE = /\s{2,}/g;
const VOICE_PREFERENCES: Record<VoiceLocale, RegExp[]> = {
  'en-US': [
    /Google US English/i,
    /Google english \(United States\)/i,
    /Microsoft (Aria|Jenny|Guy|Natasha).*Online/i,
    /Microsoft (Aria|Jenny|Guy|Natasha)/i,
    /Samantha/i,
  ],
  'hi-IN': [
    /Google.*हिन्दी/i,
    /Google.*हिंदी/i,
    /Microsoft (Neerja|Sonal|Hemant).*Online/i,
    /Microsoft (Neerja|Sonal|Hemant)/i,
  ],
};
const VOICE_TWEAKS: Record<VoiceLocale, { rate: number; pitch: number }> = {
  'en-US': { rate: 0.95, pitch: 1 },
  'hi-IN': { rate: 0.9, pitch: 1.05 },
};

let cachedVoices: SpeechSynthesisVoice[] = [];
let voicesReadyPromise: Promise<void> | null = null;

const refreshVoices = () => {
  if (!synth) return;
  cachedVoices = synth.getVoices();
};

if (synth) {
  refreshVoices();
  if (typeof synth.addEventListener === 'function') {
    synth.addEventListener('voiceschanged', refreshVoices);
  } else {
    synth.onvoiceschanged = refreshVoices;
  }
}

const ensureVoicesReady = () => {
  if (!synth) return Promise.resolve();
  if (cachedVoices.length) return Promise.resolve();
  if (!voicesReadyPromise) {
    voicesReadyPromise = new Promise((resolve) => {
      const handle = () => {
        refreshVoices();
        cleanup();
        resolve();
      };
      const cleanup = () => {
        if (!synth) return;
        if (typeof synth.removeEventListener === 'function') {
          synth.removeEventListener('voiceschanged', handle);
        } else {
          synth.onvoiceschanged = null;
        }
        voicesReadyPromise = null;
      };
      if (synth) {
        if (typeof synth.addEventListener === 'function') {
          synth.addEventListener('voiceschanged', handle);
        } else {
          synth.onvoiceschanged = handle;
        }
      }
      // Fallback in case the event never fires
      setTimeout(() => {
        refreshVoices();
        cleanup();
        resolve();
      }, 1000);
    });
  }
  return voicesReadyPromise;
};

const detectLanguage = (text: string): VoiceLocale => {
  if (HINDI_REGEX.test(text) || ROMANIZED_HINDI_REGEX.test(text)) {
    return 'hi-IN';
  }
  const preferred = settingsManager.get().language;
  if (preferred === 'hi') return 'hi-IN';
  return 'en-US';
};

const pickVoice = (lang: VoiceLocale): SpeechSynthesisVoice | undefined => {
  if (!cachedVoices.length) return undefined;
  const prefs = VOICE_PREFERENCES[lang];
  for (const pref of prefs) {
    const match = cachedVoices.find((voice) => pref.test(voice.name));
    if (match) return match;
  }
  const lowerLang = lang.toLowerCase();
  const langPrefix = lang.split('-')[0];
  return (
    cachedVoices.find((voice) => voice.lang?.toLowerCase() === lowerLang) ||
    cachedVoices.find((voice) => voice.lang?.toLowerCase().startsWith(langPrefix))
  );
};

const sanitizeTextForSpeech = (input: string): string => {
  let text = input.replace(URL_REGEX, ' link ');
  text = text.replace(BULLET_CHARS, ', ');
  text = text.replace(MARKDOWN_SYMBOLS, ' ');
  text = text.replace(/&/g, ' and ');
  text = text.replace(/\bhttps\b/gi, 'link');
  text = text.replace(/\basterisk\b/gi, '');
  text = text.replace(/\s+-\s+/g, ', ');
  text = text.replace(/\r?\n+/g, '. ');
  text = text.replace(MULTI_SPACE, ' ');
  return text.trim();
};

export async function speak(text: string, options: SpeakOptions = {}): Promise<void> {
  if (!text?.trim() || !synth) return;
  try { synth.cancel(); } catch {}
  await ensureVoicesReady();

  const payload = options.disableSanitize ? text.trim() : sanitizeTextForSpeech(text) || text.trim();
  let lang = options.locale ?? detectLanguage(text);
  const utterance = new SpeechSynthesisUtterance(payload);
  let voice = pickVoice(lang);

  if (!voice && lang === 'hi-IN') {
    // Fallback to English voice if no Hindi voice is available on this device
    voice = pickVoice('en-US');
    if (voice?.lang) lang = voice.lang as VoiceLocale;
  }

  utterance.lang = lang;
  const tweak = VOICE_TWEAKS[lang] ?? { rate: 1, pitch: 1 };
  utterance.rate = options.rateOverride ?? tweak.rate;
  utterance.pitch = options.pitchOverride ?? tweak.pitch;
  utterance.volume = 1;
  if (voice) {
    utterance.voice = voice;
  }

  await new Promise<void>((resolve) => {
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    try {
      synth.speak(utterance);
    } catch {
      resolve();
    }
  });
}

export function stopSpeaking(): void {
  try { synth?.cancel(); } catch{}
}

export function isASRAvailable(): boolean {
  return SpeechRecognition.browserSupportsSpeechRecognition();
}

export function startListening(lang = 'en-US') {
  // Use non-continuous so it auto-stops on pause; enable interim for better UX
  return SpeechRecognition.startListening({ continuous: false, language: lang, interimResults: true });
}

export function stopListening() {
  return SpeechRecognition.stopListening();
}

export function useASR() {
  const rec = useSpeechRecognition();
  return rec; // { transcript, listening, resetTranscript, browserSupportsSpeechRecognition }
}
