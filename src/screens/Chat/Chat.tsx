import { useState, useEffect } from "react";
import { Navbar } from "../../components/Navbar";
import { Send, Sparkles, User, Bot, Trash2, Plus, MessageSquare, Clock } from "lucide-react";
import { conversationManager } from "../../lib/historyManager";

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
}

export const Chat = (): JSX.Element => {
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

    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: "I understand your message. This is a demo response. In a real application, this would connect to an AI service.",
        sender: "ai",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
    }, 1000);
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
    if (confirm("Delete this conversation?")) {
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
    }
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
                New Chat
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
                {activeConv?.title || 'Chat Assistant'}
              </h1>
              <p className="text-gray-400 text-sm">Have a conversation with your AI assistant</p>
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
                    className={`max-w-[80%] md:max-w-[70%] rounded-2xl px-4 py-3 ${
                      message.sender === "user"
                        ? "bg-gradient-to-br from-purple-600 to-purple-700 text-white"
                        : "bg-[#2a2d4a] text-gray-100"
                    }`}
                  >
                    <p className="text-sm md:text-base">{message.text}</p>
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
                  placeholder="Type your message..."
                  className="flex-1 bg-[#2a2d4a] text-white rounded-full px-4 md:px-6 py-3 outline-none border border-white/10 focus:border-purple-500 transition-colors text-sm md:text-base"
                />
                <button
                  onClick={handleSend}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
