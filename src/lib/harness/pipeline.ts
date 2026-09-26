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
import { EvaluationModelAdapter } from '../models/evaluation-adapter';

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
      apiKey: options.apiKey || process.env.AI_API_KEY,
      modelName: options.prescribedModel,
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
      // STAGE 4: PLAN
      // =========================================================================
      this.transitionTo('PLAN', 'Calling text-only foundation model for execution plan');
      this.telemetry.modelCalls++;

      const modelResponse = await this.modelAdapter.generateText({
        systemPrompt:
          'You are Parishram, an autonomous coding harness operating in strict evaluation mode. Analyze the task contract and context files to formulate a deterministic plan.',
        userPrompt: `Task: ${task}\nAllowed Scope: ${contract.allowedPaths.join(', ')}`,
        contextFiles: context.filesSelected.map((f) => ({ path: f.path, content: f.content })),
      });

      this.telemetry.promptTokens += modelResponse.tokensUsed.prompt;
      this.telemetry.completionTokens += modelResponse.tokensUsed.completion;
      this.telemetry.totalTokens = this.telemetry.promptTokens + this.telemetry.completionTokens;

      // =========================================================================
      // STAGE 5: EXECUTE (Code Mutation with Checkpoint Protection)
      // =========================================================================
      this.transitionTo('EXECUTE', 'Applying code mutations in sandboxed workspace');

      // 1. Create safety checkpoint before applying edits
      const candidateFiles = context.filesSelected.map((f) => f.path);
      const checkpoint = await this.checkpointManager.createCheckpoint(
        'pre-mutation-checkpoint',
        `Pre-mutation snapshot for task: ${task.slice(0, 30)}`,
        candidateFiles
      );

      // 2. Execute tool actions
      if (modelResponse.toolCalls && modelResponse.toolCalls.length > 0) {
        for (const tc of modelResponse.toolCalls) {
          if (tc.tool === 'edit_file') {
            const { path: p, oldStr, newStr, rationale } = tc.args;
            if (p && oldStr && newStr) {
              try {
                const editResult = await this.toolExecutor.editFile(p, oldStr, newStr, rationale);
                this.modifiedFiles.add(p);
                this.unifiedDiff += editResult.diff + '\n';
              } catch (editErr: any) {
                // Tool executor already recorded event error
              }
            }
          } else if (tc.tool === 'write_file') {
            const { path: p, content } = tc.args;
            if (p && content) {
              await this.toolExecutor.writeFile(p, content);
              this.modifiedFiles.add(p);
            }
          }
        }
      }

      this.telemetry.filesModified = this.modifiedFiles.size;

      // =========================================================================
      // STAGE 6: VERIFY
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
      // STAGE 7: RECOVER (Bounded Loop on Failure)
      // =========================================================================
      while (!verification.passed && this.telemetry.retriesCount < contract.stopConditions.maxRetries) {
        this.telemetry.retriesCount++;
        this.transitionTo('RECOVER', `Recovery attempt ${this.telemetry.retriesCount} of ${contract.stopConditions.maxRetries}`);

        // 1. Classify failure into explicit category
        const failingOutput = verification.tests.failed > 0
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

        // 2. Build targeted recovery context
        const recoveryPrompt = FailureClassifier.buildTargetedRecoveryPrompt(
          contract,
          diagnosis,
          this.unifiedDiff,
          this.telemetry.retriesCount - 1
        );

        // 3. Ask model for repair patch
        this.telemetry.modelCalls++;
        const repairResponse = await this.modelAdapter.generateText({
          systemPrompt:
            'You are Parishram in targeted recovery mode. Output a focused fix for the diagnosed error.',
          userPrompt: recoveryPrompt,
          contextFiles: context.filesSelected.map((f) => ({ path: f.path, content: f.content })),
        });

        this.telemetry.promptTokens += repairResponse.tokensUsed.prompt;
        this.telemetry.completionTokens += repairResponse.tokensUsed.completion;
        this.telemetry.totalTokens = this.telemetry.promptTokens + this.telemetry.completionTokens;

        // 4. Re-verify
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

        // If recovery broke things further, rollback to checkpoint
        if (!verification.passed && this.telemetry.retriesCount >= contract.stopConditions.maxRetries) {
          await this.checkpointManager.rollbackToCheckpoint(checkpoint.id);
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
