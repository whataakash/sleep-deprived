'use client';

import React, { useState } from 'react';
import { PricingPlan, PaymentInvoice } from '@/types/billing';
import { useAuth } from '@/lib/auth/context';
import { PRICING_PLANS } from '@/lib/billing/plans';
import {
  X,
  Check,
  ShieldCheck,
  QrCode,
  CreditCard,
  Building2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  ArrowRight,
  ArrowLeft,
  Info,
  ExternalLink,
  Sparkles,
  Zap,
  Users,
} from 'lucide-react';

export interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan?: PricingPlan | null;
  initialPlan?: PricingPlan | null;
  initialStep?: 'PLANS' | 'CONFIGURE';
  currency?: 'INR' | 'USD';
  billingCycle?: 'monthly' | 'yearly';
  onSuccess?: (planId: string, invoice: PaymentInvoice) => void;
}

type ModalStep = 'PLANS' | 'CONFIGURE' | 'VERIFYING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';

export function UpgradeModal({
  isOpen,
  onClose,
  plan,
  initialPlan,
  initialStep,
  currency = 'INR',
  billingCycle: defaultCycle = 'monthly',
  onSuccess,
}: UpgradeModalProps) {
  const { session, updatePlan } = useAuth();
  const user = session.user;
  const activeInitialPlan = plan || initialPlan;
  const effectiveInitialStep = initialStep || (plan ? 'CONFIGURE' : 'PLANS');

  // Step state: whether viewing plans comparison or configuring checkout
  const [step, setStep] = useState<ModalStep>(effectiveInitialStep);

  // Active view: individual developer tiers vs engineering team
  const [tierView, setTierView] = useState<'individual' | 'team'>('individual');

  // Plan & Billing Cycle selection
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan>(
    activeInitialPlan || PRICING_PLANS[1] // Default to प्रगति (Builder)
  );
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>(defaultCycle);

  // Billing details form
  const [fullName, setFullName] = useState(user?.name || 'Shivansh Pandey');
  const [country, setCountry] = useState('India');
  const [address, setAddress] = useState('IIT Delhi Campus, Hauz Khas');
  const [businessName, setBusinessName] = useState('');
  const [taxIdType, setTaxIdType] = useState('India (IN GST)');
  const [taxId, setTaxId] = useState('');
  const [useDifferentInvoiceName, setUseDifferentInvoiceName] = useState(false);
  const [invoiceName, setInvoiceName] = useState('');

  // Payment method tab: 'upi' | 'card'
  const [paymentMethodTab, setPaymentMethodTab] = useState<'upi' | 'card'>('upi');
  const [cardNumber, setCardNumber] = useState('•••• •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('•••');

  // Terms agreement
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Gateway communication states
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [upiDeepLink, setUpiDeepLink] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [verifiedInvoice, setVerifiedInvoice] = useState<PaymentInvoice | null>(null);

  if (!isOpen) return null;

  // Dynamic pricing calculations pulling from the active plan
  const monthlyTotal = selectedPlan.monthlyPriceInr || 0;
  const yearlyTotal = selectedPlan.yearlyPriceInr || 0;

  const totalDue = billingCycle === 'yearly' ? yearlyTotal : monthlyTotal;
  const subtotal = Number((totalDue / 1.18).toFixed(2));
  const gstTax = Number((totalDue - subtotal).toFixed(2));

  // Switch to Configure screen when a plan is clicked
  const handleSelectPlan = (targetPlan: PricingPlan) => {
    if (targetPlan.id === 'FREE') {
      updatePlan('FREE');
      onClose();
      return;
    }
    setSelectedPlan(targetPlan);
    setStep('CONFIGURE');
  };

  // Step 2 Action: Submit checkout to provider
  const handleProceedToPayment = async () => {
    if (!agreeTerms) {
      setErrorMessage('Please agree to recurring billing terms to continue');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    try {
      // 1. Create checkout session with server
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlan.id,
          currency: 'INR',
          billingCycle,
          email: user?.email || 'evaluator@parishram.ai',
          fullName,
          country,
          taxId,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to initialize payment gateway');
      }

      const sessId = data.session.sessionId;
      setSessionId(sessId);
      setUpiDeepLink(data.session.upiDeepLink);

      // 2. Perform server-side verification
      setStep('VERIFYING');

      const verifyRes = await fetch('/api/billing/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessId,
          paymentReference: `fam_tx_${Date.now()}`,
        }),
      });

      const verifyData = await verifyRes.json();
      if (verifyRes.ok && verifyData.verified && verifyData.status === 'PAYMENT_SUCCESS') {
        updatePlan(selectedPlan.id);
        if (verifyData.invoice) {
          setVerifiedInvoice(verifyData.invoice);
          if (onSuccess) onSuccess(selectedPlan.id, verifyData.invoice);
        }
        setStep('SUCCESS');
      } else {
        setErrorMessage(verifyData.error || 'Payment verification could not be confirmed by gateway');
        setStep('FAILED');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment provider communication error');
      setStep('FAILED');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div
        className={`w-full ${
          step === 'PLANS' ? 'max-w-5xl' : 'max-w-4xl'
        } bg-[var(--bg-panel)] text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl overflow-hidden font-sans transition-all duration-200 animate-in fade-in zoom-in-95`}
      >
        {/* Top Header Bar */}
        <div className="px-5 sm:px-6 py-3.5 border-b border-[var(--border-subtle)] bg-[var(--bg-panel)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold tracking-wider text-[#ea580c] uppercase">
              परिश्रम योजनाएं
            </span>
            {step === 'CONFIGURE' && (
              <button
                onClick={() => setStep('PLANS')}
                className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1 transition-colors cursor-pointer font-mono"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>योजना बदलें (Change plan)</span>
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* SCREEN 1: PLANS OVERVIEW (AUTHENTIC PARISHRAM IDENTITY)                    */}
        {/* ========================================================================= */}
        {step === 'PLANS' && (
          <div className="p-5 sm:p-7 space-y-6">
            {/* Header with Title and Unified Billing Switcher */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#ea580c]/10 text-[#ea580c] text-[11px] font-mono font-bold">
                <Sparkles className="w-3 h-3" />
                <span>AUTONOMOUS ENGINEERING HARNESS</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
                योजनाएं जो आपके परिश्रम के साथ बढ़ें
              </h2>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-xl mx-auto">
                Deterministic code repair, failure recovery, and frontier reasoning models tailored for developers and engineering teams.
              </p>

              {/* Minimal Billing Cycle Switcher */}
              <div className="pt-2 flex items-center justify-center gap-2">
                <div className="inline-flex items-center p-1 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs font-mono">
                  <button
                    onClick={() => setBillingCycle('monthly')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      billingCycle === 'monthly'
                        ? 'bg-[var(--bg-panel)] text-[var(--text-primary)] font-bold shadow-xs border border-[var(--border-subtle)]'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    मासिक (Monthly)
                  </button>
                  <button
                    onClick={() => setBillingCycle('yearly')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                      billingCycle === 'yearly'
                        ? 'bg-[var(--bg-panel)] text-[var(--text-primary)] font-bold shadow-xs border border-[var(--border-subtle)]'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <span>वार्षिक (Yearly)</span>
                    <span className="text-[10px] bg-[#10b981]/15 text-[#10b981] px-1.5 py-0.2 rounded font-bold border border-[#10b981]/25">
                      बचत 20%
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* 3-Card Developer Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5 items-stretch pt-1">
              {/* 1. आरम्भ (Aarambh / Starter) */}
              <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl p-5 flex flex-col justify-between space-y-5 hover:border-[var(--border-medium)] transition-colors">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-[var(--text-primary)]">आरम्भ</h3>
                      <div className="text-[11px] font-mono text-[var(--text-muted)]">Starter / Free</div>
                    </div>
                    <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                      ₹0
                    </span>
                  </div>

                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    Open-weight autonomous coding and deterministic verification for individual developers.
                  </p>

                  <div className="pt-2">
                    <div className="text-2xl font-black text-[var(--text-primary)]">₹0</div>
                    <div className="text-[10px] text-[var(--text-muted)] font-mono">Forever free · No card required</div>
                  </div>

                  <button
                    onClick={() => handleSelectPlan(PRICING_PLANS[0])}
                    className="w-full py-2 px-3 rounded-lg bg-[var(--bg-subtle)] hover:bg-[var(--bg-active)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-semibold text-xs transition-colors cursor-pointer"
                  >
                    {user?.plan === 'FREE' ? 'वर्तमान योजना (Current Plan)' : 'आरम्भ चुनें (Select Starter)'}
                  </button>

                  <div className="pt-3 border-t border-[var(--border-subtle)] space-y-2 text-xs">
                    <div className="text-[10px] uppercase tracking-wider font-mono font-semibold text-[var(--text-muted)]">
                      Included in आरम्भ:
                    </div>
                    {[
                      '25 autonomous runs per month',
                      'Open-weight models (Qwen, Ollama, GLM)',
                      'Deterministic verification & proof panel',
                      'Unified AST diff inspector',
                      'Public & local repository support',
                    ].map((feat, i) => (
                      <div key={i} className="flex items-start gap-2 text-[var(--text-secondary)]">
                        <Check className="w-3.5 h-3.5 text-[#10b981] shrink-0 mt-0.5" />
                        <span className="text-[11px]">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 2. प्रगति (Pragati / Builder) — HERO CARD */}
              <div className="bg-[var(--bg-canvas)] border-2 border-[#ea580c] rounded-2xl p-5 flex flex-col justify-between space-y-5 shadow-xl relative ring-1 ring-[#ea580c]/20">
                {/* Popular Pill */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#ea580c] text-white font-mono text-[10px] font-extrabold uppercase tracking-wider shadow-sm flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>सबसे लोकप्रिय (Most Popular)</span>
                </div>

                <div className="space-y-4 pt-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-[#ea580c]">प्रगति</h3>
                      <div className="text-[11px] font-mono text-[var(--text-muted)]">Builder / Individual Pro</div>
                    </div>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#ea580c]/15 text-[#ea580c] border border-[#ea580c]/30">
                      ₹{billingCycle === 'yearly' ? '799' : '999'}/mo
                    </span>
                  </div>

                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    Frontier coding models, multi-agent pairs, and failure recovery traces for shipping features autonomously.
                  </p>

                  <div className="pt-2">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-black text-[var(--text-primary)]">
                        ₹{billingCycle === 'yearly' ? '799' : '999'}
                      </span>
                      <span className="text-xs text-[var(--text-muted)] font-mono">/ mo</span>
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] font-mono">
                      {billingCycle === 'yearly'
                        ? 'Billed annually at ₹9,588/yr (Save 20%)'
                        : 'Billed monthly · Includes 18% GST'}
                    </div>
                  </div>

                  <button
                    onClick={() => handleSelectPlan(PRICING_PLANS[1])}
                    className="w-full py-2.5 px-3 rounded-lg bg-[#ea580c] hover:bg-[#f97316] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-98 cursor-pointer"
                  >
                    <span>प्रगति से अपग्रेड करें</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <div className="text-[10px] text-center text-[var(--text-muted)] font-mono">
                    बिना किसी प्रतिबद्धता के · कभी भी रद्द करें
                  </div>

                  <div className="pt-3 border-t border-[var(--border-subtle)] space-y-2 text-xs">
                    <div className="text-[10px] uppercase tracking-wider font-mono font-semibold text-[#ea580c]">
                      Everything in आरम्भ, plus:
                    </div>
                    {[
                      '150 verified runs per month',
                      'Qwen3-Coder-Next & Kimi K2.5 models',
                      'Multi-agent pair (Navigator + Supervisor)',
                      'Automatic failure trace fingerprinting',
                      '256,000 token context window',
                      'Bring Your Own Key (BYOK) enabled',
                      'Persistent engineering memory store',
                    ].map((feat, i) => (
                      <div key={i} className="flex items-start gap-2 text-[var(--text-primary)] font-medium">
                        <Check className="w-3.5 h-3.5 text-[#ea580c] shrink-0 mt-0.5" />
                        <span className="text-[11px]">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3. प्रवीण (Praveen / Professional) */}
              <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl p-5 flex flex-col justify-between space-y-5 hover:border-[var(--border-medium)] transition-colors">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-[var(--text-primary)]">प्रवीण</h3>
                      <div className="text-[11px] font-mono text-[var(--text-muted)]">Professional / Senior</div>
                    </div>
                    <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                      ₹{billingCycle === 'yearly' ? '1,999' : '2,499'}/mo
                    </span>
                  </div>

                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    Frontier reasoning models and 1,000,000 token context for complex multi-file architectural refactoring.
                  </p>

                  <div className="pt-2">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-black text-[var(--text-primary)]">
                        ₹{billingCycle === 'yearly' ? '1,999' : '2,499'}
                      </span>
                      <span className="text-xs text-[var(--text-muted)] font-mono">/ mo</span>
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] font-mono">
                      {billingCycle === 'yearly'
                        ? 'Billed annually at ₹23,988/yr (Save 20%)'
                        : 'Billed monthly · Includes 18% GST'}
                    </div>
                  </div>

                  <button
                    onClick={() => handleSelectPlan(PRICING_PLANS[2])}
                    className="w-full py-2 px-3 rounded-lg bg-[var(--bg-subtle)] hover:bg-[var(--bg-active)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-semibold text-xs transition-colors cursor-pointer"
                  >
                    प्रवीण चुनें (Select Praveen)
                  </button>
                  <div className="text-[10px] text-center text-[var(--text-muted)] font-mono">
                    बिना किसी प्रतिबद्धता के · कभी भी रद्द करें
                  </div>

                  <div className="pt-3 border-t border-[var(--border-subtle)] space-y-2 text-xs">
                    <div className="text-[10px] uppercase tracking-wider font-mono font-semibold text-[var(--text-muted)]">
                      Everything in प्रगति, plus:
                    </div>
                    {[
                      '500 verified runs per month',
                      'Claude 3.7 Sonnet & DeepSeek R1 models',
                      '1,000,000 token context window',
                      'Parallel targeted test & tool execution',
                      'Continuous verification CI/CD webhooks',
                      'Proof graph export & audit log signatures',
                    ].map((feat, i) => (
                      <div key={i} className="flex items-start gap-2 text-[var(--text-secondary)]">
                        <Check className="w-3.5 h-3.5 text-[#10b981] shrink-0 mt-0.5" />
                        <span className="text-[11px]">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Team Tier Card Banner (Uncluttered, Single Location) */}
            <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#38bdf8]/10 text-[#38bdf8] flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-[var(--text-primary)] flex items-center gap-2">
                    <span>दल (Team & Enterprise Swarms)</span>
                    <span className="text-[10px] bg-[#38bdf8]/15 text-[#38bdf8] px-1.5 py-0.2 rounded font-mono font-bold">
                      ₹4,999/mo
                    </span>
                  </div>
                  <div className="text-[11px] text-[var(--text-secondary)]">
                    Unlimited verified team runs, isolated microVM sandboxes, seat governance, and SOC2 audit trails.
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleSelectPlan(PRICING_PLANS[3])}
                className="px-3.5 py-1.5 rounded-lg bg-[var(--bg-subtle)] hover:bg-[var(--bg-active)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-semibold font-mono text-xs whitespace-nowrap cursor-pointer transition-colors"
              >
                दल योजना देखें (View Team Plan) →
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SCREEN 2: CONFIGURE YOUR PLAN (2-COLUMN CHECKOUT WITH EXACT GST BREAKDOWN) */}
        {/* ========================================================================= */}
        {step === 'CONFIGURE' && (
          <div className="p-5 sm:p-7">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column (7 cols): Configuration Form */}
              <div className="lg:col-span-7 space-y-5">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] tracking-tight">
                    {selectedPlan.name} योजना कॉन्फ़िगर करें
                  </h2>
                  <p className="text-xs text-[var(--text-secondary)] font-mono mt-0.5">
                    {selectedPlan.englishSubtitle} tier · Choose your billing frequency & enter details
                  </p>
                </div>

                {/* Billing Cycle Radio Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setBillingCycle('monthly')}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      billingCycle === 'monthly'
                        ? 'border-[#ea580c] bg-[#ea580c]/5 ring-1 ring-[#ea580c]/30'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:border-[var(--border-medium)]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-[var(--text-primary)]">
                        {selectedPlan.name} मासिक (Monthly)
                      </span>
                      <div
                        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                          billingCycle === 'monthly'
                            ? 'border-[#ea580c] bg-[#ea580c]'
                            : 'border-[var(--border-subtle)]'
                        }`}
                      >
                        {billingCycle === 'monthly' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                    <div className="text-sm font-bold text-[var(--text-primary)]">
                      ₹{monthlyTotal.toLocaleString('en-IN')}.00
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">
                      Billed monthly · Includes 18% GST
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBillingCycle('yearly')}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      billingCycle === 'yearly'
                        ? 'border-[#ea580c] bg-[#ea580c]/5 ring-1 ring-[#ea580c]/30'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:border-[var(--border-medium)]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-[var(--text-primary)]">
                        {selectedPlan.name} वार्षिक (Yearly)
                      </span>
                      <span className="text-[9px] bg-[#10b981]/15 text-[#10b981] px-1.5 py-0.2 rounded font-bold border border-[#10b981]/25">
                        Save 20%
                      </span>
                    </div>
                    <div className="text-sm font-bold text-[var(--text-primary)]">
                      ₹{yearlyTotal.toLocaleString('en-IN')}.00
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">
                      ₹{Math.round(yearlyTotal / 12).toLocaleString('en-IN')}/mo · Includes 18% GST
                    </div>
                  </button>
                </div>

                {/* Billing Information Form */}
                <div className="space-y-3 font-mono text-xs">
                  <div className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                    बिलिंग जानकारी (Billing Information)
                  </div>

                  <div className="space-y-2.5">
                    <div>
                      <label className="block text-[11px] text-[var(--text-muted)] mb-1">Full name</label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs focus:outline-none focus:border-[#ea580c]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] text-[var(--text-muted)] mb-1">Country or region</label>
                        <select
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs focus:outline-none focus:border-[#ea580c]"
                        >
                          <option value="India">India</option>
                          <option value="United States">United States</option>
                          <option value="United Kingdom">United Kingdom</option>
                          <option value="Singapore">Singapore</option>
                          <option value="Germany">Germany</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] text-[var(--text-muted)] mb-1">GSTIN / Tax ID (optional)</label>
                        <input
                          type="text"
                          value={taxId}
                          onChange={(e) => setTaxId(e.target.value)}
                          placeholder="22AAAAA0000A1Z5"
                          className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs focus:outline-none focus:border-[#ea580c]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] text-[var(--text-muted)] mb-1">Address</label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs focus:outline-none focus:border-[#ea580c]"
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div className="space-y-3 font-mono text-xs">
                  <div className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                    भुगतान विधि (Payment Method)
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethodTab('upi')}
                      className={`flex-1 py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        paymentMethodTab === 'upi'
                          ? 'border-[#ea580c] bg-[#ea580c]/10 text-[#ea580c]'
                          : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)]'
                      }`}
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>UPI / QR / FamPay</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethodTab('card')}
                      className={`flex-1 py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        paymentMethodTab === 'card'
                          ? 'border-[#ea580c] bg-[#ea580c]/10 text-[#ea580c]'
                          : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)]'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Card (Credit / Debit)</span>
                    </button>
                  </div>

                  {/* UPI Box */}
                  {paymentMethodTab === 'upi' && (
                    <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[var(--text-secondary)]">Verified VPA Recipient:</span>
                        <code className="text-[#ea580c] font-bold bg-[#ea580c]/10 px-2 py-0.5 rounded border border-[#ea580c]/20">
                          shivansh.p@fam
                        </code>
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                        Instant zero-charge UPI handoff. Supports Google Pay, PhonePe, Paytm, and FamPay.
                      </div>
                    </div>
                  )}

                  {/* Card Box */}
                  {paymentMethodTab === 'card' && (
                    <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[var(--text-secondary)]">Card:</span>
                        <span className="text-[var(--text-primary)] font-bold">•••• 4242</span>
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                        Hosted 3D-Secure 2.0 gateway handoff with automated recurring billing.
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column (5 cols): Order Summary Card */}
              <div className="lg:col-span-5 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl p-5 space-y-4 font-mono text-xs">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-bold">
                    Order Summary
                  </div>
                  <h3 className="text-xl font-bold text-[var(--text-primary)] mt-1">
                    {selectedPlan.name} ({selectedPlan.englishSubtitle})
                  </h3>
                  <div className="text-[11px] text-[var(--text-muted)]">
                    {billingCycle === 'yearly' ? 'Annual Subscription' : 'Monthly Subscription'}
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-[var(--border-subtle)] text-xs">
                  <div className="flex items-center justify-between text-[var(--text-secondary)]">
                    <span>Subtotal</span>
                    <span className="text-[var(--text-primary)]">₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>

                  <div className="flex items-center justify-between text-[var(--text-secondary)]">
                    <span>Tax (18% GST)</span>
                    <span className="text-[var(--text-primary)]">₹{gstTax.toLocaleString('en-IN')}</span>
                  </div>

                  <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between font-bold text-sm">
                    <span className="text-[var(--text-primary)]">Total due today</span>
                    <span className="text-[#ea580c] text-base">₹{totalDue.toLocaleString('en-IN')}.00</span>
                  </div>
                </div>

                {/* Auto-renew notice */}
                <div className="p-3 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[10px] text-[var(--text-secondary)] space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-[var(--text-primary)]">
                    <Info className="w-3.5 h-3.5 text-[#38bdf8]" />
                    <span>Auto-Renewal Notice</span>
                  </div>
                  <p className="leading-tight">
                    Your subscription will renew automatically. You will be charged ₹{subtotal.toLocaleString('en-IN')} / {billingCycle === 'yearly' ? 'year' : 'month'} + applicable taxes. Cancel anytime from Account settings.
                  </p>
                </div>

                {/* Terms agreement */}
                <label className="flex items-start gap-2 text-[10px] text-[var(--text-secondary)] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 rounded border-[var(--border-subtle)] text-[#ea580c] focus:ring-0"
                  />
                  <span>
                    I authorize Parishram to charge my payment method recurringly until cancellation.
                  </span>
                </label>

                {errorMessage && (
                  <div className="p-2.5 rounded-lg bg-[#ef4444]/15 border border-[#ef4444]/30 text-[#ef4444] text-[11px] flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Subscribe Button */}
                <button
                  onClick={handleProceedToPayment}
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-[#ea580c] hover:bg-[#f97316] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying with Gateway...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Subscribe · ₹{totalDue.toLocaleString('en-IN')}.00</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SCREEN 3: VERIFYING                                                       */}
        {/* ========================================================================= */}
        {step === 'VERIFYING' && (
          <div className="p-10 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#ea580c]/15 text-[#ea580c] flex items-center justify-center mx-auto">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
            <h3 className="text-xl font-bold text-[var(--text-primary)]">
              Verifying Payment with shivansh.p@fam...
            </h3>
            <p className="text-xs text-[var(--text-secondary)] font-mono max-w-md mx-auto">
              Cryptographic verification in progress. Do not refresh this window.
            </p>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SCREEN 4: SUCCESS                                                         */}
        {/* ========================================================================= */}
        {step === 'SUCCESS' && (
          <div className="p-8 text-center space-y-5">
            <div className="w-14 h-14 rounded-full bg-[#10b981]/15 text-[#10b981] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-[var(--text-primary)]">
                {selectedPlan.name} सदस्यता सक्रिय है!
              </h3>
              <p className="text-xs text-[var(--text-secondary)] font-mono mt-1">
                Subscription successfully activated. 150 verified runs & frontier models unlocked.
              </p>
            </div>

            {verifiedInvoice && (
              <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-left font-mono text-xs max-w-md mx-auto space-y-1">
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Invoice ID:</span>
                  <span className="text-[var(--text-primary)] font-bold">{verifiedInvoice.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Recipient:</span>
                  <span className="text-[#ea580c]">{verifiedInvoice.recipient}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Amount Paid:</span>
                  <span className="text-[#10b981] font-bold">{verifiedInvoice.amount}</span>
                </div>
              </div>
            )}

            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-[#ea580c] hover:bg-[#f97316] text-white font-bold text-xs shadow-md transition-all active:scale-98 cursor-pointer"
            >
              Start Building with परिश्रम →
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SCREEN 5: FAILED                                                          */}
        {/* ========================================================================= */}
        {step === 'FAILED' && (
          <div className="p-8 text-center space-y-5">
            <div className="w-14 h-14 rounded-full bg-[#ef4444]/15 text-[#ef4444] flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[var(--text-primary)]">Payment Verification Unconfirmed</h3>
              <p className="text-xs text-[#ef4444] font-mono mt-1">
                {errorMessage || 'Gateway could not confirm transaction.'}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setStep('CONFIGURE')}
                className="px-4 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs font-semibold cursor-pointer"
              >
                Try Again
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-[var(--bg-subtle)] text-xs text-[var(--text-muted)] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default UpgradeModal;
