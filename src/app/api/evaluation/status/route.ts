import { NextResponse } from 'next/server';
import { EvaluationModelAdapter } from '@/lib/models/evaluation-adapter';

export async function GET() {
  const config = EvaluationModelAdapter.getEvaluationConfig();
  return NextResponse.json({
    status: config.hasApiKey ? 'READY' : 'STANDBY',
    evaluationMode: config.isEvaluationMode,
    prescribedModel: config.prescribedModel,
    textOnly: config.isTextOnly,
    hasApiKey: config.hasApiKey,
    maskedApiKey: config.maskedApiKey,
    instructions: {
      workflow: 'export AI_API_KEY="..."; make setup; make run',
      test: 'make test',
      clean: 'make clean',
    },
  });
}
