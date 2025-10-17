import { useState, useEffect } from "react";
import { Navbar } from "../../components/Navbar";
import { Send, Sparkles, User, Bot, Trash2, Plus, MessageSquare, Clock } from "lucide-react";
import { conversationManager, tokenManager, settingsManager } from "../../lib/historyManager";
import { Modal } from "../../components/Modal";
import { useGlobalLoading } from "../../components/LoadingProvider";
import { tryHandleCommand } from "../../lib/commands";
import { t, useI18n } from "../../lib/i18n";
import { useToast } from "../../components/ToastProvider";

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
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
  const { setLoading } = useGlobalLoading();
  const [usageText, setUsageText] = useState<string>("");
  const [hideUsage, setHideUsage] = useState<boolean>(settingsManager.get().hideTokenUsage ?? false);
  const { showToast } = useToast();

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

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages([...messages, newMessage]);
    setInputValue("");

    // Immediately try local commands (no token usage)
    const text = newMessage.text.trim();
    const cmd = tryHandleCommand(text);
    if (cmd.handled) {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: cmd.aiResponse || "",
        sender: "ai",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
      return;
    }

    // Fallback response (Gemini) with token gating
    const estTokens = Math.max(1, Math.ceil(newMessage.text.length / 4));
    if (!tokenManager.canUse(estTokens)) {
      setLimitOpen(true);
      return;
    }
  tokenManager.consume(estTokens);
  // refresh usage text quickly
  const u = tokenManager.getUsage();
  const limit = tokenManager.getDailyLimit();
  setUsageText(`${u.used}/${Number.isFinite(limit) ? limit : '∞'} tokens`);
    setLoading(true);
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
  text: t('demoAiResponse'),
        sender: "ai",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
      setLoading(false);
    }, 800);
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

  return (
    <div className="bg-[#0a0b1e] w-full min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 pt-20 md:pt-24 pb-6 px-4 md:px-6 flex gap-4 max-w-7xl mx-auto w-full">
        {/* History Sidebar */}
        <div className={`${showHistory ? 'block' : 'hidden'} md:block w-full md:w-80 flex-shrink-0`}>
          <div className="backdrop-blur-xl bg-gradient-to-br from-[#1e2139]/95 to-[#252844]/90 border border-white/10 rounded-[20px] shadow-[0_8px_32px_rgba(0,0,0,0.4)] h-full overflow-hidden flex flex-col">
            <div className="p-4 border-b border-white/10">
              <button
                onClick={createNewConversation}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-4 py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-purple-500/50 transition-all duration-300"
              >
                <Plus className="w-4 h-4" />
                {t('newChat')}
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => switchConversation(conv.id)}
                  className={`group p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                    conv.id === activeConversationId
                      ? 'bg-purple-600/20 border border-purple-500/50'
                      : 'bg-[#2a2d4a]/50 border border-white/5 hover:bg-[#2a2d4a] hover:border-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <MessageSquare className="w-4 h-4 text-purple-400 flex-shrink-0" />
                        <p className="text-white text-sm font-medium truncate">{conv.title}</p>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        {conv.lastMessageAt.toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      onClick={(e) => deleteConversation(conv.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-white text-2xl md:text-3xl font-bold mb-1 flex items-center gap-3">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="md:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <MessageSquare className="w-6 h-6 text-purple-400" />
                </button>
                <Sparkles className="w-7 h-7 text-purple-400" />
                {activeConv?.title || t('chatHeader')}
              </h1>
              <p className="text-gray-400 text-sm">{t('chatTagline')}</p>
            </div>
          </div>

          <div className="flex-1 backdrop-blur-xl bg-gradient-to-br from-[#1e2139]/95 to-[#252844]/90 border border-white/10 rounded-[20px] md:rounded-[28px] shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  {message.sender === "ai" && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-0 overflow-hidden ${
                      message.sender === "user"
                        ? "bg-gradient-to-br from-purple-600 to-purple-700 text-white"
                        : "bg-[#2a2d4a] text-gray-100"
                    }`}
                  >
                    <pre className="whitespace-pre-wrap break-words text-xs md:text-sm leading-relaxed p-4 max-h-[50vh] overflow-auto font-mono">{message.text}</pre>
                  </div>
                  {message.sender === "user" && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="p-4 md:p-6 border-t border-white/10">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={t('chatPlaceholder')}
                  className="flex-1 bg-[#2a2d4a] text-white rounded-full px-4 md:px-6 py-3 outline-none border border-white/10 focus:border-purple-500 transition-colors text-sm md:text-base"
                />
                <button
                  onClick={handleSend}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              {!hideUsage && (
                <div className="mt-2 text-xs text-gray-400">{usageText}</div>
              )}
            </div>
          </div>
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
    </div>
  );
};
