import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Hash,
  Bell,
  Mail,
  Bookmark,
  User,
  Settings,
  Feather,
  LogOut,
  MoreHorizontal,
  BadgeCheck,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Avatar } from '../common/Avatar';
import { Logo } from '../common/Logo';

export function Sidebar({ onOpenCompose }) {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [showAccountMenu, setShowAccountMenu] = useState(false);

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Hash, label: 'Explore', path: '/explore' },
    {
      icon: Bell,
      label: 'Notifications',
      path: '/notifications',
      badge: user?.unreadNotifications > 0 ? user.unreadNotifications : null
    },
    {
      icon: Mail,
      label: 'Messages',
      path: '/messages',
      badge: user?.unreadMessages > 0 ? user.unreadMessages : null
    },
    { icon: Bookmark, label: 'Bookmarks', path: '/bookmarks' },
    {
      icon: User,
      label: 'Profile',
      path: user ? `/profile/${user.username}` : '/login'
    },
    { icon: Settings, label: 'Settings', path: '/settings' }
  ];

  return (
    <aside className="sticky top-0 h-screen flex flex-col justify-between py-4 px-2 sm:px-4 md:px-5 w-16 sm:w-20 xl:w-64 border-r border-[#D4A574]/15 shrink-0 z-30 select-none bg-[#0D0709]/80 backdrop-blur-2xl">
      {/* Top Section: Luxury Logo & Navigation Links */}
      <div className="flex flex-col items-center xl:items-start space-y-2 w-full">
        {/* Brand Logo */}
        <NavLink
          to="/"
          className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-[#D4A574]/10 transition-all duration-200 group mb-3 w-full"
        >
          <Logo size="md" showWordmark={true} showTagline={true} className="hidden xl:flex" />
          <Logo size="md" showWordmark={false} showTagline={false} className="xl:hidden" />
        </NavLink>

        {/* Navigation Items */}
        <nav className="flex flex-col space-y-1 w-full">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path));

            return (
              <NavLink
                key={item.label}
                to={item.path}
                className={`flex items-center justify-center xl:justify-start gap-4 p-3 rounded-2xl transition-all duration-200 relative group ${
                  isActive
                    ? 'font-bold text-[#F5EDE8] bg-gradient-to-r from-[#D4A574]/15 via-[#C97B8A]/10 to-transparent border-l-2 border-[#D4A574]'
                    : 'text-[#A8888D] hover:text-[#F5EDE8] hover:bg-white/[0.04]'
                }`}
              >
                <div className="relative flex items-center justify-center">
                  <Icon
                    strokeWidth={1.6}
                    className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${
                      isActive ? 'text-[#D4A574]' : 'text-inherit'
                    }`}
                  />
                  {item.badge && (
                    <span className="absolute -top-1.5 -right-2 bg-gradient-to-r from-[#D4A574] to-[#C97B8A] text-[#0D0709] text-[10px] font-extrabold rounded-full h-4 min-w-4 px-1 flex items-center justify-center border border-[#0D0709] shadow-[0_0_10px_rgba(212,165,116,0.6)]">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </div>
                <span
                  className={`hidden xl:inline text-sm tracking-wider uppercase font-medium ${
                    isActive ? 'text-[#F5EDE8] font-bold' : 'text-[#A8888D]'
                  }`}
                >
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </nav>

        {/* Big Metallic Rose-Gold Compose Button ("Vox") */}
        {user && (
          <div className="w-full pt-3">
            <button
              onClick={onOpenCompose}
              className="w-11 h-11 xl:w-full xl:h-12 rounded-full btn-metallic flex items-center justify-center text-[#0D0709] font-bold uppercase tracking-wider text-xs xl:text-sm active:scale-95 transition-all"
            >
              <Feather className="w-5 h-5 xl:hidden" />
              <span className="hidden xl:inline font-extrabold tracking-widest">Compose Vox</span>
            </button>
          </div>
        )}
      </div>

      {/* Bottom Section: Luxury User Account Menu */}
      <div className="relative w-full">
        {user ? (
          <>
            <button
              onClick={() => setShowAccountMenu(!showAccountMenu)}
              className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-white/[0.05] border border-transparent hover:border-[#D4A574]/20 transition-all duration-200 w-full group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Avatar src={user.avatar_url} alt={user.display_name} size="sm" />
                <div className="hidden xl:flex flex-col text-left min-w-0 leading-tight">
                  <span className="font-serif font-bold text-sm text-[#F5EDE8] truncate flex items-center gap-1">
                    {user.display_name}
                    {user.is_verified ? (
                      <BadgeCheck className="w-3.5 h-3.5 text-[#D4A574] fill-[#D4A574] shrink-0 inline-block" />
                    ) : null}
                  </span>
                  <span className="text-xs text-[#A8888D] truncate">@{user.username}</span>
                </div>
              </div>
              <MoreHorizontal className="hidden xl:block w-4 h-4 text-[#A8888D] group-hover:text-[#F5EDE8] shrink-0" />
            </button>

            {/* Popup Account Dropdown */}
            {showAccountMenu && (
              <div className="absolute bottom-16 left-0 w-64 bg-[#14080C]/95 border border-[#D4A574]/30 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.9)] p-2 z-40 backdrop-blur-2xl">
                <div className="px-3 py-2.5 border-b border-[#D4A574]/15">
                  <p className="text-[10px] tracking-wider uppercase text-[#A8888D]">Signed in as</p>
                  <p className="text-sm font-serif font-bold text-[#F5EDE8] truncate">@{user.username}</p>
                </div>

                {/* Theme Toggle Quick Option */}
                <div className="px-3 py-2 border-b border-[#D4A574]/15 flex items-center justify-between text-xs text-[#A8888D]">
                  <span className="tracking-wide">Theme: <span className="capitalize text-[#D4A574] font-medium">{theme}</span></span>
                  <button
                    onClick={() => setTheme(theme === 'dark' ? 'dim' : theme === 'dim' ? 'light' : 'dark')}
                    className="p-1 rounded-lg hover:bg-white/10 text-[#D4A574] transition"
                  >
                    {theme === 'light' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </button>
                </div>

                <NavLink
                  to={`/profile/${user.username}`}
                  onClick={() => setShowAccountMenu(false)}
                  className="w-full text-left px-3 py-2 text-xs uppercase tracking-wider text-[#F5EDE8] hover:bg-[#D4A574]/10 rounded-xl flex items-center gap-2.5 transition"
                >
                  <User className="w-4 h-4 text-[#D4A574]" />
                  <span>View profile</span>
                </NavLink>

                <NavLink
                  to="/settings"
                  onClick={() => setShowAccountMenu(false)}
                  className="w-full text-left px-3 py-2 text-xs uppercase tracking-wider text-[#F5EDE8] hover:bg-[#D4A574]/10 rounded-xl flex items-center gap-2.5 transition"
                >
                  <Settings className="w-4 h-4 text-[#D4A574]" />
                  <span>Settings & Appearance</span>
                </NavLink>

                <button
                  onClick={() => {
                    setShowAccountMenu(false);
                    logout();
                    navigate('/login');
                  }}
                  className="w-full text-left px-3 py-2 text-xs uppercase tracking-wider text-[#E8B4B8] hover:bg-[#5C1A2B]/40 rounded-xl flex items-center gap-2.5 transition"
                >
                  <LogOut className="w-4 h-4 text-[#C97B8A]" />
                  <span>Log out @{user.username}</span>
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="w-full space-y-2">
            <button
              onClick={() => navigate('/login')}
              className="w-full py-2.5 rounded-full btn-metallic text-xs uppercase tracking-widest font-extrabold"
            >
              Sign In
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
