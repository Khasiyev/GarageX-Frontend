import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Send, Bot, User } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { aiService } from '../services/ai';
import { useLang } from '../context/LanguageContext';
import { isAuthenticated } from '../lib/auth';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export function AiFloatButton() {
  const location = useLocation();
  const { lang } = useLang();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Don't show on login/register/auth pages or AI page
  const hidden = ['/login', '/register', '/forgot-password', '/reset-password', '/ai'].some(
    (p) => location.pathname.startsWith(p)
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  if (hidden || !isAuthenticated()) return null;

  const placeholder =
    lang === 'az' ? 'Sualınızı yazın...' :
    lang === 'ru' ? 'Введите вопрос...' :
    'Ask a question...';

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const q = input.trim();
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: q };
    setMessages((p) => [...p, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const res = await aiService.ask({ question: q });
      const answer = res.data.success ? res.data.data.answer : (res.data.message || 'Xəta');
      setMessages((p) => [...p, { id: (Date.now() + 1).toString(), role: 'assistant', content: answer }]);
    } catch {
      setMessages((p) => [...p, { id: (Date.now() + 1).toString(), role: 'assistant', content: 'Xəta baş verdi.' }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="w-80 h-[440px] bg-skin-card border border-skin-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            style={{ transformOrigin: 'bottom right' }}
          >
            {/* Header */}
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-skin-border bg-gradient-to-r from-violet-500/10 to-transparent">
              <div className="w-7 h-7 bg-violet-500/15 rounded-xl flex items-center justify-center">
                <Sparkles size={13} className="text-violet-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-skin-text">GarageX AI</p>
                <p className="text-[10px] text-skin-text3">Gemini 2.5 Flash</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-skin-hover text-skin-text3 transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-4">
                  <div className="w-12 h-12 bg-violet-500/10 rounded-2xl flex items-center justify-center">
                    <Bot size={22} className="text-violet-500" />
                  </div>
                  <p className="text-xs text-skin-text3 leading-relaxed">
                    {lang === 'az' ? 'GarageX haqqında hər hansı sualınızı soruşun' :
                     lang === 'ru' ? 'Задайте любой вопрос о GarageX' :
                     'Ask any question about GarageX'}
                  </p>
                </div>
              )}
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      msg.role === 'user' ? 'bg-skin-hover' : 'bg-violet-500/15'
                    }`}>
                      {msg.role === 'user'
                        ? <User size={11} className="text-skin-text2" />
                        : <Bot size={11} className="text-violet-500" />}
                    </div>
                    <div className={`max-w-[82%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-skin-hover text-skin-text'
                        : 'bg-violet-500/8 border border-violet-500/15 text-skin-text2'
                    }`}>
                      {msg.content}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-violet-500/15">
                    <Bot size={11} className="text-violet-500" />
                  </div>
                  <div className="bg-violet-500/8 border border-violet-500/15 rounded-xl px-3 py-2.5 flex gap-1 items-center">
                    {[0,1,2].map((i) => (
                      <motion.div key={i} className="w-1 h-1 bg-violet-400 rounded-full"
                        animate={{ y: [0, -3, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.12 }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-skin-border">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder={placeholder}
                  disabled={loading}
                  className="flex-1 bg-skin-bg border border-skin-border rounded-xl px-3 py-2 text-xs text-skin-text placeholder:text-skin-text3 outline-none focus:border-violet-500/50 transition-colors min-w-0"
                  autoComplete="off"
                />
                <motion.button
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  className="w-8 h-8 bg-violet-500 hover:bg-violet-600 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
                >
                  <Send size={13} />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Float button */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.92 }}
        className="w-12 h-12 bg-violet-500 hover:bg-violet-600 text-white rounded-2xl shadow-lg flex items-center justify-center ai-float-btn transition-colors"
        title="GarageX AI"
      >
        <AnimatePresence mode="wait">
          {open
            ? <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}><X size={20} /></motion.div>
            : <motion.div key="ai" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}><Sparkles size={20} /></motion.div>
          }
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
