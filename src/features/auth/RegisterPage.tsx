import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wrench } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { authService } from '../../services/auth';
import { useLang } from '../../context/LanguageContext';
import { AxiosError } from 'axios';
import type { BaseResponse } from '../../types/common';

export function RegisterPage() {
  const navigate = useNavigate();
  const { t } = useLang();
  const [form, setForm] = useState({ fullName: '', userName: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await authService.register(form);
      if (res.success) {
        setSuccess(res.data ?? 'Qeydiyyat uğurlu oldu. Email təsdiqi üçün yoxlayın.');
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError((err as AxiosError<BaseResponse>).response?.data?.message || 'Xəta');
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
          <h1 className="text-xl font-bold text-skin-text">GarageX</h1>
          <p className="text-skin-text3 mt-1 text-sm">{t('registerTitle')}</p>
        </div>
        <div className="bg-skin-card border border-skin-border rounded-2xl shadow-sm p-7">
          {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4"><p className="text-sm text-red-500">{error}</p></motion.div>}
          {success && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 mb-4"><p className="text-sm text-emerald-500">{success}</p></motion.div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label={t('fullName')} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
            <Input label={t('userName')} value={form.userName} onChange={(e) => setForm({ ...form, userName: e.target.value })} required />
            <Input label={t('email')} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            <Input label={t('password')} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            <Button type="submit" loading={loading} className="w-full">{t('registerButton')}</Button>
          </form>
          <div className="mt-5 text-center">
            <Link to="/login" className="text-xs text-skin-text3 hover:text-skin-text transition-colors">{t('haveAccount')}</Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
