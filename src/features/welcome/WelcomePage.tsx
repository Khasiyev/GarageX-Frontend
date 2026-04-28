import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Users, Car, ClipboardList,
  Package, FileText, CreditCard, ChevronRight, Sparkles,
} from 'lucide-react';
import { getUser, isAdmin } from '../../lib/auth';
import { useLang } from '../../context/LanguageContext';
import { SocialLinksRow } from '../../components/SocialLinks';

const SECTIONS = [
  { icon: LayoutDashboard, key: 'dashboard' as const, to: '/dashboard', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { icon: Users, key: 'customers' as const, to: '/customers', color: 'text-violet-500', bg: 'bg-violet-500/10' },
  { icon: Car, key: 'vehicles' as const, to: '/vehicles', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { icon: ClipboardList, key: 'jobOrders' as const, to: '/job-orders', color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { icon: Package, key: 'inventory' as const, to: '/inventory', color: 'text-cyan-500', bg: 'bg-cyan-500/10', adminOnly: true },
  { icon: FileText, key: 'invoices' as const, to: '/invoices', color: 'text-rose-500', bg: 'bg-rose-500/10' },
  { icon: CreditCard, key: 'payments' as const, to: '/payments', color: 'text-teal-500', bg: 'bg-teal-500/10' },
  { icon: Sparkles, key: 'aiAssistant' as const, to: '/ai', color: 'text-violet-500', bg: 'bg-violet-500/10' },
];

export function WelcomePage() {
  const navigate = useNavigate();
  const user = getUser();
  const admin = isAdmin();
  const { t } = useLang();
  const visibleSections = SECTIONS.filter((s) => !(s as { adminOnly?: boolean }).adminOnly || admin);

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  return (
    <div className="min-h-screen bg-skin-bg flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-10"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 bg-skin-card border border-skin-border rounded-2xl mb-5 shadow-sm overflow-hidden">
          <img src="/logo.jpeg" alt="GarageX" className="w-full h-full object-cover" />
        </div>
        <h1 className="text-4xl font-bold text-skin-text tracking-tight mb-2">{t('welcomeTitle')}</h1>
        {user && <p className="text-skin-text2 text-lg">{user.fullName}</p>}
        <p className="text-skin-text3 text-sm mt-1">{t('welcomeSubtitle')}</p>
      </motion.div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-w-3xl w-full"
      >
        {visibleSections.map((s) => {
          const Icon = s.icon;
          return (
            <motion.div key={s.to} variants={item}>
              <motion.button
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(s.to)}
                className="w-full bg-skin-card border border-skin-border rounded-2xl p-5 text-left shadow-sm hover:shadow-md transition-shadow group"
              >
                <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center mb-3`}>
                  <Icon size={20} className={s.color} />
                </div>
                <p className="text-sm font-semibold text-skin-text group-hover:text-skin-text leading-tight">{t(s.key)}</p>
                <ChevronRight size={14} className="text-skin-text3 mt-1 group-hover:translate-x-0.5 transition-transform" />
              </motion.button>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Social links + contact */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="mt-12 flex flex-col items-center gap-4"
      >
        <SocialLinksRow size="md" />
      </motion.div>
    </div>
  );
}
