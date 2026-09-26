import { ToolName, ToolCall } from '@/types/agent';
import { MOCK_REPO_FILES, MOCK_SYMBOLS } from '@/lib/repository/mock-repo';

export interface ToolExecutionResponse {
  success: boolean;
  output: string;
  durationMs: number;
  data?: any;
  error?: string;
}

export class ToolExecutor {
  private static commandAllowlist = [
    'pnpm test',
    'pnpm run test',
    'pnpm run typecheck',
    'pnpm run lint',
    'pnpm run build',
    'npm test',
    'jest',
    'tsc --noEmit',
    'eslint',
    'git status',
    'git diff',
  ];

  public static async execute(tool: ToolName, input: Record<string, any>): Promise<ToolExecutionResponse> {
    const start = performance.now();

    switch (tool) {
      case 'read_file': {
        const path = input.path;
        const file = this.findFile(path);
        if (!file) {
          return {
            success: false,
            output: `Error: File '${path}' not found in repository index.`,
            durationMs: Math.round(performance.now() - start),
            error: 'FILE_NOT_FOUND',
          };
        }
        return {
          success: true,
          output: file.content || `[Binary or empty file: ${path}]`,
          durationMs: Math.round(performance.now() - start),
          data: { path, sizeBytes: file.sizeBytes },
        };
      }

      case 'search_files': {
        const query = (input.query || '').toLowerCase();
        const matches: { path: string; line: number; snippet: string }[] = [];

        const scan = (files: typeof MOCK_REPO_FILES) => {
          for (const f of files) {
            if (f.isDirectory && f.children) {
              scan(f.children);
            } else if (f.content) {
              const lines = f.content.split('\n');
              lines.forEach((line, idx) => {
                if (line.toLowerCase().includes(query)) {
                  matches.push({
                    path: f.path,
                    line: idx + 1,
                    snippet: line.trim(),
                  });
                }
              });
            }
          }
        };
        scan(MOCK_REPO_FILES);

        return {
          success: true,
          output: `Found ${matches.length} matches for "${query}":\n` +
            matches.map((m) => `${m.path}:${m.line} -> ${m.snippet}`).join('\n'),
          durationMs: Math.round(performance.now() - start),
          data: matches,
        };
      }

      case 'search_symbols': {
        const name = (input.symbolName || '').toLowerCase();
        const matched = MOCK_SYMBOLS.filter((s) => s.name.toLowerCase().includes(name));
        return {
          success: true,
          output: matched.length > 0
            ? matched.map((s) => `[${s.kind}] ${s.name} at ${s.filePath}:${s.line} (${s.signature})`).join('\n')
            : `No symbols found matching "${name}".`,
          durationMs: Math.round(performance.now() - start),
          data: matched,
        };
      }

      case 'edit_file': {
        const { path, reason } = input;
        return {
          success: true,
          output: `Successfully applied patch to ${path}.\nRationale: ${reason || 'Automated code repair'}\nWorking tree updated.`,
          durationMs: Math.round(performance.now() - start) + 120,
          data: { path, modified: true },
        };
      }

      case 'run_tests': {
        const filter = input.filter || 'all';
        const isTargeted = filter.includes('auth.integration') || filter.includes('auth');
        
        return {
          success: true,
          output: `RUNS tests: ${filter}\n\nPASS tests/unit/session.test.ts (2 tests, 12ms)\nPASS tests/integration/auth.test.ts (1 test, 42ms)\nPASS tests/regression/security.test.ts (1 test, 18ms)\n\nTest Suites: 3 passed, 3 total\nTests:       4 passed, 4 total\nSnapshots:   0 total\nTime:        1.42s\nRan all test suites.`,
          durationMs: 1420,
          data: { passed: 4, failed: 0, total: 4 },
        };
      }

      case 'run_typecheck': {
        return {
          success: true,
          output: `> tsc --noEmit\n✨ TypeScript verification passed (0 errors in 28 files).`,
          durationMs: 820,
        };
      }

      case 'run_linter': {
        return {
          success: true,
          output: `> eslint src/ tests/\n✔ Zero lint errors or stylistic warnings found.`,
          durationMs: 640,
        };
      }

      case 'git_diff': {
        return {
          success: true,
          output: `diff --git a/src/auth/client.ts b/src/auth/client.ts
index e69de29..b123456 100644
--- a/src/auth/client.ts
+++ b/src/auth/client.ts
@@ -23,6 +23,12 @@ export class AuthServiceClient {
   public async fetchWithAuth<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
     const headers = new Headers(options.headers || {});
+    
+    // FIX APPLIED BY FORGE: Forward session credentials
+    if (this.currentSession && this.currentSession.token) {
+      headers.set('Authorization', \`Bearer \${this.currentSession.token}\`);
+      headers.set('X-Session-ID', this.currentSession.id);
+    }
 
     const response = await fetch(\`\${this.baseUrl}\${endpoint}\`, {`,
          durationMs: 180,
        };
      }

      case 'run_command': {
        const cmd = input.command || '';
        const isAllowed = this.commandAllowlist.some((allowed) => cmd.startsWith(allowed));
        if (!isAllowed) {
          return {
            success: false,
            output: `Security violation: Command '${cmd}' is not in sandbox allowlist. Allowed commands: ${this.commandAllowlist.join(', ')}`,
            durationMs: 10,
            error: 'COMMAND_NOT_ALLOWLISTED',
          };
        }
        return {
          success: true,
          output: `[sandbox: ${cmd}] Command executed successfully with exit code 0.`,
          durationMs: 500,
        };
      }

      default:
        return {
          success: true,
          output: `Tool '${tool}' executed successfully.`,
          durationMs: 120,
        };
    }
  }

  private static findFile(path: string): any {
    const queue = [...MOCK_REPO_FILES];
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current.path === path) return current;
      if (current.children) queue.push(...current.children);
    }
    return null;
  }
}
