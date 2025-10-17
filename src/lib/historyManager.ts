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

// Reminders & Notifications
export interface Reminder {
  id: string;
  description: string;
  dueAt: Date; // exact due datetime
  createdAt: Date;
  email?: string; // optional email to notify
  notified?: boolean; // whether in-app notification has been fired
  emailSent?: boolean; // whether email was sent (simulated)
  completed?: boolean; // manually completed
}

export interface NotificationItem {
  id: string;
  type: "reminder" | "system" | "pdf" | "voice" | "chat";
  title: string;
  message: string;
  timestamp: Date;
  read?: boolean;
  relatedId?: string; // e.g., reminder id or record id
}

// Usage Metrics
export interface AppMetrics {
  sessionCount: number; // number of times user logged in
  totalActiveMs: number; // accumulated milliseconds of active usage
  lastTick?: number; // epoch ms for last activity tick (not persisted across refresh intentionally)
}

const CONVERSATIONS_KEY = 'ai_conversations';
const ACTIVE_CONVERSATION_KEY = 'ai_active_conversation';
const VOICE_HISTORY_KEY = 'ai_voice_history';
const PDF_HISTORY_KEY = 'ai_pdf_history';
const REMINDERS_KEY = 'ai_reminders';
const NOTIFICATIONS_KEY = 'ai_notifications';
const METRICS_KEY = 'ai_metrics';
const EMAIL_OUTBOX_KEY = 'ai_email_outbox';
const NOTES_KEY = 'ai_notes';
const TODOS_KEY = 'ai_todos';
const SETTINGS_KEY = 'ai_settings';
const TOKENS_KEY = 'ai_tokens';

// App Settings
export interface AppSettings {
  reminderInApp: boolean; // in-app notifications for reminders
  reminderEmail: boolean; // email notifications for reminders
  apiKey?: string; // optional user API key to bypass internal limits
  plan?: 'free' | 'pro' | 'premium'; // pricing plan
  reduceLoad?: boolean; // if true, disable heavy visuals like 3D model
  language?: 'en' | 'hi'; // English or Hindi
  hideTokenUsage?: boolean; // hide token usage indicator in chat
}

export const settingsManager = {
  get(): AppSettings {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (!saved) return { reminderInApp: true, reminderEmail: false, plan: 'free', reduceLoad: false, language: 'en', hideTokenUsage: false };
    const parsed = JSON.parse(saved) as AppSettings;
    if (parsed.reduceLoad === undefined) parsed.reduceLoad = false;
    if (!parsed.language) parsed.language = 'en';
    if (parsed.hideTokenUsage === undefined) parsed.hideTokenUsage = false;
    return parsed;
  },
  update(partial: Partial<AppSettings>): AppSettings {
    const cur = this.get();
    const next = { ...cur, ...partial } as AppSettings;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
    try {
      window.dispatchEvent(new CustomEvent('ai_settings_updated', { detail: next }));
    } catch {}
    return next;
  },
  clear(): void {
    localStorage.removeItem(SETTINGS_KEY);
  }
};

// Token usage manager (daily)
interface TokenUsage {
  date: string; // YYYY-MM-DD
  used: number;
}

export const tokenManager = {
  getTodayKey(): string {
    const d = new Date();
    return `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getDate().toString().padStart(2,'0')}`;
  },
  getUsage(): TokenUsage {
    const saved = localStorage.getItem(TOKENS_KEY);
    const today = this.getTodayKey();
    if (!saved) return { date: today, used: 0 };
    const parsed = JSON.parse(saved) as TokenUsage;
    if (parsed.date !== today) return { date: today, used: 0 };
    return parsed;
  },
  setUsage(u: TokenUsage): void {
    localStorage.setItem(TOKENS_KEY, JSON.stringify(u));
  },
  getDailyLimit(): number {
    const s = settingsManager.get();
    if (s.apiKey && s.apiKey.trim()) return Number.POSITIVE_INFINITY; // user key bypasses local cap
    const plan = s.plan || 'free';
    if (plan === 'premium') return 50000;
    if (plan === 'pro') return 5000;
    return 500; // free
  },
  remaining(): number {
    const usage = this.getUsage();
    const limit = this.getDailyLimit();
    if (!Number.isFinite(limit)) return Number.POSITIVE_INFINITY;
    return Math.max(0, limit - usage.used);
  },
  canUse(n: number): boolean {
    const usage = this.getUsage();
    const limit = this.getDailyLimit();
    if (!Number.isFinite(limit)) return true;
    return usage.used + n <= limit;
  },
  consume(n: number): boolean {
    const usage = this.getUsage();
    const limit = this.getDailyLimit();
    if (Number.isFinite(limit) && usage.used + n > limit) return false;
    usage.used += n;
    this.setUsage(usage);
    return true;
  },
  reset(): void {
    this.setUsage({ date: this.getTodayKey(), used: 0 });
  }
};

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

    // Create a notification for the new PDF summary
    notificationsManager.add({
      type: 'pdf',
      title: 'PDF summarized',
      message: `Summary generated for "${fileName}"`,
      relatedId: newRecord.id,
    });
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

