import { BranchingTrial } from '@/types/harness';

export const INITIAL_BRANCHING_TRIALS: BranchingTrial[] = [
  {
    id: 'trial-a',
    branchName: 'experiment/trial-a-header-injection',
    tacticName: 'Tactic A: Direct RequestInit Header Injection',
    description: 'Inject Authorization: Bearer ${token} in AuthServiceClient using native Headers API.',
    status: 'PASSED',
    testsPassed: 4,
    testsTotal: 4,
    linesAdded: 14,
    linesRemoved: 2,
    executionMs: 820,
    isWinningCandidate: true,
    tradeoffs: [
      'Zero new external dependencies',
      'Minimal blast radius (local to fetchWithAuth)',
      '100% backward compatible',
    ],
  },
  {
    id: 'trial-b',
    branchName: 'experiment/trial-b-axios-interceptor',
    tacticName: 'Tactic B: Global Axios Interceptor Middleware',
    description: 'Install and configure Axios with request interceptor hook to automatically append session token.',
    status: 'REJECTED',
    testsPassed: 3,
    testsTotal: 4,
    linesAdded: 48,
    linesRemoved: 12,
    executionMs: 2410,
    isWinningCandidate: false,
    tradeoffs: [
      'Requires introducing new axios dependency (violates Task Contract)',
      'Global side effects on unauthenticated routes',
      'Larger bundle size (+42 KB)',
    ],
  },
  {
    id: 'trial-c',
    branchName: 'experiment/trial-c-cookie-forwarding',
    tacticName: 'Tactic C: Cookie Jar Passthrough Proxy',
    description: 'Forward incoming browser Cookie header directly to internal RPC service endpoints.',
    status: 'FAILED',
    testsPassed: 1,
    testsTotal: 4,
    linesAdded: 22,
    linesRemoved: 6,
    executionMs: 1100,
    isWinningCandidate: false,
    tradeoffs: [
      'Failed security regression tests (cross-site cookie leakage vulnerability)',
      'Microservice rejected missing Bearer format',
    ],
  },
];

export class BranchingExperimentsEngine {
  private static trials: BranchingTrial[] = [...INITIAL_BRANCHING_TRIALS];

  public static getTrials(): BranchingTrial[] {
    return this.trials;
  }

  public static selectWinner(trialId: string): {
    success: boolean;
    winningTrial?: BranchingTrial;
    message: string;
  } {
    const trial = this.trials.find((t) => t.id === trialId);
    if (!trial) {
      return { success: false, message: 'Trial branch not found' };
    }
    this.trials.forEach((t) => {
      t.isWinningCandidate = t.id === trialId;
    });
    return {
      success: true,
      winningTrial: trial,
      message: `Selected ${trial.tacticName} on ${trial.branchName} as the verified resolution branch.`,
    };
  }
}
