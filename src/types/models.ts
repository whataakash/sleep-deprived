export type ModelCategory =
  | 'FAST'
  | 'CODING'
  | 'REASONING'
  | 'AGENTIC'
  | 'LONG_CONTEXT'
  | 'LOCAL';

export type ModelProvider =
  | 'Qwen'
  | 'Moonshot'
  | 'Z.ai'
  | 'DeepSeek'
  | 'Anthropic'
  | 'OpenAI'
  | 'xAI'
  | 'OpenRouter'
  | 'Ollama'
  | 'HuggingFace'
  | 'HackathonPrescribed';

export type ModelAccessType = 'LOCAL' | 'FREE_HOSTED' | 'BYOK' | 'PAID_HOSTED' | 'PRESCRIBED_EVALUATION';

export type PlanTier = 'FREE' | 'BUILDER' | 'PRO' | 'TEAM';

export type ModelAvailabilityStatus =
  | 'available'
  | 'requires_key'
  | 'plan_restricted'
  | 'locked_evaluation'
  | 'offline';

export interface ModelBenchmarkRecord {
  name: string;             // e.g. "SWE-bench Lite", "HumanEval", "RepoBench"
  score: number;            // e.g. 52.4
  date: string;             // e.g. "Aug 2026"
  source: string;           // e.g. "Verified Provider Benchmark"
}

export interface DynamicCodingModel {
  id: string;
  displayName: string;
  provider: ModelProvider;
  family: 'Qwen' | 'Kimi' | 'GLM' | 'DeepSeek' | 'Claude' | 'GPT' | 'Grok' | 'Local' | 'Evaluation';
  category: ModelCategory;
  license: string;          // e.g. "Apache-2.0", "Modified MIT", "Proprietary"
  openWeight: boolean;
  openSource: boolean;
  selfHostable: boolean;
  accessType: ModelAccessType;
  minimumPlanRequired: PlanTier;

  // Scores (1-100)
  codingScore: number;
  reasoningScore: number;
  agentScore: number;

  contextLength: number;    // e.g. 262_144
  toolCalling: boolean;
  vision: boolean;

  inputCostPer1k: number;   // $0.0 for free/local
  outputCostPer1k: number;  // $0.0 for free/local

  availability: ModelAvailabilityStatus;
  lastVerifiedAt: string;
  sourceUrl?: string;

  whyThisModelRationale: string;
  benchmarks: ModelBenchmarkRecord[];
}

export interface ModelRoutingDecision {
  selectedModelId: string;
  selectedModel: DynamicCodingModel;
  reasoning: string;
  taskComplexity: 'Low' | 'Medium' | 'High' | 'Extreme';
  filesAffectedEstimate: number;
  contextRequiredTokens: number;
  toolUsageIntensity: 'Low' | 'Moderate' | 'High';
  estimatedCostUsd: number;
  fallbackModelId?: string;
  fallbackTriggered?: boolean;
  fallbackReason?: string;
  userAccessAllowed: boolean;
}

export interface UserApiKey {
  provider: ModelProvider;
  maskedKey: string;
  isValid: boolean;
  updatedAt: string;
  customEndpoint?: string;
}

export interface FreeEndpointStatus {
  provider: ModelProvider;
  modelId: string;
  isTrulyFree: boolean;
  freeQuotaPolicy: string;
  verifiedDate: string;
  availability: 'online' | 'rate_limited' | 'deprecated';
}
