import React, { useEffect, useState } from 'react';
import { Modal } from './Modal';
import { Mail, Lock, User, Chrome } from 'lucide-react';
import { authService } from '../lib/auth';
import { useGlobalLoading } from './LoadingProvider';
import { t, useI18n } from '../lib/i18n';
import { useToast } from './ToastProvider';

type Mode = 'signin' | 'signup';

export interface AuthModalProps {
  isOpen: boolean;
  initialMode?: Mode;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, initialMode = 'signin', onClose, onSuccess }) => {
  useI18n();
  const { setLoading } = useGlobalLoading();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    const handler = (e: any) => {
      if (!e?.detail) return;
      setMode(e.detail.mode === 'signup' ? 'signup' : 'signin');
    };
    window.addEventListener('ai_open_auth_modal', handler as any);
    return () => window.removeEventListener('ai_open_auth_modal', handler as any);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password || (mode === 'signup' && !name)) {
      setError(t('fillAllFields'));
      return;
    }
    setLoading(true);
    if (mode === 'signin') {
      const result = authService.signIn(email, password);
      if (result.success) {
        onSuccess?.();
        onClose();
      } else {
        setError(result.error || t('loginFailed'));
      }
    } else {
      const result = authService.signUp(email, password, name);
      if (result.success) {
        onSuccess?.();
        onClose();
      } else {
        setError(result.error || t('signupFailed'));
      }
    }
    setTimeout(() => setLoading(false), 500);
  };

  const handleGoogle = () => {
    // Use toast to instruct user to continue; in real flow, you'd redirect to provider
    showToast({ variant: 'info', title: t('google'), description: t('googleEmailPrompt') });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={mode === 'signin' ? t('signIn') : t('signUp')} size="md">
      <div className="space-y-4">
        <div className="flex gap-2">
          <button onClick={() => setMode('signin')} className={`flex-1 py-2 rounded-lg font-semibold ${mode==='signin' ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white' : 'bg-[#2a2d4a] text-gray-300'}`}>{t('signIn')}</button>
          <button onClick={() => setMode('signup')} className={`flex-1 py-2 rounded-lg font-semibold ${mode==='signup' ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white' : 'bg-[#2a2d4a] text-gray-300'}`}>{t('signUp')}</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'signup' && (
            <div>
              <label className="text-gray-300 text-sm mb-1 block">{t('nameLabel')}</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" value={name} onChange={(e)=>setName(e.target.value)} placeholder={t('namePlaceholder')} className="w-full bg-[#2a2d4a] text-white rounded-lg pl-10 pr-3 py-2 outline-none border border-white/10 focus:border-purple-500" />
              </div>
            </div>
          )}
          <div>
            <label className="text-gray-300 text-sm mb-1 block">{t('emailInputLabel')}</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder={t('emailInputPlaceholder')} className="w-full bg-[#2a2d4a] text-white rounded-lg pl-10 pr-3 py-2 outline-none border border-white/10 focus:border-purple-500" />
            </div>
          </div>
          <div>
            <label className="text-gray-300 text-sm mb-1 block">{t('passwordLabel')}</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder={t('passwordPlaceholder')} className="w-full bg-[#2a2d4a] text-white rounded-lg pl-10 pr-3 py-2 outline-none border border-white/10 focus:border-purple-500" />
            </div>
          </div>
          {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2 text-red-400 text-sm">{error}</div>}
          <button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white py-2 rounded-lg font-semibold">{mode==='signin'? t('signIn'): t('signUp')}</button>
        </form>

        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
          <div className="relative flex justify-center text-xs"><span className="px-2 bg-[#1e2139] text-gray-400">{t('orContinueWith')}</span></div>
        </div>

        <button onClick={handleGoogle} className="w-full bg-[#2a2d4a] hover:bg-[#323556] text-white py-2 rounded-lg font-semibold border border-white/10 hover:border-white/20 transition-all duration-200 flex items-center justify-center gap-2">
          <Chrome className="w-4 h-4" /> {t('google')}
        </button>
      </div>
    </Modal>
  );
};

export default AuthModal;
