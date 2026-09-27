'use client';

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Cpu,
  ArrowRight,
  ShieldCheck,
  Compass,
  Zap,
  Lock,
  Play,
  RotateCcw,
  FolderGit2,
  GitBranch,
  Key,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { ParishramAIRouter } from '@/lib/models/gateway';

interface OverviewViewProps {
  onStartRun: (taskText: string, modelId: string, agentMode?: string, apiKey?: string) => void;
  onOpenRun?: (runNumber: number) => void;
  onNavigateToModels?: () => void;
  lastCompletedRun?: {
    runNumber: number;
    title: string;
    testsPassed: number;
    testsTotal: number;
    isVerified: boolean;
  };
  onViewProof?: () => void;
}

export function OverviewView({
  onStartRun,
  onOpenRun,
  onNavigateToModels,
  lastCompletedRun,
  onViewProof,
}: OverviewViewProps) {
  const { session } = useAuth();
  const user = session.user;

  const [taskPrompt, setTaskPrompt] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState('qwen3-coder-next');
  const [selectedAgentMode, setSelectedAgentMode] = useState<'dual' | 'navigator' | 'supervisor'>('dual');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedKey = localStorage.getItem('parishram_api_key') || '';
      if (savedKey) setApiKey(savedKey);
    }
  }, []);

  const handleApiKeyChange = (val: string) => {
    setApiKey(val);
    if (typeof window !== 'undefined') {
      localStorage.setItem('parishram_api_key', val);
    }
  };

  const liveDifficulty = useMemo(() => {
    const combined = [repoUrl, taskPrompt].filter(Boolean).join(' ');
    if (!combined.trim()) return null;
    return ParishramAIRouter.evaluateDifficulty(combined, 2, 0);
  }, [taskPrompt, repoUrl]);

  const detectedRepo = useMemo(() => {
    const searchIn = repoUrl || taskPrompt;
    const match = searchIn.match(/https?:\/\/(?:www\.)?github\.com\/([^\s\/]+)\/([^\s\/]+)(?:\/issues\/(\d+))?/i);
    if (!match) return null;
    return {
      fullUrl: match[0],
      owner: match[1],
      repo: match[2].replace(/\.git$/, ''),
      issueNum: match[3],
    };
  }, [taskPrompt, repoUrl]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Instantly resize the textarea to fit content — no debounce so typing feels immediate.
  // The outer motion.div picks up the layout shift and animates it smoothly.
  const autoResize = useCallback((el: HTMLTextAreaElement) => {
    el.style.height = 'auto'; // collapse first so shrink works
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  const handlePromptChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setTaskPrompt(e.target.value);
      autoResize(e.target);
    },
    [autoResize]
  );

  // Voice input removed — text-only modality enforced per hackathon requirements

  // File attachments removed — text-only modality enforced per hackathon requirements

  const handleSubmitTask = useCallback(() => {
    const fullTask = repoUrl.trim()
      ? `${taskPrompt.trim() || 'Analyze and fix issues in'} ${repoUrl.trim()}`
      : taskPrompt.trim();
    if (fullTask.trim()) {
      onStartRun(fullTask, selectedModelId, selectedAgentMode, apiKey.trim());
      setTaskPrompt('');
      setRepoUrl('');
    }
  }, [taskPrompt, repoUrl, selectedModelId, selectedAgentMode, apiKey, onStartRun]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmitTask();
      }
    },
    [handleSubmitTask]
  );



  return (
    <div className="flex-1 flex flex-col items-center justify-start overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 select-none font-sans transition-colors">
      <div className="w-full max-w-3xl lg:max-w-4xl space-y-5">
        {/* HERO SECTION: "What are we building?" */}
        <div className="pt-2 pb-0.5 space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            What are we building?
          </h1>
          <p className="text-xs text-[var(--text-secondary)] font-mono max-w-xl">
            Autonomous software engineering with deterministic verification and cryptographic proof.
          </p>
        </div>

        {/* AI Agent Selection Bar (Above Composer) */}
        <div className="space-y-1.5 font-mono text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {/* Dual Agent (Autonomous Pair) */}
            <button
              type="button"
              onClick={() => setSelectedAgentMode('dual')}
              className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                selectedAgentMode === 'dual'
                  ? 'bg-[var(--bg-elevated)] border-[#ea580c] text-[var(--text-primary)]'
                  : 'bg-[var(--bg-panel)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-medium)]'
              }`}
            >
              <div className="flex items-center gap-1.5 font-semibold text-xs text-[var(--text-primary)]">
                <Zap className="w-3.5 h-3.5 text-[#ea580c]" />
                <span>Autonomous Pair</span>
              </div>
              <div className="text-[10px] text-[var(--text-muted)] font-sans mt-0.5">
                Navigator & Supervisor in co-op loop
              </div>
            </button>

            {/* Navigating AI */}
            <button
              type="button"
              onClick={() => setSelectedAgentMode('navigator')}
              className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                selectedAgentMode === 'navigator'
                  ? 'bg-[var(--bg-elevated)] border-[#ea580c] text-[var(--text-primary)]'
                  : 'bg-[var(--bg-panel)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-medium)]'
              }`}
            >
              <div className="flex items-center gap-1.5 font-semibold text-xs text-[var(--text-primary)]">
                <Compass className="w-3.5 h-3.5 text-[#38bdf8]" />
                <span>Navigating AI</span>
              </div>
              <div className="text-[10px] text-[var(--text-muted)] font-sans mt-0.5">
                Repository cartography & symbol search
              </div>
            </button>

            {/* Supervisor AI */}
            <button
              type="button"
              onClick={() => setSelectedAgentMode('supervisor')}
              className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                selectedAgentMode === 'supervisor'
                  ? 'bg-[var(--bg-elevated)] border-[#ea580c] text-[var(--text-primary)]'
                  : 'bg-[var(--bg-panel)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-medium)]'
              }`}
            >
              <div className="flex items-center gap-1.5 font-semibold text-xs text-[var(--text-primary)]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#10b981]" />
                <span>Supervisor AI</span>
              </div>
              <div className="text-[10px] text-[var(--text-muted)] font-sans mt-0.5">
                Scope barrier & verification gate
              </div>
            </button>
          </div>
        </div>

        {/* Task Intake Box */}
        <motion.div
          layout
          transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
          className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] focus-within:border-[var(--border-medium)] rounded-xl overflow-hidden shadow-sm transition-all flex flex-col gap-0"
        >
          {/* Repo URL strip at top */}
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
            <GitBranch className="w-3.5 h-3.5 text-[#ea580c] shrink-0" />
            <input
              type="url"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/owner/repo  —  paste repo or issue URL (optional)"
              aria-label="Repository URL"
              className="flex-1 bg-transparent text-[11px] font-mono text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none"
            />
            {detectedRepo && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30 shrink-0 font-mono whitespace-nowrap">
                ✓ {detectedRepo.owner}/{detectedRepo.repo}{detectedRepo.issueNum ? ` #${detectedRepo.issueNum}` : ''}
              </span>
            )}
          </div>

          {/* Task prompt textarea */}
          <div className="px-4 pt-3 pb-2">
            <textarea
              ref={textareaRef}
              value={taskPrompt}
              onChange={handlePromptChange}
              onKeyDown={handleKeyDown}
              placeholder="Describe the task or bug to fix..."
              aria-label="Task prompt"
              style={{
                minHeight: '3.5rem',
                maxHeight: '13rem',
                height: 'auto',
                overflowY: taskPrompt ? 'auto' : 'hidden',
              }}
              className="w-full bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none resize-none leading-relaxed font-sans"
            />
          </div>


          <div className="px-4 pb-3 border-t border-[var(--border-subtle)] pt-3 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
            <div className="flex flex-wrap items-center gap-2">
              {/* Model Picker */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[11px]">
                <Cpu className="w-3 h-3 text-[#38bdf8]" />
                <select
                  value={selectedModelId}
                  onChange={(e) => setSelectedModelId(e.target.value)}
                  className="bg-transparent text-[var(--text-primary)] outline-none cursor-pointer"
                >
                  <option value="qwen3-coder-next" className="bg-[var(--bg-panel)] text-[var(--text-primary)]">Qwen3-Coder-Next</option>
                  <option value="deepseek-v3-coder" className="bg-[var(--bg-panel)] text-[var(--text-primary)]">DeepSeek V3 Coder</option>
                  <option value="kimi-k2-5-agent" className="bg-[var(--bg-panel)] text-[var(--text-primary)]">Kimi K2.5</option>
                  <option value="glm-5-moe" className="bg-[var(--bg-panel)] text-[var(--text-primary)]">GLM-5 MoE</option>
                  <option value="ollama-local-qwen3" className="bg-[var(--bg-panel)] text-[var(--text-primary)]">Local / Ollama</option>
                </select>
              </div>

              {/* Live API Key Input */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[11px] focus-within:border-[#ea580c] transition-colors">
                <Key className={`w-3 h-3 ${apiKey ? 'text-[#10b981]' : 'text-[var(--text-muted)]'}`} />
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => handleApiKeyChange(e.target.value)}
                  placeholder="Paste AI API Key (sk-... / gsk_... / AIza...)"
                  aria-label="AI API Key"
                  className="bg-transparent text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none w-44 sm:w-60 text-[10px]"
                />
                {apiKey && (
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                    title={showApiKey ? 'Hide key' : 'Show key'}
                  >
                    {showApiKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </button>
                )}
                {apiKey ? (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#10b981]/15 text-[#10b981] font-bold">
                    LIVE
                  </span>
                ) : (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-[var(--bg-subtle)] text-[var(--text-muted)] font-medium">
                    DEMO
                  </span>
                )}
              </div>
            </div>

            {/* Right: Send */}
            <button
              type="button"
              onClick={handleSubmitTask}
              aria-label="Run task"
              title="Run task"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#ea580c] hover:bg-[#f97316] text-white text-xs font-bold transition-all shadow-xs active:scale-[0.98] motion-reduce:active:scale-100 cursor-pointer shrink-0"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              Run
            </button>
          </div>
        </motion.div>

        {/* Evaluation Standard Status Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--text-muted)] font-mono px-1">
          <div className="flex items-center gap-2 text-[11px]">
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[var(--bg-panel)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
              <span className={`w-1.5 h-1.5 rounded-full ${apiKey ? 'bg-[#10b981]' : 'bg-[#fbbf24]'}`} />
              <span>{apiKey ? 'Live Model Active' : 'Enter AI_API_KEY to execute'}</span>
            </span>
            <span className="hidden sm:inline text-[var(--text-muted)]">·</span>
            <span className="hidden sm:inline text-[var(--text-muted)]">Text-Only Modality (Mandatory)</span>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-[11px] text-[var(--text-muted)]">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
              <span>Deterministic verification</span>
            </span>
            <span>·</span>
            <span>Cryptographic proof</span>
          </div>
        </div>

        {/* Progressive Disclosure: Completed Run Verification Card */}
        {lastCompletedRun && lastCompletedRun.isVerified && (
          <div className="p-3.5 rounded-xl bg-[var(--bg-panel)] border border-[#10b981]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-[#10b981] shrink-0" />
              <div>
                <div className="font-bold text-[var(--text-primary)]">
                  Task completed · Run #{lastCompletedRun.runNumber}
                </div>
                <div className="text-[11px] text-[var(--text-muted)] flex flex-wrap items-center gap-2 mt-0.5 font-sans">
                  <span className="text-[#10b981] font-semibold">✓ Tests passed ({lastCompletedRun.testsPassed}/{lastCompletedRun.testsTotal})</span>
                  <span>·</span>
                  <span className="text-[#10b981] font-semibold">✓ Scope verified</span>
                  <span>·</span>
                  <span className="text-[#10b981] font-semibold">✓ Proof generated</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onViewProof}
              className="px-3 py-1.5 rounded-lg bg-[#10b981]/15 text-[#10b981] hover:bg-[#10b981]/25 border border-[#10b981]/30 font-semibold cursor-pointer transition-colors self-start sm:self-center shrink-0 flex items-center gap-1.5"
            >
              <span>View proof</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Evaluator Quick Prompts */}
        <div className="space-y-2.5 pt-2">
          <div className="flex items-center justify-between text-xs font-mono text-[var(--text-muted)]">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Evaluator Quick Prompts</span>
            <span className="text-[10px]">Click to populate</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                const text = 'Run verification tests and audit scope guards across the codebase';
                setTaskPrompt(text);
                if (textareaRef.current) setTimeout(() => autoResize(textareaRef.current!), 0);
              }}
              className="p-3 rounded-xl bg-[var(--bg-panel)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[#ea580c]/40 text-left transition-all cursor-pointer group shadow-2xs"
            >
              <div className="flex items-center gap-1.5 text-[var(--text-primary)] group-hover:text-[#ea580c] font-semibold text-xs font-mono">
                <FolderGit2 className="w-3.5 h-3.5 text-[#ea580c]" />
                <span className="truncate">Harness Verification</span>
              </div>
              <div className="text-[11px] text-[var(--text-muted)] mt-1 truncate font-sans">
                Audit scope guards & test suites
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                const text = 'Inspect targeted context cartography in src/lib/harness/context-engine.ts';
                setTaskPrompt(text);
                if (textareaRef.current) setTimeout(() => autoResize(textareaRef.current!), 0);
              }}
              className="p-3 rounded-xl bg-[var(--bg-panel)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[#38bdf8]/40 text-left transition-all cursor-pointer group shadow-2xs"
            >
              <div className="flex items-center gap-1.5 text-[var(--text-primary)] group-hover:text-[#38bdf8] font-semibold text-xs font-mono">
                <FolderGit2 className="w-3.5 h-3.5 text-[#38bdf8]" />
                <span className="truncate">Context Cartography</span>
              </div>
              <div className="text-[11px] text-[var(--text-muted)] mt-1 truncate font-sans">
                Verify token budget & symbol index
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                const text = 'Verify cryptographic proof generation in src/lib/harness/proof-engine.ts';
                setTaskPrompt(text);
                if (textareaRef.current) setTimeout(() => autoResize(textareaRef.current!), 0);
              }}
              className="p-3 rounded-xl bg-[var(--bg-panel)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[#10b981]/40 text-left transition-all cursor-pointer group shadow-2xs"
            >
              <div className="flex items-center gap-1.5 text-[var(--text-primary)] group-hover:text-[#10b981] font-semibold text-xs font-mono">
                <FolderGit2 className="w-3.5 h-3.5 text-[#10b981]" />
                <span className="truncate">Proof Engine</span>
              </div>
              <div className="text-[11px] text-[var(--text-muted)] mt-1 truncate font-sans">
                Merkle root & SHA-256 validation
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
