import { ToolName } from '@/types/agent';

export interface ToolDefinition {
  name: ToolName;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, { type: string; description: string; required?: boolean }>;
    required: string[];
  };
  isDangerous: boolean;
  requiresApproval?: boolean;
}

export const TOOL_DEFINITIONS: Record<ToolName, ToolDefinition> = {
  read_file: {
    name: 'read_file',
    description: 'Read the contents of a file at the given path within the repository.',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Relative path of the target file' },
        startLine: { type: 'number', description: 'Optional starting line' },
        endLine: { type: 'number', description: 'Optional ending line' },
      },
      required: ['path'],
    },
    isDangerous: false,
  },
  write_file: {
    name: 'write_file',
    description: 'Write entire content to a file, replacing previous content.',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Relative path of the target file' },
        content: { type: 'string', description: 'Complete file text to write' },
      },
      required: ['path', 'content'],
    },
    isDangerous: true,
  },
  edit_file: {
    name: 'edit_file',
    description: 'Apply targeted patch or replacement to a file.',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Relative path of the target file' },
        targetText: { type: 'string', description: 'Exact lines or block to replace' },
        replacementText: { type: 'string', description: 'New replacement lines' },
        reason: { type: 'string', description: 'Engineering rationale for the edit' },
      },
      required: ['path', 'targetText', 'replacementText'],
    },
    isDangerous: false,
  },
  search_files: {
    name: 'search_files',
    description: 'Search repository files using regex or literal substring.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search term or regex pattern' },
        filePattern: { type: 'string', description: 'Glob pattern e.g. *.ts' },
      },
      required: ['query'],
    },
    isDangerous: false,
  },
  search_symbols: {
    name: 'search_symbols',
    description: 'Find function, class, or interface declarations across the repository.',
    parameters: {
      type: 'object',
      properties: {
        symbolName: { type: 'string', description: 'Identifier name to look up' },
      },
      required: ['symbolName'],
    },
    isDangerous: false,
  },
  list_directory: {
    name: 'list_directory',
    description: 'List contents of a directory in the workspace.',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Directory relative path' },
      },
      required: ['path'],
    },
    isDangerous: false,
  },
  run_command: {
    name: 'run_command',
    description: 'Execute a verified command inside the isolated repository sandbox.',
    parameters: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'Command to run (allowlisted)' },
        timeoutSeconds: { type: 'number', description: 'Max runtime before kill' },
      },
      required: ['command'],
    },
    isDangerous: true,
    requiresApproval: true,
  },
  run_tests: {
    name: 'run_tests',
    description: 'Run automated test suites (unit, integration, regression or specific test file).',
    parameters: {
      type: 'object',
      properties: {
        filter: { type: 'string', description: 'Optional test filter e.g. "auth.integration"' },
        target: { type: 'string', description: 'Target test file or directory' },
      },
      required: [],
    },
    isDangerous: false,
  },
  run_linter: {
    name: 'run_linter',
    description: 'Execute ESLint / Biome static analysis across codebase.',
    parameters: {
      type: 'object',
      properties: {
        fix: { type: 'boolean', description: 'Whether to auto-apply trivial formatting fixes' },
      },
      required: [],
    },
    isDangerous: false,
  },
  run_typecheck: {
    name: 'run_typecheck',
    description: 'Execute TypeScript compiler (`tsc --noEmit`) to verify zero type regressions.',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
    isDangerous: false,
  },
  git_diff: {
    name: 'git_diff',
    description: 'Inspect current uncommitted git changes against working tree snapshot.',
    parameters: {
      type: 'object',
      properties: {
        cached: { type: 'boolean', description: 'View staged changes' },
      },
      required: [],
    },
    isDangerous: false,
  },
  git_status: {
    name: 'git_status',
    description: 'List modified, staged, and untracked files.',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
    isDangerous: false,
  },
  inspect_package: {
    name: 'inspect_package',
    description: 'Read dependencies, devDependencies, and scripts from package.json.',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
    isDangerous: false,
  },
};
