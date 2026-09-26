'use client';

import React from 'react';
import { RecoveryAttempt } from '@/types/agent';
import {
  AlertTriangle,
  Flame,
  CheckCircle2,
  ArrowDown,
  Wrench,
  FileCode,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';

interface RecoveryTraceProps {
  attempts: RecoveryAttempt[];
  onOpenDiff?: () => void;
}

export function RecoveryTrace({ attempts, onOpenDiff }: RecoveryTraceProps) {
  return (
    <div className="flex-1 flex flex-col bg-[#0e1115] border border-[#232a32] rounded overflow-hidden">
      {/* Header */}
      <div className="p-3 bg-[#13171d] border-b border-[#232a32] flex items-center justify-between">
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
            <div className="p-4 rounded bg-[#161215] border border-[#3b1d22] space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-[#ef4444]/20 text-[#ef4444] font-bold">
                    ATTEMPT #{attempt.attemptNumber} FAILED
                  </span>
                  <span className="text-[var(--text-muted)]">Classification:</span>
                  <span className="text-white font-semibold">{attempt.failureCategory}</span>
                </div>
                <span className="text-[var(--text-muted)] text-[11px]">{attempt.timestamp}</span>
              </div>

              <div className="p-2.5 rounded bg-[#0e0c0e] border border-[#2b181c] text-[#fca5a5]">
                <code>{attempt.failureMessage}</code>
              </div>
            </div>

            {/* Connecting Arrow */}
            <div className="flex justify-center text-[var(--text-muted)]">
              <ArrowDown className="w-4 h-4 text-[#ea580c]" />
            </div>

            {/* Stage 2: Diagnosis */}
            <div className="p-4 rounded bg-[#171913] border border-[#3a3518] space-y-2 font-mono text-xs">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-[#fbbf24]/20 text-[#fbbf24] font-bold">
                  DIAGNOSIS & ROOT CAUSE
                </span>
                <span className="text-[var(--text-muted)]">Failing Component:</span>
                <code className="text-[#38bdf8]">{attempt.failingComponent}</code>
              </div>

              <p className="text-[var(--text-secondary)] font-sans text-xs leading-relaxed">
                {attempt.likelyCause}
              </p>

              <div className="p-2.5 rounded bg-[#0f110c] border border-[#2a2612] text-[#fde68a]">
                <span className="font-bold text-[#fbbf24]">Correction Strategy: </span>
                <span>{attempt.correctionStrategy}</span>
              </div>
            </div>

            {/* Connecting Arrow */}
            <div className="flex justify-center text-[var(--text-muted)]">
              <ArrowDown className="w-4 h-4 text-[#ea580c]" />
            </div>

            {/* Stage 3: Applied Patch */}
            <div className="p-4 rounded bg-[#10171e] border border-[#1b3447] space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-[#38bdf8]/20 text-[#38bdf8] font-bold">
                    PATCH APPLIED
                  </span>
                  <span className="text-white">{attempt.patchApplied.filePath}</span>
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

              <div className="p-2.5 rounded bg-[#0b1016] border border-[#172938] text-[#7dd3fc]">
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
            <div className="p-4 rounded bg-[#0f1914] border border-[#193d2b] space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-[#10b981]/20 text-[#10b981] font-bold">
                    RE-TEST TARGET: {attempt.retestTarget}
                  </span>
                  <span className="text-white font-semibold">100% SUCCEEDED</span>
                </div>
                <div className="flex items-center gap-1 text-[#10b981] font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>VERIFIED</span>
                </div>
              </div>

              <div className="p-2.5 rounded bg-[#0a120e] border border-[#152e20] text-[#6ee7b7]">
                <code>PASS tests/integration/auth.test.ts (1 passed, 42ms) — Zero regressions detected.</code>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
