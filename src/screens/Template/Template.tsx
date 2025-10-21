import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "../../components/ui/card";
import { MessageSquare, Wrench, ChartBar as BarChart3, Sparkles, Zap, Brain, Mic as Mic2, Clock } from "lucide-react";
import { Navbar } from "../../components/Navbar";
import ModelCanvas from "../../components/ModelCanvas";
import { conversationManager, metricsManager } from "../../lib/historyManager";
import { authService } from "../../lib/auth";
import { t, useI18n } from "../../lib/i18n";

export const Template = (): JSX.Element => {
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
  const [sessionCount, setSessionCount] = useState(0);
  const [totalHours, setTotalHours] = useState(0);

  useEffect(() => {
    const refresh = () => {
      setTotalChats(conversationManager.getAllConversations().length);
      setSessionCount(metricsManager.get().sessionCount);
      setTotalHours(metricsManager.getTotalHours());
    };
    refresh();
    const id = setInterval(refresh, 5000);
    return () => clearInterval(id);
  }, []);
  const cardBaseClasses =
    "backdrop-blur-xl bg-gradient-to-br from-card/95 to-card/90 border border-border shadow-lg hover:shadow-xl transition-all duration-300 hover:border-border/60 cursor-pointer";

  return (
    <div className="bg-background w-full min-h-screen">
      <Navbar />
      <div className="pt-16 sm:pt-20 md:pt-28 lg:pt-32 pb-6 sm:pb-8 md:pb-10 lg:pb-12 px-3 sm:px-4 md:px-6 flex items-center justify-center">
        <div className="relative w-full max-w-[1400px]">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(200px,240px)_1fr_minmax(200px,240px)] gap-3 sm:gap-4 md:gap-5 auto-rows-min">
            {/* Column 1 - Left side (3 cards stacked) */}
            <div className="flex flex-col gap-3 sm:gap-4 md:gap-5 order-2 lg:order-1">
              {/* Chat Assistant Card */}
              <Card
                onClick={() => gate('/chat')}
                className={`${cardBaseClasses} rounded-[16px] sm:rounded-[20px] md:rounded-[24px] lg:rounded-[28px] h-[220px] sm:h-[250px] md:h-[280px] lg:h-[340px] overflow-hidden relative`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
                <CardContent className="p-4 sm:p-5 md:p-6 lg:p-8 h-full relative z-10 flex flex-col justify-between">
                  <div>
                    <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 lg:w-12 lg:h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mb-3 sm:mb-4 md:mb-5 lg:mb-6 shadow-lg border border-primary/20">
                      <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 md:w-5.5 md:h-5.5 lg:w-6 lg:h-6 text-primary-foreground" />
                    </div>
                    <h3 className="text-foreground text-lg sm:text-xl md:text-xl lg:text-2xl font-bold mb-1.5 sm:mb-2 leading-tight whitespace-pre-line">
                      {t('intelligentChatAssistant')}
                    </h3>
                  </div>
                  <div className="text-muted-foreground text-[11px] sm:text-xs md:text-sm">
                    <div className="font-semibold text-foreground mb-0.5 sm:mb-1 drop-shadow-sm">{t('realtimeResponses')}</div>
                    <div className="text-muted-foreground">{t('contextAwareConversations')}</div>
                  </div>
                </CardContent>
              </Card>

              {/* Total Chats Card */}
              <Card
                className={`${cardBaseClasses} rounded-[16px] sm:rounded-[20px] md:rounded-[24px] lg:rounded-[28px] h-[140px] sm:h-[150px] md:h-[160px] lg:h-[180px] overflow-hidden relative`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
                <CardContent className="p-4 sm:p-5 md:p-6 lg:p-8 h-full relative z-10 flex flex-col justify-between">
                  <div className="text-accent text-4xl sm:text-5xl md:text-5xl lg:text-6xl font-bold">{totalChats}</div>
                  <div>
                    <div className="text-muted-foreground text-[11px] sm:text-xs md:text-sm mb-2 sm:mb-2.5 md:mb-3">{t('totalChatsLower')}</div>
                    <div className="flex gap-1.5 sm:gap-2">
                      <div className="flex-1 h-1.5 sm:h-2 rounded-full bg-gradient-to-r from-accent to-accent/60 shadow-lg" />
                      <div className="flex-1 h-1.5 sm:h-2 rounded-full bg-gradient-to-r from-primary to-primary/80 opacity-80 shadow-lg" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Start Chat Button Card */}
              <Card
                onClick={() => gate('/chat')}
                className={`${cardBaseClasses} rounded-[16px] sm:rounded-[20px] md:rounded-[24px] lg:rounded-[28px] h-[120px] sm:h-[130px] md:h-[140px] lg:h-[160px] overflow-hidden relative`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
                <CardContent className="p-4 sm:p-5 md:p-6 lg:p-8 h-full relative z-10 flex items-center justify-center">
                  <button className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground px-5 sm:px-6 md:px-7 lg:px-8 py-2.5 sm:py-3 md:py-3.5 lg:py-4 rounded-full font-semibold text-sm sm:text-base md:text-base lg:text-lg flex items-center gap-2 md:gap-2.5 lg:gap-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-primary/20">
                    <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-4.5 md:h-4.5 lg:w-5 lg:h-5" />
                    {t('startChat')}
                  </button>
                </CardContent>
              </Card>
            </div>

            {/* Column 2 - Center (Hero card + 2 cards below) */}
            <div className="relative flex flex-col gap-3 sm:gap-4 md:gap-5 order-1 lg:order-2">
              {/* Middle circle 3D canvas (shows through card cutouts) - Hidden on mobile/tablet */}
              <div className="hidden lg:block absolute left-1/2 -translate-x-1/2 lg:top-[146px] xl:top-[176px] lg:w-[280px] lg:h-[280px] xl:w-[340px] xl:h-[340px] rounded-full overflow-hidden z-30 [clip-path:circle(50%_at_50%_50%)]">
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
              <Card className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 border-primary/20 rounded-[16px] sm:rounded-[20px] md:rounded-[24px] lg:rounded-[28px] h-[220px] sm:h-[250px] md:h-[280px] lg:h-[340px] overflow-hidden relative z-10 shadow-xl hover:shadow-2xl transition-all duration-300 lg:mask-cut-top-arc [--cut-r:140px] xl:[--cut-r:170px] [--cut-pad:12px] [--cut-offset-y:6px]">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-foreground/10 to-transparent" />
                <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjAuNSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')]" />

                <CardContent className="p-3 sm:p-4 md:p-5 lg:p-6 h-full relative z-10 flex flex-col items-center justify-start pt-3 sm:pt-4 md:pt-5 lg:pt-6 text-center">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2 bg-primary-foreground/20 backdrop-blur-sm px-2.5 sm:px-3 md:px-3.5 lg:px-4 py-1 sm:py-1.5 md:py-1.5 lg:py-2 rounded-full border border-primary-foreground/30 shadow-lg">
                    <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 lg:w-4 lg:h-4 text-primary-foreground" />
                    <span className="text-primary-foreground font-semibold text-[10px] sm:text-xs md:text-xs lg:text-sm">{t('aiAssistantLabel')}</span>
                  </div>
                  <h1 className="text-primary-foreground text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-1.5 sm:mb-2">
                    {t('subtitle')}
                  </h1>
                  
                </CardContent>

              </Card>

              {/* No overlay circle needed; arcs are cut via masks above/below */}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-5">
                {/* Voice Assistant Card */}
                <Card
                  onClick={() => gate('/voice')}
                  className={`${cardBaseClasses} rounded-[16px] sm:rounded-[20px] md:rounded-[24px] lg:rounded-[28px] h-[220px] sm:h-[250px] md:h-[280px] lg:h-[359.5px] overflow-hidden relative z-10 lg:mask-cut-top-right-arc [--cut-r:140px] xl:[--cut-r:170px] [--cut-pad:12px] [--cut-offset-x:10px] [--cut-offset-y:6px] [pointer-events:auto]`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent" />

                  {/* Decorative sound waves */}
                  <div className="absolute top-[30%] left-[20%] w-2 h-2 rounded-full bg-accent/60 animate-pulse" />
                  <div className="absolute top-[45%] left-[25%] w-1.5 h-1.5 rounded-full bg-accent/40 animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <div className="absolute top-[60%] left-[22%] w-1.5 h-1.5 rounded-full bg-accent/40 animate-pulse" style={{ animationDelay: '0.4s' }} />
                  <div className="absolute top-[30%] right-[20%] w-2 h-2 rounded-full bg-primary/60 animate-pulse" style={{ animationDelay: '0.1s' }} />

                  <CardContent className="p-4 sm:p-5 md:p-5 lg:p-6 h-full relative z-10 flex flex-col justify-between">
                    <div className="flex-1" />
                    <div>
                      <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 lg:w-12 lg:h-12 rounded-full bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center mb-2.5 sm:mb-3 md:mb-3.5 lg:mb-4 shadow-lg">
                        <Mic2 className="w-4 h-4 sm:w-5 sm:h-5 md:w-5.5 md:h-5.5 lg:w-6 lg:h-6 text-accent-foreground" />
                      </div>
                      <h3 className="text-foreground text-base sm:text-lg md:text-lg lg:text-xl font-bold mb-1.5 sm:mb-2">{t('voiceCardTitle')}</h3>
                      <p className="text-muted-foreground text-[11px] sm:text-xs md:text-sm leading-relaxed">
                        {t('voiceCardDesc')}
                      </p>
                    </div>
                  </CardContent>

                </Card>

                {/* AI Tools Card */}
                <Card
                  onClick={() => gate('/ai-tools')}
                  className={`${cardBaseClasses} rounded-[16px] sm:rounded-[20px] md:rounded-[24px] lg:rounded-[28px] h-[220px] sm:h-[250px] md:h-[280px] lg:h-[359.5px] overflow-hidden relative z-10 lg:mask-cut-top-left-arc [--cut-r:140px] xl:[--cut-r:170px] [--cut-pad:12px] [--cut-offset-x:10px] [--cut-offset-y:6px] [pointer-events:auto]`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />

                  {/* Decorative dots */}
                  <div className="absolute top-[30%] left-[20%] w-1.5 h-1.5 rounded-full bg-primary/40" />
                  <div className="absolute top-[35%] right-[25%] w-2 h-2 rounded-full bg-primary/60" />

                  <CardContent className="p-4 sm:p-5 md:p-5 lg:p-6 h-full relative z-10 flex flex-col justify-between">
                    <div className="flex-1" />
                    <div>
                      <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 lg:w-12 lg:h-12 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mb-2.5 sm:mb-3 md:mb-3.5 lg:mb-4 shadow-lg">
                        <Wrench className="w-4 h-4 sm:w-5 sm:h-5 md:w-5.5 md:h-5.5 lg:w-6 lg:h-6 text-primary-foreground" />
                      </div>
                      <h3 className="text-foreground text-base sm:text-lg md:text-lg lg:text-xl font-bold mb-1.5 sm:mb-2">{t('aiToolsCardTitle')}</h3>
                      <p className="text-muted-foreground text-[11px] sm:text-xs md:text-sm leading-relaxed">
                        {t('aiToolsCardDesc')}
                      </p>
                    </div>
                  </CardContent>

                </Card>
              </div>
            </div>

            {/* Column 3 - Right side (3 cards stacked) */}
            <div className="flex flex-col gap-3 sm:gap-4 md:gap-5 order-3">
              {/* AI Brain Icon Card */}
              <Card
                className={`${cardBaseClasses} rounded-[16px] sm:rounded-[20px] md:rounded-[24px] lg:rounded-[28px] h-[120px] sm:h-[130px] md:h-[140px] lg:h-[160px] overflow-hidden relative`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent" />
                <CardContent className="p-4 sm:p-5 md:p-6 lg:p-8 h-full relative z-10 flex items-center justify-center">
                  <div className="w-12 h-12 sm:w-13 sm:h-13 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-2xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center shadow-lg rotate-12 hover:rotate-0 transition-transform duration-300">
                    <Brain className="w-6 h-6 sm:w-6.5 sm:h-6.5 md:w-7 md:h-7 lg:w-8 lg:h-8 text-accent-foreground" />
                  </div>
                </CardContent>
              </Card>

              {/* Sessions & Hours Card */}
              <Card
                className={`${cardBaseClasses} rounded-[16px] sm:rounded-[20px] md:rounded-[24px] lg:rounded-[28px] h-[140px] sm:h-[150px] md:h-[160px] lg:h-[180px] overflow-hidden relative`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
                <CardContent className="p-4 sm:p-5 md:p-6 lg:p-8 h-full relative z-10 flex flex-col items-center justify-center text-center">
                  <div className="text-foreground text-xl sm:text-2xl md:text-2xl lg:text-3xl font-bold mb-0.5 sm:mb-1">{sessionCount} {t('sessionsLabel')}</div>
                  <div className="flex items-center gap-1.5 sm:gap-2 text-primary">
                    <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="text-[11px] sm:text-xs md:text-sm">{totalHours} {t('hoursActive')}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Analytics Card */}
              <Card
                className={`${cardBaseClasses} rounded-[16px] sm:rounded-[20px] md:rounded-[24px] lg:rounded-[28px] h-[220px] sm:h-[250px] md:h-[280px] lg:h-[340px] overflow-hidden relative`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
                <CardContent className="p-4 sm:p-5 md:p-5 lg:p-6 h-full relative z-10 flex flex-col justify-between">
                  <div>
                    <h3 className="text-foreground text-base sm:text-lg md:text-lg lg:text-xl font-bold mb-1.5 sm:mb-2">{t('analyticsInsights')}</h3>
                    <p className="text-muted-foreground text-[11px] sm:text-xs md:text-sm leading-relaxed">{t('trackUsage')}</p>
                  </div>

                  {/* Interactive elements visualization */}
                  <div className="relative h-24 sm:h-28 md:h-32 lg:h-40 flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center justify-center">
                      {/* Center icon */}
                      <div className="w-12 h-12 sm:w-13 sm:h-13 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-full bg-gradient-to-br from-[#7c3aed] to-[#8b5cf6] flex items-center justify-center shadow-lg shadow-purple-500/40 z-10">
                        <BarChart3 className="w-5 h-5 sm:w-5.5 sm:h-5.5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-white" />
                      </div>

                      {/* Orbiting elements */}
                      <div className="absolute w-24 h-24 sm:w-26 sm:h-26 md:w-28 md:h-28 lg:w-32 lg:h-32 border border-purple-500/20 rounded-full animate-spin" style={{ animationDuration: '20s' }}>
                        <div className="absolute -top-1.5 sm:-top-2 left-1/2 -translate-x-1/2 w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 rounded-full bg-purple-500/60" />
                        <div className="absolute top-1/2 -right-1.5 sm:-right-2 -translate-y-1/2 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-blue-500/60" />
                        <div className="absolute -bottom-1.5 sm:-bottom-2 left-1/2 -translate-x-1/2 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-pink-500/60" />
                      </div>

                      {/* Text labels */}
                      <div className="absolute top-0 left-6 sm:left-8 text-purple-400 text-[9px] sm:text-[10px] md:text-xs rotate-[-20deg]">← {t('insightsLabel')}</div>
                      <div className="absolute bottom-3 sm:bottom-4 right-1 sm:right-2">
                        <div className="text-white text-[9px] sm:text-[10px] md:text-xs bg-orange-500/20 border border-orange-500/40 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full rotate-12">
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
