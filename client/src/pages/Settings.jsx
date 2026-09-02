import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Palette,
  Users,
  Shield,
  CheckCircle2,
  BadgeCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { api } from '../api/client';
import { Avatar } from '../components/common/Avatar';
import { Button } from '../components/common/Button';

export function Settings() {
  const { user, logout, quickLoginAs } = useAuth();
  const { theme, setTheme } = useTheme();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [demoUsers, setDemoUsers] = useState([]);
  const [isSwitching, setIsSwitching] = useState(false);

  useEffect(() => {
    async function loadDemoUsers() {
      try {
        const res = await api.auth.getDemoUsers();
        setDemoUsers(res.demoUsers || []);
      } catch (err) {
        console.error('Failed to load demo accounts:', err);
      }
    }
    loadDemoUsers();
  }, []);

  const handleSwitchAccount = async (demoUser) => {
    setIsSwitching(true);
    try {
      await quickLoginAs(demoUser);
      showToast({
        title: 'Switched Persona',
        message: `Now active as @${demoUser.username}`,
        type: 'info',
        avatar: demoUser.avatar_url
      });
      navigate('/');
    } catch (err) {
      showToast({ title: 'Error', message: 'Failed to switch persona', type: 'danger' });
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <div className="w-full min-h-screen">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 glass-header px-5 py-3">
        <h1 className="font-serif font-bold text-base text-[#F5EDE8] tracking-wide">Settings</h1>
        <p className="text-[11px] text-[#A8888D]">Aesthetics, Personas & System</p>
      </div>

      <div className="p-5 sm:p-6 space-y-8 max-w-xl">
        {/* Appearance / Theme Selector */}
        <div className="space-y-3.5">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-[#D4A574]" />
            <h2 className="font-serif text-base font-bold text-[#F5EDE8]">Appearance & Atmosphere</h2>
          </div>
          <p className="text-xs text-[#A8888D] leading-relaxed">
            Select your preferred visual atmosphere. Dark mode is default with deep charcoal-black and radial burgundy warmth.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {/* Noir Luxury */}
            <div
              onClick={() => setTheme('dark')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between h-28 bg-[#0D0709] text-[#F5EDE8] ${
                theme === 'dark'
                  ? 'border-[#D4A574] ring-2 ring-[#D4A574]/25 shadow-[0_0_20px_rgba(212,165,116,0.2)]'
                  : 'border-[#D4A574]/15 hover:border-[#D4A574]/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-serif font-bold text-sm">Noir</span>
                {theme === 'dark' && <CheckCircle2 className="w-4 h-4 text-[#D4A574]" />}
              </div>
              <span className="text-[10px] uppercase tracking-wider text-[#D4A574]/80">Charcoal & Rose</span>
            </div>

            {/* Velvet Dim */}
            <div
              onClick={() => setTheme('dim')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between h-28 bg-[#140A0E] text-[#F5EDE8] ${
                theme === 'dim'
                  ? 'border-[#D4A574] ring-2 ring-[#D4A574]/25 shadow-[0_0_20px_rgba(212,165,116,0.2)]'
                  : 'border-[#D4A574]/15 hover:border-[#D4A574]/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-serif font-bold text-sm">Velvet</span>
                {theme === 'dim' && <CheckCircle2 className="w-4 h-4 text-[#D4A574]" />}
              </div>
              <span className="text-[10px] uppercase tracking-wider text-[#A8888D]">Midnight Maroon</span>
            </div>

            {/* Ivory Light */}
            <div
              onClick={() => setTheme('light')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between h-28 bg-[#FBF7F5] text-[#1A0E12] ${
                theme === 'light'
                  ? 'border-[#8B2635] ring-2 ring-[#8B2635]/25 shadow-sm'
                  : 'border-[#8B2635]/15 hover:border-[#8B2635]/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-serif font-bold text-sm text-[#1A0E12]">Ivory</span>
                {theme === 'light' && <CheckCircle2 className="w-4 h-4 text-[#8B2635]" />}
              </div>
              <span className="text-[10px] uppercase tracking-wider text-[#6E5559]">Warm Linen</span>
            </div>
          </div>
        </div>

        {/* Demo Switcher Box */}
        <div className="space-y-3.5 pt-4 border-t border-[#D4A574]/15">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#D4A574]" />
            <h2 className="font-serif text-base font-bold text-[#F5EDE8]">1-Click Demo Personas</h2>
          </div>
          <p className="text-xs text-[#A8888D] leading-relaxed">
            Switch instantly between verified sample accounts to test multi-user interactions, mentions, feeds, and real-time private dialogues.
          </p>

          <div className="divide-y divide-[#D4A574]/10 border border-[#D4A574]/15 rounded-3xl overflow-hidden bg-[#160B0F]/80 backdrop-blur-xl">
            {demoUsers.map((u) => {
              const isCurrent = user?.id === u.id;
              return (
                <div
                  key={u.id}
                  className="p-3.5 flex items-center justify-between hover:bg-[#D4A574]/5 transition"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <Avatar src={u.avatar_url} alt={u.display_name} size="md" />
                    <div className="min-w-0">
                      <p className="font-serif font-bold text-sm text-[#F5EDE8] truncate flex items-center gap-1">
                        {u.display_name}
                        {u.is_verified ? (
                          <BadgeCheck className="w-3.5 h-3.5 text-[#D4A574] fill-[#D4A574] inline-block shrink-0" />
                        ) : null}
                      </p>
                      <p className="text-xs text-[#A8888D] truncate">@{u.username}</p>
                    </div>
                  </div>

                  {isCurrent ? (
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#D4A574] px-3 py-1 bg-[#D4A574]/15 rounded-full border border-[#D4A574]/30">
                      Active
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSwitchAccount(u)}
                      disabled={isSwitching}
                      className="text-xs px-3.5 py-1 font-bold"
                    >
                      Switch
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Current Account & Session Actions */}
        {user && (
          <div className="space-y-3.5 pt-4 border-t border-[#D4A574]/15">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#D4A574]" />
              <h2 className="font-serif text-base font-bold text-[#F5EDE8]">Account Session</h2>
            </div>

            <div className="p-4 bg-[#160B0F]/80 border border-[#D4A574]/15 rounded-3xl flex items-center justify-between">
              <div>
                <p className="text-sm font-serif font-bold text-[#F5EDE8]">Signed in as @{user.username}</p>
                <p className="text-xs text-[#A8888D]">{user.email}</p>
              </div>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="text-xs font-bold"
              >
                Sign out
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
