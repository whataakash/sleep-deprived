import { RecoveryAttempt } from '@/types/agent';
import { DiagnosisReport } from './failure-analyzer';

export class RecoveryPlanner {
  public static planCorrection(
    attemptNumber: number,
    diagnosis: DiagnosisReport,
    retryBudget: number = 3
  ): {
    canRetry: boolean;
    attempt: RecoveryAttempt;
    revisedPlanNote: string;
  } {
    const canRetry = attemptNumber <= retryBudget;

    let patchApplied = {
      filePath: 'src/auth/client.ts',
      description: 'Forward active session token in outgoing Authorization header',
      diffSnippet: `+ if (this.currentSession && this.currentSession.token) {
+   headers.set('Authorization', \`Bearer \${this.currentSession.token}\`);
+ }`,
    };

    if (attemptNumber === 2 && diagnosis.category === 'Timeout') {
      patchApplied = {
        filePath: 'tests/integration/auth.test.ts',
        description: 'Add explicit timeout limit and mock server cleanup hook',
        diffSnippet: `+ afterAll(() => {
+   jest.clearAllMocks();
+ });`,
      };
    }

    const attempt: RecoveryAttempt = {
      attemptNumber,
      failureCategory: diagnosis.category,
      failureMessage: diagnosis.symptom,
      failingComponent: diagnosis.failingComponent,
      likelyCause: diagnosis.likelyCause,
      correctionStrategy: diagnosis.suggestedAction,
      patchApplied,
      retestTarget: 'tests/integration/auth.test.ts',
      result: attemptNumber >= 2 ? 'passed' : 'failed',
      timestamp: new Date().toISOString(),
    };

    const revisedPlanNote =
      attemptNumber === 1
        ? 'Plan revised: Initial auth client lacked bearer credential injection. Generating targeted header patch.'
        : 'Plan revised: Integration timeout resolved. Moving to comprehensive verification pass.';

    return {
      canRetry,
      attempt,
      revisedPlanNote,
    };
  }
}
