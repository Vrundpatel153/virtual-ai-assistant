import { useState, useEffect, useRef } from "react";
import { Navbar } from "../../components/Navbar";
import { Send, Sparkles, User, Bot, Trash2, Plus, MessageSquare, Clock, X, Mic, Square } from "lucide-react";
import { conversationManager, tokenManager, settingsManager } from "../../lib/historyManager";
import { Modal } from "../../components/Modal";
import { tryHandleCommand } from "../../lib/commands";
import { t, useI18n } from "../../lib/i18n";
import { useToast } from "../../components/ToastProvider";
import { aiComplete } from "../../lib/ai";
import { useASR, startListening, stopListening, speak, stopSpeaking, type ASRState, isASRAvailable, type VoiceLocale } from "../../lib/speech";

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
}

type MessageSegment =
  | { type: "text"; content: string }
  | { type: "code"; content: string; language?: string };

const codeFenceRegex = /```([a-zA-Z0-9_-]+)?\s*\n([\s\S]*?)```/g;

function getMessageSegments(raw: string): MessageSegment[] {
  if (!raw) return [];
  const segments: MessageSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeFenceRegex.exec(raw)) !== null) {
    const [full, language, code] = match;
    const matchIndex = match.index;
    if (matchIndex > lastIndex) {
      const preceding = raw.slice(lastIndex, matchIndex);
      if (preceding.trim()) {
        segments.push({ type: "text", content: preceding.trim() });
      }
    }
    segments.push({ type: "code", content: code.trimEnd(), language: language?.trim() || undefined });
    lastIndex = matchIndex + full.length;
  }

  if (lastIndex < raw.length) {
    const tail = raw.slice(lastIndex);
    if (tail.trim()) {
      segments.push({ type: "text", content: tail.trim() });
    }
  }

  if (segments.length === 0) {
    segments.push({ type: "text", content: raw });
  }

  return segments;
}

