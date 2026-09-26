export type PlanTier = 'FREE' | 'BUILDER' | 'PRO' | 'TEAM';

export interface PlanFeature {
  name: string;
  included: boolean;
  footnote?: string;
}

export interface PricingPlan {
  id: PlanTier;
  name: string;
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

export interface UserSubscription {
  planId: PlanTier;
  status: 'active' | 'trial' | 'past_due' | 'canceled';
  currentPeriodEnd: string;
  runsUsedThisMonth: number;
  runsLimitMonthly: number | 'Unlimited';
  tokensUsedThisMonth: number;
}
