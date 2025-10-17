import React, { useState, useEffect } from "react";
import { Navbar } from "../../components/Navbar";
import { FileText, Upload, Sparkles, Loader2, CheckCircle, History, Clock, Trash2, CalendarClock, MailCheck } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { pdfHistoryManager, remindersManager } from "../../lib/historyManager";
import { useGlobalLoading } from "../../components/LoadingProvider";
import { authService } from "../../lib/auth";
import { t, useI18n } from "../../lib/i18n";

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
  const [history, setHistory] = useState(() => pdfHistoryManager.getAllRecords());
  const [showHistory, setShowHistory] = useState(false);
  const [reminders, setReminders] = useState(remindersManager.getAll());

  // Reminder form state
  const currentUser = authService.getCurrentUser();
  const [remDesc, setRemDesc] = useState("");
  const [remDate, setRemDate] = useState(""); // yyyy-mm-dd
  const [remTime, setRemTime] = useState(""); // HH:MM
  const [remEmail, setRemEmail] = useState(currentUser?.email || "");
  const [remSuccess, setRemSuccess] = useState<string>("");
  const { setLoading } = useGlobalLoading();

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
    } else {
      alert(t('pleaseSelectPdf'));
    }
  };

  const handleCreateReminder = () => {
    if (!remDesc.trim()) {
      alert(t('enterReminderDescription'));
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
    if (confirm(t('deleteReminderQuestion'))) {
      remindersManager.delete(id);
      setReminders(remindersManager.getAll());
    }
  };

  const handleSummarize = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setLoading(true);
    
    // Simulate AI processing
    setTimeout(() => {
      const newSummary = `Summary of "${selectedFile.name}":\n\nThis is a simulated AI-generated summary. In a real implementation, this would:\n\n1. Extract text from the PDF document\n2. Send it to an AI model (like GPT or Claude)\n3. Return a concise summary of the key points\n\nThe summary would include:\n• Main topics covered\n• Key findings and conclusions\n• Important data points\n• Recommendations or next steps\n\nFor a production version, you would integrate with an AI API service.`;
      setSummary(newSummary);
      pdfHistoryManager.addRecord(selectedFile.name, newSummary);
      setIsProcessing(false);
      setLoading(false);
    }, 2000);
  };

  const deleteHistoryRecord = (id: string) => {
    if (confirm(t('deletePdfSummaryQuestion'))) {
      pdfHistoryManager.deleteRecord(id);
      setHistory(pdfHistoryManager.getAllRecords());
    }
  };

  return (
    <div className="bg-[#0a0b1e] w-full min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 pt-20 md:pt-24 pb-6 px-4 md:px-6 flex gap-4 max-w-7xl mx-auto w-full">
        {/* Main Tools Area */}
        <div className="flex-1 min-w-0">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-white text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-purple-400" />
                {t('aiToolsTitle')}
              </h1>
              <p className="text-gray-400 text-sm md:text-base">{t('aiToolsSubtitle')}</p>
            </div>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl border border-white/10 hover:border-white/20 transition-all duration-300 flex items-center gap-2"
            >
              <History className="w-4 h-4" />
              <span className="hidden md:inline">{t('historyTitle')}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* PDF Summarizer Tool */}
            <Card className="backdrop-blur-xl bg-gradient-to-br from-[#1e2139]/95 to-[#252844]/90 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:shadow-[0_8px_48px_rgba(59,130,246,0.3)] transition-all duration-300 hover:border-white/20 rounded-[20px] md:rounded-[24px] overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tools[0].color} flex items-center justify-center shadow-lg`}>
                    {tools[0].icon}
                  </div>
                </div>

                <h3 className="text-white text-xl font-bold mb-2">{tools[0].name}</h3>
                <p className="text-gray-400 text-sm mb-6">{tools[0].description}</p>

                <div className="space-y-4">
                  <div className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center hover:border-purple-500/50 transition-colors">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="hidden"
                      id="pdf-upload"
                    />
                    <label htmlFor="pdf-upload" className="cursor-pointer">
                      <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                      <p className="text-white font-medium mb-1">
                        {selectedFile ? selectedFile.name : t('clickToUploadPdf')}
                      </p>
                      <p className="text-gray-400 text-sm">
                        {selectedFile ? t('fileReady') : t('maxFileSize')}
                      </p>
                    </label>
                  </div>

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
                </div>
              </CardContent>
            </Card>

            {/* Set Reminder Tool */}
            <Card className="backdrop-blur-xl bg-gradient-to-br from-[#1e2139]/95 to-[#252844]/90 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:shadow-[0_8px_48px_rgba(139,92,246,0.3)] transition-all duration-300 hover:border-white/20 rounded-[20px] md:rounded-[24px] overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tools[1].color} flex items-center justify-center shadow-lg`}>
                    {tools[1].icon}
                  </div>
                </div>

                <h3 className="text-white text-xl font-bold mb-2">{tools[1].name}</h3>
                <p className="text-gray-400 text-sm mb-6">{tools[1].description}</p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">{t('description')}</label>
                    <input value={remDesc} onChange={(e) => setRemDesc(e.target.value)} placeholder={t('reminderPlaceholder')} className="w-full bg-[#2a2d4a] text-white rounded-xl px-4 py-3 outline-none border border-white/10 focus:border-purple-500 transition-colors text-sm" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-gray-300 mb-1">{t('date')}</label>
                      <input type="date" value={remDate} onChange={(e) => setRemDate(e.target.value)} className="w-full bg-[#2a2d4a] text-white rounded-xl px-4 py-3 outline-none border border-white/10 focus:border-purple-500 transition-colors text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-1">{t('time')}</label>
                      <input type="time" value={remTime} onChange={(e) => setRemTime(e.target.value)} className="w-full bg-[#2a2d4a] text-white rounded-xl px-4 py-3 outline-none border border-white/10 focus:border-purple-500 transition-colors text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">{t('emailOptional')}</label>
                    <input type="email" value={remEmail} onChange={(e) => setRemEmail(e.target.value)} placeholder={t('emailPlaceholder')} className="w-full bg-[#2a2d4a] text-white rounded-xl px-4 py-3 outline-none border border-white/10 focus:border-purple-500 transition-colors text-sm" />
                    <p className="text-xs text-gray-500 mt-1">{t('mockEmailNote')}</p>
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

            {/* Summary Output */}
            {summary && (
              <Card className="backdrop-blur-xl bg-gradient-to-br from-green-900/30 to-green-800/20 border border-green-500/30 shadow-[0_8px_32px_rgba(34,197,94,0.2)] rounded-[20px] md:rounded-[24px] overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-white text-xl font-bold">{t('summaryResult')}</h3>
                  </div>
                  <div className="bg-[#1e2139]/50 rounded-xl p-4 border border-white/10">
                    <p className="text-gray-300 text-sm whitespace-pre-line">{summary}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <Card className="mt-6 backdrop-blur-xl bg-gradient-to-br from-purple-900/30 to-purple-800/20 border border-purple-500/30 shadow-[0_8px_32px_rgba(139,92,246,0.2)] rounded-[20px] md:rounded-[24px] overflow-hidden">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-white text-xl font-bold">{t('moreToolsComing')}</h3>
              </div>
              <p className="text-gray-300 text-sm">{t('moreToolsDesc')}</p>
            </CardContent>
          </Card>
        </div>

        {/* History Sidebar */}
        {showHistory && (
          <div className="w-full md:w-96 flex-shrink-0">
            <div className="backdrop-blur-xl bg-gradient-to-br from-[#1e2139]/95 to-[#252844]/90 border border-white/10 rounded-[20px] shadow-[0_8px_32px_rgba(0,0,0,0.4)] h-full overflow-hidden flex flex-col">
              <div className="p-4 border-b border-white/10">
                <h2 className="text-white text-lg font-bold flex items-center gap-2">
                  <History className="w-5 h-5 text-blue-400" />
                  {t('historyTitle')}
                </h2>
              </div>
              
              <div className="flex-1 overflow-y-auto p-3 space-y-5">
                <div>
                  <h3 className="text-white text-sm font-semibold mb-2 flex items-center gap-2"><FileText className="w-4 h-4 text-blue-400" /> {t('pdfSummaries')}</h3>
                  {history.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-4">{t('noPdfSummaries')}</p>
                  ) : (
                    history.map((record) => (
                      <div
                        key={record.id}
                        className="group p-4 rounded-xl bg-[#2a2d4a]/50 border border-white/5 hover:bg-[#2a2d4a] hover:border-white/10 transition-all mb-2"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
                              <p className="text-white text-sm font-medium truncate">{record.fileName}</p>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-400">
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
                        <p className="text-gray-300 text-xs line-clamp-3">{record.summary}</p>
                      </div>
                    ))
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
