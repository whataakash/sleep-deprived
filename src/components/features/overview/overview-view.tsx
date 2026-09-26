'use client';

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Cpu,
  ArrowRight,
  ShieldCheck,
  Compass,
  Zap,
  Sparkles,
  GitBranch,
  TrendingUp,
  CreditCard,
  Lock,
  Play,
  RotateCcw,
  Mic,
  MicOff,
  Sliders,
  Bot,
  Link2,
  FolderGit2,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { getPlanDisplay } from '@/lib/billing/plans';
import { ParishramAIRouter } from '@/lib/models/gateway';

interface OverviewViewProps {
  onStartRun: (taskText: string, modelId: string, agentMode?: string) => void;
  onOpenRun: (runNumber: number) => void;
  onOpenBilling?: () => void;
  onOpenUpgrade?: () => void;
  onRunDemo?: () => void;
  isDemoRunning?: boolean;
  onResetDemo?: () => void;
  onNavigateToModels?: () => void;
}

interface RecentRunItem {
  id: string;
  number: number;
  title: string;
  status: 'VERIFIED' | 'FAILED';
  duration: string;
  timestamp: string;
  filesCount: number;
  modelUsed: string;
  agentMode: string;
}

const RECENT_RUNS: RecentRunItem[] = [
  {
    id: 'run-1042',
    number: 1042,
    title: 'Fix auth-gateway-service: forward session token in client',
    status: 'VERIFIED',
    duration: '42s',
    timestamp: '12m ago',
    filesCount: 1,
    modelUsed: 'Qwen3-Coder-Next',
    agentMode: 'Dual Agent (Nav + Sup)',
  },
  {
    id: 'run-1041',
    number: 1041,
    title: 'Inject rate-limiter middleware into redis token bucket',
    status: 'VERIFIED',
    duration: '1m 18s',
    timestamp: '2h ago',
    filesCount: 3,
    modelUsed: 'DeepSeek-V3-Coder',
    agentMode: 'Supervisor AI',
  },
  {
    id: 'run-1040',
    number: 1040,
    title: 'Handle malformed JWT signature without unhandled rejection',
    status: 'VERIFIED',
    duration: '34s',
    timestamp: '5h ago',
    filesCount: 2,
    modelUsed: 'Kimi-K2.5-Agent',
    agentMode: 'Navigating AI',
  },
  {
    id: 'run-1039',
    number: 1039,
    title: 'Update database migration schema for user audit logs',
    status: 'VERIFIED',
    duration: '58s',
    timestamp: 'Yesterday',
    filesCount: 4,
    modelUsed: 'GLM-5-MoE',
    agentMode: 'Dual Agent (Nav + Sup)',
  },
];

