/**
 * PARISHRAM — Evaluation Model Adapter
 * Standardized, text-only evaluation interface adhering to Hackathon Evaluation Guidelines.
 *
 * Consumes: process.env.AI_API_KEY
 * Prescribed Model: process.env.AI_MODEL / process.env.PRESCRIBED_MODEL / process.env.PARISHRAM_EVAL_MODEL
 * Mode: Strictly TEXT-ONLY (zero multimodal/vision/audio invocation)
 */

export interface ModelMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  tool_call_id?: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

export interface ParsedToolCall {
  id: string;
  tool: string;
  args: Record<string, any>;
}

export interface TextModelRequest {
  systemPrompt: string;
  userPrompt: string;
  contextFiles?: { path: string; content: string }[];
  tools?: ToolDefinition[];
  messages?: ModelMessage[];
  temperature?: number;
  maxTokens?: number;
}

export interface TextModelResponse {
  content: string;
  toolCalls?: ParsedToolCall[];
  tokensUsed: {
    prompt: number;
    completion: number;
    total: number;
  };
  durationMs: number;
  modelUsed: string;
  textOnlyEnforced: boolean;
}

export interface EvaluationModel {
  generateText(request: TextModelRequest): Promise<TextModelResponse>;
  generateChat(
    messages: ModelMessage[],
    tools?: ToolDefinition[],
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<TextModelResponse>;
}

export interface EvaluationConfig {
  isEvaluationMode: boolean;
  prescribedModel: string;
  isTextOnly: boolean;
  hasApiKey: boolean;
  maskedApiKey: string;
}

export const STANDARD_HARNESS_TOOLS: ToolDefinition[] = [
  {
    name: 'list_files',
    description: 'List files and directories in a repository directory.',
    parameters: {
      type: 'object',
      properties: {
        dirPath: { type: 'string', description: 'Relative path to directory, defaults to "."' },
      },
    },
  },
  {
    name: 'read_file',
    description: 'Read the contents of a file in the repository.',
    parameters: {
      type: 'object',
      required: ['path'],
      properties: {
        path: { type: 'string', description: 'Relative path to file' },
        startLine: { type: 'number', description: 'Optional 1-indexed starting line' },
        lineCount: { type: 'number', description: 'Optional number of lines to read' },
      },
    },
  },
  {
    name: 'search',
    description: 'Search for text or symbol across repository files.',
    parameters: {
      type: 'object',
      required: ['query'],
      properties: {
        query: { type: 'string', description: 'Text or symbol to search for' },
        dirPath: { type: 'string', description: 'Optional directory path to restrict search' },
      },
    },
  },
  {
    name: 'edit_file',
    description: 'Apply targeted modification to a file by replacing oldStr with newStr.',
    parameters: {
      type: 'object',
      required: ['path', 'oldStr', 'newStr'],
      properties: {
        path: { type: 'string', description: 'Relative path to file' },
        oldStr: { type: 'string', description: 'Exact string to be replaced (must exist in file)' },
        newStr: { type: 'string', description: 'Replacement string' },
        rationale: { type: 'string', description: 'Reason for modification' },
      },
    },
  },
  {
    name: 'write_file',
    description: 'Create or overwrite a file with given content.',
    parameters: {
      type: 'object',
      required: ['path', 'content'],
      properties: {
        path: { type: 'string', description: 'Relative path to file' },
        content: { type: 'string', description: 'Content to write' },
      },
    },
  },
  {
    name: 'run_command',
    description: 'Run a shell command inside the repository root (e.g. npm test, git status).',
    parameters: {
      type: 'object',
      required: ['command'],
      properties: {
        command: { type: 'string', description: 'Shell command line to execute' },
      },
    },
  },
  {
    name: 'run_tests',
    description: 'Run repository test suite with optional filter.',
    parameters: {
      type: 'object',
      properties: {
        filter: { type: 'string', description: 'Optional test filter/grep pattern' },
      },
    },
  },
  {
    name: 'get_git_diff',
    description: 'Inspect the current git diff of working tree changes.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'complete_task',
    description: 'Signal that the task has been solved, tested, and is ready for independent verification.',
    parameters: {
      type: 'object',
      properties: {
        summary: { type: 'string', description: 'Summary of changes and verification evidence' },
      },
    },
  },
];

export const HARNESS_SYSTEM_PROMPT = `You are Parishram (परिश्रम), an autonomous principal software engineer and evaluation harness operating directly on a live repository.

You must solve the user's software engineering task or GitHub issue accurately, truthfully, and without hallucination by interacting with the real workspace.

AVAILABLE TOOLS:
- list_files({ dirPath?: string }): Explore directory structure
- read_file({ path: string, startLine?: number, lineCount?: number }): Inspect exact file contents
- search({ query: string, dirPath?: string }): Case-insensitive ripgrep search for symbols or error strings
- edit_file({ path: string, oldStr: string, newStr: string, rationale?: string }): Surgical string replacement (oldStr must match character-for-character)
- write_file({ path: string, content: string }): Create or overwrite a file
- run_command({ command: string }): Execute bash command inside repository root
- run_tests({ filter?: string }): Execute test suite with optional filter
- get_git_diff({}): Inspect working tree modifications
- complete_task({ summary: string }): Finish task with verification summary

DEEPSEEK HARNESS (DSH) AGENT PROTOCOL:
1. THINK STEP-BY-STEP:
   - Before taking an action, explain your concise technical reasoning in plain text:
     * What did the previous command/output reveal?
     * What is your working hypothesis?
     * What specific tool are you calling next and why?
2. REPOSITORY REALITY FIRST (ANTI-HALLUCINATION):
   - NEVER assume files, symbols, or functions exist. Always verify using \`search\` or \`list_files\`.
   - If an error string, symbol, or file mentioned in the task is NOT FOUND in the repository, explicitly report: "Not found in workspace" and search broader paths. Do NOT fabricate files or mock answers.
3. INSPECT BEFORE MODIFYING:
   - Always read the target file using \`read_file\` before attempting any edit.
   - Observe imports, types, syntax, and surrounding context.
4. SURGICAL MUTATION:
   - Use \`edit_file\` to make the minimal necessary changes. Keep \`oldStr\` precise.
   - Do not format or touch unrelated lines of code.
5. RIGOROUS RE-TESTING:
   - Run \`run_tests\` or \`run_command\` to verify that your changes resolve the failure and do not cause regressions.
   - Inspect \`get_git_diff\` to ensure no unintended files or secrets were modified.
6. TASK COMPLETION:
   - When all tests pass and code is verified, call \`complete_task\` with a factual description of the root cause and applied fix.
   - Strictly text-only modality. Never request or generate media.`;

export class EvaluationModelAdapter implements EvaluationModel {
  private apiKey: string;
  private modelName: string;
  private mockHandler?: (messages: ModelMessage[]) => Promise<TextModelResponse>;

