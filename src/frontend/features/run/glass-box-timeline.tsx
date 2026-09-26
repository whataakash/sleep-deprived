'use client';

import React, { useState } from 'react';
import { RunEvent, ToolCall } from '@/types/agent';
import {
  Terminal,
  Clock,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  Flame,
  FileCode,
  CheckCircle2,
  Cpu,
  Search,
  Wrench,
} from 'lucide-react';

interface GlassBoxTimelineProps {
  events: RunEvent[];
  toolCalls: ToolCall[];
  onOpenWhyFile?: (file: string) => void;
  onOpenDiff?: () => void;
  onOpenProof?: () => void;
}

export function GlassBoxTimeline({
  events,
  toolCalls,
  onOpenWhyFile,
  onOpenDiff,
  onOpenProof,
}: GlassBoxTimelineProps) {
  const [filter, setFilter] = useState<'all' | 'tools' | 'tests' | 'recovery'>('all');
  const [expandedEvents, setExpandedEvents] = useState<Record<string, boolean>>({});

  const toggleEvent = (id: string) => {
    setExpandedEvents((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredEvents = events.filter((e) => {
    if (filter === 'tools') return e.type.startsWith('tool') || e.type.startsWith('file');
    if (filter === 'tests') return e.type.includes('test') || e.type.includes('verification');
    if (filter === 'recovery') return e.type.includes('failure') || e.type.includes('recovery');
    return true;
  });

  return (
    <div className="flex-1 flex flex-col bg-[var(--bg-panel)] overflow-hidden transition-colors">
      {/* Header bar with filters */}
      <div className="p-3 bg-[var(--bg-elevated)] border-b border-[var(--border-subtle)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[#ea580c]" />
          <span className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider font-mono">
            Glass Box Execution Timeline
          </span>
          <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-[var(--bg-subtle)] text-[var(--text-muted)] border border-[var(--border-subtle)]">
            Observable Actions Only
          </span>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1 text-xs font-mono">
          {(['all', 'tools', 'tests', 'recovery'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2 py-1 rounded capitalize transition-colors cursor-pointer ${
                filter === f
                  ? 'bg-[#ea580c] text-white font-semibold'
                  : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-active)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Events list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs">
        {filteredEvents.map((evt) => {
          const isExpanded = !!expandedEvents[evt.id];
          const isFailure = evt.type.includes('failure');
          const isRecovery = evt.type.includes('recovery');
          const isProof = evt.type.includes('proof') || evt.type.includes('verification.passed');
          const isTool = evt.type.includes('tool') || evt.type.includes('file');

          return (
            <div
              key={evt.id}
              className={`p-3 rounded-lg border transition-all ${
                isProof
                  ? 'bg-[#10b981]/10 border-[#10b981]/30 hover:border-[#10b981]/50'
                  : isFailure
                  ? 'bg-[#ef4444]/10 border-[#ef4444]/30 hover:border-[#ef4444]/50'
                  : isRecovery
                  ? 'bg-[#ea580c]/10 border-[#ea580c]/30 hover:border-[#ea580c]/50'
                  : 'bg-[var(--bg-canvas)] border-[var(--border-subtle)] hover:border-[var(--border-medium)]'
              }`}
            >
              <div
                className="flex items-start justify-between cursor-pointer select-none"
                onClick={() => toggleEvent(evt.id)}
              >
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5">
                    {isProof ? (
                      <ShieldCheck className="w-4 h-4 text-[#10b981]" />
                    ) : isFailure ? (
                      <AlertTriangle className="w-4 h-4 text-[#ef4444]" />
                    ) : isRecovery ? (
                      <Flame className="w-4 h-4 text-[#f97316]" />
                    ) : isTool ? (
                      <Wrench className="w-4 h-4 text-[#38bdf8]" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-[var(--text-muted)]" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] text-[var(--text-muted)] font-mono">
                        {evt.timestamp}
                      </span>
                      <span
                        className={`font-semibold tracking-wide text-xs ${
                          isProof
                            ? 'text-[#10b981]'
                            : isFailure
                            ? 'text-[#ef4444]'
                            : isRecovery
                            ? 'text-[#f97316]'
                            : 'text-[var(--text-primary)]'
                        }`}
                      >
                        {evt.title}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                        STATE: {evt.state}
                      </span>
                    </div>

                    <p className="text-[var(--text-secondary)] font-sans text-xs leading-relaxed">
                      {evt.summary}
                    </p>
                  </div>
                </div>

                <div className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1">
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </div>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="mt-3 pt-2.5 border-t border-[var(--border-subtle)] text-[11px] space-y-2">
                  {evt.title.includes('RELEVANT FILES') && (
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--text-muted)]">Target AST:</span>
                      <button
                        onClick={() => onOpenWhyFile && onOpenWhyFile('src/auth/client.ts')}
                        className="text-[#38bdf8] underline hover:text-[#7dd3fc] cursor-pointer"
                      >
                        src/auth/client.ts (Explain Why)
                      </button>
                    </div>
                  )}

                  {evt.title.includes('CODE PATCH') && (
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--text-muted)]">Artifact Diff:</span>
                      <button
                        onClick={onOpenDiff}
                        className="text-[#10b981] underline hover:text-[#34d399] cursor-pointer"
                      >
                        View Side-by-Side Diff (+14, -2)
                      </button>
                    </div>
                  )}

                  {isProof && (
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--text-muted)]">Proof Stamp:</span>
                      <button
                        onClick={onOpenProof}
                        className="text-[#10b981] font-semibold underline hover:text-[#34d399] cursor-pointer"
                      >
                        Open Verified Proof Certificate
                      </button>
                    </div>
                  )}

                  <div className="p-2 rounded bg-[var(--code-bg)] border border-[var(--border-subtle)] text-[var(--text-secondary)] text-[10px]">
                    <code>{JSON.stringify({ eventId: evt.id, state: evt.state, temperature: evt.temperature }, null, 2)}</code>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
