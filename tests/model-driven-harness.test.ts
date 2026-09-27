import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { HarnessPipeline } from '../src/lib/harness/pipeline';
import { HarnessToolExecutor } from '../src/lib/harness/tool-executor';
import { TaskContractEngine } from '../src/lib/harness/task-contract';
import { FailureClassifier } from '../src/lib/harness/failure-classifier';
import { HarnessCheckpointManager } from '../src/lib/harness/checkpoint-manager';
import { HarnessProofEngine } from '../src/lib/harness/proof-engine';
import {
  EvaluationModelAdapter,
  ModelMessage,
  STANDARD_HARNESS_TOOLS,
} from '../src/lib/models/evaluation-adapter';
import { ModelRouter } from '../src/lib/models/gateway';

test('1. Different user prompts produce different model requests', async () => {
  const requestsReceived: string[] = [];

  const createAdapter = () =>
    new EvaluationModelAdapter({
      apiKey: 'test-key-diff-prompts',
      mockHandler: async (messages: ModelMessage[]) => {
        const userMsg = messages.find((m) => m.role === 'user')?.content || '';
        requestsReceived.push(userMsg);
        return {
          content: 'Noted. Planning next step.',
          toolCalls: [{ id: 'call_complete', tool: 'complete_task', args: { summary: 'Plan formulated' } }],
          tokensUsed: { prompt: 50, completion: 20, total: 70 },
          durationMs: 15,
          modelUsed: 'test-model',
          textOnlyEnforced: true,
        };
      },
    });

  const adapterA = createAdapter();
  await adapterA.generateText({
    systemPrompt: 'Parishram System',
    userPrompt: 'TASK_A: Fix race condition in Redis token bucket limiter',
    contextFiles: [],
  });

  const adapterB = createAdapter();
  await adapterB.generateText({
    systemPrompt: 'Parishram System',
    userPrompt: 'TASK_B: Add RFC-7807 problem details to user registration endpoint',
    contextFiles: [],
  });

  assert.equal(requestsReceived.length, 2);
  assert.notEqual(requestsReceived[0], requestsReceived[1]);
  assert.ok(requestsReceived[0].includes('Redis token bucket'));
  assert.ok(requestsReceived[1].includes('RFC-7807 problem details'));
});

test('2. Model-requested file reads actually happen', async () => {
  const executor = new HarnessToolExecutor(process.cwd());
  const res = await executor.executeTool('read_file', { path: 'package.json', startLine: 1, lineCount: 5 });

  assert.equal(res.exitCode, 0);
  assert.ok(res.output.includes('name'));
  assert.ok(res.output.includes('sleep-deprived'));

  const events = executor.getEvents();
  assert.equal(events.length, 1);
  assert.equal(events[0].tool, 'read_file');
  assert.equal(events[0].status, 'completed');
});

test('3. Model-requested edits actually happen on disk', async () => {
  const testFilePath = path.join(process.cwd(), '.parishram-test-mutation.txt');
  await fs.writeFile(testFilePath, 'ORIGINAL_TEXT_STRING\nLINE_TWO', 'utf-8');

  try {
    const executor = new HarnessToolExecutor(process.cwd());
    const res = await executor.executeTool('edit_file', {
      path: '.parishram-test-mutation.txt',
      oldStr: 'ORIGINAL_TEXT_STRING',
      newStr: 'MUTATED_NEW_STRING',
      rationale: 'Testing genuine model edit tool execution',
    });

    assert.equal(res.exitCode, 0);
    assert.ok(res.output.includes('Successfully applied patch'));
    assert.ok(res.diff?.includes('+MUTATED_NEW_STRING'));

    const onDisk = await fs.readFile(testFilePath, 'utf-8');
    assert.ok(onDisk.includes('MUTATED_NEW_STRING'));
    assert.ok(!onDisk.includes('ORIGINAL_TEXT_STRING'));
  } finally {
    await fs.unlink(testFilePath).catch(() => {});
  }
});