// Notifications Manager
export const notificationsManager = {
  getAll(): NotificationItem[] {
    const saved = localStorage.getItem(NOTIFICATIONS_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    return parsed.map((n: any) => ({ ...n, timestamp: new Date(n.timestamp) }));
  },

  add(input: { type: NotificationItem['type']; title: string; message: string; relatedId?: string }): NotificationItem {
    const items = this.getAll();
    const item: NotificationItem = {
      id: Date.now().toString(),
      type: input.type,
      title: input.title,
      message: input.message,
      relatedId: input.relatedId,
      read: false,
      timestamp: new Date(),
    };
    items.unshift(item);
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(items));
    return item;
  },

  markRead(id: string): void {
    const items = this.getAll();
    const idx = items.findIndex(i => i.id === id);
    if (idx !== -1) {
      items[idx].read = true;
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(items));
    }
  },

  markAllRead(): void {
    const items = this.getAll().map(i => ({ ...i, read: true }));
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(items));
  },

  unreadCount(): number {
    return this.getAll().filter(i => !i.read).length;
  },

  clear(): void {
    localStorage.removeItem(NOTIFICATIONS_KEY);
  }
};

// Email service (mock)
export interface SentEmail {
  id: string;
  to: string;
  subject: string;
  body: string;
  timestamp: Date;
}

