import { FailureDiagnosis, HarnessFailureCategory, TaskContract } from './types';

export class FailureClassifier {
  /**
   * Classifies raw command/verification failure output into one of the 9 explicit failure classes.
   */
  public static diagnose(
    failingCommand: string,
    rawOutput: string,
    exitCode?: number,
    modifiedFiles: string[] = []
  ): FailureDiagnosis {
    const text = rawOutput.toLowerCase();
    const snippet = rawOutput.slice(0, 1200).trim();
    const timestamp = new Date().toISOString();

    // 1. TIMEOUT
    if (exitCode === 124 || text.includes('timeout') || text.includes('timed out') || text.includes('deadline exceeded')) {
      return {
        category: 'TIMEOUT',
        symptom: 'Process exceeded maximum execution deadline or encountered an unresolved promise/socket.',
        likelyCause: 'A blocking synchronous call, infinite loop, or unclosed resource handle in test runner.',
        failingCommand,
        exactOutputSnippet: snippet,
        targetFiles: modifiedFiles,
        targetedRecoveryAction: 'Inspect asynchronous wait conditions, ensure proper teardown, or optimize execution path.',
        confidence: 96,
        timestamp,
      };
    }

    // 2. SCOPE_VIOLATION
    if (text.includes('scope_violation') || text.includes('forbidden path') || text.includes('out of scope')) {
      return {
        category: 'SCOPE_VIOLATION',
        symptom: 'An action attempted to read or modify a file outside the agreed task contract scope.',
        likelyCause: 'Agent proposed a change to protected system files (.env, .git, etc.) or unrelated modules.',
        failingCommand,
        exactOutputSnippet: snippet,
        targetFiles: modifiedFiles,
        targetedRecoveryAction: 'Restrict modifications strictly to allowed paths defined in the Task Contract.',
        confidence: 99,
        timestamp,
      };
    }

    // 3. PATCH_FAILURE
    if (text.includes('patch_failure') || text.includes('target text to replace not found') || text.includes('hunk rejected')) {
      return {
        category: 'PATCH_FAILURE',
        symptom: 'Search-and-replace failed because the target string was not present in the target file.',
        likelyCause: 'File content diverged from model assumptions or was already edited by a prior step.',
        failingCommand,
        exactOutputSnippet: snippet,
        targetFiles: modifiedFiles,
        targetedRecoveryAction: 'Re-read the file to inspect the latest line content before generating replacement target.',
        confidence: 98,
        timestamp,
      };
    }

    // 4. DEPENDENCY_FAILURE
    if (text.includes('cannot find package') || text.includes('npm err!') || text.includes('peer dependency') || text.includes('err_module_not_found')) {
      return {
        category: 'DEPENDENCY_FAILURE',
        symptom: 'Package resolution failed due to missing npm package or peer dependency conflict.',
        likelyCause: 'Import statement references a library not installed in node_modules or package.json.',
        failingCommand,
        exactOutputSnippet: snippet,
        targetFiles: modifiedFiles,
        targetedRecoveryAction: 'Use native built-in APIs or existing installed project packages instead of adding new dependencies.',
        confidence: 92,
        timestamp,
      };
    }

    // 5. MISSING_CONTEXT
    if (text.includes('is not defined') || text.includes('referenceerror') || (text.includes('cannot find module') && !text.includes('node_modules'))) {
      const match = rawOutput.match(/(?:Cannot find module|ReferenceError:\s*(\w+)\s*is not defined)/);
      const symbol = match ? match[1] || match[0] : 'referenced identifier';
      return {
        category: 'MISSING_CONTEXT',
        symptom: `Unresolved identifier or internal file reference: ${symbol}`,
        likelyCause: 'Import was omitted, relative path was incorrect, or the symbol was not exported.',
        failingCommand,
        exactOutputSnippet: snippet,
        targetFiles: modifiedFiles,
        targetedRecoveryAction: 'Verify correct relative module path and ensure symbol is explicitly exported and imported.',
        confidence: 91,
        timestamp,
      };
    }

    // 6. TYPE_ERROR
    if (text.includes('error ts') || text.includes('typeerror') || text.includes('property does not exist') || text.includes('is not assignable to')) {
      const tsCodeMatch = rawOutput.match(/error TS(\d+): (.*)/);
      const detail = tsCodeMatch ? `TS${tsCodeMatch[1]}: ${tsCodeMatch[2]}` : 'Type mismatch';
      return {
        category: 'TYPE_ERROR',
        symptom: `TypeScript strict compilation failure: ${detail}`,
        likelyCause: 'Function argument types, return signatures, or interface properties do not align.',
        failingCommand,
        exactOutputSnippet: snippet,
        targetFiles: modifiedFiles,
        targetedRecoveryAction: 'Align type definitions with expected interfaces without breaking caller contracts.',
        confidence: 95,
        timestamp,
      };
    }

    // 7. BUILD_FAILURE
    if (text.includes('failed to compile') || text.includes('syntaxerror') || text.includes('unexpected token') || text.includes('build error')) {
      return {
        category: 'BUILD_FAILURE',
        symptom: 'Build or bundler syntax failure during compilation.',
        likelyCause: 'Malformed syntax, unmatched brackets, or unclosed string literal in recently edited file.',
        failingCommand,
        exactOutputSnippet: snippet,
        targetFiles: modifiedFiles,
        targetedRecoveryAction: 'Fix syntax error and ensure code parses cleanly with AST before verifying.',
        confidence: 94,
        timestamp,
      };
    }

    // 8. TOOL_FAILURE
    if (text.includes('command not found') || text.includes('enoent') || text.includes('127') || text.includes('permission denied')) {
      return {
        category: 'TOOL_FAILURE',
        symptom: 'Subprocess execution failed because executable or tool path was not found.',
        likelyCause: 'Tool command was misspelled or executable is not installed on PATH.',
        failingCommand,
        exactOutputSnippet: snippet,
        targetFiles: modifiedFiles,
        targetedRecoveryAction: 'Use standard npm/npx scripts or built-in node commands present in repository.',
        confidence: 90,
        timestamp,
      };
    }

    // 9. TEST_FAILURE (Default for test runs)
    return {
      category: 'TEST_FAILURE',
      symptom: 'Automated test suite assertion failure.',
      likelyCause: 'The implementation did not satisfy expected return values or invariant preconditions.',
      failingCommand,
      exactOutputSnippet: snippet,
      targetFiles: modifiedFiles,
      targetedRecoveryAction: 'Inspect failing assertion details and update code logic to satisfy test requirements.',
      confidence: 88,
      timestamp,
    };
  }