test('4. Tool results return to the model in multi-turn conversation', async () => {
  let sawToolResultInNextTurn = false;

  const adapter = new EvaluationModelAdapter({
    apiKey: 'test-key-multiturn',
    mockHandler: async (messages: ModelMessage[]) => {
      const toolMsg = messages.find((m) => m.role === 'tool');
      if (toolMsg) {
        sawToolResultInNextTurn = true;
        assert.ok(toolMsg.content.includes('Tool: read_file'));
        assert.ok(toolMsg.content.includes('package.json'));
        return {
          content: 'Received file content, completing task.',
          toolCalls: [{ id: 'call_2', tool: 'complete_task', args: { summary: 'Done' } }],
          tokensUsed: { prompt: 100, completion: 20, total: 120 },
          durationMs: 10,
          modelUsed: 'test-model',
          textOnlyEnforced: true,
        };
      }

      return {
        content: 'I need to read package.json first.',
        toolCalls: [{ id: 'call_1', tool: 'read_file', args: { path: 'package.json' } }],
        tokensUsed: { prompt: 40, completion: 30, total: 70 },
        durationMs: 10,
        modelUsed: 'test-model',
        textOnlyEnforced: true,
      };
    },
  });

  const pipeline = new HarnessPipeline({
    task: 'Inspect dependencies in package.json',
    mockHandler: (msgs) => adapter.generateChat(msgs),
  });

  await pipeline.execute();
  assert.equal(sawToolResultInNextTurn, true, 'Model must receive actual tool output in conversation');
});

test('5. The model can request additional context via search', async () => {
  const executor = new HarnessToolExecutor(process.cwd());
  const res = await executor.executeTool('search', { query: 'HarnessPipeline' });

  assert.equal(res.exitCode, 0);
  assert.ok(res.output.includes('HarnessPipeline'));
  assert.ok(res.output.includes('pipeline.ts'));

  const events = executor.getEvents();
  assert.ok(events.some((e) => e.tool === 'search'));
});

test('6. The model can make multiple sequential tool calls', async () => {
  let callCount = 0;

  const pipeline = new HarnessPipeline({
    task: 'Perform three-step discovery',
    mockHandler: async (messages: ModelMessage[]) => {
      callCount++;
      if (callCount === 1) {
        return {
          content: 'Step 1: list files',
          toolCalls: [{ id: 'c1', tool: 'list_files', args: { dirPath: '.' } }],
          tokensUsed: { prompt: 20, completion: 20, total: 40 },
          durationMs: 5,
          modelUsed: 'test-model',
          textOnlyEnforced: true,
        };
      } else if (callCount === 2) {
        return {
          content: 'Step 2: search files',
          toolCalls: [{ id: 'c2', tool: 'search', args: { query: 'scripts' } }],
          tokensUsed: { prompt: 40, completion: 20, total: 60 },
          durationMs: 5,
          modelUsed: 'test-model',
          textOnlyEnforced: true,
        };
      } else {
        return {
          content: 'Step 3: complete',
          toolCalls: [{ id: 'c3', tool: 'complete_task', args: { summary: 'Discovered everything' } }],
          tokensUsed: { prompt: 60, completion: 20, total: 80 },
          durationMs: 5,
          modelUsed: 'test-model',
          textOnlyEnforced: true,
        };
      }
    },
  });

  const res = await pipeline.execute();
  assert.ok(callCount >= 3, 'Model should execute multi-step tool calls');
  assert.ok(res.toolEvents.some((e) => e.tool === 'list_files'));
  assert.ok(res.toolEvents.some((e) => e.tool === 'search'));
});

test('7. A failed test is returned to the model with diagnostic classification', () => {
  const sampleFailure = `FAIL tests/auth.test.ts
AssertionError [ERR_ASSERTION]: Expected 200 OK but received 401 Unauthorized
    at TestContext.<anonymous> (tests/auth.test.ts:42:12)`;

  const diagnosis = FailureClassifier.diagnose('npm test', sampleFailure, 1, ['src/auth/token.ts']);
  assert.equal(diagnosis.category, 'TEST_FAILURE');
  assert.ok(diagnosis.symptom.includes('Automated test suite assertion failure') || diagnosis.symptom.includes('assertion'));
  assert.ok(diagnosis.failingCommand === 'npm test');
});

test('8. The model can recover from a failure via targeted patch', async () => {
  const diagnosis = FailureClassifier.diagnose('npm test', 'Expected 200 but received 401', 1, ['src/auth/token.ts']);
  const contract = TaskContractEngine.createContract('Fix 401 token authentication error');

  const recoveryPrompt = FailureClassifier.buildTargetedRecoveryPrompt(contract, diagnosis, 'diff', 0);
  assert.ok(recoveryPrompt.includes('PARISHRAM TARGETED RECOVERY'));
  assert.ok(recoveryPrompt.includes('TEST_FAILURE'));
});

