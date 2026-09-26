'use client';

import React, { useState } from 'react';
import { ApprovalGateEngine } from '@/lib/safety/approval-gate';
import { HumanApprovalGate } from '@/types/harness';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileCode,
  Lock,
  Check,
  X,
} from 'lucide-react';

interface ApprovalGatePanelProps {
  onDecide?: (id: string, decision: 'APPROVED' | 'REJECTED') => void;
}

export function ApprovalGatePanel({ onDecide }: ApprovalGatePanelProps) {
  const [requests, setRequests] = useState<HumanApprovalGate[]>(ApprovalGateEngine.getRequests());

  const handleDecision = (id: string, decision: 'APPROVED' | 'REJECTED') => {
    ApprovalGateEngine.decideRequest(id, decision);
    setRequests([...ApprovalGateEngine.getRequests()]);
    if (onDecide) onDecide(id, decision);
  };

  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;

  return (
    <div className="flex-1 flex flex-col bg-[var(--bg-panel)] overflow-hidden font-mono text-xs select-none transition-colors">
      {/* Header */}
      <div className="p-3.5 bg-[var(--bg-elevated)] border-b border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#ea580c]/15 border border-[#ea580c]/30 flex items-center justify-center text-[#ea580c]">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-[var(--text-primary)]">
                Human Approval Gate (Safety Checkpoint)
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                  pendingCount > 0
                    ? 'bg-[#ea580c]/20 text-[#ea580c] border border-[#ea580c]/30 animate-pulse'
                    : 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30'
                }`}
              >
                {pendingCount > 0 ? `${pendingCount} PENDING ACTION` : 'ALL ACTIONS RESOLVED'}
              </span>
            </div>
            <div className="text-[11px] text-[var(--text-muted)] font-sans mt-0.5">
              Deterministic supervisor gate: pauses autonomous execution before sensitive file mutations, migrations, or secret commits.
            </div>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-[var(--text-muted)] block">Safety Invariant</span>
          <span className="font-bold text-[#10b981] text-xs">HUMAN_PERMISSION_GATE_VERIFIED</span>
        </div>
      </div>

      {/* Requests List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {requests.map((req) => {
          const isPending = req.status === 'PENDING';
          const isApproved = req.status === 'APPROVED';

          return (
            <div
              key={req.id}
              className={`p-4 rounded-xl border transition-all ${
                isPending
                  ? 'bg-[var(--bg-canvas)] border-[#ea580c]/40 shadow-xs'
                  : isApproved
                  ? 'bg-[var(--bg-canvas)] border-[#10b981]/30'
                  : 'bg-[var(--bg-canvas)] border-[#ef4444]/30'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-[var(--text-primary)] font-sans">{req.title}</span>
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded font-extrabold uppercase ${
                      req.riskLevel === 'HIGH'
                        ? 'bg-[#ef4444]/15 text-[#ef4444] border border-[#ef4444]/30'
                        : 'bg-[#fbbf24]/15 text-[#fbbf24] border border-[#fbbf24]/30'
                    }`}
                  >
                    {req.riskLevel} RISK
                  </span>
                </div>

                <span
                  className={`text-[10px] px-2.5 py-0.5 rounded font-bold ${
                    isApproved
                      ? 'bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30'
                      : isPending
                      ? 'bg-[#fbbf24]/15 text-[#fbbf24] border border-[#fbbf24]/30'
                      : 'bg-[#ef4444]/15 text-[#ef4444] border border-[#ef4444]/30'
                  }`}
                >
                  {req.status}
                </span>
              </div>

              <p className="text-xs text-[var(--text-secondary)] font-sans mt-1.5 leading-relaxed">
                {req.description}
              </p>

              {/* Diff Snippet */}
              <div className="mt-3">
                <div className="text-[10px] text-[var(--text-muted)] font-mono mb-1">PROPOSED MUTATION:</div>
                <pre className="p-3 rounded-lg bg-[var(--code-bg)] border border-[var(--border-subtle)] text-xs font-mono text-[#38bdf8] overflow-x-auto leading-relaxed">
                  <code>{req.diffPreview}</code>
                </pre>
              </div>

              {req.reviewerNotes && (
                <div className="mt-2.5 pt-2 text-[11px] text-[var(--text-muted)] font-sans border-t border-[var(--border-subtle)]">
                  <span className="font-semibold text-[var(--text-secondary)]">Supervisor Audit Note:</span>{' '}
                  {req.reviewerNotes}
                </div>
              )}

              {isPending && (
                <div className="flex items-center justify-end gap-2.5 pt-3 mt-3 border-t border-[var(--border-subtle)]">
                  <button
                    onClick={() => handleDecision(req.id, 'REJECTED')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-panel)] hover:bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/40 font-semibold cursor-pointer text-xs transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reject Mutation</span>
                  </button>
                  <button
                    onClick={() => handleDecision(req.id, 'APPROVED')}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#10b981] hover:bg-[#059669] text-white font-semibold cursor-pointer text-xs transition-colors shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Authorize & Apply</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
