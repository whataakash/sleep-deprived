'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
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
  User,
  Settings,
  LogOut,
  Zap,
  CheckCircle2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { EvaluationModelAdapter } from '@/lib/models/evaluation-adapter';

interface TopbarProps {
  currentTemp: ForgeTemperature;
  currentState: AgentState;
  selectedModelName: string;
  onOpenCommandPalette: () => void;
  onOpenAccount: (initialCategory?: string) => void;
  onOpenDownload?: () => void;
  onOpenUpgrade?: () => void;
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
  onOpenUpgrade,
  onRunDemo,
  onResetDemo,
  isDemoRunning,
}: TopbarProps) {
  const { session, updatePreferences, logout } = useAuth();
  const user = session.user;
  const temp = TEMP_PILL[currentTemp] || TEMP_PILL.COLD;
  const isEvalMode = EvaluationModelAdapter.isEvaluationMode();
  const currentTheme = user?.preferences?.theme || 'dark';

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

  // Resolved theme tracking (supports 'light', 'dark', and 'system' seamlessly)
  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>(() => {
    if (typeof document !== 'undefined') {
      const dataTheme = document.documentElement.getAttribute('data-theme');
      if (dataTheme === 'light' || dataTheme === 'dark') return dataTheme;
      if (document.documentElement.classList.contains('light')) return 'light';
    }
    if (currentTheme === 'light' || currentTheme === 'dark') return currentTheme;
    return 'dark';
  });

  useEffect(() => {
    const updateTheme = () => {
      if (typeof document !== 'undefined') {
        const dataTheme = document.documentElement.getAttribute('data-theme');
        if (dataTheme === 'light' || dataTheme === 'dark') {
          setResolvedTheme(dataTheme);
          return;
        }
        if (document.documentElement.classList.contains('light')) {
          setResolvedTheme('light');
          return;
        }
        if (document.documentElement.classList.contains('dark')) {
          setResolvedTheme('dark');
          return;
        }
      }
      if (currentTheme === 'light' || currentTheme === 'dark') {
        setResolvedTheme(currentTheme);
      } else if (typeof window !== 'undefined') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setResolvedTheme(prefersDark ? 'dark' : 'light');
      }
    };

    updateTheme();

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleMediaChange = () => updateTheme();
    media.addEventListener('change', handleMediaChange);

    const observer = new MutationObserver(() => updateTheme());
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme'],
    });

    return () => {
      media.removeEventListener('change', handleMediaChange);
      observer.disconnect();
    };
  }, [currentTheme]);

  const toggleTheme = () => {
    const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
    updatePreferences({ theme: nextTheme });
  };

  return (
    <header className="w-full bg-[var(--bg-canvas)] border-b border-[var(--border-subtle)] px-4 sm:px-6 h-16 flex items-center justify-between gap-4 text-xs font-mono select-none z-20 transition-colors">
      {/* LEFT: Prominent Brand Logo */}
      <div className="flex items-center gap-3">
        <div
          className="relative flex items-center h-8 sm:h-[34px] w-[108px] sm:w-[115px] select-none"
          title="Parishram (परिश्रम)"
          aria-label="Parishram"
        >
          {/* Dark Mode: PARISHRAM logo dark.png (for dark backgrounds) */}
          <Image
            src="/PARISHRAM%20logo%20dark.png"
            alt="Parishram"
            width={115}
            height={34}
            priority
            className={`absolute inset-0 w-full h-full object-contain object-left transition-opacity duration-200 motion-reduce:transition-none ${
              resolvedTheme === 'dark' ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          />
          {/* Light Mode: PARISHRAM LOGO LIGHTMODE.png (for light backgrounds) */}
          <Image
            src="/PARISHRAM%20LOGO%20LIGHTMODE.png"
            alt="Parishram"
            width={115}
            height={34}
            priority
            className={`absolute inset-0 w-full h-full object-contain object-left transition-opacity duration-200 motion-reduce:transition-none ${
              resolvedTheme === 'light' ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          />
        </div>
      </div>

      {/* CENTER / CONTEXT: Quiet Secondary Status */}
      <div className="hidden md:flex items-center gap-2">
        {currentState === 'COMPLETE' ? (
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border border-[#10b981]/25 bg-[#10b981]/10 text-[#10b981]"
            title="Parishram State: Verified & Complete"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-[#10b981]" />
            <span>Verified</span>
          </div>
        ) : (
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border border-transparent"
            style={{ backgroundColor: temp.bg, color: temp.color }}
            title="Parishram State: Contextual Harness Activity"
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: temp.color }} />
            <span className="capitalize">{temp.label}</span>
          </div>
        )}

        {isEvalMode && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#ea580c]/10 border border-[#ea580c]/25 text-[#ea580c] text-[10px] font-medium">
            <Lock className="w-3 h-3" />
            <span>PARISHRAM (Evaluation)</span>
          </div>
        )}
      </div>

      {/* RIGHT: [search] [theme] [profile] */}
      <div className="flex items-center gap-2 sm:gap-2.5">

        {/* Command Palette search trigger: Icon-only with accessible label */}
        <button
          onClick={onOpenCommandPalette}
          className="p-2 sm:p-2.5 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] border border-[var(--border-subtle)] hover:border-[var(--border-medium)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center shadow-xs"
          title="Search & Command Palette (Cmd+K)"
          aria-label="Search or open command palette (Cmd+K)"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Theme Switcher Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 sm:p-2.5 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] border border-[var(--border-subtle)] hover:border-[var(--border-medium)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center shadow-xs"
          title={`Switch to ${currentTheme === 'light' ? 'Dark' : 'Light'} theme`}
          aria-label={`Switch to ${currentTheme === 'light' ? 'Dark' : 'Light'} theme`}
        >
          {currentTheme === 'light' ? (
            <Moon className="w-4 h-4 text-[#ea580c]" />
          ) : (
            <Sun className="w-4 h-4 text-[#fbbf24]" />
          )}
        </button>

        {/* Clean Google-like Account Control: Standalone Circular Avatar Button */}
        <div className="relative" ref={accountMenuRef}>
          <button
            onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
            className="w-10 h-10 rounded-full bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] border border-[var(--border-subtle)] hover:border-[var(--border-medium)] transition-all cursor-pointer flex items-center justify-center shadow-xs focus:outline-none focus:ring-2 focus:ring-[#ea580c]/40"
            title="Account & Settings"
            aria-label="Open account and settings menu"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#ea580c] to-[#f97316] flex items-center justify-center text-white shadow-xs">
              <User className="w-4 h-4" />
            </div>
          </button>

          {/* Compact Account Menu */}
          {isAccountMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg shadow-xl py-2 z-50 animate-in fade-in duration-100 text-xs font-mono">
              <div className="px-3 py-2 border-b border-[var(--border-subtle)]">
                <div className="font-bold text-[var(--text-primary)] truncate">
                  {user?.name || 'Developer Session'}
                </div>
                <div className="text-[10px] text-[var(--text-muted)] truncate font-mono">
                  {user?.email || 'Active Session'}
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setIsAccountMenuOpen(false);
                    onOpenAccount('general');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 text-left text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5 text-[#a78bfa]" />
                  <span>Settings & Preferences</span>
                </button>
              </div>

              <div className="pt-1 border-t border-[var(--border-subtle)]">
                <button
                  onClick={() => {
                    setIsAccountMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 text-left text-[#ef4444] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
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
