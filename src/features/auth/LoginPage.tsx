import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { authService } from '../../services/auth';
import { customerService } from '../../services/customer';
import { setAuth, setMyCustomerIds, isAdmin } from '../../lib/auth';
import { useLang } from '../../context/LanguageContext';
import { AxiosError } from 'axios';
import type { BaseResponse } from '../../types/common';

export function LoginPage() {
  const navigate = useNavigate();
  const { t } = useLang();
  const [form, setForm] = useState({ userNameOrEmail: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await authService.login(form);
      if (res.success && res.data) {
        const d = res.data;
        setAuth(d.token, d.refreshToken, {
          userName: d.userName,
          email: d.email,
          fullName: d.fullName,
        });

        const admin = isAdmin();
        if (!admin) {
          // Fetch user's own customer records
          try {
            const cRes = await customerService.getAll();
            if (cRes.data.success) {
              const ids = cRes.data.data.map((c) => c.id);
              setMyCustomerIds(ids);
              // If no customer record yet → go to customers page for self-registration
              if (ids.length === 0) {
                navigate('/customers?firstLogin=1');
                return;
              }
            }
          } catch { /* non-critical */ }
        }

        navigate('/welcome');
      } else {
        setError(res.message || t('error'));
      }
    } catch (err) {
      setError((err as AxiosError<BaseResponse>).response?.data?.message || t('error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-skin-bg flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-skin-card border border-skin-border rounded-2xl mb-4 shadow-sm overflow-hidden">
            <img src="/logo.jpeg" alt="GarageX" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-xl font-bold text-skin-text tracking-tight">GarageX</h1>
          <p className="text-skin-text3 mt-1 text-sm">{t('loginTitle')}</p>
        </div>

        <div className="bg-skin-card border border-skin-border rounded-2xl shadow-sm p-7">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-5"
            >
              <p className="text-sm text-red-500">{error}</p>
            </motion.div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            <Input
              label={t('username')}
              value={form.userNameOrEmail}
              onChange={(e) => setForm({ ...form, userNameOrEmail: e.target.value })}
              autoComplete="off"
              required
            />
            <Input
              label={t('password')}
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              autoComplete="new-password"
              required
            />
            <Button type="submit" loading={loading} className="w-full">{t('loginButton')}</Button>
          </form>
          <div className="mt-5 flex items-center justify-between text-xs">
            <Link to="/register" className="text-skin-text3 hover:text-skin-text transition-colors">{t('noAccount')}</Link>
            <Link to="/forgot-password" className="text-skin-text3 hover:text-skin-text transition-colors">{t('forgotPassword')}</Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
