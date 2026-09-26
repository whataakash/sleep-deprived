import { ArenaCandidate } from '@/types/harness';

export const BENCHMARK_ARENA_CANDIDATES: ArenaCandidate[] = [
  {
    modelId: 'qwen3-coder-next',
    modelName: 'Qwen3-Coder-Next',
    provider: 'Alibaba Cloud / Open-Weights',
    status: 'completed',
    responseSnippet: `const headers = new Headers(options.headers || {});
if (this.currentSession?.token) {
  headers.set('Authorization', \`Bearer \${this.currentSession.token}\`);
  headers.set('X-Session-ID', this.currentSession.id);
}`,
    tokensTotal: 1840,
    durationMs: 940,
    costUsd: 0.0024,
    testsPassed: 4,
    testsTotal: 4,
    invariantScore: 99,
    isWinner: true,
    summaryRationale: 'Cleanest AST patch with zero extra dependencies; highest latency/cost ratio; 100% test pass.',
  },
  {
    modelId: 'claude-3-7-sonnet',
    modelName: 'Claude 3.7 Sonnet',
    provider: 'Anthropic',
    status: 'completed',
    responseSnippet: `const requestHeaders = new Headers(options.headers);
if (this.currentSession && this.currentSession.token) {
  requestHeaders.set('Authorization', \`Bearer \${this.currentSession.token}\`);
}`,
    tokensTotal: 3420,
    durationMs: 2480,
    costUsd: 0.021,
    testsPassed: 4,
    testsTotal: 4,
    invariantScore: 97,
    isWinner: false,
    summaryRationale: 'Accurate and comprehensive thinking trace, but 3.6x higher cost and 2.6x longer synthesis latency.',
  },
  {
    modelId: 'deepseek-v3-coder',
    modelName: 'DeepSeek V3 Coder',
    provider: 'DeepSeek AI',
    status: 'completed',
    responseSnippet: `options.headers = {
  ...options.headers,
  Authorization: \`Bearer \${this.currentSession.token}\`
};`,
    tokensTotal: 1650,
    durationMs: 780,
    costUsd: 0.0018,
    testsPassed: 3,
    testsTotal: 4,
    invariantScore: 78,
    isWinner: false,
    summaryRationale: 'Very fast, but mutates options directly instead of using Headers API, causing subtle type lint error.',
  },
  {
    modelId: 'kimi-k2-5-agent',
    modelName: 'Kimi K2.5 Multimodal',
    provider: 'Moonshot AI',
    status: 'completed',
    responseSnippet: `const headers = new Headers(options.headers || {});
if (this.currentSession && this.currentSession.token) {
  headers.set('Authorization', \`Bearer \${this.currentSession.token}\`);
}`,
    tokensTotal: 2890,
    durationMs: 1420,
    costUsd: 0.0072,
    testsPassed: 4,
    testsTotal: 4,
    invariantScore: 95,
    isWinner: false,
    summaryRationale: 'Solid tool-calling loop and fully passing tests; selected as runner-up.',
  },
];

export class ModelArenaEngine {
  private static candidates: ArenaCandidate[] = [...BENCHMARK_ARENA_CANDIDATES];

  public static getCandidates(): ArenaCandidate[] {
    return this.candidates;
  }

  public static runArenaComparison(taskPrompt: string): ArenaCandidate[] {
    return this.candidates;
  }
}
