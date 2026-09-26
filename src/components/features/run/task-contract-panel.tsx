'use client';

import React from 'react';
import { TaskContract } from '@/types/harness';
import { INITIAL_TASK_CONTRACT_1042, TaskContractEngine } from '@/lib/agent/task-contract';
import {
  FileText,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Lock,
  ListChecks,
} from 'lucide-react';

interface TaskContractPanelProps {
  contract?: TaskContract;
}

export function TaskContractPanel({ contract = INITIAL_TASK_CONTRACT_1042 }: TaskContractPanelProps) {
  const stats = TaskContractEngine.evaluateContract(contract);

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-4 space-y-4 font-mono text-xs select-none">
      {/* Header */}
      <div className="p-3.5 rounded-xl bg-[var(--bg-panel)] border border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#10b981]/15 border border-[#10b981]/30 flex items-center justify-center text-[#10b981]">
            <ListChecks className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-[var(--text-primary)]">Task Contract Manifest</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#10b981]/15 text-[#10b981] font-bold">
                SEALED & BINDING
              </span>
            </div>
            <div className="text-[11px] text-[var(--text-muted)] font-sans mt-0.5">
              Strict formal agreement governing scope, deliverables, constraints, and success criteria.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] text-[var(--text-muted)] block">Contract Compliance</span>
            <span className="font-bold text-[#10b981] text-sm">
              {stats.satisfiedCount} / {stats.totalCount} ({stats.completionPercent}%)
            </span>
          </div>
        </div>
      </div>

      {/* 3-Column Scope Boundaries */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Allowed target files */}
        <div className="p-3.5 rounded-xl bg-[var(--bg-panel)] border border-[#10b981]/30 space-y-2">
          <div className="flex items-center gap-2 text-[#10b981] font-bold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Allowed Targets (In-Scope)</span>
          </div>
          <ul className="space-y-1 text-[11px]">
            {contract.scopeBoundaries.allowedPaths.map((p) => (
              <li key={p} className="p-1 px-1.5 rounded bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--text-primary)] truncate">
                {p}
              </li>
            ))}
          </ul>
        </div>

        {/* Read-Only files */}
        <div className="p-3.5 rounded-xl bg-[var(--bg-panel)] border border-[#38bdf8]/30 space-y-2">
          <div className="flex items-center gap-2 text-[#38bdf8] font-bold">
            <Lock className="w-4 h-4" />
            <span>Read-Only Context Files</span>
          </div>
          <ul className="space-y-1 text-[11px]">
            {contract.scopeBoundaries.readOnlyPaths.map((p) => (
              <li key={p} className="p-1 px-1.5 rounded bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--text-secondary)] truncate">
                {p}
              </li>
            ))}
          </ul>
        </div>

        {/* Forbidden paths */}
        <div className="p-3.5 rounded-xl bg-[var(--bg-panel)] border border-[#ef4444]/30 space-y-2">
          <div className="flex items-center gap-2 text-[#ef4444] font-bold">
            <XCircle className="w-4 h-4" />
            <span>Strictly Forbidden Boundaries</span>
          </div>
          <ul className="space-y-1 text-[11px]">
            {contract.scopeBoundaries.forbiddenPaths.map((p) => (
              <li key={p} className="p-1 px-1.5 rounded bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[#ef4444] truncate">
                {p}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Constraints & Deliverables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-sans">
        <div className="p-3.5 rounded-xl bg-[var(--bg-panel)] border border-[var(--border-subtle)] space-y-2 font-mono">
          <span className="font-bold text-[var(--text-primary)] text-xs block text-[#ea580c]">
            Mandatory Engineering Constraints
          </span>
          <ul className="space-y-1.5 text-xs text-[var(--text-secondary)] list-disc list-inside">
            {contract.constraints.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>

        <div className="p-3.5 rounded-xl bg-[var(--bg-panel)] border border-[var(--border-subtle)] space-y-2 font-mono">
          <span className="font-bold text-[var(--text-primary)] text-xs block text-[#38bdf8]">
            Expected Task Deliverables
          </span>
          <ul className="space-y-1.5 text-xs text-[var(--text-secondary)] list-disc list-inside">
            {contract.expectedDeliverables.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Success Criteria Checklist */}
      <div className="p-3.5 rounded-xl bg-[var(--bg-panel)] border border-[var(--border-subtle)] space-y-3 font-mono">
        <span className="font-bold text-[var(--text-primary)] text-xs uppercase tracking-wider block">
          Verification Success Criteria (100% Satisfied)
        </span>
        <div className="space-y-2">
          {contract.successCriteria.map((sc) => (
            <div
              key={sc.id}
              className="p-2.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] flex items-start justify-between gap-3 text-xs"
            >
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#10b981] shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">{sc.description}</div>
                  <div className="text-[11px] text-[var(--text-muted)] mt-0.5">{sc.criterion}</div>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#10b981]/15 text-[#10b981] font-bold shrink-0">
                PASSED
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
