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

  // Audience toggle on Plans view: Individual vs Team/Enterprise
  const [audienceTab, setAudienceTab] = useState<'individual' | 'team'>('individual');

  // Plan & Billing Cycle selection
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan>(
    activeInitialPlan || PRICING_PLANS[1] // Default to Pro / प्रगति
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

  // Pricing calculations matching Claude's exact GST breakdown
  const monthlyTotal = selectedPlan.id === 'PRO' ? 7999 : selectedPlan.id === 'BUILDER' ? 2399 : selectedPlan.id === 'TEAM' ? 11999 : 0;
  const yearlyTotal = selectedPlan.id === 'PRO' ? 79990 : selectedPlan.id === 'BUILDER' ? 23999 : selectedPlan.id === 'TEAM' ? 119990 : 0;

  const totalDue = billingCycle === 'yearly' ? yearlyTotal : monthlyTotal;
  const subtotal = Number((totalDue / 1.18).toFixed(2));
  const gstTax = Number((totalDue - subtotal).toFixed(2));

  // Switch to Configure screen when a plan is clicked
  const handleSelectPlan = (plan: PricingPlan) => {
    if (plan.id === 'FREE') {
      updatePlan('FREE');
      onClose();
      return;
    }
    setSelectedPlan(plan);
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
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div
        className={`w-full ${
          step === 'PLANS' ? 'max-w-5xl' : 'max-w-4xl'
        } bg-[#141517] border border-[#27282d] rounded-2xl shadow-2xl overflow-hidden font-sans text-neutral-100 transition-all duration-200 animate-in fade-in zoom-in-95`}
      >
        {/* Top Header Bar */}
        <div className="px-6 py-4 border-b border-[#232429] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Upgrade
            </span>
            {step === 'CONFIGURE' && (
              <button
                onClick={() => setStep('PLANS')}
                className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Change plan</span>
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* SCREEN 1: PLANS THAT GROW WITH YOU (EXACT CLAUDE AESTHETIC)              */}
        {/* ========================================================================= */}
        {step === 'PLANS' && (
          <div className="p-6 sm:p-8 space-y-6">
            {/* Editorial Heading */}
            <div className="text-center space-y-4">
              <h2 className="font-serif text-3xl sm:text-4xl text-white font-normal tracking-tight">
                Plans that grow with you
              </h2>

              {/* Segmented Switcher: Individual vs Team/Enterprise */}
              <div className="inline-flex items-center p-1 rounded-xl bg-[#202226] border border-[#2d3036] text-xs font-medium">
                <button
                  onClick={() => setAudienceTab('individual')}
                  className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer ${
                    audienceTab === 'individual'
                      ? 'bg-[#31343b] text-white shadow-xs font-semibold'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Individual
                </button>
                <button
                  onClick={() => setAudienceTab('team')}
                  className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer ${
                    audienceTab === 'team'
                      ? 'bg-[#31343b] text-white shadow-xs font-semibold'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Team and Enterprise
                </button>
              </div>
            </div>

            {/* Individual 3-Card Grid */}
            {audienceTab === 'individual' ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch pt-2">
                {/* 1. Free Card */}
                <div className="bg-[#1b1c20] border border-[#2b2d33] rounded-2xl p-6 flex flex-col justify-between space-y-6 hover:border-[#383a42] transition-colors">
                  <div className="space-y-4">
                    {/* Geometric Node Icon */}
                    <div className="w-8 h-8 text-neutral-300">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
                        <circle cx="12" cy="5" r="2.5" />
                        <line x1="12" y1="7.5" x2="12" y2="17" />
                        <circle cx="6" cy="19" r="2" />
                        <circle cx="18" cy="19" r="2" />
                        <line x1="12" y1="12" x2="6" y2="17" />
                        <line x1="12" y1="12" x2="18" y2="17" />
                      </svg>
                    </div>

                    <div>
                      <div className="flex items-baseline gap-2">
                        <h3 className="text-xl font-bold text-white">Free</h3>
                        <span className="text-xs text-neutral-400">(आरम्भ)</span>
                      </div>
                      <p className="text-xs text-neutral-400 mt-0.5">Meet Parishram</p>
                    </div>

                    <div className="text-3xl font-extrabold text-white">
                      ₹0
                    </div>

                    <button
                      onClick={() => handleSelectPlan(PRICING_PLANS[0])}
                      className="w-full py-2.5 rounded-lg bg-[#26282e] hover:bg-[#30333a] text-white text-xs font-semibold transition-all cursor-pointer"
                    >
                      Use Parishram for free
                    </button>

                    <ul className="space-y-2.5 text-xs text-neutral-300 pt-2 border-t border-[#272930]">
                      <li className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                        <span>Chat on web, iOS, Android, and desktop</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                        <span>Generate code and visualize data</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                        <span>Connect GitHub and GitLab repositories</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                        <span>Extended thinking for complex work</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                        <span>25 autonomous verified runs / month</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                        <span>Built-in web search & repository context</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* 2. Pro Card (Hero / Highlighted) */}
                <div className="bg-[#1b1c20] border-2 border-[#3f424b] rounded-2xl p-6 flex flex-col justify-between space-y-6 relative shadow-2xl">
                  {/* Monthly / Yearly Toggle on card */}
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 text-white">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
                        <circle cx="12" cy="4" r="2" />
                        <line x1="12" y1="6" x2="12" y2="18" />
                        <circle cx="5" cy="11" r="2" />
                        <circle cx="19" cy="11" r="2" />
                        <circle cx="12" cy="20" r="2" />
                        <line x1="12" y1="11" x2="5" y2="11" />
                        <line x1="12" y1="11" x2="19" y2="11" />
                      </svg>
                    </div>

                    <div className="inline-flex p-0.5 rounded-full bg-[#111214] border border-[#2d2f36] text-[10px]">
                      <button
                        onClick={() => setBillingCycle('monthly')}
                        className={`px-2 py-0.5 rounded-full font-medium transition-colors cursor-pointer ${
                          billingCycle === 'monthly' ? 'bg-[#2b2d34] text-white font-bold' : 'text-neutral-400'
                        }`}
                      >
                        Monthly
                      </button>
                      <button
                        onClick={() => setBillingCycle('yearly')}
                        className={`px-2 py-0.5 rounded-full font-medium transition-colors cursor-pointer ${
                          billingCycle === 'yearly' ? 'bg-[#2b2d34] text-white font-bold' : 'text-neutral-400'
                        }`}
                      >
                        Yearly <span className="text-[#38bdf8] font-bold">· Save 17%</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex items-baseline gap-2">
                        <h3 className="text-xl font-bold text-white">Pro</h3>
                        <span className="text-xs text-[#ea580c] font-semibold">(प्रगति · Builder)</span>
                      </div>
                      <p className="text-xs text-neutral-400 mt-0.5">Research, code, and organize</p>
                    </div>

                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-extrabold text-white">
                          {billingCycle === 'yearly' ? '₹1,999' : '₹2,399'}
                        </span>
                        <span className="text-xs text-neutral-400">INR / month</span>
                      </div>
                      <div className="text-[11px] text-neutral-400 mt-0.5">
                        {billingCycle === 'yearly' ? 'billed annually ₹23,999 (includes GST)' : 'billed monthly (includes GST)'}
                      </div>
                    </div>

                    <div>
                      <button
                        onClick={() => handleSelectPlan(PRICING_PLANS[1])}
                        className="w-full py-2.5 rounded-lg bg-white hover:bg-neutral-100 text-black text-xs font-bold transition-all shadow-md active:scale-[0.99] cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <span>Get Pro plan</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                      <p className="text-[10px] text-neutral-400 text-center mt-1.5">
                        No commitment · Cancel anytime
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[#272930] space-y-2">
                      <div className="text-[11px] font-semibold text-neutral-200">
                        Everything in Free and:
                      </div>
                      <ul className="space-y-2 text-xs text-neutral-300">
                        <li className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-neutral-300 shrink-0 mt-0.5" />
                          <span>Parishram Code directly in your codebase</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-neutral-300 shrink-0 mt-0.5" />
                          <span>Power through tasks with multi-agent orchestration</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-neutral-300 shrink-0 mt-0.5" />
                          <span>Build and prototype with Autonomous Proof Harness</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-neutral-300 shrink-0 mt-0.5" />
                          <span>150 verified autonomous runs / month</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-neutral-300 shrink-0 mt-0.5" />
                          <span>Access to more coding models (Qwen3-Coder-Next, Kimi K2.5)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-neutral-300 shrink-0 mt-0.5" />
                          <span>Memory that carries across conversations & failure fingerprints</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* 3. Max Card */}
                <div className="bg-[#1b1c20] border border-[#2b2d33] rounded-2xl p-6 flex flex-col justify-between space-y-6 hover:border-[#383a42] transition-colors">
                  <div className="space-y-4">
                    <div className="w-8 h-8 text-neutral-300">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
                        <circle cx="12" cy="12" r="3" />
                        <circle cx="12" cy="4" r="1.5" />
                        <circle cx="20" cy="12" r="1.5" />
                        <circle cx="12" cy="20" r="1.5" />
                        <circle cx="4" cy="12" r="1.5" />
                        <line x1="12" y1="5.5" x2="12" y2="9" />
                        <line x1="18.5" y1="12" x2="15" y2="12" />
                        <line x1="12" y1="18.5" x2="12" y2="15" />
                        <line x1="5.5" y1="12" x2="9" y2="12" />
                      </svg>
                    </div>

                    <div>
                      <div className="flex items-baseline gap-2">
                        <h3 className="text-xl font-bold text-white">Max</h3>
                        <span className="text-xs text-neutral-400">(प्रवीण / दल)</span>
                      </div>
                      <p className="text-xs text-neutral-400 mt-0.5">Higher limits, priority access</p>
                    </div>

                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-extrabold text-white">From ₹11,999</span>
                      </div>
                      <div className="text-[11px] text-neutral-400 mt-0.5">
                        INR / month billed monthly (includes GST)
                      </div>
                    </div>

                    <div>
                      <button
                        onClick={() => handleSelectPlan(PRICING_PLANS[2])}
                        className="w-full py-2.5 rounded-lg bg-white hover:bg-neutral-100 text-black text-xs font-bold transition-all shadow-md active:scale-[0.99] cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <span>Get Max plan</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                      <p className="text-[10px] text-neutral-400 text-center mt-1.5">
                        No commitment · Cancel anytime
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[#272930] space-y-2">
                      <div className="text-[11px] font-semibold text-neutral-200">
                        Everything in Pro, plus:
                      </div>
                      <ul className="space-y-2 text-xs text-neutral-300">
                        <li className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-neutral-300 shrink-0 mt-0.5" />
                          <span>Up to 20x more usage than Pro*</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-neutral-300 shrink-0 mt-0.5" />
                          <span>Recommended for Parishram Code & Swarms</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-neutral-300 shrink-0 mt-0.5" />
                          <span>Early access to advanced agent features</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-neutral-300 shrink-0 mt-0.5" />
                          <span>1,000,000 token context window budget</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-neutral-300 shrink-0 mt-0.5" />
                          <span>Centralized team billing & seat governance</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Team and Enterprise Tab */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 max-w-4xl mx-auto">
                <div className="bg-[#1b1c20] border-2 border-[#3f424b] rounded-2xl p-6 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-bold text-white">Team (दल)</h3>
                      <p className="text-xs text-neutral-400 mt-0.5">Centralized governance for engineering squads</p>
                    </div>
                    <div className="text-3xl font-extrabold text-white">
                      ₹2,999 <span className="text-xs font-normal text-neutral-400">/ user / month</span>
                    </div>
                    <button
                      onClick={() => handleSelectPlan(PRICING_PLANS[3])}
                      className="w-full py-2.5 rounded-lg bg-white hover:bg-neutral-100 text-black text-xs font-bold transition-all shadow-md cursor-pointer"
                    >
                      Get Team plan
                    </button>
                    <ul className="space-y-2 text-xs text-neutral-300 pt-2 border-t border-[#272930]">
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-[#10b981]" />
                        <span>Unlimited verified team runs</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-[#10b981]" />
                        <span>Isolated microVM container sandbox per run</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-[#10b981]" />
                        <span>Human-in-the-loop approval gates</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="bg-[#1b1c20] border border-[#2b2d33] rounded-2xl p-6 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-bold text-white">Enterprise</h3>
                      <p className="text-xs text-neutral-400 mt-0.5">Zero-data-retention & dedicated VPC clusters</p>
                    </div>
                    <div className="text-2xl font-extrabold text-white">Custom Pricing</div>
                    <a
                      href="mailto:shivansh.p@fam?subject=Parishram%20Enterprise%20Inquiry"
                      className="w-full py-2.5 rounded-lg bg-[#26282e] hover:bg-[#30333a] text-white text-xs font-bold transition-all text-center block cursor-pointer"
                    >
                      Contact Sales
                    </a>
                    <ul className="space-y-2 text-xs text-neutral-300 pt-2 border-t border-[#272930]">
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-[#38bdf8]" />
                        <span>Dedicated private GPU clusters</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-[#38bdf8]" />
                        <span>SOC2 Type II compliance & custom SLA</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* SCREEN 2: CONFIGURE YOUR PLAN (EXACT SCREENSHOT 2 RECREATION)             */}
        {/* ========================================================================= */}
        {step === 'CONFIGURE' && (
          <div className="p-6 sm:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Configure form & inputs (col-span-7) */}
              <div className="lg:col-span-7 space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">
                    Configure your plan
                  </h2>
                </div>

                {/* Plan Toggle Selection Cards (Side-by-Side with Radio Button) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Monthly Option */}
                  <div
                    onClick={() => setBillingCycle('monthly')}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      billingCycle === 'monthly'
                        ? 'border-blue-500 bg-blue-950/20 ring-1 ring-blue-500/50'
                        : 'border-[#292b32] bg-[#191a1e] hover:border-[#383a42]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            billingCycle === 'monthly'
                              ? 'border-blue-500 bg-blue-600'
                              : 'border-neutral-500 bg-transparent'
                          }`}
                        >
                          {billingCycle === 'monthly' && (
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="font-semibold text-white text-sm">
                          {selectedPlan.name} monthly
                        </div>
                        <div className="text-xs text-neutral-300 mt-1">
                          INR {monthlyTotal.toLocaleString()}.00 <span className="text-neutral-400">(includes GST)</span>
                        </div>
                        <div className="text-[11px] text-neutral-400 mt-1">
                          Billed monthly
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Annual Option (Save 17%) */}
                  <div
                    onClick={() => setBillingCycle('yearly')}
                    className={`p-4 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                      billingCycle === 'yearly'
                        ? 'border-blue-500 bg-blue-950/20 ring-1 ring-blue-500/50'
                        : 'border-[#292b32] bg-[#191a1e] hover:border-[#383a42]'
                    }`}
                  >
                    <div className="absolute top-3 right-3">
                      <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold">
                        Save 17%
                      </span>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            billingCycle === 'yearly'
                              ? 'border-blue-500 bg-blue-600'
                              : 'border-neutral-500 bg-transparent'
                          }`}
                        >
                          {billingCycle === 'yearly' && (
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="font-semibold text-white text-sm">
                          {selectedPlan.name} annual
                        </div>
                        <div className="text-xs text-neutral-300 mt-1">
                          INR {yearlyTotal.toLocaleString()}.00 <span className="text-neutral-400">(includes GST)</span>
                        </div>
                        <div className="text-[11px] text-neutral-400 mt-1">
                          Billed yearly
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Billing information */}
                <div className="space-y-4 pt-2">
                  <h3 className="font-semibold text-sm text-neutral-200">
                    Billing information
                  </h3>

                  <div>
                    <label className="text-[11px] text-neutral-400 block mb-1.5 font-medium">
                      Full name
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-lg bg-[#111215] border border-[#2b2d35] text-white text-xs outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-neutral-400 block mb-1.5 font-medium">
                      Country or region
                    </label>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-lg bg-[#111215] border border-[#2b2d35] text-white text-xs outline-none focus:border-blue-500 transition-colors cursor-pointer"
                    >
                      <option value="India">India</option>
                      <option value="United States">United States</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Germany">Germany</option>
                      <option value="Singapore">Singapore</option>
                      <option value="Canada">Canada</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-neutral-400 block mb-1.5 font-medium">
                      Address
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-lg bg-[#111215] border border-[#2b2d35] text-white text-xs outline-none focus:border-blue-500 transition-colors"
                      placeholder="Street address, City, Postal Code"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-neutral-400 block mb-1.5 font-medium">
                      Business name
                    </label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-lg bg-[#111215] border border-[#2b2d35] text-white text-xs outline-none focus:border-blue-500 transition-colors"
                      placeholder="Company (optional)"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-neutral-400 block mb-1.5 font-medium">
                        Tax ID type
                      </label>
                      <select
                        value={taxIdType}
                        onChange={(e) => setTaxIdType(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-lg bg-[#111215] border border-[#2b2d35] text-white text-xs outline-none focus:border-blue-500 transition-colors cursor-pointer"
                      >
                        <option value="India (IN GST)">India (IN GST)</option>
                        <option value="PAN Number">PAN Number</option>
                        <option value="VAT / Tax Exemption">VAT / Tax Exemption</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] text-neutral-400 block mb-1.5 font-medium">
                        Tax ID
                      </label>
                      <input
                        type="text"
                        value={taxId}
                        onChange={(e) => setTaxId(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-lg bg-[#111215] border border-[#2b2d35] text-white text-xs outline-none focus:border-blue-500 transition-colors"
                        placeholder="22AAAAA0000A1Z5 (optional)"
                      />
                    </div>
                  </div>

                  <div className="pt-1">
                    <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={useDifferentInvoiceName}
                        onChange={(e) => setUseDifferentInvoiceName(e.target.checked)}
                        className="accent-blue-600 rounded"
                      />
                      <span>Use a different name on invoices (optional)</span>
                    </label>
                    {useDifferentInvoiceName && (
                      <input
                        type="text"
                        value={invoiceName}
                        onChange={(e) => setInvoiceName(e.target.value)}
                        className="mt-2 w-full px-3.5 py-2 rounded-lg bg-[#111215] border border-[#2b2d35] text-white text-xs outline-none focus:border-blue-500 transition-colors"
                        placeholder="Invoice recipient / entity name"
                      />
                    )}
                  </div>
                </div>

                {/* Payment method section */}
                <div className="space-y-4 pt-2">
                  <h3 className="font-semibold text-sm text-neutral-200">
                    Payment method
                  </h3>

                  {/* Payment method tabs */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPaymentMethodTab('upi')}
                      className={`flex-1 py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        paymentMethodTab === 'upi'
                          ? 'border-blue-500 bg-blue-950/20 text-white'
                          : 'border-[#2a2c33] bg-[#141517] text-neutral-400 hover:text-white'
                      }`}
                    >
                      <QrCode className="w-3.5 h-3.5 text-[#38bdf8]" />
                      <span>UPI & Instant App (FamPay / QR)</span>
                    </button>
                    <button
                      onClick={() => setPaymentMethodTab('card')}
                      className={`flex-1 py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        paymentMethodTab === 'card'
                          ? 'border-blue-500 bg-blue-950/20 text-white'
                          : 'border-[#2a2c33] bg-[#141517] text-neutral-400 hover:text-white'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Credit / Debit Card</span>
                    </button>
                  </div>

                  {paymentMethodTab === 'upi' ? (
                    <div className="p-4 rounded-xl bg-[#111215] border border-[#282a32] space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-neutral-400">Verified Recipient VPA:</span>
                        <code className="text-[#ea580c] font-bold bg-[#ea580c]/10 px-2 py-0.5 rounded">
                          shivansh.p@fam
                        </code>
                      </div>
                      <p className="text-[11px] text-neutral-400 leading-relaxed">
                        Instant zero-surcharge checkout supported via any UPI application (FamPay, Google Pay, PhonePe, Paytm). An official transaction reference will be sealed on your server invoice.
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-[#111215] border border-[#282a32] space-y-3">
                      <div>
                        <label className="text-[11px] text-neutral-400 block mb-1 font-medium">Card number</label>
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-lg bg-[#18191c] border border-[#2b2d35] text-white text-xs outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] text-neutral-400 block mb-1 font-medium">Expires</label>
                          <input
                            type="text"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-lg bg-[#18191c] border border-[#2b2d35] text-white text-xs outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-neutral-400 block mb-1 font-medium">CVC</label>
                          <input
                            type="text"
                            value={cardCvc}
                            onChange={(e) => setCardCvc(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-lg bg-[#18191c] border border-[#2b2d35] text-white text-xs outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Sticky Order Summary (col-span-5) */}
              <div className="lg:col-span-5 sticky top-6">
                <div className="bg-[#1a1b1f] border border-[#2d2f36] rounded-2xl p-6 space-y-5 shadow-xl">
                  {/* Plan Name in Serif Typography */}
                  <div>
                    <h3 className="font-serif text-2xl font-normal text-white">
                      {selectedPlan.name} plan
                    </h3>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {selectedPlan.englishSubtitle} tier for autonomous engineering
                    </p>
                  </div>

                  {/* Pricing Breakdown matching exact numbers */}
                  <div className="space-y-2.5 text-xs pt-3 border-t border-[#272930]">
                    <div className="flex justify-between text-neutral-300">
                      <span>{selectedPlan.name} {billingCycle}</span>
                      <span className="font-mono">₹{subtotal.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between text-neutral-300">
                      <span>Subtotal</span>
                      <span className="font-mono">₹{subtotal.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between text-neutral-300">
                      <span>Tax (18% GST)</span>
                      <span className="font-mono">₹{gstTax.toLocaleString()}</span>
                    </div>

                    <div className="pt-2.5 border-t border-[#272930] flex justify-between items-baseline">
                      <span className="font-bold text-white text-sm">Total due today</span>
                      <span className="font-bold text-white text-lg font-mono">
                        ₹{totalDue.toLocaleString()}.00
                      </span>
                    </div>
                  </div>

                  {/* Renewal Notice Callout */}
                  <div className="p-3.5 rounded-xl bg-[#121316] border border-[#26282f] flex items-start gap-2.5 text-[11px] text-neutral-300">
                    <Info className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      Your subscription will auto-renew on 10/26/2026. You will be charged ₹{subtotal.toLocaleString()}/{billingCycle === 'yearly' ? 'year' : 'month'} + tax.
                    </p>
                  </div>

                  {/* Recurring Terms Checkbox */}
                  <div className="space-y-3">
                    <label className="flex items-start gap-2 text-[11px] text-neutral-400 cursor-pointer select-none leading-relaxed">
                      <input
                        type="checkbox"
                        checked={agreeTerms}
                        onChange={(e) => setAgreeTerms(e.target.checked)}
                        className="mt-0.5 accent-blue-600 rounded"
                      />
                      <span>
                        You agree that Parishram will charge your payment method in the amount above now and on a recurring {billingCycle} basis until you cancel in accordance with our terms. You can cancel at any time in your account settings.
                      </span>
                    </label>

                    {errorMessage && (
                      <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-800 text-red-300 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{errorMessage}</span>
                      </div>
                    )}

                    {/* Primary Subscribe CTA Button */}
                    <button
                      onClick={handleProceedToPayment}
                      disabled={loading || !agreeTerms}
                      className="w-full py-3 px-4 rounded-xl bg-neutral-200 hover:bg-white text-black font-bold text-sm transition-all shadow-lg active:scale-[0.99] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Routing to Secure Gateway...</span>
                        </>
                      ) : (
                        <span>Subscribe</span>
                      )}
                    </button>

                    <div className="flex items-center justify-center gap-2 text-[10px] text-neutral-500 text-center">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#10b981]" />
                      <span>Encrypted SSL Gateway • Verified destination: shivansh.p@fam</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SCREEN 3: VERIFYING GATEWAY TRANSIT                                      */}
        {/* ========================================================================= */}
        {step === 'VERIFYING' && (
          <div className="p-12 text-center space-y-4 max-w-md mx-auto">
            <Loader2 className="w-10 h-10 text-[#ea580c] animate-spin mx-auto" />
            <h3 className="text-lg font-bold text-white">
              Verifying Payment with Gateway
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Confirming transaction status with merchant recipient <code className="text-[#ea580c]">shivansh.p@fam</code>. This takes a brief moment...
            </p>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SCREEN 4: SUCCESS CONFIRMATION                                           */}
        {/* ========================================================================= */}
        {step === 'SUCCESS' && (
          <div className="p-8 sm:p-10 text-center space-y-6 max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-full bg-[#10b981]/20 border border-[#10b981]/40 flex items-center justify-center mx-auto text-[#10b981]">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-2xl font-serif text-white font-normal">
                Welcome to {selectedPlan.name} ({selectedPlan.englishSubtitle})
              </h3>
              <p className="text-xs text-neutral-400">
                Your Parishram workspace has been upgraded with full autonomous quotas and verified privileges.
              </p>
            </div>

            {verifiedInvoice && (
              <div className="p-4 rounded-xl bg-[#1a1b1f] border border-[#2b2d34] text-left space-y-2 text-xs">
                <div className="flex justify-between text-neutral-400">
                  <span>Invoice ID:</span>
                  <span className="font-mono text-white font-medium">{verifiedInvoice.id}</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Amount Paid:</span>
                  <span className="font-bold text-[#10b981] font-mono">{verifiedInvoice.amount}</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Merchant Destination:</span>
                  <span className="font-mono text-[#ea580c]">{verifiedInvoice.recipient}</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Method:</span>
                  <span className="text-white">{verifiedInvoice.paymentMethod}</span>
                </div>
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-white hover:bg-neutral-100 text-black font-bold text-sm transition-all cursor-pointer shadow-md"
            >
              Start Coding with {selectedPlan.name}
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SCREEN 5: FAILED / CANCELLED                                             */}
        {/* ========================================================================= */}
        {step === 'FAILED' && (
          <div className="p-8 text-center space-y-5 max-w-md mx-auto">
            <div className="w-12 h-12 rounded-full bg-red-950/40 border border-red-800 flex items-center justify-center mx-auto text-red-400">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Payment Incomplete</h3>
              <p className="text-xs text-neutral-400 mt-1">
                {errorMessage || 'The payment session could not be completed. No charges were deducted.'}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setStep('CONFIGURE')}
                className="flex-1 py-2.5 rounded-lg bg-white hover:bg-neutral-100 text-black text-xs font-bold transition-all cursor-pointer"
              >
                Try Again
              </button>
              <button
                onClick={onClose}
                className="py-2.5 px-4 rounded-lg bg-[#202227] hover:bg-[#2b2d34] text-neutral-300 text-xs font-medium cursor-pointer"
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

// Backwards-compatible CheckoutModal export
export const CheckoutModal = UpgradeModal;
