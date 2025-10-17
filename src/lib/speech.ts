import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import Speech from 'speak-tts';

export type ASRState = 'idle' | 'listening' | 'processing' | 'responding';

const tts = new Speech();
let ttsReady = false;
if (tts.hasBrowserSupport()) {
  tts
    .init({
      volume: 1,
      lang: 'en-US',
      rate: 1,
      pitch: 1,
      splitSentences: true,
    })
    .then(() => {
      ttsReady = true;
    })
    .catch(() => {
      ttsReady = false;
    });
}

export function speak(text: string): Promise<void> {
  if (!ttsReady) return Promise.resolve();
  return tts.speak({ text }).then(() => undefined);
}

export function stopSpeaking(): void {
  try { tts.cancel(); } catch{}
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
