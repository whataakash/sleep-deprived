'use client';

import React, { useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth/context';
import { PlanTier, ModelProvider } from '@/types/models';
import {
  User,
  CreditCard,
  Sliders,
  Cpu,
  Shield,
  KeyRound,
  X,
  CheckCircle2,
  Trash2,
  Plus,
  Lock,
  ArrowUpRight,
  LogOut,
  Search,
  Palette,
  Code2,
  Bot,
  FolderGit2,
  Terminal,
  ShieldCheck,
  Bell,
  EyeOff,
  Sun,
  Moon,
  Laptop,
  Check,
} from 'lucide-react';
import { EvaluationModelAdapter } from '@/lib/models/evaluation-adapter';

interface AccountCenterProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: string;
}

interface SettingCategory {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

export function AccountCenter({ isOpen, onClose, initialCategory = 'general' }: AccountCenterProps) {
  const { session, updateProfile, updatePreferences, updatePlan, saveApiKey, removeApiKey, logout } =
    useAuth();
  const [activeCategory, setActiveCategory] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Form states
  const [nameInput, setNameInput] = useState(session.user?.name || '');
  const [emailInput, setEmailInput] = useState(session.user?.email || '');
  const [newKeyProvider, setNewKeyProvider] = useState<ModelProvider>('Qwen');
  const [newKeyValue, setNewKeyValue] = useState('');
  const [savedNotice, setSavedNotice] = useState(false);

  const isEvalMode = EvaluationModelAdapter.isEvaluationMode();
  const user = session.user;
  const prefs = user?.preferences;

  const CATEGORIES: SettingCategory[] = useMemo(
    () => [
      { id: 'general', label: 'General', icon: <Sliders className="w-4 h-4" />, description: 'Language, region, default repository & core defaults' },
      { id: 'appearance', label: 'Appearance', icon: <Palette className="w-4 h-4" />, description: 'Theme, density, typography & accents' },
      { id: 'editor', label: 'Editor', icon: <Code2 className="w-4 h-4" />, description: 'Font size, indentation, minimap & formatting' },
      { id: 'ai', label: 'AI & Models', icon: <Cpu className="w-4 h-4" />, description: 'Default routing, context budget & BYOK keys' },
      { id: 'agent', label: 'Agent Policy', icon: <Bot className="w-4 h-4" />, description: 'Autonomy level, sandboxing & approval rules' },
      { id: 'repository', label: 'Repository', icon: <FolderGit2 className="w-4 h-4" />, description: 'Default branch, ignore patterns & git behavior' },
      { id: 'terminal', label: 'Terminal', icon: <Terminal className="w-4 h-4" />, description: 'Shell execution, working directory & buffers' },
      { id: 'verification', label: 'Verification', icon: <ShieldCheck className="w-4 h-4" />, description: 'Automated test passes, typecheck & strictness' },
      { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" />, description: 'Run completions, failures & proof alerts' },
      { id: 'privacy', label: 'Privacy & Security', icon: <EyeOff className="w-4 h-4" />, description: 'Telemetry, retention & credential boundaries' },
      { id: 'account', label: 'Account Profile', icon: <User className="w-4 h-4" />, description: 'Personal details, sessions & credentials' },
      { id: 'billing', label: 'Plan & Billing', icon: <CreditCard className="w-4 h-4" />, description: 'Subscription tier, monthly quotas & invoices' },
    ],
    []
  );

  // Filter categories if searching
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return CATEGORIES;
    const q = searchQuery.toLowerCase();
    return CATEGORIES.filter(
      (c) => c.label.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
    );
  }, [searchQuery, CATEGORIES]);

  if (!isOpen) return null;

