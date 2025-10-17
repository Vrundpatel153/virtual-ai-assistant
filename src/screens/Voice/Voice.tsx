import { useState, useEffect } from "react";
import { Navbar } from "../../components/Navbar";
import { Mic, Square, Volume2, Activity, Clock, Trash2, History } from "lucide-react";
import { voiceHistoryManager, tokenManager, settingsManager } from "../../lib/historyManager";
import { useGlobalLoading } from "../../components/LoadingProvider";
import { Modal } from "../../components/Modal";
import { tryHandleMultiCommand } from "../../lib/commands";
import { useASR, isASRAvailable, startListening, stopListening, speak, stopSpeaking } from "../../lib/speech";
import { aiComplete } from "../../lib/ai";
import { t, useI18n } from "../../lib/i18n";

export const Voice = (): JSX.Element => {
  type VoiceState = 'idle' | 'listening' | 'processing' | 'responding';
  useI18n();
  const [state, setState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState<string[]>([]);
  const [history, setHistory] = useState(() => voiceHistoryManager.getAllRecords());
  const [showHistory, setShowHistory] = useState(false);
  const [limitOpen, setLimitOpen] = useState(false);
  const { setLoading } = useGlobalLoading();
  const [recognizedText, setRecognizedText] = useState<string>("");
  const [assistantReply, setAssistantReply] = useState<string>("");
  const asr = useASR();

  useEffect(() => {
    setHistory(voiceHistoryManager.getAllRecords());
  }, [transcript]);

  const handleToggleRecording = () => {
    if (state === 'idle') {
      if (!isASRAvailable()) {
        setAssistantReply(t('assistant'));
        return;
      }
      setAssistantReply("");
      setRecognizedText("");
      setState('listening');
      const lang = settingsManager.get().language === 'hi' ? 'hi-IN' : 'en-US';
      startListening(lang);
    } else {
      // Manual stop if required
      stopListening();
      stopSpeaking();
      setState('idle');
    }
  };

  // When ASR transcript updates and we leave listening, process it
  useEffect(() => {
    if (!asr.transcript) return;
    setRecognizedText(asr.transcript);
  }, [asr.transcript]);

  // Auto-detect end of speech: when ASR stops listening while we are in listening state, move to processing
  useEffect(() => {
    if (state === 'listening' && asr.listening === false) {
      setState('processing');
    }
  }, [asr.listening, state]);

  // When we enter processing state, handle the utterance
  useEffect(() => {
    if (state !== 'processing') return;
    const text = (asr.transcript || recognizedText || '').trim();
    if (!text) {
      setState('idle');
      return;
    }
    setTranscript((prev) => [...prev, `You: ${text}`]);
    voiceHistoryManager.addRecord(text);
    const cmd = tryHandleMultiCommand(text);
    if (cmd.handled && cmd.aiResponse) {
      setAssistantReply(cmd.aiResponse);
      setTranscript((prev) => [...prev, `(Assistant): ${cmd.aiResponse}`]);
      setState('responding');
      speak(cmd.aiResponse).finally(() => setState('idle'));
      return;
    }
    // Fallback to AI model (token-gated), but avoid call if no API key; voice should work like chat with local-only
    const estTokens = Math.max(1, Math.ceil(text.length / 4));
    const hasKey = (settingsManager.get().apiKey || '').trim().length > 0;
    if (!hasKey) {
      const reply = 'This request requires an API key for an AI response. Local automations ran if available.';
      setAssistantReply(reply);
      setTranscript((prev) => [...prev, `(Assistant): ${reply}`]);
      setState('responding');
      speak(reply).finally(() => setState('idle'));
      return;
    }
    if (!tokenManager.canUse(estTokens)) {
      setLimitOpen(true);
      setState('idle');
      return;
    }
    tokenManager.consume(estTokens);
    setLoading(true);
    aiComplete(text).then((reply) => {
      setAssistantReply(reply);
      setTranscript((prev) => [...prev, `(Assistant): ${reply}`]);
      setState('responding');
      return speak(reply);
    }).finally(() => setLoading(false)).finally(() => setState('idle'));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const deleteHistoryRecord = (id: string) => {
    if (confirm("Delete this recording?")) {
      voiceHistoryManager.deleteRecord(id);
      setHistory(voiceHistoryManager.getAllRecords());
    }
  };

  return (
    <>
    <div className="bg-[#0a0b1e] w-full min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 pt-20 md:pt-24 pb-6 px-4 md:px-6 flex gap-4 max-w-7xl mx-auto w-full">
        {/* Main Voice Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-white text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
                <Mic className="w-8 h-8 text-orange-400" />
                {t('voiceAssistantTitle')}
              </h1>
              <p className="text-gray-400 text-sm md:text-base">{t('voiceAssistantSubtitle')}</p>
            </div>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl border border-white/10 hover:border-white/20 transition-all duration-300 flex items-center gap-2"
            >
              <History className="w-4 h-4" />
              <span className="hidden md:inline">{t('history')}</span>
            </button>
          </div>

          <div className="flex-1 backdrop-blur-xl bg-gradient-to-br from-[#1e2139]/95 to-[#252844]/90 border border-white/10 rounded-[20px] md:rounded-[28px] shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col items-center justify-center p-6 md:p-12">
            <div className="relative mb-12">
              <div
                className={`w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center shadow-[0_0_60px_rgba(251,146,60,0.6)] transition-all duration-300 ${
                  state === 'listening' ? "scale-110 animate-pulse" : "scale-100"
                }`}
              >
                {state === 'listening' ? (
                  <Activity className="w-16 h-16 md:w-20 md:h-20 text-white animate-pulse" />
                ) : (
                  <Mic className="w-16 h-16 md:w-20 md:h-20 text-white" />
                )}
              </div>

              {state === 'listening' && (
                <div className="absolute inset-0 rounded-full border-4 border-orange-400 animate-ping opacity-75" />
              )}
            </div>

            <button
              onClick={handleToggleRecording}
              className={`px-8 md:px-12 py-4 rounded-full font-semibold text-base md:text-lg flex items-center gap-3 shadow-lg transition-all duration-300 hover:scale-105 mb-8 ${
                state !== 'idle'
                  ? "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
                  : "bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white"
              }`}
            >
              {state !== 'idle' ? (
                <>
                  <Square className="w-5 h-5" />
                  {t('stopRecording')}
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5" />
                  {t('startRecording')}
                </>
              )}
            </button>

            {transcript.length > 0 && (
              <div className="w-full max-w-2xl backdrop-blur-xl bg-[#2a2d4a]/50 border border-white/10 rounded-2xl p-4 md:p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Volume2 className="w-5 h-5 text-purple-400" />
                  <h3 className="text-white font-semibold">{t('transcript')}</h3>
                </div>
                <div className="space-y-3">
                  {recognizedText && (
                    <div className="rounded-lg bg-white/5 border border-white/10 overflow-hidden">
                      <div className="px-3 pt-3 text-xs uppercase tracking-wide text-gray-400">{t('recognized')}</div>
                      <pre className="whitespace-pre-wrap break-words text-xs md:text-sm leading-relaxed p-3 text-gray-200 font-mono max-h-[40vh] overflow-auto">{recognizedText}</pre>
                      <div className="px-3 pb-3">
                        <div className="mt-2 h-2 w-full bg-white/10 rounded-full overflow-hidden">
                          <div className={`h-full bg-gradient-to-r from-orange-400 to-orange-500 ${state === 'listening' ? 'animate-pulse' : ''}`} style={{width: '60%'}} />
                        </div>
                      </div>
                    </div>
                  )}
                  {assistantReply && (
                    <div className="rounded-lg bg-white/5 border border-white/10 overflow-hidden">
                      <div className="px-3 pt-3 text-xs uppercase tracking-wide text-gray-400">{t('assistant')}</div>
                      <pre className="whitespace-pre-wrap break-words text-xs md:text-sm leading-relaxed p-3 text-gray-200 font-mono max-h-[40vh] overflow-auto">{assistantReply}</pre>
                      <div className="px-3 pb-3">
                        <div className="mt-2 flex items-center gap-2">
                          <span className="inline-block w-2 h-2 rounded-full bg-purple-400 animate-bounce [animation-delay:0ms]" />
                          <span className="inline-block w-2 h-2 rounded-full bg-purple-400 animate-bounce [animation-delay:150ms]" />
                          <span className="inline-block w-2 h-2 rounded-full bg-purple-400 animate-bounce [animation-delay:300ms]" />
                        </div>
                      </div>
                    </div>
                  )}
                  {transcript.map((text, index) => (
                    <p key={index} className="text-gray-300 text-sm md:text-base">
                      {text}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* History Sidebar */}
        {showHistory && (
          <div className="w-full md:w-96 flex-shrink-0">
            <div className="backdrop-blur-xl bg-gradient-to-br from-[#1e2139]/95 to-[#252844]/90 border border-white/10 rounded-[20px] shadow-[0_8px_32px_rgba(0,0,0,0.4)] h-full overflow-hidden flex flex-col">
              <div className="p-4 border-b border-white/10">
                <h2 className="text-white text-lg font-bold flex items-center gap-2">
                  <History className="w-5 h-5 text-orange-400" />
                  {t('history')}
                </h2>
              </div>
              
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {history.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-8">{t('noRecordingsYet')}</p>
                ) : (
                  history.map((record) => (
                    <div
                      key={record.id}
                      className="group p-4 rounded-xl bg-[#2a2d4a]/50 border border-white/5 hover:bg-[#2a2d4a] hover:border-white/10 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <Clock className="w-3 h-3" />
                          {record.timestamp.toLocaleString()}
                        </div>
                        <button
                          onClick={() => deleteHistoryRecord(record.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                      <p className="text-gray-300 text-sm">{record.transcript}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
      <Modal isOpen={limitOpen} onClose={() => setLimitOpen(false)} title={t('dailyTokenLimitReached')} size="sm">
        <div className="space-y-3">
          <p className="text-gray-300 text-sm">{t('dailyTokenLimitMessage')}</p>
          <div className="flex gap-2 pt-2">
            <a href="/settings" className="flex-1 text-center bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg font-semibold">{t('addApiKey')}</a>
            <a href="/pricing" className="flex-1 text-center bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-2 rounded-lg font-semibold">{t('viewPricing')}</a>
          </div>
        </div>
      </Modal>
    </>
  );
};
