'use client';

import React, { useState, useMemo } from 'react';
import {
  ModelCategory,
  CURRENT_2026_MODELS,
  ParishramAIRouter,
} from '@/lib/models/gateway';
import { EntitlementService } from '@/lib/billing/entitlements';
import { useAuth } from '@/lib/auth/context';
import {
  Cpu,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Zap,
  Sliders,
  Flame,
  Check,
  Server,
  Layers,
  HelpCircle,
  Bot,
} from 'lucide-react';

import { ModelArena } from './model-arena';

interface ModelMarketplaceProps {
  currentModelId: string;
  onSelectModel: (modelId: string) => void;
  onOpenAccountKeys?: () => void;
  onOpenUpgrade?: () => void;
}

export function ModelMarketplace({
  currentModelId,
  onSelectModel,
}: ModelMarketplaceProps) {
  const { session } = useAuth();
  const user = session.user;

  const [activeTab, setActiveTab] = useState<'catalog' | 'configure' | 'arena'>('catalog');
  const [activeCategory, setActiveCategory] = useState<ModelCategory | 'ALL'>('ALL');

  // Parishram AI Tier Assignment Configuration
  const [lowLevelModelId, setLowLevelModelId] = useState<string>('qwen3-coder-next');
  const [frontierModelId, setFrontierModelId] = useState<string>('claude-3-7-sonnet');
  const [autoEscalate, setAutoEscalate] = useState<boolean>(true);

  // Difficulty Simulator
  const [taskQuery, setTaskQuery] = useState('Audit scope enforcement and run test suite across workspace');

  // Evaluate difficulty live for simulator
  const simDifficulty = useMemo(() => {
    return ParishramAIRouter.evaluateDifficulty(taskQuery, 2, 0);
  }, [taskQuery]);

  const lowLevelModel = CURRENT_2026_MODELS.find((m) => m.id === lowLevelModelId) || CURRENT_2026_MODELS[1];
  const frontierModel = CURRENT_2026_MODELS.find((m) => m.id === frontierModelId) || CURRENT_2026_MODELS[3];

  const filteredModels = CURRENT_2026_MODELS.filter((m) => {
    if (activeCategory === 'ALL') return true;
    return m.category === activeCategory;
  });

  return (
    <div className="flex-1 flex flex-col bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl overflow-hidden font-sans transition-colors">
      {/* Header bar */}
      <div className="p-4 bg-[var(--bg-elevated)] border-b border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-[#ea580c]/12 border border-[#ea580c]/30 text-[#ea580c]">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-[var(--text-primary)] text-sm tracking-wide">
                INTELLIGENCE & MODELS
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#10b981]/15 text-[#10b981] font-bold border border-[#10b981]/30">
                Parishram AI Active
              </span>
            </div>
            <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
              Available models, capabilities, routing heuristics, and baseline arena comparisons
            </div>
          </div>
        </div>

        {/* View mode tabs */}
        <div className="flex items-center gap-1 bg-[var(--bg-canvas)] p-1 rounded-lg border border-[var(--border-subtle)]">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'catalog'
                ? 'bg-[#ea580c] text-white font-bold shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Available Models</span>
          </button>

          <button
            onClick={() => setActiveTab('configure')}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'configure'
                ? 'bg-[#ea580c] text-white font-bold shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Routing & Context</span>
          </button>

          <button
            onClick={() => setActiveTab('arena')}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'arena'
                ? 'bg-[#ea580c] text-white font-bold shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Model Arena</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* ==================================================================== */}
        {/* TAB 1: PARISHRAM AI SMART ROUTER & TIER ASSIGNMENT                   */}
        {/* ==================================================================== */}
        {activeTab === 'configure' && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Banner: What is Parishram AI? */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-[#ea580c]/12 via-[var(--bg-canvas)] to-[var(--bg-panel)] border border-[#ea580c]/30 space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#ea580c]">
                <Bot className="w-4 h-4" />
                <span>PARISHRAM AI — SMART DIFFICULTY DISPATCHER</span>
              </div>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                You don't need to manually pick an AI model for every sub-task. <strong>Parishram AI</strong> automatically analyzes incoming tasks: simple/low-level tasks (symbol searching, syntax fixes, documentation) are routed to <strong>Free/Local Open-Source models</strong>, while complex engineering (architecture, race conditions, auth flows) is dispatched to <strong>Frontier Models</strong>.
              </p>
            </div>

            {/* Model Tier Assignment Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Low-Level / Simple Task Model Card */}
              <div className="p-5 rounded-xl bg-[var(--bg-canvas)] border border-emerald-500/30 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      TIER 1: LOW-LEVEL / SIMPLE TASKS
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono font-semibold">Zero / Low Cost</span>
                  </div>
                  <h3 className="font-bold text-sm text-[var(--text-primary)]">
                    Fast & Open-Source Coding Model
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    Assigned to: AST symbol extraction, typo fixes, 1-file syntax edits, writing doc comments, and initial error classification.
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-[var(--border-subtle)]">
                  <label className="text-[11px] text-[var(--text-muted)] font-mono font-semibold block">
                    Assigned Low-Level Model:
                  </label>
                  <select
                    value={lowLevelModelId}
                    onChange={(e) => setLowLevelModelId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-panel)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-mono outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="qwen3-coder-next">Qwen3-Coder-Next (262k Context, Free Hosted)</option>
                    <option value="ollama-local-qwen3">Local Ollama / Qwen 2.5 Coder 7B (100% Offline)</option>
                    <option value="deepseek-v3-coder">DeepSeek V3 Coder (Fast & Low Cost)</option>
                  </select>
                  <div className="text-[11px] text-[var(--text-muted)] font-mono">
                    Active: <strong>{lowLevelModel.displayName}</strong> ({lowLevelModel.accessType})
                  </div>
                </div>
              </div>

              {/* Frontier / Complex Task Model Card */}
              <div className="p-5 rounded-xl bg-[var(--bg-canvas)] border border-purple-500/30 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-purple-500/15 text-purple-400 border border-purple-500/30">
                      TIER 2: COMPLEX & FRONTIER TASKS
                    </span>
                    <span className="text-[10px] text-purple-400 font-mono font-semibold">High Reasoning</span>
                  </div>
                  <h3 className="font-bold text-sm text-[var(--text-primary)]">
                    Frontier High-Capacity Model
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    Assigned to: Distributed auth lifecycles, concurrency/race conditions, multi-file refactoring, difficult test recovery, and proof seals.
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-[var(--border-subtle)]">
                  <label className="text-[11px] text-[var(--text-muted)] font-mono font-semibold block">
                    Assigned Frontier Model:
                  </label>
                  <select
                    value={frontierModelId}
                    onChange={(e) => setFrontierModelId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-panel)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-mono outline-none focus:border-purple-500 cursor-pointer"
                  >
                    <option value="claude-3-7-sonnet">Claude 3.7 Sonnet (Hybrid Reasoning, Flagship)</option>
                    <option value="deepseek-v3-coder">DeepSeek V3 (State of the art open weights)</option>
                    <option value="kimi-k2-5-agent">Kimi K2.5 Multimodal Agent</option>
                  </select>
                  <div className="text-[11px] text-[var(--text-muted)] font-mono">
                    Active: <strong>{frontierModel.displayName}</strong> ({frontierModel.accessType})
                  </div>
                </div>
              </div>
            </div>

            {/* Auto-Escalation Circuit Breaker Toggle */}
            <div className="p-4 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] flex items-center justify-between gap-4 font-mono text-xs">
              <div className="space-y-0.5">
                <div className="font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-[#fbbf24]" />
                  <span>Automatic Retry Escalation</span>
                </div>
                <div className="text-[11px] text-[var(--text-muted)] font-sans">
                  If the low-level model fails tests 2 times in a row, Parishram AI automatically escalates the recovery task to the Frontier model.
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoEscalate}
                  onChange={(e) => setAutoEscalate(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-[var(--bg-subtle)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#ea580c]"></div>
              </label>
            </div>

            {/* Live Difficulty Classifier & Simulator */}
            <div className="p-5 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="font-bold text-[var(--text-primary)] text-sm">
                    Interactive Task Difficulty Tester
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] font-sans">
                    Type any engineering task to see how Parishram AI scores it and decides which model to dispatch.
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={taskQuery}
                  onChange={(e) => setTaskQuery(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 rounded-lg bg-[var(--bg-panel)] border border-[var(--border-subtle)] text-[var(--text-primary)] outline-none focus:border-[#ea580c] font-sans text-xs"
                  placeholder="Type an engineering task to evaluate..."
                />
              </div>

              {/* Simulation Result */}
              <div className="p-4 rounded-xl bg-[var(--bg-panel)] border border-[var(--border-subtle)] space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--text-muted)] text-[11px]">DIFFICULTY SCORE:</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        simDifficulty.tier === 'FRONTIER'
                          ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                          : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {simDifficulty.score} / 10 ({simDifficulty.tier === 'FRONTIER' ? 'High Complexity' : 'Low-Level / Atomic'})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[var(--text-muted)] text-[11px]">DISPATCHED MODEL:</span>
                    <span className="font-bold text-[var(--text-primary)]">
                      {simDifficulty.tier === 'FRONTIER' ? frontierModel.displayName : lowLevelModel.displayName}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[var(--bg-canvas)] text-[var(--text-secondary)] font-sans text-xs leading-relaxed border border-[var(--border-subtle)]">
                  <strong className="text-[var(--text-primary)] font-mono">Parishram AI Reasoning: </strong>
                  {simDifficulty.explanation}
                </div>

                {simDifficulty.signals.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="text-[var(--text-muted)]">Detected Signals:</span>
                    {simDifficulty.signals.map((sig, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-mono text-[10px]"
                      >
                        {sig}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}



        {/* ==================================================================== */}
        {/* TAB 3: MODEL CATALOG & MARKETPLACE                                   */}
        {/* ==================================================================== */}
        {activeTab === 'catalog' && (
          <div className="space-y-4">
            {/* Category filter pills */}
            <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
              <span className="text-[var(--text-muted)] text-[11px]">Filter Category:</span>
              {(['ALL', 'AGENTIC', 'CODING', 'REASONING', 'LOCAL'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer text-xs ${
                    activeCategory === cat
                      ? 'bg-[var(--bg-active)] text-[var(--text-primary)] font-bold border border-[var(--border-active)] shadow-xs'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)] border border-transparent'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Model Card Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-mono text-xs">
              {filteredModels.map((model) => {
                const isSelected = model.id === currentModelId;
                const isLowLevel = model.id === lowLevelModelId;
                const isFrontier = model.id === frontierModelId;
                const entitlement = EntitlementService.canUseModel(user, model);

                return (
                  <div
                    key={model.id}
                    className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                      isSelected
                        ? 'bg-[var(--bg-elevated)] border-[#ea580c] ring-1 ring-[#ea580c]/30 shadow-sm'
                        : 'bg-[var(--bg-canvas)] border-[var(--border-subtle)] hover:border-[var(--border-medium)]'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-1.5">
                            <span>{model.displayName}</span>
                            {model.openSource && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30">
                                Open Source
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[var(--text-muted)]">
                            {model.provider} • {model.family}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-[var(--bg-subtle)] text-[var(--text-primary)] border border-[var(--border-subtle)]">
                            {model.accessType.replace('_', ' ')}
                          </span>

                          {isLowLevel && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                              LOW-LEVEL SLOT
                            </span>
                          )}
                          {isFrontier && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-400 font-bold">
                              FRONTIER SLOT
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Score metrics */}
                      <div className="grid grid-cols-3 gap-2 py-2 border-y border-[var(--border-subtle)] text-center">
                        <div>
                          <div className="text-[9px] text-[var(--text-muted)]">CODING</div>
                          <div className="font-bold text-[#38bdf8] text-xs">{model.codingScore}</div>
                        </div>
                        <div>
                          <div className="text-[9px] text-[var(--text-muted)]">REASONING</div>
                          <div className="font-bold text-[#a78bfa] text-xs">{model.reasoningScore}</div>
                        </div>
                        <div>
                          <div className="text-[9px] text-[var(--text-muted)]">AGENTIC</div>
                          <div className="font-bold text-[#10b981] text-xs">{model.agentScore}</div>
                        </div>
                      </div>

                      <div className="text-[11px] text-[var(--text-secondary)] font-sans leading-relaxed line-clamp-2">
                        {model.whyThisModelRationale}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)]">
                        <span>Context: {(model.contextLength / 1000).toFixed(0)}k</span>
                        <span>{model.inputCostPer1k === 0 ? 'Free inference' : `$${model.inputCostPer1k}/1k`}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 border-t border-[var(--border-subtle)] space-y-2">
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          onClick={() => setLowLevelModelId(model.id)}
                          className={`py-1 rounded text-[10px] font-semibold border transition-colors cursor-pointer ${
                            isLowLevel
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                              : 'bg-[var(--bg-panel)] hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] border-[var(--border-subtle)]'
                          }`}
                        >
                          {isLowLevel ? '✓ Low-Level' : 'Set Low-Level'}
                        </button>
                        <button
                          onClick={() => setFrontierModelId(model.id)}
                          className={`py-1 rounded text-[10px] font-semibold border transition-colors cursor-pointer ${
                            isFrontier
                              ? 'bg-purple-500/20 text-purple-400 border-purple-500/40'
                              : 'bg-[var(--bg-panel)] hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] border-[var(--border-subtle)]'
                          }`}
                        >
                          {isFrontier ? '✓ Frontier' : 'Set Frontier'}
                        </button>
                      </div>

                      <button
                        onClick={() => onSelectModel(model.id)}
                        className={`w-full py-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#ea580c] text-white shadow-xs'
                            : 'bg-[var(--bg-panel)] hover:bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-subtle)]'
                        }`}
                      >
                        {isSelected ? 'ACTIVE IN HARNESS' : 'SELECT MODEL'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 4: MODEL ARENA                                                   */}
        {/* ==================================================================== */}
        {activeTab === 'arena' && (
          <ModelArena onApplyWinner={(cand) => onSelectModel(cand.modelId)} />
        )}
      </div>
    </div>
  );
}
