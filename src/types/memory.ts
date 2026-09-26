export interface EngineeringFact {
  id: string;
  statement: string;
  source: 'agent_recovery' | 'user_input' | 'verification_harness' | 'repo_config';
  scope: 'global' | 'auth' | 'tests' | 'build' | 'deps' | 'api';
  confidence: number; // 0 - 100
  createdAt: string;
  updatedAt: string;
  status: 'approved' | 'pending_review' | 'ignored';
  usageCount: number;
  lastAppliedRunId?: string;
}

export interface MemoryQuery {
  scope?: string;
  keyword?: string;
  onlyApproved?: boolean;
}
