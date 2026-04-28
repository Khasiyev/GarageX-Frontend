import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldOff, ArrowLeft } from 'lucide-react';
import { useLang } from '../../context/LanguageContext';

export function AccessDeniedPage() {
  const navigate = useNavigate();
  const { lang } = useLang();

  const labels = {
    az: { title: 'Giriş Qadağandır', desc: 'Bu səhifəyə baxmaq üçün Admin səlahiyyətiniz yoxdur.', back: 'Geri qayıt' },
    ru: { title: 'Доступ запрещён', desc: 'У вас нет прав администратора для просмотра этой страницы.', back: 'Вернуться' },
    en: { title: 'Access Denied', desc: "You don't have Admin permission to view this page.", back: 'Go back' },
  };
  const l = labels[lang as keyof typeof labels] ?? labels.az;

  return (
    <div className="min-h-screen bg-skin-bg flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="text-center max-w-sm"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 bg-red-500/10 rounded-2xl mb-6">
          <ShieldOff size={36} className="text-red-500" />
        </div>
        <p className="text-6xl font-bold text-skin-text mb-3">403</p>
        <h1 className="text-xl font-bold text-skin-text mb-2">{l.title}</h1>
        <p className="text-sm text-skin-text3 mb-8">{l.desc}</p>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-skin-card border border-skin-border text-sm font-medium text-skin-text2 hover:bg-skin-hover transition-colors"
        >
          <ArrowLeft size={16} />
          {l.back}
        </button>
      </motion.div>
    </div>
  );
}
