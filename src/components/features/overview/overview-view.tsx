'use client';

import React, { useState } from 'react';
import {
  FolderGit2,
  Cpu,
  ArrowRight,
  ShieldCheck,
  Terminal,
  Clock,
  Sparkles,
  GitBranch,
} from 'lucide-react';

interface OverviewViewProps {
  onStartRun: (taskText: string, modelId: string) => void;
  onOpenRun: (runNumber: number) => void;
}

interface RecentRunItem {
  id: string;
  number: number;
  title: string;
  status: 'VERIFIED' | 'FAILED';
  duration: string;
  timestamp: string;
  filesCount: number;
  modelUsed: string;
}

const RECENT_RUNS: RecentRunItem[] = [
  {
    id: 'run-1042',
    number: 1042,
    title: 'Fix auth-gateway-service: forward session token in client',
    status: 'VERIFIED',
    duration: '42s',
    timestamp: '12m ago',
    filesCount: 1,
    modelUsed: 'Qwen3-Coder-Next',
  },
  {
    id: 'run-1041',
    number: 1041,
    title: 'Inject rate-limiter middleware into redis token bucket',
    status: 'VERIFIED',
    duration: '1m 18s',
    timestamp: '2h ago',
    filesCount: 3,
    modelUsed: 'DeepSeek-V3-Coder',
  },
  {
    id: 'run-1040',
    number: 1040,
    title: 'Handle malformed JWT signature without unhandled rejection',
    status: 'VERIFIED',
    duration: '34s',
    timestamp: '5h ago',
    filesCount: 2,
    modelUsed: 'Kimi-K2.5-Agent',
  },
  {
    id: 'run-1039',
    number: 1039,
    title: 'Update database migration schema for user audit logs',
    status: 'VERIFIED',
    duration: '58s',
    timestamp: 'Yesterday',
    filesCount: 4,
    modelUsed: 'GLM-5-MoE',
  },
];

export function OverviewView({ onStartRun, onOpenRun }: OverviewViewProps) {
  const [taskPrompt, setTaskPrompt] = useState(
    'Fix the authentication failures in auth-gateway-service: forward active session tokens across internal service requests and ensure all regression tests pass.'
  );
  const [selectedModelId, setSelectedModelId] = useState('qwen3-coder-next');

  return (
    <div className="flex-1 flex flex-col items-center justify-start overflow-y-auto px-4 py-8 select-none font-sans transition-colors">
      <div className="w-full max-w-2xl space-y-8">
        {/* Main Heading */}
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            What are we building?
          </h1>
          <p className="text-xs text-[var(--text-secondary)] font-mono">
            Autonomous software engineering with deterministic proof of work.
          </p>
        </div>

        {/* Task Intake Box */}
        <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl p-4 space-y-4 shadow-sm transition-colors">
          <textarea
            rows={4}
            value={taskPrompt}
            onChange={(e) => setTaskPrompt(e.target.value)}
            placeholder="Describe a software task... e.g. Fix the failing authentication tests and update the implementation without changing the public API."
            className="w-full bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none resize-none leading-relaxed font-sans"
          />

          <div className="pt-3 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
            {/* Repository & Model Pickers */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-2.5 py-1 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[11px] text-[var(--text-secondary)]">
                <FolderGit2 className="w-3 h-3 text-[#ea580c]" />
                <span className="text-[var(--text-primary)] font-medium">auth-gateway-service</span>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[11px]">
                <Cpu className="w-3 h-3 text-[#38bdf8]" />
                <select
                  value={selectedModelId}
                  onChange={(e) => setSelectedModelId(e.target.value)}
                  className="bg-transparent text-[var(--text-primary)] outline-none cursor-pointer"
                >
                  <option value="qwen3-coder-next" className="bg-[var(--bg-panel)] text-[var(--text-primary)]">
                    Qwen3-Coder-Next (Auto Recommended)
                  </option>
                  <option value="kimi-k2-5-agent" className="bg-[var(--bg-panel)] text-[var(--text-primary)]">
                    Kimi K2.5 Multimodal
                  </option>
                  <option value="glm-5-moe" className="bg-[var(--bg-panel)] text-[var(--text-primary)]">
                    GLM-5 MoE
                  </option>
                  <option value="deepseek-v3-coder" className="bg-[var(--bg-panel)] text-[var(--text-primary)]">
                    DeepSeek V3 Coder
                  </option>
                  <option value="claude-3-7-sonnet" className="bg-[var(--bg-panel)] text-[var(--text-primary)]">
                    Claude 3.7 Sonnet
                  </option>
                  <option value="ollama-local-qwen3" className="bg-[var(--bg-panel)] text-[var(--text-primary)]">
                    Local / Ollama
                  </option>
                </select>
              </div>
            </div>

            {/* Submit Action Button */}
            <button
              onClick={() => onStartRun(taskPrompt, selectedModelId)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#ea580c] hover:bg-[#f97316] text-white font-semibold text-xs transition-all shadow-xs active:scale-[0.98] cursor-pointer"
            >
              <span>Run with परिश्रम</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Recent Runs List */}
        <div className="space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">
            <span>Recent Runs</span>
            <span>All Tasks Persisted</span>
          </div>

          <div className="space-y-1.5">
            {RECENT_RUNS.map((run) => (
              <button
                key={run.id}
                onClick={() => onOpenRun(run.number)}
                className="w-full p-3 rounded-lg bg-[var(--bg-panel)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--border-medium)] flex items-center justify-between text-left transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      run.status === 'VERIFIED' ? 'bg-[#10b981]' : 'bg-[#ef4444]'
                    }`}
                  />
                  <div>
                    <div className="font-semibold text-[var(--text-primary)] group-hover:text-[#ea580c] transition-colors">
                      {run.title}
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-2 mt-0.5">
                      <span>Run #{run.number}</span>
                      <span>·</span>
                      <span>{run.filesCount} file changed</span>
                      <span>·</span>
                      <span>{run.duration}</span>
                      <span>·</span>
                      <span>{run.modelUsed}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      run.status === 'VERIFIED'
                        ? 'bg-[#10b981]/15 text-[#10b981]'
                        : 'bg-[#ef4444]/15 text-[#ef4444]'
                    }`}
                  >
                    {run.status}
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)] hidden sm:inline">
                    {run.timestamp}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Minimal System Status Footer */}
        <div className="pt-4 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-3 text-[11px] text-[var(--text-muted)] font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#10b981]" />
            <span className="text-[var(--text-secondary)]">All systems operational</span>
          </div>

          <div className="flex items-center gap-4">
            <span>Sandboxed chroot: active</span>
            <span>Deterministic harness: v2.4</span>
          </div>
        </div>
      </div>
    </div>
  );
}
