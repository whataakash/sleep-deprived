'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
    activeInitialPlan || PRICING_PLANS[1] // Default to Pro
  );
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>(defaultCycle);

  // Billing details form
  const [fullName, setFullName] = useState(user?.name || 'Developer');
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

  // Prevent background page scrolling while modal is open
  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen]);

  // Keyboard accessibility: Escape key closes modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="upgrade-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Subscription Plans"
        >
          <motion.div
            key="upgrade-modal-shell"
            initial={{ opacity: 0, y: 10, scale: 0.995 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.995 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-4xl max-h-[92dvh] sm:max-h-[90dvh] flex flex-col bg-[var(--bg-panel)] text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl overflow-hidden font-sans"
          >
            {/* Top Header Bar — ALWAYS STICKY & CLOSE BUTTON ALWAYS ACCESSIBLE */}
            <div className="px-4 sm:px-6 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-panel)] flex items-center justify-between shrink-0 z-10">
              <div className="flex items-center gap-2.5">
                <span className="text-[11px] font-mono font-bold tracking-wider text-[#ea580c] uppercase">
                  Subscription Plans
                </span>
                {step === 'CONFIGURE' && (
                  <button
                    onClick={() => setStep('PLANS')}
                    className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1 transition-colors cursor-pointer font-mono px-2 py-1 rounded"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Change Plan</span>
                  </button>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 -mr-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center"
                title="Close"
                aria-label="Close subscription plans modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Modal Content */}
            <div className="flex-1 overflow-y-auto overscroll-contain min-h-0">
              {/* ========================================================================= */}
              {/* SCREEN 1: PLANS OVERVIEW (AUTHENTIC PARISHRAM IDENTITY)                    */}
              {/* ========================================================================= */}
              {step === 'PLANS' && (
                <div className="p-4 sm:p-6 lg:p-7 space-y-4 sm:space-y-5">
                  {/* Header with Title and Segmented Switcher */}
                  <div className="text-center space-y-1 sm:space-y-1.5 max-w-xl mx-auto">
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
                      Plans that fit your work
                    </h2>
                    <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
                      Choose the setup that matches how you build.
                    </p>

                    {/* Toggles: Audience Segment and Billing Frequency */}
                    <div className="pt-2 flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
                      {/* Individual vs Team & Enterprise Segment */}
                      <div className="inline-flex items-center p-1 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs font-mono">
                        <button
                          onClick={() => setTierView('individual')}
                          className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                            tierView === 'individual'
                              ? 'bg-[var(--bg-panel)] text-[var(--text-primary)] font-bold shadow-xs border border-[var(--border-subtle)]'
                              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                          }`}
                        >
                          Individual
                        </button>
                        <button
                          onClick={() => setTierView('team')}
                          className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                            tierView === 'team'
                              ? 'bg-[var(--bg-panel)] text-[var(--text-primary)] font-bold shadow-xs border border-[var(--border-subtle)]'
                              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                          }`}
                        >
                          Team & Enterprise
                        </button>
                      </div>

                      {/* Minimal Billing Cycle Switcher */}
                      <div className="inline-flex items-center p-1 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs font-mono">
                        <button
                          onClick={() => setBillingCycle('monthly')}
                          className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                            billingCycle === 'monthly'
                              ? 'bg-[var(--bg-panel)] text-[var(--text-primary)] font-bold shadow-xs border border-[var(--border-subtle)]'
                              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                          }`}
                        >
                          Monthly
                        </button>
                        <button
                          onClick={() => setBillingCycle('yearly')}
                          className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                            billingCycle === 'yearly'
                              ? 'bg-[var(--bg-panel)] text-[var(--text-primary)] font-bold shadow-xs border border-[var(--border-subtle)]'
                              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                          }`}
                        >
                          <span>Yearly</span>
                          <span className="text-[10px] bg-[#10b981]/15 text-[#10b981] px-1.5 py-0.2 rounded font-bold border border-[#10b981]/25">
                            Save 20%
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Individual Plans View: Free, Pro, Max */}
                  <AnimatePresence mode="wait">
                    {tierView === 'individual' ? (
                      <motion.div
                        key="individual-tiers"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.16 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6 items-stretch pt-1 max-w-3xl mx-auto"
                      >
                {/* 1. Free */}
                <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl p-6 flex flex-col justify-between space-y-6 hover:border-[var(--border-medium)] transition-colors">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-[var(--text-primary)]">Free</h3>
                        <div className="text-[11px] font-mono text-[var(--text-muted)]">Personal exploration</div>
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
                      className="w-full py-2.5 px-3 rounded-lg bg-[var(--bg-subtle)] hover:bg-[var(--bg-active)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-semibold text-xs transition-colors cursor-pointer"
                    >
                      {user?.plan === 'FREE' ? 'Current Plan' : 'Select Free'}
                    </button>

                    <div className="pt-3 border-t border-[var(--border-subtle)] space-y-2 text-xs">
                      <div className="text-[10px] uppercase tracking-wider font-mono font-semibold text-[var(--text-muted)]">
                        Included in Free:
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

                {/* 2. Pro — HERO CARD */}
                <div className="bg-[var(--bg-canvas)] border-2 border-[#ea580c] rounded-2xl p-6 flex flex-col justify-between space-y-6 shadow-xl relative ring-1 ring-[#ea580c]/20">
                  {/* Popular Pill */}
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#ea580c] text-white font-mono text-[10px] font-extrabold uppercase tracking-wider shadow-sm flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Most Popular</span>
                  </div>

                  <div className="space-y-4 pt-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-[#ea580c]">Pro</h3>
                        <div className="text-[11px] font-mono text-[var(--text-muted)]">Individual Pro</div>
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
                          ? 'Billed annually at ₹9,588/yr · Taxes included'
                          : 'Billed monthly · Taxes included'}
                      </div>
                    </div>

                    <button
                      onClick={() => handleSelectPlan(PRICING_PLANS[1])}
                      className="w-full py-2.5 px-3 rounded-lg bg-[#ea580c] hover:bg-[#f97316] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-98 cursor-pointer"
                    >
                      <span>Upgrade to Pro</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <div className="text-[10px] text-center text-[var(--text-muted)] font-mono">
                      No commitment · Cancel anytime
                    </div>

                    <div className="pt-3 border-t border-[var(--border-subtle)] space-y-2 text-xs">
                      <div className="text-[10px] uppercase tracking-wider font-mono font-semibold text-[#ea580c]">
                        Everything in Free, plus:
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
              </motion.div>
            ) : (
              <motion.div
                key="team-tiers"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.16 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6 items-stretch pt-1 max-w-3xl mx-auto"
              >
                {/* 1. Team Card */}
                <div className="bg-[var(--bg-elevated)] border-2 border-[#38bdf8]/40 hover:border-[#38bdf8] rounded-2xl p-6 flex flex-col justify-between space-y-5 transition-colors">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-bold text-[var(--text-primary)]">Team</h3>
                          <span className="text-[10px] bg-[#38bdf8]/15 text-[#38bdf8] px-2 py-0.5 rounded font-mono font-bold">
                            Collaborative
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-[var(--text-muted)] mt-0.5">
                          For engineering teams & swarms
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[var(--bg-subtle)] text-[#38bdf8] border border-[var(--border-subtle)]">
                        ₹{billingCycle === 'yearly' ? '3,999' : '4,999'}/mo
                      </span>
                    </div>

                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                      Unlimited verified team runs, isolated microVM sandboxes, seat governance, and SOC2 audit trails.
                    </p>

                    <div className="pt-2">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-black text-[var(--text-primary)]">
                          ₹{billingCycle === 'yearly' ? '3,999' : '4,999'}
                        </span>
                        <span className="text-xs text-[var(--text-muted)] font-mono">/ mo</span>
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)] font-mono">
                        {billingCycle === 'yearly'
                          ? 'Billed annually at ₹47,988/yr · Taxes included'
                          : 'Billed monthly · Taxes included'}
                      </div>
                    </div>

                    <button
                      onClick={() => handleSelectPlan(PRICING_PLANS[3])}
                      className="w-full py-2.5 px-3 rounded-lg bg-[#38bdf8] hover:bg-[#0ea5e9] text-black font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-98 cursor-pointer"
                    >
                      <span>Choose Team</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <div className="text-[10px] text-center text-[var(--text-muted)] font-mono">
                      Includes 5 developer seats · Cancel anytime
                    </div>

                    <div className="pt-3 border-t border-[var(--border-subtle)] space-y-2 text-xs">
                      <div className="text-[10px] uppercase tracking-wider font-mono font-semibold text-[#38bdf8]">
                        Included in Team:
                      </div>
                      {[
                        'Unlimited verified team runs',
                        'Isolated microVM container sandbox per run',
                        'Centralized team billing & seat governance',
                        'Role-based human-in-the-loop approval gates',
                        'SOC2 audit trails and secret isolation',
                        'Custom repository indexing & private models',
                        'Dedicated Slack / Discord alert bridge',
                      ].map((feat, i) => (
                        <div key={i} className="flex items-start gap-2 text-[var(--text-primary)] font-medium">
                          <Check className="w-3.5 h-3.5 text-[#38bdf8] shrink-0 mt-0.5" />
                          <span className="text-[11px]">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 2. Enterprise Card */}
                <div className="bg-[var(--bg-canvas)] border border-[var(--border-subtle)] hover:border-[var(--border-medium)] rounded-2xl p-6 flex flex-col justify-between space-y-5 transition-colors">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-bold text-[var(--text-primary)]">Enterprise</h3>
                          <span className="text-[10px] bg-[var(--bg-subtle)] text-[var(--text-secondary)] px-2 py-0.5 rounded font-mono font-semibold border border-[var(--border-subtle)]">
                            Custom
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-[var(--text-muted)] mt-0.5">
                          For scale & strict governance
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                      Custom deployments, air-gapped private VPCs, dedicated compute clusters, and 99.99% uptime SLAs.
                    </p>

                    <div className="pt-2">
                      <div className="text-3xl font-black text-[var(--text-primary)]">Custom</div>
                      <div className="text-[10px] text-[var(--text-muted)] font-mono">Tailored pricing & enterprise contract</div>
                    </div>

                    <button
                      onClick={() => {
                        window.open('mailto:enterprise@parishram.dev?subject=Parishram%20Enterprise%20Inquiry', '_blank');
                      }}
                      className="w-full py-2.5 px-3 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <span>Contact Sales</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <div className="text-[10px] text-center text-[var(--text-muted)] font-mono">
                      Custom MSAs, procurement & pilot support
                    </div>

                    <div className="pt-3 border-t border-[var(--border-subtle)] space-y-2 text-xs">
                      <div className="text-[10px] uppercase tracking-wider font-mono font-semibold text-[var(--text-muted)]">
                        Enterprise Capabilities:
                      </div>
                      {[
                        'Custom deployment & dedicated GPU clusters',
                        'Air-gapped VPC and on-premise execution',
                        'SSO / SAML 2.0 & SCIM directory sync',
                        'Custom model fine-tuning & domain adapters',
                        'Dedicated solutions architect & 99.99% SLA',
                        'Custom procurement, MSAs, and invoicing',
                      ].map((feat, i) => (
                        <div key={i} className="flex items-start gap-2 text-[var(--text-secondary)]">
                          <Check className="w-3.5 h-3.5 text-[#10b981] shrink-0 mt-0.5" />
                          <span className="text-[11px]">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
                    Configure {selectedPlan.name} Plan
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
                        {selectedPlan.name} Monthly
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
                      Billed monthly · Taxes included
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
                        {selectedPlan.name} Yearly
                      </span>
                      <span className="text-[9px] bg-[#10b981]/15 text-[#10b981] px-1.5 py-0.2 rounded font-bold border border-[#10b981]/25">
                        Save 20%
                      </span>
                    </div>
                    <div className="text-sm font-bold text-[var(--text-primary)]">
                      ₹{yearlyTotal.toLocaleString('en-IN')}.00
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">
                      ₹{Math.round(yearlyTotal / 12).toLocaleString('en-IN')}/mo · Taxes included
                    </div>
                  </button>
                </div>

                {/* Billing Information Form */}
                <div className="space-y-3 font-mono text-xs">
                  <div className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                    Billing Information
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
                    Payment Method
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
                        <span className="text-[var(--text-secondary)]">Payment Channel:</span>
                        <span className="text-[var(--text-primary)] font-bold">UPI AutoPay / QR</span>
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                        Instant zero-charge UPI handoff. Supports Google Pay, PhonePe, Paytm, and BHIM.
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

                <div className="pt-3 pb-1 border-t border-[var(--border-subtle)] flex items-center justify-between">
                  <div>
                    <span className="text-[var(--text-primary)] font-bold text-sm block">Total due today</span>
                    <span className="text-[10px] text-[var(--text-muted)] font-mono">Taxes included</span>
                  </div>
                  <span className="text-[#ea580c] font-black text-lg">₹{totalDue.toLocaleString('en-IN')}.00</span>
                </div>

                {/* Auto-renew notice */}
                <div className="p-3 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[10px] text-[var(--text-secondary)] space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-[var(--text-primary)]">
                    <Info className="w-3.5 h-3.5 text-[#38bdf8]" />
                    <span>Auto-Renewal Notice</span>
                  </div>
                  <p className="leading-tight">
                    Your subscription will renew automatically. You will be charged ₹{totalDue.toLocaleString('en-IN')} / {billingCycle === 'yearly' ? 'year' : 'month'} (taxes included). Cancel anytime from Account settings.
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
              Verifying Payment with Gateway...
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
                {selectedPlan.name} Subscription Active!
              </h3>
              <p className="text-xs text-[var(--text-secondary)] font-mono mt-1">
                Subscription successfully activated. 150 verified runs & frontier models unlocked.
              </p>
            </div>

            {verifiedInvoice && (
              <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-left font-mono text-xs max-w-md mx-auto space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Invoice ID:</span>
                  <span className="text-[var(--text-primary)] font-bold">{verifiedInvoice.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Plan:</span>
                  <span className="text-[#ea580c] font-semibold">{selectedPlan.name} ({selectedPlan.englishSubtitle})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Amount Paid:</span>
                  <span className="text-[#10b981] font-bold">{verifiedInvoice.amount} (Taxes included)</span>
                </div>
              </div>
            )}

            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-[#ea580c] hover:bg-[#f97316] text-white font-bold text-xs shadow-md transition-all active:scale-98 cursor-pointer"
            >
              Start Building with Parishram →
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
    </motion.div>
  </motion.div>
)}
</AnimatePresence>
  );
}

export default UpgradeModal;
