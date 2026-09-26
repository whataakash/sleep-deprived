import fs from 'fs/promises';
import path from 'path';
import { HarnessToolExecutor } from './tool-executor';
import {
  TaskContract,
  VerificationResult,
  VerificationScopeResults,
  VerificationSecurityResults,
  VerificationTestResults,
  VerificationTypecheckResults,
} from './types';
import { TaskContractEngine } from './task-contract';
import { SecurityGuard } from '../safety/security-guard';

export class HarnessVerificationGate {
  /**
   * Executes deterministic verification matrix: tests + typecheck + scope + security.
   * A run cannot be verified unless ALL required checks succeed with 0 errors.
   */
  public static async executeVerification(
    toolExecutor: HarnessToolExecutor,
    contract: TaskContract,
    modifiedFiles: string[] = [],
    repositoryRoot: string = process.cwd()
  ): Promise<VerificationResult> {
    const startTime = Date.now();

    // 1. Run Automated Test Suites
    const testResult = await this.runTestVerification(toolExecutor, contract);

    // 2. Run TypeScript Compiler Verification
    const typecheckResult = await this.runTypecheckVerification(toolExecutor);

    // 3. Run Scope Guard Validation
    const scopeResult = this.runScopeVerification(contract, modifiedFiles);

    // 4. Run Security & Secret Scan
    const securityResult = await this.runSecurityVerification(repositoryRoot, modifiedFiles);

    // Hard Gate Decision: All 4 must be completely clean
    const passed =
      testResult.rawExitCode === 0 &&
      testResult.failed === 0 &&
      typecheckResult.passed &&
      scopeResult.passed &&
      securityResult.passed;

    return {
      passed,
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      tests: testResult,
      typecheck: typecheckResult,
      scope: scopeResult,
      security: securityResult,
    };
  }

  private static async runTestVerification(
    toolExecutor: HarnessToolExecutor,
    contract: TaskContract
  ): Promise<VerificationTestResults> {
    const startTime = Date.now();
    const testReq = contract.verificationRequirements.find((r) => r.id === 'req-tests');
    const cmd = testReq?.command || 'npm test';

    const res = await toolExecutor.runCommand(cmd, 90000);
    const combinedOutput = (res.stdout + '\n' + res.stderr).trim();

    // Parse test counts from output (supports node:test, vitest, and jest format)
    let passed = 0;
    let failed = 0;
    let total = 0;
    let skipped = 0;

    // Node:test format: "ℹ pass 25" / "ℹ fail 0"
    const nodePassMatch = combinedOutput.match(/ℹ\s+pass\s+(\d+)/);
    const nodeFailMatch = combinedOutput.match(/ℹ\s+fail\s+(\d+)/);
    if (nodePassMatch) passed = parseInt(nodePassMatch[1], 10);
    if (nodeFailMatch) failed = parseInt(nodeFailMatch[1], 10);

    // Jest/Vitest format: "Tests:  25 passed, 25 total"
    const jestMatch = combinedOutput.match(/(\d+)\s+passed,\s*(\d+)\s+total/);
    if (jestMatch) {
      passed = parseInt(jestMatch[1], 10);
      total = parseInt(jestMatch[2], 10);
    }

    // Check for explicit "fail" indicators if not parsed
    if (!nodePassMatch && !jestMatch) {
      const checkmarks = (combinedOutput.match(/✔/g) || []).length;
      const crossmarks = (combinedOutput.match(/✖|FAIL/g) || []).length;
      passed = checkmarks;
      failed = crossmarks;
      total = checkmarks + crossmarks;
    }

    if (total === 0) {
      total = passed + failed;
    }

    // If exit code is non-zero, ensure failed is at least 1
    if (res.exitCode !== 0 && failed === 0) {
      failed = 1;
    }

    return {
      total,
      passed,
      failed,
      skipped,
      output: combinedOutput.slice(0, 3000),
      rawExitCode: res.exitCode,
      durationMs: Date.now() - startTime,
    };
  }

  private static async runTypecheckVerification(
    toolExecutor: HarnessToolExecutor
  ): Promise<VerificationTypecheckResults> {
    const startTime = Date.now();
    const typecheckRes = await toolExecutor.runTypecheck();

    return {
      passed: typecheckRes.passed && typecheckRes.errorCount === 0,
      errorsCount: typecheckRes.errorCount,
      output: typecheckRes.output.slice(0, 2000),
      durationMs: Date.now() - startTime,
    };
  }

  private static runScopeVerification(
    contract: TaskContract,
    modifiedFiles: string[]
  ): VerificationScopeResults {
    const violations: string[] = [];

    for (const file of modifiedFiles) {
      const check = TaskContractEngine.validateScope(file, contract);
      if (!check.allowed) {
        violations.push(`${file}: ${check.reason}`);
      }
    }

    return {
      passed: violations.length === 0,
      modifiedFiles,
      violations,
    };
  }

  private static async runSecurityVerification(
    repositoryRoot: string,
    modifiedFiles: string[]
  ): Promise<VerificationSecurityResults> {
    const secretsDetected: { file: string; pattern: string; redacted: string }[] = [];

    for (const file of modifiedFiles) {
      try {
        const fullPath = path.resolve(repositoryRoot, file);
        const content = await fs.readFile(fullPath, 'utf-8');
        const findings = SecurityGuard.scanCodeForSecrets(content, file);
        for (const finding of findings) {
          secretsDetected.push({
            file,
            pattern: finding.pattern,
            redacted: finding.redactedSnippet,
          });
        }
      } catch {
        // File may have been removed or unreadable
      }
    }

    return {
      passed: secretsDetected.length === 0,
      secretsDetected,
      dangerousCommandsBlocked: [],
    };
  }
}
