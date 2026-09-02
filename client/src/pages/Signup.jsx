import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/common/Button';
import { Logo } from '../components/common/Logo';

export function Signup() {
  const { verifySignupOtp } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState('details');
  const [otp, setOtp] = useState('');
  const [resendIn, setResendIn] = useState(0);

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
      const response = await fetch('/api/auth/signup/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), email: email.trim(), password, displayName: displayName.trim() })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to send verification code');
      setStep('otp');
      setResendIn(60);
      showToast({ title: 'Verification code sent', message: `Check ${email.trim().toLowerCase()}`, type: 'info' });
    } catch (err) {
      setError(err.message || 'Registration failed. Try a different username or email.');
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    if (resendIn <= 0) return undefined;
    const timer = window.setInterval(() => setResendIn((value) => Math.max(value - 1, 0)), 1000);
    return () => window.clearInterval(timer);
  }, [resendIn]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(otp)) {
      setError('Enter the 6-digit verification code');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      await verifySignupOtp(email.trim(), otp);
      showToast({ title: 'Email verified', message: 'Your Voxa account is ready', type: 'info' });
      navigate('/');
    } catch (err) {
      setError(err.message || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendIn > 0) return;
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/auth/signup/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to resend code');
      setResendIn(60);
      showToast({ title: 'New code sent', message: 'Check your Gmail inbox', type: 'info' });
    } catch (err) {
      setError(err.message || 'Unable to resend code');
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
          onSubmit={step === 'details' ? handleSubmit : handleVerify}
          className="p-6 bg-[#160B0F]/90 border border-[#D4A574]/20 rounded-3xl space-y-4 backdrop-blur-xl shadow-[0_10px_35px_rgba(0,0,0,0.8)]"
        >
          {error && <p className="text-xs text-[#E8B4B8] font-medium">{error}</p>}

          {step === 'otp' ? (
            <>
              <div>
                <h2 className="font-serif text-lg font-bold text-[#F5EDE8]">Verify your Gmail</h2>
                <p className="mt-1 text-xs text-[#A8888D]">Enter the 6-digit code sent to {email.trim().toLowerCase()}.</p>
              </div>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-full bg-[#0D0709] text-[#F5EDE8] placeholder-[#A8888D]/60 px-4 py-3 rounded-xl border border-[#D4A574]/20 focus:outline-none focus:border-[#D4A574] text-center text-2xl tracking-[0.45em] font-mono"
                autoFocus
              />
              <Button type="submit" isLoading={isLoading} size="lg" className="w-full uppercase tracking-widest text-xs font-black py-3.5">
                Verify & Create Account
              </Button>
              <button type="button" onClick={handleResend} disabled={isLoading || resendIn > 0} className="w-full text-xs text-[#D4A574] disabled:text-[#A8888D] hover:underline">
                {resendIn > 0 ? `Resend code in ${resendIn}s` : 'Resend verification code'}
              </button>
            </>
          ) : (
          <>

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
          </>
          )}
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
