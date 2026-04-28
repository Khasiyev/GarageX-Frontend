import { useState, FormEvent } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wrench } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { authService } from '../../services/auth';
import { useLang } from '../../context/LanguageContext';
import { AxiosError } from 'axios';
import type { BaseResponse } from '../../types/common';

export function ResetPasswordPage() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const email = params.get('email') ?? '';
  const token = params.get('token') ?? '';

  const [form, setForm] = useState({
    newPassword: '',
    confirm: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!email || !token) {
      setError('Reset link düzgün deyil. Email və ya token tapılmadı.');
      return;
    }

    if (form.newPassword !== form.confirm) {
      setError('Şifrələr uyğun gəlmir');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await authService.resetPassword({
        email,
        token,
        newPassword: form.newPassword,
      });

      if (res.success) {
        setSuccess(res.data ?? 'Şifrə dəyişdirildi');
        setTimeout(() => navigate('/login'), 2500);
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError(
        (err as AxiosError<BaseResponse>).response?.data?.message || 'Xəta'
      );
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
          <div className="inline-flex items-center justify-center w-12 h-12 bg-skin-card border border-skin-border rounded-2xl mb-4 shadow-sm">
            <Wrench size={22} className="text-skin-text" />
          </div>

          <h1 className="text-xl font-bold text-skin-text">
            {t('resetTitle')}
          </h1>

          <p className="text-skin-text3 mt-1 text-sm">
            {t('resetDesc')}
          </p>
        </div>

        <div className="bg-skin-card border border-skin-border rounded-2xl shadow-sm p-7">
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4"
            >
              <p className="text-sm text-red-500">{error}</p>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 mb-4"
            >
              <p className="text-sm text-emerald-500">{success}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label={t('newPasswordLabel')}
              type="password"
              placeholder="••••••••"
              value={form.newPassword}
              onChange={(e) =>
                setForm({ ...form, newPassword: e.target.value })
              }
              required
            />

            <Input
              label={t('confirmPassword')}
              type="password"
              placeholder="••••••••"
              value={form.confirm}
              onChange={(e) =>
                setForm({ ...form, confirm: e.target.value })
              }
              required
            />

            <Button type="submit" loading={loading} className="w-full">
              {t('resetButton')}
            </Button>
          </form>

          <div className="mt-5 text-center">
            <Link
              to="/login"
              className="text-xs text-skin-text3 hover:text-skin-text transition-colors"
            >
              {t('backToLogin')}
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}