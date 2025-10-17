import { Navbar } from "../../components/Navbar";
import { Check, CreditCard, Zap } from "lucide-react";
import { settingsManager, tokenManager } from "../../lib/historyManager";

const plans = [
  { id: 'free', name: 'Free', price: '$0', desc: 'Great to start', tokens: 500, features: ['500 tokens/day', 'Local tools', 'Reminders & notifications'] },
  { id: 'pro', name: 'Pro', price: '$9', desc: 'For active users', tokens: 5000, features: ['5,000 tokens/day', 'Priority features', 'Email support'] },
  { id: 'premium', name: 'Premium', price: '$29', desc: 'Power users', tokens: 50000, features: ['50,000 tokens/day', 'All features', 'Priority support'] },
];

export const Pricing = (): JSX.Element => {
  const current = settingsManager.get().plan || 'free';
  const choosePlan = (plan: 'free' | 'pro' | 'premium') => {
    settingsManager.update({ plan });
    tokenManager.reset();
    alert(`Plan updated to ${plan}. Token limit refreshed for today.`);
  };

  return (
    <div className="bg-[#0a0b1e] w-full min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 pt-20 md:pt-24 pb-6 px-4 md:px-6 max-w-6xl mx-auto w-full">
        <div className="text-center mb-10">
          <h1 className="text-white text-4xl font-bold mb-2 flex items-center justify-center gap-3">
            <CreditCard className="w-8 h-8 text-purple-400" /> Pricing
          </h1>
          <p className="text-gray-400">Upgrade your daily token limit instantly.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((p) => (
            <div key={p.id} className={`rounded-2xl border border-white/10 bg-gradient-to-br from-[#1e2139]/95 to-[#252844]/90 p-6 ${current===p.id? 'ring-2 ring-purple-500':''}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white text-xl font-bold">{p.name}</h3>
                {p.id==='premium' && (
                  <div className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full border border-yellow-500/30 flex items-center gap-1">
                    <Zap className="w-3 h-3" /> Best value
                  </div>
                )}
              </div>
              <div className="text-3xl font-extrabold text-white mb-1">{p.price}<span className="text-sm text-gray-400">/mo</span></div>
              <div className="text-gray-400 mb-4">{p.desc}</div>
              <div className="text-purple-300 mb-4">{p.tokens.toLocaleString()} tokens/day</div>
              <ul className="space-y-2 mb-6">
                {p.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-200"><Check className="w-4 h-4 text-green-400" /> {f}</li>
                ))}
              </ul>
              <button onClick={() => choosePlan(p.id as any)} className={`w-full py-3 rounded-xl font-semibold transition-all ${current===p.id? 'bg-purple-600 text-white':'bg-white/10 text-white hover:bg-white/20'}`}>
                {current===p.id? 'Current plan':'Choose plan'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
