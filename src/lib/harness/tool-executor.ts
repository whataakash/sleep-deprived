import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { ToolCallEvent, TaskContract } from './types';
import { TaskContractEngine } from './task-contract';
import { SecurityGuard } from '../safety/security-guard';

const execAsync = promisify(exec);

export class HarnessToolExecutor {
  private repositoryRoot: string;
  private contract?: TaskContract;
  private events: ToolCallEvent[] = [];
  private onEventCallback?: (event: ToolCallEvent) => void;

  constructor(
    repositoryRoot: string = process.cwd(),
    contract?: TaskContract,
    onEventCallback?: (event: ToolCallEvent) => void
  ) {
    this.repositoryRoot = repositoryRoot;
    this.contract = contract;
    this.onEventCallback = onEventCallback;
  }

  public getEvents(): ToolCallEvent[] {
    return [...this.events];
  }

  private recordEvent(event: ToolCallEvent): void {
    this.events.push(event);
    if (this.onEventCallback) {
      try {
        this.onEventCallback(event);
      } catch {
        // Callback errors should not crash tool execution
      }
    }
  }

  /**
   * Reads file content with path normalization.
   */
  public async readFile(filePath: string): Promise<string> {
    const startTime = Date.now();
    const eventId = 'tool-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 5);
    const resolvedPath = path.resolve(this.repositoryRoot, filePath);

    try {
      const content = await fs.readFile(resolvedPath, 'utf-8');
      this.recordEvent({
        id: eventId,
        tool: 'read_file',
        input: { filePath },
        output: `Read ${content.split('\n').length} lines (${content.length} bytes)`,
        exitCode: 0,
        durationMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        status: 'completed',
      });
      return content;
    } catch (err: any) {
      this.recordEvent({
        id: eventId,
        tool: 'read_file',
        input: { filePath },
        output: '',
        error: err.message,
        exitCode: 1,
        durationMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        status: 'failed',
      });
      throw new Error(`readFile failed for ${filePath}: ${err.message}`);
    }
  }

  /**
   * Overwrites or creates a file, enforcing Task Contract scope boundaries.
   */
  public async writeFile(filePath: string, content: string): Promise<void> {
    const startTime = Date.now();
    const eventId = 'tool-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 5);

    // 1. Scope Guard verification
    if (this.contract) {
      const scopeCheck = TaskContractEngine.validateScope(filePath, this.contract);
      if (!scopeCheck.allowed) {
        this.recordEvent({
          id: eventId,
          tool: 'write_file',
          input: { filePath, contentLength: content.length },
          output: '',
          error: `SCOPE VIOLATION: ${scopeCheck.reason}`,
          exitCode: 1,
          durationMs: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          status: 'failed',
        });
        throw new Error(`SCOPE_VIOLATION: ${scopeCheck.reason}`);
      }
    }

    // 2. Secret scanning
    const secrets = SecurityGuard.scanCodeForSecrets(content, filePath);
    if (secrets.length > 0) {
      const reason = `Security violation: detected hardcoded secret (${secrets[0].pattern})`;
      this.recordEvent({
        id: eventId,
        tool: 'write_file',
        input: { filePath },
        output: '',
        error: reason,
        exitCode: 1,
        durationMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        status: 'failed',
      });
      throw new Error(`SECURITY_VIOLATION: ${reason}`);
    }

    const resolvedPath = path.resolve(this.repositoryRoot, filePath);
    try {
      await fs.mkdir(path.dirname(resolvedPath), { recursive: true });
      await fs.writeFile(resolvedPath, content, 'utf-8');
      this.recordEvent({
        id: eventId,
        tool: 'write_file',
        input: { filePath, contentLength: content.length },
        output: `Successfully wrote ${content.length} bytes to ${filePath}`,
        exitCode: 0,
        durationMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        status: 'completed',
      });
    } catch (err: any) {
      this.recordEvent({
        id: eventId,
        tool: 'write_file',
        input: { filePath },
        output: '',
        error: err.message,
        exitCode: 1,
        durationMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        status: 'failed',
      });
      throw err;
    }
  }

