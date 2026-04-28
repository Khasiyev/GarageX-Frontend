import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wrench } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { authService } from '../../services/auth';
import { useLang } from '../../context/LanguageContext';
import { AxiosError } from 'axios';
import type { BaseResponse } from '../../types/common';

export function ForgotPasswordPage() {
  const { t } = useLang();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authService.forgotPassword({ email });
      setMsg(res.message || 'Email göndərildi');
    } catch (err) {
      setMsg((err as AxiosError<BaseResponse>).response?.data?.message || 'Xəta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-skin-bg flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-skin-card border border-skin-border rounded-2xl mb-4 shadow-sm">
            <Wrench size={22} className="text-skin-text" />
          </div>
          <h1 className="text-xl font-bold text-skin-text">{t('forgotTitle')}</h1>
          <p className="text-skin-text3 mt-1 text-sm">{t('forgotDesc')}</p>
        </div>
        <div className="bg-skin-card border border-skin-border rounded-2xl shadow-sm p-7">
          {msg && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-skin-bg border border-skin-border rounded-xl px-4 py-3 mb-4"><p className="text-sm text-skin-text2">{msg}</p></motion.div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label={t('email')} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Button type="submit" loading={loading} className="w-full">{t('sendLink')}</Button>
          </form>
          <div className="mt-5 text-center">
            <Link to="/login" className="text-xs text-skin-text3 hover:text-skin-text transition-colors">{t('backToLogin')}</Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
