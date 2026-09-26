'use client';

import React, { useState } from 'react';
import { PRICING_PLANS } from '@/lib/billing/plans';
import { PlanTier } from '@/types/billing';
import {
  CreditCard,
  Check,
  ShieldCheck,
  Zap,
  Sparkles,
  ArrowRight,
  Flame,
  CheckCircle2,
} from 'lucide-react';

export function PricingView() {
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <div className="flex-1 flex flex-col bg-[#0e1115] border border-[#232a32] rounded overflow-hidden">
      {/* Header bar */}
      <div className="p-3 bg-[#13171d] border-b border-[#232a32] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-[#ea580c]" />
          <span className="font-semibold text-white uppercase tracking-wider">
            Subscription & Tier Architecture
          </span>
          <span className="text-[11px] px-1.5 py-0.5 rounded bg-[#10b981]/15 text-[#10b981] font-bold">
            Transparent Pricing
          </span>
        </div>

        {/* Currency & Cycle Toggles */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-0.5 rounded bg-[#181d24] border border-[#28323e]">
            <button
              onClick={() => setCurrency('INR')}
              className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
                currency === 'INR' ? 'bg-[#ea580c] text-white font-bold' : 'text-[var(--text-muted)]'
              }`}
            >
              INR (₹)
            </button>
            <button
              onClick={() => setCurrency('USD')}
              className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
                currency === 'USD' ? 'bg-[#ea580c] text-white font-bold' : 'text-[var(--text-muted)]'
              }`}
            >
              USD ($)
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-xl font-bold text-white tracking-tight">
            Predictable engineering compute for autonomous agents
          </h2>
          <p className="text-xs text-[var(--text-secondary)] font-sans">
            Every plan includes our deterministic verification harness, glass box observability, and failure recovery engine.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
          {PRICING_PLANS.map((plan) => {
            const price =
              currency === 'INR'
                ? `₹${plan.monthlyPriceInr.toLocaleString()}`
                : `$${plan.monthlyPriceUsd}`;

            return (
              <div
                key={plan.id}
                className={`p-5 rounded-lg border transition-all flex flex-col justify-between space-y-4 ${
                  plan.recommended
                    ? 'bg-[#151b22] border-[#ea580c] ring-1 ring-[#ea580c]/50 relative'
                    : 'bg-[#12161c] border-[#252d36]'
                }`}
              >
                {plan.recommended && (
                  <div className="absolute -top-2.5 right-4 px-2 py-0.5 rounded bg-[#ea580c] text-white font-bold text-[10px] tracking-wider uppercase">
                    Most Popular
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                      {plan.name} Tier
                    </span>
                    <div className="text-2xl font-black text-white mt-1">
                      {price}
                      <span className="text-xs font-normal text-[var(--text-muted)]">/mo</span>
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)] font-sans mt-1">
                      {plan.tagline}
                    </p>
                  </div>

                  <div className="p-2.5 rounded bg-[#0b0e12] border border-[#1f262f] space-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)]">Verified Runs:</span>
                      <span className="text-white font-bold">{plan.runsLimitMonthly}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)]">Context Limit:</span>
                      <span className="text-[#38bdf8] font-bold">
                        {(plan.contextLimitTokens / 1000).toFixed(0)}k tokens
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)]">Parallel Tools:</span>
                      <span className="text-[#10b981] font-bold">{plan.maxParallelTools}x</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-[#1f262f]">
                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">
                      Features Included:
                    </span>
                    <ul className="space-y-1.5 text-[11px] text-[var(--text-secondary)] font-sans">
                      {plan.features.map((feat, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <Check className="w-3.5 h-3.5 text-[#10b981] shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <button
                  className={`w-full py-2 rounded font-semibold text-xs transition-colors cursor-pointer ${
                    plan.recommended
                      ? 'bg-[#ea580c] hover:bg-[#f97316] text-white'
                      : 'bg-[#181d24] hover:bg-[#222933] text-white border border-[#2b3542]'
                  }`}
                >
                  {plan.id === 'FREE' ? 'GET STARTED FREE' : `UPGRADE TO ${plan.name.toUpperCase()}`}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
