import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {
  TaskContractEngine,
  TargetedContextEngine,
  HarnessToolExecutor,
  FailureClassifier,
  HarnessCheckpointManager,
  HarnessVerificationGate,
  HarnessProofEngine,
} from '../src/lib/harness';
import { EvaluationModelAdapter } from '../src/lib/models/evaluation-adapter';
import { HarnessFailureCategory } from '../src/lib/harness/types';

test('1. Task Contract Engine generates structured contract and enforces scope', () => {
  const task = 'Fix token forwarding in src/auth/client.ts and ensure tests pass';
  const contract = TaskContractEngine.createContract(task, process.cwd(), {
    allowedPaths: ['src/auth/**/*', 'tests/**/*'],
  });

  assert.ok(contract.id.startsWith('contract-'));
  assert.equal(contract.objective, task);
  assert.ok(contract.allowedPaths.includes('src/auth/**/*'));
  assert.ok(contract.forbiddenPaths.includes('.env*'));
  assert.ok(contract.verificationRequirements.length >= 4);
  assert.equal(contract.stopConditions.maxRetries, 3);
  assert.equal(contract.isSealed, true);

  // In scope check
  const allowedCheck = TaskContractEngine.validateScope('src/auth/client.ts', contract);
  assert.equal(allowedCheck.allowed, true);

  // Out of scope check
  const outOfScopeCheck = TaskContractEngine.validateScope('src/server/database.ts', contract);
  assert.equal(outOfScopeCheck.allowed, false);
  assert.ok(outOfScopeCheck.reason.includes('Out of scope'));

  // Forbidden path check
  const forbiddenCheck = TaskContractEngine.validateScope('.env.production', contract);
  assert.equal(forbiddenCheck.allowed, false);
  assert.ok(forbiddenCheck.reason.includes('Forbidden path'));
});

test('2. Targeted Context Engine selects relevant files within token budget and maps symbols', async () => {
  const task = 'authentication session token';
  const context = await TargetedContextEngine.assembleContext(task, process.cwd(), undefined, 4000);

  assert.ok(context.filesConsidered.length > 0);
  assert.ok(context.filesSelected.length > 0);
  assert.ok(context.totalTokensEstimate <= 4000 || context.filesSelected.length === 1);
  assert.ok(context.durationMs >= 0);

  // Check AST symbols indexed
  const authSymbols = context.indexedSymbols;
  assert.ok(Array.isArray(authSymbols));
});

test('3. Tool Executor records structured events and blocks out-of-scope edits', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'parishram-tool-test-'));
  const contract = TaskContractEngine.createContract('Test task', tmpDir, {
    allowedPaths: ['allowed/**/*'],
  });

  const toolExecutor = new HarnessToolExecutor(tmpDir, contract);

  // 1. Allowed write
  await toolExecutor.writeFile('allowed/test.txt', 'Hello Parishram');
  const readBack = await toolExecutor.readFile('allowed/test.txt');
  assert.equal(readBack, 'Hello Parishram');

  // 2. Out of scope write should throw
  await assert.rejects(
    async () => {
      await toolExecutor.writeFile('forbidden/secret.txt', 'bad data');
    },
    (err: any) => {
      assert.ok(err.message.includes('SCOPE_VIOLATION'));
      return true;
    }
  );

  // 3. Edit file
  const editRes = await toolExecutor.editFile('allowed/test.txt', 'Hello', 'Namaste');
  assert.ok(editRes.linesChanged > 0);
  const updated = await toolExecutor.readFile('allowed/test.txt');
  assert.equal(updated, 'Namaste Parishram');

  // Verify events logged
  const events = toolExecutor.getEvents();
  assert.ok(events.length >= 3);
  assert.equal(events[0].tool, 'write_file');
  assert.equal(events[0].status, 'completed');

  // Clean up
  await fs.rm(tmpDir, { recursive: true, force: true });
});

test('4. Security Guard blocks dangerous shell commands and hardcoded secrets', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'parishram-sec-test-'));
  const toolExecutor = new HarnessToolExecutor(tmpDir);

  // Dangerous command should throw
  await assert.rejects(
    async () => {
      await toolExecutor.runCommand('rm -rf / --no-preserve-root');
    },
    (err: any) => {
      assert.ok(err.message.includes('SECURITY_GUARD_BLOCKED'));
      return true;
    }
  );

  // Hardcoded secret should be rejected on write
  await assert.rejects(
    async () => {
      await toolExecutor.writeFile(
        'token.ts',
        'const key = "ghp_123456789012345678901234567890123456";'
      );
    },
    (err: any) => {
      assert.ok(err.message.includes('SECURITY_VIOLATION'));
      return true;
    }
  );

  await fs.rm(tmpDir, { recursive: true, force: true });
});

test('5. Failure Classifier classifies all 9 failure categories deterministically', () => {
  const testCases: { category: HarnessFailureCategory; output: string; exitCode?: number }[] = [
    { category: 'TEST_FAILURE', output: 'AssertionError: expected 200 to equal 401\nFAIL tests/auth.test.ts', exitCode: 1 },
    { category: 'TYPE_ERROR', output: 'src/auth.ts:12:5 - error TS2322: Type "string" is not assignable to type "number".', exitCode: 2 },
    { category: 'BUILD_FAILURE', output: 'SyntaxError: Unexpected token "{" in bundle.js\nFailed to compile', exitCode: 1 },
    { category: 'SCOPE_VIOLATION', output: 'SCOPE_VIOLATION: Attempted to touch forbidden path .env.production', exitCode: 1 },
    { category: 'MISSING_CONTEXT', output: 'ReferenceError: activeTokenManager is not defined at processRequest', exitCode: 1 },
    { category: 'TOOL_FAILURE', output: 'sh: line 1: non_existent_tool: command not found (exit code 127)', exitCode: 127 },
    { category: 'PATCH_FAILURE', output: 'PATCH_FAILURE: Target text to replace not found in src/auth/client.ts', exitCode: 1 },
    { category: 'DEPENDENCY_FAILURE', output: 'Cannot find package "jsonwebtoken" imported from src/auth.ts', exitCode: 1 },
    { category: 'TIMEOUT', output: 'Test run timed out after 60000ms deadline exceeded', exitCode: 124 },
  ];

  for (const tc of testCases) {
    const diag = FailureClassifier.diagnose('npm test', tc.output, tc.exitCode, ['src/auth.ts']);
    assert.equal(diag.category, tc.category, `Expected category ${tc.category}, got ${diag.category}`);
    assert.ok(diag.symptom.length > 0);
    assert.ok(diag.targetedRecoveryAction.length > 0);
  }
});

