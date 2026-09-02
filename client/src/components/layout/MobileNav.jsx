import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Search, Bell, Mail, Feather } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function MobileNav({ onOpenCompose }) {
  const { user } = useAuth();
  const location = useLocation();

  const navItems = [
    { icon: Home, path: '/' },
    { icon: Search, path: '/explore' },
    {
      icon: Bell,
      path: '/notifications',
      badge: user?.unreadNotifications > 0 ? user.unreadNotifications : null
    },
    {
      icon: Mail,
      path: '/messages',
      badge: user?.unreadMessages > 0 ? user.unreadMessages : null
    }
  ];

  return (
    <>
      {/* Floating Metallic Rose-Gold Compose Action Button (FAB) */}
      {user && (
        <button
          onClick={onOpenCompose}
          className="fixed bottom-16 right-4 z-40 sm:hidden w-14 h-14 rounded-full btn-metallic shadow-[0_4px_25px_rgba(201,123,138,0.5)] flex items-center justify-center active:scale-95 transition"
        >
          <Feather className="w-6 h-6 text-[#0D0709]" />
        </button>
      )}

      {/* Luxury Bottom Nav Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around py-2.5 bg-[#0D0709]/95 backdrop-blur-2xl border-t border-[#D4A574]/15 sm:hidden">
        {navItems.map((item, idx) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <NavLink
              key={idx}
              to={item.path}
              className={`relative p-2 transition ${
                isActive ? 'text-[#D4A574]' : 'text-[#A8888D]'
              }`}
            >
              <Icon strokeWidth={1.75} className="w-6 h-6" />
              {item.badge && (
                <span className="absolute top-1 right-1 bg-gradient-to-r from-[#D4A574] to-[#C97B8A] text-[#0D0709] text-[9px] font-black rounded-full h-4 min-w-4 px-1 flex items-center justify-center border border-[#0D0709] shadow-[0_0_10px_rgba(212,165,116,0.6)]">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>
    </>
  );
}
