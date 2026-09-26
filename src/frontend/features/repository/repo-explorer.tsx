'use client';

import React, { useState } from 'react';
import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  Search,
  Layers,
  HelpCircle,
  Eye,
  GitBranch,
  Link2,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  ArrowRight,
  ExternalLink,
  FolderGit2,
  Terminal,
} from 'lucide-react';
import { RepoFile, ASTSymbol, WhyThisFile } from '@/types/repository';
import { MOCK_REPO_FILES, MOCK_SYMBOLS, MOCK_WHY_THIS_FILE, findFileContent } from '@/lib/repository/mock-repo';
import { MemoryView } from '../memory/memory-view';
import { DocsPanel } from '../run/docs-panel';

interface RepoExplorerProps {
  onSelectWhyFile?: (filePath: string) => void;
  onLaunchFix?: (repoUrl: string, issueText: string) => void;
}

export function RepoExplorer({ onSelectWhyFile, onLaunchFix }: RepoExplorerProps) {
  const [selectedFilePath, setSelectedFilePath] = useState('src/auth/token-validator.ts');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    src: true,
    'src/auth': true,
    tests: true,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'files' | 'symbols' | 'memory' | 'docs'>('files');

  // Faulty Repo Connection State
  const [repoUrlInput, setRepoUrlInput] = useState('https://github.com/parishram-ai/auth-gateway-service');
  const [issueInput, setIssueInput] = useState('Fix unhandled null pointer when Authorization header is malformed in auth-gateway-service');
  const [isConnected, setIsConnected] = useState(true);
  const [isCloning, setIsCloning] = useState(false);
  const [cloneStatusMessage, setCloneStatusMessage] = useState<string | null>(null);

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [path]: !prev[path],
    }));
  };

  const currentContent = findFileContent(selectedFilePath);
  const currentWhy = MOCK_WHY_THIS_FILE[selectedFilePath];

  const filteredSymbols = MOCK_SYMBOLS.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCloneRepo = () => {
    if (!repoUrlInput.trim()) return;
    setIsCloning(true);
    setCloneStatusMessage('Cloning remote repository and ingesting AST call trees...');
    setTimeout(() => {
      setIsCloning(false);
      setIsConnected(true);
      setCloneStatusMessage('Repository cloned into Parishram sandbox. 28 files indexed, 1 invariant regression detected.');
      setTimeout(() => setCloneStatusMessage(null), 4000);
    }, 800);
  };

  const handleTriggerFix = () => {
    if (onLaunchFix) {
      onLaunchFix(repoUrlInput, issueInput);
    }
  };

  const loadPreset = (presetRepo: string, presetIssue: string) => {
    setRepoUrlInput(presetRepo);
    setIssueInput(presetIssue);
    setIsConnected(true);
  };

  return (
    <div className="flex-1 flex flex-col bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl overflow-hidden transition-colors">
      {/* ==================================================================== */}
      {/* FAULTY REPOSITORY INTAKE & CONNECTION BANNER                         */}
      {/* ==================================================================== */}
      <div className="p-4 bg-gradient-to-r from-[var(--bg-elevated)] via-[var(--bg-panel)] to-[var(--bg-canvas)] border-b border-[var(--border-subtle)] space-y-3 font-mono text-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-[#ea580c]/12 border border-[#ea580c]/30 text-[#ea580c]">
              <Link2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-[var(--text-primary)] tracking-wide">
                  CONNECT FAULTY REPOSITORY
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#10b981]/15 text-[#10b981] font-bold border border-[#10b981]/30">
                  Ready for AI Fix
                </span>
              </div>
              <div className="text-[11px] text-[var(--text-muted)] font-sans mt-0.5">
                Paste any GitHub repository link or issue URL. Parishram AI will clone the codebase, map AST symbols, and autonomously execute verified repairs.
              </div>
            </div>
          </div>

          {/* Quick presets */}
          <div className="flex items-center gap-1 text-[11px]">
            <span className="text-[var(--text-muted)]">Presets:</span>
            <button
              onClick={() =>
                loadPreset(
                  'https://github.com/parishram-ai/auth-gateway-service',
                  'Fix unhandled null pointer when Authorization header is malformed in auth-gateway-service'
                )
              }
              className="px-2 py-0.5 rounded bg-[var(--bg-canvas)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] cursor-pointer"
            >
              auth-gateway
            </button>
            <button
              onClick={() =>
                loadPreset(
                  'https://github.com/parishram-ai/redis-token-bucket',
                  'Resolve Redis mutex deadlock and race condition under concurrency'
                )
              }
              className="px-2 py-0.5 rounded bg-[var(--bg-canvas)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] cursor-pointer"
            >
              redis-mutex
            </button>
          </div>
        </div>

        {/* Inputs row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2 pt-1">
          <div className="md:col-span-6 flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)]">
            <Github className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
            <input
              type="text"
              value={repoUrlInput}
              onChange={(e) => setRepoUrlInput(e.target.value)}
              placeholder="Paste GitHub repository URL (e.g. https://github.com/org/faulty-repo)"
              className="w-full bg-transparent text-[var(--text-primary)] outline-none text-xs font-mono"
            />
          </div>

          <div className="md:col-span-6 flex gap-2">
            <input
              type="text"
              value={issueInput}
              onChange={(e) => setIssueInput(e.target.value)}
              placeholder="Failing issue, test, or bug description..."
              className="flex-1 px-3 py-2 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--text-primary)] outline-none text-xs font-mono"
            />

            <button
              onClick={handleTriggerFix}
              disabled={isCloning}
              className="px-4 py-2 rounded-lg bg-[#ea580c] hover:bg-[#f97316] text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-xs active:scale-98 transition-all shrink-0"
              title="Launch autonomous repair on this repository"
            >
              <Zap className="w-3.5 h-3.5 fill-white" />
              <span>Fix with Parishram AI</span>
            </button>
          </div>
        </div>

        {cloneStatusMessage && (
          <div className="p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{cloneStatusMessage}</span>
          </div>
        )}
      </div>

      {/* Top Bar with Context Telemetry & Tabs */}
      <div className="p-3 bg-[var(--bg-elevated)] border-b border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-semibold text-[var(--text-primary)]">
            <Layers className="w-4 h-4 text-[#ea580c]" />
            <span>Repository Context Engine</span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
            <span className="text-[var(--text-primary)] font-bold">auth-gateway-service:main</span>
            <span>·</span>
            <span>28 files</span>
            <span>·</span>
            <span className="text-[#38bdf8]">17 inspected</span>
            <span>·</span>
            <span className="text-[#10b981] font-semibold">4 relevant</span>
            <span>·</span>
            <span className="px-1.5 py-0.5 rounded bg-[#10b981]/15 text-[#10b981] font-bold">
              88% context efficiency
            </span>
          </div>
        </div>

        {/* Tab switcher: Files vs Symbols vs Memory vs Docs */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('files')}
            className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
              activeTab === 'files'
                ? 'bg-[#ea580c] text-white font-semibold'
                : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-active)] hover:text-[var(--text-primary)]'
            }`}
          >
            File Tree
          </button>
          <button
            onClick={() => setActiveTab('symbols')}
            className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
              activeTab === 'symbols'
                ? 'bg-[#ea580c] text-white font-semibold'
                : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-active)] hover:text-[var(--text-primary)]'
            }`}
          >
            AST Symbols
          </button>
          <button
            onClick={() => setActiveTab('memory')}
            className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
              activeTab === 'memory'
                ? 'bg-[#ea580c] text-white font-semibold'
                : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-active)] hover:text-[var(--text-primary)]'
            }`}
          >
            Repo Memory
          </button>
          <button
            onClick={() => setActiveTab('docs')}
            className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
              activeTab === 'docs'
                ? 'bg-[#ea580c] text-white font-semibold'
                : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-active)] hover:text-[var(--text-primary)]'
            }`}
          >
            Auto Docs
          </button>
        </div>
      </div>

      {activeTab === 'memory' ? (
        <div className="flex-1 overflow-hidden p-3">
          <MemoryView />
        </div>
      ) : activeTab === 'docs' ? (
        <div className="flex-1 overflow-hidden p-3">
          <DocsPanel />
        </div>
      ) : (
        /* Main Split: Left Tree, Right Preview */
        <div className="flex-1 flex overflow-hidden">
          {/* Left pane: File tree / Symbol list */}
          <div className="w-72 bg-[var(--bg-canvas)] border-r border-[var(--border-subtle)] flex flex-col shrink-0 font-mono text-xs">
            {/* Search box */}
            <div className="p-2 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[11px]">
                <Search className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder={activeTab === 'files' ? 'Filter files...' : 'Filter symbols...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
              {activeTab === 'files' ? (
                <RenderFileTree
                  files={MOCK_REPO_FILES}
                  selectedFilePath={selectedFilePath}
                  onSelectFile={setSelectedFilePath}
                  expandedFolders={expandedFolders}
                  onToggleFolder={toggleFolder}
                  searchQuery={searchQuery}
                />
              ) : (
                <div className="space-y-1">
                  {filteredSymbols.map((sym) => (
                    <button
                      key={`${sym.filePath}-${sym.name}`}
                      onClick={() => setSelectedFilePath(sym.filePath)}
                      className="w-full p-2 rounded text-left bg-[var(--bg-panel)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[var(--text-primary)] truncate">{sym.name}</span>
                        <span className="text-[10px] text-[#38bdf8] uppercase font-bold">{sym.kind}</span>
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)] truncate">
                        {sym.filePath}:{sym.line}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right pane: Code Preview & "Why this file?" */}
          <div className="flex-1 flex flex-col bg-[var(--code-bg)] overflow-hidden">
            {/* File header with "Why this file?" banner if applicable */}
            <div className="p-3 bg-[var(--bg-elevated)] border-b border-[var(--border-subtle)] flex items-center justify-between font-mono text-xs">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-[#38bdf8]" />
                <span className="font-semibold text-[var(--text-primary)]">{selectedFilePath}</span>
              </div>

              {currentWhy && (
                <button
                  onClick={() => onSelectWhyFile && onSelectWhyFile(selectedFilePath)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#ea580c]/15 hover:bg-[#ea580c]/25 border border-[#ea580c]/30 text-[#ea580c] text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Why This File? ({currentWhy.relevanceScore}% Relevance)</span>
                </button>
              )}
            </div>

            {/* Code Viewer with Line Numbers */}
            <div className="flex-1 overflow-y-auto p-4 font-mono text-xs text-[var(--text-secondary)] select-text">
              <pre className="line-numbers whitespace-pre leading-relaxed">
                {currentContent.split('\n').map((line, idx) => (
                  <div key={idx} className="flex hover:bg-[var(--bg-subtle)] transition-colors">
                    <span className="w-10 text-right pr-4 text-[var(--text-muted)] select-none text-[11px]">
                      {idx + 1}
                    </span>
                    <span className="text-[var(--text-primary)]">{line}</span>
                  </div>
                ))}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RenderFileTree({
  files,
  selectedFilePath,
  onSelectFile,
  expandedFolders,
  onToggleFolder,
  searchQuery,
  depth = 0,
}: {
  files: RepoFile[];
  selectedFilePath: string;
  onSelectFile: (path: string) => void;
  expandedFolders: Record<string, boolean>;
  onToggleFolder: (path: string) => void;
  searchQuery: string;
  depth?: number;
}) {
  return (
    <div className="space-y-0.5">
      {files.map((file) => {
        const isSelected = file.path === selectedFilePath;
        const isWhyRelevant = !!MOCK_WHY_THIS_FILE[file.path];
        const isExpanded = expandedFolders[file.path];

        if (
          searchQuery &&
          !file.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !file.isDirectory
        ) {
          return null;
        }

        if (file.isDirectory) {
          return (
            <div key={file.path}>
              <button
                onClick={() => onToggleFolder(file.path)}
                style={{ paddingLeft: `${depth * 12 + 8}px` }}
                className="w-full flex items-center gap-2 py-1.5 rounded hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors text-left cursor-pointer"
              >
                {isExpanded ? (
                  <FolderOpen className="w-3.5 h-3.5 text-[#fbbf24] shrink-0" />
                ) : (
                  <Folder className="w-3.5 h-3.5 text-[#fbbf24] shrink-0" />
                )}
                <span className="truncate">{file.name}</span>
              </button>

              {isExpanded && file.children && (
                <RenderFileTree
                  files={file.children}
                  selectedFilePath={selectedFilePath}
                  onSelectFile={onSelectFile}
                  expandedFolders={expandedFolders}
                  onToggleFolder={onToggleFolder}
                  searchQuery={searchQuery}
                  depth={depth + 1}
                />
              )}
            </div>
          );
        }

        return (
          <button
            key={file.path}
            onClick={() => onSelectFile(file.path)}
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
            className={`w-full flex items-center justify-between py-1.5 pr-2 rounded text-left transition-colors cursor-pointer ${
              isSelected
                ? 'bg-[#ea580c]/15 text-[#ea580c] font-semibold'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]'
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              <FileCode className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
              <span className="truncate">{file.name}</span>
            </div>

            {isWhyRelevant && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#ea580c] shrink-0" title="Key context file" />
            )}
          </button>
        );
      })}
    </div>
  );
}
