import { ButtonHTMLAttributes, ReactNode } from 'react';
import { motion } from 'framer-motion';

type ButtonVariant = 'primary' | 'danger' | 'success' | 'warning' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
  loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-skin-card hover:bg-skin-hover active:bg-skin-border text-skin-text border border-skin-border',
  danger:
    'bg-red-500/10 hover:bg-red-500/20 active:bg-red-500/25 text-red-500 border border-red-500/20',
  success:
    'bg-emerald-500/10 hover:bg-emerald-500/20 active:bg-emerald-500/25 text-emerald-500 border border-emerald-500/20',
  warning:
    'bg-amber-500/10 hover:bg-amber-500/20 active:bg-amber-500/25 text-amber-500 border border-amber-500/20',
  ghost:
    'bg-transparent hover:bg-skin-hover active:bg-skin-border text-skin-text2 border border-transparent',
};

export function Button({
  variant = 'primary',
  children,
  loading,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileHover={!disabled && !loading ? { y: -1, scale: 1.01 } : undefined}
      whileTap={!disabled && !loading ? { scale: 0.985 } : undefined}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm shadow-sm hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_8px_20px_rgba(0,0,0,0.35)] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-sm ${variantClasses[variant]} ${className}`}
      disabled={disabled || loading}
      {...(props as Record<string, unknown>)}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          Yüklənir...
        </span>
      ) : (
        children
      )}
    </motion.button>
  );
}