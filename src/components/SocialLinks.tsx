import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone } from 'lucide-react';
import { SOCIAL_LINKS as DEFAULT_LINKS } from '../config/socialLinks';

const STORAGE_KEY = 'garagex_social_links';

function getLinks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_LINKS, ...JSON.parse(raw) } : { ...DEFAULT_LINKS };
  } catch { return { ...DEFAULT_LINKS }; }
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  );
}

function PhonePopup({ onClose }: { onClose: () => void }) {
  const SOCIAL_LINKS = getLinks();
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 8 }}
        transition={{ duration: 0.15 }}
        className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 bg-skin-card border border-skin-border rounded-2xl shadow-xl overflow-hidden w-48"
      >
        <a
          href={`tel:${SOCIAL_LINKS.phone}`}
          className="flex items-center gap-3 px-4 py-3 hover:bg-skin-hover transition-colors text-skin-text"
          onClick={onClose}
        >
          <div className="w-8 h-8 bg-emerald-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <Phone size={16} className="text-emerald-500" />
          </div>
          <div>
            <p className="text-xs font-semibold">Zəng et</p>
            <p className="text-[10px] text-skin-text3">{SOCIAL_LINKS.phoneDisplay}</p>
          </div>
        </a>
        <div className="border-t border-skin-border" />
        <a
          href={SOCIAL_LINKS.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-4 py-3 hover:bg-skin-hover transition-colors text-skin-text"
          onClick={onClose}
        >
          <div className="w-8 h-8 bg-green-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <WhatsAppIcon />
          </div>
          <div>
            <p className="text-xs font-semibold">WhatsApp</p>
            <p className="text-[10px] text-skin-text3">{SOCIAL_LINKS.phoneDisplay}</p>
          </div>
        </a>
      </motion.div>
    </>
  );
}

interface Props {
  size?: 'sm' | 'md';
}

export function SocialLinksRow({ size = 'md' }: Props) {
  const [phoneOpen, setPhoneOpen] = useState(false);
  const SOCIAL_LINKS = getLinks();
  const iconSize = size === 'sm' ? 'w-9 h-9' : 'w-10 h-10';

  const socials = [
    { icon: InstagramIcon, label: 'Instagram', url: SOCIAL_LINKS.instagram, color: 'hover:text-pink-500 hover:border-pink-500/30 hover:bg-pink-500/5' },
    { icon: LinkedInIcon, label: 'LinkedIn', url: SOCIAL_LINKS.linkedin, color: 'hover:text-blue-500 hover:border-blue-500/30 hover:bg-blue-500/5' },
    { icon: GitHubIcon, label: 'GitHub', url: SOCIAL_LINKS.github, color: 'hover:text-skin-text hover:border-skin-text/30 hover:bg-skin-hover' },
  ];

  return (
    <div className="flex items-center gap-3">
      {socials.map((s) => {
        const Icon = s.icon;
        return (
          <motion.a
            key={s.label}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.1, y: -2 }}
            whileTap={{ scale: 0.95 }}
            title={s.label}
            className={`flex items-center justify-center ${iconSize} rounded-xl border border-skin-border bg-skin-card text-skin-text3 transition-all duration-200 ${s.color}`}
          >
            <Icon />
          </motion.a>
        );
      })}

      {/* Phone button with popup */}
      <div className="relative">
        <motion.button
          onClick={() => setPhoneOpen((v) => !v)}
          whileHover={{ scale: 1.1, y: -2 }}
          whileTap={{ scale: 0.95 }}
          title="Telefon"
          className={`flex items-center justify-center ${iconSize} rounded-xl border border-skin-border bg-skin-card text-skin-text3 transition-all duration-200 hover:text-emerald-500 hover:border-emerald-500/30 hover:bg-emerald-500/5`}
        >
          <div className="flex items-center gap-0.5">
            <Phone size={size === 'sm' ? 14 : 16} />
          </div>
        </motion.button>
        <AnimatePresence>
          {phoneOpen && <PhonePopup onClose={() => setPhoneOpen(false)} />}
        </AnimatePresence>
      </div>
    </div>
  );
}
