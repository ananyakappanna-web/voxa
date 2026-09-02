import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../common/Avatar';
import { Logo } from '../common/Logo';

export function MobileHeader() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-[#0D0709]/90 backdrop-blur-2xl border-b border-[#D4A574]/15 sm:hidden">
      <div
        onClick={() => {
          if (user) navigate(`/profile/${user.username}`);
          else navigate('/login');
        }}
        className="cursor-pointer"
      >
        <Avatar src={user?.avatar_url} alt={user?.display_name || 'User'} size="sm" />
      </div>

      <NavLink to="/" className="flex items-center">
        <Logo size="sm" showWordmark={true} showTagline={false} />
      </NavLink>

      <NavLink to="/settings" className="p-1.5 text-[#A8888D] hover:text-[#D4A574] transition">
        <Settings className="w-5 h-5" />
      </NavLink>
    </header>
  );
}
