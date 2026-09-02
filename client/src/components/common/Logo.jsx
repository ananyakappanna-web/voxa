import React from 'react';

export function Logo({
  size = 'md',
  showWordmark = true,
  showTagline = true,
  className = ''
}) {
  const sizeMap = {
    sm: { icon: 'w-7 h-7 text-base', title: 'text-lg', tag: 'text-[7px]' },
    md: { icon: 'w-9 h-9 text-xl', title: 'text-2xl', tag: 'text-[9px]' },
    lg: { icon: 'w-12 h-12 text-2xl', title: 'text-3xl', tag: 'text-[10px]' },
    xl: { icon: 'w-16 h-16 text-4xl', title: 'text-4xl sm:text-5xl', tag: 'text-xs' }
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  return (
    <div className={`flex items-center gap-3 select-none group ${className}`}>
      {/* Metallic Rose-Gold Gradient "V" Icon with Radial Glow */}
      <div className="relative shrink-0 flex items-center justify-center">
        {/* Soft Radial Glow behind logo */}
        <div className="absolute -inset-1.5 rounded-2xl bg-gradient-to-tr from-[#5C1A2B] via-[#C97B8A] to-[#D4A574] opacity-50 blur-md group-hover:opacity-75 transition-opacity duration-300" />
        
        {/* Glossy / Embossed Metallic Logo Mark */}
        <div
          className={`${currentSize.icon} relative rounded-xl bg-gradient-to-br from-[#E8B4B8] via-[#D4A574] via-[#C97B8A] to-[#8B2635] p-[1.5px] shadow-[0_4px_20px_rgba(212,165,116,0.35)] transition-transform duration-200 group-hover:scale-105`}
        >
          <div className="w-full h-full rounded-[10px] bg-[#14080C] flex items-center justify-center overflow-hidden relative">
            {/* Subtle Metallic Highlight Sheen */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/25 via-transparent to-transparent opacity-60" />
            
            {/* Embossed Vector V */}
            <svg
              className="w-3/5 h-3/5 relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="vGoldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#F5EDE8" />
                  <stop offset="35%" stopColor="#E8B4B8" />
                  <stop offset="70%" stopColor="#D4A574" />
                  <stop offset="100%" stopColor="#C97B8A" />
                </linearGradient>
              </defs>
              <path
                d="M3 4.5L10.5 20.5C11 21.5 13 21.5 13.5 20.5L21 4.5H16.8L12 15.2L7.2 4.5H3Z"
                fill="url(#vGoldGradient)"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Wordmark & Tagline */}
      {showWordmark && (
        <div className="flex flex-col text-left leading-tight min-w-0">
          <span
            className={`font-serif tracking-[0.18em] font-black uppercase bg-gradient-to-r from-[#F5EDE8] via-[#E8B4B8] to-[#D4A574] bg-clip-text text-transparent drop-shadow-sm ${currentSize.title}`}
          >
            VOXA
          </span>
          {showTagline && (
            <span
              className={`font-sans tracking-[0.26em] uppercase font-medium text-[#D4A574]/80 mt-0.5 ${currentSize.tag}`}
            >
              Premium Communication
            </span>
          )}
        </div>
      )}
    </div>
  );
}