export const Chat = (): JSX.Element => {
  useI18n();
  const [conversations, setConversations] = useState(() => conversationManager.getAllConversations());
  const [activeConversationId, setActiveConversationId] = useState<string | null>(() => {
    const activeId = conversationManager.getActiveConversationId();
    if (activeId && conversationManager.getConversation(activeId)) {
      return activeId;
    }
    // Create initial conversation if none exists
    if (conversations.length === 0) {
      const newConv = conversationManager.createConversation();
      return newConv.id;
    }
    return conversations[0]?.id || null;
  });
  
  const [messages, setMessages] = useState<Message[]>(() => {
    if (activeConversationId) {
      const conv = conversationManager.getConversation(activeConversationId);
      return conv?.messages || [];
    }
    return [];
  });
  
  const [inputValue, setInputValue] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [limitOpen, setLimitOpen] = useState(false);
  const [usageText, setUsageText] = useState<string>("");
  const [hideUsage, setHideUsage] = useState<boolean>(settingsManager.get().hideTokenUsage ?? false);
  const { showToast } = useToast();

  // Voice state
  const rec = useASR();
  const [voiceState, setVoiceState] = useState<ASRState>('idle');
  const aiAbortRef = useRef<AbortController | null>(null);
  const aiTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const updateUsage = () => {
      const u = tokenManager.getUsage();
      const limit = tokenManager.getDailyLimit();
      setUsageText(`${u.used}/${Number.isFinite(limit) ? limit : '∞'} tokens`);
    };
    updateUsage();
    const onSettings = (e: any) => setHideUsage((e?.detail?.hideTokenUsage) ?? settingsManager.get().hideTokenUsage ?? false);
    window.addEventListener('ai_settings_updated', onSettings as any);
    const id = setInterval(updateUsage, 1500);
    return () => { window.removeEventListener('ai_settings_updated', onSettings as any); clearInterval(id); };
  }, []);

  useEffect(() => {
    if (activeConversationId) {
      const conv = conversationManager.getConversation(activeConversationId);
      if (conv) {
        setMessages(conv.messages);
      }
    }
  }, [activeConversationId]);

  useEffect(() => {
    if (activeConversationId && messages.length > 0) {
      conversationManager.updateConversation(activeConversationId, messages);
      setConversations(conversationManager.getAllConversations());
    }
  }, [messages, activeConversationId]);

  // Unified send method used by text and voice paths. Returns AI response or null if blocked.
  const sendMessage = async (text: string): Promise<string | null> => {
    const trimmed = text.trim();
    if (!trimmed) return null;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: trimmed,
      sender: "user",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);

    // Immediately try local commands (no token usage)
    const cmd = tryHandleCommand(trimmed);
    if (cmd.handled) {
      const aiText = cmd.aiResponse || "";
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: aiText,
        sender: "ai",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
      return aiText;
    }

    // Token gating
    const estTokens = Math.max(1, Math.ceil(trimmed.length / 4));
    if (!tokenManager.canUse(estTokens)) {
      setLimitOpen(true);
      const msg = t('dailyTokenLimitMessage');
      const aiResponse: Message = {
        id: (Date.now() + 2).toString(),
        text: msg,
        sender: "ai",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
      return msg;
    }
    tokenManager.consume(estTokens);
    // refresh usage text quickly
    const u = tokenManager.getUsage();
    const limit = tokenManager.getDailyLimit();
    setUsageText(`${u.used}/${Number.isFinite(limit) ? limit : '∞'} tokens`);

    const placeholderId = `${Date.now()}-thinking`;
    const placeholder: Message = {
      id: placeholderId,
      text: "Thinking...",
      sender: "ai",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, placeholder]);

    const controller = new AbortController();
    aiAbortRef.current = controller;
    let aiText = "";
    try {
      aiText = await aiComplete(trimmed, controller.signal);
    } catch (err: any) {
      aiText = `AI request failed: ${err?.message || 'unknown error'}`;
    } finally {
      aiAbortRef.current = null;
      if (aiTimerRef.current) {
        window.clearTimeout(aiTimerRef.current);
        aiTimerRef.current = null;
      }
    }

    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === placeholderId
          ? { ...msg, text: aiText, timestamp: new Date() }
          : msg
      )
    );
    return aiText;
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    const text = inputValue;
    setInputValue("");
    await sendMessage(text);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const createNewConversation = () => {
    const newConv = conversationManager.createConversation();
    setActiveConversationId(newConv.id);
    setConversations(conversationManager.getAllConversations());
    setShowHistory(false);
  };

  const switchConversation = (id: string) => {
    setActiveConversationId(id);
    conversationManager.setActiveConversation(id);
    setShowHistory(false);
  };

  const deleteConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    conversationManager.deleteConversation(id);
    const updatedConversations = conversationManager.getAllConversations();
    setConversations(updatedConversations);
    if (id === activeConversationId) {
      if (updatedConversations.length > 0) {
        setActiveConversationId(updatedConversations[0].id);
        conversationManager.setActiveConversation(updatedConversations[0].id);
      } else {
        createNewConversation();
      }
    }
    showToast({ variant: 'info', title: t('historyTitle'), description: t('done') });
  };

  const activeConv = conversations.find(c => c.id === activeConversationId);

  // Voice: handle mic start/stop and transitions
  const getPreferredVoiceLocale = (): VoiceLocale => (settingsManager.get().language === 'hi' ? 'hi-IN' : 'en-US');

  const handleStartVoice = async () => {
    if (!isASRAvailable()) {
      showToast({ variant: 'info', title: t('voice'), description: 'Speech recognition is not supported in this browser.' });
      return;
    }
    try {
      rec.resetTranscript();
      await startListening(getPreferredVoiceLocale());
      setVoiceState('listening');
    } catch (e) {
      showToast({ variant: 'error', title: t('voice'), description: (e as any)?.message || 'Could not start microphone.' });
    }
  };

  const handleStopAll = () => {
    try { stopListening(); } catch {}
    try { stopSpeaking(); } catch {}
    if (aiAbortRef.current) {
      try { aiAbortRef.current.abort(); } catch {}
      aiAbortRef.current = null;
    }
    if (aiTimerRef.current) {
      window.clearTimeout(aiTimerRef.current);
      aiTimerRef.current = null;
    }
    setVoiceState('idle');
    try { rec.resetTranscript(); } catch {}
  };

  // When listening stops naturally, treat transcript as the message to send
  useEffect(() => {
    if (!rec.listening && voiceState === 'listening') {
      const finalText = (rec as any).finalTranscript || rec.transcript || '';
      // Move to processing phase if we have something
      if (finalText.trim()) {
        setVoiceState('processing');
        // Send the message, then speak the response
        (async () => {
          const aiText = await sendMessage(finalText);
          // Stop listening before speaking to avoid feedback loops
          try { stopListening(); } catch {}
          if (aiText && aiText.trim()) {
            setVoiceState('responding');
            try { await speak(aiText); } catch {}
          }
          setVoiceState('idle');
          try { rec.resetTranscript(); } catch {}
        })();
      } else {
        // Nothing captured, just reset
        setVoiceState('idle');
        try { rec.resetTranscript(); } catch {}
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rec.listening]);

  return (
    <div className="bg-background w-full min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 pt-16 sm:pt-20 md:pt-24 pb-4 sm:pb-6 px-3 sm:px-4 md:px-6 flex gap-3 md:gap-4 max-w-7xl mx-auto w-full">
        {/* History Sidebar */}
        <div className={`${showHistory ? 'fixed inset-0 z-40 bg-black/50 md:relative md:bg-transparent' : 'hidden'} md:block md:w-64 lg:w-80 md:flex-shrink-0`}>
          <div className={`${showHistory ? 'absolute left-0 top-0 bottom-0 w-[85%] max-w-sm' : ''} md:relative md:w-full backdrop-blur-xl bg-card/95 border border-border rounded-none md:rounded-[20px] shadow-lg h-full overflow-hidden flex flex-col`}
            onClick={(e) => {
              if (showHistory && e.target === e.currentTarget) {
                setShowHistory(false);
              }
            }}
          >
            <div className="p-3 sm:p-4 border-b border-border">
              <div className="flex items-center justify-between mb-3 md:hidden">
                <h2 className="text-foreground font-semibold">{t('historyTitle')}</h2>
                <button
                  onClick={() => setShowHistory(false)}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              <button
                onClick={createNewConversation}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-purple-500/50 transition-all duration-300"
              >
                <Plus className="w-4 h-4" />
                {t('newChat')}
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-2">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => {
                    switchConversation(conv.id);
                    setShowHistory(false);
                  }}
                  className={`group p-2.5 sm:p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                    conv.id === activeConversationId
                      ? 'bg-primary/20 border border-primary/50'
                      : 'bg-secondary/50 border border-border hover:bg-secondary hover:border-border'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
                        <p className="text-foreground text-xs sm:text-sm font-medium truncate">{conv.title}</p>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {conv.lastMessageAt.toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      onClick={(e) => deleteConversation(conv.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded-lg transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="mb-3 sm:mb-4 flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-foreground text-xl sm:text-2xl md:text-3xl font-bold mb-1 flex items-center gap-2 sm:gap-3">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="md:hidden p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                >
                  <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </button>
                <Sparkles className="w-5 h-5 sm:w-6 sm:w-7 text-primary flex-shrink-0" />
                <span className="truncate">{activeConv?.title || t('chatHeader')}</span>
              </h1>
              <p className="text-muted-foreground text-xs sm:text-sm ml-8 sm:ml-11 md:ml-0">{t('chatTagline')}</p>
            </div>
          </div>

          <div className="flex-1 backdrop-blur-xl bg-card/95 border border-border rounded-[16px] sm:rounded-[20px] md:rounded-[28px] shadow-lg overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-2 sm:gap-3 ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  {message.sender === "ai" && (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] sm:max-w-[80%] md:max-w-[75%] rounded-2xl p-0 ${
                      message.sender === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-foreground"
                    }`}
                  >
                    <div className="space-y-3 p-3 sm:p-4">
                      {getMessageSegments(message.text).map((segment, index) =>
                        segment.type === "code" ? (
                          <pre
                            key={`${message.id}-code-${index}`}
                            className="bg-background/80 text-xs sm:text-sm font-mono text-foreground rounded-xl border border-border/60 p-3 overflow-x-auto"
                          >
                            <code>{segment.content}</code>
                          </pre>
                        ) : (
                          <p
                            key={`${message.id}-text-${index}`}
                            className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words"
                          >
                            {segment.content}
                          </p>
                        )
                      )}
                    </div>
                  </div>
                  {message.sender === "user" && (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="p-3 sm:p-4 md:p-6 border-t border-border">
              <div className="flex gap-2 sm:gap-3 items-center">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={t('chatPlaceholder')}
                  className="flex-1 bg-input text-foreground rounded-full px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 outline-none border border-border focus:border-primary transition-colors text-sm md:text-base"
                />
                {voiceState === 'idle' ? (
                  <button
                    onClick={handleStartVoice}
                    title={t('voice')}
                    className="bg-[#1e2139] hover:bg-[#252844] text-white w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border border-border transition-all hover:scale-105 flex-shrink-0"
                  >
                    <Mic className="w-4 h-4 sm:w-5 sm:h-5 text-purple-300" />
                  </button>
                ) : (
                  <button
                    onClick={handleStopAll}
                    title={'Stop'}
                    className="bg-red-500/20 hover:bg-red-500/30 text-red-200 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border border-red-400/40 transition-all hover:scale-105 flex-shrink-0"
                  >
                    <Square className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                )}
                <button
                  onClick={handleSend}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 flex-shrink-0"
                >
                  <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
              {voiceState !== 'idle' && (
                <div className="mt-2 text-xs text-muted-foreground flex items-center gap-3">
                  {voiceState === 'listening' && (
                    <>
                      <span className="inline-flex h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                      <span className="flex items-end gap-0.5">
                        <span className="block w-1 h-3 bg-green-400/80 rounded-sm animate-[ping_1s_ease-in-out_infinite]" style={{ animationDelay: '0ms' }} />
                        <span className="block w-1 h-4 bg-green-400/80 rounded-sm animate-[ping_1s_ease-in-out_infinite]" style={{ animationDelay: '150ms' }} />
                        <span className="block w-1 h-5 bg-green-400/80 rounded-sm animate-[ping_1s_ease-in-out_infinite]" style={{ animationDelay: '300ms' }} />
                        <span className="block w-1 h-4 bg-green-400/80 rounded-sm animate-[ping_1s_ease-in-out_infinite]" style={{ animationDelay: '450ms' }} />
                        <span className="block w-1 h-3 bg-green-400/80 rounded-sm animate-[ping_1s_ease-in-out_infinite]" style={{ animationDelay: '600ms' }} />
                      </span>
                      <span>{'Listening...'}</span>
                      <span className="text-foreground/80 truncate max-w-[60%]">{rec.transcript}</span>
                    </>
                  )}
                  {voiceState === 'processing' && (
                    <>
                      <span className="inline-flex h-2 w-2 rounded-full bg-yellow-400 animate-pulse" />
                      <span>{'Processing...'}</span>
                    </>
                  )}
                  {voiceState === 'responding' && (
                    <>
                      <span className="inline-flex h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
                      <span>{'Speaking...'}</span>
                    </>
                  )}
                </div>
              )}
              {!hideUsage && (
                <div className="mt-2 text-xs text-muted-foreground">{usageText}</div>
              )}
            </div>
          </div>
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
    </div>
  );
};
