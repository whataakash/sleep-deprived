'use client';

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  Paperclip,
  X,
  FileText,
  FileCode,
  Image as ImageIcon,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { getPlanDisplay } from '@/lib/billing/plans';
import { ParishramAIRouter } from '@/lib/models/gateway';

export interface AttachmentItem {
  id: string;
  name: string;
  size: number;
  formattedSize: string;
  type: string;
  isImage: boolean;
  previewUrl?: string;
  file: File;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function sanitizeFileName(name: string): string {
  const parts = name.split(/[/\\]/);
  return parts[parts.length - 1] || name;
}

interface OverviewViewProps {
  onStartRun: (taskText: string, modelId: string, agentMode?: string, attachments?: AttachmentItem[]) => void;
  onOpenRun?: (runNumber: number) => void;
  onOpenBilling?: () => void;
  onOpenUpgrade?: () => void;
  onRunDemo?: () => void;
  isDemoRunning?: boolean;
  onResetDemo?: () => void;
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
  onOpenBilling,
  onOpenUpgrade,
  onRunDemo,
  isDemoRunning,
  onResetDemo,
  onNavigateToModels,
  lastCompletedRun,
  onViewProof,
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

  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((files: FileList | File[] | null) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);

    const newAttachments: AttachmentItem[] = fileArray.map((f) => {
      const cleanName = sanitizeFileName(f.name);
      const isImg = f.type.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)$/i.test(cleanName);
      let previewUrl: string | undefined = undefined;
      if (isImg && typeof window !== 'undefined' && typeof URL !== 'undefined' && URL.createObjectURL) {
        try {
          previewUrl = URL.createObjectURL(f);
        } catch {
          // ignore
        }
      }
      return {
        id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: cleanName,
        size: f.size,
        formattedSize: formatFileSize(f.size),
        type: f.type,
        isImage: isImg,
        previewUrl,
        file: f,
      };
    });

