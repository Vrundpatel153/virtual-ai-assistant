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
} from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { pdfHistoryManager, remindersManager } from "../../lib/historyManager";
import { authService } from "../../lib/auth";
import { t, useI18n } from "../../lib/i18n";
import { useToast } from "../../components/ToastProvider";
import { aiComplete } from "../../lib/ai";
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker?url";
import type { TextItem } from "pdfjs-dist/types/src/display/api";

GlobalWorkerOptions.workerSrc = pdfWorker;

interface Tool {
  id: string;
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

const MAX_CONTEXT_CHARS = 15000;
const MAX_PAGES_TO_PARSE = 40;
const QUICK_PROMPTS = [
  "Give me the executive summary.",
  "List the key risks or blockers.",
  "What action items are assigned to me?",
  "Extract every deadline or date.",
  "Translate section 2 into simple language.",
];

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
  const [showHistory, setShowHistory] = useState(false);
  const [reminders, setReminders] = useState(remindersManager.getAll());
  const currentUser = authService.getCurrentUser();
  const [remDesc, setRemDesc] = useState("");
  const [remDate, setRemDate] = useState("");
  const [remTime, setRemTime] = useState("");
  const [remEmail, setRemEmail] = useState(currentUser?.email || "");
  const [remSuccess, setRemSuccess] = useState("");
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    const id = setInterval(() => setReminders(remindersManager.getAll()), 3000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const tools: Tool[] = [
    {
      id: "pdf-chat",
      name: t("pdfSummarizer"),
      description: "Upload a PDF and ask grounded questions backed by Groq.",
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

    if (file.type !== "application/pdf") {
      showToast({ variant: "error", title: t("pdfSummarizer"), description: t("pleaseSelectPdf") });
      return;
    }

    setSelectedFile(file);
    setPdfData(null);
    setUploadPhase("reading");
    setUploadError("");
    resetChat("Processing your PDF…");

    try {
      const extracted = await extractPdfContent(file);
      setPdfData(extracted);
      setUploadPhase("ready");
      resetChat(
        `I parsed ${Math.min(extracted.pages, MAX_PAGES_TO_PARSE)} of ${extracted.pages} page${
          extracted.pages === 1 ? "" : "s"
        } from "${file.name}". Ask anything about it!`
      );
      showToast({ variant: "success", title: t("pdfSummarizer"), description: "PDF ready for chat." });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to read PDF.";
      setUploadPhase("error");
      setUploadError(message);
      resetChat("Upload a PDF to start chatting with it.");
      showToast({ variant: "error", title: t("pdfSummarizer"), description: message });
    }
  };

  const logInteraction = (ask: string, answer: string) => {
    const name = selectedFile?.name || "Untitled PDF";
    pdfHistoryManager.addRecord(name, `Q: ${ask}\nA: ${answer}`);
    loadHistory();
  };

  const handleAskQuestion = async (preset?: string) => {
    const query = (preset ?? question).trim();
    if (!query) return;
    if (!pdfData || !pdfData.text.trim()) {
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

    const snippet = pdfData.text.slice(0, MAX_CONTEXT_CHARS);
    const contextMessages = [...chatMessages.filter((msg) => msg.id !== "intro"), userMessage];
    const prompt = buildPrompt(snippet, contextMessages, query, {
      name: selectedFile?.name,
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

  return (
    <div className="bg-background w-full min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 pt-20 md:pt-24 pb-6 px-4 md:px-6 flex gap-4 max-w-7xl mx-auto w-full">
        <div className="flex-1 min-w-0">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-foreground text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-primary" />
                {t("aiToolsTitle")}
              </h1>
              <p className="text-muted-foreground text-sm md:text-base">{t("aiToolsSubtitle")}</p>
            </div>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl border border-white/10 hover:border-white/20 transition-all duration-300 flex items-center gap-2"
            >
              <History className="w-4 h-4" />
              <span className="hidden md:inline">{t("historyTitle")}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            <Card className="xl:col-span-7 backdrop-blur-xl bg-card/95 border border-border shadow-lg hover:shadow-xl transition-all duration-300 hover:border-primary/50 rounded-[20px] md:rounded-[24px] overflow-hidden">
              <CardContent className="p-6 space-y-6">
                <div className="flex items-start justify-between">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tools[0].color} flex items-center justify-center shadow-lg`}>
                    {tools[0].icon}
                  </div>
                </div>

                <div>
                  <h3 className="text-foreground text-xl font-bold mb-1">Chat with your PDF</h3>
                  <p className="text-muted-foreground text-sm">Upload a PDF, then ask grounded questions powered by Groq.</p>
                </div>

                <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors">
                  <input type="file" accept=".pdf" onChange={handleFileChange} className="hidden" id="pdf-upload" />
                  <label htmlFor="pdf-upload" className="cursor-pointer flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                      {uploadPhase === "reading" ? (
                        <Loader2 className="w-6 h-6 text-primary animate-spin" />
                      ) : (
                        <Upload className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="text-foreground font-semibold">
                        {selectedFile ? selectedFile.name : t("clickToUploadPdf")}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {selectedFile ? `${formatBytes(selectedFile.size)} • PDF` : t("maxFileSize")}
                      </p>
                    </div>
                  </label>
                  {uploadPhase === "error" && <p className="text-destructive text-xs mt-3">{uploadError}</p>}
                </div>

                {selectedFile && pdfData && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 rounded-xl border border-border p-4 bg-secondary/40 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Document</p>
                      <p className="text-foreground font-semibold truncate" title={selectedFile.name}>
                        {selectedFile.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Size</p>
                      <p className="text-foreground font-semibold">{formatBytes(selectedFile.size)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Pages parsed</p>
                      <p className="text-foreground font-semibold">{Math.min(pdfData.pages, MAX_PAGES_TO_PARSE)}</p>
                    </div>
                  </div>
                )}

                {pdfData && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <MessageCircle className="w-4 h-4 text-primary" />
                      <h4 className="text-foreground font-semibold text-sm">Suggested prompts</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {QUICK_PROMPTS.map((promptText) => (
                        <button
                          key={promptText}
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
                      {selectedFile ? `Chatting about ${selectedFile.name}` : "Upload a PDF to enable chat"}
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
                    onClick={() => handleAskQuestion()}
                    disabled={!pdfData || !question.trim() || isChatting}
                    className="md:w-[140px] bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-blue-500/50 transition-all duration-300 disabled:opacity-50"
                  >
                    {isChatting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {isChatting ? t("processing") : "Ask"}
                  </button>
                </div>
              </CardContent>
            </Card>

            <Card className="xl:col-span-5 backdrop-blur-xl bg-card/95 border border-border shadow-lg hover:shadow-xl transition-all duration-300 hover:border-primary/50 rounded-[20px] md:rounded-[24px] overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tools[1].color} flex items-center justify-center shadow-lg`}>
                    {tools[1].icon}
                  </div>
                </div>

                <h3 className="text-foreground text-xl font-bold mb-2">{tools[1].name}</h3>
                <p className="text-muted-foreground text-sm mb-6">{tools[1].description}</p>

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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                    <div className="flex items-center gap-2 text-green-300 text-sm">
                      <MailCheck className="w-4 h-4" /> {remSuccess}
                    </div>
                  )}
                  <button
                    onClick={handleCreateReminder}
                    className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-3 rounded-full font-semibold text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105"
                  >
                    <CalendarClock className="w-4 h-4" />
                    {t("createReminder")}
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6 backdrop-blur-xl bg-gradient-to-br from-purple-900/30 to-purple-800/20 border border-purple-500/30 shadow-[0_8px_32px_rgba(139,92,246,0.2)] rounded-[20px] md:rounded-[24px] overflow-hidden">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-foreground text-xl font-bold">{t("moreToolsComing")}</h3>
              </div>
              <p className="text-muted-foreground text-sm">{t("moreToolsDesc")}</p>
            </CardContent>
          </Card>
        </div>

        {showHistory && (
          <div className="w-full md:w-96 flex-shrink-0">
            <div className="backdrop-blur-xl bg-card/95 border border-border rounded-[20px] shadow-lg h-full overflow-hidden flex flex-col">
              <div className="p-4 border-b border-border">
                <h2 className="text-foreground text-lg font-bold flex items-center gap-2">
                  <History className="w-5 h-5 text-blue-400" />
                  {t("historyTitle")}
                </h2>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-5">
                <div>
                  <h3 className="text-foreground text-sm font-semibold mb-2 flex items](commentary truncated due to length)
