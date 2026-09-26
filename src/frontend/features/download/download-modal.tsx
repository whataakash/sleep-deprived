'use client';

import React from 'react';
import { X, Apple, Monitor, Terminal, Shield, Download, ArrowUpRight, CheckCircle2 } from 'lucide-react';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DownloadModal({ isOpen, onClose }: DownloadModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl shadow-2xl p-6 font-mono text-xs text-[var(--text-primary)] transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold text-[var(--text-primary)]">परिश्रम Desktop</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#38bdf8]/15 text-[#38bdf8] font-bold border border-[#38bdf8]/30">
                Tauri v2 Shell
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mt-1">
              Run परिश्रम where your code lives. Direct local filesystem access with sandboxed isolation.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded bg-[var(--bg-subtle)] hover:bg-[var(--bg-active)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Platform Downloads */}
        <div className="py-5 space-y-4">
          <div className="text-[11px] text-[var(--text-secondary)] font-semibold">
            Choose Your Platform
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* macOS */}
            <div className="p-3.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] hover:border-[#ea580c] transition-colors flex flex-col justify-between group">
              <div className="space-y-1.5">
                <Apple className="w-5 h-5 text-[var(--text-primary)]" />
                <div className="font-bold text-[var(--text-primary)] text-[12px]">macOS</div>
                <div className="text-[10px] text-[var(--text-muted)]">Apple Silicon (M1-M4) & Intel x64</div>
              </div>

              <div className="mt-4 pt-3 border-t border-[var(--border-subtle)]">
                <a
                  href="https://github.com/whataakash/sleep-deprived/releases"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded bg-[var(--bg-elevated)] hover:bg-[#ea580c] text-[var(--text-primary)] hover:text-white text-[11px] font-semibold transition-colors border border-[var(--border-subtle)]"
                >
                  <Download className="w-3 h-3" />
                  <span>.dmg Installer</span>
                </a>
              </div>
            </div>

            {/* Linux */}
            <div className="p-3.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] hover:border-[#ea580c] transition-colors flex flex-col justify-between group">
              <div className="space-y-1.5">
                <Terminal className="w-5 h-5 text-[var(--text-primary)]" />
                <div className="font-bold text-[var(--text-primary)] text-[12px]">Linux</div>
                <div className="text-[10px] text-[var(--text-muted)]">AppImage, .deb & Arch AUR</div>
              </div>

              <div className="mt-4 pt-3 border-t border-[var(--border-subtle)]">
                <a
                  href="https://github.com/whataakash/sleep-deprived/releases"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded bg-[var(--bg-elevated)] hover:bg-[#ea580c] text-[var(--text-primary)] hover:text-white text-[11px] font-semibold transition-colors border border-[var(--border-subtle)]"
                >
                  <Download className="w-3 h-3" />
                  <span>.AppImage</span>
                </a>
              </div>
            </div>

            {/* Windows */}
            <div className="p-3.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] hover:border-[#ea580c] transition-colors flex flex-col justify-between group">
              <div className="space-y-1.5">
                <Monitor className="w-5 h-5 text-[var(--text-primary)]" />
                <div className="font-bold text-[var(--text-primary)] text-[12px]">Windows</div>
                <div className="text-[10px] text-[var(--text-muted)]">Windows 10/11 x64 & ARM64</div>
              </div>

              <div className="mt-4 pt-3 border-t border-[var(--border-subtle)]">
                <a
                  href="https://github.com/whataakash/sleep-deprived/releases"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded bg-[var(--bg-elevated)] hover:bg-[#ea580c] text-[var(--text-primary)] hover:text-white text-[11px] font-semibold transition-colors border border-[var(--border-subtle)]"
                >
                  <Download className="w-3 h-3" />
                  <span>.msi Installer</span>
                </a>
              </div>
            </div>
          </div>

          {/* Architecture & Security Highlights */}
          <div className="p-3.5 rounded bg-[var(--bg-canvas)] border border-[var(--border-subtle)] space-y-2 mt-4">
            <div className="text-[11px] font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-[#10b981]" />
              <span>Architectural Guarantees</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] text-[var(--text-muted)]">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-[#10b981]" />
                <span>Zero telemetry / air-gapped local execution</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-[#10b981]" />
                <span>Ollama native local inference connector</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-[#10b981]" />
                <span>Sandboxed Tauri v2 filesystem boundary</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-[#10b981]" />
                <span>Audit logged terminal execution</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Build from source link */}
        <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
          <span>Early Access Build (Tauri v2 Native Bundle)</span>
          <a
            href="https://github.com/whataakash/sleep-deprived"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-[#ea580c] hover:underline"
          >
            <span>Build from source</span>
            <ArrowUpRight className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
