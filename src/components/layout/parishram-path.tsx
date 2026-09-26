'use client';

import React, { useState } from 'react';
import { AgentState } from '@/types/agent';
import { ChevronDown, ChevronUp, Check, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ParishramPathProps {
  currentState: AgentState;
  onSelectState?: (state: AgentState) => void;
  personality?: 'professional' | 'forge';
}

const STAGES: { num: string; state: AgentState; label: string; shortLabel: string }[] = [
  { num: '01', state: 'INTAKE', label: 'TASK', shortLabel: 'Task' },
  { num: '02', state: 'UNDERSTAND', label: 'UNDERSTAND', shortLabel: 'Context' },
  { num: '03', state: 'EDIT', label: 'EXECUTE', shortLabel: 'Execute' },
  { num: '04', state: 'VERIFY', label: 'VERIFY', shortLabel: 'Verify' },
  { num: '05', state: 'PROVE', label: 'PROOF', shortLabel: 'Proof' },
];

export function ParishramPath({ currentState, onSelectState }: ParishramPathProps) {
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
      {/* 1. DESKTOP VIEW (lg and up: 1024px+) */}
      <div className="hidden lg:flex items-center justify-between gap-4 max-w-5xl mx-auto">
        <div className="flex items-center gap-1.5 shrink-0 text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ea580c]" />
          <span>Parishram Path:</span>
        </div>

        <nav aria-label="Parishram Path Progress" className="flex-1 flex items-center justify-between relative">
          {STAGES.map((s, idx) => {
            const isPassed = currentIndex > idx || isComplete;
            const isCurrent = currentIndex === idx && !isComplete;
            const isLast = idx === STAGES.length - 1;

            return (
              <React.Fragment key={s.state}>
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
                  <span className={`text-[10px] px-1 py-0.2 rounded ${
                    isCurrent ? 'bg-[#ea580c]/15 text-[#ea580c] font-bold' : 'text-[var(--text-muted)]'
                  }`}>
                    {s.num}
                  </span>
                  <span className="text-[11px] tracking-tight font-semibold">{s.label}</span>

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

      {/* 2. TABLET COMPACT STEPPER (md to lg: 768px - 1023px) */}
      <div className="hidden md:flex lg:hidden items-center justify-between gap-2 max-w-3xl mx-auto">
        <div className="flex items-center gap-1 shrink-0 text-[10px] text-[var(--text-muted)] font-semibold uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ea580c]" />
          <span>Path:</span>
        </div>

        <div className="flex-1 flex items-center justify-between gap-1">
          {STAGES.map((s, idx) => {
            const isPassed = currentIndex > idx || isComplete;
            const isCurrent = currentIndex === idx && !isComplete;
            const isLast = idx === STAGES.length - 1;

            return (
              <React.Fragment key={s.state}>
                <button
                  onClick={() => onSelectState && onSelectState(s.state)}
                  className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] transition-colors cursor-pointer ${
                    isCurrent
                      ? 'bg-[#ea580c]/15 text-[#ea580c] font-bold border border-[#ea580c]/30'
                      : isPassed
                      ? 'text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
                      : 'text-[var(--text-muted)]'
                  }`}
                >
                  <span className="font-mono">{idx + 1}.</span>
                  <span className="font-semibold">{s.shortLabel}</span>
                  {isPassed && <Check className="w-2.5 h-2.5 text-[#10b981]" />}
                </button>
                {!isLast && <div className="h-[1px] w-3 bg-[var(--border-subtle)]" />}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* 3. MOBILE VIEW (< md: 390px - 767px) */}
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
              Step {currentIndex + 1} of {STAGES.length}
            </span>
          </div>

          <button
            onClick={() => setIsMobileExpanded(!isMobileExpanded)}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] cursor-pointer"
          >
            <span>{isMobileExpanded ? 'Hide' : 'All Steps'}</span>
            {isMobileExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="w-full h-1 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${
              isComplete
                ? 'bg-[#10b981]'
                : isFailureRecovery
                ? 'bg-[#ef4444]'
                : 'bg-[#ea580c]'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex + 1) / STAGES.length) * 100}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>

        {/* Collapsible Mobile Step Drawer */}
        <AnimatePresence>
          {isMobileExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-2 pt-2 border-t border-[var(--border-subtle)] grid grid-cols-1 gap-1 text-[11px] overflow-hidden"
            >
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
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded text-left transition-colors ${
                      isCurrent
                        ? 'bg-[var(--bg-elevated)] text-[#ea580c] font-bold border border-[#ea580c]/30'
                        : isPassed
                        ? 'text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]'
                        : 'text-[var(--text-muted)]'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-[10px] text-[var(--text-muted)] font-mono">{s.num}</span>
                      <span className="font-semibold">{s.label}</span>
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Export both names for backwards compatibility
export const ForgeLine = ParishramPath;
