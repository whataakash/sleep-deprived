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
  Activity,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { EvaluationModelAdapter } from '@/lib/models/evaluation-adapter';

import { getPlanDisplay } from '@/lib/billing/plans';

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
  const planInfo = getPlanDisplay(user?.plan || 'BUILDER');

  return (
    <aside className="w-64 sm:w-[264px] bg-[var(--bg-canvas)] border-r border-[var(--border-subtle)] flex flex-col justify-between select-none z-10 shrink-0 font-mono text-xs transition-colors">
      <div className="p-3.5 space-y-4">
        {/* Workspace section */}
        <div className="space-y-1">
          <div className="px-2.5 py-1 text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">
            Workspace
          </div>

          <button
            onClick={() => onSelectView('overview')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
              activeView === 'overview'
                ? 'bg-[var(--bg-active)] text-[var(--text-primary)] font-semibold border border-[var(--border-active)] shadow-xs'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Activity className="w-4 h-4 text-[#ea580c]" />
            <span className="text-[12px]">Mission Control</span>
          </button>

          <button
            onClick={() => onSelectView('runs')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors cursor-pointer ${
              activeView === 'runs'
                ? 'bg-[var(--bg-active)] text-[var(--text-primary)] font-semibold border border-[var(--border-active)] shadow-xs'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Terminal className="w-4 h-4 text-[#38bdf8]" />
              <span className="text-[12px]">Runs</span>
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
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
              activeView === 'repositories'
                ? 'bg-[var(--bg-active)] text-[var(--text-primary)] font-semibold border border-[var(--border-active)] shadow-xs'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]'
            }`}
          >
            <FolderGit2 className="w-4 h-4 text-[#fbbf24]" />
            <span className="text-[12px]">Repositories</span>
          </button>
        </div>

        {/* Intelligence section */}
        <div className="space-y-1 pt-2.5 border-t border-[var(--border-subtle)]">
          <div className="px-2.5 py-1 text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">
            Intelligence
          </div>

          <button
            onClick={() => onSelectView('models')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors cursor-pointer ${
              activeView === 'models'
                ? 'bg-[var(--bg-active)] text-[var(--text-primary)] font-semibold border border-[var(--border-active)] shadow-xs'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Cpu className="w-4 h-4 text-[#a78bfa]" />
              <span className="text-[12px]">Models & Arena</span>
            </div>
            {isEvalMode && (
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#ea580c]/15 text-[#ea580c] font-bold">
                LOCKED
              </span>
            )}
          </button>

          <button
            onClick={() => onSelectView('evaluations')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
              activeView === 'evaluations'
                ? 'bg-[var(--bg-active)] text-[var(--text-primary)] font-semibold border border-[var(--border-active)] shadow-xs'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-[#10b981]" />
            <span className="text-[12px]">Evaluations</span>
          </button>
        </div>

        {/* Local Engine / Desktop Shell */}
        <div className="space-y-1 pt-2.5 border-t border-[var(--border-subtle)]">
          <div className="px-2.5 py-1 text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">
            Local Runtime
          </div>

          <button
            onClick={() => onOpenDownload && onOpenDownload()}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors cursor-pointer text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)] group"
            title="Download Parishram desktop runtime (macOS, Linux, Windows)"
          >
            <div className="flex items-center gap-2.5">
              <Download className="w-4 h-4 text-[#38bdf8] group-hover:scale-110 transition-transform" />
              <span className="text-[12px]">Download Parishram</span>
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
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <div className="truncate">
              <div className="font-semibold text-[var(--text-primary)] truncate text-[11px]">
                {user?.name || 'Evaluator Session'}
              </div>
              <div className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
                <span className="text-[#ea580c] font-bold">{planInfo.name}</span>
                <span>·</span>
                <span>{user?.usage.runsUsedThisMonth || 0} runs</span>
              </div>
            </div>
          </div>

          <Settings className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] shrink-0" />
        </button>
      </div>
    </aside>
  );
}
