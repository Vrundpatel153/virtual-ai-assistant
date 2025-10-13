import React, { useState } from "react";
import { Navbar } from "../../components/Navbar";
import { Mic, Square, Volume2, Activity } from "lucide-react";

export const Voice = (): JSX.Element => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState<string[]>([]);

  const handleToggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
      setTimeout(() => {
        setTranscript((prev) => [
          ...prev,
          "This is a demo transcript. In a real application, this would use the Web Speech API or a voice recognition service.",
        ]);
      }, 2000);
    } else {
      setIsRecording(false);
    }
  };

  return (
    <div className="bg-[#0a0b1e] w-full min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 pt-20 md:pt-24 pb-6 px-4 md:px-6 flex flex-col max-w-5xl mx-auto w-full">
        <div className="mb-6">
          <h1 className="text-white text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
            <Mic className="w-8 h-8 text-orange-400" />
            Voice Assistant
          </h1>
          <p className="text-gray-400 text-sm md:text-base">Speak naturally and let AI understand you</p>
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
    </div>
  );
};
