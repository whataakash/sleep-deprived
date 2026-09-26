'use client';

import React from 'react';
import { ScopeGuard } from '@/lib/safety/scope-guard';
import { SecurityGuard } from '@/lib/safety/security-guard';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  KeyRound,
  Terminal,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react';

export function ScopeSecurityPanel() {
  const scopeRules = ScopeGuard.getRules();
  const decisions = ScopeGuard.getRecentDecisions();
  const securityAudit = SecurityGuard.getLiveAuditResult();

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-4 space-y-4 font-mono text-xs select-none">
      {/* Top Guards Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Scope Guard Card */}
        <div className="p-3.5 rounded-xl bg-[var(--bg-panel)] border border-[#10b981]/30 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#10b981]" />
              <span className="font-bold text-sm text-[var(--text-primary)]">1. Scope Guard</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-[#10b981]/15 text-[#10b981] font-bold">
              ENFORCING
            </span>
          </div>
          <p className="text-[11px] text-[var(--text-secondary)] font-sans">
            Controls agent task boundaries. Prevents edits to unrelated files, sensitive directories, or unauthorized schemas.
          </p>
          <div className="flex items-center gap-2 text-[10px] pt-1 border-t border-[var(--border-subtle)] text-[var(--text-muted)]">
            <span className="text-[#10b981] font-bold">{scopeRules.filter((r) => r.type === 'allow').length} Allowed</span>
            <span>·</span>
            <span className="text-[#ef4444] font-bold">{scopeRules.filter((r) => r.type === 'block').length} Blocked</span>
            <span>·</span>
            <span className="text-[#fbbf24] font-bold">{scopeRules.filter((r) => r.type === 'require_approval').length} Gate Required</span>
          </div>
        </div>

        {/* Security Guard Card */}
        <div className="p-3.5 rounded-xl bg-[var(--bg-panel)] border border-[#38bdf8]/30 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[#38bdf8]" />
              <span className="font-bold text-sm text-[var(--text-primary)]">10. Security Guard</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-[#10b981]/15 text-[#10b981] font-bold">
              ZERO THREATS
            </span>
          </div>
          <p className="text-[11px] text-[var(--text-secondary)] font-sans">
            Scans for exposed API keys, private tokens, malicious bash shell pipelines, and sandbox breakout attempts.
          </p>
          <div className="flex items-center gap-2 text-[10px] pt-1 border-t border-[var(--border-subtle)] text-[var(--text-muted)]">
            <span>0 Secret Leaks</span>
            <span>·</span>
            <span>0 Dangerous Commands</span>
            <span>·</span>
            <span className="text-[#10b981]">Sandbox: Active Chroot</span>
          </div>
        </div>
      </div>

      {/* Scope Decisions Audit Log */}
      <div className="p-3.5 rounded-xl bg-[var(--bg-panel)] border border-[var(--border-subtle)] space-y-3">
        <span className="font-bold text-[var(--text-primary)] text-xs uppercase tracking-wider block">
          Scope Guard Action Verification History
        </span>
        <div className="space-y-1.5">
          {decisions.map((dec, i) => {
            const isBlocked = dec.status === 'BLOCKED';
            const isApproval = dec.status === 'NEEDS_APPROVAL';

            return (
              <div
                key={i}
                className="p-2.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5 truncate">
                  {isBlocked ? (
                    <XCircle className="w-4 h-4 text-[#ef4444] shrink-0" />
                  ) : isApproval ? (
                    <AlertTriangle className="w-4 h-4 text-[#fbbf24] shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-[#10b981] shrink-0" />
                  )}
                  <div className="truncate">
                    <span className="font-bold text-[var(--text-primary)]">{dec.target}</span>
                    <span className="text-[10px] text-[var(--text-muted)] ml-2 font-sans truncate">
                      ({dec.action.toUpperCase()}) — {dec.reason}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded font-extrabold ${
                      isBlocked
                        ? 'bg-[#ef4444]/15 text-[#ef4444]'
                        : isApproval
                        ? 'bg-[#fbbf24]/15 text-[#fbbf24]'
                        : 'bg-[#10b981]/15 text-[#10b981]'
                    }`}
                  >
                    {dec.status}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)]">{dec.timestamp}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Scope Rules List */}
      <div className="p-3.5 rounded-xl bg-[var(--bg-panel)] border border-[var(--border-subtle)] space-y-2">
        <span className="font-bold text-[var(--text-primary)] text-xs uppercase tracking-wider block">
          Active Boundary Rule Definitions
        </span>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {scopeRules.map((rule) => (
            <div
              key={rule.id}
              className="p-2 rounded bg-[var(--bg-canvas)] border border-[var(--border-subtle)] space-y-1"
            >
              <div className="flex items-center justify-between">
                <code className="text-[#38bdf8] text-[11px] font-bold">{rule.pattern}</code>
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded font-extrabold uppercase ${
                    rule.type === 'block'
                      ? 'bg-[#ef4444]/15 text-[#ef4444]'
                      : rule.type === 'require_approval'
                      ? 'bg-[#fbbf24]/15 text-[#fbbf24]'
                      : 'bg-[#10b981]/15 text-[#10b981]'
                  }`}
                >
                  {rule.type}
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] font-sans">{rule.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
