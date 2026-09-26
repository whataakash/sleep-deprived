'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  ShieldCheck,
  FileCode,
  FolderGit2,
  Cpu,
  BarChart3,
  X,
  Play,
} from 'lucide-react';
import { MainNavView } from '@/components/layout/sidebar';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectView: (view: MainNavView) => void;
  onRunDemo: () => void;
  onSelectModel: (modelId: string) => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  onSelectView,
  onRunDemo,
  onSelectModel,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const COMMANDS = [
    {
      id: 'run-demo',
      title: 'Run End-to-End Demo (Auth Bug Recovery)',
      category: 'Actions',
      icon: <Play className="w-4 h-4 text-[#ea580c]" />,
      action: () => {
        onRunDemo();
        onClose();
      },
    },
    {
      id: 'view-proof',
      title: 'Open Proof Panel & Verification Stamp',
      category: 'Navigation',
      icon: <ShieldCheck className="w-4 h-4 text-[#10b981]" />,
      action: () => {
        onSelectView('runs');
        onClose();
      },
    },
    {
      id: 'view-diff',
      title: 'Inspect Applied Diff (+14, -2 lines in client.ts)',
      category: 'Navigation',
      icon: <FileCode className="w-4 h-4 text-[#38bdf8]" />,
      action: () => {
        onSelectView('runs');
        onClose();
      },
    },
    {
      id: 'view-overview',
      title: 'Go to Overview & Task Intake',
      category: 'Navigation',
      icon: <FolderGit2 className="w-4 h-4 text-[#ea580c]" />,
      action: () => {
        onSelectView('overview');
        onClose();
      },
    },
    {
      id: 'switch-qwen3',
      title: 'Select Model: Qwen3-Coder-Next (Agentic)',
      category: 'Models',
      icon: <Cpu className="w-4 h-4 text-[#a78bfa]" />,
      action: () => {
        onSelectModel('qwen3-coder-next');
        onClose();
      },
    },
    {
      id: 'switch-kimi',
      title: 'Select Model: Kimi K2.5 Multimodal (256k)',
      category: 'Models',
      icon: <Cpu className="w-4 h-4 text-[#38bdf8]" />,
      action: () => {
        onSelectModel('kimi-k2-5-agent');
        onClose();
      },
    },
    {
      id: 'switch-glm5',
      title: 'Select Model: GLM-5 MoE',
      category: 'Models',
      icon: <Cpu className="w-4 h-4 text-[#fbbf24]" />,
      action: () => {
        onSelectModel('glm-5-moe');
        onClose();
      },
    },
    {
      id: 'view-eval',
      title: 'Open Official Hackathon Evaluation Benchmark',
      category: 'Navigation',
      icon: <BarChart3 className="w-4 h-4 text-[#10b981]" />,
      action: () => {
        onSelectView('evaluations');
        onClose();
      },
    },
  ];

  const filtered = COMMANDS.filter((c) =>
    c.title.toLowerCase().includes(query.toLowerCase()) ||
    c.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-start justify-center pt-20 p-4 transition-colors">
      <div className="w-full max-w-xl bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl shadow-2xl overflow-hidden font-mono text-xs">
        {/* Search header */}
        <div className="p-3 border-b border-[var(--border-subtle)] flex items-center gap-2.5">
          <Search className="w-4 h-4 text-[#ea580c]" />
          <input
            type="text"
            placeholder="Type a command or search actions..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="flex-1 bg-transparent text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none text-sm"
          />
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[var(--bg-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-[var(--text-muted)]">
              No commands found matching &ldquo;{query}&rdquo;
            </div>
          ) : (
            filtered.map((cmd) => (
              <button
                key={cmd.id}
                onClick={cmd.action}
                className="w-full p-2.5 rounded flex items-center justify-between hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer text-left group"
              >
                <div className="flex items-center gap-2.5">
                  {cmd.icon}
                  <span className="text-[var(--text-primary)] font-medium">
                    {cmd.title}
                  </span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-muted)]">
                  {cmd.category}
                </span>
              </button>
            ))
          )}
        </div>

        <div className="p-2.5 bg-[var(--bg-elevated)] border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
          <span>Navigate with arrows</span>
          <span>Press ESC to close</span>
        </div>
      </div>
    </div>
  );
}