  constructor(customConfig?: {
    apiKey?: string;
    modelName?: string;
    mockHandler?: (messages: ModelMessage[]) => Promise<TextModelResponse>;
  }) {
    // 1. Consume AI_API_KEY from environment or parameter
    this.apiKey =
      customConfig?.apiKey ||
      (typeof process !== 'undefined' && process.env?.AI_API_KEY) ||
      '';

    // 2. Prescribed model lock: read AI_MODEL / PRESCRIBED_MODEL / PARISHRAM_EVAL_MODEL or locked standard
    this.modelName =
      customConfig?.modelName ||
      (typeof process !== 'undefined' &&
        (process.env?.AI_MODEL ||
          process.env?.PRESCRIBED_MODEL ||
          process.env?.PARISHRAM_EVAL_MODEL ||
          process.env?.FORGE_EVAL_MODEL)) ||
      'hackathon-prescribed-text-v1';

    this.mockHandler = customConfig?.mockHandler;
  }

  public getModelName(): string {
    return this.modelName;
  }

  public hasValidKey(): boolean {
    return this.apiKey.trim().length > 0;
  }

  public static isEvaluationMode(): boolean {
    if (typeof process === 'undefined') return false;
    return (
      process.env.PARISHRAM_EVALUATION_MODE === 'true' ||
      process.env.FORGE_EVALUATION_MODE === 'true' ||
      Boolean(process.env.AI_MODEL && process.env.AI_MODEL.trim().length > 0) ||
      Boolean(process.env.AI_API_KEY && process.env.AI_API_KEY.trim().length > 0)
    );
  }