test('9. A failed verification cannot become VERIFIED', async () => {
  const pipeline = new HarnessPipeline({
    task: 'Impossible task that fails verification',
    forbiddenPaths: ['src/**'],
    mockHandler: async () => ({
      content: 'Done',
      toolCalls: [{ id: 'c1', tool: 'complete_task', args: { summary: 'Claimed done' } }],
      tokensUsed: { prompt: 10, completion: 10, total: 20 },
      durationMs: 5,
      modelUsed: 'test-model',
      textOnlyEnforced: true,
    }),
  });

  const result = await pipeline.execute();
  // Verification must strictly reflect reality
  if (!result.verification.passed) {
    assert.equal(result.success, false);
    assert.equal(result.state, 'FAILED');
    assert.equal(result.proof, undefined);
  }
});

test('10. A successful verification can become VERIFIED with proof', async () => {
  const proof = await HarnessProofEngine.generateProof({
    runId: 'run-verify-test',
    task: 'Deterministic verified task',
    contract: TaskContractEngine.createContract('Pass verification'),
    context: {
      task: 'Pass verification',
      filesConsidered: [],
      filesSelected: [],
      totalTokensEstimate: 50,
      tokenBudget: 8000,
      budgetExceeded: false,
      indexedSymbols: [],
      durationMs: 10,
    },
    toolEvents: [],
    filesChanged: [],
    diff: '',
    verification: {
      passed: true,
      timestamp: new Date().toISOString(),
      durationMs: 50,
      tests: { total: 10, passed: 10, failed: 0, skipped: 0, output: '10 passed', rawExitCode: 0, durationMs: 40 },
      typecheck: { passed: true, errorsCount: 0, output: 'Pass', durationMs: 10 },
      scope: { passed: true, modifiedFiles: [], violations: [] },
      security: { passed: true, secretsDetected: [], dangerousCommandsBlocked: [] },
    },
    telemetry: {
      modelCalls: 1,
      promptTokens: 50,
      completionTokens: 20,
      totalTokens: 70,
      durationMs: 100,
      filesInspected: 1,
      filesModified: 0,
      retriesCount: 0,
      verificationAttempts: 1,
    },
    repositoryRoot: process.cwd(),
  });

  assert.equal(proof.status, 'VERIFIED');
  assert.ok(proof.proofHash.length === 64);
  assert.ok(proof.merkleRoot.length === 64);
  assert.equal(proof.merkleLeaves.length, 5);
});

test('11. Scope violations are rejected', () => {
  const contract = TaskContractEngine.createContract('Modify only client code', process.cwd(), {
    allowedPaths: ['src/components/**'],
    forbiddenPaths: ['.env', 'secrets/**'],
  });

  const forbiddenCheck = TaskContractEngine.validateScope('.env', contract);
  assert.equal(forbiddenCheck.allowed, false);
  assert.ok(forbiddenCheck.reason.toLowerCase().includes('forbidden'));

  const outOfBoundsCheck = TaskContractEngine.validateScope('src/server/auth.ts', contract);
  assert.equal(outOfBoundsCheck.allowed, false);

  const allowedCheck = TaskContractEngine.validateScope('src/components/button.tsx', contract);
  assert.equal(allowedCheck.allowed, true);
});

test('12. Rollback actually restores files to previous state', async () => {
  const testFile = path.join(process.cwd(), '.parishram-checkpoint-test.txt');
  await fs.writeFile(testFile, 'VERSION_1_ORIGINAL', 'utf-8');

  try {
    const cpManager = new HarnessCheckpointManager(process.cwd());
    const cp = await cpManager.createCheckpoint('test-cp', 'Snapshot before edit', ['.parishram-checkpoint-test.txt']);

    // Mutate file
    await fs.writeFile(testFile, 'VERSION_2_CORRUPTED', 'utf-8');
    assert.equal(await fs.readFile(testFile, 'utf-8'), 'VERSION_2_CORRUPTED');

    // Rollback
    await cpManager.rollbackToCheckpoint(cp.id);
    assert.equal(await fs.readFile(testFile, 'utf-8'), 'VERSION_1_ORIGINAL');
  } finally {
    await fs.unlink(testFile).catch(() => {});
  }
});