export const emailService = {
  getOutbox(): SentEmail[] {
    const saved = localStorage.getItem(EMAIL_OUTBOX_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    return parsed.map((e: any) => ({ ...e, timestamp: new Date(e.timestamp) }));
  },
  send(to: string, subject: string, body: string): SentEmail {
    const outbox = this.getOutbox();
    const email: SentEmail = {
      id: Date.now().toString(),
      to,
      subject,
      body,
      timestamp: new Date(),
    };
    outbox.unshift(email);
    localStorage.setItem(EMAIL_OUTBOX_KEY, JSON.stringify(outbox));
    return email;
  },
  clear(): void {
    localStorage.removeItem(EMAIL_OUTBOX_KEY);
  }
};

// Reminders Manager
export const remindersManager = {
  getAll(): Reminder[] {
    const saved = localStorage.getItem(REMINDERS_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    return parsed.map((r: any) => ({
      ...r,
      dueAt: new Date(r.dueAt),
      createdAt: new Date(r.createdAt)
    }));
  },

  add(reminder: { description: string; dueAt: Date; email?: string }): Reminder {
    const all = this.getAll();
    const item: Reminder = {
      id: Date.now().toString(),
      description: reminder.description,
      dueAt: reminder.dueAt,
      createdAt: new Date(),
      email: reminder.email,
      notified: false,
      emailSent: false,
      completed: false,
    };
    all.unshift(item);
    localStorage.setItem(REMINDERS_KEY, JSON.stringify(all));

    notificationsManager.add({
      type: 'reminder',
      title: 'Reminder created',
      message: `Reminder set: ${item.description} (${item.dueAt.toLocaleString()})`,
      relatedId: item.id,
    });
    return item;
  },

  complete(id: string): void {
    const all = this.getAll();
    const idx = all.findIndex(r => r.id === id);
    if (idx !== -1) {
      all[idx].completed = true;
      localStorage.setItem(REMINDERS_KEY, JSON.stringify(all));
    }
  },

  delete(id: string): void {
    const all = this.getAll();
    const filtered = all.filter(r => r.id !== id);
    localStorage.setItem(REMINDERS_KEY, JSON.stringify(filtered));
  },

  clear(): void {
    localStorage.removeItem(REMINDERS_KEY);
  },

  // Process due reminders: create notifications and send mock emails
  processDue(now = new Date()): Reminder[] {
    const all = this.getAll();
    const processed: Reminder[] = [];
    const keep: Reminder[] = [];
    const prefs = settingsManager.get();

    for (const r of all) {
      if (!r.completed && r.dueAt.getTime() <= now.getTime()) {
        // Fire one-time reminder
        if (prefs.reminderInApp) {
          notificationsManager.add({
            type: 'reminder',
            title: 'Reminder due',
            message: r.description,
            relatedId: r.id,
          });
        }
        if (prefs.reminderEmail && r.email) {
          emailService.send(r.email, 'Reminder due', `Your reminder is due now: ${r.description}`);
        }
        processed.push(r);
        // Do not keep (one-time)
      } else {
        keep.push(r);
      }
    }

    localStorage.setItem(REMINDERS_KEY, JSON.stringify(keep));
    return processed;
  }
};

// Metrics manager to track sessions and active time
export const metricsManager = {
  get(): AppMetrics {
    const saved = localStorage.getItem(METRICS_KEY);
    if (!saved) return { sessionCount: 0, totalActiveMs: 0 };
    const parsed = JSON.parse(saved);
    return { sessionCount: parsed.sessionCount || 0, totalActiveMs: parsed.totalActiveMs || 0 } as AppMetrics;
  },

  incrementSession(): void {
    const m = this.get();
    m.sessionCount += 1;
    localStorage.setItem(METRICS_KEY, JSON.stringify(m));
  },

  addActiveMs(ms: number): void {
    if (!Number.isFinite(ms) || ms <= 0) return;
    const m = this.get();
    m.totalActiveMs += ms;
    localStorage.setItem(METRICS_KEY, JSON.stringify(m));
  },

  reset(): void {
    localStorage.removeItem(METRICS_KEY);
  },

  getTotalHours(): number {
    const m = this.get();
    return +(m.totalActiveMs / (1000 * 60 * 60)).toFixed(1);
  }
};

// Notes Manager
export interface NoteItem {
  id: string;
  text: string;
  createdAt: Date;
}

export const notesManager = {
  getAll(): NoteItem[] {
    const saved = localStorage.getItem(NOTES_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    return parsed.map((n: any) => ({ ...n, createdAt: new Date(n.createdAt) }));
  },
  add(text: string): NoteItem {
    const notes = this.getAll();
    const item: NoteItem = { id: Date.now().toString(), text: text.trim(), createdAt: new Date() };
    notes.unshift(item);
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
    return item;
  },
  delete(idOrIndex: string | number): boolean {
    const notes = this.getAll();
    let idx = -1;
    if (typeof idOrIndex === 'number') idx = idOrIndex;
    else idx = notes.findIndex(n => n.id === idOrIndex);
    if (idx >= 0 && idx < notes.length) {
      notes.splice(idx, 1);
      localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
      return true;
    }
    return false;
  },
  clear(): void {
    localStorage.removeItem(NOTES_KEY);
  }
};

// Todos Manager
export interface TodoItem {
  id: string;
  text: string;
  createdAt: Date;
  completed?: boolean;
}

export const todosManager = {
  getAll(): TodoItem[] {
    const saved = localStorage.getItem(TODOS_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    return parsed.map((t: any) => ({ ...t, createdAt: new Date(t.createdAt) }));
  },
  add(text: string): TodoItem {
    const todos = this.getAll();
    const item: TodoItem = { id: Date.now().toString(), text: text.trim(), createdAt: new Date(), completed: false };
    todos.unshift(item);
    localStorage.setItem(TODOS_KEY, JSON.stringify(todos));
    return item;
  },
  complete(idOrIndex: string | number): boolean {
    const todos = this.getAll();
    let idx = -1;
    if (typeof idOrIndex === 'number') idx = idOrIndex;
    else idx = todos.findIndex(t => t.id === idOrIndex);
    if (idx >= 0 && idx < todos.length) {
      todos[idx].completed = true;
      localStorage.setItem(TODOS_KEY, JSON.stringify(todos));
      return true;
    }
    return false;
  },
  delete(idOrIndex: string | number): boolean {
    const todos = this.getAll();
    let idx = -1;
    if (typeof idOrIndex === 'number') idx = idOrIndex;
    else idx = todos.findIndex(t => t.id === idOrIndex);
    if (idx >= 0 && idx < todos.length) {
      todos.splice(idx, 1);
      localStorage.setItem(TODOS_KEY, JSON.stringify(todos));
      return true;
    }
    return false;
  },
  clear(): void {
    localStorage.removeItem(TODOS_KEY);
  }
};
