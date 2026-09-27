import {
  HarnessRunOptions,
  HarnessState,
  HarnessTelemetry,
  ProofRecord,
  RecoveryAttemptRecord,
  TargetedContextResult,
  TaskContract,
  ToolCallEvent,
  VerificationResult,
} from './types';
import { TaskContractEngine } from './task-contract';
import { TargetedContextEngine } from './context-engine';
import { HarnessToolExecutor } from './tool-executor';
import { FailureClassifier } from './failure-classifier';
import { HarnessCheckpointManager } from './checkpoint-manager';
import { HarnessVerificationGate } from './verifier';
import { HarnessProofEngine } from './proof-engine';
import {
  EvaluationModelAdapter,
  ModelMessage,
  STANDARD_HARNESS_TOOLS,
  HARNESS_SYSTEM_PROMPT,
} from '../models/evaluation-adapter';

export interface HarnessExecutionResult {
  runId: string;
  success: boolean;
  state: HarnessState;
  contract: TaskContract;
  context: TargetedContextResult;
  toolEvents: ToolCallEvent[];
  verification: VerificationResult;
  proof?: ProofRecord;
  recoveryAttempts: RecoveryAttemptRecord[];
  telemetry: HarnessTelemetry;
  error?: string;
}

export class HarnessPipeline {
  private state: HarnessState = 'INTAKE';
  private runId: string;
  private options: HarnessRunOptions;
  private telemetry: HarnessTelemetry;
  private checkpointManager: HarnessCheckpointManager;
  private toolExecutor: HarnessToolExecutor;
  private modelAdapter: EvaluationModelAdapter;
  private recoveryAttempts: RecoveryAttemptRecord[] = [];
  private modifiedFiles: Set<string> = new Set();
  private unifiedDiff: string = '';

  constructor(options: HarnessRunOptions) {
    this.options = options;
    this.runId = 'run-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);
    this.telemetry = {
      modelCalls: 0,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      durationMs: 0,
      filesInspected: 0,
      filesModified: 0,
      retriesCount: 0,
      verificationAttempts: 0,
    };

    const repoRoot = options.repositoryRoot || process.cwd();
    this.checkpointManager = new HarnessCheckpointManager(repoRoot);
    this.toolExecutor = new HarnessToolExecutor(repoRoot, undefined, (evt) => {
      if (options.onToolCall) options.onToolCall(evt);
    });

    this.modelAdapter = new EvaluationModelAdapter({
      apiKey: options.apiKey || (typeof process !== 'undefined' ? process.env?.AI_API_KEY : undefined),
      modelName: options.prescribedModel,
      mockHandler: options.mockHandler,
    });
  }

  public getState(): HarnessState {
    return this.state;
  }

  private transitionTo(newState: HarnessState, detail?: string): void {
    this.state = newState;
    if (this.options.onStateChange) {
      try {
        this.options.onStateChange(newState, detail);
      } catch {
        // Observer errors should not interrupt state machine
      }
    }
  }

