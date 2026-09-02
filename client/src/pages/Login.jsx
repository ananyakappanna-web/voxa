import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/common/Button';
import { Avatar } from '../components/common/Avatar';
import { Logo } from '../components/common/Logo';

const QUICK_DEMOS = [
  {
    username: 'alex_dev',
    displayName: 'Alex Morgan ⚡',
    email: 'alex@voxa.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    tag: 'Lead Engineer'
  },
  {
    username: 'sarah_ux',
    displayName: 'Sarah Jenkins 🎨',
    email: 'sarah@voxa.com',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
    tag: 'Product Designer'
  },
  {
    username: 'sam_altman',
    displayName: 'Sam Altman',
    email: 'sam@voxa.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    tag: 'AI Pioneer'
  },
  {
    username: 'voxa_official',
    displayName: 'Voxa 𝕏',
    email: 'official@voxa.com',
    avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80',
    tag: 'Official Platform'
  }
];

export function Login() {
  const { login, quickLoginAs } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!loginInput.trim() || !password) {
      setError('Please provide credentials');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await login(loginInput.trim(), password);
      showToast({ title: 'Welcome back', message: 'Signed in successfully', type: 'info' });
      navigate('/');
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (demo) => {
    setIsLoading(true);
    setError('');
    try {
      await quickLoginAs(demo);
      showToast({
        title: `Welcome, ${demo.displayName}`,
        message: `Signed in as @${demo.username}`,
        type: 'info',
        avatar: demo.avatar
      });
      navigate('/');
    } catch (err) {
      setError('Quick login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-radial-luxury flex items-center justify-center p-4 sm:p-6 select-none relative overflow-hidden">
      {/* Background Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-[#5C1A2B]/30 via-[#2B0A12]/20 to-transparent blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand Logo & Header */}
        <div className="text-center flex flex-col items-center space-y-3">
          <Logo size="xl" showWordmark={true} showTagline={true} className="flex-col" />
          <p className="text-xs text-[#A8888D] max-w-xs pt-1 leading-relaxed">
            Welcome to the curated network for builders, thinkers, and innovators.
          </p>
        </div>

        {/* 1-Click Demo Personas */}
        <div className="p-4 bg-[#160B0F]/80 border border-[#D4A574]/20 rounded-3xl space-y-3 backdrop-blur-xl shadow-[0_10px_35px_rgba(0,0,0,0.8)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider uppercase text-[#D4A574] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#D4A574]" />
              <span>1-Click Instant Access</span>
            </span>
            <span className="text-[10px] text-[#A8888D] font-mono">Sample Personas</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {QUICK_DEMOS.map((d) => (
              <button
                key={d.username}
                type="button"
                onClick={() => handleQuickLogin(d)}
                disabled={isLoading}
                className="p-2.5 rounded-2xl bg-[#0D0709]/80 hover:bg-[#2B0A12]/60 border border-[#D4A574]/15 hover:border-[#D4A574]/40 text-left transition flex items-center gap-2.5 group"
              >
                <Avatar src={d.avatar} alt={d.displayName} size="sm" />
                <div className="min-w-0">
                  <p className="text-xs font-serif font-bold text-[#F5EDE8] group-hover:text-[#D4A574] transition truncate">
                    @{d.username}
                  </p>
                  <p className="text-[10px] text-[#A8888D] truncate">{d.tag}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Login Form */}
        <form
          onSubmit={handleSubmit}
          className="p-6 bg-[#160B0F]/90 border border-[#D4A574]/20 rounded-3xl space-y-4 backdrop-blur-xl shadow-[0_10px_35px_rgba(0,0,0,0.8)]"
        >
          {error && <p className="text-xs text-[#E8B4B8] font-medium">{error}</p>}

          <div>
            <label className="block text-[11px] font-semibold tracking-wider uppercase text-[#D4A574]/80 mb-1.5">
              Handle or Email
            </label>
            <input
              type="text"
              value={loginInput}
              onChange={(e) => setLoginInput(e.target.value)}
              placeholder="alex_dev or alex@voxa.com"
              className="w-full bg-[#0D0709] text-[#F5EDE8] placeholder-[#A8888D]/60 px-4 py-2.5 rounded-xl border border-[#D4A574]/20 focus:outline-none focus:border-[#D4A574] text-sm"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold tracking-wider uppercase text-[#D4A574]/80 mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#0D0709] text-[#F5EDE8] placeholder-[#A8888D]/60 px-4 py-2.5 rounded-xl border border-[#D4A574]/20 focus:outline-none focus:border-[#D4A574] text-sm"
            />
          </div>

          <Button
            type="submit"
            isLoading={isLoading}
            size="lg"
            className="w-full mt-2 uppercase tracking-widest text-xs font-black py-3.5"
          >
            Sign In
          </Button>
        </form>

        {/* Footer Link */}
        <p className="text-center text-xs text-[#A8888D]">
          New to Voxa?{' '}
          <Link to="/signup" className="text-[#D4A574] hover:text-[#E8B4B8] hover:underline font-bold">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
