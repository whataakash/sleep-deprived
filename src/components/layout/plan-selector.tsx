'use client';

import React, { useRef, useEffect } from 'react';
import {
  Sparkles,
  ChevronDown,
  Check,
  Zap,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Cpu,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { getPlanDisplay, PRICING_PLANS } from '@/lib/billing/plans';

export interface PlanSelectorProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onOpenUpgrade?: () => void;
  onOpenAccount?: (initialCategory?: string) => void;
}

export function PlanSelector({
  isOpen,
  onToggle,
  onClose,
  onOpenUpgrade,
  onOpenAccount,
}: PlanSelectorProps) {
  const { session } = useAuth();
  const user = session.user;
  const containerRef = useRef<HTMLDivElement>(null);

  const planInfo = getPlanDisplay(user?.plan || 'FREE');
  const isFreePlan = !user?.plan || user.plan === 'FREE';
  const isProPlan = user?.plan === 'BUILDER';
  const isMaxPlan = user?.plan === 'PRO';

  const runsUsed = user?.usage?.runsUsedThisMonth || 0;
  const rawMaxRuns = user?.usage?.maxMonthlyRuns;
  const isUnlimited = rawMaxRuns === 'Unlimited';
  const maxRuns = typeof rawMaxRuns === 'number' ? rawMaxRuns : isFreePlan ? 25 : isProPlan ? 150 : 500;
  const usagePercent = isUnlimited ? 15 : Math.min(100, Math.round((runsUsed / maxRuns) * 100));

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleSelectUpgrade = () => {
    onClose();
    if (onOpenUpgrade) {
      onOpenUpgrade();
    }
  };

  const handleOpenBilling = () => {
    onClose();
    if (onOpenAccount) {
      onOpenAccount('billing');
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Futuristic Glowing Purple & Golden Shining Upgrade / Plan Selector */}
      <button
        type="button"
        onClick={onToggle}
        className={`relative overflow-hidden flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl border transition-all duration-200 cursor-pointer min-h-[40px] group active:scale-[0.97] select-none text-white focus:outline-none focus:ring-2 focus:ring-purple-400/50 ${
          isOpen
            ? 'bg-gradient-to-b from-[#4c1d95] via-[#2e1065] to-[#120524] border-purple-400/80 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5),0_0_24px_rgba(168,85,247,0.55),0_0_10px_rgba(251,191,36,0.35)]'
            : 'bg-gradient-to-b from-[#3b0764] via-[#20083b] to-[#0c0217] hover:from-[#4c1d95] hover:via-[#2e1065] hover:to-[#170630] border-purple-500/40 hover:border-purple-300/80 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.35),0_0_16px_rgba(168,85,247,0.35),0_2px_10px_rgba(0,0,0,0.6)] hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.55),0_0_26px_rgba(168,85,247,0.6),0_0_12px_rgba(251,191,36,0.4)]'
        }`}
        title={`Plan: ${planInfo.name} — Click to switch plan or upgrade`}
        aria-label={`Plan selector, current plan is ${planInfo.name}`}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {/* Animated Glass Light Beam / Shining Sheen Reflection */}
        <span
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl"
        >
          <span className="absolute top-0 bottom-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shining-beam" />
        </span>

        {/* Golden Sparkles Icon with Drop Shadow Glow */}
        <Sparkles className="w-4 h-4 text-[#fbbf24] drop-shadow-[0_0_8px_rgba(251,191,36,0.95)] group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 relative z-10 shrink-0" />

        {/* Text & Badges */}
        <div className="flex items-center gap-1.5 relative z-10">
          <span className="font-sans text-xs font-bold tracking-wide text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
            {isFreePlan ? 'Upgrade' : planInfo.name}
          </span>
          {isFreePlan ? (
            <span className="hidden sm:inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-gradient-to-r from-amber-400 to-amber-500 text-black shadow-xs tracking-wider uppercase">
              PRO
            </span>
          ) : (
            <span className="hidden sm:inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-purple-400/20 text-purple-200 border border-purple-400/40 tracking-wider uppercase">
              ACTIVE
            </span>
          )}
        </div>

        {/* Dropdown Chevron */}
        <ChevronDown
          className={`w-3.5 h-3.5 text-purple-200/90 group-hover:text-white transition-transform duration-200 relative z-10 shrink-0 ${
            isOpen ? 'rotate-180 text-white' : ''
          }`}
        />
      </button>

      {/* ChatGPT-style Popover Menu */}
      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 top-full mt-2 w-[310px] sm:w-[350px] max-w-[calc(100vw-24px)] bg-[var(--bg-panel)] border border-[var(--border-medium)] rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150 font-sans text-xs select-none backdrop-blur-md"
        >
          {/* Active Plan Header & Quota Progress */}
          <div className="p-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] mb-2.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#a855f7] animate-pulse shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                <span className="font-bold text-[var(--text-primary)] text-xs tracking-tight">
                  {planInfo.name} Plan
                </span>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/25">
                Active
              </span>
            </div>

            {/* Quota Progress */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] font-mono">
                <span>Monthly Quota</span>
                <span className="text-[var(--text-secondary)] font-semibold">
                  {runsUsed} / {isUnlimited ? '∞' : maxRuns} runs
                </span>
              </div>
              <div className="w-full bg-[var(--bg-subtle)] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#a855f7] via-[#c084fc] to-[#fbbf24] h-full rounded-full transition-all duration-300"
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Plan Options / Model Tiers */}
          <div className="space-y-1.5 mb-2.5">
            {/* Free Tier */}
            <div
              className={`p-2.5 rounded-xl border transition-all ${
                isFreePlan
                  ? 'border-[var(--border-active)] bg-[var(--bg-subtle)]/70'
                  : 'border-[var(--border-subtle)] hover:border-[var(--border-medium)] bg-[var(--bg-canvas)]'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-[var(--text-primary)] text-xs">Free</span>
                    <span className="text-[10px] text-[var(--text-muted)] font-mono">₹0/mo</span>
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-snug">
                    Open-weight models (Qwen 2.5 Coder, GLM 4.5 Lite) · 25 runs/mo
                  </p>
                </div>
                {isFreePlan ? (
                  <span className="shrink-0 flex items-center gap-1 text-[10px] font-bold text-[#10b981] bg-[#10b981]/10 px-1.5 py-0.5 rounded">
                    <Check className="w-3 h-3" />
                    <span>Current</span>
                  </span>
                ) : null}
              </div>
            </div>

            {/* Pro Tier (Recommended) */}
            <div
              className={`p-2.5 rounded-xl border transition-all relative overflow-hidden ${
                isProPlan
                  ? 'border-purple-500/60 bg-purple-950/20 shadow-[0_0_12px_rgba(168,85,247,0.15)]'
                  : 'border-purple-500/30 hover:border-purple-400/60 bg-[var(--bg-canvas)]'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-[var(--text-primary)] text-xs">Pro</span>
                    <span className="text-[10px] text-[var(--text-secondary)] font-mono font-medium">₹999/mo</span>
                    <span className="text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.2 rounded bg-gradient-to-r from-amber-400 to-amber-500 text-black shadow-xs">
                      Popular
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] leading-snug">
                    Kimi K2 & GLM 4.5 Agentic · 150 verified runs/mo · 256k context · BYOK
                  </p>
                </div>
                {isProPlan ? (
                  <span className="shrink-0 flex items-center gap-1 text-[10px] font-bold text-[#10b981] bg-[#10b981]/10 px-1.5 py-0.5 rounded">
                    <Check className="w-3 h-3" />
                    <span>Current</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleSelectUpgrade}
                    className="shrink-0 px-2.5 py-1 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-[0_0_12px_rgba(168,85,247,0.4)] active:scale-95"
                  >
                    <Zap className="w-3 h-3 fill-current text-amber-300" />
                    <span>Upgrade</span>
                  </button>
                )}
              </div>
            </div>

            {/* Max Tier (Frontier Reasoning) */}
            <div
              className={`p-2.5 rounded-xl border transition-all ${
                isMaxPlan
                  ? 'border-[#a78bfa]/60 bg-[#a78bfa]/10'
                  : 'border-[var(--border-subtle)] hover:border-[var(--border-medium)] bg-[var(--bg-canvas)]'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-[var(--text-primary)] text-xs">Max</span>
                    <span className="text-[10px] text-[var(--text-secondary)] font-mono font-medium">₹2,499/mo</span>
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      Frontier
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] leading-snug">
                    DeepSeek R1 & Claude 3.7 Sonnet · 500 runs/mo · 1M context
                  </p>
                </div>
                {isMaxPlan ? (
                  <span className="shrink-0 flex items-center gap-1 text-[10px] font-bold text-[#10b981] bg-[#10b981]/10 px-1.5 py-0.5 rounded">
                    <Check className="w-3 h-3" />
                    <span>Current</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleSelectUpgrade}
                    className="shrink-0 px-2 py-1 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] border border-[var(--border-subtle)] hover:border-[var(--border-medium)] text-[var(--text-primary)] text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>Upgrade</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Popover Footer Links */}
          <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px]">
            <button
              type="button"
              onClick={handleSelectUpgrade}
              className="text-purple-400 hover:text-purple-300 hover:underline font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>Explore all plans</span>
              <ArrowRight className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={handleOpenBilling}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1 cursor-pointer transition-colors"
            >
              <CreditCard className="w-3 h-3" />
              <span>Billing</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlanSelector;
