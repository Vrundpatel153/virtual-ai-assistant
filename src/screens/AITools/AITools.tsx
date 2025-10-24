import React, { useState, useEffect } from "react";
import { Navbar } from "../../components/Navbar";
import { FileText, Upload, Sparkles, Loader2, History, Clock, Trash2, CalendarClock, MailCheck, Copy, Download, Info } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { pdfHistoryManager, remindersManager } from "../../lib/historyManager";
import { useGlobalLoading } from "../../components/LoadingProvider";
import { authService } from "../../lib/auth";
import { t, useI18n } from "../../lib/i18n";
import { useToast } from "../../components/ToastProvider";

interface Tool {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

export const AITools = (): JSX.Element => {
  useI18n();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [summary, setSummary] = useState<string>("");
  const [keyPoints, setKeyPoints] = useState<string[]>([]);
  const [phase, setPhase] = useState<'idle'|'uploading'|'extracting'|'summarizing'|'ready'>("idle");
  const [history, setHistory] = useState(() => pdfHistoryManager.getAllRecords());
  const [showHistory, setShowHistory] = useState(false);
  const [reminders, setReminders] = useState(remindersManager.getAll());
  const [temperature, setTemperature] = useState(0.3);

  // Reminder form state
  const currentUser = authService.getCurrentUser();
  const [remDesc, setRemDesc] = useState("");
  const [remDate, setRemDate] = useState(""); // yyyy-mm-dd
  const [remTime, setRemTime] = useState(""); // HH:MM
  const [remEmail, setRemEmail] = useState(currentUser?.email || "");
  const [remSuccess, setRemSuccess] = useState<string>("");
  const { setLoading } = useGlobalLoading();
  const { showToast } = useToast();

  useEffect(() => {
    setHistory(pdfHistoryManager.getAllRecords());
    setReminders(remindersManager.getAll());
  }, [summary]);

  useEffect(() => {
    // refresh reminders periodically to reflect due/complete changes from other pages
    const id = setInterval(() => setReminders(remindersManager.getAll()), 3000);
    return () => clearInterval(id);
  }, []);

  const tools: Tool[] = [
    {
      id: "pdf-summarizer",
      name: t('pdfSummarizer'),
      description: t('aiToolsSubtitle'),
      icon: <FileText className="w-6 h-6 text-white" />,
      color: "from-blue-600 to-blue-700",
    },
    {
      id: "set-reminder",
      name: t('setReminder'),
      description: t('aiToolsSubtitle'),
      icon: <CalendarClock className="w-6 h-6 text-white" />,
      color: "from-purple-600 to-purple-700",
    },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
      setSummary("");
      setKeyPoints([]);
      setPhase('idle');
    } else {
      showToast({ variant: 'error', title: t('pdfSummarizer'), description: t('pleaseSelectPdf') });
    }
  };

  const handleCreateReminder = () => {
    if (!remDesc.trim()) {
      showToast({ variant: 'error', title: t('setReminder'), description: t('enterReminderDescription') });
      return;
    }
    let due: Date;
    if (remDate) {
      const base = remDate + (remTime ? `T${remTime}:00` : 'T09:00:00');
      due = new Date(base);
    } else {
      // default to 1 hour from now
      due = new Date(Date.now() + 60 * 60 * 1000);
    }
    const item = remindersManager.add({ description: remDesc.trim(), dueAt: due, email: remEmail || undefined });
    setReminders(remindersManager.getAll());
  setRemSuccess(t('reminderSetFor').replace('{when}', item.dueAt.toLocaleString()));
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
    // Soft delete without blocking confirm; could add inline undo in toast
    remindersManager.delete(id);
    setReminders(remindersManager.getAll());
    showToast({ variant: 'info', title: t('reminders'), description: t('done') });
  };

  const handleSummarize = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setLoading(true);
    setPhase('uploading');
    setKeyPoints([]);
    
