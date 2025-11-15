import { remindersManager, notificationsManager, notesManager, todosManager, metricsManager, conversationManager, voiceHistoryManager, pdfHistoryManager } from "./historyManager";
import { authService } from "./auth";

export interface CommandResult {
  handled: boolean;
  aiResponse?: string;
}

// Map common service names to URLs
const SERVICE_URLS: Record<string, string> = {
  youtube: "https://www.youtube.com",
  instagram: "https://www.instagram.com",
  facebook: "https://www.facebook.com",
  twitter: "https://x.com",
  x: "https://x.com",
  reddit: "https://www.reddit.com",
  gmail: "https://mail.google.com",
  mail: "https://mail.google.com",
  linkedin: "https://www.linkedin.com",
  github: "https://github.com",
  gitlab: "https://gitlab.com",
  notion: "https://www.notion.so",
  spotify: "https://open.spotify.com",
  netflix: "https://www.netflix.com",
  whatsapp: "https://web.whatsapp.com",
  drive: "https://drive.google.com",
  calendar: "https://calendar.google.com",
  docs: "https://docs.google.com",
  sheets: "https://sheets.google.com",
  maps: "https://maps.google.com",
  amazon: "https://www.amazon.com",
  flipkart: "https://www.flipkart.com",
  wikipedia: "https://www.wikipedia.org",
};

type SearchEngineKey = "google" | "youtube";

