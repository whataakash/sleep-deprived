'use client';

import React from 'react';
import { ProofRecord } from '@/types/verification';
import {
  ShieldCheck,
  CheckCircle2,
  FileCode,
  FileCheck,
  Cpu,
  Layers,
  ExternalLink,
  Flame,
  AlertCircle,
  Hash,
  Terminal,
} from 'lucide-react';

interface ProofPanelProps {
  proof: ProofRecord;
  onOpenDiff?: () => void;
  onOpenProofGraph?: () => void;
  onOpenTerminalSnippet?: (snippet: string) => void;
}

export function ProofPanel({
  proof,
  onOpenDiff,
  onOpenProofGraph,
  onOpenTerminalSnippet,
}: ProofPanelProps) {
  return (
    <div className="flex-1 flex flex-col bg-[#0e1115] border border-[#232a32] rounded overflow-y-auto">
      {/* Proof Header with Cryptographic Stamp */}
      <div className="p-5 bg-gradient-to-r from-[#0d1612] to-[#121a16] border-b border-[#1b3829] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-[#10b981]/20 border border-[#10b981]/40 text-[#10b981] font-mono text-xs font-bold tracking-widest uppercase">
              {proof.badgeTitle}
            </span>
            <span className="text-xs text-[var(--text-muted)] font-mono">
              Proof Hash: {proof.proofHash.slice(0, 16)}...
            </span>
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            Proof of Work & Verification Certificate
          </h2>
          <p className="text-xs text-[var(--text-secondary)]">
            Verified across unit tests, cross-service integration suite, compiler AST checks, and regression safeguards.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenProofGraph && (
            <button
              onClick={onOpenProofGraph}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#16291e] hover:bg-[#1e392a] text-[#10b981] border border-[#10b981]/30 text-xs font-mono font-medium transition-colors cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Inspect Proof Graph</span>
            </button>
          )}

          {onOpenDiff && (
            <button
              onClick={onOpenDiff}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#14181e] hover:bg-[#1c222b] text-[var(--text-primary)] border border-[#2a3440] text-xs font-mono font-medium transition-colors cursor-pointer"
            >
              <FileCode className="w-3.5 h-3.5 text-[#38bdf8]" />
              <span>Inspect Diff</span>
            </button>
          )}
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Core Proof Matrix Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 font-mono">
          {/* Card 1: Tests */}
          <div className="p-3.5 rounded bg-[#13171e] border border-[#252d36] space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
              <span>TEST SUITES</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-[#10b981]" />
            </div>
            <div className="text-base font-bold text-white">4 / 4 Passed</div>
            <div className="text-[11px] text-[#10b981] flex items-center gap-1">
              <span>0 failing · 0 skipped</span>
            </div>
            <div className="text-[10px] text-[var(--text-muted)] pt-1 border-t border-[#1e252e]">
              Unit (2) · Integ (1) · Reg (1)
            </div>
          </div>

          {/* Card 2: Build & Types */}
          <div className="p-3.5 rounded bg-[#13171e] border border-[#252d36] space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
              <span>STATIC ANALYSIS</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-[#10b981]" />
            </div>
            <div className="text-base font-bold text-white">tsc --noEmit</div>
            <div className="text-[11px] text-[#10b981] flex items-center gap-1">
              <span>0 compiler diagnostics</span>
            </div>
            <div className="text-[10px] text-[var(--text-muted)] pt-1 border-t border-[#1e252e]">
              ESLint: clean · Build: clean
            </div>
          </div>

          {/* Card 3: Changes */}
          <div className="p-3.5 rounded bg-[#13171e] border border-[#252d36] space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
              <span>MUTATIONS</span>
              <FileCheck className="w-3.5 h-3.5 text-[#38bdf8]" />
            </div>
            <div className="text-base font-bold text-white">1 File Changed</div>
            <div className="text-[11px] text-[#38bdf8] flex items-center gap-1">
              <span>+14 lines · -2 lines</span>
            </div>
            <div className="text-[10px] text-[var(--text-muted)] pt-1 border-t border-[#1e252e]">
              src/auth/client.ts
            </div>
          </div>

          {/* Card 4: Regression Risk */}
          <div className="p-3.5 rounded bg-[#13171e] border border-[#252d36] space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
              <span>REGRESSION RISK</span>
              <span className="text-[10px] px-1 rounded bg-[#10b981]/20 text-[#10b981] font-bold">
                LOW
              </span>
            </div>
            <div className="text-base font-bold text-white">0% Risk Score</div>
            <div className="text-[11px] text-[var(--text-secondary)]">
              Non-breaking client patch
            </div>
            <div className="text-[10px] text-[var(--text-muted)] pt-1 border-t border-[#1e252e]">
              Passes security regression
            </div>
          </div>
        </div>

        {/* Requirements Coverage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[var(--text-secondary)] font-semibold uppercase tracking-wider">
              Task Requirement Satisfaction (4 / 4)
            </span>
            <span className="text-[#10b981] font-bold">100% COVERAGE</span>
          </div>

          <div className="space-y-2 font-mono text-xs">
            {proof.taskCoverage.requirements.map((req, i) => (
              <div
                key={i}
                className="p-3 rounded bg-[#13171e] border border-[#232a32] flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#10b981] shrink-0" />
                  <span className="text-[var(--text-primary)]">{req.text}</span>
                </div>
                <span className="text-[11px] text-[var(--text-muted)] px-2 py-0.5 rounded bg-[#181d24] border border-[#28323e]">
                  Evidence Ref: {req.evidenceRef}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Evidence Trail — Every claim backed by ground truth */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-xs font-bold font-mono text-[var(--text-primary)] uppercase tracking-wider">
                Verifiable Evidence Trail
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Every claim links directly to line numbers, test suite runs, and deterministic logs.
              </p>
            </div>
          </div>

          <div className="space-y-2 font-mono text-xs">
            {proof.evidenceTrail.map((ev) => (
              <div
                key={ev.id}
                className="p-3.5 rounded bg-[#13171e] border border-[#252d36] hover:border-[#384351] transition-all space-y-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-[#10b981]/15 text-[#10b981] text-[10px] font-bold">
                        PROVEN
                      </span>
                      <span className="text-[var(--text-primary)] font-semibold">{ev.claim}</span>
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-2 flex-wrap">
                      <span>Target:</span>
                      <code className="text-[#38bdf8] bg-[#0c1014] px-1.5 py-0.5 rounded border border-[#1f2630]">
                        {ev.targetArtifact}
                      </code>
                      <span>Method:</span>
                      <span className="text-[var(--text-secondary)]">{ev.verificationMethod}</span>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      onOpenTerminalSnippet && onOpenTerminalSnippet(ev.logOutputRef)
                    }
                    className="flex items-center gap-1 px-2 py-1 rounded bg-[#181d24] hover:bg-[#202731] text-[var(--text-secondary)] hover:text-white text-[11px] transition-colors cursor-pointer shrink-0"
                    title="View Raw Execution Output"
                  >
                    <Terminal className="w-3 h-3 text-[#f97316]" />
                    <span>Log Ref</span>
                  </button>
                </div>

                <div className="p-2 rounded bg-[#0b0e12] border border-[#1e252f] text-[11px] text-[var(--text-secondary)] flex items-center justify-between">
                  <code>{ev.logOutputRef}</code>
                  <span className="text-[#10b981] text-[10px] font-bold">EXIT 0</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Test Breakdown */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-bold font-mono text-[var(--text-primary)] uppercase tracking-wider">
            Automated Test Suite Assertions (4 Tests)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
            {/* Unit */}
            <div className="p-3 rounded bg-[#13171e] border border-[#232a32] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">Unit Suite</span>
                <span className="text-[#10b981] font-bold">2/2 PASS</span>
              </div>
              <div className="text-[11px] text-[var(--text-muted)]">
                tests/unit/session.test.ts (14ms)
              </div>
              <ul className="text-[11px] text-[var(--text-secondary)] space-y-1 list-disc list-inside">
                <li>creates active session</li>
                <li>validates token expiration</li>
              </ul>
            </div>

            {/* Integration */}
            <div className="p-3 rounded bg-[#13171e] border border-[#232a32] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">Integration Suite</span>
                <span className="text-[#10b981] font-bold">1/1 PASS</span>
              </div>
              <div className="text-[11px] text-[var(--text-muted)]">
                tests/integration/auth.test.ts (42ms)
              </div>
              <ul className="text-[11px] text-[var(--text-secondary)] space-y-1 list-disc list-inside">
                <li>forwards session token header</li>
              </ul>
            </div>

            {/* Regression */}
            <div className="p-3 rounded bg-[#13171e] border border-[#232a32] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">Regression Suite</span>
                <span className="text-[#10b981] font-bold">1/1 PASS</span>
              </div>
              <div className="text-[11px] text-[var(--text-muted)]">
                tests/regression/security.test.ts (18ms)
              </div>
              <ul className="text-[11px] text-[var(--text-secondary)] space-y-1 list-disc list-inside">
                <li>rejects forged bearer tokens</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
