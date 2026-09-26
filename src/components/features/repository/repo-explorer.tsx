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
} from 'lucide-react';
import { RepoFile, ASTSymbol, WhyThisFile } from '@/types/repository';
import { MOCK_REPO_FILES, MOCK_SYMBOLS, MOCK_WHY_THIS_FILE, findFileContent } from '@/lib/repository/mock-repo';

interface RepoExplorerProps {
  onSelectWhyFile?: (filePath: string) => void;
}

export function RepoExplorer({ onSelectWhyFile }: RepoExplorerProps) {
  const [selectedFilePath, setSelectedFilePath] = useState('src/auth/client.ts');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    src: true,
    'src/auth': true,
    tests: true,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'files' | 'symbols'>('files');

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

  return (
    <div className="flex-1 flex flex-col bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg overflow-hidden transition-colors">
      {/* Top Bar with Context Telemetry */}
      <div className="p-3 bg-[var(--bg-elevated)] border-b border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-semibold text-[var(--text-primary)]">
            <Layers className="w-4 h-4 text-[#ea580c]" />
            <span>Repository Context Engine</span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
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

        {/* Tab switcher: Files vs Symbols */}
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
        </div>
      </div>

      {/* Main Split: Left Tree, Right Preview */}
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
                className="w-full flex items-center gap-1.5 px-2 py-1 rounded hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                style={{ paddingLeft: `${depth * 12 + 8}px` }}
              >
                {isExpanded ? (
                  <FolderOpen className="w-3.5 h-3.5 text-[#f59e0b]" />
                ) : (
                  <Folder className="w-3.5 h-3.5 text-[#f59e0b]" />
                )}
                <span>{file.name}</span>
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
            className={`w-full flex items-center justify-between px-2 py-1 rounded transition-colors cursor-pointer ${
              isSelected
                ? 'bg-[var(--bg-active)] text-[var(--text-primary)] font-semibold border border-[var(--border-active)]'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]'
            }`}
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
          >
            <div className="flex items-center gap-1.5 truncate">
              <FileCode
                className={`w-3.5 h-3.5 shrink-0 ${
                  isWhyRelevant ? 'text-[#ea580c]' : 'text-[var(--text-muted)]'
                }`}
              />
              <span className="truncate">{file.name}</span>
            </div>

            {isWhyRelevant && (
              <span className="text-[9px] px-1 py-0.2 rounded bg-[#ea580c]/20 text-[#ea580c] font-bold">
                RELEVANT
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
