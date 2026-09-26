'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/context';
import {
  User,
  Palette,
  Code2,
  Command,
  X,
  CheckCircle2,
  LogOut,
  Sun,
  Moon,
  Laptop,
} from 'lucide-react';

interface AccountCenterProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: string;
}

interface SettingCategory {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

export function AccountCenter({ isOpen, onClose, initialCategory = 'appearance' }: AccountCenterProps) {
  const { session, updateProfile, updatePreferences, logout } = useAuth();
  const [activeCategory, setActiveCategory] = useState<string>('appearance');

  // Profile Form states
  const [nameInput, setNameInput] = useState(session.user?.name || '');
  const [emailInput, setEmailInput] = useState(session.user?.email || '');
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialCategory && ['appearance', 'editor', 'shortcuts', 'account'].includes(initialCategory)) {
        setActiveCategory(initialCategory);
      } else {
        setActiveCategory('appearance');
      }
    }
  }, [isOpen, initialCategory]);

  useEffect(() => {
    if (session.user) {
      setNameInput(session.user.name || '');
      setEmailInput(session.user.email || '');
    }
  }, [session.user]);

  const user = session.user;
  const prefs = user?.preferences;

  const CATEGORIES: SettingCategory[] = [
    { id: 'appearance', label: 'Appearance', icon: <Palette className="w-4 h-4" />, description: 'Theme, personality & interface motion' },
    { id: 'editor', label: 'Editor & Workspace', icon: <Code2 className="w-4 h-4" />, description: 'Font size, indentation & code formatting' },
    { id: 'shortcuts', label: 'Shortcuts', icon: <Command className="w-4 h-4" />, description: 'Keyboard shortcuts & navigation hotkeys' },
    { id: 'account', label: 'Developer Profile', icon: <User className="w-4 h-4" />, description: 'Session credentials & developer identity' },
  ];

  if (!isOpen) return null;

  const handleSaveNotice = () => {
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  const handleSaveProfile = () => {
    updateProfile({ name: nameInput, email: emailInput });
    handleSaveNotice();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div className="w-full max-w-3xl bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl shadow-2xl flex flex-col md:flex-row overflow-hidden max-h-[85vh] font-mono text-xs">
        {/* Left Nav */}
        <div className="w-full md:w-56 bg-[var(--bg-canvas)] border-b md:border-b-0 md:border-r border-[var(--border-subtle)] p-3 flex flex-col justify-between shrink-0">
          <div className="space-y-3">
            <div className="px-1 py-1">
              <span className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-wider">
                Settings
              </span>
            </div>

            <nav className="space-y-0.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                    activeCategory === cat.id
                      ? 'bg-[var(--bg-active)] text-[var(--text-primary)] font-bold border border-[var(--border-active)] shadow-xs'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <span className={activeCategory === cat.id ? 'text-[#ea580c]' : 'text-[var(--text-muted)]'}>
                    {cat.icon}
                  </span>
                  <span className="text-xs truncate">{cat.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="pt-3 border-t border-[var(--border-subtle)]">
            <button
              onClick={() => {
                onClose();
                logout();
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-left text-[#ef4444] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log out</span>
            </button>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[var(--bg-panel)]">
          {/* Header */}
          <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-elevated)] shrink-0">
            <div>
              <div className="font-bold text-sm text-[var(--text-primary)]">
                {CATEGORIES.find((c) => c.id === activeCategory)?.label || 'Settings'}
              </div>
              <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                {CATEGORIES.find((c) => c.id === activeCategory)?.description || ''}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {savedNotice && (
                <span className="text-[11px] text-[#10b981] flex items-center gap-1 font-semibold animate-in fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Saved</span>
                </span>
              )}
              <button
                onClick={onClose}
                aria-label="Close settings"
                className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* 1. APPEARANCE */}
            {activeCategory === 'appearance' && (
              <div className="space-y-5">
                <div>
                  <label className="text-[11px] text-[var(--text-secondary)] font-semibold block mb-2">
                    Interface Theme
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        updatePreferences({ theme: 'light' });
                        handleSaveNotice();
                      }}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-2 ${
                        prefs?.theme === 'light'
                          ? 'bg-[var(--bg-elevated)] border-[#ea580c] ring-1 ring-[#ea580c]/30 text-[var(--text-primary)] font-bold'
                          : 'bg-[var(--bg-canvas)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-medium)]'
                      }`}
                    >
                      <Sun className="w-5 h-5 text-[#fbbf24]" />
                      <span>Light</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        updatePreferences({ theme: 'dark' });
                        handleSaveNotice();
                      }}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-2 ${
                        prefs?.theme === 'dark'
                          ? 'bg-[var(--bg-elevated)] border-[#ea580c] ring-1 ring-[#ea580c]/30 text-[var(--text-primary)] font-bold'
                          : 'bg-[var(--bg-canvas)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-medium)]'
                      }`}
                    >
                      <Moon className="w-5 h-5 text-[#ea580c]" />
                      <span>Dark</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        updatePreferences({ theme: 'system' });
                        handleSaveNotice();
                      }}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-2 ${
                        prefs?.theme === 'system'
                          ? 'bg-[var(--bg-elevated)] border-[#ea580c] ring-1 ring-[#ea580c]/30 text-[var(--text-primary)] font-bold'
                          : 'bg-[var(--bg-canvas)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-medium)]'
                      }`}
                    >
                      <Laptop className="w-5 h-5 text-[#38bdf8]" />
                      <span>System</span>
                    </button>
                  </div>
                </div>

                <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-[var(--text-primary)]">Reduced Motion</div>
                    <div className="text-[11px] text-[var(--text-muted)] font-sans">
                      Respect system reduced-motion settings and minimize transition animations
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefs?.reducedMotion ?? false}
                    onChange={(e) => {
                      updatePreferences({ reducedMotion: e.target.checked });
                      handleSaveNotice();
                    }}
                    className="accent-[#ea580c] w-4 h-4 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* 2. EDITOR */}
            {activeCategory === 'editor' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-[var(--text-primary)]">Font Size</div>
                    <div className="text-[11px] text-[var(--text-muted)] font-sans">Code diff and terminal font scaling</div>
                  </div>
                  <select
                    value={prefs?.fontSize || 13}
                    onChange={(e) => {
                      updatePreferences({ fontSize: Number(e.target.value) });
                      handleSaveNotice();
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--text-primary)] cursor-pointer"
                  >
                    <option value={12}>12px (Compact)</option>
                    <option value={13}>13px (Default)</option>
                    <option value={14}>14px (Comfortable)</option>
                    <option value={16}>16px (Large)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-[var(--text-primary)]">Tab Size</div>
                    <div className="text-[11px] text-[var(--text-muted)] font-sans">Indentation whitespace width</div>
                  </div>
                  <select
                    value={prefs?.tabSize || 2}
                    onChange={(e) => {
                      updatePreferences({ tabSize: Number(e.target.value) });
                      handleSaveNotice();
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--text-primary)] cursor-pointer"
                  >
                    <option value={2}>2 spaces</option>
                    <option value={4}>4 spaces</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-[var(--text-primary)]">Diff Minimap</div>
                    <div className="text-[11px] text-[var(--text-muted)] font-sans">Show code minimap scrollbar in diff viewer</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefs?.minimap ?? true}
                    onChange={(e) => {
                      updatePreferences({ minimap: e.target.checked });
                      handleSaveNotice();
                    }}
                    className="accent-[#ea580c] w-4 h-4 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* 3. KEYBOARD SHORTCUTS */}
            {activeCategory === 'shortcuts' && (
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] flex items-center justify-between">
                  <span className="text-[var(--text-primary)]">Open Search / Command Palette</span>
                  <kbd className="px-2 py-1 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[11px]">
                    ⌘ K / Ctrl K
                  </kbd>
                </div>

                <div className="p-3 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] flex items-center justify-between">
                  <span className="text-[var(--text-primary)]">Submit Task to Harness</span>
                  <kbd className="px-2 py-1 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[11px]">
                    Enter
                  </kbd>
                </div>

                <div className="p-3 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] flex items-center justify-between">
                  <span className="text-[var(--text-primary)]">Newline in Composer</span>
                  <kbd className="px-2 py-1 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[11px]">
                    Shift + Enter
                  </kbd>
                </div>

                <div className="p-3 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] flex items-center justify-between">
                  <span className="text-[var(--text-primary)]">Close Modal / Overlay</span>
                  <kbd className="px-2 py-1 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[11px]">
                    Esc
                  </kbd>
                </div>
              </div>
            )}

            {/* 4. DEVELOPER PROFILE */}
            {activeCategory === 'account' && (
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] text-[var(--text-secondary)] font-semibold block mb-1.5">
                    Developer Name
                  </label>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="w-full max-w-sm px-3 py-1.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--text-primary)] outline-none focus:border-[#ea580c]"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-[var(--text-secondary)] font-semibold block mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full max-w-sm px-3 py-1.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--text-primary)] outline-none focus:border-[#ea580c]"
                  />
                </div>

                <div className="p-3 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[11px] text-[var(--text-muted)] font-sans space-y-1">
                  <div className="font-bold text-[var(--text-primary)] font-mono">
                    Evaluation Session Mode
                  </div>
                  <div>
                    Evaluator credentials provided via <code className="px-1.5 py-0.5 rounded bg-[var(--bg-panel)] font-mono text-[10px]">AI_API_KEY</code> are consumed in process memory and never persisted externally.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSaveProfile}
                  className="px-4 py-1.5 rounded-lg bg-[#ea580c] hover:bg-[#f97316] text-white font-semibold cursor-pointer shadow-xs transition-colors"
                >
                  Save Profile
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
