import React, { useEffect, useRef, useState } from "react";
import { Navbar } from "../../components/Navbar";
import {
  FileText,
  Upload,
  Sparkles,
  Loader2,
  History,
  Clock,
  Trash2,
  CalendarClock,
  MailCheck,
  MessageCircle,
  Send,
  Paperclip,
  Bot,
  User,
  Image as ImageIcon,
  X,
} from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { pdfHistoryManager, remindersManager } from "../../lib/historyManager";
import { authService } from "../../lib/auth";
import { t, useI18n } from "../../lib/i18n";
import { useToast } from "../../components/ToastProvider";
import { aiComplete } from "../../lib/ai";
import { generateImage } from "../../lib/imageTool";
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker?url";
import type { TextItem } from "pdfjs-dist/types/src/display/api";

if (typeof window !== "undefined") {
  GlobalWorkerOptions.workerSrc = pdfWorker;
}

type ToolId = "pdf-chat" | "set-reminder" | "ai-image";

interface Tool {
  id: ToolId;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "ai";
  text: string;
  timestamp: Date;
}

interface ExtractedPdf {
  text: string;
  pages: number;
}

interface StoredPdfSession {
  fileName: string;
  fileSize: number;
  pages: number;
  text: string;
  updatedAt: string;
}

interface StoredChatMessage extends Pick<ChatMessage, "id" | "role" | "text"> {
  timestamp: string;
}

interface StoredChatSnapshot {
  docName: string;
  messages: StoredChatMessage[];
  updatedAt: string;
}

const MAX_CONTEXT_CHARS = 15000;
const MAX_PAGES_TO_PARSE = 40;
const QUICK_PROMPTS = [
  "Give me the executive summary.",
  "List the key risks or blockers.",
  "What action items are assigned to me?",
  "Extract every deadline or date.",
  "Translate section 2 into simple language.",
];

const PDF_SESSION_KEY = "ai_pdf_session_v1";
const PDF_CHAT_KEY = "ai_pdf_chat_v1";
const isBrowser = typeof window !== "undefined";

const readStoredSession = (): StoredPdfSession | null => {
  if (!isBrowser) return null;
  try {
    const raw = localStorage.getItem(PDF_SESSION_KEY);
    return raw ? (JSON.parse(raw) as StoredPdfSession) : null;
  } catch {
    return null;
  }
};

const persistStoredSession = (session: StoredPdfSession) => {
  if (!isBrowser) return;
  try {
    localStorage.setItem(PDF_SESSION_KEY, JSON.stringify(session));
  } catch {}
};

const clearStoredSession = () => {
  if (!isBrowser) return;
  try {
    localStorage.removeItem(PDF_SESSION_KEY);
  } catch {}
};

const readStoredChat = (docName: string): ChatMessage[] | null => {
  if (!isBrowser || !docName) return null;
  try {
    const raw = localStorage.getItem(PDF_CHAT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredChatSnapshot;
    if (parsed.docName !== docName || !Array.isArray(parsed.messages)) return null;
    return parsed.messages.map((msg) => ({
      id: msg.id,
      role: msg.role,
      text: msg.text,
      timestamp: new Date(msg.timestamp),
    }));
  } catch {
    return null;
  }
};

const persistStoredChat = (docName: string, messages: ChatMessage[]) => {
  if (!isBrowser || !docName) return;
  try {
    const payload: StoredChatSnapshot = {
      docName,
      updatedAt: new Date().toISOString(),
      messages: messages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        text: msg.text,
        timestamp:
          msg.timestamp instanceof Date ? msg.timestamp.toISOString() : new Date(msg.timestamp).toISOString(),
      })),
    };
    localStorage.setItem(PDF_CHAT_KEY, JSON.stringify(payload));
  } catch {}
};

const clearStoredChat = () => {
  if (!isBrowser) return;
  try {
    localStorage.removeItem(PDF_CHAT_KEY);
  } catch {}
};

const formatBytes = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) return "-";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;
  return `${value.toFixed(value >= 100 ? 0 : 1)} ${units[index]}`;
};

const isTextItem = (item: unknown): item is TextItem => typeof (item as TextItem)?.str === "string";

