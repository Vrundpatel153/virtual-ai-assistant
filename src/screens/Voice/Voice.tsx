import { useState, useEffect } from "react";
import { Navbar } from "../../components/Navbar";
import { Mic, Square, Volume2, Activity, Clock, Trash2, History } from "lucide-react";
import { voiceHistoryManager } from "../../lib/historyManager";

export const Voice = (): JSX.Element => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState<string[]>([]);
  const [history, setHistory] = useState(() => voiceHistoryManager.getAllRecords());
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    setHistory(voiceHistoryManager.getAllRecords());
  }, [transcript]);

  const handleToggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
      setTimeout(() => {
        const newTranscript = "This is a demo transcript. In a real application, this would use the Web Speech API or a voice recognition service.";
        setTranscript((prev) => [...prev, newTranscript]);
        voiceHistoryManager.addRecord(newTranscript);
      }, 2000);
    } else {
      setIsRecording(false);
    }
  };

  const deleteHistoryRecord = (id: string) => {
    if (confirm("Delete this recording?")) {
      voiceHistoryManager.deleteRecord(id);
      setHistory(voiceHistoryManager.getAllRecords());
    }
  };

  return (
    <div className="bg-[#0a0b1e] w-full min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 pt-20 md:pt-24 pb-6 px-4 md:px-6 flex gap-4 max-w-7xl mx-auto w-full">
        {/* Main Voice Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-white text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
                <Mic className="w-8 h-8 text-orange-400" />
                Voice Assistant
              </h1>
              <p className="text-gray-400 text-sm md:text-base">Speak naturally and let AI understand you</p>
            </div>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl border border-white/10 hover:border-white/20 transition-all duration-300 flex items-center gap-2"
            >
              <History className="w-4 h-4" />
              <span className="hidden md:inline">History</span>
            </button>
          </div>

          <div className="flex-1 backdrop-blur-xl bg-gradient-to-br from-[#1e2139]/95 to-[#252844]/90 border border-white/10 rounded-[20px] md:rounded-[28px] shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col items-center justify-center p-6 md:p-12">
            <div className="relative mb-12">
              <div
                className={`w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center shadow-[0_0_60px_rgba(251,146,60,0.6)] transition-all duration-300 ${
                  isRecording ? "scale-110 animate-pulse" : "scale-100"
                }`}
              >
                {isRecording ? (
                  <Activity className="w-16 h-16 md:w-20 md:h-20 text-white animate-pulse" />
                ) : (
                  <Mic className="w-16 h-16 md:w-20 md:h-20 text-white" />
                )}
              </div>

              {isRecording && (
                <div className="absolute inset-0 rounded-full border-4 border-orange-400 animate-ping opacity-75" />
              )}
            </div>

            <button
              onClick={handleToggleRecording}
              className={`px-8 md:px-12 py-4 rounded-full font-semibold text-base md:text-lg flex items-center gap-3 shadow-lg transition-all duration-300 hover:scale-105 mb-8 ${
                isRecording
                  ? "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
                  : "bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white"
              }`}
            >
              {isRecording ? (
                <>
                  <Square className="w-5 h-5" />
                  Stop Recording
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5" />
                  Start Recording
                </>
              )}
            </button>

            {transcript.length > 0 && (
              <div className="w-full max-w-2xl backdrop-blur-xl bg-[#2a2d4a]/50 border border-white/10 rounded-2xl p-4 md:p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Volume2 className="w-5 h-5 text-purple-400" />
                  <h3 className="text-white font-semibold">Transcript</h3>
                </div>
                <div className="space-y-2">
                  {transcript.map((text, index) => (
                    <p key={index} className="text-gray-300 text-sm md:text-base">
                      {text}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* History Sidebar */}
        {showHistory && (
          <div className="w-full md:w-96 flex-shrink-0">
            <div className="backdrop-blur-xl bg-gradient-to-br from-[#1e2139]/95 to-[#252844]/90 border border-white/10 rounded-[20px] shadow-[0_8px_32px_rgba(0,0,0,0.4)] h-full overflow-hidden flex flex-col">
              <div className="p-4 border-b border-white/10">
                <h2 className="text-white text-lg font-bold flex items-center gap-2">
                  <History className="w-5 h-5 text-orange-400" />
                  Voice History
                </h2>
              </div>
              
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {history.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-8">No recordings yet</p>
                ) : (
                  history.map((record) => (
                    <div
                      key={record.id}
                      className="group p-4 rounded-xl bg-[#2a2d4a]/50 border border-white/5 hover:bg-[#2a2d4a] hover:border-white/10 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <Clock className="w-3 h-3" />
                          {record.timestamp.toLocaleString()}
                        </div>
                        <button
                          onClick={() => deleteHistoryRecord(record.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                      <p className="text-gray-300 text-sm">{record.transcript}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
