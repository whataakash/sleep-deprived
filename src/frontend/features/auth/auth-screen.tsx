'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth/context';
import {
  Flame,
  ShieldCheck,
  ArrowRight,
  User,
  Mail,
  Lock,
  Sparkles,
  Zap,
  CheckCircle2,
} from 'lucide-react';

export function AuthScreen() {
  const { login, signup, demoLogin } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'signup') {
      if (!name.trim()) {
        setError('Please enter your full name');
        return;
      }
      if (!email.trim() || !email.includes('@')) {
        setError('Please enter a valid email address');
        return;
      }
      const ok = signup(name, email, password);
      if (!ok) setError('Unable to create account. Please try again.');
    } else {
      if (!email.trim() || !email.includes('@')) {
        setError('Please enter a valid email address');
        return;
      }
      const ok = login(email, password);
      if (!ok) setError('Unable to sign in. Please verify your credentials.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[var(--bg-canvas)] flex items-center justify-center p-4 select-none font-sans transition-colors">
      <div className="w-full max-w-md bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#ea580c]/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />

        {/* Brand Header */}
        <div className="text-center space-y-1.5 relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ea580c]/12 border border-[#ea580c]/30 text-[#ea580c] text-xs font-mono font-bold mb-1">
            <Flame className="w-3.5 h-3.5" />
            <span>परिश्रम · PARISHRAM</span>
          </div>

          <h2 className="text-2xl font-black tracking-tight text-[var(--text-primary)]">
            {mode === 'signup' ? 'Create your Harness Account' : 'Sign in to परिश्रम'}
          </h2>
          <p className="text-xs text-[var(--text-secondary)] font-mono">
            Autonomous software engineering with deterministic proof.
          </p>
        </div>

        {/* Auth Mode Switcher */}
        <div className="p-1 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] grid grid-cols-2 gap-1 font-mono text-xs">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setError(null);
            }}
            className={`py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
              mode === 'signin'
                ? 'bg-[#ea580c] text-white shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Sign In
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setError(null);
            }}
            className={`py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
              mode === 'signup'
                ? 'bg-[#ea580c] text-white shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error message if any */}
        {error && (
          <div className="p-2.5 rounded-lg bg-[#ef4444]/15 border border-[#ef4444]/30 text-[#ef4444] text-xs font-mono text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 font-mono text-xs">
          {mode === 'signup' && (
            <div className="space-y-1">
              <label className="text-[11px] text-[var(--text-muted)] font-semibold block">Full Name</label>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] focus-within:border-[#ea580c] transition-colors">
                <User className="w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="e.g. Aman Mishra"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-transparent text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none text-xs"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[11px] text-[var(--text-muted)] font-semibold block">Email Address</label>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] focus-within:border-[#ea580c] transition-colors">
              <Mail className="w-4 h-4 text-[var(--text-muted)]" />
              <input
                type="email"
                placeholder="developer@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-[var(--text-muted)] font-semibold block">Password</label>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] focus-within:border-[#ea580c] transition-colors">
              <Lock className="w-4 h-4 text-[var(--text-muted)]" />
              <input
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-lg bg-[#ea580c] hover:bg-[#f97316] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99] cursor-pointer mt-2"
          >
            <span>{mode === 'signup' ? 'Create Free Account' : 'Sign In to Workspace'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Instant Demo Option */}
        <div className="pt-2 border-t border-[var(--border-subtle)] space-y-2.5 text-center font-mono">
          <div className="text-[11px] text-[var(--text-muted)]">
            Testing or evaluating the harness?
          </div>

          <button
            type="button"
            onClick={demoLogin}
            className="w-full py-2 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-[#fbbf24]" />
            <span>⚡ Instant Demo Evaluator Access</span>
          </button>
        </div>

        {/* Footer Guarantee */}
        <div className="text-[10px] text-[var(--text-muted)] text-center font-mono flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#10b981]" />
          <span>Local sandboxed chroot · Zero unauthorized cloud egress</span>
        </div>
      </div>
    </div>
  );
}
