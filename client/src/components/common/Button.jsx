import React from 'react';
import { Loader2 } from 'lucide-react';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className = '',
  type = 'button',
  onClick,
  ...props
}) {
  const baseClasses =
    'inline-flex items-center justify-center font-bold tracking-wide rounded-full transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed select-none relative overflow-hidden';

  const variantClasses = {
    primary:
      'bg-gradient-to-r from-[#D4A574] via-[#C97B8A] to-[#8B2635] text-[#0D0709] font-extrabold shadow-[0_4px_20px_rgba(212,165,116,0.3)] hover:shadow-[0_4px_28px_rgba(201,123,138,0.45)] hover:brightness-105 border border-white/20',
    secondary:
      'bg-[#F5EDE8] text-[#1A0E12] hover:bg-[#E8B4B8] hover:text-[#0D0709] shadow-sm font-bold',
    outline:
      'border border-[#D4A574]/30 text-[#F5EDE8] hover:bg-[#D4A574]/10 hover:border-[#D4A574]/70 hover:text-[#D4A574]',
    gold:
      'bg-gradient-to-r from-[#F5EDE8] via-[#D4A574] to-[#C97B8A] text-[#0D0709] font-bold shadow-[0_4px_20px_rgba(212,165,116,0.35)] hover:brightness-105',
    danger:
      'bg-[#5C1A2B]/40 text-[#E8B4B8] border border-[#8B2635]/60 hover:bg-[#8B2635]/50 hover:text-white',
    ghost:
      'text-[#A8888D] hover:text-[#F5EDE8] hover:bg-[#D4A574]/10'
  };

  const sizeClasses = {
    sm: 'px-4 py-1.5 text-xs font-semibold tracking-wider uppercase',
    md: 'px-5 py-2 text-sm',
    lg: 'px-6 py-3 text-base w-full'
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${baseClasses} ${variantClasses[variant] || variantClasses.primary} ${
        sizeClasses[size] || sizeClasses.md
      } ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-current" />
          <span>{children}</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}
