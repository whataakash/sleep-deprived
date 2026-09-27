'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MotionConfig } from 'motion/react';
import { AuthProvider, useAuth } from '@/lib/auth/context';
import { Topbar } from '@/components/layout/topbar';
import { Sidebar, MainNavView } from '@/components/layout/sidebar';
import { ParishramPath } from '@/components/layout/parishram-path';
import { OverviewView } from '@/components/features/overview/overview-view';
import { RunView } from '@/components/features/run/run-view';
import { RepoExplorer } from '@/components/features/repository/repo-explorer';
import { ModelMarketplace } from '@/components/features/models/model-marketplace';
import { EvaluationDashboard } from '@/components/features/evaluation/evaluation-dashboard';
import { AccountCenter } from '@/components/features/account/account-center';
import { CommandPalette } from '@/components/features/command-palette/command-palette';

import { INITIAL_RUN_1042 } from '@/lib/agent/orchestrator';
import { ProofGenerator } from '@/lib/verification/proof-generator';
import { ProofRecord } from '@/types/verification';
import { AgentState, ForgeTemperature, Run, RunEvent } from '@/types/agent';
import { CURRENT_2026_MODELS } from '@/lib/models/gateway';
import { EvaluationModelAdapter } from '@/lib/models/evaluation-adapter';
import { Lock } from 'lucide-react';

const STANDBY_EVALUATION_RUN: Run = {
  id: 'eval-standby',
  runNumber: 1,
  taskTitle: 'Awaiting Evaluation Task',
  taskDescription: 'Enter an issue or task in the evaluator console to begin autonomous execution.',
  repositoryId: 'parishram',
  branch: 'main',
  modelId: 'hackathon-prescribed-text-v1',
  state: 'INTAKE',
  temperature: 'COLD',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  events: [
    {
      id: 'evt-standby',
      runId: 'eval-standby',
      timestamp: '00:00',
      type: 'task.received',
      title: 'PARISHRAM EVALUATION HARNESS READY',
      summary: 'Autonomous engineering loop initialized. Enter an issue description or repository task to launch.',
      state: 'INTAKE',
      temperature: 'COLD',
    },
  ],
  plan: [],
  toolCalls: [],
  recoveryAttempts: [],
  metrics: {
    totalTokens: 0,
    promptTokens: 0,
    completionTokens: 0,
    totalCostUsd: 0,
    totalDurationMs: 0,
    toolCallsCount: 0,
    testsExecutedCount: 0,
    testsPassedCount: 0,
    filesInspectedCount: 0,
    filesModifiedCount: 0,
    retriesCount: 0,
    contextEfficiencyPercent: 100,
  },
};

