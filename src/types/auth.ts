import { PlanTier, UserApiKey } from './models';

export interface UserPreferences {
  theme: 'dark' | 'light' | 'system';
  reducedMotion: boolean;
  density: 'compact' | 'comfortable';
  accentColor: string;
  language: string;
  region: string;
  defaultRepositoryId: string;
  defaultBranch: string;
  defaultModelId: string;
  personality: 'professional' | 'forge';
  autoApproveSafeTools: boolean;
  confirmDestructiveActions: boolean;
  notifyOnVerification: boolean;
  notifyOnFailure: boolean;

  // Editor
  fontSize: number;
  tabSize: number;
  wordWrap: boolean;
  lineNumbers: boolean;
  minimap: boolean;
  bracketMatching: boolean;

  // Agent
  autonomyLevel: 'READ_ONLY' | 'ASSISTED' | 'AUTONOMOUS';
  maxRetries: number;
  toolApprovalPolicy: 'always_ask' | 'destructive_only' | 'autonomous';
  networkPolicy: 'air_gapped' | 'whitelisted' | 'unrestricted';
  sandboxPolicy: 'strict_chroot' | 'standard_sandbox';

  // Verification
  runTestsAuto: boolean;
  runTypecheckAuto: boolean;
  runLintAuto: boolean;
  runBuildAuto: boolean;
  verificationStrictness: 'standard' | 'strict' | 'formal';

  // Privacy & Telemetry
  telemetry: boolean;
  dataRetentionDays: number;
  shareCrashDumps: boolean;
}

export interface UserUsage {
  runsUsedThisMonth: number;
  maxMonthlyRuns: number | 'Unlimited';
  tokensUsedThisMonth: number;
  totalTasksVerified: number;
  providerCostAccruedUsd: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  plan: PlanTier;
  createdAt: string;
  lastLoginAt: string;
  preferences: UserPreferences;
  usage: UserUsage;
  apiKeys: UserApiKey[];
}

export interface AuthSession {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isAnonymousDemo: boolean;
}
