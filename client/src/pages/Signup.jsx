import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/common/Button';
import { Logo } from '../components/common/Logo';

export function Signup() {
  const { signup } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!displayName.trim() || !username.trim() || !email.trim() || !password) {
      setError('Please complete all fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must contain at least 6 characters');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await signup(username.trim(), email.trim(), password, displayName.trim());
      showToast({ title: 'Welcome to Voxa', message: 'Your account is ready', type: 'info' });
      navigate('/');
    } catch (err) {
      setError(err.message || 'Registration failed. Try a different username or email.');
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
            Create your account to participate in high-signal discussions.
          </p>
        </div>

        {/* Signup Form */}
        <form
          onSubmit={handleSubmit}
          className="p-6 bg-[#160B0F]/90 border border-[#D4A574]/20 rounded-3xl space-y-4 backdrop-blur-xl shadow-[0_10px_35px_rgba(0,0,0,0.8)]"
        >
          {error && <p className="text-xs text-[#E8B4B8] font-medium">{error}</p>}

          <div>
            <label className="block text-[11px] font-semibold tracking-wider uppercase text-[#D4A574]/80 mb-1.5">
              Full Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Jordan Lee"
              className="w-full bg-[#0D0709] text-[#F5EDE8] placeholder-[#A8888D]/60 px-4 py-2.5 rounded-xl border border-[#D4A574]/20 focus:outline-none focus:border-[#D4A574] text-sm"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold tracking-wider uppercase text-[#D4A574]/80 mb-1.5">
              Handle (@username)
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              placeholder="e.g. jordan_dev"
              className="w-full bg-[#0D0709] text-[#F5EDE8] placeholder-[#A8888D]/60 px-4 py-2.5 rounded-xl border border-[#D4A574]/20 focus:outline-none focus:border-[#D4A574] text-sm"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold tracking-wider uppercase text-[#D4A574]/80 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jordan@example.com"
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
              placeholder="At least 6 characters"
              className="w-full bg-[#0D0709] text-[#F5EDE8] placeholder-[#A8888D]/60 px-4 py-2.5 rounded-xl border border-[#D4A574]/20 focus:outline-none focus:border-[#D4A574] text-sm"
            />
          </div>

          <Button
            type="submit"
            isLoading={isLoading}
            size="lg"
            className="w-full mt-2 uppercase tracking-widest text-xs font-black py-3.5"
          >
            Create Membership
          </Button>
        </form>

        {/* Footer Link */}
        <p className="text-center text-xs text-[#A8888D]">
          Already have an account?{' '}
          <Link to="/login" className="text-[#D4A574] hover:text-[#E8B4B8] hover:underline font-bold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