  public static getEvaluationConfig(): EvaluationConfig {
    const hasKey = typeof process !== 'undefined' && Boolean(process.env.AI_API_KEY);
    const rawKey = (typeof process !== 'undefined' && process.env.AI_API_KEY) || '';
    const masked =
      rawKey.length > 8 ? `${rawKey.slice(0, 4)}...${rawKey.slice(-4)}` : hasKey ? 'configured' : 'not_set';
    const model =
      (typeof process !== 'undefined' &&
        (process.env?.AI_MODEL ||
          process.env?.PRESCRIBED_MODEL ||
          process.env?.PARISHRAM_EVAL_MODEL ||
          process.env?.FORGE_EVAL_MODEL)) ||
      'hackathon-prescribed-text-v1';

    return {
      isEvaluationMode: this.isEvaluationMode(),
      prescribedModel: model,
      isTextOnly: true,
      hasApiKey: hasKey,
      maskedApiKey: masked,
    };
  }

  /**
   * Safe parser for model-generated tool calls from raw API tool_calls or structured text/markdown.
   */
  public static parseModelActions(content: string, rawToolCalls?: any[]): ParsedToolCall[] {
    const actions: ParsedToolCall[] = [];
    const knownTools = new Set([
      'list_files',
      'read_file',
      'search',
      'search_files',
      'edit_file',
      'write_file',
      'run_command',
      'run_tests',
      'get_git_diff',
      'complete_task',
    ]);

    // 1. Parse native OpenAI tool calls if present
    if (Array.isArray(rawToolCalls)) {
      for (const call of rawToolCalls) {
        const fnName = call?.function?.name || call?.name;
        if (fnName) {
          let args: Record<string, any> = {};
          if (typeof call?.function?.arguments === 'string') {
            try {
              args = JSON.parse(call.function.arguments);
            } catch {
              args = {};
            }
          } else if (typeof call?.function?.arguments === 'object' && call.function.arguments) {
            args = call.function.arguments;
          }
          actions.push({
            id: call.id || 'call_' + Math.random().toString(36).substring(2, 7),
            tool: fnName,
            args,
          });
        }
      }
    }

    if (actions.length > 0) {
      return actions;
    }

    // 2. Scan content for JSON code blocks
    const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/g;
    let match: RegExpExecArray | null;
    while ((match = codeBlockRegex.exec(content)) !== null) {
      const candidateText = match[1].trim();
      try {
        const parsed = JSON.parse(candidateText);
        if (parsed && typeof parsed === 'object') {
          if (Array.isArray(parsed.tool_calls)) {
            for (const item of parsed.tool_calls) {
              if (item.tool) {
                actions.push({
                  id: item.id || 'call_' + Math.random().toString(36).substring(2, 7),
                  tool: item.tool,
                  args: item.arguments || item.args || {},
                });
              }
            }
          } else if (parsed.tool) {
            actions.push({
              id: parsed.id || 'call_' + Math.random().toString(36).substring(2, 7),
              tool: parsed.tool,
              args: parsed.arguments || parsed.args || {},
            });
          }
        }
      } catch {
        // Not a single valid JSON block; continue scanning
      }
    }

    if (actions.length > 0) {
      return actions;
    }

    // 3. Scan for inline JSON objects with "tool" property
    const toolJsonRegex = /\{\s*"(?:tool|name)"\s*:\s*"([^"]+)"[\s\S]*?\}/g;
    while ((match = toolJsonRegex.exec(content)) !== null) {
      try {
        const parsed = JSON.parse(match[0]);
        const toolName = parsed.tool || parsed.name;
        if (toolName && knownTools.has(toolName.toLowerCase())) {
          actions.push({
            id: parsed.id || 'call_' + Math.random().toString(36).substring(2, 7),
            tool: toolName,
            args: parsed.arguments || parsed.args || {},
          });
        }
      } catch {
        // Not parseable JSON
      }
    }

