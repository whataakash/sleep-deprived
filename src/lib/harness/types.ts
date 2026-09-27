/**
 * परिश्रम् (PARISHRAM) Autonomous Coding Harness — Core Type System
 *
 * Strict, deterministic types governing the vertical execution slice:
 * INTAKE → TASK_CONTRACT → TARGETED_CONTEXT → PLAN → EXECUTE → VERIFY → RECOVER → PROVE → COMPLETE
 */

export type HarnessState =
  | 'INTAKE'
  | 'TASK_CONTRACT'
  | 'TARGETED_CONTEXT'
  | 'PLAN'
  | 'EXECUTE'
  | 'VERIFY'
  | 'RECOVER'
  | 'PROVE'
  | 'COMPLETE'
  | 'FAILED';

export type HarnessFailureCategory =
  | 'TEST_FAILURE'
  | 'TYPE_ERROR'
  | 'BUILD_FAILURE'
  | 'SCOPE_VIOLATION'
  | 'MISSING_CONTEXT'
  | 'TOOL_FAILURE'
  | 'PATCH_FAILURE'
  | 'DEPENDENCY_FAILURE'
  | 'TIMEOUT';

export interface VerificationRequirement {
  id: string;
  name: string;
  command: string;
  description: string;
  required: boolean;
}

export interface TaskContract {
  id: string;
  taskId: string;
  objective: string;
  repositoryRoot: string;
  constraints: string[];
  allowedPaths: string[];
  forbiddenPaths: string[];
  verificationRequirements: VerificationRequirement[];
  stopConditions: {
    maxRetries: number;
    maxDurationMs: number;
    maxTokens: number;
  };
  createdAt: string;
  isSealed: boolean;
}

export interface ConsideredFile {
  path: string;
  matchScore: number;
  reason: string;
  sizeBytes: number;
}

export interface SelectedFileContext {
  path: string;
  reason: string;
  tokensEstimate: number;
  content: string;
  symbols: string[];
}

export interface TargetedContextResult {
  task: string;
  filesConsidered: ConsideredFile[];
  filesSelected: SelectedFileContext[];
  totalTokensEstimate: number;
  tokenBudget: number;
  budgetExceeded: boolean;
  indexedSymbols: { symbol: string; file: string; line: number }[];
  durationMs: number;
}

export interface ToolCallEvent {
  id: string;
  tool: string;
  input: Record<string, any>;
  output: string;
  exitCode: number;
  durationMs: number;
  timestamp: string;
  status: 'completed' | 'failed';
  error?: string;
}

export interface VerificationTestResults {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  output: string;
  rawExitCode: number;
  durationMs: number;
}

export interface VerificationTypecheckResults {
  passed: boolean;
  errorsCount: number;
  output: string;
  durationMs: number;
}

export interface VerificationScopeResults {
  passed: boolean;
  modifiedFiles: string[];
  violations: string[];
}

export interface VerificationSecurityResults {
  passed: boolean;
  secretsDetected: { file: string; pattern: string; redacted: string }[];
  dangerousCommandsBlocked: string[];
}

export interface VerificationResult {
  passed: boolean;
  timestamp: string;
  durationMs: number;
  tests: VerificationTestResults;
  typecheck: VerificationTypecheckResults;
  scope: VerificationScopeResults;
  security: VerificationSecurityResults;
}

export interface FailureDiagnosis {
  category: HarnessFailureCategory;
  symptom: string;
  likelyCause: string;
  failingCommand: string;
  exactOutputSnippet: string;
  targetFiles: string[];
  targetedRecoveryAction: string;
  confidence: number;
  timestamp: string;
}

export interface RecoveryAttemptRecord {
  attemptNumber: number;
  diagnosis: FailureDiagnosis;
  targetedPromptSummary: string;
  patchApplied?: {
    filePath: string;
    diffSnippet: string;
    description: string;
  };
  reVerificationResult: VerificationResult;
  succeeded: boolean;
  timestamp: string;
}

export interface CheckpointSnapshot {
  id: string;
  name: string;
  description: string;
  timestamp: string;
  files: {
    path: string;
    originalContent: string | null; // null if newly created file
  }[];
}

export interface MerkleLeaf {
  id: string;
  name: string;
  hash: string;
  payloadSummary: string;
}

export interface ProofRecord {
  id: string;
  runId: string;
  task: string;
  objective: string;
  repositoryRoot: string;
  status: 'VERIFIED' | 'FAILED';
  proofHash: string; // SHA-256 stamp
  merkleRoot: string;
  merkleLeaves: MerkleLeaf[];
  filesChanged: string[];
  diff: string;
  verificationSummary: {
    testsPassed: number;
    testsFailed: number;
    typecheckPassed: boolean;
    scopePassed: boolean;
    securityPassed: boolean;
  };
  telemetry: HarnessTelemetry;
  timestamp: string;
  receiptPath?: string;
}

export interface HarnessTelemetry {
  modelCalls: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  durationMs: number;
  filesInspected: number;
  filesModified: number;
  retriesCount: number;
  verificationAttempts: number;
}

export interface HarnessRunOptions {
  task: string;
  repositoryRoot?: string;
  allowedPaths?: string[];
  forbiddenPaths?: string[];
  customVerificationCommands?: VerificationRequirement[];
  maxRetries?: number;
  tokenBudget?: number;
  isEvaluationMode?: boolean;
  prescribedModel?: string;
  apiKey?: string;
  mockHandler?: (messages: any[]) => Promise<any>;
  onStateChange?: (state: HarnessState, detail?: string) => void;
  onToolCall?: (event: ToolCallEvent) => void;
  onVerification?: (result: VerificationResult) => void;
  onRecovery?: (record: RecoveryAttemptRecord) => void;
}
