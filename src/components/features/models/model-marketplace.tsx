'use client';

import React, { useState } from 'react';
import { CURRENT_2026_MODELS, ModelRouter, FreeModelResolver } from '@/lib/models/gateway';
import { DynamicCodingModel, ModelCategory } from '@/types/models';
import { useAuth } from '@/lib/auth/context';
import { EntitlementService } from '@/lib/billing/entitlements';
import {
  Cpu,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  Zap,
  Server,
  Lock,
  ExternalLink,
  Info,
} from 'lucide-react';

interface ModelMarketplaceProps {
  currentModelId: string;
  onSelectModel: (id: string) => void;
  onOpenAccountKeys?: () => void;
}

export function ModelMarketplace({
  currentModelId,
  onSelectModel,
  onOpenAccountKeys,
}: ModelMarketplaceProps) {
  const { session } = useAuth();
  const user = session.user;

  const [activeCategory, setActiveCategory] = useState<'ALL' | ModelCategory>('ALL');
  const [activeTab, setActiveTab] = useState<'catalog' | 'router' | 'compare'>('catalog');
  const [taskQuery, setTaskQuery] = useState(
    'Fix failing authentication integration test with session token forwarding'
  );
  const [simulatedRouting, setSimulatedRouting] = useState(() =>
    ModelRouter.routeTask(taskQuery, 3, user)
  );

  const handleTestRoute = () => {
    const res = ModelRouter.routeTask(taskQuery, 3, user);
    setSimulatedRouting(res);
  };

  const filteredModels = CURRENT_2026_MODELS.filter((m) => {
    if (activeCategory === 'ALL') return true;
    return m.category === activeCategory;
  });

  return (
    <div className="flex-1 flex flex-col bg-[#0e1115] border border-[#202731] rounded-lg overflow-hidden font-sans">
      {/* Header bar */}
      <div className="p-3 bg-[#111419] border-b border-[#202731] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-[#ea580c]" />
          <span className="font-semibold text-white uppercase tracking-wider">
            Model Registry & Intelligence Router
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#10b981]/15 text-[#10b981] font-bold">
            Current 2026 Ecosystem
          </span>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
              activeTab === 'catalog'
                ? 'bg-[#ea580c] text-white font-semibold'
                : 'bg-[#151920] text-[var(--text-secondary)] hover:bg-[#1d232c]'
            }`}
          >
            Catalog ({CURRENT_2026_MODELS.length})
          </button>

          <button
            onClick={() => setActiveTab('router')}
            className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
              activeTab === 'router'
                ? 'bg-[#ea580c] text-white font-semibold'
                : 'bg-[#151920] text-[var(--text-secondary)] hover:bg-[#1d232c]'
            }`}
          >
            Router Simulator
          </button>

          <button
            onClick={() => setActiveTab('compare')}
            className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
              activeTab === 'compare'
                ? 'bg-[#ea580c] text-white font-semibold'
                : 'bg-[#151920] text-[var(--text-secondary)] hover:bg-[#1d232c]'
            }`}
          >
            Compare
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {activeTab === 'catalog' && (
          <div className="space-y-4">
            {/* Category filter pills */}
            <div className="flex items-center gap-1.5 font-mono text-xs overflow-x-auto pb-1">
              <span className="text-[var(--text-muted)] text-[11px]">Category:</span>
              {(['ALL', 'AGENTIC', 'CODING', 'REASONING', 'LOCAL'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat as any)}
                  className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                    activeCategory === cat
                      ? 'bg-[#222933] text-white font-semibold border border-[#333e4d]'
                      : 'text-[var(--text-secondary)] hover:bg-[#151920]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Models grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-mono text-xs">
              {filteredModels.map((model) => {
                const isSelected = model.id === currentModelId;
                const entitlement = EntitlementService.canUseModel(user, model);

                return (
                  <div
                    key={model.id}
                    className={`p-4 rounded-lg border transition-all flex flex-col justify-between space-y-3 ${
                      isSelected
                        ? 'bg-[#14181f] border-[#ea580c] ring-1 ring-[#ea580c]/30'
                        : 'bg-[#101318] border-[#1f262f] hover:border-[#2d3744]'
                    }`}
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-white text-sm">{model.displayName}</div>
                          <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                            {model.provider} · {model.license}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                              model.accessType === 'FREE_HOSTED' || model.accessType === 'LOCAL'
                                ? 'bg-[#10b981]/20 text-[#10b981]'
                                : 'bg-[#ea580c]/20 text-[#f97316]'
                            }`}
                          >
                            {model.accessType.replace('_', ' ')}
                          </span>

                          <span className="text-[9px] text-[var(--text-muted)]">
                            Req: {model.minimumPlanRequired}
                          </span>
                        </div>
                      </div>

                      {/* Capabilities pill row */}
                      <div className="grid grid-cols-3 gap-1.5 p-2 rounded bg-[#0a0d10] border border-[#1b222a] text-[11px]">
                        <div>
                          <span className="text-[var(--text-muted)]">Coding: </span>
                          <span className="text-[#38bdf8] font-bold">{model.codingScore}</span>
                        </div>
                        <div>
                          <span className="text-[var(--text-muted)]">Agentic: </span>
                          <span className="text-[#a78bfa] font-bold">{model.agentScore}</span>
                        </div>
                        <div>
                          <span className="text-[var(--text-muted)]">Context: </span>
                          <span className="text-white">
                            {(model.contextLength / 1000).toFixed(0)}k
                          </span>
                        </div>
                      </div>

                      {/* Why this model rationale */}
                      <div className="p-2 rounded bg-[#0d1014] border border-[#1a2027] text-[11px] text-[var(--text-secondary)] font-sans leading-relaxed">
                        <strong className="text-[var(--text-muted)] font-mono text-[10px] uppercase block mb-0.5">
                          Why This Model:
                        </strong>
                        {model.whyThisModelRationale}
                      </div>

                      {/* Benchmark record */}
                      {model.benchmarks[0] && (
                        <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)]">
                          <span>{model.benchmarks[0].name}:</span>
                          <span className="text-[#10b981] font-bold">
                            {model.benchmarks[0].score}% ({model.benchmarks[0].date})
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-[#1a2027]">
                      {entitlement.allowed ? (
                        <button
                          onClick={() => onSelectModel(model.id)}
                          className={`w-full py-1.5 rounded font-semibold text-xs transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-[#ea580c] text-white'
                              : 'bg-[#151920] hover:bg-[#1d232c] text-[var(--text-secondary)] hover:text-white border border-[#232b35]'
                          }`}
                        >
                          {isSelected ? 'ACTIVE IN HARNESS' : 'SELECT MODEL'}
                        </button>
                      ) : (
                        <div className="space-y-1.5">
                          <button
                            disabled
                            className="w-full py-1.5 rounded bg-[#161a20] text-[var(--text-muted)] font-semibold text-xs border border-[#222933] cursor-not-allowed"
                          >
                            🔒 {model.minimumPlanRequired} TIER REQUIRED
                          </button>
                          <div className="text-[10px] text-center text-[var(--text-muted)]">
                            Or configure your own API key in Account settings.
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'router' && (
          <div className="max-w-2xl mx-auto space-y-4 font-mono text-xs">
            <div className="p-4 rounded-lg bg-[#111419] border border-[#202731] space-y-3">
              <span className="font-bold text-white text-sm">
                Evidence-Based Model Router
              </span>
              <p className="text-[var(--text-secondary)] font-sans text-xs leading-relaxed">
                FORGE evaluates task complexity, expected AST file modifications, and context window requirements before dispatching to an agent model.
              </p>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={taskQuery}
                  onChange={(e) => setTaskQuery(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded bg-[#0a0d10] border border-[#222933] text-white outline-none focus:border-[#ea580c]"
                  placeholder="Task query to classify..."
                />
                <button
                  onClick={handleTestRoute}
                  className="px-4 py-1.5 rounded bg-[#ea580c] hover:bg-[#f97316] text-white font-semibold cursor-pointer"
                >
                  ROUTE
                </button>
              </div>
            </div>

            {/* Decision report */}
            <div className="p-4 rounded-lg bg-[#101318] border border-[#202731] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-[#ea580c]/20 text-[#f97316] font-bold">
                    SELECTED MODEL
                  </span>
                  <span className="text-white font-bold text-sm">
                    {simulatedRouting.selectedModel.displayName}
                  </span>
                </div>

                <span className="text-[#10b981] font-semibold">
                  Cost: ${simulatedRouting.estimatedCostUsd.toFixed(3)}
                </span>
              </div>

              <div className="p-3 rounded bg-[#0a0d10] border border-[#1a2027] text-[var(--text-secondary)] font-sans text-xs leading-relaxed">
                <strong className="text-white font-mono">Why this model? </strong>
                {simulatedRouting.reasoning}
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="p-2.5 rounded bg-[#13171d] border border-[#1e252e]">
                  <span className="text-[var(--text-muted)] text-[10px]">COMPLEXITY:</span>
                  <div className="text-white font-bold">{simulatedRouting.taskComplexity}</div>
                </div>
                <div className="p-2.5 rounded bg-[#13171d] border border-[#1e252e]">
                  <span className="text-[var(--text-muted)] text-[10px]">CONTEXT REQ:</span>
                  <div className="text-white font-bold">
                    {simulatedRouting.contextRequiredTokens.toLocaleString()} tokens
                  </div>
                </div>
                <div className="p-2.5 rounded bg-[#13171d] border border-[#1e252e]">
                  <span className="text-[var(--text-muted)] text-[10px]">TOOL INTENSITY:</span>
                  <div className="text-white font-bold">{simulatedRouting.toolUsageIntensity}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'compare' && (
          <div className="space-y-4 font-mono text-xs overflow-x-auto">
            <table className="w-full border-collapse border border-[#1f262f] text-left">
              <thead>
                <tr className="bg-[#111419] text-[var(--text-muted)] border-b border-[#1f262f]">
                  <th className="p-2.5">Model</th>
                  <th className="p-2.5">Provider</th>
                  <th className="p-2.5">Coding</th>
                  <th className="p-2.5">Reasoning</th>
                  <th className="p-2.5">Agentic</th>
                  <th className="p-2.5">Context</th>
                  <th className="p-2.5">License</th>
                  <th className="p-2.5">Access</th>
                </tr>
              </thead>
              <tbody>
                {CURRENT_2026_MODELS.map((m) => (
                  <tr
                    key={m.id}
                    className="border-b border-[#1a2027] hover:bg-[#12161c] text-[var(--text-secondary)]"
                  >
                    <td className="p-2.5 font-bold text-white">{m.displayName}</td>
                    <td className="p-2.5">{m.provider}</td>
                    <td className="p-2.5 text-[#38bdf8] font-bold">{m.codingScore}</td>
                    <td className="p-2.5 text-[#a78bfa] font-bold">{m.reasoningScore}</td>
                    <td className="p-2.5 text-[#10b981] font-bold">{m.agentScore}</td>
                    <td className="p-2.5 text-white">{(m.contextLength / 1000).toFixed(0)}k</td>
                    <td className="p-2.5 text-[var(--text-muted)]">{m.license}</td>
                    <td className="p-2.5">
                      <span className="px-1.5 py-0.5 rounded bg-[#1b222b] text-white text-[10px]">
                        {m.accessType}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
