'use client';

import React, { useState } from 'react';
import { BranchingExperimentsEngine, INITIAL_BRANCHING_TRIALS } from '@/lib/agent/branching-experiments';
import { BranchingTrial } from '@/types/harness';
import {
  GitFork,
  GitBranch,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export function BranchingPanel() {
  const [trials, setTrials] = useState<BranchingTrial[]>(BranchingExperimentsEngine.getTrials());
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSelectWinner = (trialId: string) => {
    const res = BranchingExperimentsEngine.selectWinner(trialId);
    if (res.success) {
      setTrials([...BranchingExperimentsEngine.getTrials()]);
      setSuccessMsg(res.message);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-4 space-y-4 font-mono text-xs select-none">
      {/* Header */}
      <div className="p-3.5 rounded-xl bg-[var(--bg-panel)] border border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#a78bfa]/15 border border-[#a78bfa]/30 flex items-center justify-center text-[#a78bfa]">
            <GitFork className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-[var(--text-primary)]">16. Branching Experiments (Parallel Trials)</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#a78bfa]/15 text-[#a78bfa] font-bold">
                3 PARALLEL TRIALS
              </span>
            </div>
            <div className="text-[11px] text-[var(--text-muted)] font-sans mt-0.5">
              Explores multiple remediation strategies on isolated trial branches in parallel to pick the cleanest, lowest-risk solution.
            </div>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 rounded-lg bg-[#10b981]/15 border border-[#10b981]/30 text-[#10b981] flex items-center gap-2 text-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Trials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {trials.map((trial) => {
          const isPassed = trial.status === 'PASSED';
          const isRejected = trial.status === 'REJECTED';
          const isFailed = trial.status === 'FAILED';

          return (
            <div
              key={trial.id}
              className={`p-3.5 rounded-xl border flex flex-col justify-between space-y-3 transition-all ${
                trial.isWinningCandidate
                  ? 'border-[#10b981] bg-[var(--bg-panel)] shadow-xs'
                  : 'border-[var(--border-subtle)] bg-[var(--bg-panel)]'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[var(--text-muted)] font-mono text-[11px]">
                    <GitBranch className="w-3.5 h-3.5 text-[#38bdf8]" />
                    <span className="truncate max-w-[150px]">{trial.branchName}</span>
                  </div>

                  <span
                    className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                      isPassed
                        ? 'bg-[#10b981]/15 text-[#10b981]'
                        : isRejected
                        ? 'bg-[#fbbf24]/15 text-[#fbbf24]'
                        : 'bg-[#ef4444]/15 text-[#ef4444]'
                    }`}
                  >
                    {trial.status}
                  </span>
                </div>

                <div className="font-bold text-[var(--text-primary)] text-sm">
                  {trial.tacticName}
                </div>

                <p className="text-[11px] text-[var(--text-secondary)] font-sans leading-relaxed">
                  {trial.description}
                </p>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-1.5 text-[10px] pt-1 border-t border-[var(--border-subtle)]">
                  <div className="p-1 rounded bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-center">
                    <span className="text-[var(--text-muted)] block">Tests</span>
                    <span className="font-bold text-[var(--text-primary)]">
                      {trial.testsPassed}/{trial.testsTotal}
                    </span>
                  </div>
                  <div className="p-1 rounded bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-center">
                    <span className="text-[var(--text-muted)] block">Diff</span>
                    <span className="font-bold text-[#10b981]">+{trial.linesAdded}</span>
                  </div>
                  <div className="p-1 rounded bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-center">
                    <span className="text-[var(--text-muted)] block">Time</span>
                    <span className="font-bold text-[var(--text-primary)]">{trial.executionMs}ms</span>
                  </div>
                </div>

                {/* Tradeoffs */}
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block font-bold">
                    Trade-offs:
                  </span>
                  <ul className="text-[11px] text-[var(--text-secondary)] font-sans space-y-1 list-disc list-inside">
                    {trial.tradeoffs.map((t, idx) => (
                      <li key={idx} className="leading-tight">{t}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2 border-t border-[var(--border-subtle)]">
                {trial.isWinningCandidate ? (
                  <div className="w-full py-1.5 rounded bg-[#10b981]/15 text-[#10b981] font-bold text-center text-xs flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Selected Resolution Branch</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleSelectWinner(trial.id)}
                    className="w-full py-1.5 rounded bg-[var(--bg-canvas)] hover:bg-[#ea580c] hover:text-white border border-[var(--border-subtle)] text-[var(--text-secondary)] font-semibold transition-colors cursor-pointer text-xs"
                  >
                    Select This Branch
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
