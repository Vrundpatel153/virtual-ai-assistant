import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "../../components/ui/card";
import { MessageSquare, Wrench, ChartBar as BarChart3, Sparkles, Zap, Brain, Mic as Mic2, Clock } from "lucide-react";
import { Navbar } from "../../components/Navbar";
import ModelCanvas from "../../components/ModelCanvas";
import { conversationManager } from "../../lib/historyManager";
import { t, useI18n } from "../../lib/i18n";
import { authService } from "../../lib/auth";

export const GuestTemplate = (): JSX.Element => {
  useI18n();
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const gate = (path: string) => {
    if (!user && path !== '/' && path !== '/pricing') {
      try { window.dispatchEvent(new CustomEvent('ai_trigger_auth_modal', { detail: { mode: 'signin' } })); } catch {}
      return;
    }
    navigate(path);
  };
  const [totalChats, setTotalChats] = useState(0);
  // Use static example metrics for guest view to avoid coupling with real user metrics
  const [sessionCount] = useState(12);
  const [totalHours] = useState(4.5);

  useEffect(() => {
    // Only reflect local conversations count for demo; keep metrics static
    const refresh = () => setTotalChats(conversationManager.getAllConversations().length);
    refresh();
    const id = setInterval(refresh, 5000);
    return () => clearInterval(id);
  }, []);
  const cardBaseClasses =
    "backdrop-blur-xl bg-gradient-to-br from-[#1e2139]/95 to-[#252844]/90 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_80px_rgba(139,92,246,0.1),inset_0_1px_0_rgba(255,255,255,0.1)] hover:shadow-[0_8px_48px_rgba(139,92,246,0.3),0_0_100px_rgba(139,92,246,0.2)] transition-all duration-300 hover:border-white/20 cursor-pointer";

  return (
    <div className="bg-[#0a0b1e] w-full min-h-screen">
      <Navbar />
      <div className="pt-20 md:pt-32 pb-8 md:pb-12 px-4 md:px-6 flex items-center justify-center">
        <div className="relative w-full max-w-[1400px]">
          <div className="grid grid-cols-1 md:grid-cols-[minmax(200px,240px)_1fr_minmax(200px,240px)] gap-4 md:gap-5 auto-rows-min">
            {/* Column 1 - Left side (3 cards stacked) */}
            <div className="flex flex-col gap-4 md:gap-5">
              {/* Chat Assistant Card */}
              <Card
                onClick={() => gate('/chat')}
                className={`${cardBaseClasses} rounded-[20px] md:rounded-[28px] h-[280px] md:h-[340px] overflow-hidden relative`}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(139,92,246,0.15),transparent_50%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.05)_0%,transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.08),transparent_60%)]" />
                <CardContent className="p-6 md:p-8 h-full relative z-10 flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-[#8b5cf6] to-[#c084fc] flex items-center justify-center mb-4 md:mb-6 shadow-lg shadow-purple-500/40 border border-white/20">
                      <MessageSquare className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    </div>
                    <h3 className="text-white text-xl md:text-2xl font-bold mb-2 leading-tight whitespace-pre-line">
                      {t('intelligentChatAssistant')}
                    </h3>
                  </div>
                  <div className="text-gray-300 text-xs md:text-sm">
                    <div className="font-semibold text-white mb-1 drop-shadow-sm">{t('realtimeResponses')}</div>
                    <div className="text-gray-400">{t('contextAwareConversations')}</div>
                  </div>
                </CardContent>
              </Card>

              {/* Total Chats Card */}
              <Card
                className={`${cardBaseClasses} rounded-[20px] md:rounded-[28px] h-[160px] md:h-[180px] overflow-hidden relative`}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(139,92,246,0.12),transparent_60%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.05)_0%,transparent_50%)]" />
                <CardContent className="p-6 md:p-8 h-full relative z-10 flex flex-col justify-between">
                  <div className="text-[#f59e0b] text-5xl md:text-6xl font-bold drop-shadow-[0_2px_8px_rgba(245,158,11,0.3)]">{totalChats}</div>
                  <div>
                    <div className="text-gray-300 text-xs md:text-sm mb-3">{t('totalChatsLower')}</div>
                    <div className="flex gap-2">
                      <div className="flex-1 h-2 rounded-full bg-gradient-to-r from-orange-400 to-pink-500 shadow-lg shadow-orange-500/30" />
                      <div className="flex-1 h-2 rounded-full bg-gradient-to-r from-purple-400 to-purple-600 opacity-80 shadow-lg shadow-purple-500/20" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Start Chat Button Card */}
              <Card
                onClick={() => gate('/chat')}
                className={`${cardBaseClasses} rounded-[20px] md:rounded-[28px] h-[140px] md:h-[160px] overflow-hidden relative`}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(139,92,246,0.12),transparent_60%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(225deg,rgba(255,255,255,0.05)_0%,transparent_50%)]" />
                <CardContent className="p-6 md:p-8 h-full relative z-10 flex items-center justify-center">
                  <button className="bg-gradient-to-r from-[#8b5cf6] to-[#a855f7] hover:from-[#7c3aed] hover:to-[#9333ea] text-white px-6 md:px-8 py-3 md:py-4 rounded-full font-semibold text-base md:text-lg flex items-center gap-2 md:gap-3 shadow-[0_8px_32px_rgba(139,92,246,0.4)] hover:shadow-[0_8px_48px_rgba(139,92,246,0.6)] transition-all duration-300 hover:scale-105 border border-white/20">
                    <Sparkles className="w-4 h-4 md:w-5 md:h-5" />
                    {t('startChat')}
                  </button>
                </CardContent>
              </Card>
            </div>

            {/* Column 2 - Center (Hero card + 2 cards below) */}
            <div className="relative flex flex-col gap-4 md:gap-5">
              {/* Middle circle 3D canvas (shows through card cutouts) */}
              <div className="hidden md:block absolute left-1/2 -translate-x-1/2 md:top-[146px] lg:top-[176px] md:w-[280px] md:h-[280px] lg:w-[340px] lg:h-[340px] rounded-full overflow-hidden z-30 [clip-path:circle(50%_at_50%_50%)]">
                <ModelCanvas
                  src="/models/base_basic_pbr.glb"
                  autoRotate={false}
                  className="absolute inset-0 w-full h-full"
                  fitMargin={1.0}
                  viewMargin={1.14}
                  scale={0.90}
                  enableZoom={false}
                  enableRotate={true}
                  enablePan={false}
                  offsetYRatio={0}
                />
                {/* Subtle ring + glow overlays (non-interactive) */}
                <div className="pointer-events-none absolute inset-0 rounded-full border border-white/10" />
                <div className="pointer-events-none absolute inset-[-12%] rounded-full bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.15),transparent_60%)]" />
              </div>
              {/* Hero Card - AI Assistant Hub */}
              <Card className="bg-gradient-to-br from-[#8b5cf6] via-[#a855f7] to-[#c084fc] border-white/20 rounded-[20px] md:rounded-[28px] h-[280px] md:h-[340px] overflow-hidden relative z-10 shadow-[0_20px_60px_rgba(139,92,246,0.6),0_0_80px_rgba(168,85,247,0.3),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_25px_80px_rgba(139,92,246,0.8),0_0_100px_rgba(168,85,247,0.4)] transition-all duration-300 mask-cut-top-arc [--cut-r:140px] lg:[--cut-r:170px] [--cut-pad:12px] [--cut-offset-y:6px]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.3),transparent_50%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.2)_0%,transparent_60%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(255,255,255,0.15),transparent_50%)]" />
                {/* Decorative grid removed in guest template to avoid data-URL parsing issues */}

                <CardContent className="p-4 md:p-6 h-full relative z-10 flex flex-col items-center justify-start pt-4 md:pt-6 text-center">
                  <div className="flex items-center gap-2 mb-2 bg-white/20 backdrop-blur-sm px-3 md:px-4 py-1.5 md:py-2 rounded-full border border-white/30 shadow-lg">
                    <Zap className="w-3 h-3 md:w-4 md:h-4 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" />
                    <span className="text-white font-semibold text-xs md:text-sm drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">{t('aiAssistantLabel')}</span>
                  </div>
                  <h1 className="text-white text-3xl md:text-5xl font-bold leading-tight mb-2 drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)]">
                    {t('subtitle')}
                  </h1>
                  
                </CardContent>

              </Card>

              {/* No overlay circle needed; arcs are cut via masks above/below */}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
                {/* Voice Assistant Card */}
                <Card
                  onClick={() => gate('/voice')}
                  className={`${cardBaseClasses} rounded-[20px] md:rounded-[28px] h-[280px] md:h-[359.5px] overflow-hidden relative z-10 mask-cut-top-right-arc [--cut-r:140px] lg:[--cut-r:170px] [--cut-pad:12px] [--cut-offset-x:10px] [--cut-offset-y:6px] [pointer-events:auto]`}
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(120,119,198,0.12),transparent_60%)]" />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(139,92,246,0.04)_0%,transparent_40%)]" />

                  {/* Decorative sound waves */}
                  <div className="absolute top-[30%] left-[20%] w-2 h-2 rounded-full bg-orange-400/60 animate-pulse" />
                  <div className="absolute top-[45%] left-[25%] w-1.5 h-1.5 rounded-full bg-orange-400/40 animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <div className="absolute top-[60%] left-[22%] w-1.5 h-1.5 rounded-full bg-orange-400/40 animate-pulse" style={{ animationDelay: '0.4s' }} />
                  <div className="absolute top-[30%] right-[20%] w-2 h-2 rounded-full bg-purple-400/60 animate-pulse" style={{ animationDelay: '0.1s' }} />

                  <CardContent className="p-5 md:p-6 h-full relative z-10 flex flex-col justify-between">
                    <div className="flex-1" />
                    <div>
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center mb-3 md:mb-4 shadow-lg shadow-orange-500/30">
                        <Mic2 className="w-5 h-5 md:w-6 md:h-6 text-white" />
                      </div>
                      <h3 className="text-white text-lg md:text-xl font-bold mb-2">{t('voiceCardTitle')}</h3>
                      <p className="text-gray-400 text-xs md:text-sm leading-relaxed">
                        {t('voiceCardDesc')}
                      </p>
                    </div>
                  </CardContent>

                </Card>

                {/* AI Tools Card */}
                <Card
                  onClick={() => gate('/ai-tools')}
                  className={`${cardBaseClasses} rounded-[20px] md:rounded-[28px] h-[280px] md:h-[359.5px] overflow-hidden relative z-10 mask-cut-top-left-arc [--cut-r:140px] lg:[--cut-r:170px] [--cut-pad:12px] [--cut-offset-x:10px] [--cut-offset-y:6px] [pointer-events:auto]`}
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(120,119,198,0.12),transparent_60%)]" />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(139,92,246,0.04)_0%,transparent_40%)]" />

                  {/* Decorative dots */}
                  <div className="absolute top-[30%] left-[20%] w-1.5 h-1.5 rounded-full bg-purple-400/40" />
                  <div className="absolute top-[35%] right-[25%] w-2 h-2 rounded-full bg-purple-400/60" />

                  <CardContent className="p-5 md:p-6 h-full relative z-10 flex flex-col justify-between">
                    <div className="flex-1" />
                    <div>
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-[#7c3aed] to-[#8b5cf6] flex items-center justify-center mb-3 md:mb-4 shadow-lg shadow-purple-500/30">
                        <Wrench className="w-5 h-5 md:w-6 md:h-6 text-white" />
                      </div>
                      <h3 className="text-white text-lg md:text-xl font-bold mb-2">{t('aiToolsCardTitle')}</h3>
                      <p className="text-gray-400 text-xs md:text-sm leading-relaxed">
                        {t('aiToolsCardDesc')}
                      </p>
                    </div>
                  </CardContent>

                </Card>
              </div>
            </div>

            {/* Column 3 - Right side (3 cards stacked) */}
            <div className="flex flex-col gap-4 md:gap-5">
              {/* AI Brain Icon Card */}
              <Card
                className={`${cardBaseClasses} rounded-[20px] md:rounded-[28px] h-[140px] md:h-[160px] overflow-hidden relative`}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(120,119,198,0.08),transparent_60%)]" />
                <CardContent className="p-6 md:p-8 h-full relative z-10 flex items-center justify-center">
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/40 rotate-12 hover:rotate-0 transition-transform duration-300">
                    <Brain className="w-7 h-7 md:w-8 md:h-8 text-white" />
                  </div>
                </CardContent>
              </Card>

              {/* Sessions & Hours Card */}
              <Card
                className={`${cardBaseClasses} rounded-[20px] md:rounded-[28px] h-[160px] md:h-[180px] overflow-hidden relative`}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(120,119,198,0.08),transparent_60%)]" />
                <CardContent className="p-6 md:p-8 h-full relative z-10 flex flex-col items-center justify-center text-center">
                  <div className="text-white text-2xl md:text-3xl font-bold mb-1">{sessionCount} {t('sessionsLabel')}</div>
                  <div className="flex items-center gap-2 text-purple-300">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs md:text-sm">{totalHours} {t('hoursActive')}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Analytics Card */}
              <Card
                className={`${cardBaseClasses} rounded-[20px] md:rounded-[28px] h-[280px] md:h-[340px] overflow-hidden relative`}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(120,119,198,0.1),transparent_50%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(225deg,rgba(139,92,246,0.03)_0%,transparent_50%)]" />
                <CardContent className="p-5 md:p-6 h-full relative z-10 flex flex-col justify-between">
                  <div>
                    <h3 className="text-white text-lg md:text-xl font-bold mb-2">{t('analyticsInsights')}</h3>
                    <p className="text-gray-400 text-xs md:text-sm leading-relaxed">{t('trackUsage')}</p>
                  </div>

                  {/* Interactive elements visualization */}
                  <div className="relative h-32 md:h-40 flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center justify-center">
                      {/* Center icon */}
                      <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-[#7c3aed] to-[#8b5cf6] flex items-center justify-center shadow-lg shadow-purple-500/40 z-10">
                        <BarChart3 className="w-6 h-6 md:w-7 md:h-7 text-white" />
                      </div>

                      {/* Orbiting elements */}
                      <div className="absolute w-28 h-28 md:w-32 md:h-32 border border-purple-500/20 rounded-full animate-spin" style={{ animationDuration: '20s' }}>
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-purple-500/60" />
                        <div className="absolute top-1/2 -right-2 -translate-y-1/2 w-3 h-3 rounded-full bg-blue-500/60" />
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-pink-500/60" />
                      </div>

                      {/* Text labels */}
                      <div className="absolute top-0 left-8 text-purple-400 text-[10px] md:text-xs rotate-[-20deg]">← {t('insightsLabel')}</div>
                      <div className="absolute bottom-4 right-2">
                        <div className="text-white text-[10px] md:text-xs bg-orange-500/20 border border-orange-500/40 px-2 py-1 rounded-full rotate-12">
                          {t('realtimeLabel')}
                        </div>
                      </div>

                      {/* Side labels with icons */}
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col gap-1 text-[9px] md:text-[10px] text-gray-500">
                        <div>• {t('usageLabel')}</div>
                        <div>• {t('speedLabel')}</div>
                        <div>• {t('qualityLabel')}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Center circle and 3D model temporarily removed for layout adjustments */}
        </div>
      </div>
    </div>
  );
};
