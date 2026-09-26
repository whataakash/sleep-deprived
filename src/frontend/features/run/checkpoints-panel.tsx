'use client';

import React, { useState } from 'react';
import { CheckpointManager } from '@/lib/agent/checkpoints';
import { Checkpoint } from '@/types/harness';
import {
  History,
  RotateCcw,
  CheckCircle2,
  FileCode,
  GitCommit,
  Check,
  Plus,
} from 'lucide-react';

export function CheckpointsPanel() {
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>(CheckpointManager.getCheckpoints());
  const [activeCheckpointId, setActiveCheckpointId] = useState<string>('chk-04');
  const [rollbackSuccessMsg, setRollbackSuccessMsg] = useState<string | null>(null);

  const handleRollback = (checkpointId: string) => {
    const res = CheckpointManager.rollbackToCheckpoint(checkpointId);
    if (res.success) {
      setActiveCheckpointId(checkpointId);
      setRollbackSuccessMsg(res.message);
      setTimeout(() => setRollbackSuccessMsg(null), 4000);
    }
  };

  const handleCreateNewCheckpoint = () => {
    const cp = CheckpointManager.createCheckpoint(
      `Manual Snapshot #${checkpoints.length + 1}`,
      'User-initiated state checkpoint before additional experimental mutations'
    );
    setCheckpoints(CheckpointManager.getCheckpoints());
    setActiveCheckpointId(cp.id);
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-4 space-y-4 font-mono text-xs select-none">
      {/* Header */}
      <div className="p-3.5 rounded-xl bg-[var(--bg-panel)] border border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#38bdf8]/15 border border-[#38bdf8]/30 flex items-center justify-center text-[#38bdf8]">
            <History className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-[var(--text-primary)]">8. Checkpoints & Rollback Engine</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#38bdf8]/15 text-[#38bdf8] font-bold">
                {checkpoints.length} RESTORE POINTS
              </span>
            </div>
            <div className="text-[11px] text-[var(--text-muted)] font-sans mt-0.5">
              Automatically captures filesystem snapshots before major mutations, enabling instant zero-loss rollbacks.
            </div>
          </div>
        </div>

        <button
          onClick={handleCreateNewCheckpoint}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-semibold transition-colors cursor-pointer text-xs"
        >
          <Plus className="w-3.5 h-3.5 text-[#38bdf8]" />
          <span>Create Checkpoint</span>
        </button>
      </div>

      {rollbackSuccessMsg && (
        <div className="p-3 rounded-lg bg-[#10b981]/15 border border-[#10b981]/30 text-[#10b981] flex items-center gap-2 text-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{rollbackSuccessMsg}</span>
        </div>
      )}

      {/* Checkpoints Timeline Stream */}
      <div className="space-y-2.5">
        {checkpoints.map((cp) => {
          const isCurrent = cp.id === activeCheckpointId;

          return (
            <div
              key={cp.id}
              className={`p-3.5 rounded-xl border transition-all space-y-2.5 ${
                isCurrent
                  ? 'border-[#38bdf8] bg-[var(--bg-panel)] shadow-xs'
                  : 'border-[var(--border-subtle)] bg-[var(--bg-panel)] hover:border-[var(--border-medium)]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GitCommit className="w-4 h-4 text-[#38bdf8]" />
                  <span className="font-bold text-sm text-[var(--text-primary)]">{cp.name}</span>
                  <code className="text-[10px] px-1.5 py-0.2 rounded bg-[var(--bg-canvas)] text-[var(--text-muted)] font-mono">
                    {cp.gitCommitSha}
                  </code>
                  {isCurrent && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#38bdf8]/15 text-[#38bdf8] font-bold">
                      ACTIVE WORKING TREE
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[var(--text-muted)]">{cp.timestamp}</span>
                  {!isCurrent && (
                    <button
                      onClick={() => handleRollback(cp.id)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[var(--bg-canvas)] hover:bg-[#ea580c] hover:text-white border border-[var(--border-subtle)] text-[var(--text-secondary)] transition-colors cursor-pointer text-xs"
                      title="Rollback working tree to this checkpoint state"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Rollback</span>
                    </button>
                  )}
                </div>
              </div>

              <p className="text-[11px] text-[var(--text-secondary)] font-sans leading-relaxed">
                {cp.description}
              </p>

              {/* Files in snapshot */}
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[var(--border-subtle)] text-[11px]">
                <span className="text-[var(--text-muted)]">Snapshot Files:</span>
                {cp.filesSnapshot.map((f) => (
                  <span
                    key={f.path}
                    className="p-1 px-1.5 rounded bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--text-primary)]"
                  >
                    {f.path} ({f.linesChanged > 0 ? `+${f.linesChanged}` : 'clean'})
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
