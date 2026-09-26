import { ScopeGuardDecision, ScopeGuardRule, ScopeStatus } from '@/types/harness';

export const DEFAULT_SCOPE_RULES: ScopeGuardRule[] = [
  {
    id: 'rule-auth-scope',
    pattern: '^src/auth/.*',
    description: 'Target authentication subsystem files are in active modification scope',
    type: 'allow',
    category: 'file',
  },
  {
    id: 'rule-tests-scope',
    pattern: '^tests/.*',
    description: 'Test suites and reproduction cases can be executed and updated',
    type: 'allow',
    category: 'file',
  },
  {
    id: 'rule-env-block',
    pattern: '.*(\\.env|credentials|secret|id_rsa|\\.pem).*',
    description: 'Environment files and private keys are strictly blocked from modification',
    type: 'block',
    category: 'file',
  },
  {
    id: 'rule-db-schema-gate',
    pattern: '^(prisma/schema\\.prisma|migrations/.*|src/database/.*)',
    description: 'Database schema and migration files require explicit human approval',
    type: 'require_approval',
    category: 'database',
  },
  {
    id: 'rule-core-server-read-only',
    pattern: '^src/server/index\\.ts',
    description: 'Server entrypoint is protected and read-only for this task',
    type: 'require_approval',
    category: 'file',
  },
  {
    id: 'rule-node-modules-block',
    pattern: '^(node_modules/|\\.git/).*',
    description: 'External packages and VCS internals are immutably blocked',
    type: 'block',
    category: 'file',
  },
];

export class ScopeGuard {
  private static rules: ScopeGuardRule[] = [...DEFAULT_SCOPE_RULES];
  private static decisions: ScopeGuardDecision[] = [
    {
      target: 'src/auth/client.ts',
      action: 'write',
      status: 'IN_SCOPE',
      reason: 'Matched allow pattern: ^src/auth/.* (Authentication subsystem)',
      ruleMatched: 'rule-auth-scope',
      timestamp: '10:42:24',
    },
    {
      target: 'tests/integration/auth.test.ts',
      action: 'execute',
      status: 'IN_SCOPE',
      reason: 'Matched allow pattern: ^tests/.* (Verification test suite)',
      ruleMatched: 'rule-tests-scope',
      timestamp: '10:42:15',
    },
    {
      target: '.env.production',
      action: 'read',
      status: 'BLOCKED',
      reason: 'Protected credential file strictly quarantined by Scope Guard',
      ruleMatched: 'rule-env-block',
      timestamp: '10:42:04',
    },
    {
      target: 'src/database/schema.sql',
      action: 'write',
      status: 'NEEDS_APPROVAL',
      reason: 'Database schema modification exceeds task boundary without approval gate',
      ruleMatched: 'rule-db-schema-gate',
      timestamp: '10:42:08',
    },
  ];

  public static evaluate(
    targetPath: string,
    action: 'read' | 'write' | 'execute' | 'delete'
  ): ScopeGuardDecision {
    // 1. Check for block rules first
    for (const rule of this.rules) {
      if (rule.type === 'block' && new RegExp(rule.pattern).test(targetPath)) {
        const decision: ScopeGuardDecision = {
          target: targetPath,
          action,
          status: 'BLOCKED',
          reason: `Action blocked: ${rule.description}`,
          ruleMatched: rule.id,
          timestamp: new Date().toLocaleTimeString(),
        };
        this.decisions.unshift(decision);
        return decision;
      }
    }

    // 2. Check for human approval rules
    for (const rule of this.rules) {
      if (rule.type === 'require_approval' && new RegExp(rule.pattern).test(targetPath)) {
        const decision: ScopeGuardDecision = {
          target: targetPath,
          action,
          status: 'NEEDS_APPROVAL',
          reason: `Approval required: ${rule.description}`,
          ruleMatched: rule.id,
          timestamp: new Date().toLocaleTimeString(),
        };
        this.decisions.unshift(decision);
        return decision;
      }
    }

    // 3. Check for allow rules
    for (const rule of this.rules) {
      if (rule.type === 'allow' && new RegExp(rule.pattern).test(targetPath)) {
        const decision: ScopeGuardDecision = {
          target: targetPath,
          action,
          status: 'IN_SCOPE',
          reason: `Action permitted: ${rule.description}`,
          ruleMatched: rule.id,
          timestamp: new Date().toLocaleTimeString(),
        };
        this.decisions.unshift(decision);
        return decision;
      }
    }

    // Default: If not explicitly allowed, require approval
    const fallbackDecision: ScopeGuardDecision = {
      target: targetPath,
      action,
      status: 'NEEDS_APPROVAL',
      reason: 'Target is outside approved task manifest boundaries.',
      timestamp: new Date().toLocaleTimeString(),
    };
    this.decisions.unshift(fallbackDecision);
    return fallbackDecision;
  }

  public static getRules(): ScopeGuardRule[] {
    return this.rules;
  }

  public static getRecentDecisions(): ScopeGuardDecision[] {
    return this.decisions;
  }
}
