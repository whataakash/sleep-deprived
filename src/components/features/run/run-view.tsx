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
import { WhyDrawer } from './why-drawer';
import { TaskContractPanel } from './task-contract-panel';
import { ScopeSecurityPanel } from './scope-security-panel';
import { RegressionPanel } from './regression-panel';
import { CheckpointsPanel } from './checkpoints-panel';
import { BranchingPanel } from './branching-panel';
import { DocsPanel } from './docs-panel';
import { ApprovalModal } from './approval-modal';
import { MultiAgentSystem } from '@/lib/agent/multi-agent-system';
import { StuckAgentDetector } from '@/lib/agent/stuck-detector';

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
  | 'proof'
  | 'diff'
  | 'recovery'
  | 'contract'
  | 'scope-security'
  | 'regression'
  | 'checkpoints'
  | 'branching'
  | 'docs'
  | 'timeline';

export function RunView({
  run,
  currentEventIndex,
  onScrub,
  isPlayingReplay,
  onTogglePlay,
  proof,
  onOpenWhyFile,
}: RunViewProps) {
  const [activeTab, setActiveTab] = useState<RunViewTab>('diff');
  const [showProofGraphModal, setShowProofGraphModal] = useState(false);
  const [showWhyModal, setShowWhyModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
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

        {/* Global Action Modals (Proof Graph, Approval Gate, Why?) */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowApprovalModal(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[var(--bg-panel)] hover:bg-[var(--bg-subtle)] text-[#ea580c] border border-[#ea580c]/30 text-[11px] transition-colors cursor-pointer"
            title="Inspect human permission gates for sensitive actions"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Approval Gate</span>
          </button>

          <button
            onClick={() => setShowProofGraphModal(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[var(--bg-panel)] hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] text-[11px] transition-colors cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-[#10b981]" />
            <span>Evidence Graph</span>
          </button>

          <button
            onClick={() => setShowWhyModal(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[var(--bg-panel)] hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] text-[11px] transition-colors cursor-pointer"
            title="Explain autonomous choices"
          >
            <HelpCircle className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span>Why?</span>
          </button>
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
        <button
          onClick={() => setActiveTab('diff')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors cursor-pointer shrink-0 text-xs ${
            activeTab === 'diff'
              ? 'bg-[#ea580c] text-white font-bold shadow-xs'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] border border-transparent'
          }`}
        >
          <FileCode className="w-3.5 h-3.5 text-[#38bdf8]" />
          <span>Changes (+14, -2)</span>
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
          <span>Recovery (1 Retry)</span>
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

        <div className="h-3.5 w-[1px] bg-[var(--border-subtle)] mx-0.5 hidden sm:block shrink-0" />

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
          <span>Regression Detection</span>
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
          <span>Branch Experiments</span>
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
          <span>Auto Docs</span>
        </button>
      </div>

      {/* MAIN WORKSPACE CONTENT */}
      <div className="flex-1 flex overflow-hidden">
        {activeTab === 'proof' && (
          <ProofPanel
            proof={proof}
            onOpenDiff={() => setActiveTab('diff')}
            onOpenProofGraph={() => setShowProofGraphModal(true)}
            onOpenTerminalSnippet={(snippet) => setCustomTerminalLog(snippet)}
          />
        )}

        {activeTab === 'diff' && <DiffViewer onBackToRun={() => setActiveTab('proof')} />}

        {activeTab === 'recovery' && (
          <RecoveryTrace
            attempts={run.recoveryAttempts}
            onOpenDiff={() => setActiveTab('diff')}
          />
        )}

        {activeTab === 'contract' && <TaskContractPanel />}

        {activeTab === 'scope-security' && <ScopeSecurityPanel />}

        {activeTab === 'regression' && <RegressionPanel runId={run.id} />}

        {activeTab === 'checkpoints' && <CheckpointsPanel />}

        {activeTab === 'branching' && <BranchingPanel />}

        {activeTab === 'docs' && <DocsPanel />}

        {activeTab === 'timeline' && (
          <GlassBoxTimeline
            events={run.events.slice(0, currentEventIndex + 1)}
            toolCalls={run.toolCalls}
            onOpenWhyFile={(file) => {
              setWhyTargetFile(file);
              setShowWhyModal(true);
            }}
            onOpenDiff={() => setActiveTab('diff')}
            onOpenProof={() => setActiveTab('proof')}
          />
        )}
      </div>

      {/* Proof Graph Drawer Modal */}
      {showProofGraphModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            <div className="p-3 bg-[var(--bg-elevated)] border-b border-[var(--border-subtle)] flex items-center justify-between font-mono text-xs">
              <span className="font-bold text-[var(--text-primary)] uppercase">
                14. Evidence Graph (Causal Traceability)
              </span>
              <button
                onClick={() => setShowProofGraphModal(false)}
                className="px-2 py-1 rounded bg-[var(--bg-subtle)] hover:bg-[var(--bg-active)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] cursor-pointer"
              >
                Close ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <ProofGraph nodes={proof.graphNodes} edges={proof.graphEdges} />
            </div>
          </div>
        </div>
      )}

      {/* Human Approval Gate Modal */}
      <ApprovalModal
        isOpen={showApprovalModal}
        onClose={() => setShowApprovalModal(false)}
      />

      {/* Why Modal (Change Intelligence / "Why?") */}
      {showWhyModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl overflow-hidden shadow-2xl flex flex-col">
            <WhyDrawer filePath={whyTargetFile} onClose={() => setShowWhyModal(false)} />
          </div>
        </div>
      )}

      {/* Terminal Output Docked at Bottom of Unified Container */}
      <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-canvas)]">
        <TerminalDrawer customSnippet={customTerminalLog} />
      </div>
    </div>
  );
}
