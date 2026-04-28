import { TextareaHTMLAttributes, forwardRef } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && <label className="text-xs font-medium text-skin-text2">{label}</label>}
        <textarea
          ref={ref}
          rows={3}
          className={`bg-skin-input border border-skin-border rounded-xl px-4 py-2.5 text-skin-text text-sm placeholder-skin-text3 focus:border-skin-text3 focus:ring-1 focus:ring-skin-text3 outline-none transition-all duration-200 resize-none ${error ? 'border-red-500/50' : ''} ${className}`}
          {...props}
        />
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';
