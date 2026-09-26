import { UserProfile } from '@/types/auth';
import { DynamicCodingModel, PlanTier } from '@/types/models';

export interface EntitlementCheckResult {
  allowed: boolean;
  reason?: string;
  upgradeRequiredPlan?: PlanTier;
}

export class EntitlementService {
  private static PLAN_RANK: Record<PlanTier, number> = {
    FREE: 0,
    BUILDER: 1,
    PRO: 2,
    TEAM: 3,
  };

  /**
   * Enforces whether a user can invoke a specific model.
   * Checks both minimum plan requirement and BYOK/Local overrides.
   */
  public static canUseModel(
    user: UserProfile | null,
    model: DynamicCodingModel
  ): EntitlementCheckResult {
    // If local or truly free-hosted, any user (including free) is allowed
    if (model.accessType === 'LOCAL' || model.accessType === 'FREE_HOSTED') {
      return { allowed: true };
    }

    if (!user) {
      return {
        allowed: false,
        reason: 'Sign in to access hosted coding models.',
        upgradeRequiredPlan: 'FREE',
      };
    }

    // Check if user has supplied BYOK for this provider
    const hasKey = user.apiKeys?.some(
      (k) => k.provider === model.provider && k.isValid && k.maskedKey.length > 0
    );
    if (hasKey) {
      return { allowed: true };
    }

    // Check plan tier ranking
    const userRank = this.PLAN_RANK[user.plan];
    const requiredRank = this.PLAN_RANK[model.minimumPlanRequired];

    if (userRank >= requiredRank) {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: `Requires ${model.minimumPlanRequired} plan or your own ${model.provider} API key.`,
      upgradeRequiredPlan: model.minimumPlanRequired,
    };
  }

  /**
   * Enforces monthly run limits.
   */
  public static canRunTask(user: UserProfile | null): EntitlementCheckResult {
    if (!user) {
      return { allowed: true }; // Anonymous demo run permitted
    }

    if (user.usage.maxMonthlyRuns === 'Unlimited') {
      return { allowed: true };
    }

    if (user.usage.runsUsedThisMonth >= user.usage.maxMonthlyRuns) {
      return {
        allowed: false,
        reason: `Monthly quota reached (${user.usage.runsUsedThisMonth}/${user.usage.maxMonthlyRuns} runs). Upgrade plan for more runs.`,
        upgradeRequiredPlan: user.plan === 'FREE' ? 'BUILDER' : 'PRO',
      };
    }

    return { allowed: true };
  }

  /**
   * Enforces parallel tool execution access.
   */
  public static canUseParallelTools(user: UserProfile | null): boolean {
    if (!user) return false;
    return user.plan === 'PRO' || user.plan === 'TEAM';
  }

  /**
   * Enforces private repository access.
   */
  public static canUsePrivateRepo(user: UserProfile | null): boolean {
    if (!user) return false;
    return user.plan !== 'FREE';
  }

  /**
   * Enforces advanced agent routing.
   */
  public static canUseAdvancedRouting(user: UserProfile | null): boolean {
    if (!user) return false;
    return user.plan !== 'FREE';
  }
}
