import { useState } from "react";
import { Navbar } from "../../components/Navbar";
import { Send, Sparkles, User, Bot } from "lucide-react";

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
}

export const Chat = (): JSX.Element => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello! I'm your AI assistant. How can I help you today?",
      sender: "ai",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");

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

  return (
    <div className="bg-[#0a0b1e] w-full min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 pt-20 md:pt-24 pb-6 px-4 md:px-6 flex flex-col max-w-5xl mx-auto w-full">
        <div className="mb-6">
          <h1 className="text-white text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-purple-400" />
            Chat Assistant
          </h1>
          <p className="text-gray-400 text-sm md:text-base">Have a conversation with your AI assistant</p>
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
  );
};