const SEARCH_ENGINES: Record<SearchEngineKey, { label: string; buildUrl: (query: string) => string }> = {
  google: {
    label: "Google",
    buildUrl: (query: string) => `https://www.google.com/search?q=${encodeURIComponent(query)}`,
  },
  youtube: {
    label: "YouTube",
    buildUrl: (query: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
  },
};

const SEARCH_ENGINE_ALIASES: Record<string, SearchEngineKey> = {
  google: "google",
  goog: "google",
  g: "google",
  youtube: "youtube",
  yt: "youtube",
};

function toUrl(targetRaw: string): string | null {
  let target = targetRaw.trim();
  // drop leading 'the '
  target = target.replace(/^the\s+/i, "");
  // If includes a scheme or looks like a URL
  if (/^https?:\/\//i.test(target)) return target;
  if (/^[\w-]+\.[\w.-]+(\/.*)?$/i.test(target)) return `https://${target}`;

  const key = target.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (SERVICE_URLS[key]) return SERVICE_URLS[key];

  // Try simple .com heuristic
  if (/^[a-z0-9-]+$/i.test(key)) return `https://${key}.com`;

  // Fallback to search
  const q = encodeURIComponent(targetRaw);
  return `https://www.google.com/search?q=${q}`;
}

function openTarget(target: string): string {
  const url = toUrl(target);
  if (url) {
    try { window.open(url, "_blank", "noopener,noreferrer"); } catch {}
    return `Opening ${url} in a new tab.`;
  }
  return "I couldn't determine the URL to open.";
}

function resolveSearchEngine(raw: string | undefined | null): SearchEngineKey | null {
  if (!raw) return null;
  const key = raw.toLowerCase().replace(/[^a-z]/g, "");
  return SEARCH_ENGINE_ALIASES[key] || null;
}

function openSearch(engine: SearchEngineKey, query: string): string {
  const trimmed = query.trim();
  if (!trimmed) {
    return `Please tell me what to search on ${SEARCH_ENGINES[engine].label}.`;
  }
  const url = SEARCH_ENGINES[engine].buildUrl(trimmed);
  try { window.open(url, "_blank", "noopener,noreferrer"); } catch {}
  return `Searching "${trimmed}" on ${SEARCH_ENGINES[engine].label}.`;
}

function parseTimePhraseToDate(timePhrase: string): Date | null {
  const now = new Date();
  const raw = timePhrase.trim();
  if (!raw) return null;
  const phrase = raw.toLowerCase();

  const setClockTime = (target: Date, clockRaw: string): boolean => {
    const cleaned = clockRaw.replace(/^at\s+/, '').trim();
    const match = cleaned.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    if (!match) return false;
    let h = parseInt(match[1], 10);
    const min = match[2] ? parseInt(match[2], 10) : 0;
    const ampm = match[3]?.toLowerCase();
    if (ampm) {
      if (ampm === 'pm' && h < 12) h += 12;
      if (ampm === 'am' && h === 12) h = 0;
    }
    if (!ampm && h === 24) h = 0;
    if (h > 23 || min > 59) return false;
    target.setHours(h, min, 0, 0);
    return true;
  };

  const addMinutes = (mins: number) => new Date(now.getTime() + mins * 60 * 1000);

  const relativeFew = phrase.match(/(?:in|after)\s+(?:a\s+few|few|some)\s+(minute|minutes|min|hour|hours|hr|hrs)/);
  if (relativeFew) {
    const unit = relativeFew[1];
    const minutes = /hour|hr/.test(unit) ? 120 : 5;
    return addMinutes(minutes);
  }

  const relative = phrase.match(/(?:in|after)\s+(\d+)\s*(minute|minutes|min|hour|hours|hr|hrs|day|days)/);
  if (relative) {
    const amount = parseInt(relative[1], 10);
    const unit = relative[2];
    let minutes = amount;
    if (/hour|hr/.test(unit)) minutes = amount * 60;
    if (/day/.test(unit)) minutes = amount * 60 * 24;
    return addMinutes(minutes);
  }

  const tomorrow = phrase.match(/^tomorrow(?:\s+at\s+(.+))?$/);
  if (tomorrow) {
    const dt = new Date(now);
    dt.setDate(dt.getDate() + 1);
    dt.setSeconds(0, 0);
    const timePart = tomorrow[1];
    if (timePart) {
      if (!setClockTime(dt, timePart)) return null;
    } else {
      dt.setHours(now.getHours(), now.getMinutes(), 0, 0);
    }
    return dt;
  }

  const today = phrase.match(/^today(?:\s+at\s+(.+))?$/);
  if (today) {
    const dt = new Date(now);
    dt.setSeconds(0, 0);
    const timePart = today[1];
    if (timePart) {
      if (!setClockTime(dt, timePart)) return null;
      if (dt.getTime() <= now.getTime()) {
        dt.setDate(dt.getDate() + 1);
      }
    }
    return dt;
  }

  let m = phrase.replace(/^at\s+/, '').match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
  if (m) {
    const dt = new Date(now);
    dt.setSeconds(0, 0);
    if (!setClockTime(dt, m[0])) return null;
    if (dt.getTime() <= now.getTime()) {
      dt.setDate(dt.getDate() + 1);
    }
    return dt;
  }

  const dt = new Date(raw);
  if (!isNaN(dt.getTime())) return dt;
  return null;
}

function tryReminder(text: string): CommandResult | null {
  type Extracted = { time: string; desc: string };
  const patterns: Array<{ regex: RegExp; map: (match: RegExpMatchArray) => Extracted }> = [
    {
      regex: /remind\s+me\s+in\s+(.+?)\s+(?:to|about|for)\s+(.+)/i,
      map: (m) => ({ time: m[1], desc: m[2] })
    },
    {
      regex: /set\s+(?:a\s+)?reminders?\s+in\s+(.+?)\s+(?:to|about|for)\s+(.+)/i,
      map: (m) => ({ time: m[1], desc: m[2] })
    },
    {
      regex: /remind\s+me\s+tomorrow(?:\s+at\s+(.+?))?\s+(?:to|about|for)\s+(.+)/i,
      map: (m) => ({ time: m[1] ? `tomorrow at ${m[1]}` : 'tomorrow', desc: m[2] })
    },
    {
      regex: /set\s+(?:a\s+)?reminders?\s+for\s+(.+?)\s+(tomorrow|today)(?:\s+at\s+(.+))?/i,
      map: (m) => ({ desc: m[1], time: m[3] ? `${m[2]} at ${m[3]}` : m[2] })
    },
    {
      regex: /remind\s+me\s+at\s+(.+?)\s+(?:to|about|for)\s+(.+)/i,
      map: (m) => ({ time: m[1], desc: m[2] })
    },
    {
      regex: /set\s+(?:a\s+)?reminders?\s+at\s+(.+?)\s+(?:for|about)\s+(.+)/i,
      map: (m) => ({ time: m[1], desc: m[2] })
    },
    {
      regex: /set\s+(?:a\s+)?reminders?\s+for\s+(.+?)\s+at\s+(.+)/i,
      map: (m) => ({ desc: m[1], time: m[2] })
    },
    {
      regex: /set\s+(?:a\s+)?reminders?\s+for\s+(.+?)\s+in\s+(.+)/i,
      map: (m) => ({ desc: m[1], time: m[2] })
    },
    {
      regex: /remind\s+me\s+(?:about|of|for)\s+(.+?)\s+in\s+(.+)/i,
      map: (m) => ({ desc: m[1], time: m[2] })
    },
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern.regex);
    if (match) {
      const { time, desc } = pattern.map(match);
      const due = parseTimePhraseToDate(time);
      if (!due) {
        return { handled: true, aiResponse: `I couldn't understand the time "${time}".` };
      }
      const finalDesc = desc.trim();
      if (!finalDesc) {
        return { handled: true, aiResponse: 'Please tell me what to remind you about.' };
      }
      const user = authService.getCurrentUser();
      const item = remindersManager.add({ description: finalDesc, dueAt: due, email: user?.email });
      notificationsManager.add({ type: 'reminder', title: 'Reminder created', message: `${finalDesc} (${due.toLocaleString()})`, relatedId: item.id });
      return { handled: true, aiResponse: `Reminder set for ${due.toLocaleString()}${user?.email ? ` (email: ${user.email})` : ''}: "${finalDesc}".` };
    }
  }

  const mSimple = text.match(/set\s+reminders?\s+for\s+\"([^\"]+)\"/i) || text.match(/set\s+reminders?\s+for\s+'([^']+)'/i) || text.match(/set\s+reminders?\s+for\s+(.+)/i);
  if (mSimple) {
    const desc = (mSimple[1] || '').trim();
    const due = new Date(Date.now() + 60 * 60 * 1000);
    const user = authService.getCurrentUser();
    const item = remindersManager.add({ description: desc, dueAt: due, email: user?.email });
    notificationsManager.add({ type: 'reminder', title: 'Reminder created', message: `${desc} (${due.toLocaleString()})`, relatedId: item.id });
    return { handled: true, aiResponse: `Reminder set for ${due.toLocaleString()}${user?.email ? ` (email: ${user.email})` : ''}: "${desc}".` };
  }
  return null;
}

function tryOpen(text: string): CommandResult | null {
  // Capture minimal target up to a connector like "and" or "then" or punctuation
  const m = text.match(/^(?:please\s+)?(?:open|launch|visit|go\s*to|navigate\s*to)\s+(.+?)(?:\s+(?:and|then)\b|[.,;]|$)/i);
  if (m) {
    const target = (m[1] || '').trim();
    if (!target) return null;
    const response = openTarget(target);
    return { handled: true, aiResponse: response };
  }
  return null;
}

function trySearchCommand(text: string): CommandResult | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  let engine: SearchEngineKey | null = null;
  let query: string | null = null;

  const searchOn = trimmed.match(/^(?:search|look\s*up)\s+(?:for\s+)?(.+?)\s+(?:on|in|with|using|og)\s+([a-z0-9 .]+)/i);
  if (searchOn) {
    engine = resolveSearchEngine(searchOn[2]);
    query = searchOn[1];
  }

  if (!engine) {
    const engineFirst = trimmed.match(/^(?:search|look\s*up)\s+([a-z0-9 .]+)\s+(?:for\s+)?(.+)/i);
    if (engineFirst) {
      engine = resolveSearchEngine(engineFirst[1]);
      if (engine) query = engineFirst[2];
    }
  }

  if (!engine) {
    const openAndSearch = trimmed.match(/^(?:please\s+)?(?:open\s+)?([a-z0-9 .]+)\s+(?:and\s+)?(?:search|look\s*up)\s+(?:for\s+)?(.+?)(?:\s+on\s+it)?$/i);
    if (openAndSearch) {
      engine = resolveSearchEngine(openAndSearch[1]);
      if (engine) query = openAndSearch[2];
    }
  }

  if (!engine && /^(?:search|look\s*up)/i.test(trimmed)) {
    engine = "google";
    query = trimmed.replace(/^(?:search|look\s*up)\s+(?:for\s+)?/i, "").trim();
  }

  if (!engine || !query) return null;
  return { handled: true, aiResponse: openSearch(engine, query) };
}

// Split utterance into multiple intents using connectors outside quotes
function splitMultiIntents(input: string): string[] {
  const out: string[] = [];
  let buf = "";
  let quote: '"' | "'" | null = null;
  const lower = input;
  // We'll scan words to detect connectors only when surrounded by spaces and not inside quotes
  for (let i = 0; i < lower.length; i++) {
    const ch = lower[i];
    if ((ch === '"' || ch === "'") && (quote === null || quote === ch)) {
      quote = quote === null ? (ch as '"' | "'") : null;
      buf += ch;
      continue;
    }
    if (!quote) {
      // punctuation as hard splitters
      if (ch === ';') {
        if (buf.trim()) out.push(buf.trim());
        buf = "";
        continue;
      }
      // Check for word connectors
      if (/[a-z]/i.test(ch)) {
        // potential start of a word; check upcoming sequence for connectors
        const rest = lower.slice(i);
        const match = rest.match(/^\s*(and|then)\b/i);
        if (match && buf.trim()) {
          // finalize current buffer and skip the connector
          out.push(buf.trim());
          buf = "";
          i += match[0].length - 1; // -1 because for-loop will i++
          continue;
        }
      }
    }
    buf += ch;
  }
  if (buf.trim()) out.push(buf.trim());
  return out;
}

export function tryHandleCommand(text: string): CommandResult {
  const t = text.trim();
  const searchRes = trySearchCommand(t);
  if (searchRes) return searchRes;
  // Priority: open -> reminder
  const openRes = tryOpen(t);
  if (openRes) return openRes;

  const remRes = tryReminder(t);
  if (remRes) return remRes;

  // Help / capabilities
  if (/^(help|what\s+can\s+you\s+do\??)$/i.test(t)) {
    const lines = [
      'Open: "open youtube", "open instagram", "open chat", "open notifications"',
      'Reminders: "set reminder at 5:30 pm for walk", "set reminder in 20 minutes for tea"',
      'Notes: "note buy milk", "list notes", "delete note 1", "clear notes"',
      'Todos: "add todo pay bills", "list todos", "complete todo 2", "clear todos"',
      'Stats: "show stats"',
      'History: "show chat history", "show voice history", "show pdf history"',
      'Notifications: "mark all read", "clear notifications"',
      'Clear: "clear conversations", "clear voice history", "clear pdf history"',
      'Timer: "set timer for 10 minutes"',
      'Stopwatch: "stopwatch" then "stop stopwatch"',
      'Coin/Dice: "flip coin", "roll d20", "roll 2d6"',
      'Math: "calc 2+2*3"',
      'Time/Date: "what time is it?", "what date is it?", "days until 25 Dec 2025"',
      'Clipboard: "copy Hello world"',
      'Convert: "convert 10 km to miles", "convert 72 F to C"',
    ];
    return { handled: true, aiResponse: lines.join('\n') };
  }

  // Notes
  const noteAdd = t.match(/^note\s+(?:down\s+)?(.+)/i) || t.match(/^add\s+note\s+(.+)/i) || t.match(/^save\s+note\s+(.+)/i);
  if (noteAdd) {
    const item = notesManager.add(noteAdd[1]);
    notificationsManager.add({ type: 'system', title: 'Note saved', message: item.text, relatedId: item.id });
    return { handled: true, aiResponse: `Saved note: "${item.text}"` };
  }
  if (/^list\s+notes$/i.test(t) || /^show\s+notes$/i.test(t)) {
    const notes = notesManager.getAll();
    return { handled: true, aiResponse: notes.length ? notes.map((n,i)=>`${i+1}. ${n.text}`).join('\n') : 'No notes yet.' };
  }
  const delNote = t.match(/^(?:delete|remove)\s+note\s+(\d+|[a-z0-9]+)/i) || t.match(/^clear\s+notes$/i);
  if (delNote) {
    if (/clear\s+notes/i.test(t)) { notesManager.clear(); return { handled: true, aiResponse: 'Cleared all notes.' }; }
    const arg = delNote[1];
    const ok = /\d+/.test(arg) ? notesManager.delete(parseInt(arg,10)-1) : notesManager.delete(arg);
    return { handled: true, aiResponse: ok ? 'Deleted note.' : 'Note not found.' };
  }

  // Todos
  const todoAdd = t.match(/^add\s+todo\s+(.+)/i) || t.match(/^todo\s+(.+)/i) || t.match(/^remember\s+to\s+(.+)/i);
  if (todoAdd) {
    const item = todosManager.add(todoAdd[1]);
    notificationsManager.add({ type: 'system', title: 'Todo added', message: item.text, relatedId: item.id });
    return { handled: true, aiResponse: `Added todo: "${item.text}"` };
  }
  if (/^list\s+todos?$/i.test(t) || /^show\s+todos?$/i.test(t)) {
    const todos = todosManager.getAll();
    return { handled: true, aiResponse: todos.length ? todos.map((n,i)=>`${i+1}. [${n.completed?'x':' '}] ${n.text}`).join('\n') : 'No todos yet.' };
  }
  const completeTodo = t.match(/^(?:complete|done|finish|check)\s+todo\s+(\d+|[a-z0-9]+)/i);
  if (completeTodo) {
    const arg = completeTodo[1];
    const ok = /\d+/.test(arg) ? todosManager.complete(parseInt(arg,10)-1) : todosManager.complete(arg);
    return { handled: true, aiResponse: ok ? 'Marked todo completed.' : 'Todo not found.' };
  }
  const deleteTodo = t.match(/^(?:delete|remove)\s+todo\s+(\d+|[a-z0-9]+)/i) || t.match(/^clear\s+todos$/i);
  if (deleteTodo) {
    if (/clear\s+todos/i.test(t)) { todosManager.clear(); return { handled: true, aiResponse: 'Cleared all todos.' }; }
    const arg = deleteTodo[1];
    const ok = /\d+/.test(arg) ? todosManager.delete(parseInt(arg,10)-1) : todosManager.delete(arg);
    return { handled: true, aiResponse: ok ? 'Deleted todo.' : 'Todo not found.' };
  }

  // Math (simple)
  const math = t.match(/^calc(?:ulate)?\s+(.+)/i) || t.match(/^what\s+is\s+([0-9+\-*/().\s]+)\??$/i);
  if (math) {
    try {
      const expr = math[1].trim();
      if (!/^[0-9+\-*/().\s]+$/.test(expr)) {
        return { handled: true, aiResponse: 'Only simple arithmetic is supported.' };
      }
      // eslint-disable-next-line no-new-func
      const val = Function(`\"use strict\"; return (${expr});`)();
      if (typeof val === 'number' && Number.isFinite(val)) {
        return { handled: true, aiResponse: `${val}` };
      }
    } catch {}
    return { handled: true, aiResponse: 'Sorry, I could not compute that.' };
  }

  // Coin toss / dice roll
  if (/^flip\s+coin$/i.test(t) || /^toss\s+coin$/i.test(t)) {
    return { handled: true, aiResponse: Math.random() < 0.5 ? 'Heads' : 'Tails' };
  }
  const dice = t.match(/^roll\s+(\d*)d(\d+)$/i) || t.match(/^roll\s+dice$/i);
  if (dice) {
    const count = dice[1] ? Math.min(parseInt(dice[1],10), 20) : 1;
    const sides = dice[2] ? Math.min(parseInt(dice[2],10), 100) : 6;
    const results = Array.from({length: count}, () => 1 + Math.floor(Math.random()*sides));
    return { handled: true, aiResponse: `Rolls: ${results.join(', ')} | Sum: ${results.reduce((a,b)=>a+b,0)}` };
  }

  // Date/time
  if (/^what\s+time\s+is\s+it\??$/i.test(t) || /^current\s+time$/i.test(t)) {
    return { handled: true, aiResponse: new Date().toLocaleTimeString() };
  }
  if (/^what\s+date\s+is\s+it\??$/i.test(t) || /^current\s+date$/i.test(t)) {
    return { handled: true, aiResponse: new Date().toLocaleDateString() };
  }

  // Timers and stopwatch (basic, in-app notification only)
  const timer = t.match(/^set\s+timer\s+for\s+(\d+)\s*(seconds?|minutes?|mins?)$/i);
  if (timer) {
    const amount = parseInt(timer[1], 10);
    const unit = timer[2].toLowerCase();
    const ms = /sec/.test(unit) ? amount*1000 : amount*60*1000;
    setTimeout(() => {
      notificationsManager.add({ type: 'system', title: 'Timer', message: `${amount} ${unit} elapsed`});
    }, ms) as unknown as number;
    return { handled: true, aiResponse: `Timer set for ${amount} ${unit}.` };
  }
  if (/^(start\s+)?stopwatch$/i.test(t)) {
    const start = Date.now();
    notificationsManager.add({ type: 'system', title: 'Stopwatch started', message: new Date(start).toLocaleTimeString()});
    return { handled: true, aiResponse: 'Stopwatch started. I will keep time until you say "stop stopwatch".' };
  }
  if (/^stop\s+stopwatch$/i.test(t)) {
    // No persistent stopwatch; give elapsed since last mark could be added using localStorage if needed
    return { handled: true, aiResponse: 'Stopwatch stopped.' };
  }

  // App navigation shortcuts
  if (/^open\s+chat$/i.test(t)) { try { window.location.assign('/chat'); } catch{} return { handled: true, aiResponse: 'Opening Chat…' }; }
  if (/^open\s+(ai\s*)?tools$/i.test(t)) { try { window.location.assign('/ai-tools'); } catch{} return { handled: true, aiResponse: 'Opening AI Tools…' }; }
  if (/^open\s+voice$/i.test(t)) { try { window.location.assign('/voice'); } catch{} return { handled: true, aiResponse: 'Opening Voice…' }; }
  if (/^open\s+(home|dashboard)$/i.test(t)) { try { window.location.assign('/home'); } catch{} return { handled: true, aiResponse: 'Opening Home…' }; }
  if (/^open\s+notifications?$/i.test(t)) { try { window.location.assign('/notifications'); } catch{} return { handled: true, aiResponse: 'Opening Notifications…' }; }
  if (/^open\s+settings$/i.test(t)) { try { window.location.assign('/settings'); } catch{} return { handled: true, aiResponse: 'Opening Settings…' }; }
  if (/^open\s+profile$/i.test(t)) { try { window.location.assign('/profile'); } catch{} return { handled: true, aiResponse: 'Opening Profile…' }; }

  // App stats
  if (/^show\s+stats$/i.test(t) || /^usage\s+stats$/i.test(t)) {
    const chats = conversationManager.getAllConversations().length;
    const sessions = metricsManager.get().sessionCount;
    const hours = metricsManager.getTotalHours();
    return { handled: true, aiResponse: `Chats: ${chats}\nSessions: ${sessions}\nHours active: ${hours}` };
  }

  // History lookups
  if (/^show\s+chat\s+history$/i.test(t)) {
    const convos = conversationManager.getAllConversations();
    const titles = convos.map((c,i)=>`${i+1}. ${c.title}`).join('\n');
    return { handled: true, aiResponse: titles || 'No chat history.' };
  }
  if (/^show\s+voice\s+history$/i.test(t)) {
    const items = voiceHistoryManager.getAllRecords();
    return { handled: true, aiResponse: items.length ? items.map((r,i)=>`${i+1}. ${r.transcript} (${r.timestamp.toLocaleString()})`).join('\n') : 'No voice history.' };
  }
  if (/^show\s+pdf\s+history$/i.test(t)) {
    const items = pdfHistoryManager.getAllRecords();
    return { handled: true, aiResponse: items.length ? items.map((r,i)=>`${i+1}. ${r.fileName} (${r.timestamp.toLocaleString()})`).join('\n') : 'No PDF history.' };
  }

  // Notifications management quick actions
  if (/^mark\s+all\s+read$/i.test(t)) { notificationsManager.markAllRead(); return { handled: true, aiResponse: 'Marked all notifications as read.' }; }
  if (/^clear\s+notifications$/i.test(t)) { notificationsManager.clear(); return { handled: true, aiResponse: 'Cleared notifications.' }; }

  // Clipboard copy
  const copy = t.match(/^copy\s+"([^"]+)"$/i) || t.match(/^copy\s+'([^']+)'$/i) || t.match(/^copy\s+(.+)/i);
  if (copy) {
    const textToCopy = copy[1];
    try {
      // navigator.clipboard may be blocked on insecure origins
      // @ts-ignore
      if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
        // @ts-ignore
        navigator.clipboard.writeText(textToCopy);
        return { handled: true, aiResponse: 'Copied to clipboard.' };
      }
    } catch {}
    return { handled: true, aiResponse: 'Clipboard not available here.' };
  }

  // Unit conversions
  const convert = t.match(/^convert\s+([\d.]+)\s*([a-z°]+)\s+(?:to|in)\s+([a-z°]+)$/i);
  if (convert) {
    const val = parseFloat(convert[1]);
    const from = convert[2].toLowerCase();
    const to = convert[3].toLowerCase();
    const kmToMiles = (n:number)=> n*0.621371;
    const milesToKm = (n:number)=> n/0.621371;
    const cToF = (n:number)=> n*9/5+32;
    const fToC = (n:number)=> (n-32)*5/9;
    const cmToIn = (n:number)=> n/2.54;
    const inToCm = (n:number)=> n*2.54;
    const mToFt = (n:number)=> n*3.28084;
    const ftToM = (n:number)=> n/3.28084;
    const norm = (u:string)=> ({
      'km':'km','kilometer':'km','kilometers':'km',
      'mi':'mi','mile':'mi','miles':'mi',
      'c':'c','°c':'c','celsius':'c',
      'f':'f','°f':'f','fahrenheit':'f',
      'cm':'cm','centimeter':'cm','centimeters':'cm',
      'inch':'in','inches':'in','in':'in',
      'm':'m','meter':'m','meters':'m',
      'ft':'ft','foot':'ft','feet':'ft'
    }[u] || u);
    const F = norm(from), T = norm(to);
    let out: number | null = null;
    if (F==='km' && T==='mi') out = kmToMiles(val);
    else if (F==='mi' && T==='km') out = milesToKm(val);
    else if (F==='c' && T==='f') out = cToF(val);
    else if (F==='f' && T==='c') out = fToC(val);
    else if (F==='cm' && T==='in') out = cmToIn(val);
    else if (F==='in' && T==='cm') out = inToCm(val);
    else if (F==='m' && T==='ft') out = mToFt(val);
    else if (F==='ft' && T==='m') out = ftToM(val);
    if (out != null) return { handled: true, aiResponse: `${val} ${from} = ${+out.toFixed(3)} ${to}` };
    return { handled: true, aiResponse: 'Sorry, I do not support that conversion yet.' };
  }

  // Days until date
  const daysUntil = t.match(/^days\s+until\s+(.+)/i);
  if (daysUntil) {
    const when = new Date(daysUntil[1]);
    if (!isNaN(when.getTime())) {
      const now = new Date();
      const diff = Math.ceil((when.getTime() - now.getTime())/(1000*60*60*24));
      return { handled: true, aiResponse: diff >= 0 ? `${diff} day(s)` : `${-diff} day(s) ago` };
    }
    return { handled: true, aiResponse: 'Could not understand that date.' };
  }

  // Clear misc
  if (/^clear\s+(history|conversations)$/i.test(t)) { conversationManager.clearAllConversations(); return { handled: true, aiResponse: 'Cleared all conversations.' }; }
  if (/^clear\s+voice\s+history$/i.test(t)) { voiceHistoryManager.clearAll(); return { handled: true, aiResponse: 'Cleared voice history.' }; }
  if (/^clear\s+pdf\s+history$/i.test(t)) { pdfHistoryManager.clearAll(); return { handled: true, aiResponse: 'Cleared PDF history.' }; }

  return { handled: false };
}

// Handle possible multiple intents in one utterance, sequentially
export function tryHandleMultiCommand(text: string): CommandResult {
  const parts = splitMultiIntents(text).filter(Boolean);
  if (parts.length <= 1) return tryHandleCommand(text);
  const responses: string[] = [];
  let anyHandled = false;
  for (const part of parts) {
    const res = tryHandleCommand(part);
    if (res.handled) {
      anyHandled = true;
      if (res.aiResponse) responses.push(res.aiResponse);
    }
  }
  return { handled: anyHandled, aiResponse: responses.join('\n') };
}
