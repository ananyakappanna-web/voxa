import React, { useState } from 'react';

export function Avatar({ src, alt = 'Avatar', size = 'md', className = '', isVerified = false }) {
  const [hasError, setHasError] = useState(false);

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-20 h-20 text-xl',
    '2xl': 'w-28 h-28 sm:w-32 sm:h-32 text-3xl'
  };

  const initial = alt ? alt.charAt(0).toUpperCase() : 'V';

  return (
    <div className={`relative inline-block shrink-0 group/avatar ${className}`}>
      {src && !hasError ? (
        <div className="relative rounded-full p-[1.5px] bg-gradient-to-tr from-[#8B2635]/60 via-[#D4A574]/40 to-[#E8B4B8]/70 group-hover/avatar:from-[#D4A574] group-hover/avatar:to-[#E8B4B8] transition-all duration-300">
          <img
            src={src}
            alt={alt}
            onError={() => setHasError(true)}
            className={`${sizeClasses[size] || sizeClasses.md} rounded-full object-cover bg-[#160B0F] transition-opacity duration-200 group-hover/avatar:opacity-95`}
          />
        </div>
      ) : (
        <div className="relative rounded-full p-[1.5px] bg-gradient-to-tr from-[#8B2635] via-[#D4A574] to-[#E8B4B8]">
          <div
            className={`${sizeClasses[size] || sizeClasses.md} rounded-full bg-gradient-to-br from-[#1A0E12] to-[#2B0A12] text-[#F5EDE8] font-serif font-bold flex items-center justify-center border border-[#D4A574]/20 select-none shadow-inner`}
          >
            {initial}
          </div>
        </div>
      )}
    </div>
  );
}
