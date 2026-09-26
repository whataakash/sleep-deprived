import { ProofRecord, ProofGraphNode, ProofGraphEdge, EvidenceLink } from '@/types/verification';

export class ProofGenerator {
  public static generateAuthProof(runId: string): ProofRecord {
    const evidenceTrail: EvidenceLink[] = [
      {
        id: 'ev-1',
        claim: 'Session token forwarded in authorization headers',
        targetArtifact: 'src/auth/client.ts:28',
        verificationMethod: 'tests/integration/auth.test.ts #forwards_session_token',
        logOutputRef: 'jest tests/integration/auth.test.ts (PASS in 42ms)',
        status: 'proven',
      },
      {
        id: 'ev-2',
        claim: 'Zero TypeScript compiler errors in modified AST',
        targetArtifact: 'tsconfig.json / src/auth/client.ts',
        verificationMethod: 'tsc --noEmit',
        logOutputRef: 'tsc exited with 0 diagnostics',
        status: 'proven',
      },
      {
        id: 'ev-3',
        claim: 'Regression test: Malformed or forged tokens strictly rejected with 401',
        targetArtifact: 'tests/regression/security.test.ts',
        verificationMethod: 'pnpm test:regression',
        logOutputRef: '1/1 passed (18ms)',
        status: 'proven',
      },
      {
        id: 'ev-4',
        claim: 'Production bundle successfully built without warnings',
        targetArtifact: 'tsup src/server/index.ts',
        verificationMethod: 'pnpm run build',
        logOutputRef: 'ESM + CJS bundles created in 380ms',
        status: 'proven',
      },
    ];

    const graphNodes: ProofGraphNode[] = [
      {
        id: 'req-1',
        type: 'requirement',
        label: 'Fix Auth 401 Bug',
        sublabel: 'Forward session token in client',
        status: 'verified',
      },
      {
        id: 'code-1',
        type: 'code',
        label: 'src/auth/client.ts',
        sublabel: 'AuthServiceClient.fetchWithAuth',
        status: 'verified',
      },
      {
        id: 'change-1',
        type: 'change',
        label: '+ Authorization Header',
        sublabel: 'Bearer ${token} injected',
        status: 'verified',
      },
      {
        id: 'test-1',
        type: 'test',
        label: 'auth.integration.test.ts',
        sublabel: 'Line 42: status === 200',
        status: 'passed',
      },
      {
        id: 'result-1',
        type: 'result',
        label: '4/4 Tests Passed',
        sublabel: 'Unit + Integ + Regression',
        status: 'passed',
      },
      {
        id: 'build-1',
        type: 'build',
        label: 'tsc + tsup Build',
        sublabel: 'Zero diagnostics / warnings',
        status: 'passed',
      },
      {
        id: 'proof-final',
        type: 'proof',
        label: 'FORGED ✓',
        sublabel: 'Verified & Sealed',
        status: 'verified',
      },
    ];

    const graphEdges: ProofGraphEdge[] = [
      { id: 'e1', source: 'req-1', target: 'code-1', label: 'targets' },
      { id: 'e2', source: 'code-1', target: 'change-1', label: 'modified' },
      { id: 'e3', source: 'change-1', target: 'test-1', label: 'exercised by' },
      { id: 'e4', source: 'test-1', target: 'result-1', label: 'produces' },
      { id: 'e5', source: 'result-1', target: 'build-1', label: 'verified in' },
      { id: 'e6', source: 'build-1', target: 'proof-final', label: 'seals', animated: true },
    ];

    return {
      id: `proof-${runId}`,
      runId,
      verifiedTimestamp: '2026-09-26T10:42:36Z',
      proofHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      status: 'VERIFIED',
      badgeTitle: 'FORGED ✓',
      taskCoverage: {
        satisfiedCount: 4,
        totalCount: 4,
        requirements: [
          { text: 'Locate authentication failure root cause', satisfied: true, evidenceRef: 'ev-1' },
          { text: 'Inject session bearer credentials in fetchWithAuth', satisfied: true, evidenceRef: 'ev-1' },
          { text: 'Confirm zero regressions in token validation', satisfied: true, evidenceRef: 'ev-3' },
          { text: 'Verify clean build and strict TypeScript compiler check', satisfied: true, evidenceRef: 'ev-2' },
        ],
      },
      tests: {
        unit: {
          suiteName: 'tests/unit/session.test.ts',
          category: 'unit',
          total: 2,
          passed: 2,
          failed: 0,
          skipped: 0,
          durationMs: 14,
          tests: [
            { name: 'creates active session with valid expiration', status: 'passed', durationMs: 6, filePath: 'tests/unit/session.test.ts', line: 4 },
            { name: 'validates active session token successfully', status: 'passed', durationMs: 8, filePath: 'tests/unit/session.test.ts', line: 12 },
          ],
        },
        integration: {
          suiteName: 'tests/integration/auth.test.ts',
          category: 'integration',
          total: 1,
          passed: 1,
          failed: 0,
          skipped: 0,
          durationMs: 42,
          tests: [
            { name: 'forwards session token and accesses protected profile route', status: 'passed', durationMs: 42, filePath: 'tests/integration/auth.test.ts', line: 6 },
          ],
        },
        regression: {
          suiteName: 'tests/regression/security.test.ts',
          category: 'regression',
          total: 1,
          passed: 1,
          failed: 0,
          skipped: 0,
          durationMs: 18,
          tests: [
            { name: 'strictly rejects forged bearer tokens', status: 'passed', durationMs: 18, filePath: 'tests/regression/security.test.ts', line: 5 },
          ],
        },
      },
      build: {
        typecheck: {
          stage: 'typecheck',
          status: 'passed',
          warningsCount: 0,
          errorsCount: 0,
          outputLog: 'TypeScript 5.8: zero errors found across 28 workspace files.',
          durationMs: 820,
        },
        lint: {
          stage: 'lint',
          status: 'passed',
          warningsCount: 0,
          errorsCount: 0,
          outputLog: 'ESLint: zero violations in modified files.',
          durationMs: 640,
        },
        productionBuild: {
          stage: 'bundle',
          status: 'passed',
          warningsCount: 0,
          errorsCount: 0,
          outputLog: 'tsup: successfully bundled 2 output artifacts.',
          durationMs: 380,
        },
      },
      changes: {
        filesCount: 1,
        linesAdded: 14,
        linesRemoved: 2,
      },
      regressionRisk: 'Low',
      regressionRiskRationale: 'Isolated patch within AuthServiceClient. Headers are only added when an active session token is present. Zero external breaking interface changes.',
      evidenceTrail,
      graphNodes,
      graphEdges,
    };
  }
}
