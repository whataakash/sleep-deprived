import path from 'path';
import { TaskContract, VerificationRequirement } from './types';

export class TaskContractEngine {
  public static readonly DEFAULT_FORBIDDEN_PATTERNS = [
    /^\.env.*/,
    /.*credentials.*/i,
    /.*secret.*/i,
    /.*id_rsa.*/i,
    /.*\.pem$/i,
    /^node_modules\/.*/,
    /^\.git\/.*/,
    /^package-lock\.json$/,
  ];

  /**
   * Generates a formal, machine-readable Task Contract from a user task and repository root.
   */
  public static createContract(
    task: string,
    repositoryRoot: string = process.cwd(),
    options?: {
      allowedPaths?: string[];
      forbiddenPaths?: string[];
      verificationCommands?: VerificationRequirement[];
      maxRetries?: number;
      maxDurationMs?: number;
      maxTokens?: number;
    }
  ): TaskContract {
    const taskId = 'contract-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);
    const cleanedTask = task.trim();

    // 1. Infer target files or directories from task text
    const inferredPaths = this.inferCandidatePathsFromTask(cleanedTask);

    // 2. Compute allowed paths
    const allowedPaths = options?.allowedPaths && options.allowedPaths.length > 0
      ? options.allowedPaths
      : inferredPaths.length > 0
        ? inferredPaths
        : ['src/**/*', 'tests/**/*'];

    // 3. Default forbidden paths
    const forbiddenPaths = options?.forbiddenPaths || [
      '.env*',
      '.git/**',
      'node_modules/**',
      '*.pem',
      'id_rsa*',
      'package-lock.json',
    ];

    // 4. Verification requirements
    const verificationRequirements: VerificationRequirement[] = options?.verificationCommands || [
      {
        id: 'req-tests',
        name: 'Automated Test Suite',
        command: 'npm test',
        description: 'Targeted and regression unit/integration test suite execution',
        required: true,
      },
      {
        id: 'req-typecheck',
        name: 'TypeScript Compiler Verification',
        command: 'npx tsc --noEmit',
        description: 'Verify 100% strict type safety with zero diagnostics',
        required: true,
      },
      {
        id: 'req-scope',
        name: 'Task Boundary & Scope Enforcement',
        command: 'internal:scope_guard',
        description: 'Ensure only files within allowed task boundaries are touched',
        required: true,
      },
      {
        id: 'req-security',
        name: 'Zero-Secret Security Audit',
        command: 'internal:security_guard',
        description: 'Ensure zero hardcoded API keys, private keys, or destructive shell invocations',
        required: true,
      },
    ];

    // 5. Constraints
    const constraints: string[] = [
      'Strictly enforce task boundary: only modify files required for the task',
      'Never commit hardcoded secrets, private keys, or credentials',
      'Zero TypeScript compilation errors (tsc --noEmit must exit with code 0)',
      'All automated test suites must pass with zero regressions',
      'Changes must be backed by unified diff and reproducible verification logs',
    ];

    return {
      id: taskId,
      taskId: 'task-' + Date.now().toString(36),
      objective: cleanedTask,
      repositoryRoot,
      constraints,
      allowedPaths,
      forbiddenPaths,
      verificationRequirements,
      stopConditions: {
        maxRetries: options?.maxRetries ?? 3,
        maxDurationMs: options?.maxDurationMs ?? 180000, // 3 minutes
        maxTokens: options?.maxTokens ?? 32000,
      },
      createdAt: new Date().toISOString(),
      isSealed: true,
    };
  }

  /**
   * Scans task text for explicit file paths, extensions, or directory references.
   */
  private static inferCandidatePathsFromTask(task: string): string[] {
    const candidates: string[] = [];
    const tokens = task.split(/[\s,`'":]+/);

    for (const token of tokens) {
      if (
        (token.includes('/') || token.endsWith('.ts') || token.endsWith('.tsx') || token.endsWith('.js') || token.endsWith('.json')) &&
        !token.startsWith('http')
      ) {
        // Normalize path
        const cleaned = token.replace(/^[./\\]+/, '');
        if (cleaned.length > 2 && !candidates.includes(cleaned)) {
          candidates.push(cleaned);
        }
      }
    }

    // Keyword inferences
    const lower = task.toLowerCase();
    if (lower.includes('auth') || lower.includes('token') || lower.includes('session')) {
      if (!candidates.includes('src/auth/**/*') && !candidates.some(c => c.startsWith('src/auth'))) {
        candidates.push('src/auth/**/*');
      }
      if (!candidates.includes('tests/auth*') && !candidates.some(c => c.startsWith('tests'))) {
        candidates.push('tests/**/*');
      }
    }

    return candidates;
  }

  /**
   * Evaluates whether a proposed file path violates contract scope rules.
   */
  public static validateScope(
    filePath: string,
    contract: TaskContract
  ): { allowed: boolean; reason: string } {
    // Strip relative prefixes like './' or '.\' while preserving dotfiles like '.env'
    const normalized = filePath.replace(/^(\.[/\\])+/, '').replace(/^[/\\]+/, '').replace(/\\/g, '/');

    // 1. Check forbidden patterns first
    for (const pattern of this.DEFAULT_FORBIDDEN_PATTERNS) {
      if (pattern.test(normalized)) {
        return {
          allowed: false,
          reason: `Forbidden path: matched protected pattern ${pattern.toString()}`,
        };
      }
    }

    for (const forbidden of contract.forbiddenPaths) {
      const globRegex = new RegExp(
        '^' + forbidden.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*') + '$'
      );
      if (globRegex.test(normalized)) {
        return {
          allowed: false,
          reason: `Forbidden path: matched contract restriction '${forbidden}'`,
        };
      }
    }

    // 2. Check allowed paths
    if (!contract.allowedPaths || contract.allowedPaths.length === 0) {
      return { allowed: true, reason: 'Wildcard scope enabled' };
    }

    for (const allowed of contract.allowedPaths) {
      const normalizedAllowed = allowed.replace(/\\/g, '/');

      // Check exact match
      if (normalized === normalizedAllowed) {
        return {
          allowed: true,
          reason: `In scope: exact match '${allowed}'`,
        };
      }

      // Check directory prefix (e.g. 'src/auth/**/*' or 'src/auth/**' or 'src/auth/*')
      const baseDir = normalizedAllowed.replace(/\/?\*{1,2}(\/\*)?$/, '');
      if (baseDir.length > 0 && (normalized === baseDir || normalized.startsWith(baseDir + '/'))) {
        return {
          allowed: true,
          reason: `In scope: matched allowed directory prefix '${baseDir}' from '${allowed}'`,
        };
      }

      // Check glob regex
      const regexStr = '^' + normalizedAllowed
        .replace(/[.+^${}()|[\]\\]/g, '\\$&')
        .replace(/\/\*\*(\/\*)?/g, '(/.*)?')
        .replace(/\*/g, '[^/]*') + '$';

      try {
        if (new RegExp(regexStr).test(normalized)) {
          return {
            allowed: true,
            reason: `In scope: matched allowed glob '${allowed}'`,
          };
        }
      } catch {
        // Fallback
      }
    }

    return {
      allowed: false,
      reason: `Out of scope: '${normalized}' does not match any allowedPaths: [${contract.allowedPaths.join(', ')}]`,
    };
  }
}
