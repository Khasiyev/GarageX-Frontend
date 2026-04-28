import { InputHTMLAttributes, forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', type, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    const isPassword = type === 'password';

    return (
      <div className="flex flex-col gap-1.5 relative">
        {label && (
          <label className="text-xs font-medium text-skin-text2">
            {label}
          </label>
        )}

        <div className="relative">
          <input
            ref={ref}
            type={isPassword ? (showPassword ? 'text' : 'password') : type}
            className={`w-full bg-skin-input border border-skin-border rounded-xl px-4 py-2.5 pr-10 text-skin-text text-sm placeholder-skin-text3 focus:border-skin-text3 focus:ring-1 focus:ring-skin-text3 outline-none transition-all duration-200 ${
              error ? 'border-red-500/50' : ''
            } ${className}`}
            {...props}
          />

          {/* 👁️ Eye icon only for password */}
          {isPassword && (
            <button
              type="button"
              onMouseDown={() => setShowPassword(true)}
              onMouseUp={() => setShowPassword(false)}
              onMouseLeave={() => setShowPassword(false)}
              onTouchStart={() => setShowPassword(true)}
              onTouchEnd={() => setShowPassword(false)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-skin-text3 hover:text-skin-text transition"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
        </div>

        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';