'use client';

import React, { useState } from 'react';
import {
  ArrowRight,
  ShieldCheck,
  Cpu,
  FolderGit2,
  GitBranch,
  Terminal,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Play,
  RotateCcw,
} from 'lucide-react';
import { DynamicCodingModel } from '@/types/models';
import { CURRENT_2026_MODELS } from '@/lib/models/gateway';

interface OverviewViewProps {
  onStartRun: (taskText: string, modelId: string) => void;
  onOpenRun: (runNumber: number) => void;
}

export function OverviewView({ onStartRun, onOpenRun }: OverviewViewProps) {
  const [taskPrompt, setTaskPrompt] = useState(
    'Fix the failing authentication tests in auth-gateway-service without changing the public API.'
  );
  const [selectedModelId, setSelectedModelId] = useState('qwen3-coder-next');

  const selectedModel =
    CURRENT_2026_MODELS.find((m) => m.id === selectedModelId) || CURRENT_2026_MODELS[0];

  const RECENT_RUNS = [
    {
      id: 'run-1042',
      number: 1042,
      title: 'Fix authentication timeout & session token forwarding',
      status: 'VERIFIED',
      duration: '35s',
      filesCount: 1,
      testsPassed: '4/4',
      modelUsed: 'Qwen3-Coder-Next',
      timestamp: 'Today, 10:42 AM',
    },
    {
      id: 'run-1041',
      number: 1041,
      title: 'Add keyset pagination and boundary tests to /api/audit',
      status: 'VERIFIED',
      duration: '1m 18s',
      filesCount: 3,
      testsPassed: '12/12',
      modelUsed: 'Kimi K2.5',
      timestamp: 'Yesterday',
    },
    {
      id: 'run-1040',
      number: 1040,
      title: 'Refactor payment middleware to handle idempotency keys',
      status: 'BLOCKED',
      duration: '45s',
      filesCount: 2,
      testsPassed: '2/5',
      modelUsed: 'GLM-5 MoE',
      timestamp: 'Sep 24, 2026',
    },
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-start overflow-y-auto px-4 py-8 select-none font-sans">
      <div className="w-full max-w-2xl space-y-8">
        {/* Main Heading */}
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            What are we building?
          </h1>
          <p className="text-xs text-[var(--text-secondary)] font-mono">
            Autonomous software engineering with deterministic proof of work.
          </p>
        </div>

        {/* Task Intake Box */}
        <div className="bg-[#111419] border border-[#232a32] rounded-xl p-4 space-y-4 shadow-xl">
          <textarea
            rows={4}
            value={taskPrompt}
            onChange={(e) => setTaskPrompt(e.target.value)}
            placeholder="Describe a software task... e.g. Fix the failing authentication tests and update the implementation without changing the public API."
            className="w-full bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none resize-none leading-relaxed font-sans"
          />

          <div className="pt-3 border-t border-[#1f262f] flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
            {/* Repository & Model Pickers */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#161a20] border border-[#262e37] text-[11px] text-[var(--text-secondary)]">
                <FolderGit2 className="w-3 h-3 text-[#ea580c]" />
                <span className="text-white font-medium">auth-gateway-service</span>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#161a20] border border-[#262e37] text-[11px]">
                <Cpu className="w-3 h-3 text-[#38bdf8]" />
                <select
                  value={selectedModelId}
                  onChange={(e) => setSelectedModelId(e.target.value)}
                  className="bg-transparent text-white outline-none cursor-pointer"
                >
                  <option value="qwen3-coder-next">Qwen3-Coder-Next (Auto Recommended)</option>
                  <option value="kimi-k2-5-agent">Kimi K2.5 Multimodal</option>
                  <option value="glm-5-moe">GLM-5 MoE</option>
                  <option value="deepseek-v3-coder">DeepSeek V3 Coder</option>
                  <option value="claude-3-7-sonnet">Claude 3.7 Sonnet</option>
                  <option value="ollama-local-qwen3">Local / Ollama</option>
                </select>
              </div>
            </div>

            {/* Submit Action Button */}
            <button
              onClick={() => onStartRun(taskPrompt, selectedModelId)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#ea580c] hover:bg-[#f97316] text-white font-semibold text-xs transition-all shadow-sm hover:shadow-[#ea580c]/20 cursor-pointer"
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
                className="w-full p-3 rounded-lg bg-[#0e1115] hover:bg-[#14181f] border border-[#1f262f] hover:border-[#2d3744] flex items-center justify-between text-left transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      run.status === 'VERIFIED' ? 'bg-[#10b981]' : 'bg-[#ef4444]'
                    }`}
                  />
                  <div>
                    <div className="font-semibold text-white group-hover:text-[#ea580c] transition-colors">
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
        <div className="pt-4 border-t border-[#1a2027] flex flex-wrap items-center justify-between gap-3 text-[11px] text-[var(--text-muted)] font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#10b981]" />
            <span className="text-[var(--text-secondary)]">All systems operational</span>
          </div>

          <div className="flex items-center gap-3">
            <span>Model: <strong className="text-white">{selectedModel.displayName}</strong></span>
            <span>·</span>
            <span>Verification: <strong className="text-[#10b981]">Enforced</strong></span>
            <span>·</span>
            <span>Repo: <strong className="text-white">auth-gateway-service</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}
