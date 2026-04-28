import { motion } from 'framer-motion';
import { Sun, Moon, Globe, Check, ArrowLeft, Pencil, X, Save } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageTransition } from '../../components/ui/PageTransition';
import { Card } from '../../components/ui/Card';
import { useTheme } from '../../context/ThemeContext';
import { useLang } from '../../context/LanguageContext';
import { isAdmin } from '../../lib/auth';
import { SocialLinksRow } from '../../components/SocialLinks';
import { SOCIAL_LINKS as DEFAULT_LINKS } from '../../config/socialLinks';
import type { Lang } from '../../i18n/translations';

const LANGS: { code: Lang; label: string; native: string; flag: string }[] = [
  { code: 'az', label: 'AZ', native: 'Azərbaycan', flag: '🇦🇿' },
  { code: 'ru', label: 'RU', native: 'Русский', flag: '🇷🇺' },
  { code: 'en', label: 'EN', native: 'English', flag: '🇬🇧' },
];

export function SettingsPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang, t } = useLang();
  const admin = isAdmin();

  // Admin-only: editable social links (stored in localStorage for persistence)
  const STORAGE_KEY = 'garagex_social_links';
  const loadLinks = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? { ...DEFAULT_LINKS, ...JSON.parse(raw) } : { ...DEFAULT_LINKS };
    } catch { return { ...DEFAULT_LINKS }; }
  };
  const [links, setLinks] = useState(loadLinks);
  const [editing, setEditing] = useState<'instagram' | 'linkedin' | null>(null);
  const [editVal, setEditVal] = useState('');

  const startEdit = (key: 'instagram' | 'linkedin') => {
    setEditing(key);
    setEditVal(links[key]);
  };
  const saveEdit = () => {
    if (!editing) return;
    const updated = { ...links, [editing]: editVal };
    setLinks(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setEditing(null);
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
          <h1 className="text-xl font-bold text-skin-text">{t('settingsTitle')}</h1>
        </div>

        {/* Appearance */}
        <motion.div variants={item}>
          <Card>
            <h2 className="text-sm font-semibold text-skin-text mb-4">{t('appearance')}</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { mode: 'dark' as const, icon: Moon, label: t('darkMode') },
                { mode: 'light' as const, icon: Sun, label: t('lightMode') },
              ].map(({ mode, icon: Icon, label }) => (
                <motion.button
                  key={mode}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { if (theme !== mode) toggleTheme(); }}
                  className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                    theme === mode ? 'border-skin-text2 bg-skin-hover' : 'border-skin-border hover:bg-skin-hover'
                  }`}
                >
                  <Icon size={18} className={theme === mode ? 'text-skin-text' : 'text-skin-text3'} />
                  <span className={`text-sm font-medium ${theme === mode ? 'text-skin-text' : 'text-skin-text2'}`}>{label}</span>
                  {theme === mode && <Check size={14} className="ml-auto text-skin-text" />}
                </motion.button>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Language */}
        <motion.div variants={item}>
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Globe size={15} className="text-skin-text3" />
              <h2 className="text-sm font-semibold text-skin-text">{t('language')}</h2>
            </div>
            <div className="space-y-2">
              {LANGS.map((l) => (
                <motion.button
                  key={l.code}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setLang(l.code)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${
                    lang === l.code ? 'border-skin-text2 bg-skin-hover' : 'border-skin-border hover:bg-skin-hover'
                  }`}
                >
                  <span className="text-2xl">{l.flag}</span>
                  <div className="text-left">
                    <p className={`text-sm font-medium ${lang === l.code ? 'text-skin-text' : 'text-skin-text2'}`}>{l.native}</p>
                    <p className="text-xs text-skin-text3">{l.label}</p>
                  </div>
                  {lang === l.code && <Check size={14} className="ml-auto text-skin-text" />}
                </motion.button>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Social & Contact */}
        <motion.div variants={item}>
          <Card>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold text-skin-text">Əlaqə & Sosial Media</h2>
            </div>

            {/* Admin-only: editable Instagram & LinkedIn links */}
            {admin && (
              <>
                <p className="text-xs text-skin-text3 mb-3">
                  Instagram və LinkedIn linklərini redaktə etmək üçün ✎ düyməsinə basın.
                </p>
                <div className="space-y-2 mb-4">
                  {(['instagram', 'linkedin'] as const).map((key) => {
                    const label = key === 'instagram' ? 'Instagram' : 'LinkedIn';
                    const isEditing = editing === key;
                    return (
                      <div key={key} className="flex items-center gap-3 p-3 rounded-xl border border-skin-border bg-skin-bg">
                        <span className="text-xs font-medium text-skin-text2 w-20 flex-shrink-0">{label}</span>
                        {isEditing ? (
                          <>
                            <input
                              value={editVal}
                              onChange={(e) => setEditVal(e.target.value)}
                              className="flex-1 text-xs bg-skin-card border border-violet-500/40 rounded-lg px-3 py-1.5 text-skin-text outline-none"
                              autoFocus
                              onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditing(null); }}
                            />
                            <button onClick={saveEdit} className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors">
                              <Save size={13} />
                            </button>
                            <button onClick={() => setEditing(null)} className="p-1.5 rounded-lg hover:bg-skin-hover text-skin-text3 transition-colors">
                              <X size={13} />
                            </button>
                          </>
                        ) : (
                          <>
                            <a href={links[key]} target="_blank" rel="noopener noreferrer"
                              className="flex-1 text-xs text-violet-500 hover:underline truncate">
                              {links[key]}
                            </a>
                            <button onClick={() => startEdit(key)}
                              className="p-1.5 rounded-lg hover:bg-skin-hover text-skin-text3 hover:text-skin-text transition-colors flex-shrink-0">
                              <Pencil size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            <SocialLinksRow size="md" />
          </Card>
        </motion.div>
      </motion.div>
    </PageTransition>
  );
}