const extractPdfContent = async (file: File): Promise<ExtractedPdf> => {
  const data = await file.arrayBuffer();
  const pdf = await getDocument({ data }).promise;
  const limit = Math.min(pdf.numPages, MAX_PAGES_TO_PARSE);
  let text = "";

  for (let pageNumber = 1; pageNumber <= limit; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => (isTextItem(item) ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    text += `${pageText}\n`;
  }

  if (pdf.numPages > MAX_PAGES_TO_PARSE) {
    text += `\n[Document truncated after ${MAX_PAGES_TO_PARSE} of ${pdf.numPages} pages]`;
  }

  pdf.cleanup();
  return { text, pages: pdf.numPages };
};

const buildPrompt = (
  snippet: string,
  messages: ChatMessage[],
  question: string,
  meta: { name?: string; pages?: number }
): string => {
  const recent = messages
    .slice(-8)
    .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.text}`)
    .join("\n");

  return `You are a meticulous research assistant helping me study the PDF "${
    meta.name || "document"
  }" (${meta.pages || "?"} pages). Use only the document excerpt below to craft clear, concise answers. When relevant, cite the section or quote directly.

Document excerpt (truncated to ${snippet.length} characters):
"""
${snippet}
"""

${recent ? `Conversation so far:\n${recent}\n\n` : ""}Latest question: ${question}
Reply in markdown, using lists or tables when it improves clarity.`;
};

export const AITools = (): JSX.Element => {
  useI18n();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activeDocMeta, setActiveDocMeta] = useState<{ name: string; size: number } | null>(null);
  const [pdfData, setPdfData] = useState<ExtractedPdf | null>(null);
  const [uploadPhase, setUploadPhase] = useState<"idle" | "reading" | "ready" | "error">("idle");
  const [uploadError, setUploadError] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "intro",
      role: "ai",
      text: "Upload a PDF to start chatting with it.",
      timestamp: new Date(),
    },
  ]);
  const [question, setQuestion] = useState("");
  const [isChatting, setIsChatting] = useState(false);
  const [history, setHistory] = useState(() => pdfHistoryManager.getAllRecords());
  const [reminders, setReminders] = useState(remindersManager.getAll());
  const currentUser = authService.getCurrentUser();
  const [remDesc, setRemDesc] = useState("");
  const [remDate, setRemDate] = useState("");
  const [remTime, setRemTime] = useState("");
  const [remEmail, setRemEmail] = useState(currentUser?.email || "");
  const [remSuccess, setRemSuccess] = useState("");
  const [imagePrompt, setImagePrompt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState("");
  const [activeTool, setActiveTool] = useState<ToolId | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const { showToast } = useToast();
  const activeDocName = selectedFile?.name || activeDocMeta?.name || "";
  const activeDocSize = selectedFile?.size || activeDocMeta?.size || 0;

  useEffect(() => {
    const id = setInterval(() => setReminders(remindersManager.getAll()), 3000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    const stored = readStoredSession();
    if (!stored || !stored.text) return;
    setPdfData({ text: stored.text, pages: stored.pages });
    setUploadPhase("ready");
    setActiveDocMeta({ name: stored.fileName, size: stored.fileSize });
    const restoredMessages = readStoredChat(stored.fileName);
    if (restoredMessages?.length) {
      setChatMessages(restoredMessages);
    } else {
      setChatMessages([
        {
          id: "restored-intro",
          role: "ai",
          text: `Restored "${stored.fileName}". Ask anything about it!`,
          timestamp: new Date(),
        },
      ]);
    }
  }, []);

  useEffect(() => {
    if (!pdfData || !activeDocName) return;
    persistStoredChat(activeDocName, chatMessages);
  }, [chatMessages, pdfData, activeDocName]);

  const tools: Tool[] = [
    {
      id: "pdf-chat",
      name: t("pdfSummarizer"),
      description: "Grounded PDF Q&A with Groq context.",
      icon: <FileText className="w-6 h-6 text-white" />,
      color: "from-blue-600 to-blue-700",
    },
    {
      id: "set-reminder",
      name: t("setReminder"),
      description: t("aiToolsSubtitle"),
      icon: <CalendarClock className="w-6 h-6 text-white" />,
      color: "from-purple-600 to-purple-700",
    },
    {
      id: "ai-image",
      name: "AI Image Generator",
      description: "Create branded visuals with Puter AI.",
      icon: <ImageIcon className="w-6 h-6 text-white" />,
      color: "from-pink-500 to-pink-600",
    },
  ];

  const loadHistory = () => setHistory(pdfHistoryManager.getAllRecords());

  const resetChat = (message: string) => {
    setChatMessages([
      {
        id: "intro",
        role: "ai",
        text: message,
        timestamp: new Date(),
      },
    ]);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isPdfFile = file.type ? file.type.toLowerCase().includes("pdf") : file.name.toLowerCase().endsWith(".pdf");
    if (!isPdfFile) {
      showToast({ variant: "error", title: t("pdfSummarizer"), description: t("pleaseSelectPdf") });
      event.target.value = "";
      return;
    }

    setSelectedFile(file);
    setActiveDocMeta({ name: file.name, size: file.size });
    setPdfData(null);
    setUploadPhase("reading");
    setUploadError("");
    resetChat("Processing your PDF...");
    clearStoredChat();
    clearStoredSession();

    try {
      const extracted = await extractPdfContent(file);
      const trimmedText = extracted.text.slice(0, MAX_CONTEXT_CHARS);
      setPdfData({ text: trimmedText, pages: extracted.pages });
      setUploadPhase("ready");
      resetChat(
        `I parsed ${Math.min(extracted.pages, MAX_PAGES_TO_PARSE)} of ${extracted.pages} page${
          extracted.pages === 1 ? "" : "s"
        } from "${file.name}". Ask anything about it!`
      );
      persistStoredSession({
        fileName: file.name,
        fileSize: file.size,
        pages: extracted.pages,
        text: trimmedText,
        updatedAt: new Date().toISOString(),
      });
      showToast({ variant: "success", title: t("pdfSummarizer"), description: "PDF ready for chat." });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to read PDF.";
      setUploadPhase("error");
      setUploadError(message);
      resetChat("Upload a PDF to start chatting with it.");
      clearStoredChat();
      clearStoredSession();
      showToast({ variant: "error", title: t("pdfSummarizer"), description: message });
    } finally {
      event.target.value = "";
    }
  };

  const logInteraction = (ask: string, answer: string) => {
    const name = activeDocName || "Untitled PDF";
    pdfHistoryManager.addRecord(name, `Q: ${ask}\nA: ${answer}`);
    loadHistory();
  };

  const handleAskQuestion = async (preset?: string) => {
    const query = (preset ?? question).trim();
    if (!query) return;
    if (!pdfData) {
      showToast({ variant: "info", title: t("pdfSummarizer"), description: "Upload a PDF first." });
      return;
    }

    setQuestion("");
    const userMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      text: query,
      timestamp: new Date(),
    };
    const placeholderId = `${Date.now()}-ai`;
    const placeholder: ChatMessage = {
      id: placeholderId,
      role: "ai",
      text: "Thinking...",
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMessage, placeholder]);
    setIsChatting(true);

    const snippet = pdfData.text?.trim()
      ? pdfData.text.slice(0, MAX_CONTEXT_CHARS)
      : "[No extractable text found in the uploaded PDF. Answer using general reasoning only.]";
    const contextMessages = [...chatMessages.filter((msg) => msg.id !== "intro"), userMessage];
    const prompt = buildPrompt(snippet, contextMessages, query, {
      name: activeDocName || undefined,
      pages: pdfData.pages,
    });

    try {
      const reply = await aiComplete(prompt);
      setChatMessages((prev) =>
        prev.map((msg) => (msg.id === placeholderId ? { ...msg, text: reply, timestamp: new Date() } : msg))
      );
      logInteraction(query, reply);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Something went wrong.";
      setChatMessages((prev) =>
        prev.map((msg) => (msg.id === placeholderId ? { ...msg, text: message, timestamp: new Date() } : msg))
      );
    } finally {
      setIsChatting(false);
    }
  };

  const handleQuickPrompt = (promptText: string) => {
    setQuestion(promptText);
    handleAskQuestion(promptText);
  };

  const handleCreateReminder = () => {
    if (!remDesc.trim()) {
      showToast({ variant: "error", title: t("setReminder"), description: t("enterReminderDescription") });
      return;
    }

    let due: Date;
    if (remDate) {
      const base = remDate + (remTime ? `T${remTime}:00` : "T09:00:00");
      due = new Date(base);
    } else {
      due = new Date(Date.now() + 60 * 60 * 1000);
    }

    const item = remindersManager.add({ description: remDesc.trim(), dueAt: due, email: remEmail || undefined });
    setReminders(remindersManager.getAll());
    setRemSuccess(t("reminderSetFor").replace("{when}", item.dueAt.toLocaleString()));
    setRemDesc("");
    setRemDate("");
    setRemTime("");
    setTimeout(() => setRemSuccess(""), 3000);
  };

  const handleCompleteReminder = (id: string) => {
    remindersManager.complete(id);
    setReminders(remindersManager.getAll());
  };

  const handleDeleteReminder = (id: string) => {
    remindersManager.delete(id);
    setReminders(remindersManager.getAll());
    showToast({ variant: "info", title: t("reminders"), description: t("done") });
  };

  const deleteHistoryRecord = (id: string) => {
    pdfHistoryManager.deleteRecord(id);
    loadHistory();
    showToast({ variant: "info", title: t("pdfSummaries"), description: t("done") });
  };

  const handleGenerateImage = async () => {
    const prompt = imagePrompt.trim();
    if (!prompt) {
      showToast({ variant: "info", title: "AI Image Generator", description: "Describe the image you want first." });
      return;
    }

    setImageError("");
    setImageLoading(true);
    try {
      const url = await generateImage(prompt);
      setImageUrl(url);
      showToast({ variant: "success", title: "AI Image Generator", description: "Image ready." });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to generate image.";
      setImageError(message);
      showToast({ variant: "error", title: "AI Image Generator", description: message });
    } finally {
      setImageLoading(false);
    }
  };

  const handleDownloadImage = () => {
    if (!imageUrl || typeof document === "undefined") return;
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `ai-image-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSelectTool = (toolId: ToolId) => {
    setActiveTool((current) => (current === toolId ? null : toolId));
  };

  const handleCloseActiveTool = () => setActiveTool(null);

  const handleResetChat = () => {
    const message = pdfData && activeDocName ? `Chat reset for "${activeDocName}". Ask anything about it!` : "Upload a PDF to start chatting with it.";
    resetChat(message);
    setQuestion("");
    showToast({ variant: "info", title: t("pdfSummarizer"), description: "Chat cleared." });
  };

  const renderPdfHistory = () => (
    <div className="border border-border rounded-2xl p-4 bg-secondary/40">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <History className="w-4 h-4 text-primary" /> Recent PDF sessions
        </div>
        {history.length > 0 && <span className="text-xs text-muted-foreground">{history.length} saved</span>}
      </div>
      {history.length === 0 ? (
        <p className="text-sm text-muted-foreground">No conversations yet. Ask something and we will save it here.</p>
      ) : (
        <div className="space-y-3">
          {history.slice(0, 4).map((record) => (
            <div key={record.id} className="p-3 rounded-xl border border-border bg-background/50">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate" title={record.fileName}>
                    {record.fileName}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {record.timestamp.toLocaleString()}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => deleteHistoryRecord(record.id)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground whitespace-pre-line mt-2 line-clamp-4">{record.summary}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderReminderList = () => (
    <div className="space-y-3">
      {reminders.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">{t("noRemindersYet")}</p>
      ) : (
        reminders.map((reminder) => (
          <div key={reminder.id} className="rounded-2xl border border-border bg-secondary/40 p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-foreground">{reminder.description}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <Clock className="w-3 h-3" />
                  {t("dueAt").replace("{when}", reminder.dueAt.toLocaleString())}
                </div>
                {reminder.email && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("emailLabel")
                      .replace("{email}", reminder.email)
                      .replace("{sent}", reminder.emailSent ? t("emailSent") : "")}
                  </p>
                )}
                {reminder.completed && (
                  <p className="text-xs text-green-400 mt-1">{t("done")}</p>
                )}
              </div>
              <div className="flex gap-2">
                {!reminder.completed && (
                  <button
                    type="button"
                    onClick={() => handleCompleteReminder(reminder.id)}
                    className="px-3 py-1 rounded-full text-xs bg-green-500/10 text-green-400 hover:bg-green-500/20 transition"
                  >
                    {t("done")}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDeleteReminder(reminder.id)}
                  className="p-2 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderActiveTool = (): JSX.Element | null => {
    if (!activeTool) return null;

    const closeButton = (
      <button
        type="button"
        onClick={handleCloseActiveTool}
        className="flex items-center gap-1 text-xs text-muted-foreground border border-border px-3 py-1.5 rounded-full hover:border-primary hover:text-foreground transition"
      >
        <X className="w-3 h-3" /> Close
      </button>
    );

    if (activeTool === "pdf-chat") {
      return (
        <Card className="mt-6 border border-border rounded-[24px] bg-card/95 backdrop-blur-xl shadow-xl">
          <CardContent className="p-6 space-y-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${tools[0].color} flex items-center justify-center shadow-lg`}>
                  {tools[0].icon}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Chat with your PDF</h2>
                  <p className="text-sm text-muted-foreground">Upload a PDF, then ask grounded questions powered by Groq.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetChat}
                  disabled={isChatting || (!pdfData && chatMessages.length <= 1)}
                  className="flex items-center gap-1 text-xs text-muted-foreground border border-border px-3 py-1.5 rounded-full hover:border-primary hover:text-foreground transition disabled:opacity-40"
                >
                  <X className="w-3 h-3" /> Reset chat
                </button>
                {closeButton}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="md:col-span-2 border-2 border-dashed border-border rounded-2xl p-6 text-center hover:border-primary/50 transition">
                <input type="file" accept=".pdf" onChange={handleFileChange} className="hidden" id="pdf-upload" />
                <label htmlFor="pdf-upload" className="cursor-pointer flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center">
                    {uploadPhase === "reading" ? (
                      <Loader2 className="w-6 h-6 text-primary animate-spin" />
                    ) : (
                      <Upload className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="text-foreground font-semibold">
                      {activeDocName ? activeDocName : t("clickToUploadPdf")}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {activeDocName ? `${formatBytes(activeDocSize)} | PDF` : t("maxFileSize")}
                    </p>
                  </div>
                </label>
                {uploadPhase === "error" && <p className="text-destructive text-xs mt-3">{uploadError}</p>}
              </div>
              <div className="border border-border rounded-2xl p-4 bg-secondary/30 text-sm space-y-3">
                <div>
                  <p className="text-muted-foreground text-xs">Document</p>
                  <p className="text-foreground font-semibold truncate" title={activeDocName}>
                    {activeDocName || "No PDF yet"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Size</p>
                  <p className="text-foreground font-semibold">{activeDocName ? formatBytes(activeDocSize) : "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Pages parsed</p>
                  <p className="text-foreground font-semibold">{pdfData ? Math.min(pdfData.pages, MAX_PAGES_TO_PARSE) : 0}</p>
                </div>
              </div>
            </div>

            {pdfData && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <MessageCircle className="w-4 h-4 text-primary" />
                  <h4 className="text-sm font-semibold text-foreground">Suggested prompts</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {QUICK_PROMPTS.map((promptText) => (
                    <button
                      key={promptText}
                      type="button"
                      onClick={() => handleQuickPrompt(promptText)}
                      className="px-3 py-2 rounded-full border border-border text-xs text-foreground hover:border-primary hover:bg-primary/10 transition"
                      disabled={isChatting}
                    >
                      {promptText}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-border bg-secondary/30 p-4 h-[360px] overflow-y-auto">
              {chatMessages.map((msg) => (
                <div key={msg.id} className={`mb-4 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl border px-4 py-3 text-sm whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "bg-primary/15 border-primary/40 text-foreground"
                        : "bg-background/60 border-border text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      {msg.role === "user" ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                      {msg.role === "user" ? "You" : "Assistant"}
                    </div>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <Paperclip className="w-3 h-3" />
                  {activeDocName ? `Chatting about ${activeDocName}` : "Upload a PDF to enable chat"}
                </div>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder={pdfData ? "Ask a question about this PDF..." : "Upload a PDF to ask questions"}
                  className="w-full min-h-[96px] bg-input text-foreground rounded-2xl px-4 py-3 outline-none border border-border focus:border-primary transition-colors text-sm"
                  disabled={!pdfData || isChatting}
                />
              </div>
              <button
                type="button"
                onClick={() => handleAskQuestion()}
                disabled={!pdfData || !question.trim() || isChatting}
                className="md:w-[140px] bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-blue-500/50 transition disabled:opacity-50"
              >
                {isChatting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {isChatting ? t("processing") : "Ask"}
              </button>
            </div>

            {renderPdfHistory()}
          </CardContent>
        </Card>
      );
    }

    if (activeTool === "set-reminder") {
      return (
        <Card className="mt-6 border border-border rounded-[24px] bg-card/95 backdrop-blur-xl shadow-xl">
          <CardContent className="p-6 space-y-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${tools[1].color} flex items-center justify-center shadow-lg`}>
                  {tools[1].icon}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">{tools[1].name}</h2>
                  <p className="text-sm text-muted-foreground">{tools[1].description}</p>
                </div>
              </div>
              {closeButton}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">{t("description")}</label>
                  <input
                    value={remDesc}
                    onChange={(e) => setRemDesc(e.target.value)}
                    placeholder={t("reminderPlaceholder")}
                    className="w-full bg-input text-foreground rounded-xl px-4 py-3 outline-none border border-border focus:border-primary transition-colors text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">{t("date")}</label>
                    <input
                      type="date"
                      value={remDate}
                      onChange={(e) => setRemDate(e.target.value)}
                      className="w-full bg-input text-foreground rounded-xl px-4 py-3 outline-none border border-border focus:border-primary transition-colors text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">{t("time")}</label>
                    <input
                      type="time"
                      value={remTime}
                      onChange={(e) => setRemTime(e.target.value)}
                      className="w-full bg-input text-foreground rounded-xl px-4 py-3 outline-none border border-border focus:border-primary transition-colors text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">{t("emailOptional")}</label>
                  <input
                    type="email"
                    value={remEmail}
                    onChange={(e) => setRemEmail(e.target.value)}
                    placeholder={t("emailPlaceholder")}
                    className="w-full bg-input text-foreground rounded-xl px-4 py-3 outline-none border border-border focus:border-primary transition-colors text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">{t("mockEmailNote")}</p>
                </div>
                {remSuccess && (
                  <div className="flex items-center gap-2 text-green-400 text-sm">
                    <MailCheck className="w-4 h-4" /> {remSuccess}
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleCreateReminder}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-3 rounded-full font-semibold text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-purple-500/50 transition"
                >
                  <CalendarClock className="w-4 h-4" />
                  {t("createReminder")}
                </button>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">{t("reminders")}</h3>
                {renderReminderList()}
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="mt-6 border border-border rounded-[24px] bg-card/95 backdrop-blur-xl shadow-xl">
        <CardContent className="p-6 space-y-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${tools[2].color} flex items-center justify-center shadow-lg`}>
                {tools[2].icon}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">AI Image Generator</h2>
                <p className="text-sm text-muted-foreground">Generate stunning visuals in seconds powered by Puter AI.</p>
              </div>
            </div>
            {closeButton}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <label className="block text-sm text-muted-foreground">Prompt</label>
              <textarea
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                placeholder="Describe the scene, style, and lighting..."
                className="w-full h-40 bg-input text-foreground rounded-2xl px-4 py-3 outline-none border border-border focus:border-primary transition-colors text-sm"
              />
              {imageError && <p className="text-xs text-destructive">{imageError}</p>}
              <button
                type="button"
                onClick={handleGenerateImage}
                disabled={imageLoading}
                className="w-full bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white px-6 py-3 rounded-full font-semibold text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-pink-500/40 transition disabled:opacity-60"
              >
                {imageLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {imageLoading ? t("processing") : "Generate"}
              </button>
            </div>
            <div className="rounded-3xl border border-border bg-secondary/40 p-4 min-h-[240px] flex flex-col items-center justify-center text-center">
              {imageUrl ? (
                <div className="w-full space-y-3">
                  <img src={imageUrl} alt="AI generated" className="w-full rounded-2xl border border-border object-cover" />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleDownloadImage}
                      className="flex-1 border border-border rounded-2xl px-4 py-2 text-sm text-foreground hover:border-primary transition"
                    >
                      Download PNG
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageUrl("")}
                      className="px-4 py-2 rounded-2xl text-sm text-muted-foreground border border-border hover:text-foreground"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground flex flex-col items-center gap-3">
                  <ImageIcon className="w-10 h-10 text-muted-foreground" />
                  <p>Generated images will appear here ready to download.</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="bg-background w-full min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20 md:pt-24 pb-10 px-4 md:px-6 max-w-6xl mx-auto w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 text-3xl md:text-4xl font-bold text-foreground">
              <Sparkles className="w-8 h-8 text-primary" />
              {t("aiToolsTitle")}
            </div>
            <p className="text-muted-foreground mt-2">{t("aiToolsSubtitle")}</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {tools.map((tool) => (
            <button
              key={tool.id}
              type="button"
              onClick={() => handleSelectTool(tool.id)}
              className={`text-left rounded-3xl border border-border bg-card/80 backdrop-blur-md p-5 flex flex-col gap-3 transition shadow-lg hover:shadow-xl hover:border-primary/60 ${
                activeTool === tool.id ? "ring-2 ring-primary/60" : ""
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${tool.color} flex items-center justify-center shadow-md`}>
                {tool.icon}
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">{tool.name}</p>
                <p className="text-sm text-muted-foreground">{tool.description}</p>
              </div>
              <span className="text-xs text-primary font-semibold">{activeTool === tool.id ? "Open" : "Tap to open"}</span>
            </button>
          ))}
        </div>

        {renderActiveTool()}
      </main>
    </div>
  );
};


