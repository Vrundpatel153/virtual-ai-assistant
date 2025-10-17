import { Navbar } from "../../components/Navbar";
import { Check, CreditCard, Zap } from "lucide-react";
import { settingsManager, tokenManager } from "../../lib/historyManager";
import { t, useI18n } from "../../lib/i18n";
import { useToast } from "../../components/ToastProvider";
import { authService } from "../../lib/auth";

const makePlans = () => ([
  { id: 'free', name: t('freeName'), price: '$0', desc: t('planFreeDesc'), tokens: 500, features: [t('tokensPerDay').replace('{count}', '500'), t('featureLocalTools'), t('featureRemindersNotifications')] },
  { id: 'pro', name: t('proName'), price: '$9', desc: t('planProDesc'), tokens: 5000, features: [t('tokensPerDay').replace('{count}', '5,000'), t('featurePriorityFeatures'), t('featureEmailSupport')] },
  { id: 'premium', name: t('premiumName'), price: '$29', desc: t('planPremiumDesc'), tokens: 50000, features: [t('tokensPerDay').replace('{count}', '50,000'), t('featureAllFeatures'), t('featurePrioritySupport')] },
]);

export const Pricing = (): JSX.Element => {
  useI18n();
  const { showToast } = useToast();
  const plans = makePlans();
  const current = settingsManager.get().plan || 'free';
  const user = authService.getCurrentUser();
  const choosePlan = (plan: 'free' | 'pro' | 'premium') => {
    if (!user) {
      try { window.dispatchEvent(new CustomEvent('ai_trigger_auth_modal', { detail: { mode: 'signin' } })); } catch {}
      return;
    }
    settingsManager.update({ plan });
    tokenManager.reset();
    showToast({ variant: 'success', title: t('pricing'), description: t('planUpdatedAlert').replace('{plan}', plan) });
  };

  return (
    <div className="bg-[#0a0b1e] w-full min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 pt-20 md:pt-24 pb-6 px-4 md:px-6 max-w-6xl mx-auto w-full">
        <div className="text-center mb-10">
          <h1 className="text-white text-4xl font-bold mb-2 flex items-center justify-center gap-3">
            <CreditCard className="w-8 h-8 text-purple-400" /> {t('pricing')}
          </h1>
          <p className="text-gray-400">{t('pricingSubtitle')}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((p) => (
            <div key={p.id} className={`rounded-2xl border border-white/10 bg-gradient-to-br from-[#1e2139]/95 to-[#252844]/90 p-6 ${current===p.id? 'ring-2 ring-purple-500':''}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white text-xl font-bold">{p.name}</h3>
                {p.id==='premium' && (
                  <div className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full border border-yellow-500/30 flex items-center gap-1">
                    <Zap className="w-3 h-3" /> {t('bestValue')}
                  </div>
                )}
              </div>
              <div className="text-3xl font-extrabold text-white mb-1">{p.price}<span className="text-sm text-gray-400">/mo</span></div>
              <div className="text-gray-400 mb-4">{p.desc}</div>
              <div className="text-purple-300 mb-4">{t('tokensPerDay').replace('{count}', p.tokens.toLocaleString())}</div>
              <ul className="space-y-2 mb-6">
                {p.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-200"><Check className="w-4 h-4 text-green-400" /> {f}</li>
                ))}
              </ul>
              <button onClick={() => choosePlan(p.id as any)} className={`w-full py-3 rounded-xl font-semibold transition-all ${current===p.id? 'bg-purple-600 text-white':'bg-white/10 text-white hover:bg-white/20'}`}>
                {current===p.id? t('currentPlan'): t('choosePlan')}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