  /**
   * Runs the full autonomous execution slice from task intake to verified proof.
   */
  public async execute(): Promise<HarnessExecutionResult> {
    const pipelineStartTime = Date.now();

    try {
      // =========================================================================
      // STAGE 1: INTAKE
      // =========================================================================
      this.transitionTo('INTAKE', `Processing task: "${this.options.task}"`);
      const task = this.options.task.trim();
      if (!task) {
        throw new Error('INTAKE_ERROR: Task description cannot be empty');
      }

      // =========================================================================
      // STAGE 2: TASK CONTRACT
      // =========================================================================
      this.transitionTo('TASK_CONTRACT', 'Synthesizing machine-readable task contract');
      const contract = TaskContractEngine.createContract(
        task,
        this.options.repositoryRoot || process.cwd(),
        {
          allowedPaths: this.options.allowedPaths,
          forbiddenPaths: this.options.forbiddenPaths,
          verificationCommands: this.options.customVerificationCommands,
          maxRetries: this.options.maxRetries,
        }
      );

      // Re-initialize tool executor with sealed contract for scope enforcement
      this.toolExecutor = new HarnessToolExecutor(
        this.options.repositoryRoot || process.cwd(),
        contract,
        (evt) => {
          if (this.options.onToolCall) this.options.onToolCall(evt);
        }
      );

      // =========================================================================
      // STAGE 3: TARGETED CONTEXT (Cartography)
      // =========================================================================
      this.transitionTo('TARGETED_CONTEXT', 'Targeted repository context cartography');
      const context = await TargetedContextEngine.assembleContext(
        task,
        this.options.repositoryRoot || process.cwd(),
        contract,
        this.options.tokenBudget ?? 8000
      );
      this.telemetry.filesInspected = context.filesConsidered.length;
      this.telemetry.promptTokens += context.totalTokensEstimate;

      // =========================================================================
      // STAGE 4 & 5: MODEL-DRIVEN AUTONOMOUS AGENT LOOP
      // =========================================================================
      this.transitionTo('PLAN', 'Initializing model-driven autonomous engineering loop');

      const cartographySummary =
        context.filesSelected.length > 0
          ? context.filesSelected.map((f) => `- ${f.path} (${f.tokensEstimate} tokens)`).join('\n')
          : 'No specific files pre-selected. Use list_files or search to explore the workspace.';

      const messages: ModelMessage[] = [
        {
          role: 'system',
          content: HARNESS_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: `Task Objective: ${task}
Allowed Scope: ${contract.allowedPaths.join(', ') || 'Entire repository'}
Forbidden Paths: ${contract.forbiddenPaths.join(', ') || 'None'}
Verification Requirements: ${contract.verificationRequirements.map((v) => v.name).join('; ') || 'Standard test suite pass'}

Initial Repository Cartography:
${cartographySummary}

Instructions:
1. Inspect repository files using list_files, search, or read_file.
2. Formulate a plan and apply targeted edits with edit_file or write_file.
3. Verify your edits by running tests (run_tests or run_command).
4. When finished, call complete_task.`,
        },
      ];

      const maxTurns = 12;
      let turn = 0;
      let checkpointCreated = false;
      let checkpointId: string | null = null;
      let modelCompleted = false;

      while (turn < maxTurns && !modelCompleted) {
        turn++;
        this.telemetry.modelCalls++;

        const response = await this.modelAdapter.generateChat(messages, STANDARD_HARNESS_TOOLS);
        this.telemetry.promptTokens += response.tokensUsed.prompt;
        this.telemetry.completionTokens += response.tokensUsed.completion;
        this.telemetry.totalTokens = this.telemetry.promptTokens + this.telemetry.completionTokens;

        messages.push({
          role: 'assistant',
          content: response.content || 'Executing tools...',
        });

        const toolCalls = response.toolCalls || [];

        // If no tool calls produced, exit agent loop to verification
        if (toolCalls.length === 0) {
          break;
        }

        // Execute each tool call requested by the model
        for (const tc of toolCalls) {
          if (tc.tool === 'complete_task') {
            modelCompleted = true;
            break;
          }

          // If tool modifies repository, ensure safety checkpoint is created first
          if ((tc.tool === 'edit_file' || tc.tool === 'write_file') && !checkpointCreated) {
            this.transitionTo('EXECUTE', `Creating pre-mutation checkpoint and applying modifications`);
            const snap = await this.checkpointManager.createCheckpoint(
              'pre-mutation-checkpoint',
              `Pre-mutation snapshot for task: ${task.slice(0, 30)}`,
              context.filesSelected.map((f) => f.path)
            );
            checkpointCreated = true;
            checkpointId = snap.id;
          }

          if (tc.tool === 'edit_file' || tc.tool === 'write_file') {
            this.transitionTo('EXECUTE', `Applying mutation to ${tc.args.path || tc.args.filePath}`);
          }

          // Execute tool through toolExecutor
          const execRes = await this.toolExecutor.executeTool(tc.tool, tc.args);

          if (execRes.diff) {
            this.unifiedDiff += execRes.diff + '\n';
          }
          if (tc.tool === 'edit_file' || tc.tool === 'write_file') {
            const modifiedPath = tc.args.path || tc.args.filePath;
            if (modifiedPath && execRes.exitCode === 0) {
              this.modifiedFiles.add(modifiedPath);
            }
          }

          // Feed tool execution output back to the model in multi-turn conversation
          const resultText =
            execRes.exitCode === 0
              ? execRes.output
              : `ERROR (exit code ${execRes.exitCode}): ${execRes.error || execRes.output}`;

          messages.push({
            role: 'tool',
            content: `Tool: ${tc.tool}\nResult:\n${resultText}`,
            name: tc.tool,
            tool_call_id: tc.id,
          });
        }

        if (modelCompleted) {
          break;
        }
      }

      this.telemetry.filesModified = this.modifiedFiles.size;

      // Anti-hallucination guard: If task asked for code modification/fix,
      // but 0 files were modified in workspace, report truthfully rather than fabricating victory.
      const isMutationTask =
        /^(fix|repair|patch|resolve|implement|refactor|update|add|change|modify|create|delete|remove)\b/i.test(task) ||
        task.toLowerCase().includes('fix ') ||
        task.toLowerCase().includes('patch ') ||
        task.toLowerCase().includes('bug') ||
        task.toLowerCase().includes('failure') ||
        task.toLowerCase().includes('error');

      if (isMutationTask && this.modifiedFiles.size === 0) {
        const lastAssistantMsg = [...messages].reverse().find((m) => m.role === 'assistant')?.content || '';
        const targetNotFound =
          lastAssistantMsg.toLowerCase().includes('not found') ||
          lastAssistantMsg.toLowerCase().includes('does not exist') ||
          context.filesSelected.length === 0;

        const reason = targetNotFound
          ? `TARGET_NOT_FOUND: The requested issue target, file, or component was not found in the workspace repository. Searched workspace, but found 0 matching files to modify.`
          : `UNRESOLVED_TASK: The model finished its thinking loop without modifying any files to resolve the issue.`;

        this.transitionTo('FAILED', reason);
        this.telemetry.durationMs = Date.now() - pipelineStartTime;

        return {
          runId: this.runId,
          success: false,
          state: 'FAILED',
          contract,
          context,
          toolEvents: this.toolExecutor.getEvents(),
          verification: {
            passed: false,
            timestamp: new Date().toISOString(),
            durationMs: 0,
            tests: { total: 0, passed: 0, failed: 1, skipped: 0, output: reason, rawExitCode: 1, durationMs: 0 },
            typecheck: { passed: false, errorsCount: 0, output: 'Skipped due to unapplied patch', durationMs: 0 },
            scope: { passed: false, modifiedFiles: [], violations: [reason] },
            security: { passed: true, secretsDetected: [], dangerousCommandsBlocked: [] },
          },
          recoveryAttempts: this.recoveryAttempts,
          telemetry: this.telemetry,
          error: reason,
        };
      }

      // =========================================================================
      // STAGE 6: VERIFY (Independent Verification Gate)
      // =========================================================================
      this.transitionTo('VERIFY', 'Executing real verification gate (tests + typecheck + scope + security)');
      this.telemetry.verificationAttempts++;

      let verification = await HarnessVerificationGate.executeVerification(
        this.toolExecutor,
        contract,
        Array.from(this.modifiedFiles),
        this.options.repositoryRoot || process.cwd()
      );

      if (this.options.onVerification) {
        this.options.onVerification(verification);
      }

      // =========================================================================
      // STAGE 7: RECOVER (Targeted Model-Driven Recovery Loop on Failure)
      // =========================================================================
      while (!verification.passed && this.telemetry.retriesCount < contract.stopConditions.maxRetries) {
        this.telemetry.retriesCount++;
        this.transitionTo(
          'RECOVER',
          `Recovery attempt ${this.telemetry.retriesCount} of ${contract.stopConditions.maxRetries}`
        );

        // 1. Classify failure into explicit category
        const failingOutput =
          verification.tests.failed > 0
            ? verification.tests.output
            : !verification.typecheck.passed
              ? verification.typecheck.output
              : !verification.scope.passed
                ? verification.scope.violations.join('\n')
                : 'Security or invariant check failure';

        const failingCmd = verification.tests.failed > 0 ? 'npm test' : 'npx tsc --noEmit';

        const diagnosis = FailureClassifier.diagnose(
          failingCmd,
          failingOutput,
          verification.tests.rawExitCode,
          Array.from(this.modifiedFiles)
        );

        // 2. Build targeted recovery prompt and feed real failure to model
        messages.push({
          role: 'user',
          content: `VERIFICATION FAILURE DETECTED:
Category: ${diagnosis.category}
Symptom: ${diagnosis.symptom}
Failing Command: ${failingCmd}
Failing Output:
${failingOutput.slice(0, 2000)}

Please inspect the error, formulate a targeted repair plan, and apply the fix.`,
        });

        // 3. Ask model for repair actions
        this.telemetry.modelCalls++;
        const repairResponse = await this.modelAdapter.generateChat(messages, STANDARD_HARNESS_TOOLS);
        this.telemetry.promptTokens += repairResponse.tokensUsed.prompt;
        this.telemetry.completionTokens += repairResponse.tokensUsed.completion;
        this.telemetry.totalTokens = this.telemetry.promptTokens + this.telemetry.completionTokens;

        messages.push({
          role: 'assistant',
          content: repairResponse.content || 'Applying recovery repairs...',
        });

        // Execute recovery tool calls
        if (repairResponse.toolCalls && repairResponse.toolCalls.length > 0) {
          for (const tc of repairResponse.toolCalls) {
            const execRes = await this.toolExecutor.executeTool(tc.tool, tc.args);
            if (execRes.diff) {
              this.unifiedDiff += execRes.diff + '\n';
            }
            if (tc.tool === 'edit_file' || tc.tool === 'write_file') {
              const modifiedPath = tc.args.path || tc.args.filePath;
              if (modifiedPath && execRes.exitCode === 0) {
                this.modifiedFiles.add(modifiedPath);
              }
            }
            messages.push({
              role: 'tool',
              content: `Tool: ${tc.tool}\nResult:\n${execRes.output || execRes.error}`,
              name: tc.tool,
              tool_call_id: tc.id,
            });
          }
        }

        // 4. Re-verify independently
        this.telemetry.verificationAttempts++;
        verification = await HarnessVerificationGate.executeVerification(
          this.toolExecutor,
          contract,
          Array.from(this.modifiedFiles),
          this.options.repositoryRoot || process.cwd()
        );

        const recoveryRecord: RecoveryAttemptRecord = {
          attemptNumber: this.telemetry.retriesCount,
          diagnosis,
          targetedPromptSummary: `Diagnosed ${diagnosis.category}: ${diagnosis.symptom}`,
          reVerificationResult: verification,
          succeeded: verification.passed,
          timestamp: new Date().toISOString(),
        };
        this.recoveryAttempts.push(recoveryRecord);

        if (this.options.onRecovery) {
          this.options.onRecovery(recoveryRecord);
        }

        // If recovery failed after all retries, rollback to checkpoint
        if (
          !verification.passed &&
          this.telemetry.retriesCount >= contract.stopConditions.maxRetries &&
          checkpointId
        ) {
          await this.checkpointManager.rollbackToCheckpoint(checkpointId);
        }
      }

      // Check if verification permanently failed
      if (!verification.passed) {
        this.transitionTo('FAILED', `Verification failed after ${this.telemetry.retriesCount} recovery attempts`);
        this.telemetry.durationMs = Date.now() - pipelineStartTime;

        return {
          runId: this.runId,
          success: false,
          state: 'FAILED',
          contract,
          context,
          toolEvents: this.toolExecutor.getEvents(),
          verification,
          recoveryAttempts: this.recoveryAttempts,
          telemetry: this.telemetry,
          error: `Verification gate failed: ${verification.tests.failed} test failure(s), ${verification.typecheck.errorsCount} type error(s).`,
        };
      }

      // =========================================================================
      // STAGE 8: PROVE (Cryptographic Proof Sealed)
      // =========================================================================
      this.transitionTo('PROVE', 'Sealing cryptographic SHA-256 proof record and Merkle root');
      this.telemetry.durationMs = Date.now() - pipelineStartTime;

      const proof = await HarnessProofEngine.generateProof({
        runId: this.runId,
        task,
        contract,
        context,
        toolEvents: this.toolExecutor.getEvents(),
        filesChanged: Array.from(this.modifiedFiles),
        diff: this.unifiedDiff,
        verification,
        telemetry: this.telemetry,
        repositoryRoot: this.options.repositoryRoot || process.cwd(),
      });

      // =========================================================================
      // STAGE 9: COMPLETE
      // =========================================================================
      this.transitionTo('COMPLETE', `Execution complete. Proof verified (SHA-256: ${proof.proofHash.slice(0, 8)}...)`);

      return {
        runId: this.runId,
        success: true,
        state: 'COMPLETE',
        contract,
        context,
        toolEvents: this.toolExecutor.getEvents(),
        verification,
        proof,
        recoveryAttempts: this.recoveryAttempts,
        telemetry: this.telemetry,
      };
    } catch (err: any) {
      this.transitionTo('FAILED', err.message);
      this.telemetry.durationMs = Date.now() - pipelineStartTime;

      const emptyContract = TaskContractEngine.createContract(this.options.task);
      const emptyContext: TargetedContextResult = {
        task: this.options.task,
        filesConsidered: [],
        filesSelected: [],
        totalTokensEstimate: 0,
        tokenBudget: 8000,
        budgetExceeded: false,
        indexedSymbols: [],
        durationMs: 0,
      };
      const emptyVerification: VerificationResult = {
        passed: false,
        timestamp: new Date().toISOString(),
        durationMs: 0,
        tests: { total: 0, passed: 0, failed: 1, skipped: 0, output: err.message, rawExitCode: 1, durationMs: 0 },
        typecheck: { passed: false, errorsCount: 1, output: err.message, durationMs: 0 },
        scope: { passed: false, modifiedFiles: [], violations: [err.message] },
        security: { passed: false, secretsDetected: [], dangerousCommandsBlocked: [] },
      };

      return {
        runId: this.runId,
        success: false,
        state: 'FAILED',
        contract: emptyContract,
        context: emptyContext,
        toolEvents: this.toolExecutor.getEvents(),
        verification: emptyVerification,
        recoveryAttempts: this.recoveryAttempts,
        telemetry: this.telemetry,
        error: err.message,
      };
    }
  }
}