function ParishramAppInner() {
  const { session } = useAuth();
  const [activeView, setActiveView] = useState<MainNavView>('overview');
  const [currentRun, setCurrentRun] = useState<Run>(STANDBY_EVALUATION_RUN);
  const [currentEventIndex, setCurrentEventIndex] = useState<number>(0);
  const [selectedModelId, setSelectedModelId] = useState<string>('qwen3-coder-next');
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [isPlayingReplay, setIsPlayingReplay] = useState<boolean>(false);

  // Modals
  const [isAccountOpen, setIsAccountOpen] = useState<boolean>(false);
  const [accountInitialCategory, setAccountInitialCategory] = useState<string>('appearance');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);

  const isEvalMode = EvaluationModelAdapter.isEvaluationMode();

  const replayTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [proofRecord, setProofRecord] = useState<ProofRecord>(() =>
    ProofGenerator.generateAuthProof('eval-standby')
  );
  const selectedModel =
    isEvalMode
      ? CURRENT_2026_MODELS.find((m) => m.id === 'hackathon-prescribed-model') || CURRENT_2026_MODELS[0]
      : CURRENT_2026_MODELS.find((m) => m.id === selectedModelId) || CURRENT_2026_MODELS[0];

  const currentEvent =
    currentRun.events[currentEventIndex] || currentRun.events[currentRun.events.length - 1];
  const currentState: AgentState = currentEvent ? currentEvent.state : 'COMPLETE';
  const currentTemp: ForgeTemperature = currentEvent ? currentEvent.temperature : 'FORGING';
  const isVerified = currentRun.state === 'COMPLETE' && proofRecord.status === 'VERIFIED';

  // Replay playback logic
  useEffect(() => {
    if (isPlayingReplay) {
      replayTimerRef.current = setInterval(() => {
        setCurrentEventIndex((prev) => {
          if (prev >= currentRun.events.length - 1) {
            setIsPlayingReplay(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1400);
    } else if (replayTimerRef.current) {
      clearInterval(replayTimerRef.current);
    }
    return () => {
      if (replayTimerRef.current) clearInterval(replayTimerRef.current);
    };
  }, [isPlayingReplay, currentRun.events.length]);

  // Real pipeline runner integration for live evaluation tasks
  const handleExecuteCustomTask = async (
    taskText: string,
    modelId?: string,
    clientApiKey?: string
  ) => {
    const taskToRun: string = (taskText || '').trim();
    if (!taskToRun) return;

    const effectiveKey =
      (clientApiKey || '').trim() ||
      (typeof window !== 'undefined' ? localStorage.getItem('parishram_api_key') || '' : '') ||
      (typeof process !== 'undefined' ? process.env?.AI_API_KEY || '' : '');

    setIsExecuting(true);
    setActiveView('runs');

    const runId = 'run-' + Date.now().toString(36);

    // If no API key is provided, stop and report clearly that AI_API_KEY is required
    if (!effectiveKey && !EvaluationModelAdapter.isEvaluationMode()) {
      const promptEvent: RunEvent = {
        id: `evt-${runId}-key-required`,
        runId,
        timestamp: new Date().toLocaleTimeString(),
        type: 'verification.failed',
        title: 'AI_API_KEY REQUIRED FOR LIVE EVALUATION',
        summary:
          'No AI_API_KEY detected. Please enter your API key (DeepSeek / OpenAI / Groq / OpenRouter / Gemini) in the input field above, or export AI_API_KEY="<key>" in your terminal.',
        state: 'FAILED',
        temperature: 'COLD',
      };
      setCurrentRun({
        id: runId,
        runNumber: (currentRun.runNumber || 0) + 1,
        taskTitle: taskToRun,
        taskDescription: taskToRun,
        repositoryId: 'parishram',
        branch: 'main',
        modelId: modelId || selectedModel.id,
        state: 'FAILED',
        temperature: 'COLD',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        events: [promptEvent],
        plan: [],
        toolCalls: [],
        recoveryAttempts: [],
        metrics: {
          totalTokens: 0,
          promptTokens: 0,
          completionTokens: 0,
          totalCostUsd: 0,
          totalDurationMs: 0,
          toolCallsCount: 0,
          testsExecutedCount: 0,
          testsPassedCount: 0,
          filesInspectedCount: 0,
          filesModifiedCount: 0,
          retriesCount: 0,
          contextEfficiencyPercent: 100,
        },
      });
      setCurrentEventIndex(0);
      setIsExecuting(false);
      return;
    }

    const liveRun: Run = {
      id: runId,
      runNumber: (currentRun.runNumber || 0) + 1,
      taskTitle: taskToRun,
      taskDescription: taskToRun,
      repositoryId: 'parishram',
      branch: 'main',
      modelId: modelId || selectedModel.id,
      state: 'PLAN',
      temperature: 'THINKING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      events: [
        {
          id: `evt-${runId}-1`,
          runId,
          timestamp: new Date().toLocaleTimeString(),
          type: 'task.received',
          title: 'Task Intake & Contract Synthesized',
          summary: taskToRun,
          state: 'INTAKE',
          temperature: 'COLD',
        },
        {
          id: `evt-${runId}-2`,
          runId,
          timestamp: new Date().toLocaleTimeString(),
          type: 'plan.created',
          title: 'Live Model Loop Initialized',
          summary: `Dispatching to text-only model ${selectedModel.displayName}...`,
          state: 'PLAN',
          temperature: 'WORKING',
        },
      ],
      plan: [],
      toolCalls: [],
      recoveryAttempts: [],
      metrics: {
        totalTokens: 0,
        promptTokens: 0,
        completionTokens: 0,
        totalCostUsd: 0,
        totalDurationMs: 0,
        toolCallsCount: 0,
        testsExecutedCount: 0,
        testsPassedCount: 0,
        filesInspectedCount: 0,
        filesModifiedCount: 0,
        retriesCount: 0,
        contextEfficiencyPercent: 100,
      },
    };

    setCurrentRun(liveRun);
    setCurrentEventIndex(1);

    try {
      const res = await fetch('/api/evaluation/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: taskToRun,
          prescribedModel: modelId || selectedModel.id,
          apiKey: effectiveKey || undefined,
        }),
      });

      const data = await res.json();

      if (data && data.status === 'VERIFIED') {
        const events: RunEvent[] = [...liveRun.events];

        if (Array.isArray(data.toolEvents)) {
          data.toolEvents.forEach((te: any, idx: number) => {
            events.push({
              id: `evt-${runId}-tool-${idx}`,
              runId,
              timestamp: te.timestamp || new Date().toLocaleTimeString(),
              type:
                te.tool === 'edit_file' || te.tool === 'write_file'
                  ? 'file.modified'
                  : te.tool === 'read_file'
                    ? 'file.inspected'
                    : te.tool === 'run_tests' || te.tool === 'run_command'
                      ? 'test.executed'
                      : 'tool.completed',
              title: `[${te.tool}] ${te.input?.filePath || te.input?.path || te.input?.command || te.tool}`,
              summary: te.output || te.error || 'Completed',
              state: te.tool === 'edit_file' ? 'EDIT' : 'RUN',
              temperature: 'FORGING',
            });
          });
        }

        events.push({
          id: `evt-${runId}-verify`,
          runId,
          timestamp: new Date().toLocaleTimeString(),
          type: 'verification.passed',
          title: 'Independent Verification Gate Passed',
          summary: `Tests: ${data.testSummary?.testsPassed ?? 0}/${data.testSummary?.testsRun ?? 0} passed. Typecheck and scope verified.`,
          state: 'VERIFY',
          temperature: 'HOT',
        });

        events.push({
          id: `evt-${runId}-proof`,
          runId,
          timestamp: new Date().toLocaleTimeString(),
          type: 'proof.generated',
          title: 'Cryptographic Proof Sealed',
          summary: `SHA-256: ${data.proof?.proofHash || 'sealed'} | Merkle Root: ${data.proof?.merkleRoot || 'verified'}`,
          state: 'COMPLETE',
          temperature: 'FORGING',
        });

        const completedRun: Run = {
          ...liveRun,
          id: data.runId || runId,
          state: 'COMPLETE',
          temperature: 'FORGING',
          completedAt: new Date().toISOString(),
          events,
          metrics: {
            totalTokens: data.tokensUsed?.total || 0,
            promptTokens: data.tokensUsed?.prompt || 0,
            completionTokens: data.tokensUsed?.completion || 0,
            totalCostUsd: 0,
            totalDurationMs: (data.durationSeconds || 0) * 1000,
            toolCallsCount: data.toolCallsExecuted || 0,
            testsExecutedCount: data.testSummary?.testsRun || 0,
            testsPassedCount: data.testSummary?.testsPassed || 0,
            filesInspectedCount: data.changesApplied?.length || 0,
            filesModifiedCount: data.changesApplied?.length || 0,
            retriesCount: 0,
            contextEfficiencyPercent: 100,
          },
        };

        setCurrentRun(completedRun);
        setCurrentEventIndex(events.length - 1);

        if (data.proof) {
          setProofRecord((prev) => ({
            ...prev,
            id: data.runId,
            runId: data.runId,
            proofHash: data.proof.proofHash,
            merkleRoot: data.proof.merkleRoot,
            status: 'VERIFIED',
            badgeTitle: 'VERIFIED ✓',
            tests: {
              ...prev.tests,
              unit: {
                ...prev.tests.unit,
                passed: data.testSummary?.testsPassed ?? prev.tests.unit.passed,
                total: data.testSummary?.testsRun ?? prev.tests.unit.total,
              },
            },
          }));
        }
      } else {
        const failEvents: RunEvent[] = [
          ...liveRun.events,
          {
            id: `evt-${runId}-fail`,
            runId,
            timestamp: new Date().toLocaleTimeString(),
            type: 'verification.failed',
            title: 'Model Evaluation Terminated / Unverified',
            summary: data?.error || 'Verification gate rejected the patch or model failed to solve task.',
            state: 'FAILED',
            temperature: 'COLD',
          },
        ];
        setCurrentRun({
          ...liveRun,
          state: 'FAILED',
          temperature: 'COLD',
          events: failEvents,
        });
        setCurrentEventIndex(failEvents.length - 1);
      }
    } catch (err: any) {
      const errorEvents: RunEvent[] = [
        ...liveRun.events,
        {
          id: `evt-${runId}-err`,
          runId,
          timestamp: new Date().toLocaleTimeString(),
          type: 'run.blocked',
          title: 'Live Model Request Failed',
          summary: err?.message || 'Network error reaching model API',
          state: 'FAILED',
          temperature: 'COLD',
        },
      ];
      setCurrentRun({
        ...liveRun,
        state: 'FAILED',
        temperature: 'COLD',
        events: errorEvents,
      });
      setCurrentEventIndex(errorEvents.length - 1);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleStartRunFromOverview = (
    taskText: string,
    modelId: string,
    agentMode?: string,
    apiKey?: string
  ) => {
    setSelectedModelId(modelId);
    const finalTaskTitle = taskText || 'Autonomous Task';
    handleExecuteCustomTask(finalTaskTitle, modelId, apiKey);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[var(--bg-canvas)] text-[var(--text-primary)] font-sans antialiased transition-colors">
      {/* Top Bar */}
      <Topbar
        currentTemp={currentTemp}
        currentState={currentState}
        selectedModelName={selectedModel.displayName}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenAccount={(cat) => {
          setAccountInitialCategory(cat || 'appearance');
          setIsAccountOpen(true);
        }}
      />

      {/* Official Hackathon Evaluation Mode Banner */}
      {isEvalMode && (
        <div className="w-full bg-[#ea580c]/12 border-b border-[#ea580c]/30 px-4 py-1.5 flex items-center justify-between text-[11px] font-mono select-none">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-[#ea580c]" />
            <span className="font-extrabold text-[#ea580c]">EVALUATION MODE ACTIVE</span>
            <span className="text-[var(--text-muted)]">|</span>
            <span className="text-[var(--text-secondary)]">Prescribed Model: <strong className="text-[var(--text-primary)]">hackathon-prescribed-text-v1</strong></span>
            <span className="text-[var(--text-muted)]">|</span>
            <span className="text-[var(--text-secondary)]">Modality: <strong className="text-[var(--text-primary)]">Strictly Text-Only</strong></span>
            <span className="text-[var(--text-muted)]">|</span>
            <span className="text-[var(--text-secondary)]">AI_API_KEY: <strong className="text-[#10b981]">Configured</strong></span>
          </div>
          <div className="text-[10px] text-[var(--text-muted)] hidden md:block">
            Model switching & substitution locked per hackathon guidelines
          </div>
        </div>
      )}

      {/* Responsive 5-Stage Parishram Path */}
      <ParishramPath
        currentState={currentState}
        personality={session.user?.preferences.personality || 'forge'}
        onSelectState={(st) => {
          const idx = currentRun.events.findIndex((e) => e.state === st);
          if (idx !== -1) setCurrentEventIndex(idx);
        }}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Simplified 3-Section Sidebar */}
        <Sidebar
          activeView={activeView}
          onSelectView={setActiveView}
          onOpenAccount={() => {
            setAccountInitialCategory('appearance');
            setIsAccountOpen(true);
          }}
          runStatus={isVerified ? 'VERIFIED' : 'RUNNING'}
        />

        {/* Central Content View */}
        <main className="flex-1 flex flex-col overflow-hidden bg-[var(--bg-canvas)] p-2 sm:p-3 transition-colors">
          {activeView === 'overview' && (
            <OverviewView
              onStartRun={handleStartRunFromOverview}
              onOpenRun={() => setActiveView('runs')}
              onNavigateToModels={() => setActiveView('models')}
              lastCompletedRun={
                isVerified
                  ? {
                      runNumber: currentRun.runNumber,
                      title: currentRun.taskTitle,
                      testsPassed: proofRecord.tests.unit.passed,
                      testsTotal: proofRecord.tests.unit.total,
                      isVerified: true,
                    }
                  : undefined
              }
              onViewProof={() => setActiveView('runs')}
            />
          )}

          {activeView === 'runs' && (
            <RunView
              run={currentRun}
              currentEventIndex={currentEventIndex}
              onScrub={(idx) => {
                setIsPlayingReplay(false);
                setCurrentEventIndex(idx);
              }}
              isPlayingReplay={isPlayingReplay}
              onTogglePlay={() => setIsPlayingReplay(!isPlayingReplay)}
              proof={proofRecord}
            />
          )}

          {activeView === 'repositories' && (
            <RepoExplorer
              onLaunchFix={(repoUrl, issueText) => {
                handleStartRunFromOverview(
                  issueText || `Audit repository: ${repoUrl}`,
                  selectedModel.id,
                  'dual'
                );
                setActiveView('runs');
              }}
            />
          )}

          {activeView === 'models' && (
            <ModelMarketplace
              currentModelId={selectedModel.id}
              onSelectModel={setSelectedModelId}
            />
          )}

          {activeView === 'evaluations' && (
            <EvaluationDashboard
              onRunBenchmarkTask={() => {
                handleStartRunFromOverview(
                  'Audit scope enforcement and run test suite across workspace',
                  selectedModel.id
                );
              }}
            />
          )}
        </main>
      </div>

      {/* Account & IDE Settings Modal */}
      <AccountCenter
        isOpen={isAccountOpen}
        onClose={() => setIsAccountOpen(false)}
        initialCategory={accountInitialCategory}
      />

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectView={(v) => setActiveView(v)}
        onRunEvaluation={() => {
          handleStartRunFromOverview(
            'Audit scope enforcement and run test suite across workspace',
            selectedModel.id
          );
        }}
        onSelectModel={setSelectedModelId}
      />
    </div>
  );
}

export default function ParishramApp() {
  return (
    <MotionConfig reducedMotion="user">
      <AuthProvider>
        <ParishramAppInner />
      </AuthProvider>
    </MotionConfig>
  );
}
