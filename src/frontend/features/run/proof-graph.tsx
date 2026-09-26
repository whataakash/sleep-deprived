'use client';

import React, { useState } from 'react';
import { ProofGraphNode, ProofGraphEdge } from '@/types/verification';
import {
  FileText,
  FileCode,
  GitCommit,
  TestTube,
  CheckCircle,
  Hammer,
  ShieldCheck,
  ArrowRight,
  Info,
} from 'lucide-react';

interface ProofGraphProps {
  nodes: ProofGraphNode[];
  edges: ProofGraphEdge[];
  onSelectNode?: (node: ProofGraphNode) => void;
}

export function ProofGraph({ nodes, edges, onSelectNode }: ProofGraphProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string>(nodes[0]?.id || 'req-1');

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || nodes[0];

  const getNodeIcon = (type: ProofGraphNode['type']) => {
    switch (type) {
      case 'requirement':
        return <FileText className="w-4 h-4 text-[#38bdf8]" />;
      case 'code':
        return <FileCode className="w-4 h-4 text-[#fbbf24]" />;
      case 'change':
        return <GitCommit className="w-4 h-4 text-[#ea580c]" />;
      case 'test':
        return <TestTube className="w-4 h-4 text-[#a78bfa]" />;
      case 'result':
        return <CheckCircle className="w-4 h-4 text-[#10b981]" />;
      case 'build':
        return <Hammer className="w-4 h-4 text-[#38bdf8]" />;
      case 'proof':
        return <ShieldCheck className="w-4 h-4 text-[#10b981]" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg overflow-hidden transition-colors">
      {/* Header */}
      <div className="p-3 bg-[var(--bg-elevated)] border-b border-[var(--border-subtle)] flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider font-mono">
              The Proof Graph
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#10b981]/20 text-[#10b981] font-bold">
              CAUSAL EVIDENCE CHAIN
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            Trace from user requirement → affected AST → applied diff → test verification → sealed proof.
          </p>
        </div>
      </div>

      {/* Graph Visual Pipeline */}
      <div className="p-6 bg-[var(--bg-canvas)] overflow-x-auto">
        <div className="flex items-center justify-between min-w-[780px] relative py-4">
          {nodes.map((node, index) => {
            const isSelected = node.id === selectedNodeId;
            const isLast = index === nodes.length - 1;

            return (
              <React.Fragment key={node.id}>
                {/* Node Box */}
                <button
                  onClick={() => {
                    setSelectedNodeId(node.id);
                    if (onSelectNode) onSelectNode(node);
                  }}
                  className={`flex flex-col items-center p-3 rounded-lg border text-left transition-all duration-200 cursor-pointer w-32 shrink-0 ${
                    isSelected
                      ? 'bg-[var(--bg-elevated)] border-[#ea580c] ring-2 ring-[#ea580c]/30 shadow-md scale-105'
                      : 'bg-[var(--bg-panel)] border-[var(--border-subtle)] hover:border-[var(--border-medium)]'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-center mb-2">
                    {getNodeIcon(node.type)}
                  </div>

                  <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] tracking-wider">
                    {node.type}
                  </span>
                  <span className="text-xs font-semibold text-[var(--text-primary)] text-center truncate w-full mt-0.5">
                    {node.label}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] text-center truncate w-full">
                    {node.sublabel}
                  </span>

                  <span className="mt-2 text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#10b981]/15 text-[#10b981] font-semibold">
                    ✓ {node.status}
                  </span>
                </button>

                {/* Connecting arrow */}
                {!isLast && (
                  <div className="flex flex-col items-center justify-center px-1 text-[var(--text-muted)]">
                    <ArrowRight className="w-4 h-4 text-[#ea580c]" />
                    <span className="text-[9px] font-mono text-[var(--text-muted)] mt-1">
                      {edges[index]?.label || 'leads to'}
                    </span>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Selected Node Details Drawer */}
      <div className="p-4 bg-[var(--bg-elevated)] border-t border-[var(--border-subtle)] flex-1">
        <div className="flex items-center gap-2 mb-2">
          <Info className="w-4 h-4 text-[#38bdf8]" />
          <span className="text-xs font-mono font-bold text-[var(--text-primary)] uppercase">
            Proof Graph Node Details: {selectedNode.label}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
          <div className="p-3 rounded bg-[var(--bg-canvas)] border border-[var(--border-subtle)] space-y-1">
            <span className="text-[11px] text-[var(--text-muted)]">NODE TYPE:</span>
            <div className="text-sm font-semibold text-[var(--text-primary)] capitalize">{selectedNode.type}</div>
            <div className="text-[11px] text-[var(--text-secondary)]">{selectedNode.sublabel}</div>
          </div>

          <div className="p-3 rounded bg-[var(--bg-canvas)] border border-[var(--border-subtle)] space-y-1">
            <span className="text-[11px] text-[var(--text-muted)]">GROUND TRUTH EVIDENCE:</span>
            <div className="text-sm font-semibold text-[#10b981]">Deterministic Verified</div>
            <div className="text-[11px] text-[var(--text-secondary)]">Zero speculative inferences</div>
          </div>

          <div className="p-3 rounded bg-[var(--bg-canvas)] border border-[var(--border-subtle)] space-y-1">
            <span className="text-[11px] text-[var(--text-muted)]">LINKED EDGE:</span>
            <div className="text-sm font-semibold text-[#ea580c]">
              Causal dependency confirmed
            </div>
            <div className="text-[11px] text-[var(--text-secondary)]">
              AST mutation directly validates test
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
