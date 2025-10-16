import React, { useState } from "react";
import { Navbar } from "../../components/Navbar";
import { FileText, Upload, Sparkles, Loader2, CheckCircle } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";

interface Tool {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

export const AITools = (): JSX.Element => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [summary, setSummary] = useState<string>("");

  const tools: Tool[] = [
    {
      id: "pdf-summarizer",
      name: "PDF Summarizer",
      description: "Upload a PDF and get an AI-generated summary",
      icon: <FileText className="w-6 h-6 text-white" />,
      color: "from-blue-600 to-blue-700",
    },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
      setSummary("");
    } else {
      alert("Please select a PDF file");
    }
  };

  const handleSummarize = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    
    // Simulate AI processing
    setTimeout(() => {
      setSummary(
        `Summary of "${selectedFile.name}":\n\nThis is a simulated AI-generated summary. In a real implementation, this would:\n\n1. Extract text from the PDF document\n2. Send it to an AI model (like GPT or Claude)\n3. Return a concise summary of the key points\n\nThe summary would include:\n• Main topics covered\n• Key findings and conclusions\n• Important data points\n• Recommendations or next steps\n\nFor a production version, you would integrate with an AI API service.`
      );
      setIsProcessing(false);
    }, 2000);
  };

  return (
    <div className="bg-[#0a0b1e] w-full min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 pt-20 md:pt-24 pb-6 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-white text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-purple-400" />
              AI Tools
            </h1>
            <p className="text-gray-400 text-sm md:text-base">
              Powerful AI-powered tools for your workflow
            </p>
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
                        {selectedFile ? selectedFile.name : "Click to upload PDF"}
                      </p>
                      <p className="text-gray-400 text-sm">
                        {selectedFile ? "File ready to summarize" : "Maximum file size: 10MB"}
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
                          Processing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Generate Summary
                        </>
                      )}
                    </button>
                  )}
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
                    <h3 className="text-white text-xl font-bold">Summary Result</h3>
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
                <h3 className="text-white text-xl font-bold">More Tools Coming Soon</h3>
              </div>
              <p className="text-gray-300 text-sm">
                We're constantly adding new AI-powered tools to enhance your productivity. Stay tuned for updates!
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
