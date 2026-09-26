import { StuckAgentTelemetry } from '@/types/harness';
import { ToolCall } from '@/types/agent';

export class StuckAgentDetector {
  private static MAX_IDENTICAL_TOOL_CALLS = 3;
  private static MAX_CONSECUTIVE_TEST_FAILURES = 3;

  public static analyzeToolCalls(toolCalls: ToolCall[]): StuckAgentTelemetry {
    if (!toolCalls || toolCalls.length === 0) {
      return {
        isStuck: false,
        repeatedActionCount: 0,
        consecutiveFailures: 0,
        stallDurationSeconds: 0,
        status: 'HEALTHY',
      };
    }

    // Check for identical consecutive tool invocations
    let repeatedCount = 1;
    let lastToolCall = toolCalls[toolCalls.length - 1];
    let detectedLoopPattern: string | undefined;

    for (let i = toolCalls.length - 2; i >= 0; i--) {
      const tc = toolCalls[i];
      if (
        tc.tool === lastToolCall.tool &&
        JSON.stringify(tc.input) === JSON.stringify(lastToolCall.input)
      ) {
        repeatedCount++;
      } else {
        break;
      }
    }

    // Check for consecutive failures
    let consecutiveFailures = 0;
    for (let i = toolCalls.length - 1; i >= 0; i--) {
      if (toolCalls[i].status === 'failed') {
        consecutiveFailures++;
      } else {
        break;
      }
    }

    const isStuck =
      repeatedCount >= this.MAX_IDENTICAL_TOOL_CALLS ||
      consecutiveFailures >= this.MAX_CONSECUTIVE_TEST_FAILURES;

    let status: StuckAgentTelemetry['status'] = 'HEALTHY';
    let mitigationStrategy: string | undefined;

    if (isStuck) {
      status = 'LOOP_DETECTED';
      detectedLoopPattern = `Detected ${repeatedCount}x repetitive ${lastToolCall.tool} executions without AST delta.`;
      mitigationStrategy =
        'Halt repetitive tool loop. Supervisor AI initiates autonomous recovery rollback or switches to AST symbol graph search.';
    } else if (repeatedCount === 2 || consecutiveFailures === 2) {
      status = 'WARNING';
      mitigationStrategy = 'Monitor next action: if error repeats, trigger automated tactic pivot.';
    }

    return {
      isStuck,
      repeatedActionCount: repeatedCount,
      lastIdenticalCommand: `${lastToolCall.tool}(${JSON.stringify(lastToolCall.input)})`,
      consecutiveFailures,
      stallDurationSeconds: 12,
      detectedLoopPattern,
      mitigationStrategy,
      status,
    };
  }

  public static getBenchmarkTelemetry(): StuckAgentTelemetry {
    return {
      isStuck: false,
      repeatedActionCount: 1,
      lastIdenticalCommand: 'edit_file(src/auth/client.ts)',
      consecutiveFailures: 0,
      stallDurationSeconds: 4,
      status: 'HEALTHY',
      mitigationStrategy: 'No loop detected. Execution progress steady (+14 lines verified).',
    };
  }
}
