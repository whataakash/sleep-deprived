import { FailureCategory, RecoveryAttempt } from '@/types/agent';

export interface DiagnosisReport {
  category: FailureCategory;
  symptom: string;
  likelyCause: string;
  failingComponent: string;
  relevantFiles: string[];
  suggestedAction: string;
  confidence: number;
}

export class FailureAnalyzer {
  public static classifyAndDiagnose(rawOutput: string, exitCode?: number): DiagnosisReport {
    const text = rawOutput.toLowerCase();

    if (text.includes('401') || text.includes('unauthorized') || text.includes('authorization header missing')) {
      return {
        category: 'Test failure',
        symptom: 'Integration test failed with HTTP 401 Unauthorized during authenticated endpoint request.',
        likelyCause: 'Outbound AuthServiceClient does not forward the session bearer token in request headers.',
        failingComponent: 'src/auth/client.ts',
        relevantFiles: ['src/auth/client.ts', 'src/auth/middleware.ts'],
        suggestedAction: 'Inject Authorization: Bearer ${session.token} into RequestInit headers in AuthServiceClient.fetchWithAuth().',
        confidence: 98,
      };
    }

    if (text.includes('syntaxerror') || text.includes('unexpected token')) {
      return {
        category: 'Syntax failure',
        symptom: 'JavaScript/TypeScript parser encountered invalid syntax.',
        likelyCause: 'Unclosed bracket or unescaped character in recently edited file.',
        failingComponent: 'src/auth/client.ts',
        relevantFiles: ['src/auth/client.ts'],
        suggestedAction: 'Repair syntax mismatch and validate with AST parser.',
        confidence: 95,
      };
    }

    if (text.includes('error ts') || text.includes('typeerror') || text.includes('property does not exist')) {
      return {
        category: 'Type failure',
        symptom: 'TypeScript compiler failed type verification.',
        likelyCause: 'Type signature mismatch between caller and callee.',
        failingComponent: 'src/auth/types.ts',
        relevantFiles: ['src/auth/types.ts', 'src/auth/client.ts'],
        suggestedAction: 'Align interface declarations and export required type definitions.',
        confidence: 94,
      };
    }

    if (text.includes('timeout') || text.includes('timed out')) {
      return {
        category: 'Timeout',
        symptom: 'Test worker timed out after configured deadline.',
        likelyCause: 'Async promise was not resolved or server connection remained open.',
        failingComponent: 'tests/integration/auth.test.ts',
        relevantFiles: ['tests/integration/auth.test.ts'],
        suggestedAction: 'Ensure graceful teardown of test mocks and mock server handles.',
        confidence: 90,
      };
    }

    return {
      category: 'Unknown',
      symptom: 'Unexpected execution anomaly detected in test runner.',
      likelyCause: 'Undetermined test failure in suite.',
      failingComponent: 'unknown',
      relevantFiles: [],
      suggestedAction: 'Perform broader AST search and check environmental dependencies.',
      confidence: 60,
    };
  }
}