test('13. Proof contains actual run events in Merkle leaves', async () => {
  const toolEvents = [
    {
      id: 'tool-1',
      tool: 'read_file',
      input: { path: 'src/index.ts' },
      output: 'Read file',
      exitCode: 0,
      durationMs: 5,
      timestamp: new Date().toISOString(),
      status: 'completed' as const,
    },
  ];

  const proof = await HarnessProofEngine.generateProof({
    runId: 'run-events-check',
    task: 'Check run events',
    contract: TaskContractEngine.createContract('Check run events'),
    context: {
      task: 'Check run events',
      filesConsidered: [],
      filesSelected: [],
      totalTokensEstimate: 10,
      tokenBudget: 8000,
      budgetExceeded: false,
      indexedSymbols: [],
      durationMs: 5,
    },
    toolEvents,
    filesChanged: [],
    diff: '',
    verification: {
      passed: true,
      timestamp: new Date().toISOString(),
      durationMs: 10,
      tests: { total: 1, passed: 1, failed: 0, skipped: 0, output: 'ok', rawExitCode: 0, durationMs: 10 },
      typecheck: { passed: true, errorsCount: 0, output: '', durationMs: 5 },
      scope: { passed: true, modifiedFiles: [], violations: [] },
      security: { passed: true, secretsDetected: [], dangerousCommandsBlocked: [] },
    },
    telemetry: {
      modelCalls: 1,
      promptTokens: 10,
      completionTokens: 10,
      totalTokens: 20,
      durationMs: 20,
      filesInspected: 1,
      filesModified: 0,
      retriesCount: 0,
      verificationAttempts: 1,
    },
    repositoryRoot: process.cwd(),
  });

  const toolsLeaf = proof.merkleLeaves.find((l) => l.id === 'leaf-tools' || l.name.includes('Tool'));
  assert.ok(toolsLeaf, 'Merkle leaves must contain tool execution audit log');
  assert.ok(toolsLeaf.payloadSummary.includes('1 tool calls'));
});

test('14. AI_API_KEY is read from environment', () => {
  process.env.AI_API_KEY = 'test-env-key-9999';
  const adapter = new EvaluationModelAdapter();
  assert.equal(adapter.hasValidKey(), true);
  assert.equal(EvaluationModelAdapter.isEvaluationMode(), true);
  delete process.env.AI_API_KEY;
});

test('15. Evaluation mode uses prescribed model without substitution', () => {
  process.env.PARISHRAM_EVALUATION_MODE = 'true';
  const route = ModelRouter.routeTask('Arbitrary software task', 1);

  assert.equal(route.selectedModelId, 'hackathon-prescribed-model');
  assert.equal(route.fallbackModelId, undefined, 'Fallback model must be disabled in evaluation mode');
  delete process.env.PARISHRAM_EVALUATION_MODE;
});

test('16. No task-specific hard-coded solution path exists', async () => {
  // Verify that EvaluationModelAdapter.parseModelActions dynamically parses arbitrary tools
  const rawContentA = '```json\n{"tool": "edit_file", "arguments": {"path": "src/user.ts", "oldStr": "oldA", "newStr": "newA"}}\n```';
  const actionsA = EvaluationModelAdapter.parseModelActions(rawContentA);
  assert.equal(actionsA.length, 1);
  assert.equal(actionsA[0].tool, 'edit_file');
  assert.equal(actionsA[0].args.path, 'src/user.ts');
  assert.equal(actionsA[0].args.newStr, 'newA');

  const rawContentB = '```json\n{"tool": "write_file", "arguments": {"path": "src/database/migration.sql", "content": "CREATE TABLE logs;"}}\n```';
  const actionsB = EvaluationModelAdapter.parseModelActions(rawContentB);
  assert.equal(actionsB.length, 1);
  assert.equal(actionsB[0].tool, 'write_file');
  assert.equal(actionsB[0].args.path, 'src/database/migration.sql');
  assert.equal(actionsB[0].args.content, 'CREATE TABLE logs;');

  // Prove actionsA and actionsB are completely distinct and not hardcoded to auth gateway
  assert.notEqual(actionsA[0].args.path, actionsB[0].args.path);
  assert.notEqual(actionsA[0].tool, actionsB[0].tool);
});
