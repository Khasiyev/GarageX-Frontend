import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, Car, ClipboardList, Package,
  FileText, CreditCard, LogOut, User, Settings,
  Sun, Moon, ChevronDown, Globe, Sparkles,
} from 'lucide-react';
import { getUser, getRefreshToken, clearAuth, isAdmin } from '../lib/auth';
import { authService } from '../services/auth';
import { useTheme } from '../context/ThemeContext';
import { useLang } from '../context/LanguageContext';
import type { Lang } from '../i18n/translations';

const LANGS: { code: Lang; label: string; flag: string }[] = [
  { code: 'az', label: 'AZ', flag: '🇦🇿' },
  { code: 'ru', label: 'RU', flag: '🇷🇺' },
  { code: 'en', label: 'EN', flag: '🇬🇧' },
];

interface NavItem {
  to: string;
  labelKey: string;
  icon: React.ElementType;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', labelKey: 'dashboard', icon: LayoutDashboard },
  { to: '/customers', labelKey: 'customers', icon: Users },
  { to: '/vehicles', labelKey: 'vehicles', icon: Car },
  { to: '/job-orders', labelKey: 'jobOrders', icon: ClipboardList },
  { to: '/inventory', labelKey: 'inventory', icon: Package, adminOnly: true },
  { to: '/invoices', labelKey: 'invoices', icon: FileText },
  { to: '/payments', labelKey: 'payments', icon: CreditCard },
  { to: '/ai', labelKey: 'aiAssistant', icon: Sparkles },
];

export function DashboardLayout() {
  const navigate = useNavigate();
  const user = getUser();
  const admin = isAdmin();
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang, t } = useLang();
  const [loggingOut, setLoggingOut] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  const visibleNavItems = NAV_ITEMS.filter((item) => !item.adminOnly || admin);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const refreshToken = getRefreshToken();
      if (refreshToken) await authService.logout({ refreshToken });
    } catch {}
    finally {
      clearAuth();
      navigate('/login');
    }
  };

  const currentLang = LANGS.find((l) => l.code === lang)!;

  const navClass = (isActive: boolean) =>
    `group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 overflow-hidden ${
      isActive
        ? 'bg-skin-hover text-skin-text shadow-sm'
        : 'text-skin-text3 hover:text-skin-text hover:bg-skin-hover/70'
    }`;

  return (
    <div className="min-h-screen bg-skin-bg flex">
      
      {/* SIDEBAR */}
      <aside className="fixed left-0 top-0 h-full w-60 bg-skin-sidebar border-r border-skin-border z-40 flex flex-col">

        {/* LOGO */}
        <div className="px-5 py-5 border-b border-skin-border">
          <button
            onClick={() => navigate('/welcome')}
            className="group flex items-center gap-3 w-full"
          >
            <div className="w-9 h-9 rounded-xl overflow-hidden border border-skin-border shadow-sm group-hover:scale-105 transition">
              {/* ✅ BURANI DƏYİŞMƏDİK */}
              <img src="/logo.jpeg" alt="GarageX" className="w-full h-full object-cover" />
            </div>

            <div className="text-left">
              <span className="text-base font-extrabold text-skin-text block">
                GarageX
              </span>

              <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
                admin ? 'bg-violet-500/15 text-violet-500' : 'bg-emerald-500/15 text-emerald-500'
              }`}>
                {admin ? 'Admin' : 'User'}
              </span>
            </div>
          </button>
        </div>

        {/* NAV */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {visibleNavItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => navClass(isActive)}>
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="activeSidebarIndicator"
                      className="absolute left-0 top-2 bottom-2 w-1 bg-skin-text rounded-r-full"
                    />
                  )}

                  <item.icon size={17} className="group-hover:translate-x-0.5 transition" />
                  <span className="group-hover:translate-x-0.5 transition">
                    {t(item.labelKey as any)}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* BOTTOM */}
        <div className="px-3 py-3 border-t border-skin-border space-y-1">

          <NavLink to="/profile" className={({ isActive }) => navClass(isActive)}>
            <User size={17} /> {t('profile')}
          </NavLink>

          <NavLink to="/settings" className={({ isActive }) => navClass(isActive)}>
            <Settings size={17} /> {t('settings')}
          </NavLink>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold text-skin-text3 hover:text-red-500 hover:bg-red-500/5 transition"
          >
            <LogOut size={17} />
            {loggingOut ? t('loggingOut') : t('logout')}
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="ml-60 flex-1 flex flex-col">

        {/* TOPBAR */}
        <header className="sticky top-0 z-30 bg-skin-sidebar/95 backdrop-blur border-b border-skin-border px-6 py-3 flex justify-between">

          <p className="text-sm font-semibold text-skin-text2">
            {user?.fullName}
          </p>

          <div className="flex gap-2">

            {/* LANG */}
            <div className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="px-3 py-2 rounded-xl border border-skin-border text-sm"
              >
                {currentLang.flag} {currentLang.label}
              </button>

              <AnimatePresence>
                {langOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute right-0 mt-2 bg-skin-card border border-skin-border rounded-xl shadow-xl"
                  >
                    {LANGS.map(l => (
                      <button
                        key={l.code}
                        onClick={() => {
                          setLang(l.code);
                          setLangOpen(false);
                        }}
                        className="block px-4 py-2 text-sm w-full text-left hover:bg-skin-hover"
                      >
                        {l.flag} {l.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* THEME */}
            <button onClick={toggleTheme} className="p-2 border rounded-xl">
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>

          </div>
        </header>

        {/* CONTENT */}
        <main className="flex-1 p-6">
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Outlet />
          </motion.div>
        </main>

      </div>

      {langOpen && (
        <div className="fixed inset-0 z-20" onClick={() => setLangOpen(false)} />
      )}
    </div>
  );
}