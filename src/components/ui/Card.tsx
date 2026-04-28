import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ children, className = '', hover = false, onClick }: CardProps) {
  const baseClass =
    'bg-skin-card border border-skin-border rounded-2xl shadow-sm p-6 transition-all duration-200';

  if (hover) {
    return (
      <motion.div
        whileHover={{ scale: 1.012, y: -3 }}
        whileTap={onClick ? { scale: 0.985 } : undefined}
        transition={{ duration: 0.18 }}
        onClick={onClick}
        className={`${baseClass} hover:shadow-lg hover:border-skin-text3/30 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`${baseClass} ${onClick ? 'cursor-pointer hover:shadow-md' : ''} ${className}`}
    >
      {children}
    </div>
  );
}