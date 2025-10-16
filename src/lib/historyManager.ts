interface Conversation {
  id: string;
  title: string;
  createdAt: Date;
  lastMessageAt: Date;
  messages: ChatMessage[];
}

interface ChatMessage {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
}

interface VoiceRecord {
  id: string;
  transcript: string;
  timestamp: Date;
  duration?: number;
}

interface PDFRecord {
  id: string;
  fileName: string;
  summary: string;
  timestamp: Date;
}

const CONVERSATIONS_KEY = 'ai_conversations';
const ACTIVE_CONVERSATION_KEY = 'ai_active_conversation';
const VOICE_HISTORY_KEY = 'ai_voice_history';
const PDF_HISTORY_KEY = 'ai_pdf_history';

// Chat Conversation Management
export const conversationManager = {
  getAllConversations(): Conversation[] {
    const saved = localStorage.getItem(CONVERSATIONS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((conv: any) => ({
        ...conv,
        createdAt: new Date(conv.createdAt),
        lastMessageAt: new Date(conv.lastMessageAt),
        messages: conv.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      }));
    }
    return [];
  },

  getConversation(id: string): Conversation | null {
    const conversations = this.getAllConversations();
    return conversations.find(conv => conv.id === id) || null;
  },

  createConversation(title?: string): Conversation {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: title || `Chat ${new Date().toLocaleDateString()}`,
      createdAt: new Date(),
      lastMessageAt: new Date(),
      messages: [
        {
          id: "1",
          text: "Hello! I'm your AI assistant. How can I help you today?",
          sender: "ai",
          timestamp: new Date(),
        },
      ],
    };

    const conversations = this.getAllConversations();
    conversations.unshift(newConversation);
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
    this.setActiveConversation(newConversation.id);
    
    return newConversation;
  },

  updateConversation(id: string, messages: ChatMessage[]): void {
    const conversations = this.getAllConversations();
    const index = conversations.findIndex(conv => conv.id === id);
    
    if (index !== -1) {
      conversations[index].messages = messages;
      conversations[index].lastMessageAt = new Date();
      
      // Auto-generate title from first user message if still default
      if (conversations[index].title.startsWith('Chat ') && messages.length > 1) {
        const firstUserMsg = messages.find(msg => msg.sender === 'user');
        if (firstUserMsg) {
          conversations[index].title = firstUserMsg.text.substring(0, 50) + (firstUserMsg.text.length > 50 ? '...' : '');
        }
      }
      
      localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
    }
  },

  deleteConversation(id: string): void {
    const conversations = this.getAllConversations();
    const filtered = conversations.filter(conv => conv.id !== id);
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(filtered));
    
    // If deleted conversation was active, clear active
    const activeId = this.getActiveConversationId();
    if (activeId === id) {
      localStorage.removeItem(ACTIVE_CONVERSATION_KEY);
    }
  },

  getActiveConversationId(): string | null {
    return localStorage.getItem(ACTIVE_CONVERSATION_KEY);
  },

  setActiveConversation(id: string): void {
    localStorage.setItem(ACTIVE_CONVERSATION_KEY, id);
  },

  clearAllConversations(): void {
    localStorage.removeItem(CONVERSATIONS_KEY);
    localStorage.removeItem(ACTIVE_CONVERSATION_KEY);
  }
};

// Voice History Management
export const voiceHistoryManager = {
  getAllRecords(): VoiceRecord[] {
    const saved = localStorage.getItem(VOICE_HISTORY_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((record: any) => ({
        ...record,
        timestamp: new Date(record.timestamp)
      }));
    }
    return [];
  },

  addRecord(transcript: string, duration?: number): void {
    const records = this.getAllRecords();
    const newRecord: VoiceRecord = {
      id: Date.now().toString(),
      transcript,
      timestamp: new Date(),
      duration
    };
    
    records.unshift(newRecord);
    localStorage.setItem(VOICE_HISTORY_KEY, JSON.stringify(records));
  },

  deleteRecord(id: string): void {
    const records = this.getAllRecords();
    const filtered = records.filter(record => record.id !== id);
    localStorage.setItem(VOICE_HISTORY_KEY, JSON.stringify(filtered));
  },

  clearAll(): void {
    localStorage.removeItem(VOICE_HISTORY_KEY);
  }
};

// PDF History Management
export const pdfHistoryManager = {
  getAllRecords(): PDFRecord[] {
    const saved = localStorage.getItem(PDF_HISTORY_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((record: any) => ({
        ...record,
        timestamp: new Date(record.timestamp)
      }));
    }
    return [];
  },

  addRecord(fileName: string, summary: string): void {
    const records = this.getAllRecords();
    const newRecord: PDFRecord = {
      id: Date.now().toString(),
      fileName,
      summary,
      timestamp: new Date()
    };
    
    records.unshift(newRecord);
    localStorage.setItem(PDF_HISTORY_KEY, JSON.stringify(records));
  },

  deleteRecord(id: string): void {
    const records = this.getAllRecords();
    const filtered = records.filter(record => record.id !== id);
    localStorage.setItem(PDF_HISTORY_KEY, JSON.stringify(filtered));
  },

  clearAll(): void {
    localStorage.removeItem(PDF_HISTORY_KEY);
  }
};
