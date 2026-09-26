import { TaskContract } from '@/types/harness';

export const INITIAL_TASK_CONTRACT_1042: TaskContract = {
  id: 'contract-run-1042',
  taskId: 'run-1042',
  title: 'Fix failing authentication tests in auth-gateway-service',
  scopeBoundaries: {
    allowedPaths: [
      'src/auth/client.ts',
      'src/auth/session.ts',
      'src/auth/middleware.ts',
      'tests/integration/auth.test.ts',
      'tests/regression/security.test.ts',
    ],
    readOnlyPaths: [
      'src/server/index.ts',
      'src/auth/types.ts',
      'package.json',
      'tsconfig.json',
    ],
    forbiddenPaths: [
      '.env*',
      'src/database/**',
      'node_modules/**',
      '.git/**',
    ],
  },
  constraints: [
    'Zero breaking changes to AuthServiceClient public method signatures',
    'No new npm package dependencies (must use native Headers / Fetch API)',
    '100% strict TypeScript compiler pass (tsc --noEmit with 0 warnings)',
    'Zero regressions in security token forgery checks',
  ],
  expectedDeliverables: [
    'Patched AuthServiceClient forwarding active Bearer session token',
    'Passing integration test suite: tests/integration/auth.test.ts',
    'Clean build and regression test pass',
    'Deterministic cryptographic proof record with SHA-256 stamp',
  ],
  successCriteria: [
    {
      id: 'crit-1',
      description: 'Reproduce and trace 401 Unauthorized baseline test failure',
      criterion: 'HTTP 401 captured in test suite run without crashing harness',
      satisfied: true,
      evidenceRef: 'tc-3',
    },
    {
      id: 'crit-2',
      description: 'Inject Authorization: Bearer ${token} header in AuthServiceClient',
      criterion: 'src/auth/client.ts contains session bearer header logic',
      satisfied: true,
      evidenceRef: 'tc-4',
    },
    {
      id: 'crit-3',
      description: 'Pass integration test with HTTP 200 OK',
      criterion: 'tests/integration/auth.test.ts status === 200',
      satisfied: true,
      evidenceRef: 'tc-5',
    },
    {
      id: 'crit-4',
      description: 'Maintain security regression test suite (0 regressions)',
      criterion: 'tests/regression/security.test.ts passes completely',
      satisfied: true,
      evidenceRef: 'tc-5',
    },
    {
      id: 'crit-5',
      description: 'Compile without TypeScript diagnostics',
      criterion: 'tsc --noEmit exit code 0',
      satisfied: true,
      evidenceRef: 'tc-6',
    },
  ],
  agreedTimestamp: '2026-09-26T10:42:01Z',
  isSealed: true,
};

export class TaskContractEngine {
  public static getContract(taskId: string): TaskContract {
    return INITIAL_TASK_CONTRACT_1042;
  }

  public static evaluateContract(contract: TaskContract): {
    satisfiedCount: number;
    totalCount: number;
    completionPercent: number;
    allSatisfied: boolean;
  } {
    const totalCount = contract.successCriteria.length;
    const satisfiedCount = contract.successCriteria.filter((c) => c.satisfied).length;
    const completionPercent = Math.round((satisfiedCount / totalCount) * 100);
    return {
      satisfiedCount,
      totalCount,
      completionPercent,
      allSatisfied: satisfiedCount === totalCount,
    };
  }
}
