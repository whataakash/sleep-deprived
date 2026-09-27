'use client';

import React, { useState } from 'react';
import { Terminal, Copy, Check, ChevronUp, ChevronDown } from 'lucide-react';

interface TerminalDrawerProps {
  customSnippet?: string;
  testOutput?: string;
  typecheckOutput?: string;
  buildOutput?: string;
  diff?: string;
}

export function TerminalDrawer({
  customSnippet,
  testOutput,
  typecheckOutput,
  buildOutput,
  diff,
}: TerminalDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'tests' | 'typecheck' | 'build' | 'diff'>('tests');
  const [copied, setCopied] = useState(false);

  const getLogContent = (): string => {
    if (customSnippet) return customSnippet;
    switch (activeTab) {
      case 'tests':
        return (
          testOutput ||
          `$ npm test\n\n[Evaluation Terminal] No test execution recorded for the active run yet.\nEnter a task in the Evaluator Console or trigger "make evaluate" to run real tests.`
        );
      case 'typecheck':
        return (
          typecheckOutput ||
          `$ npx tsc --noEmit\n\n[Evaluation Terminal] Typecheck gate is standby. Awaiting verification cycle.`
        );
      case 'build':
        return (
          buildOutput ||
          `$ npm run build\n\n[Evaluation Terminal] Production build gate is standby.`
        );
      case 'diff':
        return (
          diff ||
          `$ git diff\n\n[Evaluation Terminal] Working tree is clean. No uncommitted modifications.`
        );
    }
  };

  const currentText = getLogContent();

  const handleCopy = () => {
    navigator.clipboard.writeText(currentText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full bg-[var(--bg-canvas)] border-t border-[var(--border-subtle)] flex flex-col font-mono text-xs select-none z-10 transition-colors">
      {/* Header bar */}
      <div className="px-4 py-2 bg-[var(--bg-elevated)] flex items-center justify-between border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            <Terminal className="w-4 h-4 text-[#ea580c]" />
            <span className="font-semibold text-[var(--text-primary)]">SANDBOX TERMINAL</span>
            {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>

          {isOpen && (
            <div className="flex items-center gap-1">
              {(['tests', 'typecheck', 'build', 'diff'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-2 py-0.5 rounded text-[11px] capitalize transition-colors cursor-pointer ${
                    activeTab === tab
                      ? 'bg-[var(--bg-active)] text-[#ea580c] font-semibold border border-[var(--border-active)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          )}
        </div>

        {isOpen && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[var(--text-muted)]">Container: isolated-microvm #89</span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-[var(--bg-subtle)] hover:bg-[var(--bg-active)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer text-[10px]"
            >
              {copied ? <Check className="w-3 h-3 text-[#10b981]" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Terminal Body */}
      {isOpen && (
        <div className="h-44 overflow-y-auto p-3 bg-[var(--code-bg)] text-[var(--text-secondary)] font-mono text-xs select-text">
          <pre className="whitespace-pre">{currentText}</pre>
        </div>
      )}
    </div>
  );
}