  /**
   * Generates a targeted, minimal recovery prompt context tailored to the failure class.
   */
  public static buildTargetedRecoveryPrompt(
    contract: TaskContract,
    diagnosis: FailureDiagnosis,
    currentDiff: string,
    previousAttemptNumber: number
  ): string {
    return [
      `=== PARISHRAM TARGETED RECOVERY: ATTEMPT ${previousAttemptNumber + 1} ===`,
      `[TASK OBJECTIVE]: ${contract.objective}`,
      `[FAILURE CATEGORY]: ${diagnosis.category}`,
      `[SYMPTOM]: ${diagnosis.symptom}`,
      `[FAILING COMMAND]: ${diagnosis.failingCommand}`,
      `[FAILING OUTPUT]:\n${diagnosis.exactOutputSnippet}`,
      `[CURRENT WORKING TREE DIFF]:\n${currentDiff || '(No modifications currently uncommitted)'}`,
      `[TARGETED REPAIR DIRECTIVE]: ${diagnosis.targetedRecoveryAction}`,
      '',
      'INSTRUCTIONS FOR REPAIR:',
      '1. Provide a focused code replacement to fix ONLY the diagnosed failure.',
      '2. Stay strictly within the allowed paths: ' + contract.allowedPaths.join(', '),
      '3. Do not rewrite unrelated functions or introduce new external dependencies.',
      '4. Output your patch clearly with target file, target text to replace, and replacement text.',
    ].join('\n');
  }
}
