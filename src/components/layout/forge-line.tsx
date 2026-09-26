'use client';

import React, { useState } from 'react';
import { AgentState } from '@/types/agent';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

interface ForgeLineProps {
  currentState: AgentState;
  onSelectState?: (state: AgentState) => void;
  personality?: 'professional' | 'forge';
}

const STAGES: { num: string; state: AgentState; label: string }[] = [
  { num: '01', state: 'INTAKE', label: 'Task' },
  { num: '02', state: 'UNDERSTAND', label: 'Understand' },
  { num: '03', state: 'EDIT', label: 'Execute' },
  { num: '04', state: 'VERIFY', label: 'Verify' },
  { num: '05', state: 'PROVE', label: 'Proof' },
];

export function ForgeLine({ currentState, onSelectState }: ForgeLineProps) {
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);

  const getStageIndex = (st: AgentState) => {
    switch (st) {
      case 'INTAKE':
        return 0;
      case 'UNDERSTAND':
      case 'PLAN':
      case 'SEARCH':
        return 1;
      case 'EDIT':
      case 'RUN':
      case 'DIAGNOSE':
      case 'RECOVER':
        return 2;
      case 'VERIFY':
        return 3;
      case 'PROVE':
      case 'COMPLETE':
        return 4;
      default:
        return 0;
    }
  };

  const currentIndex = getStageIndex(currentState);
  const isComplete = currentState === 'COMPLETE' || currentState === 'PROVE';
  const isFailureRecovery = currentState === 'DIAGNOSE' || currentState === 'RECOVER';
  const currentStage = STAGES[currentIndex] || STAGES[0];

  return (
    <div className="w-full bg-[var(--bg-canvas)] border-b border-[var(--border-subtle)] px-3 sm:px-6 py-2 select-none font-mono text-xs z-10 transition-colors">
      {/* DESKTOP / TABLET VIEW (md and up) */}
      <div className="hidden md:flex items-center justify-between gap-4 max-w-5xl mx-auto">
        <div className="flex items-center gap-1.5 shrink-0 text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ea580c]" />
          <span>Stage:</span>
        </div>

        <nav aria-label="Progress" className="flex-1 flex items-center justify-between relative">
          {STAGES.map((s, idx) => {
            const isPassed = currentIndex > idx || isComplete;
            const isCurrent = currentIndex === idx && !isComplete;
            const isLast = idx === STAGES.length - 1;

            return (
              <React.Fragment key={s.state}>
                {/* Step Item */}
                <button
                  onClick={() => onSelectState && onSelectState(s.state)}
                  className={`flex items-center gap-2 group cursor-pointer transition-colors focus:outline-none ${
                    isCurrent
                      ? 'text-[#ea580c] font-bold'
                      : isPassed
                      ? 'text-[var(--text-primary)] hover:text-[#ea580c]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                  }`}
                  title={`Stage ${s.num}: ${s.label}`}
                >
                  <span className={`text-[10px] ${isCurrent ? 'text-[#ea580c]' : 'text-[var(--text-muted)]'}`}>
                    {s.num}
                  </span>
                  <span className="text-[11px] tracking-tight">{s.label}</span>

                  <span className="text-xs">
                    {isPassed ? (
                      <span className="text-[#10b981] font-bold">✓</span>
                    ) : isCurrent ? (
                      isFailureRecovery && idx === 2 ? (
                        <span className="text-[#ef4444] animate-pulse">●</span>
                      ) : (
                        <span className="text-[#ea580c]">●</span>
                      )
                    ) : (
                      <span className="text-[var(--border-active)]">○</span>
                    )}
                  </span>
                </button>

                {/* Thin Connector Line */}
                {!isLast && (
                  <div
                    className={`flex-1 h-[1px] mx-3 transition-colors duration-200 ${
                      currentIndex > idx || isComplete
                        ? 'bg-[#10b981]/50'
                        : isCurrent
                        ? 'bg-[#ea580c]/50'
                        : 'bg-[var(--border-subtle)]'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </nav>
      </div>

      {/* MOBILE COMPACT VIEW (< md / 390px - 767px) */}
      <div className="md:hidden flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isComplete
                  ? 'bg-[#10b981]'
                  : isFailureRecovery
                  ? 'bg-[#ef4444] animate-pulse'
                  : 'bg-[#ea580c]'
              }`}
            />
            <span className="font-bold text-[12px] uppercase tracking-wide text-[var(--text-primary)]">
              {currentStage.label}
            </span>
            <span className="text-[10px] text-[var(--text-muted)]">
              (Step {currentIndex + 1} of {STAGES.length})
            </span>
          </div>

          <button
            onClick={() => setIsMobileExpanded(!isMobileExpanded)}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] text-[var(--text-muted)] hover:text-white bg-[var(--bg-elevated)] border border-[var(--border-subtle)]"
          >
            <span>{isMobileExpanded ? 'Hide' : 'All Steps'}</span>
            {isMobileExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* Compact Progress Bar Track */}
        <div className="w-full h-1 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              isComplete
                ? 'bg-[#10b981]'
                : isFailureRecovery
                ? 'bg-[#ef4444]'
                : 'bg-[#ea580c]'
            }`}
            style={{ width: `${((currentIndex + 1) / STAGES.length) * 100}%` }}
          />
        </div>

        {/* Collapsible Step List for Mobile */}
        {isMobileExpanded && (
          <div className="mt-2 pt-2 border-t border-[var(--border-subtle)] grid grid-cols-1 gap-1 text-[11px]">
            {STAGES.map((s, idx) => {
              const isPassed = currentIndex > idx || isComplete;
              const isCurrent = currentIndex === idx && !isComplete;

              return (
                <button
                  key={s.state}
                  onClick={() => {
                    if (onSelectState) onSelectState(s.state);
                    setIsMobileExpanded(false);
                  }}
                  className={`flex items-center justify-between px-2 py-1 rounded text-left ${
                    isCurrent
                      ? 'bg-[var(--bg-elevated)] text-[#ea580c] font-bold border border-[#ea580c]/30'
                      : isPassed
                      ? 'text-[var(--text-primary)]'
                      : 'text-[var(--text-muted)]'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-[10px] text-[var(--text-muted)]">{s.num}</span>
                    <span>{s.label}</span>
                  </span>
                  <span>
                    {isPassed ? (
                      <span className="text-[#10b981] font-bold">✓</span>
                    ) : isCurrent ? (
                      <span className="text-[#ea580c]">●</span>
                    ) : (
                      <span className="text-[var(--border-active)]">○</span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
