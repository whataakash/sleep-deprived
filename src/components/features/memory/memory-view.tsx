'use client';

import React, { useState } from 'react';
import { INITIAL_ENGINEERING_FACTS, INITIAL_FAILURE_FINGERPRINTS } from '@/lib/memory/store';
import { EngineeringFact } from '@/types/memory';
import { FailureFingerprint } from '@/types/agent';
import {
  Brain,
  Fingerprint,
  CheckCircle2,
  Trash2,
  Plus,
} from 'lucide-react';

export function MemoryView() {
  const [facts, setFacts] = useState<EngineeringFact[]>(INITIAL_ENGINEERING_FACTS);
  const [fingerprints, setFingerprints] = useState<FailureFingerprint[]>(INITIAL_FAILURE_FINGERPRINTS);
  const [activeTab, setActiveTab] = useState<'fingerprints' | 'facts'>('fingerprints');
  const [newFactText, setNewFactText] = useState('');
  const [newFactScope, setNewFactScope] = useState<'tests' | 'auth' | 'build' | 'api'>('tests');

  const handleApprove = (id: string) => {
    setFacts((prev) =>
      prev.map((f) => (f.id === id ? { ...f, status: 'approved' as const } : f))
    );
  };

  const handleDelete = (id: string) => {
    setFacts((prev) => prev.filter((f) => f.id !== id));
  };

  const handleAddFact = () => {
    if (!newFactText.trim()) return;
    const newFact: EngineeringFact = {
      id: `fact-${Date.now()}`,
      statement: newFactText.trim(),
      source: 'user_input',
      scope: newFactScope,
      confidence: 100,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'approved',
      usageCount: 0,
    };
    setFacts([newFact, ...facts]);
    setNewFactText('');
  };

  return (
    <div className="flex-1 flex flex-col bg-[var(--bg-canvas)] border border-[var(--border-subtle)] rounded overflow-hidden">
      {/* Header bar */}
      <div className="p-3 bg-[var(--bg-panel)] border-b border-[var(--border-subtle)] flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-[#ea580c]" />
          <span className="font-semibold text-[var(--text-primary)] uppercase tracking-wider">
            Persistent Engineering Memory & Failure Fingerprints
          </span>
          <span className="text-[11px] px-1.5 py-0.5 rounded bg-[#f59e0b]/15 text-[#f59e0b] font-bold">
            Zero-Shot Knowledge Reuse
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('fingerprints')}
            className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
              activeTab === 'fingerprints'
                ? 'bg-[#ea580c] text-white font-semibold'
                : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]'
            }`}
          >
            Failure Fingerprints ({fingerprints.length})
          </button>
          <button
            onClick={() => setActiveTab('facts')}
            className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
              activeTab === 'facts'
                ? 'bg-[#ea580c] text-white font-semibold'
                : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]'
            }`}
          >
            Project Facts ({facts.length})
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5 font-mono text-xs">
        {activeTab === 'fingerprints' && (
          <div className="space-y-4">
            <div className="p-4 rounded bg-[var(--bg-panel)] border border-[var(--border-subtle)] text-[var(--text-secondary)] font-sans text-xs leading-relaxed">
              When Parishram encounters a failure, it generates an AST and stack fingerprint. If the fingerprint has been resolved in prior runs, the harness applies the proven remediation tactic immediately without redundant trial-and-error.
            </div>

            <div className="space-y-3">
              {fingerprints.map((fp) => (
                <div
                  key={fp.id}
                  className="p-4 rounded-lg bg-[var(--bg-panel)] border border-[var(--border-subtle)] space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Fingerprint className="w-4 h-4 text-[#ea580c]" />
                      <span className="font-bold text-[var(--text-primary)] text-sm">{fp.fingerprint}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] text-[#38bdf8]">
                        {fp.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
                      <span>Seen {fp.seenCount} times</span>
                      <span>·</span>
                      <span className="text-[#10b981] font-semibold">{fp.confidence}% Confidence</span>
                    </div>
                  </div>

                  <p className="text-[var(--text-secondary)] font-sans text-xs leading-relaxed">
                    {fp.symptomSummary}
                  </p>

                  <div className="p-3 rounded bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[#10b981] space-y-1">
                    <span className="text-[var(--text-muted)] text-[10px] uppercase font-bold">
                      Proven Recovery Strategy:
                    </span>
                    <div className="font-mono text-xs">{fp.successfulRecoveryTactic}</div>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)] pt-1 border-t border-[var(--border-subtle)]">
                    <span>Related Components:</span>
                    {fp.relatedComponents.map((c) => (
                      <code key={c} className="text-[#38bdf8] bg-[var(--bg-elevated)] px-1.5 py-0.5 rounded">
                        {c}
                      </code>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'facts' && (
          <div className="space-y-4">
            {/* Add fact input */}
            <div className="p-4 rounded bg-[var(--bg-panel)] border border-[var(--border-subtle)] space-y-3">
              <span className="font-bold text-[var(--text-primary)] text-sm">Add Durable Project Fact</span>
              <div className="flex gap-2">
                <select
                  value={newFactScope}
                  onChange={(e) => setNewFactScope(e.target.value as any)}
                  className="px-2.5 py-1.5 rounded bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--text-primary)] outline-none cursor-pointer"
                >
                  <option value="tests">Scope: Tests</option>
                  <option value="auth">Scope: Auth</option>
                  <option value="build">Scope: Build</option>
                  <option value="api">Scope: API</option>
                </select>

                <input
                  type="text"
                  placeholder="e.g. Tests must be executed with --runInBand for deterministic mocks..."
                  value={newFactText}
                  onChange={(e) => setNewFactText(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--text-primary)] outline-none focus:border-[#ea580c]"
                />

                <button
                  onClick={handleAddFact}
                  className="px-4 py-1.5 rounded bg-[#ea580c] hover:bg-[#f97316] text-white font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>ADD FACT</span>
                </button>
              </div>
            </div>

            {/* List facts */}
            <div className="space-y-2">
              {facts.map((fact) => (
                <div
                  key={fact.id}
                  className="p-3.5 rounded bg-[var(--bg-panel)] border border-[var(--border-subtle)] flex items-start justify-between gap-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.2 rounded bg-[var(--bg-elevated)] text-[#38bdf8] text-[10px] uppercase font-bold">
                        {fact.scope}
                      </span>
                      <span className="text-[11px] text-[var(--text-muted)]">
                        Source: {fact.source} · Applied {fact.usageCount} times
                      </span>
                    </div>

                    <p className="text-[var(--text-primary)] font-sans text-xs leading-relaxed">
                      {fact.statement}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleApprove(fact.id)}
                      className="p-1.5 rounded hover:bg-[var(--bg-subtle)] text-[#10b981] cursor-pointer"
                      title="Approve / Keep"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(fact.id)}
                      className="p-1.5 rounded hover:bg-[var(--bg-subtle)] text-[var(--text-muted)] hover:text-[#ef4444] cursor-pointer"
                      title="Delete Fact"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