test('6. Checkpoint Manager creates atomic snapshots and restores state on rollback', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'parishram-chk-test-'));
  const filePath = path.join(tmpDir, 'service.ts');
  await fs.writeFile(filePath, 'export const version = "1.0.0";');

  const chkManager = new HarnessCheckpointManager(tmpDir);

  // 1. Take snapshot
  const snapshot = await chkManager.createCheckpoint('v1-baseline', 'Initial state', ['service.ts']);
  assert.ok(snapshot.id.startsWith('chk-'));
  assert.equal(snapshot.files[0].originalContent, 'export const version = "1.0.0";');

  // 2. Mutate file
  await fs.writeFile(filePath, 'CORRUPTED SYNTAX ERROR {{{');
  const mutated = await fs.readFile(filePath, 'utf-8');
  assert.equal(mutated, 'CORRUPTED SYNTAX ERROR {{{');

  // 3. Rollback
  const rollbackRes = await chkManager.rollbackToCheckpoint(snapshot.id);
  assert.equal(rollbackRes.success, true);
  assert.equal(rollbackRes.restoredFilesCount, 1);

  // 4. Verify file restored
  const restored = await fs.readFile(filePath, 'utf-8');
  assert.equal(restored, 'export const version = "1.0.0";');

  await fs.rm(tmpDir, { recursive: true, force: true });
});

test('7. Verification Gate strictly blocks unproven claims', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'parishram-verif-test-'));
  const contract = TaskContractEngine.createContract('Verification Test', tmpDir);
  const toolExecutor = new HarnessToolExecutor(tmpDir, contract);

  // Verification against an empty mock command that fails
  const failedResult = await HarnessVerificationGate.executeVerification(
    toolExecutor,
    {
      ...contract,
      verificationRequirements: [
        { id: 'req-tests', name: 'Tests', command: 'node -e "process.exit(1)"', description: 'Failing test', required: true },
      ],
    },
    ['src/nonexistent.ts'],
    tmpDir
  );

  // MUST NOT BE VERIFIED
  assert.equal(failedResult.passed, false);
  assert.ok(failedResult.tests.failed > 0 || failedResult.tests.rawExitCode !== 0);

  await fs.rm(tmpDir, { recursive: true, force: true });
});

test('8. Cryptographic Proof Engine generates SHA-256 seal and authentic Merkle root', async () => {
  const contract = TaskContractEngine.createContract('Token forwarding', process.cwd());
  const context = await TargetedContextEngine.assembleContext('token', process.cwd(), contract, 2000);

  const proof = await HarnessProofEngine.generateProof({
    runId: 'test-run-proof-88',
    task: 'Token forwarding',
    contract,
    context,
    toolEvents: [],
    filesChanged: ['src/auth/client.ts'],
    diff: '+ token header',
    verification: {
      passed: true,
      timestamp: new Date().toISOString(),
      durationMs: 120,
      tests: { total: 25, passed: 25, failed: 0, skipped: 0, output: '25 passed', rawExitCode: 0, durationMs: 50 },
      typecheck: { passed: true, errorsCount: 0, output: 'clean', durationMs: 40 },
      scope: { passed: true, modifiedFiles: ['src/auth/client.ts'], violations: [] },
      security: { passed: true, secretsDetected: [], dangerousCommandsBlocked: [] },
    },
    telemetry: {
      modelCalls: 1,
      promptTokens: 500,
      completionTokens: 100,
      totalTokens: 600,
      durationMs: 1200,
      filesInspected: 5,
      filesModified: 1,
      retriesCount: 0,
      verificationAttempts: 1,
    },
  });

  assert.equal(proof.status, 'VERIFIED');
  assert.equal(proof.proofHash.length, 64, 'Proof hash must be SHA-256 (64 hex characters)');
  assert.equal(proof.merkleRoot.length, 64, 'Merkle root must be SHA-256 (64 hex characters)');
  assert.equal(proof.merkleLeaves.length, 5, 'Must contain 5 distinct Merkle leaves');

  // Verify Evidence Graph translation
  const graph = HarnessProofEngine.toEvidenceGraph(proof);
  assert.equal(graph.nodes.length, 6);
  assert.equal(graph.edges.length, 5);
  assert.equal(graph.nodes[5].status, 'verified');
});

test('9. Evaluation Mode model locking strictly enforces prescribed text-only model', async () => {
  const adapter = new EvaluationModelAdapter({
    apiKey: 'eval-key-123',
    modelName: 'hackathon-prescribed-text-v1',
  });

  assert.equal(adapter.getModelName(), 'hackathon-prescribed-text-v1');
  const res = await adapter.generateText({
    systemPrompt: 'System',
    userPrompt: 'Task in text-only mode',
    contextFiles: [],
  });

  assert.equal(res.textOnlyEnforced, true);
  assert.equal(res.modelUsed, 'hackathon-prescribed-text-v1');
});
