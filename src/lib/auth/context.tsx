'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, AuthSession, UserPreferences } from '@/types/auth';
import { PlanTier, UserApiKey, ModelProvider } from '@/types/models';

const DEFAULT_USER: UserProfile = {
  id: 'usr-shivansh-dev',
  name: 'Shivansh Pandey',
  email: 'shivansh@devclub.in',
  avatarUrl: '',
  plan: 'BUILDER',
  createdAt: '2026-09-01T10:00:00Z',
  lastLoginAt: '2026-09-26T10:48:00Z',
  preferences: {
    theme: 'dark',
    reducedMotion: false,
    density: 'comfortable',
    accentColor: '#ea580c',
    language: 'English',
    region: 'Global',
    defaultRepositoryId: 'auth-gateway-service',
    defaultBranch: 'main',
    defaultModelId: 'qwen3-coder-next',
    personality: 'forge',
    autoApproveSafeTools: true,
    confirmDestructiveActions: true,
    notifyOnVerification: true,
    notifyOnFailure: true,

    fontSize: 13,
    tabSize: 2,
    wordWrap: true,
    lineNumbers: true,
    minimap: false,
    bracketMatching: true,

    autonomyLevel: 'AUTONOMOUS',
    maxRetries: 3,
    toolApprovalPolicy: 'destructive_only',
    networkPolicy: 'air_gapped',
    sandboxPolicy: 'strict_chroot',

    runTestsAuto: true,
    runTypecheckAuto: true,
    runLintAuto: true,
    runBuildAuto: true,
    verificationStrictness: 'strict',

    telemetry: false,
    dataRetentionDays: 30,
    shareCrashDumps: false,
  },
  usage: {
    runsUsedThisMonth: 14,
    maxMonthlyRuns: 150,
    tokensUsedThisMonth: 38450,
    totalTasksVerified: 12,
    providerCostAccruedUsd: 0.18,
  },
  apiKeys: [
    {
      provider: 'Moonshot',
      maskedKey: 'sk-kimi-••••••••••••••••••••38f9',
      isValid: true,
      updatedAt: '2026-09-20',
    },
    {
      provider: 'DeepSeek',
      maskedKey: 'sk-dseek-••••••••••••••••••••91c2',
      isValid: true,
      updatedAt: '2026-09-22',
    },
  ],
};

interface AuthContextType {
  session: AuthSession;
  login: (email: string) => void;
  logout: () => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  updatePreferences: (updates: Partial<UserPreferences>) => void;
  updatePlan: (newPlan: PlanTier) => void;
  saveApiKey: (provider: ModelProvider, key: string) => void;
  removeApiKey: (provider: ModelProvider) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(DEFAULT_USER);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);

  // Load from localStorage if present
  useEffect(() => {
    try {
      const saved = localStorage.getItem('forge_user_profile');
      if (saved) {
        setUser(JSON.parse(saved));
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Sync theme with document class with reactive system preference listener
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const theme = user?.preferences?.theme || 'dark';

    const applyTheme = () => {
      if (theme === 'light') {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
        document.documentElement.setAttribute('data-theme', 'light');
      } else if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        // System preference
        const media = window.matchMedia('(prefers-color-scheme: dark)');
        const prefersDark = media.matches;
        document.documentElement.classList.toggle('dark', prefersDark);
        document.documentElement.classList.toggle('light', !prefersDark);
        document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
      }
    };

    applyTheme();

    if (theme === 'system') {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme();
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    }
  }, [user?.preferences?.theme]);

  const saveUser = (u: UserProfile | null) => {
    setUser(u);
    try {
      if (u) {
        localStorage.setItem('parishram_user_profile', JSON.stringify(u));
        localStorage.setItem('forge_user_profile', JSON.stringify(u));
      } else {
        localStorage.removeItem('parishram_user_profile');
        localStorage.removeItem('forge_user_profile');
      }
    } catch (e) {
      // ignore
    }
  };

  const login = (email: string) => {
    const updated: UserProfile = {
      ...DEFAULT_USER,
      email,
      lastLoginAt: new Date().toISOString(),
    };
    saveUser(updated);
    setIsAuthenticated(true);
  };

  const logout = () => {
    saveUser(null);
    setIsAuthenticated(false);
  };

  const updateProfile = (updates: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    saveUser(updated);
  };

  const updatePreferences = (updates: Partial<UserPreferences>) => {
    if (!user) return;
    const updated: UserProfile = {
      ...user,
      preferences: { ...user.preferences, ...updates },
    };
    saveUser(updated);
  };

  const updatePlan = (newPlan: PlanTier) => {
    if (!user) return;
    const maxRuns = newPlan === 'FREE' ? 25 : newPlan === 'BUILDER' ? 150 : newPlan === 'PRO' ? 500 : 'Unlimited';
    const updated: UserProfile = {
      ...user,
      plan: newPlan,
      usage: {
        ...user.usage,
        maxMonthlyRuns: maxRuns,
      },
    };
    saveUser(updated);
  };

  const saveApiKey = (provider: ModelProvider, key: string) => {
    if (!user) return;
    const masked = `${key.slice(0, 6)}••••••••••••••••••••${key.slice(-4)}`;
    const filtered = (user.apiKeys || []).filter((k) => k.provider !== provider);
    const updatedKeys: UserApiKey[] = [
      ...filtered,
      {
        provider,
        maskedKey: masked,
        isValid: true,
        updatedAt: new Date().toISOString().split('T')[0],
      },
    ];
    updateProfile({ apiKeys: updatedKeys });
  };

  const removeApiKey = (provider: ModelProvider) => {
    if (!user) return;
    const filtered = (user.apiKeys || []).filter((k) => k.provider !== provider);
    updateProfile({ apiKeys: filtered });
  };

  return (
    <AuthContext.Provider
      value={{
        session: {
          user,
          isAuthenticated,
          isAnonymousDemo: !isAuthenticated,
        },
        login,
        logout,
        updateProfile,
        updatePreferences,
        updatePlan,
        saveApiKey,
        removeApiKey,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
