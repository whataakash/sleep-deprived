export type AgentState =
  | 'INTAKE'
  | 'UNDERSTAND'
  | 'PLAN'
  | 'SEARCH'
  | 'EDIT'
  | 'RUN'
  | 'DIAGNOSE'
  | 'RECOVER'
  | 'VERIFY'
  | 'PROVE'
  | 'COMPLETE'
  | 'BLOCKED'
  | 'FAILED';

export type ForgeTemperature = 'COLD' | 'THINKING' | 'WORKING' | 'HOT' | 'FORGING';

export type ToolName =
  | 'read_file'
  | 'write_file'
  | 'edit_file'
  | 'search_files'
  | 'search_symbols'
  | 'list_directory'
  | 'run_command'
  | 'run_tests'
  | 'run_linter'
  | 'run_typecheck'
  | 'git_diff'
  | 'git_status'
  | 'inspect_package';

export interface ToolCall {
  id: string;
  tool: ToolName;
  input: Record<string, any>;
  output?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  durationMs?: number;
  timestamp: string;
  error?: string;
}

export interface PlanStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'revised' | 'failed';
  targetedFiles?: string[];
  rationale?: string;
}

export type FailureCategory =
  | 'Syntax failure'
  | 'Type failure'
  | 'Test failure'
  | 'Dependency failure'
  | 'Environment failure'
  | 'Timeout'
  | 'Tool failure'
  | 'Agent planning failure'
  | 'Regression'
  | 'Unknown';

export interface RecoveryAttempt {
  attemptNumber: number;
  failureCategory: FailureCategory;
  failureMessage: string;
  failingComponent: string;
  likelyCause: string;
  correctionStrategy: string;
  patchApplied: {
    filePath: string;
    description: string;
    diffSnippet: string;
  };
  retestTarget: string;
  result: 'passed' | 'failed';
  timestamp: string;
}

export interface FailureFingerprint {
  id: string;
  fingerprint: string;
  category: FailureCategory;
  firstSeen: string;
  lastSeen: string;
  seenCount: number;
  relatedComponents: string[];
  symptomSummary: string;
  successfulRecoveryTactic: string;
  confidence: number;
}

export interface RunEvent {
  id: string;
  runId: string;
  timestamp: string;
  type:
    | 'task.received'
    | 'repo.scanned'
    | 'context.gathered'
    | 'plan.created'
    | 'plan.revised'
    | 'tool.started'
    | 'tool.completed'
    | 'file.inspected'
    | 'file.modified'
    | 'test.executed'
    | 'failure.detected'
    | 'failure.diagnosed'
    | 'recovery.started'
    | 'recovery.applied'
    | 'verification.started'
    | 'verification.passed'
    | 'verification.failed'
    | 'proof.generated'
    | 'run.completed'
    | 'run.blocked';
  title: string;
  summary: string;
  details?: Record<string, any>;
  state: AgentState;
  temperature: ForgeTemperature;
}

export interface RunMetrics {
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  totalCostUsd: number;
  totalDurationMs: number;
  toolCallsCount: number;
  testsExecutedCount: number;
  testsPassedCount: number;
  filesInspectedCount: number;
  filesModifiedCount: number;
  retriesCount: number;
  contextEfficiencyPercent: number;
}

export interface Run {
  id: string;
  runNumber: number;
  taskTitle: string;
  taskDescription: string;
  repositoryId: string;
  branch: string;
  modelId: string;
  state: AgentState;
  temperature: ForgeTemperature;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  events: RunEvent[];
  plan: PlanStep[];
  toolCalls: ToolCall[];
  recoveryAttempts: RecoveryAttempt[];
  metrics: RunMetrics;
  proofId?: string;
  approvalRequired?: {
    action: string;
    description: string;
    risk: 'low' | 'medium' | 'high';
  };
}
