'use client';

import React from 'react';
import { RecoveryAttempt } from '@/types/agent';
import {
  Flame,
  ArrowDown,
  FileCode,
  ShieldCheck,
} from 'lucide-react';

interface RecoveryTraceProps {
  attempts: RecoveryAttempt[];
  onOpenDiff?: () => void;
}

export function RecoveryTrace({ attempts, onOpenDiff }: RecoveryTraceProps) {
  return (
    <div className="flex-1 flex flex-col bg-[var(--bg-panel)] overflow-hidden transition-colors">
      {/* Header */}
      <div className="p-3 bg-[var(--bg-elevated)] border-b border-[var(--border-subtle)] flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-[#ea580c]" />
            <span className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider font-mono">
              Autonomous Failure Recovery Trace
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#10b981]/20 text-[#10b981] font-bold">
              RESOLVED (1 RETRY)
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            Closed-loop self-healing: Capture failure → Classify cause → Synthesize patch → Re-run targeted test.
          </p>
        </div>
      </div>

      <div className="p-5 overflow-y-auto space-y-6">
        {attempts.map((attempt) => (
          <div key={attempt.attemptNumber} className="space-y-4">
            {/* Stage 1: Captured Failure */}
            <div className="p-4 rounded-lg bg-[#ef4444]/8 border border-[#ef4444]/25 space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-[#ef4444]/20 text-[#ef4444] font-bold">
                    ATTEMPT #{attempt.attemptNumber} FAILED
                  </span>
                  <span className="text-[var(--text-muted)]">Classification:</span>
                  <span className="text-[var(--text-primary)] font-semibold">{attempt.failureCategory}</span>
                </div>
                <span className="text-[var(--text-muted)] text-[11px]">{attempt.timestamp}</span>
              </div>

              <div className="p-2.5 rounded bg-[var(--code-bg)] border border-[var(--border-subtle)] text-[#ef4444]">
                <code>{attempt.failureMessage}</code>
              </div>
            </div>

            {/* Connecting Arrow */}
            <div className="flex justify-center text-[var(--text-muted)]">
              <ArrowDown className="w-4 h-4 text-[#ea580c]" />
            </div>

            {/* Stage 2: Diagnosis */}
            <div className="p-4 rounded-lg bg-[#f59e0b]/8 border border-[#f59e0b]/25 space-y-2 font-mono text-xs">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-[#f59e0b]/20 text-[#f59e0b] font-bold">
                  DIAGNOSIS & ROOT CAUSE
                </span>
                <span className="text-[var(--text-muted)]">Failing Component:</span>
                <code className="text-[#38bdf8] font-bold">{attempt.failingComponent}</code>
              </div>

              <p className="text-[var(--text-secondary)] font-sans text-xs leading-relaxed">
                {attempt.likelyCause}
              </p>

              <div className="p-2.5 rounded bg-[var(--code-bg)] border border-[var(--border-subtle)] text-[var(--text-primary)]">
                <span className="font-bold text-[#f59e0b]">Correction Strategy: </span>
                <span>{attempt.correctionStrategy}</span>
              </div>
            </div>

            {/* Connecting Arrow */}
            <div className="flex justify-center text-[var(--text-muted)]">
              <ArrowDown className="w-4 h-4 text-[#ea580c]" />
            </div>

            {/* Stage 3: Applied Patch */}
            <div className="p-4 rounded-lg bg-[#38bdf8]/8 border border-[#38bdf8]/25 space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-[#38bdf8]/20 text-[#38bdf8] font-bold">
                    PATCH APPLIED
                  </span>
                  <span className="text-[var(--text-primary)] font-bold">{attempt.patchApplied.filePath}</span>
                </div>

                {onOpenDiff && (
                  <button
                    onClick={onOpenDiff}
                    className="flex items-center gap-1 text-[11px] text-[#38bdf8] hover:underline cursor-pointer"
                  >
                    <FileCode className="w-3.5 h-3.5" />
                    <span>View Diff</span>
                  </button>
                )}
              </div>

              <div className="p-2.5 rounded bg-[var(--code-bg)] border border-[var(--border-subtle)] text-[#38bdf8]">
                <pre className="whitespace-pre overflow-x-auto text-[11px]">
                  {attempt.patchApplied.diffSnippet}
                </pre>
              </div>
            </div>

            {/* Connecting Arrow */}
            <div className="flex justify-center text-[var(--text-muted)]">
              <ArrowDown className="w-4 h-4 text-[#10b981]" />
            </div>

            {/* Stage 4: Re-Test & Verification */}
            <div className="p-4 rounded-lg bg-[#10b981]/8 border border-[#10b981]/25 space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-[#10b981]/20 text-[#10b981] font-bold">
                    RE-TEST TARGET: {attempt.retestTarget}
                  </span>
                  <span className="text-[var(--text-primary)] font-semibold">100% SUCCEEDED</span>
                </div>
                <div className="flex items-center gap-1 text-[#10b981] font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>VERIFIED</span>
                </div>
              </div>

              <div className="p-2.5 rounded bg-[var(--code-bg)] border border-[var(--border-subtle)] text-[#10b981]">
                <code>PASS tests/integration/auth.test.ts (1 passed, 42ms) — Zero regressions detected.</code>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
