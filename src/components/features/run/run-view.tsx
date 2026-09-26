'use client';

import React, { useState } from 'react';
import { Run, AgentState } from '@/types/agent';
import { ProofRecord } from '@/types/verification';
import { ProofPanel } from './proof-panel';
import { ProofGraph } from './proof-graph';
import { DiffViewer } from './diff-viewer';
import { RecoveryTrace } from './recovery-trace';
import { GlassBoxTimeline } from './glass-box-timeline';
import { TerminalDrawer } from './terminal-drawer';
import { TaskContractPanel } from './task-contract-panel';
import { ScopeSecurityPanel } from './scope-security-panel';
import { RegressionPanel } from './regression-panel';
import { CheckpointsPanel } from './checkpoints-panel';
import { BranchingPanel } from './branching-panel';
import { DocsPanel } from './docs-panel';
import { ApprovalGatePanel } from './approval-gate-panel';
import { WhyPanel } from './why-panel';
import { MultiAgentSystem } from '@/lib/agent/multi-agent-system';
import { StuckAgentDetector } from '@/lib/agent/stuck-detector';
import { RECENT_RUNS } from '@/lib/runs/run-history';

import {
  ShieldCheck,
  CheckCircle2,
  FileCode,
  Layers,
  Flame,
  Terminal,
  HelpCircle,
  Compass,
  ShieldAlert,
  GitFork,
  BookOpen,
  History,
  ListChecks,
  Activity,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';

interface RunViewProps {
  run: Run;
  currentEventIndex: number;
  onScrub: (index: number) => void;
  isPlayingReplay: boolean;
  onTogglePlay: () => void;
  proof: ProofRecord;
  onOpenWhyFile?: (file: string) => void;
}

export type RunViewTab =
  | 'timeline'
  | 'diff'
  | 'recovery'
  | 'contract'
  | 'proof'
  | 'evidence-graph'
  | 'approval-gate'
  | 'why'
  | 'scope-security'
  | 'regression'
  | 'checkpoints'
  | 'branching'
  | 'docs'
  | 'history';

export function RunView({
  run,
  currentEventIndex,
  onScrub,
  isPlayingReplay,
  onTogglePlay,
  proof,
  onOpenWhyFile,
}: RunViewProps) {
  const [activeTab, setActiveTab] = useState<RunViewTab>('timeline');
  const [whyTargetFile, setWhyTargetFile] = useState('src/auth/client.ts');
  const [customTerminalLog, setCustomTerminalLog] = useState<string | undefined>(undefined);

  const currentEvent = run.events[currentEventIndex] || run.events[run.events.length - 1];
  const currentState: AgentState = currentEvent ? currentEvent.state : 'COMPLETE';
  const isVerified = currentEventIndex >= run.events.length - 2;

  const navigator = MultiAgentSystem.getNavigator();
  const supervisor = MultiAgentSystem.getSupervisor();
  const stuckTelemetry = StuckAgentDetector.analyzeToolCalls(run.toolCalls);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl shadow-xs font-sans transition-colors">
      {/* LEVEL 1: Run Header & Status */}
      <div className="p-3 bg-[var(--bg-elevated)] border-b border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-3 font-mono text-xs select-none">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded transition-all cursor-pointer text-xs ${
                activeTab === 'history'
                  ? 'bg-[#ea580c] text-white font-bold shadow-xs'
                  : 'bg-[var(--bg-panel)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
              title="View all persisted task runs"
            >
              <History className="w-3.5 h-3.5 text-[#38bdf8]" />
              <span>Recent Runs ({RECENT_RUNS.length})</span>
            </button>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[var(--bg-panel)] border border-[var(--border-subtle)] text-[#ea580c] font-semibold text-xs shadow-2xs">
              <Layers className="w-3.5 h-3.5" />
              <span className="font-bold text-[var(--text-primary)]">Run Details</span>
            </div>
            <span className="font-extrabold text-[var(--text-primary)] text-sm">Run #{run.runNumber}</span>
            <span className="text-[var(--text-muted)]">·</span>
            <span className="text-[var(--text-secondary)] font-medium truncate max-w-sm sm:max-w-md">
              {run.taskTitle}
            </span>
          </div>

          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              isVerified
                ? 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30'
                : 'bg-[#ea580c]/20 text-[#ea580c] border border-[#ea580c]/30'
            }`}
          >
            ● {isVerified ? 'VERIFIED' : currentState}
          </span>
        </div>

        {/* Status Indicators in Header */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[var(--text-muted)] font-mono">
            Proof: 100% · Invariants: 4/4 · Regressions: 0
          </span>
        </div>
      </div>

      {/* DUAL AGENT RUN METADATA & TELEMETRY STRIP */}
      <div className="px-3 py-2 bg-[var(--bg-canvas)] border-b border-[var(--border-subtle)] grid grid-cols-1 md:grid-cols-2 gap-2 font-mono text-[11px] select-none">
        {/* Navigating AI Bar */}
        <div className="px-2.5 py-1 rounded bg-[var(--bg-panel)] border border-[#38bdf8]/30 flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2 truncate">
            <Compass className="w-3.5 h-3.5 text-[#38bdf8] shrink-0" />
            <span className="font-bold text-[#38bdf8] shrink-0">{navigator.displayName}:</span>
            <span className="text-[var(--text-secondary)] truncate font-sans">{navigator.currentAction}</span>
          </div>
          <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#38bdf8]/15 text-[#38bdf8] font-bold shrink-0">
            {navigator.stats['Context Efficiency']}
          </span>
        </div>

        {/* Supervisor AI Bar */}
        <div className="px-2.5 py-1 rounded bg-[var(--bg-panel)] border border-[#10b981]/30 flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2 truncate">
            <ShieldCheck className="w-3.5 h-3.5 text-[#10b981] shrink-0" />
            <span className="font-bold text-[#10b981] shrink-0">{supervisor.displayName}:</span>
            <span className="text-[var(--text-secondary)] truncate font-sans">
              Scope: IN SCOPE · Secrets: 0 · Loops: HEALTHY · Invariants: 4/4
            </span>
          </div>
          <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#10b981]/15 text-[#10b981] font-bold shrink-0">
            SEALED ✓
          </span>
        </div>
      </div>

      {/* SEGMENTED NAVIGATION TABS */}
      <div className="px-3 py-2 bg-[var(--bg-panel)] border-b border-[var(--border-subtle)] flex flex-wrap items-center gap-1.5 font-mono text-xs select-none">
        {/* RECENT RUNS & PERSISTED HISTORY */}
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors cursor-pointer shrink-0 text-xs ${
            activeTab === 'history'
              ? 'bg-[#ea580c] text-white font-bold shadow-xs'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] border border-transparent'
          }`}
        >
          <History className="w-3.5 h-3.5 text-[#38bdf8]" />
          <span>Recent Runs ({RECENT_RUNS.length})</span>
        </button>

        <div className="h-3.5 w-[1px] bg-[var(--border-subtle)] mx-0.5 hidden sm:block shrink-0" />

        {/* PRIMARY WORKFLOW: Glass Box -> Changes -> Recovery -> Contract -> Proof */}
        <button
          onClick={() => setActiveTab('timeline')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors cursor-pointer shrink-0 text-xs ${
            activeTab === 'timeline'
              ? 'bg-[#ea580c] text-white font-bold shadow-xs'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] border border-transparent'
          }`}
        >
          <Terminal className="w-3.5 h-3.5 text-[#ea580c]" />
          <span>Glass Box</span>
        </button>

        <button
          onClick={() => setActiveTab('diff')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors cursor-pointer shrink-0 text-xs ${
            activeTab === 'diff'
              ? 'bg-[#ea580c] text-white font-bold shadow-xs'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] border border-transparent'
          }`}
        >
          <FileCode className="w-3.5 h-3.5 text-[#38bdf8]" />
          <span>Changes</span>
        </button>

        <button
          onClick={() => setActiveTab('recovery')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors cursor-pointer shrink-0 text-xs ${
            activeTab === 'recovery'
              ? 'bg-[#ea580c] text-white font-bold shadow-xs'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] border border-transparent'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-[#ea580c]" />
          <span>Recovery</span>
        </button>

        <button
          onClick={() => setActiveTab('contract')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors cursor-pointer shrink-0 text-xs ${
            activeTab === 'contract'
              ? 'bg-[#ea580c] text-white font-bold shadow-xs'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] border border-transparent'
          }`}
        >
          <ListChecks className="w-3.5 h-3.5 text-[#10b981]" />
          <span>Task Contract</span>
        </button>

        <button
          onClick={() => setActiveTab('proof')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors cursor-pointer shrink-0 text-xs ${
            activeTab === 'proof'
              ? 'bg-[#ea580c] text-white font-bold shadow-xs'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] border border-transparent'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-[#10b981]" />
          <span>Proof of Work</span>
        </button>

        <div className="h-3.5 w-[1px] bg-[var(--border-subtle)] mx-0.5 hidden sm:block shrink-0" />

        {/* VERIFICATION & EVIDENCE TABS */}
        <button
          onClick={() => setActiveTab('evidence-graph')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors cursor-pointer shrink-0 text-xs ${
            activeTab === 'evidence-graph'
              ? 'bg-[#ea580c] text-white font-bold shadow-xs'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] border border-transparent'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-[#10b981]" />
          <span>Evidence Graph</span>
        </button>

        <button
          onClick={() => setActiveTab('approval-gate')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors cursor-pointer shrink-0 text-xs ${
            activeTab === 'approval-gate'
              ? 'bg-[#ea580c] text-white font-bold shadow-xs'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] border border-transparent'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-[#ea580c]" />
          <span>Approval Gate</span>
        </button>

        <button
          onClick={() => setActiveTab('why')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors cursor-pointer shrink-0 text-xs ${
            activeTab === 'why'
              ? 'bg-[#ea580c] text-white font-bold shadow-xs'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] border border-transparent'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5 text-[#38bdf8]" />
          <span>Why? Reasoning</span>
        </button>

        <button
          onClick={() => setActiveTab('scope-security')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors cursor-pointer shrink-0 text-xs ${
            activeTab === 'scope-security'
              ? 'bg-[#ea580c] text-white font-bold shadow-xs'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] border border-transparent'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-[#fbbf24]" />
          <span>Scope & Security</span>
        </button>

        <button
          onClick={() => setActiveTab('regression')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors cursor-pointer shrink-0 text-xs ${
            activeTab === 'regression'
              ? 'bg-[#ea580c] text-white font-bold shadow-xs'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] border border-transparent'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-[#10b981]" />
          <span>Regressions</span>
        </button>

        <button
          onClick={() => setActiveTab('checkpoints')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors cursor-pointer shrink-0 text-xs ${
            activeTab === 'checkpoints'
              ? 'bg-[#ea580c] text-white font-bold shadow-xs'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] border border-transparent'
          }`}
        >
          <History className="w-3.5 h-3.5 text-[#38bdf8]" />
          <span>Checkpoints</span>
        </button>

        <button
          onClick={() => setActiveTab('branching')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors cursor-pointer shrink-0 text-xs ${
            activeTab === 'branching'
              ? 'bg-[#ea580c] text-white font-bold shadow-xs'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] border border-transparent'
          }`}
        >
          <GitFork className="w-3.5 h-3.5 text-[#a78bfa]" />
          <span>Branches</span>
        </button>

        <button
          onClick={() => setActiveTab('docs')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors cursor-pointer shrink-0 text-xs ${
            activeTab === 'docs'
              ? 'bg-[#ea580c] text-white font-bold shadow-xs'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] border border-transparent'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-[#38bdf8]" />
          <span>Docs</span>
        </button>
      </div>

      {/* MAIN WORKSPACE CONTENT */}
      <div className="flex-1 flex overflow-hidden">
        {/* Glass Box Execution Timeline */}
        {activeTab === 'timeline' && (
          <GlassBoxTimeline
            events={run.events.slice(0, currentEventIndex + 1)}
            toolCalls={run.toolCalls}
            onOpenWhyFile={(file) => {
              setWhyTargetFile(file);
              setActiveTab('why');
            }}
            onOpenDiff={() => setActiveTab('diff')}
            onOpenProof={() => setActiveTab('proof')}
          />
        )}

        {/* Diff Viewer (Changes) */}
        {activeTab === 'diff' && <DiffViewer onBackToRun={() => setActiveTab('timeline')} />}

        {/* Recovery Trace */}
        {activeTab === 'recovery' && (
          <RecoveryTrace
            attempts={run.recoveryAttempts}
            onOpenDiff={() => setActiveTab('diff')}
          />
        )}

        {/* Task Contract */}
        {activeTab === 'contract' && <TaskContractPanel />}

        {/* Proof of Work */}
        {activeTab === 'proof' && (
          <ProofPanel
            proof={proof}
            onOpenDiff={() => setActiveTab('diff')}
            onOpenProofGraph={() => setActiveTab('evidence-graph')}
            onOpenTerminalSnippet={(snippet) => setCustomTerminalLog(snippet)}
          />
        )}

        {/* Evidence Graph (Dedicated Workspace View) */}
        {activeTab === 'evidence-graph' && (
          <div className="flex-1 flex flex-col overflow-hidden bg-[var(--bg-panel)]">
            <ProofGraph nodes={proof.graphNodes} edges={proof.graphEdges} />
          </div>
        )}

        {/* Human Approval Gate (Dedicated Workspace View) */}
        {activeTab === 'approval-gate' && <ApprovalGatePanel />}

        {/* Why? Reasoning (Dedicated Workspace View) */}
        {activeTab === 'why' && (
          <WhyPanel
            filePath={whyTargetFile}
            onOpenDiff={() => setActiveTab('diff')}
          />
        )}

        {/* Scope & Security */}
        {activeTab === 'scope-security' && <ScopeSecurityPanel />}

        {/* Regression Panel */}
        {activeTab === 'regression' && <RegressionPanel runId={run.id} />}

        {/* Checkpoints */}
        {activeTab === 'checkpoints' && <CheckpointsPanel />}

        {/* Branching */}
        {activeTab === 'branching' && <BranchingPanel />}

        {/* Docs */}
        {activeTab === 'docs' && <DocsPanel />}

        {/* Run History & Persisted Tasks View */}
        {activeTab === 'history' && (
          <div className="flex-1 flex flex-col overflow-y-auto p-4 sm:p-6 space-y-4 bg-[var(--bg-canvas)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border-subtle)] font-mono text-xs">
              <div>
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-[#ea580c]" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">
                    Recent Runs & Execution History
                  </h2>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] font-sans mt-1">
                  Active task execution records alongside reference benchmark baselines.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[var(--text-muted)]">
                  Active: <strong className="text-[var(--text-primary)]">Run #{run.runNumber}</strong>
                </span>
                <span>·</span>
                <span className="text-[11px] text-[var(--text-muted)]">
                  Reference: <strong className="text-[var(--text-primary)]">{RECENT_RUNS.length} baselines</strong>
                </span>
              </div>
            </div>

            {/* Section 1: Real Current Execution Data */}
            <div className="space-y-2 font-mono text-xs">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#ea580c]">
                <span className="w-2 h-2 rounded-full bg-[#ea580c] animate-pulse" />
                <span>Current Real Execution</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#ea580c]/15 text-[#ea580c] border border-[#ea580c]/30 font-bold">
                  LIVE SESSION
                </span>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('timeline')}
                className="w-full p-3.5 rounded-xl border border-[#ea580c]/50 bg-[var(--bg-elevated)] ring-1 ring-[#ea580c]/30 text-left transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      isVerified ? 'bg-[#10b981]' : 'bg-[#ea580c]'
                    }`}
                  />
                  <div>
                    <div className="font-semibold text-xs text-[var(--text-primary)] group-hover:text-[#ea580c] transition-colors">
                      {run.taskTitle}
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] flex flex-wrap items-center gap-2 mt-1">
                      <span className="font-bold text-[var(--text-secondary)]">Run #{run.runNumber}</span>
                      <span>·</span>
                      <span>Autonomous Pair</span>
                      <span>·</span>
                      <span>{run.events.length} lifecycle events</span>
                      <span>·</span>
                      <span className="text-[#38bdf8] font-mono truncate max-w-[220px]">
                        Proof: {proof.proofHash ? `${proof.proofHash.slice(0, 16)}...` : 'Generating...'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      isVerified
                        ? 'bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30'
                        : 'bg-[#ea580c]/15 text-[#ea580c] border border-[#ea580c]/30'
                    }`}
                  >
                    {isVerified ? 'VERIFIED' : currentState}
                  </span>
                  <span className="text-[11px] font-bold text-[#ea580c] group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                    Inspect Real Run →
                  </span>
                </div>
              </button>
            </div>

            {/* Section 2: Reference Benchmark Baselines */}
            <div className="space-y-2 pt-2 font-mono text-xs">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                <span>Reference Benchmark Executions</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-[var(--bg-subtle)] text-[var(--text-muted)] border border-[var(--border-subtle)] font-bold">
                  REFERENCE DATA
                </span>
              </div>

              <div className="space-y-2 font-mono text-xs">
                {RECENT_RUNS.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setActiveTab('timeline')}
                    className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${
                      r.number === run.runNumber
                        ? 'bg-[var(--bg-elevated)] border-[#ea580c]/50 ring-1 ring-[#ea580c]/30'
                        : 'bg-[var(--bg-panel)] hover:bg-[var(--bg-elevated)] border-[var(--border-subtle)] hover:border-[var(--border-medium)]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          r.status === 'VERIFIED' ? 'bg-[#10b981]' : 'bg-[#ef4444]'
                        }`}
                      />
                      <div>
                        <div className="font-semibold text-xs text-[var(--text-primary)] group-hover:text-[#ea580c] transition-colors">
                          {r.title}
                        </div>
                        <div className="text-[11px] text-[var(--text-muted)] flex flex-wrap items-center gap-2 mt-0.5">
                          <span className="font-bold text-[var(--text-secondary)]">Run #{r.number}</span>
                          <span>·</span>
                          <span>{r.agentMode}</span>
                          <span>·</span>
                          <span>{r.filesCount} {r.filesCount === 1 ? 'file' : 'files'} changed</span>
                          <span>·</span>
                          <span>{r.duration}</span>
                          <span>·</span>
                          <span className="text-[#38bdf8]">{r.modelUsed}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                          r.status === 'VERIFIED'
                            ? 'bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30'
                            : 'bg-[#ef4444]/15 text-[#ef4444] border border-[#ef4444]/30'
                        }`}
                      >
                        {r.status}
                      </span>
                      <span className="text-[11px] text-[var(--text-muted)]">
                        {r.timestamp}
                      </span>
                      <span className="text-[11px] font-bold text-[#ea580c] group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                        Inspect →
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Terminal Output Docked at Bottom of Unified Container */}
      <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-canvas)]">
        <TerminalDrawer customSnippet={customTerminalLog} />
      </div>
    </div>
  );
}