export function OverviewView({
  onStartRun,
  onOpenRun,
  onOpenBilling,
  onOpenUpgrade,
  onRunDemo,
  isDemoRunning,
  onResetDemo,
  onNavigateToModels,
}: OverviewViewProps) {
  const { session } = useAuth();
  const user = session.user;
  const currentPlan = user?.plan || 'FREE';
  const planInfo = getPlanDisplay(currentPlan);

  const [taskPrompt, setTaskPrompt] = useState('');
  const [selectedModelId, setSelectedModelId] = useState('qwen3-coder-next');
  const [selectedAgentMode, setSelectedAgentMode] = useState<'dual' | 'navigator' | 'supervisor'>('dual');

  const liveDifficulty = useMemo(() => {
    if (!taskPrompt.trim()) return null;
    return ParishramAIRouter.evaluateDifficulty(taskPrompt, 2, 0);
  }, [taskPrompt]);

  const detectedRepo = useMemo(() => {
    const match = taskPrompt.match(/https?:\/\/(?:www\.)?github\.com\/([^\s\/]+)\/([^\s\/]+)(?:\/issues\/(\d+))?/i);
    if (!match) return null;
    return {
      fullUrl: match[0],
      owner: match[1],
      repo: match[2].replace(/\.git$/, ''),
      issueNum: match[3],
    };
  }, [taskPrompt]);

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

  const [isListening, setIsListening] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setIsSpeechSupported(false);
      }
    }
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }
    };
  }, []);

  const toggleListening = useCallback(() => {
    if (!isSpeechSupported) return;

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
      setIsListening(false);
      return;
    }

    try {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setIsSpeechSupported(false);
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let newTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            newTranscript += event.results[i][0].transcript;
          }
        }
        if (newTranscript.trim()) {
          setTaskPrompt((prev) => {
            const separator = prev && !prev.endsWith(' ') ? ' ' : '';
            const next = (prev || '') + separator + newTranscript.trim();
            setTimeout(() => {
              if (textareaRef.current) {
                autoResize(textareaRef.current);
              }
            }, 0);
            return next;
          });
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error/denial:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Failed to start speech recognition:', err);
      setIsListening(false);
    }
  }, [isSpeechSupported, isListening, autoResize]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (taskPrompt.trim()) {
          onStartRun(taskPrompt, selectedModelId, selectedAgentMode);
        }
      }
    },
    [taskPrompt, selectedModelId, selectedAgentMode, onStartRun]
  );

  const runsUsed = user?.usage.runsUsedThisMonth || 14;
  const maxRuns = typeof user?.usage.maxMonthlyRuns === 'number' ? user.usage.maxMonthlyRuns : 25;
  const usagePercent = Math.min(100, Math.round((runsUsed / maxRuns) * 100));

  return (
    <div className="flex-1 flex flex-col items-center justify-start overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 select-none font-sans transition-colors">
      <div className="w-full max-w-4xl lg:max-w-5xl space-y-6">
        {/* ENLARGED HERO SECTION: "What are you thinking to build?" */}
        <div className="p-6 sm:p-7 rounded-2xl bg-gradient-to-br from-[var(--bg-elevated)] via-[var(--bg-panel)] to-[var(--bg-canvas)] border border-[var(--border-subtle)] space-y-3.5 shadow-sm relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-md bg-[#ea580c]/15 text-[#ea580c] border border-[#ea580c]/30">
                  <Sparkles className="w-4 h-4" />
                </span>
                <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-[#ea580c]">
                  PARISHRAM AI CORE DISPATCHER
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#10b981]/15 text-[#10b981] font-mono font-bold">
                  AUTONOMOUS SMART ROUTING
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
                What are you thinking to build?
              </h1>
              <p className="text-xs text-[var(--text-secondary)] font-mono max-w-2xl leading-relaxed">
                Describe any feature, bug, or refactor. Parishram AI dynamically evaluates task difficulty: low-level atomic tasks route to free open-source models, while hard architectural problems dispatch to frontier models.
              </p>
            </div>

            {onNavigateToModels && (
              <button
                type="button"
                onClick={onNavigateToModels}
                className="self-start sm:self-center shrink-0 px-4 py-2.5 rounded-xl bg-[var(--bg-canvas)] hover:bg-[var(--bg-elevated)] border border-[#ea580c]/40 text-xs font-mono font-bold text-[var(--text-primary)] hover:text-[#ea580c] transition-all cursor-pointer flex items-center gap-2 shadow-xs group"
              >
                <Sliders className="w-3.5 h-3.5 text-[#ea580c] group-hover:rotate-45 transition-transform" />
                <span>Configure AI Models</span>
                <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}
          </div>
        </div>

        {/* AI Agent Selection Bar (Above Chat) */}
        <div className="flex flex-col gap-1.5 font-mono text-xs">
          <div className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider font-semibold flex items-center justify-between">
            <span>Select AI Agent Dispatch Mode</span>
            <span className="text-[10px] text-[var(--text-muted)] lowercase">co-operative reasoning</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {/* Dual Agent (Navigator + Supervisor) */}
            <button
              type="button"
              onClick={() => setSelectedAgentMode('dual')}
              className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                selectedAgentMode === 'dual'
                  ? 'bg-[var(--bg-elevated)] border-[#ea580c] ring-1 ring-[#ea580c]/30'
                  : 'bg-[var(--bg-panel)] border-[var(--border-subtle)] hover:border-[var(--border-medium)]'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs text-[var(--text-primary)]">
                <Zap className="w-3.5 h-3.5 text-[#ea580c]" />
                <span>Autonomous Pair</span>
              </div>
              <div className="text-[10px] text-[var(--text-muted)] font-sans mt-0.5 leading-tight">
                Navigator cartography + Supervisor proof verification
              </div>
            </button>

            {/* Navigating AI */}
            <button
              type="button"
              onClick={() => setSelectedAgentMode('navigator')}
              className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                selectedAgentMode === 'navigator'
                  ? 'bg-[var(--bg-elevated)] border-[#38bdf8] ring-1 ring-[#38bdf8]/30'
                  : 'bg-[var(--bg-panel)] border-[var(--border-subtle)] hover:border-[var(--border-medium)]'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs text-[var(--text-primary)]">
                <Compass className="w-3.5 h-3.5 text-[#38bdf8]" />
                <span>Navigating AI</span>
              </div>
              <div className="text-[10px] text-[var(--text-muted)] font-sans mt-0.5 leading-tight">
                AST mapping, call trees, dependency context search
              </div>
            </button>

            {/* Supervisor AI */}
            <button
              type="button"
              onClick={() => setSelectedAgentMode('supervisor')}
              className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                selectedAgentMode === 'supervisor'
                  ? 'bg-[var(--bg-elevated)] border-[#10b981] ring-1 ring-[#10b981]/30'
                  : 'bg-[var(--bg-panel)] border-[var(--border-subtle)] hover:border-[var(--border-medium)]'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs text-[var(--text-primary)]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#10b981]" />
                <span>Supervisor AI</span>
              </div>
              <div className="text-[10px] text-[var(--text-muted)] font-sans mt-0.5 leading-tight">
                Scope guard, security scanning, invariant proofs
              </div>
            </button>
          </div>
        </div>

        {/* Task Intake Box — auto-growing, motion-animated */}
        <motion.div
          layout
          transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
          className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl p-4 shadow-sm transition-colors flex flex-col gap-0"
        >
          {detectedRepo && (
            <div className="mb-2.5 px-3 py-1.5 rounded-lg bg-[#ea580c]/12 border border-[#ea580c]/30 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <Link2 className="w-3.5 h-3.5 text-[#ea580c]" />
                <span className="text-[var(--text-muted)] text-[11px]">TARGET REPO DETECTED:</span>
                <span className="font-bold text-[var(--text-primary)]">
                  {detectedRepo.owner}/{detectedRepo.repo} {detectedRepo.issueNum ? `(Issue #${detectedRepo.issueNum})` : ''}
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30">
                Ready to Clone & Fix
              </span>
            </div>
          )}

          {/*
           * The textarea itself is sized by scrollHeight (via autoResize).
           * min-height keeps it compact when empty (~2 lines of text).
           * max-height caps growth; overflow-y:auto then handles internal scroll.
           * The outer motion.div animates the resulting height change.
           */}
          <textarea
            ref={textareaRef}
            value={taskPrompt}
            onChange={handlePromptChange}
            onKeyDown={handleKeyDown}
            placeholder="Paste a faulty GitHub repository URL or describe any bug (e.g. https://github.com/org/repo)..."
            aria-label="Task prompt"
            style={{
              minHeight: '3rem',     /* ~2 lines — compact when empty */
              maxHeight: '13rem',    /* ~8 lines — then scroll internally */
              height: 'auto',
              overflowY: taskPrompt ? 'auto' : 'hidden',
            }}
            className="w-full bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none resize-none leading-relaxed font-sans"
          />

          <div className="pt-3 mt-1 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
            {/* Model Picker */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[11px]">
                <Cpu className="w-3 h-3 text-[#38bdf8]" />
                <select
                  value={selectedModelId}
                  onChange={(e) => setSelectedModelId(e.target.value)}
                  className="bg-transparent text-[var(--text-primary)] outline-none cursor-pointer"
                >
                  <option value="qwen3-coder-next" className="bg-[var(--bg-panel)] text-[var(--text-primary)]">
                    Qwen3-Coder-Next (Auto Recommended)
                  </option>
                  <option value="kimi-k2-5-agent" className="bg-[var(--bg-panel)] text-[var(--text-primary)]">
                    Kimi K2.5 Multimodal
                  </option>
                  <option value="glm-5-moe" className="bg-[var(--bg-panel)] text-[var(--text-primary)]">
                    GLM-5 MoE
                  </option>
                  <option value="deepseek-v3-coder" className="bg-[var(--bg-panel)] text-[var(--text-primary)]">
                    DeepSeek V3 Coder
                  </option>
                  <option value="claude-3-7-sonnet" className="bg-[var(--bg-panel)] text-[var(--text-primary)]">
                    Claude 3.7 Sonnet
                  </option>
                  <option value="ollama-local-qwen3" className="bg-[var(--bg-panel)] text-[var(--text-primary)]">
                    Local / Ollama
                  </option>
                </select>
              </div>
            </div>

            {/* Action Buttons: Functional Microphone & Send Arrow */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleListening}
                disabled={!isSpeechSupported}
                aria-label={
                  !isSpeechSupported
                    ? 'Voice input is not supported in this browser'
                    : isListening
                    ? 'Stop voice input'
                    : 'Start voice input'
                }
                title={
                  !isSpeechSupported
                    ? 'Voice input is not supported in this browser'
                    : isListening
                    ? 'Stop voice input'
                    : 'Start voice input'
                }
                className={`p-2 rounded-lg border transition-all flex items-center justify-center min-w-[36px] min-h-[36px] ${
                  !isSpeechSupported
                    ? 'opacity-40 cursor-not-allowed bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-muted)]'
                    : isListening
                    ? 'bg-[#ea580c]/15 border-[#ea580c]/50 text-[#ea580c] shadow-xs animate-pulse motion-reduce:animate-none cursor-pointer'
                    : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] hover:border-[var(--border-medium)] text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer'
                }`}
              >
                {isListening ? (
                  <Mic className="w-4 h-4 text-[#ea580c]" />
                ) : !isSpeechSupported ? (
                  <MicOff className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </button>

              <button
                type="button"
                onClick={() => onStartRun(taskPrompt, selectedModelId, selectedAgentMode)}
                aria-label="Run task"
                title="Run task"
                className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#ea580c] hover:bg-[#f97316] text-white transition-all shadow-xs active:scale-[0.98] motion-reduce:active:scale-100 cursor-pointer min-w-[36px] min-h-[36px]"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Dynamic Live Difficulty Evaluation Badge */}
          {liveDifficulty && (
            <div className="mt-3 pt-3 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="text-[var(--text-muted)] text-[10px] uppercase font-bold">Parishram AI:</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    liveDifficulty.tier === 'FRONTIER'
                      ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                      : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  Score {liveDifficulty.score}/10 — {liveDifficulty.tier === 'FRONTIER' ? 'Frontier Reasoning Engine' : 'Free/Local Open-Source Model'}
                </span>
              </div>
              <div className="text-[11px] text-[var(--text-muted)] truncate max-w-sm sm:max-w-md">
                {liveDifficulty.signals.join(' • ')}
              </div>
            </div>
          )}
        </motion.div>

        {/* Secondary Contextual Action: Run Demo */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--text-muted)] font-mono px-1">
          <div className="flex items-center gap-2">
            {onRunDemo && (
              <button
                type="button"
                onClick={onRunDemo}
                disabled={isDemoRunning}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-panel)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--border-medium)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer shadow-xs disabled:opacity-50 text-[11px] font-semibold"
                title="Run step-by-step benchmark demo"
              >
                <Play className={`w-3 h-3 text-[#ea580c] ${isDemoRunning ? 'animate-spin' : ''}`} />
                <span>{isDemoRunning ? 'Running Demo...' : 'Run Demo'}</span>
              </button>
            )}

            {onResetDemo && (
              <button
                type="button"
                onClick={onResetDemo}
                className="p-1.5 rounded-lg bg-[var(--bg-panel)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                title="Reset to benchmark Run #1042"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-3 text-[11px] text-[var(--text-muted)]">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
              <span>Zero prompt leakage</span>
            </span>
            <span>·</span>
            <span>Deterministic verification</span>
          </div>
        </div>

        {/* Faulty Repository Quick Preset Chips */}
        <div className="space-y-2 font-mono text-xs">
          <div className="text-[11px] text-[var(--text-muted)] font-semibold uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <FolderGit2 className="w-3.5 h-3.5 text-[#ea580c]" />
              <span>Or click a faulty repository benchmark to fix:</span>
            </span>
            <span className="text-[10px] text-[var(--text-muted)] lowercase">1-click clone & run</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                const text = 'Fix https://github.com/parishram-ai/auth-gateway-service: forward session token in client';
                setTaskPrompt(text);
                if (textareaRef.current) setTimeout(() => autoResize(textareaRef.current!), 0);
              }}
              className="p-2.5 rounded-lg bg-[var(--bg-panel)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[#ea580c]/50 text-left transition-colors cursor-pointer group shadow-xs"
            >
              <div className="flex items-center gap-1.5 text-[var(--text-primary)] group-hover:text-[#ea580c] font-semibold text-xs">
                <Link2 className="w-3 h-3 text-[#ea580c]" />
                <span className="truncate">auth-gateway-service</span>
              </div>
              <div className="text-[10px] text-[var(--text-muted)] mt-0.5 truncate font-sans">
                Token split null pointer bug
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                const text = 'Fix https://github.com/parishram-ai/redis-token-bucket: race condition deadlock on mutex retry';
                setTaskPrompt(text);
                if (textareaRef.current) setTimeout(() => autoResize(textareaRef.current!), 0);
              }}
              className="p-2.5 rounded-lg bg-[var(--bg-panel)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[#38bdf8]/50 text-left transition-colors cursor-pointer group shadow-xs"
            >
              <div className="flex items-center gap-1.5 text-[var(--text-primary)] group-hover:text-[#38bdf8] font-semibold text-xs">
                <Link2 className="w-3 h-3 text-[#38bdf8]" />
                <span className="truncate">redis-token-bucket</span>
              </div>
              <div className="text-[10px] text-[var(--text-muted)] mt-0.5 truncate font-sans">
                Concurrency mutex deadlock
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                const text = 'Fix https://github.com/parishram-ai/database-migrator: schema invariant violation on audit logs';
                setTaskPrompt(text);
                if (textareaRef.current) setTimeout(() => autoResize(textareaRef.current!), 0);
              }}
              className="p-2.5 rounded-lg bg-[var(--bg-panel)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[#10b981]/50 text-left transition-colors cursor-pointer group shadow-xs"
            >
              <div className="flex items-center gap-1.5 text-[var(--text-primary)] group-hover:text-[#10b981] font-semibold text-xs">
                <Link2 className="w-3 h-3 text-[#10b981]" />
                <span className="truncate">database-migrator</span>
              </div>
              <div className="text-[10px] text-[var(--text-muted)] mt-0.5 truncate font-sans">
                Schema invariant violation
              </div>
            </button>
          </div>
        </div>



        {/* Recent Runs List */}
        <div className="space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">
            <span>Recent Runs</span>
            <span>All Tasks Persisted</span>
          </div>

          <div className="space-y-1.5">
            {RECENT_RUNS.map((run) => (
              <button
                key={run.id}
                onClick={() => onOpenRun(run.number)}
                className="w-full p-3 rounded-lg bg-[var(--bg-panel)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--border-medium)] flex items-center justify-between text-left transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      run.status === 'VERIFIED' ? 'bg-[#10b981]' : 'bg-[#ef4444]'
                    }`}
                  />
                  <div>
                    <div className="font-semibold text-[var(--text-primary)] group-hover:text-[#ea580c] transition-colors">
                      {run.title}
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-2 mt-0.5">
                      <span>Run #{run.number}</span>
                      <span>·</span>
                      <span>{run.agentMode}</span>
                      <span>·</span>
                      <span>{run.filesCount} file changed</span>
                      <span>·</span>
                      <span>{run.duration}</span>
                      <span>·</span>
                      <span>{run.modelUsed}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      run.status === 'VERIFIED'
                        ? 'bg-[#10b981]/15 text-[#10b981]'
                        : 'bg-[#ef4444]/15 text-[#ef4444]'
                    }`}
                  >
                    {run.status}
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)] hidden sm:inline">
                    {run.timestamp}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Minimal System Status Footer */}
        <div className="pt-4 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-3 text-[11px] text-[var(--text-muted)] font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#10b981]" />
            <span className="text-[var(--text-secondary)]">All systems operational</span>
          </div>

          <div className="flex items-center gap-4">
            <span>Sandboxed chroot: active</span>
            <span>Deterministic harness: v2.4</span>
          </div>
        </div>
      </div>
    </div>
  );
}