  const handleSaveNotice = () => {
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  const handleSaveProfile = () => {
    updateProfile({ name: nameInput, email: emailInput });
    handleSaveNotice();
  };

  const handleAddKey = () => {
    if (!newKeyValue.trim()) return;
    saveApiKey(newKeyProvider, newKeyValue.trim());
    setNewKeyValue('');
    handleSaveNotice();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div className="w-full max-w-4xl bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl shadow-2xl flex flex-col md:flex-row overflow-hidden max-h-[90vh] font-mono text-xs">
        {/* Left Secondary Nav */}
        <div className="w-full md:w-64 bg-[var(--bg-canvas)] border-b md:border-b-0 md:border-r border-[var(--border-subtle)] p-3 flex flex-col justify-between shrink-0">
          <div className="space-y-3">
            {/* Header & Search */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-wider">
                  Settings
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-muted)]">
                  IDE-Grade
                </span>
              </div>

              {/* Search input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Search settings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1.5 rounded bg-[var(--bg-panel)] border border-[var(--border-subtle)] text-[11px] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#ea580c]"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Category List */}
            <div className="space-y-0.5 max-h-[55vh] overflow-y-auto pr-1">
              {filteredCategories.map((cat) => {
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded text-left transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-[var(--bg-active)] text-white font-semibold border border-[var(--border-active)]'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-white'
                    }`}
                  >
                    <span className={isActive ? 'text-[#ea580c]' : 'text-[var(--text-muted)]'}>
                      {cat.icon}
                    </span>
                    <span className="truncate">{cat.label}</span>
                  </button>
                );
              })}

              {filteredCategories.length === 0 && (
                <div className="px-2 py-4 text-center text-[var(--text-muted)] text-[11px]">
                  No settings matching &quot;{searchQuery}&quot;
                </div>
              )}
            </div>
          </div>

          {/* Bottom user status & logout */}
          <div className="pt-3 border-t border-[var(--border-subtle)] mt-2">
            <button
              onClick={() => {
                logout();
                onClose();
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded text-[var(--text-muted)] hover:bg-[#ef4444]/10 hover:text-[#ef4444] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <LogOut className="w-3.5 h-3.5" />
                <span>Log out session</span>
              </div>
            </button>
          </div>
        </div>

        {/* Right Settings Content */}
        <div className="flex-1 flex flex-col justify-between overflow-hidden bg-[var(--bg-panel)]">
          {/* Top Bar with Category Title & Close Button */}
          <div className="px-6 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[var(--text-muted)] font-mono">
                  Settings /
                </span>
                <span className="font-bold text-sm text-[var(--text-primary)]">
                  {CATEGORIES.find((c) => c.id === activeCategory)?.label}
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                {CATEGORIES.find((c) => c.id === activeCategory)?.description}
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded bg-[var(--bg-subtle)] hover:bg-[var(--bg-active)] text-[var(--text-muted)] hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Settings Panel */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {savedNotice && (
              <div className="p-2.5 rounded bg-[#10b981]/15 border border-[#10b981]/30 text-[#10b981] flex items-center gap-2 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Settings preferences updated successfully.</span>
              </div>
            )}

            {/* 1. GENERAL */}
            {activeCategory === 'general' && (
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] text-[var(--text-secondary)] font-semibold block mb-1.5">
                    Interface Language
                  </label>
                  <select
                    value={prefs?.language || 'English'}
                    onChange={(e) => {
                      updatePreferences({ language: e.target.value });
                      handleSaveNotice();
                    }}
                    className="w-full max-w-sm px-3 py-1.5 rounded bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--text-primary)]"
                  >
                    <option value="English">English (US Developer standard)</option>
                    <option value="Spanish">Español</option>
                    <option value="German">Deutsch</option>
                    <option value="Mandarin">简体中文</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-[var(--text-secondary)] font-semibold block mb-1.5">
                    Inference Region & Latency
                  </label>
                  <select
                    value={prefs?.region || 'Global'}
                    onChange={(e) => {
                      updatePreferences({ region: e.target.value });
                      handleSaveNotice();
                    }}
                    className="w-full max-w-sm px-3 py-1.5 rounded bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--text-primary)]"
                  >
                    <option value="Global">Global Anycast (Lowest latency)</option>
                    <option value="US-East">US East (N. Virginia)</option>
                    <option value="EU-Central">EU Central (Frankfurt)</option>
                    <option value="AP-South">AP South (Mumbai)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-[var(--text-secondary)] font-semibold block mb-1.5">
                    Default Working Repository
                  </label>
                  <input
                    type="text"
                    value={prefs?.defaultRepositoryId || 'auth-gateway-service'}
                    onChange={(e) => {
                      updatePreferences({ defaultRepositoryId: e.target.value });
                    }}
                    className="w-full max-w-sm px-3 py-1.5 rounded bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--text-primary)]"
                  />
                </div>

                <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-[var(--text-primary)]">
                      Confirm Destructive Commands
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)]">
                      Require approval before executing `rm -rf`, `git reset --hard`, or database drop operations
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefs?.confirmDestructiveActions ?? true}
                    onChange={(e) => {
                      updatePreferences({ confirmDestructiveActions: e.target.checked });
                      handleSaveNotice();
                    }}
                    className="accent-[#ea580c] w-4 h-4 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* 2. APPEARANCE */}
            {activeCategory === 'appearance' && (
              <div className="space-y-5">
                <div>
                  <label className="text-[11px] text-[var(--text-secondary)] font-semibold block mb-2">
                    Theme Mode
                  </label>
                  <div className="grid grid-cols-3 gap-3 max-w-md">
                    {[
                      { id: 'light', label: 'Light', icon: <Sun className="w-4 h-4" />, desc: 'Warm white & graphite' },
                      { id: 'dark', label: 'Dark', icon: <Moon className="w-4 h-4" />, desc: 'Deep zinc & flame' },
                      { id: 'system', label: 'System', icon: <Laptop className="w-4 h-4" />, desc: 'Follow OS preference' },
                    ].map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          updatePreferences({ theme: t.id as any });
                          handleSaveNotice();
                        }}
                        className={`p-3 rounded-lg border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                          prefs?.theme === t.id
                            ? 'bg-[var(--bg-active)] border-[#ea580c] text-white shadow-xs'
                            : 'bg-[var(--bg-canvas)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-medium)]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={prefs?.theme === t.id ? 'text-[#ea580c]' : 'text-[var(--text-muted)]'}>
                            {t.icon}
                          </span>
                          {prefs?.theme === t.id && <Check className="w-3.5 h-3.5 text-[#ea580c]" />}
                        </div>
                        <span className="font-bold text-[12px]">{t.label}</span>
                        <span className="text-[9px] text-[var(--text-muted)] leading-tight">{t.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-[var(--border-subtle)]">
                  <label className="text-[11px] text-[var(--text-secondary)] font-semibold block mb-1.5">
                    Interface Density
                  </label>
                  <select
                    value={prefs?.density || 'comfortable'}
                    onChange={(e) => {
                      updatePreferences({ density: e.target.value as any });
                      handleSaveNotice();
                    }}
                    className="w-full max-w-sm px-3 py-1.5 rounded bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--text-primary)]"
                  >
                    <option value="comfortable">Comfortable (Standard developer spacing)</option>
                    <option value="compact">Compact (High density for small screens)</option>
                  </select>
                </div>

                <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-[var(--text-primary)]">
                      Reduced Motion
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)]">
                      Minimize timeline animations and background transitions
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefs?.reducedMotion ?? false}
                    onChange={(e) => {
                      updatePreferences({ reducedMotion: e.target.checked });
                      handleSaveNotice();
                    }}
                    className="accent-[#ea580c] w-4 h-4 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* 3. EDITOR */}
            {activeCategory === 'editor' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] text-[var(--text-secondary)] font-semibold block mb-1.5">
                      Font Size (px)
                    </label>
                    <input
                      type="number"
                      min={10}
                      max={20}
                      value={prefs?.fontSize || 13}
                      onChange={(e) => {
                        updatePreferences({ fontSize: Number(e.target.value) });
                        handleSaveNotice();
                      }}
                      className="w-full px-3 py-1.5 rounded bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--text-primary)]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-[var(--text-secondary)] font-semibold block mb-1.5">
                      Tab Size (Spaces)
                    </label>
                    <select
                      value={prefs?.tabSize || 2}
                      onChange={(e) => {
                        updatePreferences({ tabSize: Number(e.target.value) });
                        handleSaveNotice();
                      }}
                      className="w-full px-3 py-1.5 rounded bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--text-primary)]"
                    >
                      <option value={2}>2 spaces</option>
                      <option value={4}>4 spaces</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 border-t border-[var(--border-subtle)] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-[var(--text-primary)]">Word Wrap</div>
                      <div className="text-[11px] text-[var(--text-muted)]">Wrap long diff lines to viewport width</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={prefs?.wordWrap ?? true}
                      onChange={(e) => {
                        updatePreferences({ wordWrap: e.target.checked });
                        handleSaveNotice();
                      }}
                      className="accent-[#ea580c] w-4 h-4 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-[var(--text-primary)]">Line Numbers</div>
                      <div className="text-[11px] text-[var(--text-muted)]">Show line numbers in code diff and trace viewer</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={prefs?.lineNumbers ?? true}
                      onChange={(e) => {
                        updatePreferences({ lineNumbers: e.target.checked });
                        handleSaveNotice();
                      }}
                      className="accent-[#ea580c] w-4 h-4 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-[var(--text-primary)]">Bracket Matching</div>
                      <div className="text-[11px] text-[var(--text-muted)]">Highlight matching opening/closing braces</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={prefs?.bracketMatching ?? true}
                      onChange={(e) => {
                        updatePreferences({ bracketMatching: e.target.checked });
                        handleSaveNotice();
                      }}
                      className="accent-[#ea580c] w-4 h-4 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 4. AI & MODELS */}
            {activeCategory === 'ai' && (
              <div className="space-y-5">
                {isEvalMode && (
                  <div className="p-3 rounded bg-[#ea580c]/10 border border-[#ea580c]/30 text-[11px]">
                    <div className="flex items-center gap-1.5 font-bold text-[#ea580c] mb-1">
                      <Lock className="w-3.5 h-3.5" />
                      <span>EVALUATION MODE ACTIVE</span>
                    </div>
                    <p className="text-[var(--text-muted)]">
                      Per Hackathon guidelines, model selection is locked to the official prescribed evaluation model using `AI_API_KEY`. Custom routing and substitution are disabled during official evaluation.
                    </p>
                  </div>
                )}

                <div>
                  <label className="text-[11px] text-[var(--text-secondary)] font-semibold block mb-1.5">
                    Default Coding Model (Product Mode)
                  </label>
                  <select
                    disabled={isEvalMode}
                    value={prefs?.defaultModelId || 'qwen3-coder-next'}
                    onChange={(e) => {
                      updatePreferences({ defaultModelId: e.target.value });
                      handleSaveNotice();
                    }}
                    className="w-full max-w-sm px-3 py-1.5 rounded bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--text-primary)] disabled:opacity-50"
                  >
                    <option value="qwen3-coder-next">Qwen3-Coder-Next (Flagship Open-Weight)</option>
                    <option value="kimi-k2-5-agent">Kimi K2.5 Multimodal Agentic</option>
                    <option value="glm-5-moe">GLM-5 MoE Reasoning Agent</option>
                    <option value="deepseek-v3-coder">DeepSeek V3 Coder</option>
                    <option value="openrouter-llama-3-3-70b">Meta Llama 3.3 70B (OpenRouter)</option>
                    <option value="grok-2-coder">Grok 2 Coder Beta (xAI)</option>
                    <option value="grok-3-hybrid">Grok 3 Hybrid Reasoning (xAI)</option>
                    <option value="claude-3-7-sonnet">Claude 3.7 Sonnet (Hybrid Reasoning)</option>
                    <option value="ollama-local-qwen3">Local / Ollama (Air-Gapped)</option>
                  </select>
                </div>

                {/* BYOK Keys Section */}
                <div className="pt-3 border-t border-[var(--border-subtle)]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-[var(--text-primary)]">
                      Bring-Your-Own-Key (BYOK) Credentials
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)]">Stored securely</span>
                  </div>

                  <div className="space-y-2 mb-3">
                    {user?.apiKeys && user.apiKeys.length > 0 ? (
                      user.apiKeys.map((k) => (
                        <div
                          key={k.provider}
                          className="flex items-center justify-between p-2 rounded bg-[var(--bg-canvas)] border border-[var(--border-subtle)]"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[11px]">{k.provider}</span>
                            <span className="text-[10px] font-mono text-[var(--text-muted)]">{k.maskedKey}</span>
                          </div>
                          <button
                            onClick={() => removeApiKey(k.provider)}
                            className="p-1 text-[var(--text-muted)] hover:text-[#ef4444]"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-center text-[var(--text-muted)] border border-dashed border-[var(--border-subtle)] rounded">
                        No custom API keys added. Using free hosted tier & local models.
                      </div>
                    )}
                  </div>

                  {/* Add key form */}
                  <div className="flex gap-2">
                    <select
                      value={newKeyProvider}
                      onChange={(e) => setNewKeyProvider(e.target.value as ModelProvider)}
                      className="px-2.5 py-1.5 rounded bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[11px] text-[var(--text-primary)]"
                    >
                      <option value="Qwen">Qwen</option>
                      <option value="Moonshot">Moonshot (Kimi)</option>
                      <option value="Z.ai">Z.ai (GLM)</option>
                      <option value="DeepSeek">DeepSeek</option>
                      <option value="OpenRouter">OpenRouter</option>
                      <option value="xAI">xAI (Grok)</option>
                      <option value="Anthropic">Anthropic</option>
                    </select>

                    <input
                      type="password"
                      placeholder="sk-..."
                      value={newKeyValue}
                      onChange={(e) => setNewKeyValue(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[11px] text-[var(--text-primary)] placeholder-[var(--text-muted)]"
                    />

                    <button
                      onClick={handleAddKey}
                      className="px-3 py-1.5 rounded bg-[#ea580c] hover:bg-[#f97316] text-white font-semibold cursor-pointer"
                    >
                      Save Key
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 5. AGENT POLICY */}
            {activeCategory === 'agent' && (
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] text-[var(--text-secondary)] font-semibold block mb-1.5">
                    Harness Autonomy Level
                  </label>
                  <select
                    value={prefs?.autonomyLevel || 'AUTONOMOUS'}
                    onChange={(e) => {
                      updatePreferences({ autonomyLevel: e.target.value as any });
                      handleSaveNotice();
                    }}
                    className="w-full max-w-sm px-3 py-1.5 rounded bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--text-primary)]"
                  >
                    <option value="AUTONOMOUS">Autonomous (Understand, Edit, Verify, Recover automatically)</option>
                    <option value="ASSISTED">Assisted (Pause for confirmation before applying file diffs)</option>
                    <option value="READ_ONLY">Read-Only (Analysis and diagnostics without modifying repository)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-[var(--text-secondary)] font-semibold block mb-1.5">
                    Maximum Autonomous Recovery Retries
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={prefs?.maxRetries || 3}
                    onChange={(e) => {
                      updatePreferences({ maxRetries: Number(e.target.value) });
                      handleSaveNotice();
                    }}
                    className="w-24 px-3 py-1.5 rounded bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--text-primary)]"
                  />
                  <span className="text-[10px] text-[var(--text-muted)] ml-2">Attempts before escalating to user</span>
                </div>

                <div className="pt-2 border-t border-[var(--border-subtle)]">
                  <label className="text-[11px] text-[var(--text-secondary)] font-semibold block mb-1.5">
                    Sandbox Network Egress Policy
                  </label>
                  <select
                    value={prefs?.networkPolicy || 'air_gapped'}
                    onChange={(e) => {
                      updatePreferences({ networkPolicy: e.target.value as any });
                      handleSaveNotice();
                    }}
                    className="w-full max-w-sm px-3 py-1.5 rounded bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--text-primary)]"
                  >
                    <option value="air_gapped">Air-Gapped (Zero outbound network access in sandbox)</option>
                    <option value="whitelisted">Whitelisted (Package registry npm/pnpm only)</option>
                    <option value="unrestricted">Unrestricted (Developer local mode)</option>
                  </select>
                </div>
              </div>
            )}

            {/* 6. REPOSITORY */}
            {activeCategory === 'repository' && (
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] text-[var(--text-secondary)] font-semibold block mb-1.5">
                    Default Git Branch
                  </label>
                  <input
                    type="text"
                    value={prefs?.defaultBranch || 'main'}
                    onChange={(e) => {
                      updatePreferences({ defaultBranch: e.target.value });
                    }}
                    className="w-full max-w-xs px-3 py-1.5 rounded bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--text-primary)]"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-[var(--text-secondary)] font-semibold block mb-1.5">
                    Ignored Paths & Patterns
                  </label>
                  <div className="p-2.5 rounded bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[11px] text-[var(--text-muted)] font-mono">
                    .git/, node_modules/, dist/, .next/, *.lock, *.pyc
                  </div>
                </div>
              </div>
            )}

            {/* 7. TERMINAL */}
            {activeCategory === 'terminal' && (
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] text-[var(--text-secondary)] font-semibold block mb-1.5">
                    Terminal Shell
                  </label>
                  <select className="w-full max-w-sm px-3 py-1.5 rounded bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--text-primary)]">
                    <option value="/bin/zsh">/bin/zsh (Default macOS shell)</option>
                    <option value="/bin/bash">/bin/bash</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-[var(--text-secondary)] font-semibold block mb-1.5">
                    Working Directory
                  </label>
                  <div className="p-2 rounded bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[11px] text-[var(--text-muted)]">
                    /Users/shivanshpandey/Desktop/sleep-deprived
                  </div>
                </div>
              </div>
            )}

            {/* 8. VERIFICATION */}
            {activeCategory === 'verification' && (
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-[var(--text-primary)]">Automated Test Execution</div>
                      <div className="text-[11px] text-[var(--text-muted)]">Run unit and integration tests automatically on patch creation</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={prefs?.runTestsAuto ?? true}
                      onChange={(e) => {
                        updatePreferences({ runTestsAuto: e.target.checked });
                        handleSaveNotice();
                      }}
                      className="accent-[#ea580c] w-4 h-4 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-[var(--text-primary)]">Typecheck Compiler Check</div>
                      <div className="text-[11px] text-[var(--text-muted)]">Run `tsc --noEmit` to verify type safety across modified AST</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={prefs?.runTypecheckAuto ?? true}
                      onChange={(e) => {
                        updatePreferences({ runTypecheckAuto: e.target.checked });
                        handleSaveNotice();
                      }}
                      className="accent-[#ea580c] w-4 h-4 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-[var(--text-primary)]">Production Build Validation</div>
                      <div className="text-[11px] text-[var(--text-muted)]">Verify clean production bundle build before sealing proof</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={prefs?.runBuildAuto ?? true}
                      onChange={(e) => {
                        updatePreferences({ runBuildAuto: e.target.checked });
                        handleSaveNotice();
                      }}
                      className="accent-[#ea580c] w-4 h-4 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-[var(--border-subtle)]">
                  <label className="text-[11px] text-[var(--text-secondary)] font-semibold block mb-1.5">
                    Verification Strictness
                  </label>
                  <select
                    value={prefs?.verificationStrictness || 'strict'}
                    onChange={(e) => {
                      updatePreferences({ verificationStrictness: e.target.value as any });
                      handleSaveNotice();
                    }}
                    className="w-full max-w-sm px-3 py-1.5 rounded bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--text-primary)]"
                  >
                    <option value="strict">Strict (All tests + typecheck + regression invariant)</option>
                    <option value="standard">Standard (Unit tests pass)</option>
                    <option value="formal">Formal (Zero regressions + cryptographic hash seal)</option>
                  </select>
                </div>
              </div>
            )}

            {/* 9. NOTIFICATIONS */}
            {activeCategory === 'notifications' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-[var(--text-primary)]">Notify on Proof Sealed</div>
                    <div className="text-[11px] text-[var(--text-muted)]">Send system audio and desktop alert when run is verified</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefs?.notifyOnVerification ?? true}
                    onChange={(e) => {
                      updatePreferences({ notifyOnVerification: e.target.checked });
                      handleSaveNotice();
                    }}
                    className="accent-[#ea580c] w-4 h-4 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-[var(--text-primary)]">Notify on Failure</div>
                    <div className="text-[11px] text-[var(--text-muted)]">Alert when retries exhaust and user intervention is needed</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefs?.notifyOnFailure ?? true}
                    onChange={(e) => {
                      updatePreferences({ notifyOnFailure: e.target.checked });
                      handleSaveNotice();
                    }}
                    className="accent-[#ea580c] w-4 h-4 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* 10. PRIVACY & SECURITY */}
            {activeCategory === 'privacy' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-[var(--text-primary)]">Anonymous Usage Telemetry</div>
                    <div className="text-[11px] text-[var(--text-muted)]">Send anonymized benchmark metrics (Default: OFF)</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefs?.telemetry ?? false}
                    onChange={(e) => {
                      updatePreferences({ telemetry: e.target.checked });
                      handleSaveNotice();
                    }}
                    className="accent-[#ea580c] w-4 h-4 cursor-pointer"
                  />
                </div>

                <div className="p-3 rounded bg-[var(--bg-canvas)] border border-[var(--border-subtle)] space-y-2">
                  <div className="font-bold text-[11px] text-[var(--text-primary)] flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-[#10b981]" />
                    <span>Zero-Credential Storage Guarantee</span>
                  </div>
                  <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">
                    Evaluator credentials provided via `AI_API_KEY` are consumed exclusively in process memory and are never persisted to localStorage, cookies, or git commits.
                  </p>
                </div>
              </div>
            )}

            {/* 11. ACCOUNT PROFILE */}
            {activeCategory === 'account' && (
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] text-[var(--text-secondary)] font-semibold block mb-1.5">
                    Developer Name
                  </label>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="w-full max-w-sm px-3 py-1.5 rounded bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--text-primary)]"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-[var(--text-secondary)] font-semibold block mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full max-w-sm px-3 py-1.5 rounded bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--text-primary)]"
                  />
                </div>

                <button
                  onClick={handleSaveProfile}
                  className="px-4 py-1.5 rounded bg-[#ea580c] hover:bg-[#f97316] text-white font-semibold cursor-pointer"
                >
                  Save Profile
                </button>
              </div>
            )}

            {/* 12. BILLING & PLAN */}
            {activeCategory === 'billing' && (
              <div className="space-y-4">
                <div className="p-3 rounded bg-[var(--bg-canvas)] border border-[var(--border-subtle)] flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-[var(--text-muted)]">Current Subscription Plan</div>
                    <div className="font-extrabold text-base text-white">{user?.plan || 'BUILDER'}</div>
                    <div className="text-[10px] text-[#10b981]">Active • Renews automatically</div>
                  </div>
                  <span className="text-[10px] px-2 py-1 rounded bg-[#ea580c]/15 text-[#ea580c] font-bold">
                    BUILDER TIER
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[var(--text-muted)]">Monthly Autonomous Runs:</span>
                    <span className="font-bold text-white">
                      {user?.usage.runsUsedThisMonth || 14} / {user?.usage.maxMonthlyRuns || 150}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                    <div className="h-full bg-[#ea580c]" style={{ width: '9.3%' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
