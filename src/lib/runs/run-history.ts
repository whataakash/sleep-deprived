export interface RecentRunItem {
  id: string;
  number: number;
  title: string;
  status: 'VERIFIED' | 'FAILED';
  duration: string;
  timestamp: string;
  filesCount: number;
  modelUsed: string;
  agentMode: string;
}

export const RECENT_RUNS: RecentRunItem[] = [
  {
    id: 'run-1042',
    number: 1042,
    title: 'Fix auth-gateway-service: forward session token in client',
    status: 'VERIFIED',
    duration: '42s',
    timestamp: '12m ago',
    filesCount: 1,
    modelUsed: 'Qwen3-Coder-Next',
    agentMode: 'Dual Agent (Nav + Sup)',
  },
  {
    id: 'run-1041',
    number: 1041,
    title: 'Inject rate-limiter middleware into redis token bucket',
    status: 'VERIFIED',
    duration: '1m 18s',
    timestamp: '2h ago',
    filesCount: 3,
    modelUsed: 'DeepSeek-V3-Coder',
    agentMode: 'Supervisor AI',
  },
  {
    id: 'run-1040',
    number: 1040,
    title: 'Handle malformed JWT signature without unhandled rejection',
    status: 'VERIFIED',
    duration: '34s',
    timestamp: '5h ago',
    filesCount: 2,
    modelUsed: 'Kimi-K2.5-Agent',
    agentMode: 'Navigating AI',
  },
  {
    id: 'run-1039',
    number: 1039,
    title: 'Update database migration schema for user audit logs',
    status: 'VERIFIED',
    duration: '58s',
    timestamp: 'Yesterday',
    filesCount: 4,
    modelUsed: 'GLM-5-MoE',
    agentMode: 'Dual Agent (Nav + Sup)',
  },
];
