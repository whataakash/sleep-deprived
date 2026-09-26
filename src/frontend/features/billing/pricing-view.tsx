'use client';

import React, { useState } from 'react';
import { PRICING_PLANS } from '@/lib/billing/plans';
import { PricingPlan } from '@/types/billing';
import { useAuth } from '@/lib/auth/context';
import { CheckoutModal } from '@/components/features/billing/checkout-modal';
import {
  CreditCard,
  Check,
  ShieldCheck,
  Zap,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export function PricingView() {
  const { session } = useAuth();
  const currentPlan = session.user?.plan || 'BUILDER';
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [tierCategory, setTierCategory] = useState<'individual' | 'team'>('individual');
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<PricingPlan | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const handleOpenCheckout = (plan: PricingPlan) => {
    if (plan.id === 'FREE') return;
    if (plan.id === 'ENTERPRISE') {
      window.open('mailto:enterprise@parishram.dev?subject=Parishram%20Enterprise%20Inquiry', '_blank');
      return;
    }
    setSelectedPlanForCheckout(plan);
    setIsCheckoutOpen(true);
  };

  const displayedPlans =
    tierCategory === 'individual'
      ? PRICING_PLANS.filter((p) => ['FREE', 'BUILDER', 'PRO'].includes(p.id))
      : PRICING_PLANS.filter((p) => ['TEAM', 'ENTERPRISE'].includes(p.id));

  return (
    <div className="flex-1 flex flex-col bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg overflow-hidden transition-colors">
      {/* Header bar */}
      <div className="p-3 bg-[var(--bg-elevated)] border-b border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-[#ea580c]" />
          <span className="font-semibold text-[var(--text-primary)] uppercase tracking-wider">
            Subscription & Tier Architecture
          </span>
          <span className="text-[11px] px-1.5 py-0.5 rounded bg-[#10b981]/15 text-[#10b981] font-bold">
            Transparent Pricing
          </span>
        </div>

        {/* Currency & Cycle Toggles */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-0.5 rounded bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
            <button
              onClick={() => setCurrency('INR')}
              className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
                currency === 'INR' ? 'bg-[#ea580c] text-white font-bold' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              INR (₹)
            </button>
            <button
              onClick={() => setCurrency('USD')}
              className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
                currency === 'USD' ? 'bg-[#ea580c] text-white font-bold' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              USD ($)
            </button>
          </div>

          <div className="flex items-center p-0.5 rounded bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
                billingCycle === 'monthly' ? 'bg-[#ea580c] text-white font-bold' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
                billingCycle === 'yearly' ? 'bg-[#ea580c] text-white font-bold' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              Yearly (Save 20%)
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-3">
          <div className="text-[10px] font-mono tracking-widest uppercase text-[#ea580c] font-bold">
            SUBSCRIPTION PLANS
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] tracking-tight">
            Plans that fit your work
          </h2>
          <p className="text-xs text-[var(--text-secondary)] font-sans">
            Every plan includes our deterministic verification harness, glass box observability, and failure recovery engine.
          </p>

          {/* Individual vs Team & Enterprise Segmented Control */}
          <div className="inline-flex p-1 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-inner text-xs font-medium">
            <button
              onClick={() => setTierCategory('individual')}
              className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer ${
                tierCategory === 'individual'
                  ? 'bg-[var(--bg-canvas)] text-[var(--text-primary)] font-bold shadow-xs border border-[var(--border-subtle)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Individual
            </button>
            <button
              onClick={() => setTierCategory('team')}
              className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer ${
                tierCategory === 'team'
                  ? 'bg-[var(--bg-canvas)] text-[var(--text-primary)] font-bold shadow-xs border border-[var(--border-subtle)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Team & Enterprise
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div
          className={`grid gap-4 font-mono text-xs ${
            tierCategory === 'individual'
              ? 'grid-cols-1 md:grid-cols-3 max-w-5xl mx-auto'
              : 'grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto'
          }`}
        >
          {displayedPlans.map((plan) => {
            const price =
              plan.id === 'ENTERPRISE'
                ? 'Custom'
                : currency === 'INR'
                ? billingCycle === 'yearly'
                  ? `₹${Math.round(plan.yearlyPriceInr / 12).toLocaleString()}`
                  : `₹${plan.monthlyPriceInr.toLocaleString()}`
                : billingCycle === 'yearly'
                ? `$${Math.round(plan.yearlyPriceUsd / 12)}`
                : `$${plan.monthlyPriceUsd}`;

            const isCurrent = currentPlan === plan.id;

            return (
              <div
                key={plan.id}
                className={`p-5 rounded-lg border transition-all flex flex-col justify-between space-y-4 ${
                  plan.recommended
                    ? 'bg-[var(--bg-elevated)] border-[#ea580c] ring-1 ring-[#ea580c]/50 relative'
                    : 'bg-[var(--bg-canvas)] border-[var(--border-subtle)] hover:border-[var(--border-medium)]'
                }`}
              >
                {plan.recommended && (
                  <div className="absolute -top-2.5 right-4 px-2 py-0.5 rounded bg-[#ea580c] text-white font-bold text-[10px] tracking-wider uppercase">
                    Most Popular
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-lg font-black text-[var(--text-primary)]">
                        {plan.name}
                      </span>
                      {plan.id === 'TEAM' && (
                        <span className="text-[10px] bg-[#38bdf8]/15 text-[#38bdf8] px-2 py-0.5 rounded font-mono font-bold">
                          Collaborative
                        </span>
                      )}
                      {plan.id === 'ENTERPRISE' && (
                        <span className="text-[10px] bg-[var(--bg-subtle)] text-[var(--text-secondary)] px-2 py-0.5 rounded font-mono font-semibold border border-[var(--border-subtle)]">
                          Custom
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] font-mono mt-0.5">
                      {plan.englishSubtitle}
                    </div>

                    <div className="text-2xl font-black text-[var(--text-primary)] mt-2">
                      {price}
                      {plan.id !== 'ENTERPRISE' && (
                        <span className="text-xs font-normal text-[var(--text-muted)]">
                          /mo
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)] font-sans mt-1">
                      {plan.tagline}
                    </p>
                  </div>

                  <div className="p-2.5 rounded bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)]">Verified Runs:</span>
                      <span className="text-[var(--text-primary)] font-bold">{plan.runsLimitMonthly}</span>
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

                  <div className="space-y-2 pt-2 border-t border-[var(--border-subtle)]">
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
                  onClick={() => handleOpenCheckout(plan)}
                  disabled={isCurrent}
                  className={`w-full py-2.5 rounded-md font-semibold text-xs transition-colors cursor-pointer ${
                    isCurrent
                      ? 'bg-[var(--bg-subtle)] text-[var(--text-muted)] border border-[var(--border-subtle)] cursor-default'
                      : plan.id === 'ENTERPRISE'
                      ? 'bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] text-[var(--text-primary)] border border-[var(--border-subtle)]'
                      : plan.id === 'TEAM'
                      ? 'bg-[#38bdf8] hover:bg-[#0ea5e9] text-black shadow-xs font-bold'
                      : plan.recommended
                      ? 'bg-[#ea580c] hover:bg-[#f97316] text-white shadow-xs'
                      : 'bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] text-[var(--text-primary)] border border-[var(--border-subtle)]'
                  }`}
                >
                  {isCurrent
                    ? 'CURRENT ACTIVE PLAN'
                    : plan.id === 'FREE'
                    ? 'GET STARTED FREE'
                    : plan.id === 'ENTERPRISE'
                    ? 'CONTACT SALES'
                    : plan.id === 'TEAM'
                    ? 'CHOOSE TEAM'
                    : `UPGRADE TO ${plan.name.toUpperCase()}`}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Official Provider Checkout Modal */}
      <CheckoutModal
        plan={selectedPlanForCheckout}
        currency={currency}
        billingCycle={billingCycle}
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
      />
    </div>
  );
}
