export type PlanTier = 'FREE' | 'BUILDER' | 'PRO' | 'TEAM';

export type PaymentStatus =
  | 'CHECKOUT_CREATED'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_SUCCESS'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_CANCELLED';

export interface PlanFeature {
  name: string;
  included: boolean;
  footnote?: string;
}

export interface PricingPlan {
  id: PlanTier;
  name: string; // Hindi primary name (e.g. 'आरम्भ', 'प्रगति', 'प्रवीण', 'दल')
  englishSubtitle: string; // English descriptor (e.g. 'Starter', 'Builder', 'Professional', 'Team')
  tagline: string;
  monthlyPriceInr: number;
  monthlyPriceUsd: number;
  yearlyPriceInr: number;
  yearlyPriceUsd: number;
  runsLimitMonthly: number | 'Unlimited';
  contextLimitTokens: number;
  maxParallelTools: number;
  modelsIncluded: string[];
  features: string[];
  recommended?: boolean;
}

export interface PaymentInvoice {
  id: string;
  date: string;
  planId: PlanTier;
  planName: string;
  amount: string;
  status: 'PAID' | 'REFUNDED' | 'FAILED';
  recipient: string;
  paymentMethod: string;
  receiptUrl?: string;
}

export interface UserSubscription {
  planId: PlanTier;
  status: 'active' | 'trial' | 'past_due' | 'canceled';
  currentPeriodEnd: string;
  runsUsedThisMonth: number;
  runsLimitMonthly: number | 'Unlimited';
  tokensUsedThisMonth: number;
  invoices: PaymentInvoice[];
}

