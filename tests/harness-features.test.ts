import test from 'node:test';
import assert from 'node:assert/strict';

import { ScopeGuard } from '../src/lib/safety/scope-guard';
import { TaskContractEngine, INITIAL_TASK_CONTRACT_1042 } from '../src/lib/agent/task-contract';
import { RegressionDetector } from '../src/lib/verification/regression-detector';
import { StuckAgentDetector } from '../src/lib/agent/stuck-detector';
import { CheckpointManager } from '../src/lib/agent/checkpoints';
import { SecurityGuard } from '../src/lib/safety/security-guard';
import { ModelArenaEngine } from '../src/lib/models/arena';
import { DocGenerator } from '../src/lib/docs/doc-generator';
import { BranchingExperimentsEngine } from '../src/lib/agent/branching-experiments';
import { ApprovalGateEngine } from '../src/lib/safety/approval-gate';
import { MultiAgentSystem } from '../src/lib/agent/multi-agent-system';

test('Feature 1: Scope Guard enforces task boundaries and blocks sensitive files', () => {
  const allowDec = ScopeGuard.evaluate('src/auth/client.ts', 'write');
  assert.equal(allowDec.status, 'IN_SCOPE');

  const blockDec = ScopeGuard.evaluate('.env.production', 'read');
  assert.equal(blockDec.status, 'BLOCKED');

  const approvalDec = ScopeGuard.evaluate('prisma/schema.prisma', 'write');
  assert.equal(approvalDec.status, 'NEEDS_APPROVAL');
});

test('Feature 2: Task Contract defines scope, constraints, and success criteria', () => {
  const contract = INITIAL_TASK_CONTRACT_1042;
  assert.ok(contract.scopeBoundaries.allowedPaths.length > 0);
  assert.ok(contract.constraints.length >= 3);
  assert.ok(contract.successCriteria.length >= 4);

  const evalResult = TaskContractEngine.evaluateContract(contract);
  assert.equal(evalResult.allSatisfied, true);
  assert.equal(evalResult.completionPercent, 100);
});

test('Feature 5: Regression Detection verifies invariants and blocks regressions', () => {
  const report = RegressionDetector.evaluateRun('run-1042');
  assert.equal(report.hasRegressions, false);
  assert.equal(report.verdict, 'NO_REGRESSIONS_DETECTED');
  assert.ok(report.totalInvariantsChecked >= 4);
});

test('Feature 7: Stuck-Agent Detection detects loops and tracks repeat telemetry', () => {
  // Healthy tool calls
  const healthy = StuckAgentDetector.analyzeToolCalls([
    {
      id: 'tc-1',
      tool: 'read_file',
      input: { path: 'a.ts' },
      status: 'completed',
      timestamp: '10:00:00',
    },
    {
      id: 'tc-2',
      tool: 'edit_file',
      input: { path: 'a.ts' },
      status: 'completed',
      timestamp: '10:00:01',
    },
  ]);
  assert.equal(healthy.isStuck, false);
  assert.equal(healthy.status, 'HEALTHY');

  // Repetitive tool loop
  const looping = StuckAgentDetector.analyzeToolCalls([
    { id: '1', tool: 'run_tests', input: { filter: 'auth' }, status: 'failed', timestamp: '1' },
    { id: '2', tool: 'run_tests', input: { filter: 'auth' }, status: 'failed', timestamp: '2' },
    { id: '3', tool: 'run_tests', input: { filter: 'auth' }, status: 'failed', timestamp: '3' },
  ]);
  assert.equal(looping.isStuck, true);
  assert.equal(looping.status, 'LOOP_DETECTED');
  assert.ok(looping.mitigationStrategy !== undefined);
});

test('Feature 8: Checkpoints and Rollback creates snapshots and restores state', () => {
  const checkpoints = CheckpointManager.getCheckpoints();
  assert.ok(checkpoints.length >= 3);

  const rollback = CheckpointManager.rollbackToCheckpoint(checkpoints[0].id);
  assert.equal(rollback.success, true);
  assert.ok(rollback.restoredCheckpoint !== undefined);
});

test('Feature 10: Security Guard scans secrets and blocks dangerous commands', () => {
  const safeCmd = SecurityGuard.auditCommand('npm test');
  assert.equal(safeCmd.safe, true);

  const dangerousCmd = SecurityGuard.auditCommand('rm -rf /');
  assert.equal(dangerousCmd.safe, false);

  const secretFindings = SecurityGuard.scanCodeForSecrets(
    'const key = "ghp_1234567890abcdefghijklmnopqrstuvwx";',
    'auth.ts'
  );
  assert.ok(secretFindings.length > 0);
  assert.equal(secretFindings[0].severity, 'critical');
});

test('Feature 11: Model Arena benchmarks candidates head-to-head', () => {
  const contenders = ModelArenaEngine.getCandidates();
  assert.ok(contenders.length >= 3);

  const winner = contenders.find((c) => c.isWinner);
  assert.ok(winner !== undefined);
  assert.ok(winner.testsPassed === winner.testsTotal);
});

test('Feature 15: Automatic Documentation synthesizes ADRs, API docs, and changelogs', () => {
  const docs = DocGenerator.getGeneratedDocs();
  assert.ok(docs.length >= 3);

  const adr = docs.find((d) => d.type === 'adr');
  assert.ok(adr !== undefined);
  assert.ok(adr.content.includes('ADR-042'));

  const changelog = docs.find((d) => d.type === 'changelog');
  assert.ok(changelog !== undefined);
});

test('Feature 16: Branching Experiments compares parallel trial branches', () => {
  const trials = BranchingExperimentsEngine.getTrials();
  assert.ok(trials.length >= 3);

  const winningTrial = trials.find((t) => t.isWinningCandidate);
  assert.ok(winningTrial !== undefined);
  assert.equal(winningTrial.status, 'PASSED');

  const selection = BranchingExperimentsEngine.selectWinner(trials[0].id);
  assert.equal(selection.success, true);
});

test('Feature 17: Human Approval Gate records and decides high-risk actions', () => {
  const requests = ApprovalGateEngine.getRequests();
  assert.ok(requests.length >= 2);

  const newReq = ApprovalGateEngine.createRequest(
    'CORE_AUTH_EDIT',
    'Update Auth Token Forwarding',
    'Inject Authorization Bearer header',
    'LOW',
    ['src/auth/client.ts'],
    '+ Authorization: Bearer'
  );
  assert.equal(newReq.status, 'PENDING');

  const decision = ApprovalGateEngine.decideRequest(newReq.id, 'APPROVED', 'Verified by test');
  assert.equal(decision.success, true);
  assert.equal(decision.request?.status, 'APPROVED');
});

test('Navigating AI and Supervisor AI multi-agent coordination', () => {
  const team = MultiAgentSystem.getTeam();
  assert.equal(team.length, 2);

  const nav = MultiAgentSystem.getNavigator();
  assert.equal(nav.displayName, 'Navigating AI');
  assert.equal(nav.badgeLabel, 'NAVIGATOR');
  assert.ok(Number(nav.stats['Files Scanned']) > 0);

  const sup = MultiAgentSystem.getSupervisor();
  assert.equal(sup.displayName, 'Supervisor AI');
  assert.equal(sup.badgeLabel, 'SUPERVISOR');
  assert.ok(sup.recentThoughts.length > 0);
});
