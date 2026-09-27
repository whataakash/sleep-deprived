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

  /**
   * Recursively searches for text across files in the repository.
   */
  public async search(
    query: string,
    dirPath: string = '.',
    maxResults: number = 25
  ): Promise<{ matches: { path: string; line: number; content: string }[]; total: number }> {
    const startTime = Date.now();
    const eventId = 'tool-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 5);
    const resolvedDir = path.resolve(this.repositoryRoot, dirPath);
    const matches: { path: string; line: number; content: string }[] = [];
    const ignoreDirs = new Set(['.git', 'node_modules', '.next', 'dist', 'build', '.parishram', '.turbo', 'coverage']);

    const walk = async (currentDir: string): Promise<void> => {
      if (matches.length >= maxResults) return;
      let entries: any[] = [];
      try {
        entries = await fs.readdir(currentDir, { withFileTypes: true });
      } catch {
        return;
      }

      for (const entry of entries) {
        if (matches.length >= maxResults) break;
        if (entry.isDirectory()) {
          if (!ignoreDirs.has(entry.name) && !entry.name.startsWith('.')) {
            await walk(path.join(currentDir, entry.name));
          }
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          const binaryExts = new Set(['.png', '.jpg', '.jpeg', '.gif', '.ico', '.pdf', '.zip', '.tar', '.gz', '.woff', '.woff2', '.ttf']);
          if (binaryExts.has(ext)) continue;

          const filePath = path.join(currentDir, entry.name);
          try {
            const content = await fs.readFile(filePath, 'utf-8');
            const lines = content.split('\n');
            const lowerQuery = query.toLowerCase();
            for (let i = 0; i < lines.length; i++) {
              if (lines[i].toLowerCase().includes(lowerQuery)) {
                const relPath = path.relative(this.repositoryRoot, filePath);
                matches.push({
                  path: relPath,
                  line: i + 1,
                  content: lines[i].trim().slice(0, 200),
                });
                if (matches.length >= maxResults) break;
              }
            }
          } catch {
            // Ignore unreadable or locked files
          }
        }
      }
    };

    try {
      await walk(resolvedDir);
      this.recordEvent({
        id: eventId,
        tool: 'search',
        input: { query, dirPath },
        output: `Found ${matches.length} matches for "${query}"`,
        exitCode: 0,
        durationMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        status: 'completed',
      });
      return { matches, total: matches.length };
    } catch (err: any) {
      this.recordEvent({
        id: eventId,
        tool: 'search',
        input: { query, dirPath },
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
   * Unified tool execution dispatcher for model-driven tool loops.
   */
  public async executeTool(
    toolName: string,
    args: Record<string, any>
  ): Promise<{ output: string; error?: string; exitCode: number; diff?: string }> {
    const normTool = (toolName || '').toLowerCase().trim();
    try {
      switch (normTool) {
        case 'read_file': {
          const filePath = args.path || args.filePath;
          if (!filePath) throw new Error('read_file requires "path" argument');
          const content = await this.readFile(filePath);
          const lines = content.split('\n');
          const startLine = Math.max(1, Number(args.startLine || 1));
          const lineCount = Number(args.lineCount || args.limit || lines.length);
          const sliced = lines.slice(startLine - 1, startLine - 1 + lineCount);
          const numbered = sliced.map((l, i) => `${startLine + i}: ${l}`).join('\n');
          return { output: numbered, exitCode: 0 };
        }
        case 'edit_file': {
          const filePath = args.path || args.filePath;
          const oldStr = args.oldStr !== undefined ? args.oldStr : args.target;
          const newStr = args.newStr !== undefined ? args.newStr : args.replacement;
          if (!filePath) throw new Error('edit_file requires "path" argument');
          if (oldStr === undefined) throw new Error('edit_file requires "oldStr" argument');
          if (newStr === undefined) throw new Error('edit_file requires "newStr" argument');
          const res = await this.editFile(filePath, oldStr, newStr, args.rationale);
          return {
            output: `Successfully applied patch to ${filePath} (${res.linesChanged} lines modified)`,
            diff: res.diff,
            exitCode: 0,
          };
        }
        case 'write_file': {
          const filePath = args.path || args.filePath;
          const content = args.content;
          if (!filePath) throw new Error('write_file requires "path" argument');
          if (content === undefined) throw new Error('write_file requires "content" argument');
          await this.writeFile(filePath, content);
          return {
            output: `Successfully wrote ${content.length} bytes to ${filePath}`,
            exitCode: 0,
          };
        }
        case 'list_files': {
          const dirPath = args.dirPath || args.path || '.';
          const files = await this.listFiles(dirPath);
          return { output: files.join('\n'), exitCode: 0 };
        }
        case 'search':
        case 'search_files': {
          const query = args.query || args.term;
          if (!query) throw new Error('search requires "query" argument');
          const searchRes = await this.search(query, args.dirPath || '.', args.maxResults || 25);
          if (searchRes.matches.length === 0) {
            return { output: `No matches found for "${query}"`, exitCode: 0 };
          }
          const formatted = searchRes.matches
            .map((m) => `${m.path}:${m.line}: ${m.content}`)
            .join('\n');
          return { output: formatted, exitCode: 0 };
        }
        case 'run_command': {
          const cmd = args.command;
          if (!cmd) throw new Error('run_command requires "command" argument');
          const cmdRes = await this.runCommand(cmd, args.timeoutMs);
          const out = (cmdRes.stdout + (cmdRes.stderr ? '\n' + cmdRes.stderr : '')).trim();
          return {
            output: out || `Command completed with exit code ${cmdRes.exitCode}`,
            exitCode: cmdRes.exitCode,
            error: cmdRes.exitCode !== 0 ? cmdRes.stderr || 'Command failed' : undefined,
          };
        }
        case 'run_tests': {
          const filter = args.filter;
          const testRes = await this.runTests(filter);
          const out = (testRes.stdout + (testRes.stderr ? '\n' + testRes.stderr : '')).trim();
          return {
            output: out || `Tests completed with exit code ${testRes.exitCode}`,
            exitCode: testRes.exitCode,
            error: testRes.exitCode !== 0 ? 'Tests failed' : undefined,
          };
        }
        case 'get_git_diff': {
          const diff = await this.getGitDiff();
          return { output: diff || 'No diff detected in working tree', exitCode: 0 };
        }
        case 'complete_task': {
          return {
            output: `Task completion signaled: ${args.summary || 'Acceptance criteria addressed.'}`,
            exitCode: 0,
          };
        }
        default: {
          throw new Error(`Unknown tool "${toolName}". Available tools: list_files, read_file, search, edit_file, write_file, run_command, run_tests, get_git_diff, complete_task`);
        }
      }
    } catch (err: any) {
      return {
        output: '',
        error: err.message,
        exitCode: 1,
      };
    }
  }
}
