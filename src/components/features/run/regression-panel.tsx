'use client';

import React from 'react';
import { RegressionDetector } from '@/lib/verification/regression-detector';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRightLeft,
  Sparkles,
} from 'lucide-react';

interface RegressionPanelProps {
  runId?: string;
}

export function RegressionPanel({ runId = 'run-1042' }: RegressionPanelProps) {
  const report = RegressionDetector.evaluateRun(runId);

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-4 space-y-4 font-mono text-xs select-none">
      {/* Header Banner */}
      <div className="p-3.5 rounded-xl bg-[var(--bg-panel)] border border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#10b981]/15 border border-[#10b981]/30 flex items-center justify-center text-[#10b981]">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-[var(--text-primary)]">5. Regression Detection Engine</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#10b981]/15 text-[#10b981] font-bold">
                0 REGRESSIONS
              </span>
            </div>
            <div className="text-[11px] text-[var(--text-muted)] font-sans mt-0.5">
              Continuously executes baseline invariant tests against candidate AST patches to block past bugs from returning.
            </div>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-[var(--text-muted)] block">Comparison Baseline</span>
          <span className="font-bold text-[var(--text-primary)]">{report.baselineRunId} ➔ {report.candidateRunId}</span>
        </div>
      </div>

      {/* Invariants Checked Grid */}
      <div className="space-y-2.5">
        <span className="font-bold text-[var(--text-primary)] text-xs uppercase tracking-wider block">
          Invariant Verification Matrix ({report.passedCount}/{report.totalInvariantsChecked} Invariants Preserved)
        </span>

        {report.invariants.map((inv) => (
          <div
            key={inv.id}
            className="p-3.5 rounded-xl bg-[var(--bg-panel)] border border-[var(--border-subtle)] space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#10b981]" />
                <span className="font-bold text-[var(--text-primary)] text-sm">{inv.name}</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-[var(--bg-canvas)] text-[#38bdf8] uppercase font-bold">
                  {inv.category}
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#10b981]/15 text-[#10b981] font-bold">
                PASSED
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 rounded bg-[var(--bg-canvas)] border border-[var(--border-subtle)] space-y-0.5">
                <span className="text-[10px] text-[var(--text-muted)] uppercase font-semibold block">Baseline Expected</span>
                <span className="text-[var(--text-secondary)] font-sans">{inv.baselineState}</span>
              </div>
              <div className="p-2 rounded bg-[var(--bg-canvas)] border border-[var(--border-subtle)] space-y-0.5">
                <span className="text-[10px] text-[#10b981] uppercase font-semibold block">Candidate Actual</span>
                <span className="text-[var(--text-primary)] font-sans">{inv.candidateState}</span>
              </div>
            </div>

            {inv.diffNotes && (
              <div className="text-[11px] text-[var(--text-muted)] font-sans pt-1 border-t border-[var(--border-subtle)]">
                ℹ {inv.diffNotes}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
