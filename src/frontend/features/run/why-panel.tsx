'use client';

import React from 'react';
import { MOCK_WHY_THIS_FILE } from '@/lib/repository/mock-repo';
import { HelpCircle, FileCode, Cpu, TestTube, RotateCcw, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

interface WhyPanelProps {
  filePath?: string;
  onOpenDiff?: () => void;
}

export function WhyPanel({ filePath = 'src/auth/client.ts', onOpenDiff }: WhyPanelProps) {
  const fileExplain = MOCK_WHY_THIS_FILE[filePath] || MOCK_WHY_THIS_FILE['src/auth/client.ts'];

  return (
    <div className="flex-1 flex flex-col bg-[var(--bg-panel)] overflow-hidden font-mono text-xs select-none transition-colors">
      {/* Header */}
      <div className="p-3.5 bg-[var(--bg-elevated)] border-b border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#38bdf8]/15 border border-[#38bdf8]/30 flex items-center justify-center text-[#38bdf8]">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-[var(--text-primary)]">
                Explainable Autonomous Reasoning (&ldquo;Why?&rdquo;)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#38bdf8]/15 text-[#38bdf8] font-bold">
                GROUND-TRUTH JUSTIFICATION
              </span>
            </div>
            <div className="text-[11px] text-[var(--text-muted)] font-sans mt-0.5">
              Inspect the exact causal rationale for why the agent selected specific target ASTs, router models, recovery strategies, and verification suites.
            </div>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-[var(--text-muted)] block">Decision Traceability</span>
          <span className="font-bold text-[#10b981] text-xs">100% EXPLAINABLE AUDIT</span>
        </div>
      </div>

      {/* 4-Column Intelligence Dashboard */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Why this file? */}
          <div className="p-4 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#38bdf8] font-bold text-sm">
                <FileCode className="w-4 h-4" />
                <span>Why This File?</span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded bg-[#10b981]/15 text-[#10b981] font-bold">
                {fileExplain.relevanceScore}% AST Match
              </span>
            </div>

            <div className="text-xs text-[var(--text-secondary)] font-mono">
              Target AST: <code className="text-[var(--text-primary)] font-bold">{fileExplain.filePath}</code>
            </div>

            <ul className="text-xs text-[var(--text-secondary)] space-y-2 list-disc list-inside font-sans leading-relaxed">
              {fileExplain.reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>

            {onOpenDiff && (
              <button
                onClick={onOpenDiff}
                className="mt-2 text-xs text-[#38bdf8] hover:text-[#7dd3fc] underline font-mono cursor-pointer flex items-center gap-1"
              >
                <span>Inspect Patch Diff in Changes View →</span>
              </button>
            )}
          </div>

          {/* Why this model? */}
          <div className="p-4 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#ea580c] font-bold text-sm">
                <Cpu className="w-4 h-4" />
                <span>Why This Model? (Qwen3-Coder-Next)</span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded bg-[#ea580c]/15 text-[#ea580c] font-bold">
                AUTO-ROUTED
              </span>
            </div>

            <div className="text-xs text-[var(--text-muted)] font-sans">
              Router Decision Matrix: Evaluated AST size, tool frequency, and reasoning benchmark score.
            </div>

            <ul className="text-xs text-[var(--text-secondary)] space-y-2 font-mono">
              <li className="flex items-center justify-between p-2 rounded bg-[var(--bg-panel)] border border-[var(--border-subtle)]">
                <span>Task Complexity:</span>
                <span className="text-[#ea580c] font-bold">HIGH (Cross-Service Auth)</span>
              </li>
              <li className="flex items-center justify-between p-2 rounded bg-[var(--bg-panel)] border border-[var(--border-subtle)]">
                <span>Context Window:</span>
                <span className="text-[var(--text-primary)] font-bold">42,800 tokens</span>
              </li>
              <li className="flex items-center justify-between p-2 rounded bg-[var(--bg-panel)] border border-[var(--border-subtle)]">
                <span>Tool Invocations:</span>
                <span className="text-[#38bdf8] font-bold">6 verified calls</span>
              </li>
              <li className="flex items-center justify-between p-2 rounded bg-[var(--bg-panel)] border border-[var(--border-subtle)]">
                <span>Coding Benchmark:</span>
                <span className="text-[#10b981] font-bold">96 / 100</span>
              </li>
            </ul>
          </div>

          {/* Why this test? */}
          <div className="p-4 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#a78bfa] font-bold text-sm">
                <TestTube className="w-4 h-4" />
                <span>Why This Test? (auth.integration.test.ts)</span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded bg-[#a78bfa]/15 text-[#a78bfa] font-bold">
                TARGETED TEST
              </span>
            </div>

            <p className="text-xs text-[var(--text-secondary)] font-sans leading-relaxed">
              Targeted test execution strategy covers the exact modified AST execution path (<code className="text-[#38bdf8] font-mono">fetchWithAuth</code>). Running targeted tests first ensures fast feedback cycles before full regression verification.
            </p>

            <div className="p-3 rounded-lg bg-[var(--code-bg)] border border-[var(--border-subtle)] text-xs text-[#10b981] font-mono flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>✓ Test assertions verified: session headers passed and 200 OK returned.</span>
            </div>
          </div>

          {/* Why did the agent retry? */}
          <div className="p-4 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#f59e0b] font-bold text-sm">
                <RotateCcw className="w-4 h-4" />
                <span>Why Did The Agent Retry?</span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded bg-[#f59e0b]/15 text-[#f59e0b] font-bold">
                RECOVERY TRIGGER
              </span>
            </div>

            <p className="text-xs text-[var(--text-secondary)] font-sans leading-relaxed">
              Attempt #1 failed with <strong className="text-[var(--text-primary)]">HTTP 401 Unauthorized</strong>. The failure classifier determined this was a code logic defect (missing token forwarding) rather than an environment outage.
            </p>

            <div className="p-3 rounded-lg bg-[var(--code-bg)] border border-[var(--border-subtle)] text-xs text-[#f59e0b] font-mono">
              Fingerprint: <code>AUTH-401-TOKEN-MISSING</code> · Replay verified fix in Attempt #2.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