    // Simulate AI processing
    // staged phases for better UX
    setTimeout(() => setPhase('extracting'), 600);
    setTimeout(() => setPhase('summarizing'), 1200);
    setTimeout(() => {
      const newSummary = `Summary of "${selectedFile.name}":\n\nThis is a simulated AI-generated summary. In production, the app will:\n\n1. Extract text from the PDF\n2. Send it to your configured AI model with the chosen creativity\n3. Return a concise, structured result\n\nIncludes:\n• Main topics\n• Key findings\n• Data points\n• Actionable recommendations`;
      const points = [
        'Main topic and scope of the document',
        'Three to five key findings',
        'Important stats or figures with context',
        'Risks, assumptions, or constraints',
        'Recommended next steps',
      ];
      setSummary(newSummary);
      setKeyPoints(points);
      pdfHistoryManager.addRecord(selectedFile.name, newSummary);
      setPhase('ready');
      setIsProcessing(false);
      setLoading(false);
    }, 2200);
  };

  const deleteHistoryRecord = (id: string) => {
    pdfHistoryManager.deleteRecord(id);
    setHistory(pdfHistoryManager.getAllRecords());
    showToast({ variant: 'info', title: t('pdfSummaries'), description: t('done') });
  };

  return (
    <div className="bg-background w-full min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 pt-20 md:pt-24 pb-6 px-4 md:px-6 flex gap-4 max-w-7xl mx-auto w-full">
        {/* Main Area: responsive two-column layout (stacks on sm, splits on xl) */}
        <div className="flex-1 min-w-0">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-foreground text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-primary" />
                {t('aiToolsTitle')}
              </h1>
              <p className="text-muted-foreground text-sm md:text-base">{t('aiToolsSubtitle')}</p>
            </div>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl border border-white/10 hover:border-white/20 transition-all duration-300 flex items-center gap-2"
            >
              <History className="w-4 h-4" />
              <span className="hidden md:inline">{t('historyTitle')}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            {/* PDF Summarizer: self-contained card with input and output */}
            <Card className="xl:col-span-7 backdrop-blur-xl bg-card/95 border border-border shadow-lg hover:shadow-xl transition-all duration-300 hover:border-primary/50 rounded-[20px] md:rounded-[24px] overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tools[0].color} flex items-center justify-center shadow-lg`}>
                    {tools[0].icon}
                  </div>
                </div>

                <h3 className="text-foreground text-xl font-bold mb-2">{tools[0].name}</h3>
                <p className="text-muted-foreground text-sm mb-6">{tools[0].description}</p>

                <div className="space-y-6">
                  <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="hidden"
                      id="pdf-upload"
                    />
                    <label htmlFor="pdf-upload" className="cursor-pointer">
                      <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-foreground font-medium mb-1">
                        {selectedFile ? selectedFile.name : t('clickToUploadPdf')}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {selectedFile ? t('fileReady') : t('maxFileSize')}
                      </p>
                    </label>
                  </div>

                  {/* File details and options */}
                  {selectedFile && (
                    <div className="rounded-xl border border-border p-4 bg-secondary/40 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center"><FileText className="w-5 h-5 text-primary"/></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-foreground text-sm font-semibold truncate">{selectedFile.name}</p>
                          <p className="text-muted-foreground text-xs">{(selectedFile.size/1024/1024).toFixed(2)} MB • PDF</p>
                        </div>
                        {phase !== 'idle' && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1"><Info className="w-3 h-3"/> {phase === 'uploading' ? 'Uploading' : phase === 'extracting' ? 'Extracting text' : phase === 'summarizing' ? 'Summarizing' : 'Ready'}</div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">Creativity</label>
                          <input type="range" min={0} max={1} step={0.1} value={temperature} onChange={(e)=>setTemperature(parseFloat(e.target.value))} className="w-full" />
                          <div className="text-xs text-muted-foreground">Temperature: {temperature.toFixed(1)}</div>
                        </div>
                        <div className="hidden sm:block" />
                      </div>
                    </div>
                  )}

                  {selectedFile && (
                    <button
                      onClick={handleSummarize}
                      disabled={isProcessing}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-full font-semibold text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {t('processing')}
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          {t('generateSummary')}
                        </>
                      )}
                    </button>
                  )}

                  {/* Output area inside the same card */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-foreground text-lg font-bold">Summary</h4>
                      {summary && (
                        <div className="flex items-center gap-2">
                          <button onClick={() => navigator.clipboard.writeText(summary)} className="px-3 py-2 rounded-lg border border-border text-sm flex items-center gap-2 hover:bg-white/5"><Copy className="w-4 h-4"/> Copy</button>
                          <button onClick={() => {
                            const blob = new Blob([summary], { type: 'text/plain;charset=utf-8' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = (selectedFile?.name || 'summary').replace(/\.[^/.]+$/, '') + '_summary.txt';
                            a.click();
                            URL.revokeObjectURL(url);
                          }} className="px-3 py-2 rounded-lg border border-border text-sm flex items-center gap-2 hover:bg-white/5"><Download className="w-4 h-4"/> Download</button>
                        </div>
                      )}
                    </div>

                    {isProcessing && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {['Uploading','Extracting','Summarizing'].map((_, idx) => (
                            <div key={idx} className={`rounded-xl border ${(idx===0 && phase==='uploading') || (idx===1 && phase==='extracting') || (idx===2 && phase==='summarizing') ? 'border-primary/50' : 'border-border'} p-3`}>
                              <div className="h-3 w-24 bg-white/10 rounded mb-2 animate-pulse"></div>
                              <div className="h-2 w-full bg-white/5 rounded overflow-hidden"><div className={`h-full ${(idx===0 && phase!=='idle') || (idx===1 && phase==='extracting') || (idx===2 && phase==='summarizing') ? 'bg-primary/50 animate-[progress_1.2s_linear_infinite]' : 'bg-white/10'}`} style={{ width: idx===0? '66%': idx===1? '40%':'25%' }}></div></div>
                            </div>
                          ))}
                        </div>
                        <div className="h-28 rounded-xl border border-border p-4">
                          <div className="h-4 w-3/4 bg-white/10 rounded mb-2 animate-pulse"></div>
                          <div className="h-3 w-full bg-white/5 rounded mb-2 animate-pulse"></div>
                          <div className="h-3 w-5/6 bg-white/5 rounded animate-pulse"></div>
                        </div>
                      </div>
                    )}

                    {!isProcessing && !summary && (
                      <div className="text-muted-foreground text-sm">
                        Upload a PDF and click Generate to see the summary here.
                      </div>
                    )}

                    {!isProcessing && summary && (
                      <div className="space-y-6">
                        <div className="bg-secondary/50 rounded-xl p-4 border border-border">
                          <p className="text-foreground text-sm whitespace-pre-line">{summary}</p>
                        </div>
                        {keyPoints.length > 0 && (
                          <div>
                            <h5 className="text-foreground font-semibold mb-2">Key points</h5>
                            <ul className="list-disc pl-5 text-sm text-foreground/90 space-y-1">
                              {keyPoints.map((kp, i)=> (<li key={i}>{kp}</li>))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reminder: separate card */}
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
                    <label className="block text-sm text-muted-foreground mb-1">{t('description')}</label>
                    <input value={remDesc} onChange={(e) => setRemDesc(e.target.value)} placeholder={t('reminderPlaceholder')} className="w-full bg-input text-foreground rounded-xl px-4 py-3 outline-none border border-border focus:border-primary transition-colors text-sm" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">{t('date')}</label>
                      <input type="date" value={remDate} onChange={(e) => setRemDate(e.target.value)} className="w-full bg-input text-foreground rounded-xl px-4 py-3 outline-none border border-border focus:border-primary transition-colors text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">{t('time')}</label>
                      <input type="time" value={remTime} onChange={(e) => setRemTime(e.target.value)} className="w-full bg-input text-foreground rounded-xl px-4 py-3 outline-none border border-border focus:border-primary transition-colors text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">{t('emailOptional')}</label>
                    <input type="email" value={remEmail} onChange={(e) => setRemEmail(e.target.value)} placeholder={t('emailPlaceholder')} className="w-full bg-input text-foreground rounded-xl px-4 py-3 outline-none border border-border focus:border-primary transition-colors text-sm" />
                    <p className="text-xs text-muted-foreground mt-1">{t('mockEmailNote')}</p>
                  </div>
                  {remSuccess && (
                    <div className="flex items-center gap-2 text-green-300 text-sm"><MailCheck className="w-4 h-4" /> {remSuccess}</div>
                  )}
                  <button onClick={handleCreateReminder} className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-3 rounded-full font-semibold text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105">
                    <CalendarClock className="w-4 h-4" />
                    {t('createReminder')}
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
                <h3 className="text-foreground text-xl font-bold">{t('moreToolsComing')}</h3>
              </div>
              <p className="text-muted-foreground text-sm">{t('moreToolsDesc')}</p>
            </CardContent>
          </Card>
        </div>

        {/* History Sidebar */}
        {showHistory && (
          <div className="w-full md:w-96 flex-shrink-0">
            <div className="backdrop-blur-xl bg-card/95 border border-border rounded-[20px] shadow-lg h-full overflow-hidden flex flex-col">
              <div className="p-4 border-b border-border">
                <h2 className="text-foreground text-lg font-bold flex items-center gap-2">
                  <History className="w-5 h-5 text-blue-400" />
                  {t('historyTitle')}
                </h2>
              </div>
              
              <div className="flex-1 overflow-y-auto p-3 space-y-5">
                <div>
                  <h3 className="text-foreground text-sm font-semibold mb-2 flex items-center gap-2"><FileText className="w-4 h-4 text-primary" /> {t('pdfSummaries')}</h3>
                  {history.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-4">{t('noPdfSummaries')}</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {history.map((record) => (
                        <div
                          key={record.id}
                          className="group p-4 rounded-xl bg-secondary/50 border border-border hover:bg-secondary hover:border-primary/50 transition-all"
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                                <p className="text-foreground text-sm font-medium truncate">{record.fileName}</p>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                {record.timestamp.toLocaleString()}
                              </div>
                            </div>
                            <button
                              onClick={() => deleteHistoryRecord(record.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded-lg transition-all"
                            >
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </button>
                          </div>
                          <p className="text-foreground text-xs line-clamp-3">{record.summary}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-white text-sm font-semibold mb-2 flex items-center gap-2"><CalendarClock className="w-4 h-4 text-purple-400" /> {t('reminders')}</h3>
                  {reminders.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-4">{t('noRemindersYet')}</p>
                  ) : (
                    reminders.map((r) => (
                      <div key={r.id} className="group p-4 rounded-xl bg-[#2a2d4a]/50 border border-white/5 hover:bg-[#2a2d4a] hover:border-white/10 transition-all mb-2">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex-1">
                            <p className="text-white text-sm font-medium">{r.description}</p>
                            <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                              <Clock className="w-3 h-3" />
                              {t('dueAt').replace('{when}', r.dueAt.toLocaleString())}
                            </div>
                            {r.email && (
                              <div className="text-xs text-gray-500 mt-1">{t('emailLabel').replace('{email}', r.email).replace('{sent}', r.emailSent ? t('emailSent') : '')}</div>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {!r.completed && (
                              <button onClick={() => handleCompleteReminder(r.id)} className="opacity-0 group-hover:opacity-100 px-2 py-1 rounded-lg bg-green-500/20 text-green-300 text-xs">{t('done')}</button>
                            )}
                            <button onClick={() => handleDeleteReminder(r.id)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded-lg transition-all">
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
