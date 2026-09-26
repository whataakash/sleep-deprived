import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import {
  MerkleLeaf,
  ProofRecord,
  TargetedContextResult,
  TaskContract,
  ToolCallEvent,
  VerificationResult,
  HarnessTelemetry,
} from './types';
import { ProofGraphEdge, ProofGraphNode } from '@/types/verification';

export class HarnessProofEngine {
  private static sha256(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Generates a deterministic cryptographic proof record and Merkle tree from real execution data.
   */
  public static async generateProof(params: {
    runId: string;
    task: string;
    contract: TaskContract;
    context: TargetedContextResult;
    toolEvents: ToolCallEvent[];
    filesChanged: string[];
    diff: string;
    verification: VerificationResult;
    telemetry: HarnessTelemetry;
    repositoryRoot?: string;
  }): Promise<ProofRecord> {
    const {
      runId,
      task,
      contract,
      context,
      toolEvents,
      filesChanged,
      diff,
      verification,
      telemetry,
      repositoryRoot = process.cwd(),
    } = params;

    const timestamp = new Date().toISOString();

    // 1. Build Merkle Leaves from real execution artifacts
    const leafContract: MerkleLeaf = {
      id: 'leaf-contract',
      name: 'Task Contract Specification',
      hash: this.sha256(JSON.stringify({
        objective: contract.objective,
        allowed: contract.allowedPaths,
        forbidden: contract.forbiddenPaths,
        requirements: contract.verificationRequirements,
      })),
      payloadSummary: `${contract.allowedPaths.length} allowed paths, ${contract.verificationRequirements.length} verification requirements`,
    };

    const leafContext: MerkleLeaf = {
      id: 'leaf-context',
      name: 'Targeted Context Cartography',
      hash: this.sha256(JSON.stringify(context.filesSelected.map((f) => ({ path: f.path, symbols: f.symbols })))),
      payloadSummary: `${context.filesSelected.length} files selected, ${context.totalTokensEstimate} tokens indexed`,
    };

    const leafTools: MerkleLeaf = {
      id: 'leaf-tools',
      name: 'Deterministic Tool Audit Log',
      hash: this.sha256(JSON.stringify(toolEvents.map((t) => ({ tool: t.tool, exitCode: t.exitCode, status: t.status })))),
      payloadSummary: `${toolEvents.length} tool calls executed`,
    };

    const leafDiff: MerkleLeaf = {
      id: 'leaf-diff',
      name: 'Unified Code Mutation Diff',
      hash: this.sha256(diff || 'EMPTY_DIFF'),
      payloadSummary: `${filesChanged.length} files modified, ${diff.split('\n').length} diff lines`,
    };

    const leafVerification: MerkleLeaf = {
      id: 'leaf-verification',
      name: 'Deterministic Verification Matrix',
      hash: this.sha256(JSON.stringify({
        passed: verification.passed,
        tests: verification.tests.passed,
        typecheck: verification.typecheck.passed,
        scope: verification.scope.passed,
        security: verification.security.passed,
      })),
      payloadSummary: `Tests: ${verification.tests.passed}/${verification.tests.total} passed, Typecheck: ${verification.typecheck.passed ? 'PASS' : 'FAIL'}`,
    };

    const merkleLeaves: MerkleLeaf[] = [
      leafContract,
      leafContext,
      leafTools,
      leafDiff,
      leafVerification,
    ];

    // 2. Compute Merkle Root via binary pairwise tree reduction
    const merkleRoot = this.computeMerkleRoot(merkleLeaves.map((l) => l.hash));

    // 3. Compute top-level Proof Hash (SHA-256 seal)
    const proofHash = this.sha256(`${merkleRoot}:${runId}:${verification.passed ? 'VERIFIED' : 'FAILED'}:${timestamp}`);

    const proofRecord: ProofRecord = {
      id: 'proof-' + runId,
      runId,
      task,
      objective: contract.objective,
      repositoryRoot,
      status: verification.passed ? 'VERIFIED' : 'FAILED',
      proofHash,
      merkleRoot,
      merkleLeaves,
      filesChanged,
      diff,
      verificationSummary: {
        testsPassed: verification.tests.passed,
        testsFailed: verification.tests.failed,
        typecheckPassed: verification.typecheck.passed,
        scopePassed: verification.scope.passed,
        securityPassed: verification.security.passed,
      },
      telemetry,
      timestamp,
    };

    // 4. Seal and persist receipt to disk
    try {
      const proofsDir = path.resolve(repositoryRoot, '.parishram', 'proofs');
      await fs.mkdir(proofsDir, { recursive: true });
      const receiptPath = path.join(proofsDir, `${runId}.json`);
      await fs.writeFile(receiptPath, JSON.stringify(proofRecord, null, 2), 'utf-8');
      proofRecord.receiptPath = receiptPath;
    } catch (err) {
      console.warn('HarnessProofEngine: could not write proof file to disk:', err);
    }

    return proofRecord;
  }

  /**
   * Computes binary Merkle tree root from array of leaf hashes.
   */
  public static computeMerkleRoot(hashes: string[]): string {
    if (hashes.length === 0) return this.sha256('EMPTY_TREE');
    if (hashes.length === 1) return hashes[0];

    let currentLevel = [...hashes];
    while (currentLevel.length > 1) {
      const nextLevel: string[] = [];
      for (let i = 0; i < currentLevel.length; i += 2) {
        if (i + 1 < currentLevel.length) {
          nextLevel.push(this.sha256(currentLevel[i] + currentLevel[i + 1]));
        } else {
          // Odd leaf paired with itself
          nextLevel.push(this.sha256(currentLevel[i] + currentLevel[i]));
        }
      }
      currentLevel = nextLevel;
    }

    return currentLevel[0];
  }

  /**
   * Translates real ProofRecord into Evidence Graph nodes & edges for the UI.
   */
  public static toEvidenceGraph(proof: ProofRecord): { nodes: ProofGraphNode[]; edges: ProofGraphEdge[] } {
    const nodes: ProofGraphNode[] = [
      {
        id: 'node-task',
        type: 'requirement',
        label: proof.objective.slice(0, 32) + '...',
        sublabel: 'Task Objective',
        status: proof.status === 'VERIFIED' ? 'verified' : 'failed',
      },
      {
        id: 'node-context',
        type: 'code',
        label: `${proof.filesChanged.length > 0 ? proof.filesChanged[0] : 'Context'}`,
        sublabel: `${proof.filesChanged.length} file(s) modified`,
        status: 'verified',
      },
      {
        id: 'node-mutation',
        type: 'change',
        label: `Diff: +${proof.diff.split('\n').filter((l) => l.startsWith('+')).length} -${proof.diff.split('\n').filter((l) => l.startsWith('-')).length}`,
        sublabel: 'Unified Diff applied',
        status: 'verified',
      },
      {
        id: 'node-tests',
        type: 'test',
        label: `${proof.verificationSummary.testsPassed} Tests Passed`,
        sublabel: `${proof.verificationSummary.testsFailed} Failures`,
        status: proof.verificationSummary.testsFailed === 0 ? 'passed' : 'failed',
      },
      {
        id: 'node-build',
        type: 'build',
        label: proof.verificationSummary.typecheckPassed ? 'Typecheck PASS' : 'Typecheck FAIL',
        sublabel: 'Strict TypeScript Compiler',
        status: proof.verificationSummary.typecheckPassed ? 'passed' : 'failed',
      },
      {
        id: 'node-proof',
        type: 'proof',
        label: proof.status === 'VERIFIED' ? 'VERIFIED ✓' : 'FAILED ✗',
        sublabel: `SHA-256: ${proof.proofHash.slice(0, 10)}...`,
        status: proof.status === 'VERIFIED' ? 'verified' : 'failed',
      },
    ];

    const edges: ProofGraphEdge[] = [
      { id: 'e-1', source: 'node-task', target: 'node-context', label: 'targets' },
      { id: 'e-2', source: 'node-context', target: 'node-mutation', label: 'modified by' },
      { id: 'e-3', source: 'node-mutation', target: 'node-tests', label: 'exercised by' },
      { id: 'e-4', source: 'node-tests', target: 'node-build', label: 'typechecked in' },
      { id: 'e-5', source: 'node-build', target: 'node-proof', label: 'seals', animated: true },
    ];

    return { nodes, edges };
  }
}
