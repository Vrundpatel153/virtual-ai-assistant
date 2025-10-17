import { Navbar } from "../../components/Navbar";
import { ThemeToggle } from "../../components/ThemeToggle";
import { Settings as SettingsIcon, Bell, Lock, Globe, Palette, Zap, KeyRound, Gauge, CreditCard } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Switch } from "../../components/ui/switch";
import { useEffect, useRef, useState } from "react";
import { settingsManager, tokenManager } from "../../lib/historyManager";
import { useGlobalLoading } from "../../components/LoadingProvider";
import { t, useI18n } from "../../lib/i18n";
import { useToast } from "../../components/ToastProvider";

export const Settings = (): JSX.Element => {
  useI18n();
  const { setLoading } = useGlobalLoading();
  const [reminderInApp, setReminderInApp] = useState(true);
  const [reminderEmail, setReminderEmail] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [plan, setPlan] = useState<'free'|'pro'|'premium'>('free');
  const [reduceLoad, setReduceLoad] = useState(false);
  const [language, setLanguage] = useState<'en'|'hi'>('en');
  const [hideTokenUsage, setHideTokenUsage] = useState(false);
  const [customCursor, setCustomCursor] = useState(true);
  const { showToast } = useToast();
  const actionsRef = useRef<HTMLDivElement | null>(null);
  const [baseline, setBaseline] = useState<null | {
    reminderInApp: boolean;
    reminderEmail: boolean;
    apiKey: string;
    plan: 'free'|'pro'|'premium';
    reduceLoad: boolean;
    language: 'en'|'hi';
    hideTokenUsage: boolean;
    customCursor: boolean;
  }>(null);

  useEffect(() => {
    const s = settingsManager.get();
    setReminderInApp(!!s.reminderInApp);
    setReminderEmail(!!s.reminderEmail);
    setApiKey(s.apiKey || "");
    setPlan((s.plan as any) || 'free');
    setReduceLoad(!!s.reduceLoad);
    setLanguage((s.language as any) || 'en');
    setHideTokenUsage(!!s.hideTokenUsage);
    setCustomCursor(s.customCursor !== false);
    setBaseline({
      reminderInApp: !!s.reminderInApp,
      reminderEmail: !!s.reminderEmail,
      apiKey: s.apiKey || "",
      plan: ((s.plan as any) || 'free'),
      reduceLoad: !!s.reduceLoad,
      language: ((s.language as any) || 'en'),
      hideTokenUsage: !!s.hideTokenUsage,
      customCursor: (s.customCursor !== false),
    });
  }, []);

  const saveSettings = () => {
    setLoading(true);
  settingsManager.update({ reminderInApp, reminderEmail, apiKey: apiKey.trim(), plan, reduceLoad, language, hideTokenUsage, customCursor });
    tokenManager.reset();
    setTimeout(()=>{
      setLoading(false);
      showToast({ variant: 'success', title: t('settings'), description: t('settingsSaved') });
      setBaseline({ reminderInApp, reminderEmail, apiKey: apiKey.trim(), plan, reduceLoad, language, hideTokenUsage, customCursor });
    }, 500);
  };

  const isDirty = baseline ? (
    baseline.reminderInApp !== reminderInApp ||
    baseline.reminderEmail !== reminderEmail ||
    (baseline.apiKey || "") !== (apiKey || "") ||
    baseline.plan !== plan ||
    baseline.reduceLoad !== reduceLoad ||
    baseline.language !== language ||
    baseline.hideTokenUsage !== hideTokenUsage ||
    baseline.customCursor !== customCursor
  ) : false;

  const resetChanges = () => {
    if (!baseline) return;
    setReminderInApp(baseline.reminderInApp);
    setReminderEmail(baseline.reminderEmail);
    setApiKey(baseline.apiKey);
    setPlan(baseline.plan);
    setReduceLoad(baseline.reduceLoad);
    setLanguage(baseline.language);
    setHideTokenUsage(baseline.hideTokenUsage);
    setCustomCursor(baseline.customCursor);
  };

  // When changes occur, auto-scroll to the action buttons to reveal Save option
  useEffect(() => {
    if (isDirty && actionsRef.current) {
      // Slight delay to ensure the buttons are rendered before scrolling
      const t = window.setTimeout(() => {
        actionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
      return () => window.clearTimeout(t);
    }
  }, [isDirty]);

  const usage = tokenManager.getUsage();
  const limit = tokenManager.getDailyLimit();

  const settingsSections = [
    {
      icon: <Palette className="w-5 h-5 text-white" />,
  title: t('appearanceTitle'),
  description: t('appearanceDesc'),
      color: "from-purple-600 to-purple-700",
      component: (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-semibold mb-1">{t('theme')}</p>
            <p className="text-gray-400 text-sm">{t('themeDesc')}</p>
          </div>
          <ThemeToggle />
        </div>
      ),
    },
    {
      icon: <Bell className="w-5 h-5 text-white" />,
      title: t('remindersTitle'),
      description: t('remindersDesc'),
      color: "from-blue-600 to-blue-700",
      component: (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-300">{t('reminderInApp')}</span>
            <Switch checked={reminderInApp} onCheckedChange={setReminderInApp} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-300">{t('reminderEmail')}</span>
            <Switch checked={reminderEmail} onCheckedChange={setReminderEmail} />
          </div>
          <p className="text-xs text-gray-400">{t('onlyRemindersNote')}</p>
        </div>
      ),
    },
    {
      icon: <KeyRound className="w-5 h-5 text-white" />,
      title: t('apiKeyTitle'),
      description: t('apiKeyDesc'),
      color: "from-emerald-600 to-emerald-700",
      component: (
        <div className="space-y-3">
          <input
            type="password"
            placeholder={t('pasteApiKey')}
            value={apiKey}
            onChange={(e)=>setApiKey(e.target.value)}
            className="w-full bg-[#2a2d4a] text-white rounded-lg px-4 py-2 outline-none border border-white/10 focus:border-purple-500"
          />
          <p className="text-xs text-gray-400">{t('localKeyNote')}</p>
        </div>
      ),
    },
    {
      icon: <Gauge className="w-5 h-5 text-white" />,
      title: t('tokenUsageTitle'),
      description: t('tokenUsageDesc'),
      color: "from-cyan-600 to-cyan-700",
      component: (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-gray-300"><span>{t('tokenUsedToday')}</span><span className="font-semibold text-white">{usage.used}/{Number.isFinite(limit)? limit: '∞'}</span></div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple-500 to-purple-700" style={{width: `${Number.isFinite(limit)? Math.min(100, (usage.used/(limit||1))*100):0}%`}} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-300">{t('hideUsageInChat')}</span>
            <Switch checked={hideTokenUsage} onCheckedChange={setHideTokenUsage} />
          </div>
          <a href="/pricing" className="inline-flex items-center gap-2 text-purple-300 hover:text-purple-200 text-sm font-semibold"><CreditCard className="w-4 h-4"/> {t('upgradePlan')}</a>
        </div>
      ),
    },
    {
      icon: <Lock className="w-5 h-5 text-white" />,
      title: t('privacyTitle'),
      description: t('privacyDesc'),
      color: "from-green-600 to-green-700",
      component: (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-300">{t('twoFactor')}</span>
            <Switch />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-300">{t('dataEncryption')}</span>
            <Switch defaultChecked />
          </div>
          <button className="text-purple-400 hover:text-purple-300 text-sm font-semibold transition-colors">
            {t('changePassword')} →
          </button>
        </div>
      ),
    },
    {
      icon: <Globe className="w-5 h-5 text-white" />,
      title: t('language'),
      description: t('languageDesc'),
      color: "from-orange-600 to-orange-700",
      component: (
        <div className="space-y-3">
          <div>
            <label className="text-gray-300 text-sm mb-2 block">{t('language')}</label>
            <select value={language} onChange={e=>setLanguage(e.target.value as any)} className="w-full bg-[#2a2d4a] text-white rounded-lg px-4 py-2 outline-none border border-white/10 focus:border-purple-500 transition-colors">
              <option value="en">{t('english')}</option>
              <option value="hi">{t('hindi')}</option>
            </select>
          </div>
        </div>
      ),
    },
    {
      icon: <Zap className="w-5 h-5 text-white" />,
      title: t('performanceTitle'),
      description: t('performanceDesc'),
      color: "from-yellow-600 to-yellow-700",
      component: (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-300">{t('performanceReduceLoad')}</span>
            <Switch checked={reduceLoad} onCheckedChange={setReduceLoad} />
          </div>
          <p className="text-xs text-gray-400">{t('performanceNote')}</p>
          <div className="flex items-center justify-between pt-2">
            <span className="text-gray-300">{t('customCursor')}</span>
            <Switch checked={customCursor} onCheckedChange={setCustomCursor} />
          </div>
          <p className="text-xs text-gray-400">{t('customCursorDesc')}</p>
        </div>
      ),
    },
  ];

  return (
    <div className="bg-[#0a0b1e] w-full min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 pt-20 md:pt-24 pb-6 px-4 md:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-white text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
              <SettingsIcon className="w-8 h-8 text-purple-400" />
              {t('settings')}
            </h1>
            <p className="text-gray-400 text-sm md:text-base">{t('settingsSubtitle')}</p>
          </div>

          <div className="space-y-4 md:space-y-6">
            {settingsSections.map((section, index) => (
              <Card
                key={index}
                className="backdrop-blur-xl bg-gradient-to-br from-[#1e2139]/95 to-[#252844]/90 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] rounded-[20px] md:rounded-[24px] overflow-hidden"
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${section.color} flex items-center justify-center shadow-lg flex-shrink-0`}>
                      {section.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white text-lg font-bold mb-1">{section.title}</h3>
                      <p className="text-gray-400 text-sm">{section.description}</p>
                    </div>
                  </div>
                  <div className="pl-14">{section.component}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {isDirty && (
            <div ref={actionsRef} className="mt-8 flex justify-end gap-4">
              <button onClick={resetChanges} className="px-6 py-3 rounded-full font-semibold text-sm text-gray-300 hover:text-white transition-colors">
                {t('resetDefaults')}
              </button>
              <button onClick={saveSettings} className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-8 py-3 rounded-full font-semibold text-sm shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105">{t('saveChanges')}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
