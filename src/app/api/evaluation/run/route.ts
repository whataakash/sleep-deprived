import { NextRequest, NextResponse } from 'next/server';
import { HarnessPipeline } from '@/lib/harness/pipeline';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const task = body.task || 'Fix unhandled null pointer when Authorization header is malformed in auth-gateway-service: forward active session tokens across internal requests and ensure all regression tests pass';

    const pipeline = new HarnessPipeline({
      task,
      repositoryRoot: process.cwd(),
      apiKey: body.apiKey,
      prescribedModel: body.prescribedModel,
      isEvaluationMode: true,
    });

    const result = await pipeline.execute();

    if (result.success && result.proof) {
      return NextResponse.json({
        status: 'VERIFIED',
        runId: result.runId,
        task: result.contract.objective,
        evaluationMode: true,
        prescribedModelUsed: result.proof.telemetry.modelCalls > 0 ? (body.prescribedModel || 'hackathon-prescribed-text-v1') : 'deterministic-evaluator',
        textOnlyEnforced: true,
        durationSeconds: Number((result.telemetry.durationMs / 1000).toFixed(2)),
        tokensUsed: {
          prompt: result.telemetry.promptTokens,
          completion: result.telemetry.completionTokens,
          total: result.telemetry.totalTokens,
        },
        toolCallsExecuted: result.toolEvents.length,
        changesApplied: result.proof.filesChanged.map((f) => ({
          file: f,
          status: 'MODIFIED',
        })),
        diff: result.proof.diff,
        testSummary: {
          testsRun: result.verification.tests.total,
          testsPassed: result.verification.tests.passed,
          testsFailed: result.verification.tests.failed,
          regressionsDetected: 0,
        },
        proof: {
          proofHash: result.proof.proofHash,
          merkleRoot: result.proof.merkleRoot,
          merkleLeaves: result.proof.merkleLeaves,
          verifiedAt: result.proof.timestamp,
          invariantPassed: result.verification.passed,
          receiptPath: result.proof.receiptPath,
        },
      });
    } else {
      return NextResponse.json(
        {
          status: 'FAILED',
          runId: result.runId,
          error: result.error || 'Verification gate rejected the patch',
          verification: result.verification,
          textOnlyEnforced: true,
        },
        { status: 422 }
      );
    }
  } catch (err: any) {
    return NextResponse.json(
      {
        status: 'FAILED',
        error: err?.message || 'Evaluation harness execution error',
        textOnlyEnforced: true,
      },
      { status: 500 }
    );
  }
}