    return actions;
  }

  /**
   * Multi-turn chat completion with tool calling support.
   */
  async generateChat(
    messages: ModelMessage[],
    tools: ToolDefinition[] = STANDARD_HARNESS_TOOLS,
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<TextModelResponse> {
    const startTime = Date.now();

    // Enforce text-only validation
    for (const m of messages) {
      if (typeof m.content !== 'string') {
        throw new Error('EvaluationModelAdapter: message content must be non-empty text (strict text-only constraint)');
      }
    }

    // 1. If mock handler is configured, use it (for unit tests / mock evaluations)
    if (this.mockHandler) {
      return this.mockHandler(messages);
    }

    // 2. Deterministic test key handling for offline unit tests
    if (
      this.apiKey &&
      (this.apiKey.startsWith('test-') ||
        this.apiKey.startsWith('eval-key-') ||
        this.apiKey === 'mock-key')
    ) {
      const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
      return {
        content: `[Evaluation Mode: ${this.modelName}] Processed request. Context inspected.`,
        toolCalls: [
          {
            id: 'test_call_1',
            tool: 'list_files',
            args: { dirPath: '.' },
          },
        ],
        tokensUsed: {
          prompt: Math.max(20, Math.round(lastUserMsg.length / 4)),
          completion: 40,
          total: Math.max(20, Math.round(lastUserMsg.length / 4)) + 40,
        },
        durationMs: Date.now() - startTime,
        modelUsed: this.modelName,
        textOnlyEnforced: true,
      };
    }

    // 3. Live API execution via AI_API_KEY
    if (!this.hasValidKey()) {
      throw new Error(
        'EVALUATION_ERROR: AI_API_KEY environment variable is missing. ' +
          'The Hackathon evaluation standard requires: export AI_API_KEY="<PROVIDED_KEY>" before executing the harness.'
      );
    }

    const key = this.apiKey.trim();
    let endpointBase = (typeof process !== 'undefined' && process.env.AI_API_ENDPOINT) || '';
    let targetModel = this.modelName;

    if (!endpointBase) {
      if (key.startsWith('gsk_')) {
        // Groq API
        endpointBase = 'https://api.groq.com/openai/v1';
        if (targetModel === 'hackathon-prescribed-text-v1' || !targetModel || targetModel.includes('deepseek') || targetModel.includes('qwen')) {
          targetModel = 'llama-3.3-70b-versatile';
        }
      } else if (key.startsWith('sk-or-v1-') || key.startsWith('sk-or-')) {
        // OpenRouter API
        endpointBase = 'https://openrouter.ai/api/v1';
        if (targetModel === 'hackathon-prescribed-text-v1' || !targetModel) {
          targetModel = 'deepseek/deepseek-chat';
        } else if (targetModel.includes('qwen')) {
          targetModel = 'qwen/qwen-2.5-coder-32b-instruct';
        }
      } else if (key.startsWith('AIzaSy') || key.startsWith('AIza')) {
        // Google Gemini OpenAI Compatibility API
        endpointBase = 'https://generativelanguage.googleapis.com/v1beta/openai';
        if (targetModel === 'hackathon-prescribed-text-v1' || !targetModel || targetModel.includes('deepseek') || targetModel.includes('qwen')) {
          targetModel = 'gemini-2.0-flash';
        }
      } else if (key.startsWith('sk-proj-') || (key.startsWith('sk-') && key.length > 50)) {
        // OpenAI API
        endpointBase = 'https://api.openai.com/v1';
        if (targetModel === 'hackathon-prescribed-text-v1' || !targetModel || targetModel.includes('deepseek') || targetModel.includes('qwen')) {
          targetModel = 'gpt-4o';
        }
      } else if (targetModel.toLowerCase().includes('qwen')) {
        // Alibaba DashScope API
        endpointBase = 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1';
        targetModel = 'qwen-plus';
      } else {
        // DeepSeek API
        endpointBase = 'https://api.deepseek.com';
        targetModel = targetModel === 'hackathon-prescribed-text-v1' ? 'deepseek-chat' : targetModel;
      }
    } else {
      if (targetModel === 'hackathon-prescribed-text-v1') {
        targetModel = 'deepseek-chat';
      }
    }

    const cleanBase = endpointBase.replace(/\/+$/, '').replace(/\/chat\/completions$/, '');

    // Convert tool definitions to OpenAI tool format
    const formattedTools = tools.map((t) => ({
      type: 'function',
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      },
    }));

    const formattedMessages = messages.map((m) => {
      if (m.role === 'tool') {
        return {
          role: 'tool',
          content: m.content,
          tool_call_id: m.tool_call_id || 'call_' + Math.random().toString(36).substring(2, 7),
        };
      }
      return {
        role: m.role,
        content: m.content,
      };
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    try {
      const res = await fetch(`${cleanBase}/chat/completions`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
          ...(cleanBase.includes('openrouter.ai')
            ? {
                'HTTP-Referer': 'https://github.com/whataakash/sleep-deprived',
                'X-Title': 'Parishram AI Harness',
              }
            : {}),
        },
        body: JSON.stringify({
          model: targetModel,
          messages: formattedMessages,
          tools: formattedTools.length > 0 ? formattedTools : undefined,
          temperature: options?.temperature ?? 0.1,
          max_tokens: options?.maxTokens ?? 3000,
        }),
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorBody = await res.text();
        throw new Error(`Model API request failed (HTTP ${res.status}): ${errorBody}`);
      }

      const data = await res.json();
      const message = data.choices?.[0]?.message;
      const content = message?.content || '';
      const rawToolCalls = message?.tool_calls;
      const toolCalls = EvaluationModelAdapter.parseModelActions(content, rawToolCalls);

      const promptTokens = data.usage?.prompt_tokens || 100;
      const completionTokens = data.usage?.completion_tokens || 100;

      return {
        content,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        tokensUsed: {
          prompt: promptTokens,
          completion: completionTokens,
          total: promptTokens + completionTokens,
        },
        durationMs: Date.now() - startTime,
        modelUsed: targetModel,
        textOnlyEnforced: true,
      };
    } catch (err: any) {
      clearTimeout(timeoutId);
      throw new Error(`EvaluationModelAdapter execution error: ${err.message}`);
    }
  }

  /**
   * Strictly text-only execution path for single-turn prompt compatibility.
   */
  async generateText(request: TextModelRequest): Promise<TextModelResponse> {
    if (!request.userPrompt || typeof request.userPrompt !== 'string') {
      throw new Error('EvaluationModelAdapter: userPrompt must be non-empty text');
    }

    const messages: ModelMessage[] = [];

    // System prompt
    const systemContent = request.systemPrompt || HARNESS_SYSTEM_PROMPT;
    messages.push({ role: 'system', content: systemContent });

    // Context files
    if (request.contextFiles && request.contextFiles.length > 0) {
      const filesContext = request.contextFiles
        .map((f) => `--- File: ${f.path} ---\n${f.content}`)
        .join('\n\n');
      messages.push({
        role: 'user',
        content: `Repository context files:\n${filesContext}\n\nTask: ${request.userPrompt}`,
      });
    } else {
      messages.push({ role: 'user', content: request.userPrompt });
    }

    const tools = request.tools || STANDARD_HARNESS_TOOLS;
    return this.generateChat(messages, tools, {
      temperature: request.temperature,
      maxTokens: request.maxTokens,
    });
  }
}
