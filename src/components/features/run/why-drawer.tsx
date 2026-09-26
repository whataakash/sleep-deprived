'use client';

import React from 'react';
import { MOCK_WHY_THIS_FILE } from '@/lib/repository/mock-repo';
import { HelpCircle, FileCode, Cpu, TestTube, RotateCcw, X, CheckCircle2 } from 'lucide-react';

interface WhyDrawerProps {
  filePath?: string;
  onClose: () => void;
}

export function WhyDrawer({ filePath = 'src/auth/client.ts', onClose }: WhyDrawerProps) {
  const fileExplain = MOCK_WHY_THIS_FILE[filePath] || MOCK_WHY_THIS_FILE['src/auth/client.ts'];

  return (
    <div className="w-full bg-[#12161c] border-t border-[#232a32] p-4 font-mono text-xs select-none">
      <div className="flex items-center justify-between pb-3 border-b border-[#232a32]">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-[#ea580c]" />
          <span className="font-bold text-white uppercase tracking-wider">
            Explainable Autonomous Reasoning: &ldquo;Why?&rdquo;
          </span>
          <span className="text-[11px] text-[var(--text-muted)]">
            Ground-truth decision justification
          </span>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-[#1a2027] text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
        {/* Why this file? */}
        <div className="p-3.5 rounded bg-[#161b22] border border-[#252d37] space-y-2">
          <div className="flex items-center gap-2 text-[#38bdf8] font-bold">
            <FileCode className="w-4 h-4" />
            <span>Why This File? ({fileExplain.filePath})</span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
            <span>Relevance Score:</span>
            <span className="text-[#10b981] font-bold">{fileExplain.relevanceScore}%</span>
          </div>

          <ul className="text-[11px] text-[var(--text-secondary)] space-y-1.5 list-disc list-inside">
            {fileExplain.reasons.map((r, i) => (
              <li key={i} className="leading-tight">
                {r}
              </li>
            ))}
          </ul>
        </div>

        {/* Why this model? */}
        <div className="p-3.5 rounded bg-[#161b22] border border-[#252d37] space-y-2">
          <div className="flex items-center gap-2 text-[#ea580c] font-bold">
            <Cpu className="w-4 h-4" />
            <span>Why This Model? (Kimi K2 Agentic)</span>
          </div>

          <div className="text-[11px] text-[var(--text-muted)]">
            Router Decision: Optimal Cost-Intelligence Balance
          </div>

          <ul className="text-[11px] text-[var(--text-secondary)] space-y-1.5 font-sans">
            <li className="flex items-center justify-between">
              <span>Task Complexity:</span>
              <span className="font-mono text-[#ea580c] font-bold">High (Cross-service Auth)</span>
            </li>
            <li className="flex items-center justify-between">
              <span>Context Size:</span>
              <span className="font-mono text-white">42,800 tokens</span>
            </li>
            <li className="flex items-center justify-between">
              <span>Tool Call Intensity:</span>
              <span className="font-mono text-[#38bdf8]">High (6 invocations)</span>
            </li>
            <li className="flex items-center justify-between">
              <span>Reasoning Capability:</span>
              <span className="font-mono text-[#10b981]">96 / 100 benchmark</span>
            </li>
          </ul>
        </div>

        {/* Why this test? */}
        <div className="p-3.5 rounded bg-[#161b22] border border-[#252d37] space-y-2">
          <div className="flex items-center gap-2 text-[#a78bfa] font-bold">
            <TestTube className="w-4 h-4" />
            <span>Why This Test? (auth.integration.test.ts)</span>
          </div>

          <p className="text-[11px] text-[var(--text-secondary)] font-sans leading-relaxed">
            Targeted test execution strategy covers the exact modified AST execution path (<code className="text-[#38bdf8]">fetchWithAuth</code>).
          </p>

          <div className="p-2 rounded bg-[#0f1318] border border-[#1f2630] text-[11px] text-[#10b981]">
            ✓ Avoids running redundant suites before targeted patch passes.
          </div>
        </div>

        {/* Why did the agent retry? */}
        <div className="p-3.5 rounded bg-[#161b22] border border-[#252d37] space-y-2">
          <div className="flex items-center gap-2 text-[#f59e0b] font-bold">
            <RotateCcw className="w-4 h-4" />
            <span>Why Did The Agent Retry?</span>
          </div>

          <p className="text-[11px] text-[var(--text-secondary)] font-sans leading-relaxed">
            Previous failure was classified as <strong className="text-white">TEST_FAILURE</strong> (HTTP 401), not an environment or hardware outage.
          </p>

          <div className="p-2 rounded bg-[#0f1318] border border-[#1f2630] text-[11px] text-[#f59e0b]">
            Fingerprint: AUTH-401-TOKEN-MISSING. Matched proven recovery tactic.
          </div>
        </div>
      </div>
    </div>
  );
}
