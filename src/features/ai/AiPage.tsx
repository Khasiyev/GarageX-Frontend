import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Sparkles, RefreshCw, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageTransition } from '../../components/ui/PageTransition';
import { Button } from '../../components/ui/Button';
import { aiService } from '../../services/ai';
import { useLang } from '../../context/LanguageContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const SUGGESTED_QUESTIONS: Record<string, string[]> = {
  az: [
    'Müştəri necə əlavə edilir?',
    'İş sifarişinin statusunu necə dəyişmək olar?',
    'Anbar idarəetməsi necə işləyir?',
    'Faktura necə yaradılır?',
  ],
  ru: [
    'Как добавить клиента?',
    'Как изменить статус заказа?',
    'Как работает управление складом?',
    'Как создать счёт?',
  ],
  en: [
    'How to add a customer?',
    'How to change job order status?',
    'How does inventory management work?',
    'How to create an invoice?',
  ],
};

export function AiPage() {
  const navigate = useNavigate();
  const { t, lang } = useLang();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  const sendMessage = async (question: string) => {
    if (!question.trim() || loading) return;
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: question.trim(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const res = await aiService.ask({ question: question.trim() });
      const answer = res.data.success ? res.data.data.answer : (res.data.message || t('error'));
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: answer,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: t('error'),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const suggested = SUGGESTED_QUESTIONS[lang] || SUGGESTED_QUESTIONS['az'];

  return (
    <PageTransition>
      <div className="flex flex-col h-[calc(100vh-7rem)]">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" onClick={() => navigate(-1)} className="text-xs px-3 py-1.5 flex items-center gap-1">
            <ArrowLeft size={16} />{t('back')}
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-violet-500/10 rounded-xl flex items-center justify-center">
              <Sparkles size={16} className="text-violet-500" />
            </div>
            <div>
              <h1 className="text-base font-bold text-skin-text">GarageX AI</h1>
              <p className="text-xs text-skin-text3">Gemini 2.5 Flash</p>
            </div>
          </div>
          {messages.length > 0 && (
            <Button
              variant="ghost"
              onClick={() => setMessages([])}
              className="ml-auto text-xs px-3 py-1.5 flex items-center gap-1"
            >
              <RefreshCw size={14} />
              {lang === 'az' ? 'Sıfırla' : lang === 'ru' ? 'Сброс' : 'Clear'}
            </Button>
          )}
        </div>

        {/* Chat area */}
        <div className="flex-1 overflow-y-auto rounded-2xl border border-skin-border bg-skin-card p-4 space-y-4 mb-4">
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-full gap-6 py-10"
            >
              <div className="w-16 h-16 bg-violet-500/10 rounded-2xl flex items-center justify-center">
                <Bot size={32} className="text-violet-500" />
              </div>
              <div className="text-center">
                <h2 className="text-lg font-semibold text-skin-text mb-1">GarageX AI</h2>
                <p className="text-sm text-skin-text3 max-w-xs">
                  {lang === 'az' ? 'GarageX haqqında hər hansı sualınızı soruşun' :
                   lang === 'ru' ? 'Задайте любой вопрос о GarageX' :
                   'Ask any question about GarageX'}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                {suggested.map((q) => (
                  <motion.button
                    key={q}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => sendMessage(q)}
                    className="text-left text-xs text-skin-text2 bg-skin-bg border border-skin-border rounded-xl px-4 py-3 hover:bg-skin-hover hover:border-violet-500/30 transition-all"
                  >
                    {q}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  msg.role === 'user' ? 'bg-skin-hover border border-skin-border' : 'bg-violet-500/10'
                }`}>
                  {msg.role === 'user'
                    ? <User size={15} className="text-skin-text2" />
                    : <Bot size={15} className="text-violet-500" />
                  }
                </div>
                <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-skin-hover border border-skin-border text-skin-text text-sm'
                    : 'bg-violet-500/5 border border-violet-500/15 text-skin-text2 text-sm'
                }`}>
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  <p className="text-[10px] text-skin-text3 mt-1.5">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-violet-500/10">
                <Bot size={15} className="text-violet-500" />
              </div>
              <div className="bg-violet-500/5 border border-violet-500/15 rounded-2xl px-4 py-3 flex items-center gap-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 bg-violet-400 rounded-full"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={lang === 'az' ? 'Sualınızı yazın...' : lang === 'ru' ? 'Введите вопрос...' : 'Type your question...'}
            className="flex-1 bg-skin-card border border-skin-border rounded-xl px-4 py-3 text-sm text-skin-text placeholder:text-skin-text3 outline-none focus:border-violet-500/50 transition-colors"
            disabled={loading}
            autoComplete="off"
          />
          <motion.button
            type="submit"
            disabled={loading || !input.trim()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-12 h-12 bg-violet-500 hover:bg-violet-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
          >
            <Send size={18} />
          </motion.button>
        </form>
      </div>
    </PageTransition>
  );
}
