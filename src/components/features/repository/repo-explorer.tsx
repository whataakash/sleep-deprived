'use client';

import React, { useState, useEffect } from 'react';
import {
  Folder,
  FolderOpen,
  FileCode,
  Search,
  Layers,
  HelpCircle,
  Link2,
  CheckCircle2,
  Play,
} from 'lucide-react';
import { RepoFile } from '@/types/repository';
import { MemoryView } from '../memory/memory-view';
import { DocsPanel } from '../run/docs-panel';

interface RepoExplorerProps {
  onSelectWhyFile?: (filePath: string) => void;
  onLaunchFix?: (repoUrl: string, issueText: string) => void;
}

export function RepoExplorer({ onSelectWhyFile, onLaunchFix }: RepoExplorerProps) {
  const [repoFiles, setRepoFiles] = useState<RepoFile[]>([]);
  const [repoName, setRepoName] = useState<string>('sleep-deprived');
  const [repoRoot, setRepoRoot] = useState<string>('');
  const [selectedFilePath, setSelectedFilePath] = useState<string>('package.json');
  const [fileContentMap, setFileContentMap] = useState<Record<string, string>>({});
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    src: true,
    'src/lib': true,
    'src/lib/harness': true,
    tests: true,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'files' | 'symbols' | 'memory' | 'docs'>('files');

  // Evaluator Task Prompt
  const [issueInput, setIssueInput] = useState(
    'Audit scope enforcement and run test suite across workspace'
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Fetch real file tree from repository
  useEffect(() => {
    fetch('/api/repository/tree')
      .then((res) => res.json())
      .then((data) => {
        if (data.files && Array.isArray(data.files)) {
          setRepoFiles(data.files);
          setRepoName(data.repositoryName || 'sleep-deprived');
          setRepoRoot(data.repositoryRoot || '');
        }
      })
      .catch(() => {});
  }, []);

  // Fetch real file content on selection
  useEffect(() => {
    if (selectedFilePath && fileContentMap[selectedFilePath] === undefined) {
      fetch(`/api/repository/file?path=${encodeURIComponent(selectedFilePath)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.content !== undefined) {
            setFileContentMap((prev) => ({ ...prev, [selectedFilePath]: data.content }));
          }
        })
        .catch(() => {});
    }
  }, [selectedFilePath, fileContentMap]);

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [path]: !prev[path],
    }));
  };

  const currentContent = fileContentMap[selectedFilePath] ?? '// Loading workspace file...';

  const handleTriggerFix = () => {
    if (onLaunchFix && issueInput.trim()) {
      setStatusMessage(`Dispatching evaluation task: "${issueInput.trim().slice(0, 40)}..."`);
      onLaunchFix(repoName, issueInput.trim());
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const loadPreset = (presetIssue: string) => {
    setIssueInput(presetIssue);
  };

  // Flatten files for list view
  const flattenFiles = (nodes: RepoFile[]): RepoFile[] => {
    const res: RepoFile[] = [];
    for (const n of nodes) {
      if (!n.isDirectory) res.push(n);
      if (n.children) res.push(...flattenFiles(n.children));
    }
    return res;
  };
  const flatFiles = flattenFiles(repoFiles);

  return (
    <div className="flex-1 flex flex-col bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl overflow-hidden transition-colors">
      {/* ==================================================================== */}
      {/* ACTIVE EVALUATION WORKSPACE BANNER                                   */}
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
                  ACTIVE EVALUATOR WORKSPACE
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#10b981]/15 text-[#10b981] font-bold border border-[#10b981]/30">
                  Live Filesystem Connected
                </span>
              </div>
              <div className="text-[11px] text-[var(--text-muted)] font-sans mt-0.5">
                Targeting live repository <strong className="text-[var(--text-primary)] font-mono">{repoName}</strong> at <span className="font-mono text-[var(--text-muted)]">{repoRoot || '.'}</span>.
              </div>
            </div>
          </div>

          {/* Quick presets */}
          <div className="flex items-center gap-1 text-[11px]">
            <span className="text-[var(--text-muted)]">Evaluator Tasks:</span>
            <button
              onClick={() =>
                loadPreset('Audit scope enforcement and run test suite across workspace')
              }
              className="px-2 py-0.5 rounded bg-[var(--bg-canvas)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] cursor-pointer"
            >
              scope-audit
            </button>
            <button
              onClick={() =>
                loadPreset('Inspect targeted context cartography in src/lib/harness/context-engine.ts')
              }
              className="px-2 py-0.5 rounded bg-[var(--bg-canvas)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] cursor-pointer"
            >
              context-engine
            </button>
            <button
              onClick={() =>
                loadPreset('Verify cryptographic proof generation in src/lib/harness/proof-engine.ts')
              }
              className="px-2 py-0.5 rounded bg-[var(--bg-canvas)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] cursor-pointer"
            >
              proof-engine
            </button>
          </div>
        </div>

        {/* Issue Input & Launch Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            type="text"
            value={issueInput}
            onChange={(e) => setIssueInput(e.target.value)}
            placeholder="Enter issue description or task prompt for the autonomous harness..."
            className="flex-1 px-3 py-2 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[#ea580c] transition-colors"
          />
          <button
            onClick={handleTriggerFix}
            disabled={!issueInput.trim()}
            className="px-4 py-2 rounded-lg bg-[#ea580c] hover:bg-[#c2410c] text-white font-semibold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors shadow-xs shrink-0"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Launch Evaluation</span>
          </button>
        </div>

        {statusMessage && (
          <div className="p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{statusMessage}</span>
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
            <span className="text-[var(--text-primary)] font-bold">{repoName}:main</span>
            <span>·</span>
            <span>{flatFiles.length} files</span>
            <span>·</span>
            <span className="text-[#10b981] font-semibold">Real Workspace</span>
          </div>
        </div>

        {/* Tab switcher: Files vs All Files vs Memory vs Docs */}
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
            All Files ({flatFiles.length})
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
          {/* Left pane: File tree / File list */}
          <div className="w-72 bg-[var(--bg-canvas)] border-r border-[var(--border-subtle)] flex flex-col shrink-0 font-mono text-xs">
            {/* Search box */}
            <div className="p-2 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[11px]">
                <Search className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder={activeTab === 'files' ? 'Filter files...' : 'Filter list...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
              {activeTab === 'files' ? (
                <RenderFileTree
                  files={repoFiles}
                  selectedFilePath={selectedFilePath}
                  onSelectFile={setSelectedFilePath}
                  expandedFolders={expandedFolders}
                  onToggleFolder={toggleFolder}
                  searchQuery={searchQuery}
                />
              ) : (
                <div className="space-y-1">
                  {flatFiles
                    .filter((f) => f.path.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((file) => (
                      <button
                        key={file.path}
                        onClick={() => setSelectedFilePath(file.path)}
                        className="w-full p-2 rounded text-left bg-[var(--bg-panel)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] transition-colors cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-[var(--text-primary)] truncate">{file.name}</span>
                          <span className="text-[10px] text-[#38bdf8] uppercase font-bold">{file.extension || 'file'}</span>
                        </div>
                        <div className="text-[10px] text-[var(--text-muted)] truncate">
                          {file.path}
                        </div>
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Right pane: Code Preview & File Details */}
          <div className="flex-1 flex flex-col bg-[var(--code-bg)] overflow-hidden">
            {/* File header */}
            <div className="p-3 bg-[var(--bg-elevated)] border-b border-[var(--border-subtle)] flex items-center justify-between font-mono text-xs">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-[#38bdf8]" />
                <span className="font-semibold text-[var(--text-primary)]">{selectedFilePath}</span>
              </div>

              {onSelectWhyFile && (
                <button
                  onClick={() => onSelectWhyFile(selectedFilePath)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#ea580c]/15 hover:bg-[#ea580c]/25 border border-[#ea580c]/30 text-[#ea580c] text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Inspect in Context Cartography</span>
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
          </button>
        );
      })}
    </div>
  );
}
