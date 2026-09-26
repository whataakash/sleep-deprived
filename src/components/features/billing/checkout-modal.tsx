'use client';

import React, { useState } from 'react';
import { PricingPlan, PaymentInvoice } from '@/types/billing';
import { useAuth } from '@/lib/auth/context';
import {
  X,
  ShieldCheck,
  Check,
  ArrowRight,
  ExternalLink,
  QrCode,
  CreditCard,
  Building2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
} from 'lucide-react';

interface CheckoutModalProps {
  plan: PricingPlan | null;
  currency: 'INR' | 'USD';
  billingCycle: 'monthly' | 'yearly';
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (planId: string, invoice: PaymentInvoice) => void;
}

type CheckoutStep = 'SUMMARY' | 'GATEWAY_HANDOFF' | 'VERIFYING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';

export function CheckoutModal({
  plan,
  currency,
  billingCycle,
  isOpen,
  onClose,
  onSuccess,
}: CheckoutModalProps) {
  const { session, updatePlan } = useAuth();
  const [step, setStep] = useState<CheckoutStep>('SUMMARY');
  const [loading, setLoading] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [upiDeepLink, setUpiDeepLink] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [verifiedInvoice, setVerifiedInvoice] = useState<PaymentInvoice | null>(null);

  if (!isOpen || !plan) return null;

  const price =
    currency === 'INR'
      ? billingCycle === 'yearly'
        ? `₹${plan.yearlyPriceInr.toLocaleString()}`
        : `₹${plan.monthlyPriceInr.toLocaleString()}`
      : billingCycle === 'yearly'
      ? `$${plan.yearlyPriceUsd}`
      : `$${plan.monthlyPriceUsd}`;

  // Step 1: Create session with backend provider
  const handleProceedToProvider = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          currency,
          billingCycle,
          email: session.user?.email || 'shivansh@devclub.in',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to initialize payment gateway');
      }

      setSessionId(data.session.sessionId);
      setUpiDeepLink(data.session.upiDeepLink);
      setStep('GATEWAY_HANDOFF');
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment provider communication error');
      setStep('FAILED');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Server-side verification
  const handleVerifyPayment = async () => {
    if (!sessionId) return;
    setStep('VERIFYING');
    setLoading(true);

    try {
      const res = await fetch('/api/billing/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          paymentReference: `fam_tx_${Date.now()}`,
        }),
      });

      const data = await res.json();
      if (res.ok && data.verified && data.status === 'PAYMENT_SUCCESS') {
        updatePlan(plan.id);
        if (data.invoice) {
          setVerifiedInvoice(data.invoice);
          if (onSuccess) onSuccess(plan.id, data.invoice);
        }
        setStep('SUCCESS');
      } else {
        setErrorMessage(data.error || 'Server payment verification was not approved');
        setStep('FAILED');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Verification failed');
      setStep('FAILED');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelPayment = async () => {
    if (sessionId) {
      await fetch('/api/billing/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, action: 'cancel' }),
      });
    }
    setStep('CANCELLED');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl shadow-2xl overflow-hidden font-mono text-xs text-[var(--text-primary)] animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="px-5 py-3.5 bg-[var(--bg-elevated)] border-b border-[var(--border-subtle)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#ea580c]" />
            <span className="font-bold text-sm tracking-tight text-[var(--text-primary)]">
              {step === 'SUMMARY' && `Upgrade to ${plan.name}`}
              {step === 'GATEWAY_HANDOFF' && 'Secure Payment Gateway'}
              {step === 'VERIFYING' && 'Verifying Payment...'}
              {step === 'SUCCESS' && 'Subscription Activated'}
              {step === 'FAILED' && 'Payment Incomplete'}
              {step === 'CANCELLED' && 'Payment Cancelled'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded bg-[var(--bg-subtle)] hover:bg-[var(--bg-active)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* STEP 1: PLAN SUMMARY */}
          {step === 'SUMMARY' && (
            <div className="space-y-5">
              <div className="border border-[var(--border-subtle)] rounded-lg p-4 bg-[var(--bg-canvas)] space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-semibold">
                      Selected Plan
                    </span>
                    <div className="text-xl font-black text-[var(--text-primary)] mt-0.5">
                      {plan.name}{' '}
                      <span className="text-xs font-normal text-[var(--text-secondary)]">
                        ({plan.englishSubtitle})
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-black text-[#ea580c]">{price}</div>
                    <span className="text-[10px] text-[var(--text-muted)]">
                      billed {billingCycle}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-[var(--border-subtle)] space-y-2">
                  <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-semibold">
                    Includes:
                  </div>
                  <ul className="space-y-1.5 text-[11px] text-[var(--text-secondary)] font-sans">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-[#10b981]" />
                      <span>{plan.runsLimitMonthly} verified autonomous agent runs / month</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-[#10b981]" />
                      <span>{(plan.contextLimitTokens / 1000).toFixed(0)}k token context window</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-[#10b981]" />
                      <span>{plan.maxParallelTools}x parallel tool & verification execution</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-[#10b981]" />
                      <span>Deterministic proof graph & full recovery trace</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Payment Destination Notice */}
              <div className="p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-start gap-2.5 text-[11px]">
                <ShieldCheck className="w-4 h-4 text-[#10b981] shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-semibold text-[var(--text-primary)]">
                    Official Merchant Destination: <code className="text-[#ea580c] font-bold">shivansh.p@fam</code>
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)]">
                    Payments are securely routed to the verified merchant endpoint. Card, UPI, and NetBanking supported via the official provider checkout.
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleProceedToProvider}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-md bg-[#ea580c] hover:bg-[#f97316] text-white font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-[0.99]"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Continue to Secure Checkout</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* STEP 2: OFFICIAL PROVIDER CHECKOUT (UPI / FamPay / Card) */}
          {step === 'GATEWAY_HANDOFF' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#10b981] animate-ping" />
                    <span className="text-[11px] font-bold text-[var(--text-primary)]">
                      Official Provider Payment Session
                    </span>
                  </div>
                  <span className="text-[10px] text-[var(--text-muted)]">Session: {sessionId?.slice(0, 14)}...</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px]">
                  <div>
                    <span className="text-[var(--text-muted)] block text-[10px]">Merchant:</span>
                    <span className="font-semibold text-[var(--text-primary)]">Parishram Dev</span>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)] block text-[10px]">Payable Recipient:</span>
                    <span className="font-bold text-[#ea580c]">shivansh.p@fam</span>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)] block text-[10px]">Total Amount:</span>
                    <span className="font-extrabold text-base text-[var(--text-primary)]">{price}</span>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)] block text-[10px]">Plan Tier:</span>
                    <span className="font-bold text-[#10b981]">{plan.name} ({plan.englishSubtitle})</span>
                  </div>
                </div>

                {/* UPI & Payment Options Info */}
                <div className="p-3 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-2">
                  <div className="flex items-center gap-2 text-[11px] font-bold text-[var(--text-primary)]">
                    <QrCode className="w-4 h-4 text-[#38bdf8]" />
                    <span>UPI & Instant App Checkout</span>
                  </div>
                  <div className="text-[10px] text-[var(--text-secondary)]">
                    Send to VPA <strong className="text-[var(--text-primary)]">shivansh.p@fam</strong> using any UPI app (FamPay, GPay, PhonePe, Paytm).
                  </div>
                  {upiDeepLink && (
                    <a
                      href={upiDeepLink}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[var(--bg-subtle)] hover:bg-[var(--bg-active)] text-[#38bdf8] text-[10px] font-bold transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Open in UPI App</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Provider Actions */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={handleVerifyPayment}
                  disabled={loading}
                  className="flex-1 py-2.5 px-4 rounded-md bg-[#10b981] hover:bg-[#059669] text-white font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify Payment with Gateway</span>
                </button>

                <button
                  onClick={handleCancelPayment}
                  className="py-2.5 px-3 rounded-md bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: VERIFYING STATE */}
          {step === 'VERIFYING' && (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
              <Loader2 className="w-8 h-8 text-[#ea580c] animate-spin" />
              <div className="font-bold text-sm text-[var(--text-primary)]">
                Server-side payment verification in progress
              </div>
              <p className="text-[11px] text-[var(--text-muted)] max-w-xs">
                Querying the official merchant gateway for transaction confirmation to <code className="text-[#ea580c]">shivansh.p@fam</code>...
              </p>
            </div>
          )}

          {/* STEP 4: SUCCESS CONFIRMATION */}
          {step === 'SUCCESS' && (
            <div className="py-4 space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-[#10b981]/20 border border-[#10b981]/40 flex items-center justify-center mx-auto text-[#10b981]">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[var(--text-primary)]">
                  Payment Verified Successfully!
                </h3>
                <p className="text-[11px] text-[var(--text-muted)] mt-1">
                  Your Parishram account has been upgraded to <strong className="text-[var(--text-primary)]">{plan.name} ({plan.englishSubtitle})</strong>.
                </p>
              </div>

              {verifiedInvoice && (
                <div className="p-3 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-left space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Invoice Number:</span>
                    <span className="font-bold text-[var(--text-primary)]">{verifiedInvoice.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Amount Paid:</span>
                    <span className="font-bold text-[#10b981]">{verifiedInvoice.amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Merchant Recipient:</span>
                    <span className="text-[var(--text-secondary)]">{verifiedInvoice.recipient}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Method:</span>
                    <span className="text-[var(--text-secondary)]">{verifiedInvoice.paymentMethod}</span>
                  </div>
                </div>
              )}

              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-md bg-[#ea580c] hover:bg-[#f97316] text-white font-semibold cursor-pointer transition-colors"
              >
                Return to Workspace
              </button>
            </div>
          )}

          {/* FAILED / CANCELLED STATES */}
          {(step === 'FAILED' || step === 'CANCELLED') && (
            <div className="py-4 space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-[#ef4444]/20 border border-[#ef4444]/40 flex items-center justify-center mx-auto text-[#ef4444]">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[var(--text-primary)]">
                  {step === 'CANCELLED' ? 'Checkout Cancelled' : 'Payment Verification Unsuccessful'}
                </h3>
                <p className="text-[11px] text-[var(--text-muted)] mt-1">
                  {errorMessage || 'The payment session was cancelled. No charges were made to your account.'}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setStep('SUMMARY')}
                  className="flex-1 py-2 rounded-md bg-[#ea580c] hover:bg-[#f97316] text-white font-semibold cursor-pointer"
                >
                  Try Again
                </button>
                <button
                  onClick={onClose}
                  className="py-2 px-4 rounded-md bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
