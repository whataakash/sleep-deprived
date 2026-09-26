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
import { DownloadModal } from '@/components/features/download/download-modal';
import { UpgradeModal } from '@/components/features/billing/upgrade-modal';

import { INITIAL_RUN_1042 } from '@/lib/agent/orchestrator';
import { ProofGenerator } from '@/lib/verification/proof-generator';
import { AgentState, ForgeTemperature, Run } from '@/types/agent';
import { CURRENT_2026_MODELS } from '@/lib/models/gateway';
import { EvaluationModelAdapter } from '@/lib/models/evaluation-adapter';
import { Lock } from 'lucide-react';
import { AuthScreen } from '@/components/features/auth/auth-screen';

function ParishramAppInner() {
  const { session } = useAuth();
  const [activeView, setActiveView] = useState<MainNavView>('overview');
  const [currentRun, setCurrentRun] = useState<Run>(INITIAL_RUN_1042);
  const [currentEventIndex, setCurrentEventIndex] = useState<number>(
    INITIAL_RUN_1042.events.length - 1
  );
  const [selectedModelId, setSelectedModelId] = useState<string>('qwen3-coder-next');
  const [isDemoRunning, setIsDemoRunning] = useState<boolean>(false);
  const [isPlayingReplay, setIsPlayingReplay] = useState<boolean>(false);

  // Modals
  const [isAccountOpen, setIsAccountOpen] = useState<boolean>(false);
  const [accountInitialCategory, setAccountInitialCategory] = useState<string>('general');
  const [isDownloadOpen, setIsDownloadOpen] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState<boolean>(false);

  const isEvalMode = EvaluationModelAdapter.isEvaluationMode();

  const replayTimerRef = useRef<NodeJS.Timeout | null>(null);

  const proofRecord = ProofGenerator.generateAuthProof(currentRun.id);
  const selectedModel =
    isEvalMode
      ? CURRENT_2026_MODELS.find((m) => m.id === 'hackathon-prescribed-model') || CURRENT_2026_MODELS[0]
      : CURRENT_2026_MODELS.find((m) => m.id === selectedModelId) || CURRENT_2026_MODELS[0];

  const currentEvent =
    currentRun.events[currentEventIndex] || currentRun.events[currentRun.events.length - 1];
  const currentState: AgentState = currentEvent ? currentEvent.state : 'COMPLETE';
  const currentTemp: ForgeTemperature = currentEvent ? currentEvent.temperature : 'FORGING';
  const isVerified = currentEventIndex >= currentRun.events.length - 2;

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

  // Demo step-by-step runner
  const handleRunDemo = () => {
    setIsDemoRunning(true);
    setCurrentEventIndex(0);
    setActiveView('runs');

    let step = 0;
    const interval = setInterval(() => {
      step += 1;
      if (step < currentRun.events.length) {
        setCurrentEventIndex(step);
      } else {
        clearInterval(interval);
        setIsDemoRunning(false);
      }
    }, 1600);
  };

  const handleResetDemo = () => {
    setIsDemoRunning(false);
    setIsPlayingReplay(false);
    setCurrentEventIndex(INITIAL_RUN_1042.events.length - 1);
  };

  const handleStartRunFromOverview = (taskText: string, modelId: string, agentMode?: string) => {
    setSelectedModelId(modelId);
    setCurrentRun((prev) => ({
      ...prev,
      taskTitle: taskText,
      modelId,
    }));
    handleRunDemo();
  };

  if (!session.isAuthenticated || !session.user) {
    return <AuthScreen />;
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[var(--bg-canvas)] text-[var(--text-primary)] font-sans antialiased transition-colors">
      {/* Top Bar */}
      <Topbar
        currentTemp={currentTemp}
        currentState={currentState}
        selectedModelName={selectedModel.displayName}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenAccount={(cat) => {
          setAccountInitialCategory(cat || 'general');
          setIsAccountOpen(true);
        }}
        onOpenDownload={() => setIsDownloadOpen(true)}
        onOpenUpgrade={() => setIsUpgradeOpen(true)}
        onRunDemo={handleRunDemo}
        onResetDemo={handleResetDemo}
        isDemoRunning={isDemoRunning}
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
            setAccountInitialCategory('general');
            setIsAccountOpen(true);
          }}
          onOpenDownload={() => setIsDownloadOpen(true)}
          onOpenUpgrade={() => setIsUpgradeOpen(true)}
          runStatus={isVerified ? 'VERIFIED' : 'RUNNING'}
        />

        {/* Central Content View */}
        <main className="flex-1 flex flex-col overflow-hidden bg-[var(--bg-canvas)] p-2 sm:p-3 transition-colors">
          {activeView === 'overview' && (
            <OverviewView
              onStartRun={handleStartRunFromOverview}
              onOpenRun={() => setActiveView('runs')}
              onOpenBilling={() => {
                setAccountInitialCategory('billing');
                setIsAccountOpen(true);
              }}
              onOpenUpgrade={() => setIsUpgradeOpen(true)}
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

          {activeView === 'repositories' && <RepoExplorer />}

          {activeView === 'models' && (
            <ModelMarketplace
              currentModelId={selectedModel.id}
              onSelectModel={setSelectedModelId}
              onOpenAccountKeys={() => {
                setAccountInitialCategory('ai');
                setIsAccountOpen(true);
              }}
              onOpenUpgrade={() => setIsUpgradeOpen(true)}
            />
          )}

          {activeView === 'evaluations' && (
            <EvaluationDashboard
              onRunBenchmarkTask={() => {
                setActiveView('runs');
                handleRunDemo();
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

      {/* Upgrade & Payment Modal (Claude 2-step flow) */}
      <UpgradeModal
        isOpen={isUpgradeOpen}
        onClose={() => setIsUpgradeOpen(false)}
      />

      {/* Download Parishram Desktop Modal */}
      <DownloadModal isOpen={isDownloadOpen} onClose={() => setIsDownloadOpen(false)} />

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectView={(v) => setActiveView(v)}
        onRunDemo={handleRunDemo}
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
