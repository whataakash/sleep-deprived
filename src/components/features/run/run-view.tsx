'use client';

import React, { useState } from 'react';
import { Run, AgentState } from '@/types/agent';
import { ProofRecord } from '@/types/verification';
import { ProofPanel } from './proof-panel';
import { ProofGraph } from './proof-graph';
import { DiffViewer } from './diff-viewer';
import { RecoveryTrace } from './recovery-trace';
import { GlassBoxTimeline } from './glass-box-timeline';
import { TimelineScrubber } from './timeline-scrubber';
import { TerminalDrawer } from './terminal-drawer';
import { WhyDrawer } from './why-drawer';
import {
  ShieldCheck,
  CheckCircle2,
  FileCode,
  Layers,
  Flame,
  Terminal,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  ExternalLink,
  RotateCcw,
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

export function RunView({
  run,
  currentEventIndex,
  onScrub,
  isPlayingReplay,
  onTogglePlay,
  proof,
  onOpenWhyFile,
}: RunViewProps) {
  const [activeTab, setActiveTab] = useState<'proof' | 'diff' | 'recovery' | 'timeline'>('proof');
  const [showProofGraphModal, setShowProofGraphModal] = useState(false);
  const [showWhyModal, setShowWhyModal] = useState(false);
  const [whyTargetFile, setWhyTargetFile] = useState('src/auth/client.ts');
  const [customTerminalLog, setCustomTerminalLog] = useState<string | undefined>(undefined);

  const currentEvent = run.events[currentEventIndex] || run.events[run.events.length - 1];
  const currentState: AgentState = currentEvent ? currentEvent.state : 'COMPLETE';
  const isVerified = currentEventIndex >= run.events.length - 2;

  return (
    <div className="flex-1 flex flex-col overflow-hidden gap-3 font-sans">
      {/* LEVEL 1: WHAT IS HAPPENING? */}
      <div className="p-3 bg-[#101318] border border-[#202731] rounded-lg flex flex-wrap items-center justify-between gap-3 font-mono text-xs select-none">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-white text-sm">Run #{run.runNumber}</span>
            <span className="text-[var(--text-muted)]">·</span>
            <span className="text-[var(--text-primary)] font-medium truncate max-w-md">
              {run.taskTitle}
            </span>
          </div>

          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              isVerified
                ? 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30'
                : 'bg-[#ea580c]/20 text-[#f97316] border border-[#ea580c]/30'
            }`}
          >
            ● {isVerified ? 'VERIFIED' : currentState}
          </span>
        </div>

        {/* View toggles */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('proof')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors cursor-pointer ${
              activeTab === 'proof'
                ? 'bg-[#ea580c] text-white font-bold'
                : 'bg-[#151920] text-[var(--text-secondary)] hover:bg-[#1d232c]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Proof of Work</span>
          </button>

          <button
            onClick={() => setActiveTab('diff')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors cursor-pointer ${
              activeTab === 'diff'
                ? 'bg-[#ea580c] text-white font-bold'
                : 'bg-[#151920] text-[var(--text-secondary)] hover:bg-[#1d232c]'
            }`}
          >
            <FileCode className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span>Changes (+14, -2)</span>
          </button>

          <button
            onClick={() => setActiveTab('recovery')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors cursor-pointer ${
              activeTab === 'recovery'
                ? 'bg-[#ea580c] text-white font-bold'
                : 'bg-[#151920] text-[var(--text-secondary)] hover:bg-[#1d232c]'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-[#ea580c]" />
            <span>Recovery Trace (1 Retry)</span>
          </button>

          <button
            onClick={() => setActiveTab('timeline')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors cursor-pointer ${
              activeTab === 'timeline'
                ? 'bg-[#ea580c] text-white font-bold'
                : 'bg-[#151920] text-[var(--text-secondary)] hover:bg-[#1d232c]'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Glass Box Stream</span>
          </button>

          <button
            onClick={() => setShowProofGraphModal(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#151920] hover:bg-[#1d232c] text-[var(--text-secondary)] hover:text-white border border-[#232a33] text-[11px] transition-colors cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-[#10b981]" />
            <span>Proof Graph</span>
          </button>

          <button
            onClick={() => setShowWhyModal(true)}
            className="flex items-center gap-1 px-2 py-1 rounded bg-[#151920] hover:bg-[#1d232c] text-[var(--text-secondary)] hover:text-white border border-[#232a33] text-[11px] transition-colors cursor-pointer"
            title="Explain autonomous choices"
          >
            <HelpCircle className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span>Why?</span>
          </button>
        </div>
      </div>

      {/* LEVEL 2 & 3: MAIN WORKSPACE CONTENT */}
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-[#0e1115] border border-[#252e38] rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            <div className="p-3 bg-[#13171d] border-b border-[#232a32] flex items-center justify-between font-mono text-xs">
              <span className="font-bold text-white uppercase">Causal Proof Graph</span>
              <button
                onClick={() => setShowProofGraphModal(false)}
                className="px-2 py-1 rounded bg-[#181d24] text-[var(--text-muted)] hover:text-white cursor-pointer"
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

      {/* Why Modal */}
      {showWhyModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-[#0e1115] border border-[#252e38] rounded-xl overflow-hidden shadow-2xl flex flex-col">
            <WhyDrawer filePath={whyTargetFile} onClose={() => setShowWhyModal(false)} />
          </div>
        </div>
      )}

      {/* LEVEL 3 EXPANDABLE: Replay Scrubber */}
      <TimelineScrubber
        events={run.events}
        currentEventIndex={currentEventIndex}
        onScrub={onScrub}
        isPlaying={isPlayingReplay}
        onTogglePlay={onTogglePlay}
      />

      {/* Terminal Output */}
      <TerminalDrawer customSnippet={customTerminalLog} />
    </div>
  );
}