  /**
   * Applies targeted replacement within an existing file.
   */
  public async editFile(
    filePath: string,
    oldStr: string,
    newStr: string,
    rationale?: string
  ): Promise<{ linesChanged: number; diff: string }> {
    const startTime = Date.now();
    const eventId = 'tool-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 5);

    // Scope check
    if (this.contract) {
      const scopeCheck = TaskContractEngine.validateScope(filePath, this.contract);
      if (!scopeCheck.allowed) {
        throw new Error(`SCOPE_VIOLATION: ${scopeCheck.reason}`);
      }
    }

    const existingContent = await this.readFile(filePath);
    if (!existingContent.includes(oldStr)) {
      const errorMsg = `PATCH_FAILURE: Target text to replace not found in ${filePath}`;
      this.recordEvent({
        id: eventId,
        tool: 'edit_file',
        input: { filePath, rationale },
        output: '',
        error: errorMsg,
        exitCode: 1,
        durationMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        status: 'failed',
      });
      throw new Error(errorMsg);
    }

    const updatedContent = existingContent.replace(oldStr, newStr);
    await this.writeFile(filePath, updatedContent);

    const oldLines = oldStr.split('\n').length;
    const newLines = newStr.split('\n').length;
    const diff = `--- a/${filePath}\n+++ b/${filePath}\n@@ -1,${oldLines} +1,${newLines} @@\n${oldStr
      .split('\n')
      .map((l) => '-' + l)
      .join('\n')}\n${newStr
      .split('\n')
      .map((l) => '+' + l)
      .join('\n')}`;

    this.recordEvent({
      id: eventId,
      tool: 'edit_file',
      input: { filePath, rationale },
      output: `Replaced ${oldLines} lines with ${newLines} lines in ${filePath}`,
      exitCode: 0,
      durationMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      status: 'completed',
    });

    return { linesChanged: Math.abs(newLines - oldLines) + oldLines, diff };
  }

  /**
   * Lists files in a given directory relative to repository root.
   */
  public async listFiles(dirPath: string = '.'): Promise<string[]> {
    const startTime = Date.now();
    const eventId = 'tool-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 5);
    const resolvedDir = path.resolve(this.repositoryRoot, dirPath);

    try {
      const entries = await fs.readdir(resolvedDir, { withFileTypes: true });
      const paths = entries.map((e) => (e.isDirectory() ? e.name + '/' : e.name));
      this.recordEvent({
        id: eventId,
        tool: 'list_files',
        input: { dirPath },
        output: `Found ${paths.length} items`,
        exitCode: 0,
        durationMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        status: 'completed',
      });
      return paths;
    } catch (err: any) {
      this.recordEvent({
        id: eventId,
        tool: 'list_files',
        input: { dirPath },
        output: '',
        error: err.message,
        exitCode: 1,
        durationMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        status: 'failed',
      });
      throw err;
    }
  }

  /**
   * Executes a shell command inside the repository root with security checks and timeout bounds.
   */
  public async runCommand(
    command: string,
    timeoutMs: number = 60000
  ): Promise<{ stdout: string; stderr: string; exitCode: number; durationMs: number }> {
    const startTime = Date.now();
    const eventId = 'tool-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 5);

    // Security Guard check
    const securityAudit = SecurityGuard.auditCommand(command);
    if (!securityAudit.safe) {
      const reason = securityAudit.blockedReason || 'Blocked dangerous command pattern';
      this.recordEvent({
        id: eventId,
        tool: 'run_command',
        input: { command },
        output: '',
        error: reason,
        exitCode: 1,
        durationMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        status: 'failed',
      });
      throw new Error(`SECURITY_GUARD_BLOCKED: ${reason}`);
    }

    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: this.repositoryRoot,
        timeout: timeoutMs,
        maxBuffer: 5 * 1024 * 1024,
      });

      const durationMs = Date.now() - startTime;
      this.recordEvent({
        id: eventId,
        tool: 'run_command',
        input: { command },
        output: stdout.slice(0, 1000) + (stdout.length > 1000 ? '... [truncated]' : ''),
        exitCode: 0,
        durationMs,
        timestamp: new Date().toISOString(),
        status: 'completed',
      });

      return { stdout, stderr, exitCode: 0, durationMs };
    } catch (err: any) {
      const durationMs = Date.now() - startTime;
      const stdout = err.stdout || '';
      const stderr = err.stderr || err.message || '';
      const exitCode = err.code ?? (err.killed ? 124 : 1);

      this.recordEvent({
        id: eventId,
        tool: 'run_command',
        input: { command },
        output: stdout.slice(0, 500),
        error: stderr.slice(0, 500),
        exitCode,
        durationMs,
        timestamp: new Date().toISOString(),
        status: 'failed',
      });

      return { stdout, stderr, exitCode, durationMs };
    }
  }

  /**
   * Runs tests with optional filter.
   */
  public async runTests(filter?: string): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    const cmd = filter ? `npm test -- ${filter}` : 'npm test';
    return this.runCommand(cmd);
  }

  /**
   * Runs TypeScript compiler typecheck with strict diagnostics.
   */
  public async runTypecheck(): Promise<{ passed: boolean; output: string; errorCount: number }> {
    const res = await this.runCommand('npx tsc --noEmit');
    const passed = res.exitCode === 0;
    const output = (res.stdout + '\n' + res.stderr).trim();
    const errorMatches = output.match(/error TS\d+/g) || [];

    return {
      passed,
      output,
      errorCount: errorMatches.length,
    };
  }

  /**
   * Computes git diff of the working tree.
   */
  public async getGitDiff(): Promise<string> {
    const res = await this.runCommand('git diff');
    return res.stdout;
  }
}
