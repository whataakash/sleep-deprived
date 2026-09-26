'use client';

import React, { useState } from 'react';
import { ModelArenaEngine, BENCHMARK_ARENA_CANDIDATES } from '@/lib/models/arena';
import { ArenaCandidate } from '@/types/harness';
import {
  Trophy,
  Cpu,
  Clock,
  Coins,
  CheckCircle2,
  XCircle,
  Play,
  ArrowRight,
  Code2,
  Sparkles,
} from 'lucide-react';

interface ModelArenaProps {
  onApplyWinner?: (candidate: ArenaCandidate) => void;
}

export function ModelArena({ onApplyWinner }: ModelArenaProps) {
  const [candidates, setCandidates] = useState<ArenaCandidate[]>(BENCHMARK_ARENA_CANDIDATES);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('qwen3-coder-next');
  const [isRunningComparison, setIsRunningComparison] = useState(false);

  const selectedCandidate =
    candidates.find((c) => c.modelId === selectedCandidateId) || candidates[0];

  const handleRunComparison = () => {
    setIsRunningComparison(true);
    setTimeout(() => {
      setIsRunningComparison(false);
    }, 1200);
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto space-y-4 font-mono text-xs select-none">
      {/* Arena Header */}
      <div className="p-4 rounded-xl bg-[var(--bg-panel)] border border-[var(--border-subtle)] flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[#fbbf24]" />
            <span className="font-bold text-sm text-[var(--text-primary)] uppercase tracking-wider">
              Model Arena: Multi-Model Evaluation & Synthesis Comparison
            </span>
          </div>
          <p className="text-[11px] text-[var(--text-secondary)] font-sans mt-0.5">
            Evaluate the same engineering task across candidate models. Benchmark tokens, latency, cost, and test pass invariants.
          </p>
        </div>

        <button
          onClick={handleRunComparison}
          disabled={isRunningComparison}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#ea580c] hover:bg-[#f97316] text-white font-semibold transition-all cursor-pointer shadow-xs disabled:opacity-50"
        >
          <Play className={`w-3.5 h-3.5 fill-current ${isRunningComparison ? 'animate-spin' : ''}`} />
          <span>{isRunningComparison ? 'EVALUATING...' : 'RUN BENCHMARK ARENA'}</span>
        </button>
      </div>

      {/* Grid of Contenders */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {candidates.map((cand) => {
          const isSelected = cand.modelId === selectedCandidateId;

          return (
            <div
              key={cand.modelId}
              onClick={() => setSelectedCandidateId(cand.modelId)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2.5 relative ${
                cand.isWinner
                  ? 'border-[#fbbf24]/50 bg-[var(--bg-panel)] shadow-xs'
                  : isSelected
                  ? 'border-[#38bdf8] bg-[var(--bg-panel)]'
                  : 'border-[var(--border-subtle)] bg-[var(--bg-panel)] hover:border-[var(--border-medium)]'
              }`}
            >
              {cand.isWinner && (
                <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded bg-[#fbbf24]/15 border border-[#fbbf24]/40 text-[#fbbf24] text-[9px] font-extrabold uppercase">
                  <Trophy className="w-2.5 h-2.5" />
                  <span>WINNER</span>
                </div>
              )}

              <div>
                <div className="font-bold text-[var(--text-primary)] text-sm truncate pr-16">
                  {cand.modelName}
                </div>
                <div className="text-[10px] text-[var(--text-muted)] truncate">{cand.provider}</div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-1.5 text-[11px] pt-1 border-t border-[var(--border-subtle)]">
                <div className="p-1.5 rounded bg-[var(--bg-canvas)] border border-[var(--border-subtle)]">
                  <span className="text-[10px] text-[var(--text-muted)] block">Latency</span>
                  <span className="font-bold text-[var(--text-primary)]">{cand.durationMs}ms</span>
                </div>
                <div className="p-1.5 rounded bg-[var(--bg-canvas)] border border-[var(--border-subtle)]">
                  <span className="text-[10px] text-[var(--text-muted)] block">Cost</span>
                  <span className="font-bold text-[var(--text-primary)]">${cand.costUsd}</span>
                </div>
                <div className="p-1.5 rounded bg-[var(--bg-canvas)] border border-[var(--border-subtle)]">
                  <span className="text-[10px] text-[var(--text-muted)] block">Tests</span>
                  <span
                    className={`font-bold ${
                      cand.testsPassed === cand.testsTotal ? 'text-[#10b981]' : 'text-[#f59e0b]'
                    }`}
                  >
                    {cand.testsPassed}/{cand.testsTotal}
                  </span>
                </div>
                <div className="p-1.5 rounded bg-[var(--bg-canvas)] border border-[var(--border-subtle)]">
                  <span className="text-[10px] text-[var(--text-muted)] block">Score</span>
                  <span className="font-bold text-[#38bdf8]">{cand.invariantScore}/100</span>
                </div>
              </div>

              <p className="text-[11px] text-[var(--text-secondary)] font-sans line-clamp-2 leading-tight">
                {cand.summaryRationale}
              </p>
            </div>
          );
        })}
      </div>

      {/* Selected Candidate Deep-Dive & Code Diff */}
      <div className="p-4 rounded-xl bg-[var(--bg-panel)] border border-[var(--border-subtle)] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-[#38bdf8]" />
            <span className="font-bold text-[var(--text-primary)]">
              Synthesized Code Output: {selectedCandidate.modelName}
            </span>
            {selectedCandidate.isWinner && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#fbbf24]/15 text-[#fbbf24] font-bold">
                RECOMMENDED BY HARNESS
              </span>
            )}
          </div>

          {onApplyWinner && (
            <button
              onClick={() => onApplyWinner(selectedCandidate)}
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#10b981] hover:bg-[#059669] text-white font-semibold transition-colors cursor-pointer text-xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Apply {selectedCandidate.modelName} Patch</span>
            </button>
          )}
        </div>

        <pre className="p-3 rounded-lg bg-[var(--code-bg)] border border-[var(--border-subtle)] text-[#10b981] overflow-x-auto text-[11px] leading-relaxed">
          <code>{selectedCandidate.responseSnippet}</code>
        </pre>

        <div className="p-2.5 rounded bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] font-sans leading-relaxed">
          <strong className="text-[var(--text-primary)]">Synthesis Assessment:</strong>{' '}
          {selectedCandidate.summaryRationale}
        </div>
      </div>
    </div>
  );
}
