import { useState, useEffect, useCallback, useRef } from "react";
import { Navbar } from "../../components/Navbar";
import { Mic, Square, Volume2, Activity, Clock, Trash2, History, AlertCircle, Loader2 } from "lucide-react";
import { voiceHistoryManager, tokenManager } from "../../lib/historyManager";
import { useGlobalLoading } from "../../components/LoadingProvider";
import { Modal } from "../../components/Modal";
import { tryHandleMultiCommand } from "../../lib/commands";
import { useASR, isASRAvailable, startListening, stopListening, speak, stopSpeaking } from "../../lib/speech";
import { aiComplete } from "../../lib/ai";
import { t, useI18n } from "../../lib/i18n";
import { useToast } from "../../components/ToastProvider";

export const Voice = (): JSX.Element => {
  type VoiceState = 'idle' | 'listening' | 'processing' | 'responding' | 'error';
  useI18n();
  const [state, setState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState<string[]>([]);
  const [history, setHistory] = useState(() => voiceHistoryManager.getAllRecords());
  const [showHistory, setShowHistory] = useState(false);
  const [limitOpen, setLimitOpen] = useState(false);
  const { setLoading } = useGlobalLoading();
  const [recognizedText, setRecognizedText] = useState<string>("");
  const [assistantReply, setAssistantReply] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [micPermission, setMicPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const asr = useASR();
  const { showToast } = useToast();
  const processingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isProcessingRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  // Check microphone permission on mount
  useEffect(() => {
    const checkMicPermission = async () => {
      try {
        const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        setMicPermission(result.state as 'granted' | 'denied' | 'prompt');
        
        result.addEventListener('change', () => {
          setMicPermission(result.state as 'granted' | 'denied' | 'prompt');
        });
      } catch (error) {
        console.log('Permission API not available, will request on first use');
      }
    };
    
    checkMicPermission();
  }, []);

  // Update history when transcript changes
  useEffect(() => {
    setHistory(voiceHistoryManager.getAllRecords());
  }, [transcript]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
      stopListening();
      stopSpeaking();
      if (abortRef.current) {
        try { abortRef.current.abort(); } catch {}
      }
    };
  }, []);

  const handleStopAll = useCallback(() => {
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
    }
    try { stopListening(); } catch {}
    try { stopSpeaking(); } catch {}
    if (abortRef.current) {
      try { abortRef.current.abort(); } catch {}
      abortRef.current = null;
    }
    try { asr.resetTranscript(); } catch {}
    setRecognizedText("");
    setAssistantReply("");
    isProcessingRef.current = false;
    setState('idle');
  }, [asr]);

  const handleToggleRecording = useCallback(async () => {
    if (state === 'idle') {
      // Check browser support
      if (!isASRAvailable()) {
        setErrorMessage('Voice recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
        setState('error');
        showToast({
          variant: 'error',
          title: 'Not Supported',
          description: 'Voice recognition is not available in this browser.'
        });
        return;
      }

      // Request microphone permission
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        setMicPermission('granted');
      } catch (error) {
        setMicPermission('denied');
        setErrorMessage('Microphone access denied. Please grant permission to use voice features.');
        setState('error');
        showToast({
          variant: 'error',
          title: 'Permission Denied',
          description: 'Please allow microphone access to use voice assistant.'
        });
        return;
      }

      // Clear previous state
      setAssistantReply("");
      setRecognizedText("");
      setErrorMessage("");
      setState('listening');
      
      const lang = settingsManager.get().language === 'hi' ? 'hi-IN' : 'en-US';
      
      try {
        await startListening(lang);
        
        // Set safety timeout in case listening doesn't stop automatically
        if (processingTimeoutRef.current) {
          clearTimeout(processingTimeoutRef.current);
        }
        processingTimeoutRef.current = setTimeout(() => {
          stopListening();
          showToast({
            variant: 'info',
            title: 'Timeout',
            description: 'Listening timed out. Please try again.'
          });
        }, 30000); // 30 second timeout
        
      } catch (error) {
        console.error('Error starting recording:', error);
        setErrorMessage('Failed to start recording. Please try again.');
        setState('error');
        showToast({
          variant: 'error',
          title: 'Recording Failed',
          description: 'Could not start voice recording.'
        });
      }
    } else {
      // Manual stop
      handleStopAll();
    }
  }, [state, showToast, handleStopAll]);

  // Update recognized text as user speaks (interim results)
  useEffect(() => {
    if (!asr.transcript) return;
    setRecognizedText(asr.transcript);
  }, [asr.transcript]);

  // Auto-detect end of speech: when ASR stops listening while we are in listening state, move to processing
  useEffect(() => {
    if (state === 'listening' && asr.listening === false && asr.transcript) {
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
      setState('processing');
    }
  }, [asr.listening, asr.transcript, state]);

  // Process the recognized text when entering processing state
  useEffect(() => {
  if (state !== 'processing' || isProcessingRef.current) return;
    
    isProcessingRef.current = true;
    const text = (asr.transcript || recognizedText || '').trim();
    
    if (!text) {
      setState('idle');
      isProcessingRef.current = false;
      showToast({
        variant: 'info',
        title: 'No Speech Detected',
        description: 'Please try speaking again.'
      });
      return;
    }

    // Add user message to transcript
    setTranscript((prev) => [...prev, `You: ${text}`]);
    voiceHistoryManager.addRecord(text);
    
    // Reset ASR transcript for next recording
    asr.resetTranscript();

    // Try command handling first
    const cmd = tryHandleMultiCommand(text);
    if (cmd.handled && cmd.aiResponse) {
      setAssistantReply(cmd.aiResponse);
      setTranscript((prev) => [...prev, `Assistant: ${cmd.aiResponse}`]);
      setState('responding');
      // Ensure we are not listening while speaking to avoid feedback loops
      try { stopListening(); } catch {}
      speak(cmd.aiResponse)
        .catch((error) => {
          console.error('Speech synthesis error:', error);
          showToast({
            variant: 'error',
            title: 'Speech Error',
            description: 'Could not speak the response.'
          });
        })
        .finally(() => {
          setState('idle');
          isProcessingRef.current = false;
        });
      return;
    }

    // Check token limits
    const estTokens = Math.max(1, Math.ceil(text.length / 4));
    if (!tokenManager.canUse(estTokens)) {
      setLimitOpen(true);
      setState('idle');
      isProcessingRef.current = false;
      return;
    }

    // Call AI
    tokenManager.consume(estTokens);
    setLoading(true);
    
    // Prepare abort controller for cancellable AI call
    abortRef.current = new AbortController();
    aiComplete(text, abortRef.current.signal)
      .then((reply) => {
        if (!reply || reply.includes('failed')) {
          throw new Error(reply || 'AI request failed');
        }
        setAssistantReply(reply);
        setTranscript((prev) => [...prev, `Assistant: ${reply}`]);
        setState('responding');
        // Stop listening before speaking to avoid re-capturing our own TTS output
        try { stopListening(); } catch {}
        return speak(reply);
      })
      .catch((error) => {
        console.error('AI or speech error:', error);
        const errorMsg = 'Sorry, I encountered an error processing your request.';
        setAssistantReply(errorMsg);
        setTranscript((prev) => [...prev, `Assistant: ${errorMsg}`]);
        showToast({
          variant: 'error',
          title: 'Error',
          description: typeof error === 'string' ? error : 'Failed to get AI response.'
        });
        setState('idle');
      })
      .finally(() => {
        setLoading(false);
        abortRef.current = null;
        setState('idle');
        isProcessingRef.current = false;
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const deleteHistoryRecord = (id: string) => {
    voiceHistoryManager.deleteRecord(id);
    setHistory(voiceHistoryManager.getAllRecords());
    showToast({ variant: 'info', title: t('history'), description: t('done') });
  };

  return (
    <>
    <div className="bg-background w-full min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 pt-20 md:pt-24 pb-6 px-4 md:px-6 flex gap-4 max-w-7xl mx-auto w-full">
        {/* Main Voice Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-foreground text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
                <Mic className="w-8 h-8 text-orange-400" />
                {t('voiceAssistantTitle')}
              </h1>
              <p className="text-muted-foreground text-sm md:text-base">{t('voiceAssistantSubtitle')}</p>
            </div>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="bg-secondary hover:bg-secondary/80 text-secondary-foreground px-4 py-2 rounded-xl border border-border hover:border-border/60 transition-all duration-300 flex items-center gap-2"
            >
              <History className="w-4 h-4" />
              <span className="hidden md:inline">{t('history')}</span>
            </button>
          </div>

          <div className="flex-1 backdrop-blur-xl bg-card border border-border rounded-[20px] md:rounded-[28px] shadow-[0_8px_32px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col items-center justify-center p-6 md:p-12">
            {/* Permission Warning */}
            {micPermission === 'denied' && (
              <div className="mb-6 p-4 bg-destructive/10 border border-destructive rounded-xl flex items-start gap-3 max-w-2xl">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-destructive font-semibold mb-1">Microphone Access Required</h3>
                  <p className="text-sm text-destructive/80">
                    Please enable microphone permissions in your browser settings to use the voice assistant.
                  </p>
                </div>
              </div>
            )}

            <div className="relative mb-12">
              <div
                className={`w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center shadow-[0_0_60px_rgba(251,146,60,0.6)] transition-all duration-300 ${
                  state === 'listening' ? "scale-110 animate-pulse" : 
                  state === 'processing' ? "scale-105" :
                  state === 'responding' ? "scale-105 animate-pulse" :
                  state === 'error' ? "scale-95 from-red-400 to-red-500" :
                  "scale-100"
                }`}
              >
                {state === 'listening' ? (
                  <Activity className="w-16 h-16 md:w-20 md:h-20 text-white animate-pulse" />
                ) : state === 'processing' ? (
                  <Loader2 className="w-16 h-16 md:w-20 md:h-20 text-white animate-spin" />
                ) : state === 'responding' ? (
                  <Volume2 className="w-16 h-16 md:w-20 md:h-20 text-white animate-pulse" />
                ) : state === 'error' ? (
                  <AlertCircle className="w-16 h-16 md:w-20 md:h-20 text-white" />
                ) : (
                  <Mic className="w-16 h-16 md:w-20 md:h-20 text-white" />
                )}
              </div>

              {state === 'listening' && (
                <div className="absolute inset-0 rounded-full border-4 border-orange-400 animate-ping opacity-75" />
              )}
              {state === 'responding' && (
                <div className="absolute inset-0 rounded-full border-4 border-purple-400 animate-ping opacity-75" />
              )}
            </div>

            {/* State indicator text */}
            <div className="mb-4 text-center">
              <p className="text-sm font-medium text-muted-foreground">
                {state === 'idle' && 'Ready to listen'}
                {state === 'listening' && 'Listening... Speak now'}
                {state === 'processing' && 'Processing your request...'}
                {state === 'responding' && 'Speaking response...'}
                {state === 'error' && 'Error - Please try again'}
              </p>
            </div>

            <button
              onClick={handleToggleRecording}
              disabled={micPermission === 'denied'}
              className={`px-8 md:px-12 py-4 rounded-full font-semibold text-base md:text-lg flex items-center gap-3 shadow-lg transition-all duration-300 hover:scale-105 mb-8 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${
                state === 'listening'
                  ? "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
                  : state === 'error'
                  ? "bg-gradient-to-r from-gray-600 to-gray-700 text-white"
                  : "bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white"
              }`}
            >
              {state === 'listening' ? (
                <>
                  <Square className="w-5 h-5" />
                  {t('stopRecording')}
                </>
              ) : state === 'processing' || state === 'responding' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {state === 'processing' ? 'Processing...' : 'Speaking...'}
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5" />
                  {t('startRecording')}
                </>
              )}
            </button>

            {state !== 'idle' && (
              <button
                onClick={handleStopAll}
                className="px-5 py-3 rounded-full font-semibold text-sm flex items-center gap-2 border border-red-500/40 text-red-300 hover:text-red-200 hover:bg-red-500/10 transition-colors mb-8"
              >
                <Square className="w-4 h-4" /> Stop
              </button>
            )}

            {/* Error message display */}
            {errorMessage && state === 'error' && (
              <div className="mb-6 p-4 bg-destructive/10 border border-destructive rounded-xl max-w-2xl">
                <p className="text-sm text-destructive">{errorMessage}</p>
              </div>
            )}

            {transcript.length > 0 && (
              <div className="w-full max-w-2xl backdrop-blur-xl bg-muted border border-border rounded-2xl p-4 md:p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Volume2 className="w-5 h-5 text-purple-400" />
                  <h3 className="text-foreground font-semibold">{t('transcript')}</h3>
                </div>
                <div className="space-y-3">
                  {recognizedText && (
                    <div className="rounded-lg bg-secondary border border-border overflow-hidden">
                      <div className="px-3 pt-3 flex items-center justify-between">
                        <span className="text-xs uppercase tracking-wide text-muted-foreground">{t('recognized')}</span>
                        {state === 'listening' && (
                          <span className="flex items-center gap-1 text-xs text-orange-500">
                            <Activity className="w-3 h-3 animate-pulse" />
                            Listening
                          </span>
                        )}
                      </div>
                      <pre className="whitespace-pre-wrap break-words text-xs md:text-sm leading-relaxed p-3 text-foreground font-mono max-h-[40vh] overflow-auto">{recognizedText}</pre>
                      {state === 'listening' && (
                        <div className="px-3 pb-3">
                          <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-orange-400 to-orange-500 animate-pulse" style={{width: '100%'}} />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {assistantReply && (
                    <div className="rounded-lg bg-secondary border border-border overflow-hidden">
                      <div className="px-3 pt-3 flex items-center justify-between">
                        <span className="text-xs uppercase tracking-wide text-muted-foreground">{t('assistant')}</span>
                        {state === 'responding' && (
                          <span className="flex items-center gap-1 text-xs text-purple-500">
                            <Volume2 className="w-3 h-3 animate-pulse" />
                            Speaking
                          </span>
                        )}
                      </div>
                      <pre className="whitespace-pre-wrap break-words text-xs md:text-sm leading-relaxed p-3 text-foreground font-mono max-h-[40vh] overflow-auto">{assistantReply}</pre>
                      {state === 'responding' && (
                        <div className="px-3 pb-3">
                          <div className="flex items-center gap-2">
                            <span className="inline-block w-2 h-2 rounded-full bg-purple-400 animate-bounce [animation-delay:0ms]" />
                            <span className="inline-block w-2 h-2 rounded-full bg-purple-400 animate-bounce [animation-delay:150ms]" />
                            <span className="inline-block w-2 h-2 rounded-full bg-purple-400 animate-bounce [animation-delay:300ms]" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {transcript.map((text, index) => (
                    <p key={index} className="text-foreground text-sm md:text-base">
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
            <div className="backdrop-blur-xl bg-card border border-border rounded-[20px] shadow-[0_8px_32px_rgba(0,0,0,0.1)] h-full overflow-hidden flex flex-col">
              <div className="p-4 border-b border-border">
                <h2 className="text-foreground text-lg font-bold flex items-center gap-2">
                  <History className="w-5 h-5 text-orange-400" />
                  {t('history')}
                </h2>
              </div>
              
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {history.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">{t('noRecordingsYet')}</p>
                ) : (
                  history.map((record) => (
                    <div
                      key={record.id}
                      className="group p-4 rounded-xl bg-muted border border-border hover:bg-muted/80 hover:border-border/60 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
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
                      <p className="text-foreground text-sm">{record.transcript}</p>
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
            <a
              href="https://console.groq.com/docs/quickstart"
              target="_blank"
              rel="noreferrer"
              className="flex-1 text-center bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg font-semibold"
            >
              {t('configureEnvKey')}
            </a>
            <a href="/pricing" className="flex-1 text-center bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-2 rounded-lg font-semibold">{t('viewPricing')}</a>
          </div>
        </div>
      </Modal>
    </>
  );
};
