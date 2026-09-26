#!/usr/bin/env node
/**
 * परिश्रम् Autonomous Coding Harness — Headless CLI Evaluation Runner
 *
 * Evaluation workflow:
 *   export AI_API_KEY="<PROVIDED_API_KEY>"
 *   make setup
 *   make evaluate ISSUE="Fix token verification..."
 */

import { HarnessPipeline } from '../src/lib/harness/pipeline';

async function main() {
  console.log('============================================================');
  console.log(' परिश्रम् AUTONOMOUS CODING HARNESS — HEADLESS EVALUATOR');
  console.log('============================================================\n');

  const apiKey = process.env.AI_API_KEY;
  const prescribedModel =
    process.env.AI_MODEL ||
    process.env.PRESCRIBED_MODEL ||
    process.env.PARISHRAM_EVAL_MODEL ||
    'hackathon-prescribed-text-v1';

  console.log(`[CONFIG] Prescribed Model: ${prescribedModel} (Locked)`);
  console.log(`[CONFIG] Modality: TEXT-ONLY (Enforced)`);
  console.log(`[CONFIG] AI_API_KEY: ${apiKey ? 'Configured (' + apiKey.slice(0, 4) + '...' + apiKey.slice(-4) + ')' : 'Standby / Simulated Evaluator Session'}`);
  console.log(`[CONFIG] Authentication: Bypassed (Zero friction evaluation)\n`);

  const task =
    process.argv.slice(2).join(' ') ||
    process.env.ISSUE ||
    'Fix unhandled null pointer when Authorization header is malformed in auth-gateway-service: forward active session tokens across internal requests and ensure all regression tests pass';

  console.log(`[EVALUATION TASK] "${task}"\n`);

  const pipeline = new HarnessPipeline({
    task,
    repositoryRoot: process.cwd(),
    apiKey,
    prescribedModel,
    onStateChange: (state, detail) => {
      console.log(`[STAGE: ${state}] ${detail || ''}`);
    },
    onVerification: (v) => {
      console.log(`  -> Verification: Tests ${v.tests.passed}/${v.tests.total} (failed: ${v.tests.failed}), Typecheck: ${v.typecheck.passed ? 'PASS' : 'FAIL'}, Scope: ${v.scope.passed ? 'PASS' : 'FAIL'}`);
    },
    onRecovery: (rec) => {
      console.log(`  -> Recovery: Classified as ${rec.diagnosis.category}, Strategy: ${rec.diagnosis.targetedRecoveryAction}`);
    },
  });

  const result = await pipeline.execute();

  if (result.success && result.proof) {
    console.log('\n[PROOF SEALED]');
    console.log(`  -> Status: ${result.proof.status}`);
    console.log(`  -> Proof Hash (SHA-256): ${result.proof.proofHash}`);
    console.log(`  -> Merkle Root: ${result.proof.merkleRoot}`);
    console.log(`  -> Merkle Leaves: ${result.proof.merkleLeaves.length}`);
    console.log(`  -> Duration: ${(result.telemetry.durationMs / 1000).toFixed(2)}s`);
    console.log(`  -> Total Tokens: ${result.telemetry.totalTokens}`);
    if (result.proof.receiptPath) {
      console.log(`  -> Sealed Receipt: ${result.proof.receiptPath}`);
    }

    console.log('\n============================================================');
    console.log(' EVALUATION SUCCESSFUL — VERIFIED AUTONOMOUS FIX COMPLETED');
    console.log('============================================================');
    process.exit(0);
  } else {
    console.error('\n============================================================');
    console.error(' EVALUATION FAILED — COULD NOT REACH VERIFIED STATE');
    console.error('============================================================');
    if (result.error) {
      console.error(`Reason: ${result.error}`);
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('[EVALUATION ERROR]', err);
  process.exit(1);
});
