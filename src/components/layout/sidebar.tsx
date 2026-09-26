'use client';

import React from 'react';
import {
  Terminal,
  FolderGit2,
  Cpu,
  BarChart3,
  Layers,
  Settings,
  Download,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { EvaluationModelAdapter } from '@/lib/models/evaluation-adapter';

export type MainNavView = 'overview' | 'runs' | 'repositories' | 'models' | 'evaluations';

interface SidebarProps {
  activeView: MainNavView;
  onSelectView: (view: MainNavView) => void;
  onOpenAccount: () => void;
  onOpenDownload?: () => void;
  runStatus?: 'VERIFIED' | 'RUNNING' | 'IDLE';
}

export function Sidebar({
  activeView,
  onSelectView,
  onOpenAccount,
  onOpenDownload,
  runStatus = 'VERIFIED',
}: SidebarProps) {
  const { session } = useAuth();
  const user = session.user;
  const isEvalMode = EvaluationModelAdapter.isEvaluationMode();

  return (
    <aside className="w-60 bg-[var(--bg-canvas)] border-r border-[var(--border-subtle)] flex flex-col justify-between select-none z-10 shrink-0 font-mono text-xs transition-colors">
      <div className="p-3 space-y-4">
        {/* Workspace section */}
        <div className="space-y-1">
          <div className="px-2 py-1 text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">
            Workspace
          </div>

          <button
            onClick={() => onSelectView('overview')}
            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded transition-colors cursor-pointer ${
              activeView === 'overview'
                ? 'bg-[var(--bg-active)] text-white font-semibold border border-[var(--border-active)]'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-[#ea580c]" />
            <span>Overview</span>
          </button>

          <button
            onClick={() => onSelectView('runs')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded transition-colors cursor-pointer ${
              activeView === 'runs'
                ? 'bg-[var(--bg-active)] text-white font-semibold border border-[var(--border-active)]'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Terminal className="w-3.5 h-3.5 text-[#38bdf8]" />
              <span>Runs</span>
            </div>
            <span
              className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                runStatus === 'VERIFIED'
                  ? 'bg-[#10b981]/20 text-[#10b981]'
                  : 'bg-[#ea580c]/20 text-[#f97316]'
              }`}
            >
              {runStatus}
            </span>
          </button>

          <button
            onClick={() => onSelectView('repositories')}
            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded transition-colors cursor-pointer ${
              activeView === 'repositories'
                ? 'bg-[var(--bg-active)] text-white font-semibold border border-[var(--border-active)]'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-white'
            }`}
          >
            <FolderGit2 className="w-3.5 h-3.5 text-[#fbbf24]" />
            <span>Repositories</span>
          </button>
        </div>

        {/* Intelligence section */}
        <div className="space-y-1 pt-2 border-t border-[var(--border-subtle)]">
          <div className="px-2 py-1 text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">
            Intelligence
          </div>

          <button
            onClick={() => onSelectView('models')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded transition-colors cursor-pointer ${
              activeView === 'models'
                ? 'bg-[var(--bg-active)] text-white font-semibold border border-[var(--border-active)]'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Cpu className="w-3.5 h-3.5 text-[#a78bfa]" />
              <span>Models & Router</span>
            </div>
            {isEvalMode && (
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#ea580c]/15 text-[#ea580c] font-bold">
                LOCKED
              </span>
            )}
          </button>

          <button
            onClick={() => onSelectView('evaluations')}
            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded transition-colors cursor-pointer ${
              activeView === 'evaluations'
                ? 'bg-[var(--bg-active)] text-white font-semibold border border-[var(--border-active)]'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-[#10b981]" />
            <span>Evaluations</span>
          </button>
        </div>

        {/* Local Engine / Desktop Shell */}
        <div className="space-y-1 pt-2 border-t border-[var(--border-subtle)]">
          <div className="px-2 py-1 text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">
            Local Runtime
          </div>

          <button
            onClick={() => onOpenDownload && onOpenDownload()}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded transition-colors cursor-pointer text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-white group"
            title="Download परिश्रम desktop runtime (macOS, Linux, Windows)"
          >
            <div className="flex items-center gap-2.5">
              <Download className="w-3.5 h-3.5 text-[#38bdf8] group-hover:scale-110 transition-transform" />
              <span>Download परिश्रम</span>
            </div>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#38bdf8]/10 text-[#38bdf8] font-bold">
              Tauri
            </span>
          </button>
        </div>
      </div>

      {/* Bottom Account Card */}
      <div className="p-3 border-t border-[var(--border-subtle)] bg-[var(--bg-canvas)]">
        <button
          onClick={onOpenAccount}
          className="w-full p-2 rounded bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-between text-left transition-colors cursor-pointer group"
          title="Account settings, BYOK keys & IDE preferences"
        >
          <div className="flex items-center gap-2.5 truncate">
            <div className="w-7 h-7 rounded-full bg-[#ea580c] flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs">
              {user?.name ? user.name[0] : 'S'}
            </div>
            <div className="truncate">
              <div className="font-semibold text-[var(--text-primary)] truncate text-[11px]">
                {user?.name || 'Evaluator Session'}
              </div>
              <div className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
                <span className="text-[#f97316] font-bold">{user?.plan || 'BUILDER'}</span>
                <span>·</span>
                <span>{user?.usage.runsUsedThisMonth || 14} runs</span>
              </div>
            </div>
          </div>

          <Settings className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] shrink-0" />
        </button>
      </div>
    </aside>
  );
}
