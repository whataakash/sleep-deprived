export interface BenchmarkTask {
  id: string;
  name: string;
  category: 'bug_fix' | 'type_error' | 'refactor' | 'endpoint' | 'dependency' | 'regression';
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Extreme';
  description: string;
  targetRepository: string;
  baselineFailingTestsCount: number;
  expectedPassingTestsCount: number;
  timeoutSeconds: number;
  lastRun?: {
    modelId: string;
    status: 'VERIFIED' | 'FAILED';
    durationSeconds: number;
    tokensUsed: number;
    costUsd: number;
    attempts: number;
    verifiedAt: string;
  };
}

export interface HarnessEvaluationMetrics {
  totalTasksRun: number;
  verifiedSuccessRate: number;      // e.g. 94.2%
  firstAttemptSuccessRate: number;  // e.g. 68.5%
  recoverySuccessRate: number;      // e.g. 81.6%
  avgRetriesPerTask: number;        // e.g. 1.2
  avgTokensPerTask: number;         // e.g. 38,450
  avgDurationSeconds: number;       // e.g. 48s
  avgToolCallsPerTask: number;      // e.g. 7.4
  regressionRate: number;           // e.g. 0.0%
  contextEfficiencyRate: number;    // e.g. 88.5%
  totalTestsRun: number;
  totalTestsPassed: number;
  avgTokenCostUsd?: number;
  avgRecoveryAttemptsToFix?: number;
  deterministicVerificationPassRate?: number;
}
