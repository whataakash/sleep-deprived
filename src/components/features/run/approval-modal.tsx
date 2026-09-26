'use client';

import React, { useState } from 'react';
import { ApprovalGateEngine, INITIAL_APPROVAL_REQUESTS } from '@/lib/safety/approval-gate';
import { HumanApprovalGate } from '@/types/harness';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileCode,
  X,
} from 'lucide-react';

interface ApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDecide?: (id: string, decision: 'APPROVED' | 'REJECTED') => void;
}

export function ApprovalModal({ isOpen, onClose, onDecide }: ApprovalModalProps) {
  const [requests, setRequests] = useState<HumanApprovalGate[]>(ApprovalGateEngine.getRequests());

  if (!isOpen) return null;

  const handleDecision = (id: string, decision: 'APPROVED' | 'REJECTED') => {
    ApprovalGateEngine.decideRequest(id, decision);
    setRequests([...ApprovalGateEngine.getRequests()]);
    if (onDecide) onDecide(id, decision);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 select-none font-mono text-xs">
      <div className="w-full max-w-2xl bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-3.5 bg-[var(--bg-elevated)] border-b border-[var(--border-subtle)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#ea580c]" />
            <span className="font-bold text-[var(--text-primary)] uppercase tracking-wider">
              17. Human Approval Gate
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#ea580c]/15 text-[#ea580c] font-bold">
              SUPERVISOR AUDIT
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[var(--bg-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 space-y-4 overflow-y-auto">
          <p className="text-xs text-[var(--text-secondary)] font-sans leading-relaxed">
            The harness pauses and requests explicit human authorization whenever an action touches core security paths, schema definitions, or destructive commands.
          </p>

          <div className="space-y-3">
            {requests.map((req) => {
              const isPending = req.status === 'PENDING';
              const isApproved = req.status === 'APPROVED';

              return (
                <div
                  key={req.id}
                  className="p-3.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[var(--text-primary)] text-sm">{req.title}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-extrabold uppercase ${
                          req.riskLevel === 'HIGH'
                            ? 'bg-[#ef4444]/15 text-[#ef4444]'
                            : 'bg-[#fbbf24]/15 text-[#fbbf24]'
                        }`}
                      >
                        {req.riskLevel} RISK
                      </span>
                    </div>

                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        isApproved
                          ? 'bg-[#10b981]/15 text-[#10b981]'
                          : isPending
                          ? 'bg-[#fbbf24]/15 text-[#fbbf24]'
                          : 'bg-[#ef4444]/15 text-[#ef4444]'
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>

                  <p className="text-[11px] text-[var(--text-secondary)] font-sans">
                    {req.description}
                  </p>

                  {/* Diff Snippet */}
                  <pre className="p-2.5 rounded bg-[var(--code-bg)] border border-[var(--border-subtle)] text-[11px] font-mono text-[#38bdf8] overflow-x-auto">
                    <code>{req.diffPreview}</code>
                  </pre>

                  {req.reviewerNotes && (
                    <div className="text-[11px] text-[var(--text-muted)] font-sans pt-1 border-t border-[var(--border-subtle)]">
                      Audit Note: {req.reviewerNotes}
                    </div>
                  )}

                  {isPending && (
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
                      <button
                        onClick={() => handleDecision(req.id, 'REJECTED')}
                        className="px-3 py-1 rounded bg-[var(--bg-panel)] hover:bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/40 font-semibold cursor-pointer text-xs"
                      >
                        Reject Mutation
                      </button>
                      <button
                        onClick={() => handleDecision(req.id, 'APPROVED')}
                        className="px-3 py-1 rounded bg-[#10b981] hover:bg-[#059669] text-white font-semibold cursor-pointer text-xs"
                      >
                        Authorize & Apply
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
