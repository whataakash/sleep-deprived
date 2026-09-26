'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ForgeTemperature, AgentState } from '@/types/agent';
import {
  FolderGit2,
  GitBranch,
  Cpu,
  Search,
  Play,
  RotateCcw,
  ChevronDown,
  Sun,
  Moon,
  Lock,
  Download,
  User,
  Settings,
  CreditCard,
  BarChart2,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { EvaluationModelAdapter } from '@/lib/models/evaluation-adapter';
import { getPlanDisplay } from '@/lib/billing/plans';

interface TopbarProps {
  currentTemp: ForgeTemperature;
  currentState: AgentState;
  selectedModelName: string;
  onOpenCommandPalette: () => void;
  onOpenAccount: (initialCategory?: string) => void;
  onOpenDownload: () => void;
  onRunDemo: () => void;
  onResetDemo: () => void;
  isDemoRunning?: boolean;
}

const TEMP_PILL: Record<ForgeTemperature, { label: string; color: string; bg: string }> = {
  COLD: { label: 'Cold', color: '#9da6b3', bg: 'var(--bg-subtle)' },
  THINKING: { label: 'Thinking', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.12)' },
  WORKING: { label: 'Working', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.12)' },
  HOT: { label: 'Diagnosing', color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)' },
  FORGING: { label: 'Working', color: '#ea580c', bg: 'rgba(234, 88, 12, 0.18)' },
};

export function Topbar({
  currentTemp,
  currentState,
  selectedModelName,
  onOpenCommandPalette,
  onOpenAccount,
  onOpenDownload,
  onRunDemo,
  onResetDemo,
  isDemoRunning,
}: TopbarProps) {
  const { session, updatePreferences, logout } = useAuth();
  const user = session.user;
  const temp = TEMP_PILL[currentTemp] || TEMP_PILL.COLD;
  const isEvalMode = EvaluationModelAdapter.isEvaluationMode();
  const currentTheme = user?.preferences?.theme || 'dark';
  const planInfo = getPlanDisplay(user?.plan || 'BUILDER');

  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleTheme = () => {
    const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
    updatePreferences({ theme: nextTheme });
  };

  return (
    <header className="w-full bg-[var(--bg-canvas)] border-b border-[var(--border-subtle)] px-3 sm:px-4 py-2 flex items-center justify-between gap-3 text-xs font-mono select-none z-20 transition-colors">
      {/* Brand & Repository Context */}
      <div className="flex items-center gap-2.5 sm:gap-3.5">
        {/* Real Product Wordmark & Clean Brand Slot */}
        <div className="flex items-center gap-2">
          {/* Reserved clean brand slot for future SVG/logo */}
          <div className="brand-logo-slot hidden" aria-hidden="true" />
          <span className="font-black text-base sm:text-lg tracking-tight text-[var(--text-primary)] select-none">
            परिश्रम
          </span>
        </div>

        <div className="h-4 w-[1px] bg-[var(--border-subtle)] mx-0.5 sm:mx-1" />

        <div className="flex items-center gap-2 text-[11px] text-[var(--text-secondary)]">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
            <FolderGit2 className="w-3 h-3 text-[#ea580c]" />
            <span className="text-[var(--text-primary)] font-medium truncate max-w-[120px] sm:max-w-none">auth-gateway-service</span>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-[var(--text-muted)]">
            <GitBranch className="w-3 h-3" />
            <span>main</span>
          </div>
        </div>

        {/* Evaluation Mode Indicator */}
        {isEvalMode && (
          <div className="hidden lg:flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#ea580c]/15 border border-[#ea580c]/40 text-[#ea580c] text-[10px] font-bold">
            <Lock className="w-3 h-3" />
            <span>EVALUATION MODE (LOCKED)</span>
          </div>
        )}
      </div>

      {/* Center: Parishram State Pill & Model */}
      <div className="hidden md:flex items-center gap-2.5">
        <div
          className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold border border-transparent"
          style={{ backgroundColor: temp.bg, color: temp.color }}
          title="Parishram State: Contextual Harness Activity"
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: temp.color }} />
          <span className="capitalize">{temp.label}</span>
        </div>

        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[11px] text-[var(--text-muted)]">
          <Cpu className="w-3 h-3 text-[#38bdf8]" />
          <span className="text-[var(--text-primary)] truncate max-w-[140px]">{selectedModelName}</span>
        </div>
      </div>

      {/* Right Actions: Command Palette, Theme, Desktop, Run Demo, Account Avatar */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Command Palette trigger */}
        <button
          onClick={onOpenCommandPalette}
          className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
        >
          <Search className="w-3 h-3" />
          <span>Cmd+K</span>
        </button>

        {/* Download Parishram desktop shell */}
        <button
          onClick={onOpenDownload}
          className="hidden md:flex items-center gap-1 px-2 py-1 rounded bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          title="Download Parishram desktop runtime (macOS, Linux, Windows)"
        >
          <Download className="w-3 h-3 text-[#38bdf8]" />
          <span>Desktop</span>
        </button>

        {/* Theme Switcher Toggle */}
        <button
          onClick={toggleTheme}
          className="p-1 sm:p-1.5 rounded bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          title={`Switch to ${currentTheme === 'light' ? 'Dark' : 'Light'} theme`}
        >
          {currentTheme === 'light' ? (
            <Moon className="w-3.5 h-3.5 text-[#ea580c]" />
          ) : (
            <Sun className="w-3.5 h-3.5 text-[#fbbf24]" />
          )}
        </button>

        {/* Run Demo button */}
        <div className="flex items-center gap-1">
          <button
            onClick={onRunDemo}
            disabled={isDemoRunning}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
              isDemoRunning
                ? 'bg-[var(--bg-subtle)] text-[var(--text-muted)] cursor-not-allowed border border-[var(--border-subtle)]'
                : 'bg-[#ea580c] hover:bg-[#f97316] text-white shadow-xs active:scale-[0.98]'
            }`}
          >
            <Play className={`w-3 h-3 fill-current ${isDemoRunning ? 'animate-spin' : ''}`} />
            <span>{isDemoRunning ? 'RUNNING' : 'RUN DEMO'}</span>
          </button>

          <button
            onClick={onResetDemo}
            className="p-1 rounded bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            title="Reset to benchmark Run #1042"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>

        {/* User Account Avatar Menu (Section 20 Requirement) */}
        <div className="relative" ref={accountMenuRef}>
          <button
            onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
            className="flex items-center gap-1.5 p-1 pl-1.5 rounded bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] border border-[var(--border-subtle)] transition-colors cursor-pointer"
            title="Account & IDE Settings"
          >
            <div className="w-5 h-5 rounded-full bg-[#ea580c] flex items-center justify-center text-white text-[10px] font-bold">
              {user?.name ? user.name[0] : 'S'}
            </div>
            <ChevronDown className="w-3 h-3 text-[var(--text-muted)]" />
          </button>

          {/* Compact Account Menu */}
          {isAccountMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg shadow-xl py-2 z-50 animate-in fade-in duration-100 text-xs font-mono">
              <div className="px-3 py-2 border-b border-[var(--border-subtle)]">
                <div className="font-bold text-[var(--text-primary)] truncate">
                  {user?.name || 'Shivansh Pandey'}
                </div>
                <div className="text-[10px] text-[var(--text-muted)] flex items-center gap-1.5 mt-0.5">
                  <span className="text-[#ea580c] font-bold">{planInfo.hindiName}</span>
                  <span>({planInfo.englishSubtitle})</span>
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setIsAccountMenuOpen(false);
                    onOpenAccount('account');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 text-left text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors"
                >
                  <User className="w-3.5 h-3.5 text-[#38bdf8]" />
                  <span>Account</span>
                </button>

                <button
                  onClick={() => {
                    setIsAccountMenuOpen(false);
                    onOpenAccount('general');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 text-left text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors"
                >
                  <Settings className="w-3.5 h-3.5 text-[#a78bfa]" />
                  <span>Settings</span>
                </button>

                <button
                  onClick={() => {
                    setIsAccountMenuOpen(false);
                    onOpenAccount('billing');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 text-left text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors"
                >
                  <BarChart2 className="w-3.5 h-3.5 text-[#fbbf24]" />
                  <span>Usage</span>
                </button>

                <button
                  onClick={() => {
                    setIsAccountMenuOpen(false);
                    onOpenAccount('billing');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 text-left text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors"
                >
                  <CreditCard className="w-3.5 h-3.5 text-[#10b981]" />
                  <span>Billing</span>
                </button>
              </div>

              <div className="pt-1 border-t border-[var(--border-subtle)]">
                <button
                  onClick={() => {
                    setIsAccountMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 text-left text-[#ef4444] hover:bg-[var(--bg-subtle)] transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
