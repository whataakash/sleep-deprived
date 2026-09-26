'use client';

import React, { useState } from 'react';
import { FileCode, ShieldCheck, Copy, ArrowLeft } from 'lucide-react';

interface DiffViewerProps {
  onBackToRun?: () => void;
}

const DIFF_LINES = [
  { type: 'context', oldNo: 20, newNo: 20, content: '  public getSession(): AuthSession | null {' },
  { type: 'context', oldNo: 21, newNo: 21, content: '    return this.currentSession;' },
  { type: 'context', oldNo: 22, newNo: 22, content: '  }' },
  { type: 'context', oldNo: 23, newNo: 23, content: '' },
  { type: 'context', oldNo: 24, newNo: 24, content: '  public async fetchWithAuth<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {' },
  { type: 'delete', oldNo: 25, newNo: null, content: '-   const headers = options.headers || {};' },
  { type: 'add', oldNo: null, newNo: 25, content: '+   const headers = new Headers(options.headers || {});' },
  { type: 'add', oldNo: null, newNo: 26, content: '+   ' },
  { type: 'add', oldNo: null, newNo: 27, content: '+   // FIX APPLIED BY PARISHRAM:' },
  { type: 'add', oldNo: null, newNo: 28, content: '+   if (this.currentSession && this.currentSession.token) {' },
  { type: 'add', oldNo: null, newNo: 29, content: '+     headers.set(\'Authorization\', `Bearer ${this.currentSession.token}`);' },
  { type: 'add', oldNo: null, newNo: 30, content: '+     headers.set(\'X-Session-ID\', this.currentSession.id);' },
  { type: 'add', oldNo: null, newNo: 31, content: '+   }' },
  { type: 'context', oldNo: 26, newNo: 32, content: '' },
  { type: 'context', oldNo: 27, newNo: 33, content: '    const response = await fetch(`${this.baseUrl}${endpoint}`, {' },
  { type: 'context', oldNo: 28, newNo: 34, content: '      ...options,' },
  { type: 'context', oldNo: 29, newNo: 35, content: '      headers,' },
  { type: 'context', oldNo: 30, newNo: 36, content: '    });' },
];

export function DiffViewer({ onBackToRun }: DiffViewerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(DIFF_LINES.map((l) => l.content).join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col bg-[var(--bg-panel)] overflow-hidden transition-colors">
      {/* File Header */}
      <div className="p-3 bg-[var(--bg-elevated)] border-b border-[var(--border-subtle)] flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBackToRun && (
            <button
              onClick={onBackToRun}
              className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-[#38bdf8]" />
            <span className="font-mono text-xs font-semibold text-[var(--text-primary)]">
              src/auth/client.ts
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#10b981]/20 text-[#10b981] font-bold">
              +14 / -2
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#10b981]/10 border border-[#10b981]/30 text-[#10b981] text-xs font-mono">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Verified by: tests/integration/auth.test.ts:42</span>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[var(--bg-subtle)] hover:bg-[var(--bg-active)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer font-mono"
          >
            <Copy className="w-3 h-3" />
            <span>{copied ? 'Copied!' : 'Copy Diff'}</span>
          </button>
        </div>
      </div>

      {/* Rationale Callout */}
      <div className="p-3 bg-[var(--bg-canvas)] border-b border-[var(--border-subtle)] text-xs font-mono flex items-center gap-2">
        <span className="text-[var(--text-muted)] font-bold">ENGINEERING REASON:</span>
        <span className="text-[var(--text-secondary)]">
          Inject Authorization Bearer header using active session token before dispatching HTTP request to internal services.
        </span>
      </div>

      {/* Diff Table */}
      <div className="flex-1 overflow-y-auto p-2 font-mono text-xs select-text">
        <table className="w-full border-collapse">
          <tbody>
            {DIFF_LINES.map((line, idx) => {
              const isAdd = line.type === 'add';
              const isDel = line.type === 'delete';

              return (
                <tr
                  key={idx}
                  className={`${
                    isAdd
                      ? 'bg-[#10b981]/15 text-[#10b981] font-medium'
                      : isDel
                      ? 'bg-[#ef4444]/15 text-[#ef4444] font-medium'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]'
                  }`}
                >
                  <td className="w-10 px-2 py-0.5 text-right text-[var(--text-muted)] border-r border-[var(--border-subtle)] select-none text-[11px]">
                    {line.oldNo || ''}
                  </td>
                  <td className="w-10 px-2 py-0.5 text-right text-[var(--text-muted)] border-r border-[var(--border-subtle)] select-none text-[11px]">
                    {line.newNo || ''}
                  </td>
                  <td className="w-6 px-1 text-center font-bold select-none text-[11px]">
                    {isAdd ? '+' : isDel ? '-' : ' '}
                  </td>
                  <td className="px-3 py-0.5 whitespace-pre font-mono">{line.content}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