    setAttachments((prev) => [...prev, ...newAttachments]);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        addFiles(e.target.files);
        e.target.value = '';
      }
    },
    [addFiles]
  );

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => {
      const target = prev.find((a) => a.id === id);
      if (target?.previewUrl) {
        try {
          URL.revokeObjectURL(target.previewUrl);
        } catch {
          // ignore
        }
      }
      return prev.filter((a) => a.id !== id);
    });
  }, []);

  useEffect(() => {
    return () => {
      attachments.forEach((a) => {
        if (a.previewUrl) {
          try {
            URL.revokeObjectURL(a.previewUrl);
          } catch {
            // ignore
          }
        }
      });
    };
  }, [attachments]);

  const handleSubmitTask = useCallback(() => {
    if (taskPrompt.trim() || attachments.length > 0) {
      onStartRun(taskPrompt, selectedModelId, selectedAgentMode, attachments);
      setTaskPrompt('');
      setAttachments([]);
    }
  }, [taskPrompt, attachments, selectedModelId, selectedAgentMode, onStartRun]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmitTask();
      }
    },
    [handleSubmitTask]
  );

  const runsUsed = user?.usage.runsUsedThisMonth || 14;
  const maxRuns = typeof user?.usage.maxMonthlyRuns === 'number' ? user.usage.maxMonthlyRuns : 25;
  const usagePercent = Math.min(100, Math.round((runsUsed / maxRuns) * 100));

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

        {/* Task Intake Box — auto-growing, motion-animated */}
        <motion.div
          layout
          transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              addFiles(e.dataTransfer.files);
            }
          }}
          className={`bg-[var(--bg-panel)] border rounded-xl p-4 shadow-sm transition-all flex flex-col gap-0 ${
            isDragging
              ? 'border-[#ea580c] ring-2 ring-[#ea580c]/30 bg-[#ea580c]/5'
              : 'border-[var(--border-subtle)] focus-within:border-[var(--border-medium)]'
          }`}
        >
          {detectedRepo && (
            <div className="mb-2.5 px-3 py-1.5 rounded-lg bg-[#ea580c]/10 border border-[#ea580c]/25 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2 truncate">
                <Link2 className="w-3.5 h-3.5 text-[#ea580c] shrink-0" />
                <span className="text-[var(--text-muted)] text-[11px]">TARGET REPO:</span>
                <span className="font-bold text-[var(--text-primary)] truncate">
                  {detectedRepo.owner}/{detectedRepo.repo} {detectedRepo.issueNum ? `(#${detectedRepo.issueNum})` : ''}
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30 shrink-0">
                Detected
              </span>
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={taskPrompt}
            onChange={handlePromptChange}
            onKeyDown={handleKeyDown}
            placeholder="How can I help you today?"
            aria-label="Task prompt"
            style={{
              minHeight: '3.5rem',
              maxHeight: '13rem',
              height: 'auto',
              overflowY: taskPrompt ? 'auto' : 'hidden',
            }}
            className="w-full bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none resize-none leading-relaxed font-sans"
          />

          {/* Attachment Chips Area inside composer */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-2 pb-1 border-t border-[var(--border-subtle)] mt-2">
              <AnimatePresence mode="popLayout">
                {attachments.map((att) => (
                  <motion.div
                    key={att.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.15 }}
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[11px] font-mono text-[var(--text-secondary)] shadow-2xs max-w-[220px]"
                  >
                    {att.isImage && att.previewUrl ? (
                      <img
                        src={att.previewUrl}
                        alt=""
                        className="w-3.5 h-3.5 object-cover rounded shrink-0 border border-[var(--border-subtle)]"
                      />
                    ) : /\.(ts|tsx|js|jsx|py|go|rs|c|cpp|java|html|css|sql|json|ya?ml)$/i.test(att.name) ? (
                      <FileCode className="w-3.5 h-3.5 text-[#38bdf8] shrink-0" />
                    ) : (
                      <FileText className="w-3.5 h-3.5 text-[#10b981] shrink-0" />
                    )}
                    <span className="truncate" title={att.name}>{att.name}</span>
                    <span className="text-[9px] text-[var(--text-muted)] shrink-0">({att.formattedSize})</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(att.id)}
                      className="p-0.5 hover:bg-[var(--bg-subtle)] text-[var(--text-muted)] hover:text-[#ef4444] rounded transition-colors cursor-pointer shrink-0"
                      aria-label={`Remove attachment ${att.name}`}
                      title="Remove attachment"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          <div className="pt-3 mt-1 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
            {/* Left Controls: File Attachment Button + Model Picker */}
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="*/*"
                onChange={handleFileSelect}
                className="hidden"
                aria-label="Attach local files"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Attach local files"
                title="Attach local files"
                className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] border border-[var(--border-subtle)] hover:border-[var(--border-medium)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer shadow-2xs group"
              >
                <Paperclip className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--text-primary)]" />
              </button>

              {/* Model Picker */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[11px]">
                <Cpu className="w-3 h-3 text-[#38bdf8]" />
                <select
                  value={selectedModelId}
                  onChange={(e) => setSelectedModelId(e.target.value)}
                  className="bg-transparent text-[var(--text-primary)] outline-none cursor-pointer"
                >
                  <option value="qwen3-coder-next" className="bg-[var(--bg-panel)] text-[var(--text-primary)]">
                    Qwen3-Coder-Next
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

            {/* Right Controls: Functional Microphone & Send Arrow */}
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
                onClick={handleSubmitTask}
                aria-label="Send task"
                title="Send task"
                className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#ea580c] hover:bg-[#f97316] text-white transition-all shadow-xs active:scale-[0.98] motion-reduce:active:scale-100 cursor-pointer min-w-[36px] min-h-[36px]"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
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

        {/* Recent Work / Sample Benchmarks */}
        <div className="space-y-2.5 pt-2">
          <div className="flex items-center justify-between text-xs font-mono text-[var(--text-muted)]">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Recent Work</span>
            <span className="text-[10px]">Click to load</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                const text = 'Fix https://github.com/parishram-ai/auth-gateway-service: forward session token in client';
                setTaskPrompt(text);
                if (textareaRef.current) setTimeout(() => autoResize(textareaRef.current!), 0);
              }}
              className="p-3 rounded-xl bg-[var(--bg-panel)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[#ea580c]/40 text-left transition-all cursor-pointer group shadow-2xs"
            >
              <div className="flex items-center gap-1.5 text-[var(--text-primary)] group-hover:text-[#ea580c] font-semibold text-xs font-mono">
                <FolderGit2 className="w-3.5 h-3.5 text-[#ea580c]" />
                <span className="truncate">auth-gateway-service</span>
              </div>
              <div className="text-[11px] text-[var(--text-muted)] mt-1 truncate font-sans">
                Forward session token in client
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                const text = 'Fix https://github.com/parishram-ai/redis-token-bucket: race condition deadlock on mutex retry';
                setTaskPrompt(text);
                if (textareaRef.current) setTimeout(() => autoResize(textareaRef.current!), 0);
              }}
              className="p-3 rounded-xl bg-[var(--bg-panel)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[#38bdf8]/40 text-left transition-all cursor-pointer group shadow-2xs"
            >
              <div className="flex items-center gap-1.5 text-[var(--text-primary)] group-hover:text-[#38bdf8] font-semibold text-xs font-mono">
                <FolderGit2 className="w-3.5 h-3.5 text-[#38bdf8]" />
                <span className="truncate">redis-token-bucket</span>
              </div>
              <div className="text-[11px] text-[var(--text-muted)] mt-1 truncate font-sans">
                Mutex deadlock on retry
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                const text = 'Fix https://github.com/parishram-ai/database-migrator: schema invariant violation on audit logs';
                setTaskPrompt(text);
                if (textareaRef.current) setTimeout(() => autoResize(textareaRef.current!), 0);
              }}
              className="p-3 rounded-xl bg-[var(--bg-panel)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[#10b981]/40 text-left transition-all cursor-pointer group shadow-2xs"
            >
              <div className="flex items-center gap-1.5 text-[var(--text-primary)] group-hover:text-[#10b981] font-semibold text-xs font-mono">
                <FolderGit2 className="w-3.5 h-3.5 text-[#10b981]" />
                <span className="truncate">database-migrator</span>
              </div>
              <div className="text-[11px] text-[var(--text-muted)] mt-1 truncate font-sans">
                Schema invariant verification
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
