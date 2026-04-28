import { useState, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageTransition } from '../../components/ui/PageTransition';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { getUser } from '../../lib/auth';
import { authService } from '../../services/auth';
import { useLang } from '../../context/LanguageContext';
import { AxiosError } from 'axios';
import type { BaseResponse } from '../../types/common';

export function ProfilePage() {
  const navigate = useNavigate();
  const { t } = useLang();
  const user = getUser();
  const [pwForm, setPwForm] = useState({ email: user?.email ?? '', token: '', newPassword: '', confirm: '' });
  const [step, setStep] = useState<'idle' | 'sent' | 'done'>('idle');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [isError, setIsError] = useState(false);

  const showMsg = (m: string, err = false) => {
    setMsg(m); setIsError(err);
    setTimeout(() => setMsg(''), 5000);
  };

  const handleSendReset = async () => {
    setLoading(true);
    try {
      const res = await authService.forgotPassword({ email: user?.email ?? '' });
      if (res.success) {
        setStep('sent');
        showMsg('Şifrə dəyişmə linki email ünvanınıza göndərildi');
      } else {
        showMsg(res.message, true);
      }
    } catch (err) {
      showMsg((err as AxiosError<BaseResponse>).response?.data?.message || 'Xəta', true);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) {
      showMsg('Şifrələr uyğun gəlmir', true);
      return;
    }
    setLoading(true);
    try {
      const res = await authService.resetPassword({
        email: pwForm.email,
        token: pwForm.token,
        newPassword: pwForm.newPassword,
      });
      if (res.success) {
        setStep('done');
        showMsg('Şifrəniz uğurla dəyişdirildi');
        setPwForm({ email: user?.email ?? '', token: '', newPassword: '', confirm: '' });
      } else {
        showMsg(res.message, true);
      }
    } catch (err) {
      showMsg((err as AxiosError<BaseResponse>).response?.data?.message || 'Xəta', true);
    } finally {
      setLoading(false);
    }
  };

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
  const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

  return (
    <PageTransition>
      <motion.div variants={container} initial="hidden" animate="show" className="max-w-2xl space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-xs text-skin-text3 hover:text-skin-text2 transition-colors px-3 py-1.5 rounded-xl hover:bg-skin-hover border border-skin-border">
            <ArrowLeft size={16} />{t('back')}
          </button>
          <h1 className="text-xl font-bold text-skin-text">{t('profileTitle')}</h1>
        </div>

        {/* Personal Info */}
        <motion.div variants={item}>
          <Card>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 bg-skin-hover rounded-xl flex items-center justify-center border border-skin-border">
                <User size={15} className="text-skin-text2" />
              </div>
              <h2 className="text-sm font-semibold text-skin-text">{t('personalInfo')}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: t('fullName'), value: user?.fullName },
                { label: t('email'), value: user?.email },
                { label: t('userName'), value: user?.userName },
              ].map((f) => (
                <div key={f.label} className="bg-skin-bg rounded-xl px-4 py-3">
                  <p className="text-xs text-skin-text3 mb-0.5">{f.label}</p>
                  <p className="text-sm font-medium text-skin-text">{f.value || '—'}</p>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Change Password */}
        <motion.div variants={item}>
          <Card>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 bg-skin-hover rounded-xl flex items-center justify-center border border-skin-border">
                <Lock size={15} className="text-skin-text2" />
              </div>
              <h2 className="text-sm font-semibold text-skin-text">{t('changePassword')}</h2>
            </div>

            {msg && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-center gap-2 rounded-xl px-4 py-3 mb-4 ${isError ? 'bg-red-500/10 border border-red-500/20' : 'bg-emerald-500/10 border border-emerald-500/20'}`}
              >
                {isError
                  ? <AlertCircle size={15} className="text-red-500" />
                  : <CheckCircle size={15} className="text-emerald-500" />}
                <p className={`text-sm ${isError ? 'text-red-500' : 'text-emerald-500'}`}>{msg}</p>
              </motion.div>
            )}

            {step === 'idle' && (
              <div className="space-y-3">
                <p className="text-sm text-skin-text2">
                  Şifrənizi dəyişmək üçün email ünvanınıza bərpa linki göndəriləcək:
                  <span className="font-medium text-skin-text ml-1">{user?.email}</span>
                </p>
                <Button onClick={handleSendReset} loading={loading}>
                  <Lock size={14} className="mr-2" />Link Göndər
                </Button>
              </div>
            )}

            {step === 'sent' && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <p className="text-sm text-skin-text2 bg-skin-bg rounded-xl p-3">
                  Email göndərildi. Token-i emaildən kopyalayın:
                </p>
                <Input
                  label="Email Token"
                  placeholder="Email-dən aldığınız token"
                  value={pwForm.token}
                  onChange={(e) => setPwForm({ ...pwForm, token: e.target.value })}
                  required
                />
                <Input
                  label={t('newPasswordLabel')}
                  type="password"
                  placeholder="••••••••"
                  value={pwForm.newPassword}
                  onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                  required
                />
                <Input
                  label={t('confirmNewPassword')}
                  type="password"
                  placeholder="••••••••"
                  value={pwForm.confirm}
                  onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
                  required
                />
                <div className="flex gap-3">
                  <Button type="button" variant="ghost" onClick={() => setStep('idle')}>{t('cancel')}</Button>
                  <Button type="submit" loading={loading}>{t('resetButton')}</Button>
                </div>
              </form>
            )}

            {step === 'done' && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-emerald-500">
                  <CheckCircle size={18} />
                  <p className="text-sm font-medium">Şifrə uğurla dəyişdirildi</p>
                </div>
                <Button variant="ghost" className="self-start" onClick={() => setStep('idle')}>Yenidən dəyiş</Button>
              </div>
            )}
          </Card>
        </motion.div>
      </motion.div>
    </PageTransition>
  );
}
