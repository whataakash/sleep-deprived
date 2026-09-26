export interface TestSuiteResult {
  suiteName: string;
  category: 'unit' | 'integration' | 'regression';
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  durationMs: number;
  tests: {
    name: string;
    status: 'passed' | 'failed' | 'skipped';
    durationMs: number;
    errorSnippet?: string;
    filePath: string;
    line?: number;
  }[];
}

export interface BuildDiagnostic {
  stage: 'typecheck' | 'lint' | 'bundle';
  status: 'passed' | 'failed';
  warningsCount: number;
  errorsCount: number;
  outputLog: string;
  durationMs: number;
}

export interface EvidenceLink {
  id: string;
  claim: string;                     // e.g. "Session token forwarded in authorization header"
  targetArtifact: string;            // e.g. "src/auth/client.ts:48"
  verificationMethod: string;        // e.g. "auth.integration.test.ts #test_token_forward"
  logOutputRef: string;              // e.g. "npm test -- auth.integration (exit code 0)"
  status: 'proven' | 'unproven';
}

export interface ProofGraphNode {
  id: string;
  type: 'requirement' | 'code' | 'change' | 'test' | 'result' | 'build' | 'proof';
  label: string;
  sublabel?: string;
  status: 'verified' | 'passed' | 'active' | 'warning' | 'failed';
  metadata?: Record<string, any>;
}

export interface ProofGraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
}

export interface ProofRecord {
  id: string;
  runId: string;
  verifiedTimestamp: string;
  proofHash: string;                  // SHA256 deterministic proof stamp
  status: 'VERIFIED' | 'FAILED' | 'IN_PROGRESS';
  badgeTitle: 'FORGED ✓' | 'UNVERIFIED' | 'REJECTED';
  taskCoverage: {
    satisfiedCount: number;
    totalCount: number;
    requirements: {
      text: string;
      satisfied: boolean;
      evidenceRef: string;
    }[];
  };
  tests: {
    unit: TestSuiteResult;
    integration: TestSuiteResult;
    regression: TestSuiteResult;
  };
  build: {
    typecheck: BuildDiagnostic;
    lint: BuildDiagnostic;
    productionBuild: BuildDiagnostic;
  };
  changes: {
    filesCount: number;
    linesAdded: number;
    linesRemoved: number;
  };
  regressionRisk: 'Low' | 'Medium' | 'High';
  regressionRiskRationale: string;
  evidenceTrail: EvidenceLink[];
  graphNodes: ProofGraphNode[];
  graphEdges: ProofGraphEdge[];
}
