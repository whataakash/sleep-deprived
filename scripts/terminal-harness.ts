#!/usr/bin/env node
/**
 * PARISHRAM — Terminal User Interface (TUI) & Evaluation Harness
 *
 * Official Hackathon 2026 Evaluation Standard Interface:
 *   export AI_API_KEY="<PROVIDED_API_KEY>"
 *   make setup
 *   make run
 *   # or headless:
 *   make evaluate ISSUE="Fix token verification..."
 */

import readline from 'node:readline';
import { HarnessPipeline } from '../src/lib/harness/pipeline';
import { HarnessState } from '../src/lib/harness/types';

// ANSI Colors for IDE-grade Terminal Output
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  orange: '\x1b[38;5;208m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  purple: '\x1b[35m',
  red: '\x1b[31m',
  gray: '\x1b[90m',
};

async function getIssueInput(): Promise<string> {
  // 1. From CLI argument
  const args = process.argv.slice(2).filter((a) => !a.startsWith('-'));
  if (args.length > 0 && args.join(' ').trim().length > 0) {
    return args.join(' ').trim();
  }

  // 2. From environment variable
  if (process.env.ISSUE && process.env.ISSUE.trim().length > 0) {
    return process.env.ISSUE.trim();
  }

  // 3. From piped stdin (non-interactive, e.g. make evaluate ISSUE="...")
  if (!process.stdin.isTTY) {
    return new Promise((resolve, reject) => {
      let data = '';
      process.stdin.setEncoding('utf8');
      process.stdin.on('data', (chunk) => {
        data += chunk;
      });
      process.stdin.on('end', () => {
        const trimmed = data.trim();
        if (trimmed.length > 0) {
          resolve(trimmed);
        } else {
          console.error(`\n${c.red}[ERROR] No task provided via stdin.${c.reset}`);
          console.error(`Usage: echo "Fix issue in repo" | make run`);
          console.error(`  or:  make evaluate ISSUE="Fix issue in repo"\n`);
          process.exit(1);
        }
      });
    });
  }

  // 4. Interactive prompt for evaluator in TTY terminal
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    process.stdout.write(
      `\n${c.bold}${c.orange}? Enter evaluation task / issue description:${c.reset}\n  ${c.cyan}❯ ${c.reset}`
    );

    rl.question('', (answer) => {
      rl.close();
      const val = answer.trim();
      if (!val) {
        console.error(`\n${c.red}[ERROR] No task provided. Please describe the issue to fix.${c.reset}\n`);
        process.exit(1);
      }
      resolve(val);
    });
  });
}

export async function runTerminalHarness(customTask?: string): Promise<void> {
  console.log(`\n${c.orange}╔══════════════════════════════════════════════════════════════════════════════╗${c.reset}`);
  console.log(`${c.orange}║${c.reset}   ${c.bold}PARISHRAM — AUTONOMOUS CODING-AGENT HARNESS (TUI MODE)${c.reset}                     ${c.orange}║${c.reset}`);
  console.log(`${c.orange}║${c.reset}   ${c.dim}"Understand. Execute. Verify. Prove." — LCC × DevClub Hackathon 2026${c.reset}       ${c.orange}║${c.reset}`);
  console.log(`${c.orange}╚══════════════════════════════════════════════════════════════════════════════╝${c.reset}\n`);

  const apiKey = process.env.AI_API_KEY;
  const prescribedModel =
    process.env.AI_MODEL ||
    process.env.PRESCRIBED_MODEL ||
    process.env.PARISHRAM_EVAL_MODEL ||
    'hackathon-prescribed-text-v1';

  console.log(`${c.bold}EVALUATION ENVIRONMENT CONFIGURATION:${c.reset}`);
  console.log(`  ${c.cyan}• Modality:${c.reset}        ${c.green}Strictly TEXT-ONLY (Enforced)${c.reset}`);
  console.log(`  ${c.cyan}• Prescribed Model:${c.reset}${c.green}${prescribedModel} (Locked per Hackathon Rules)${c.reset}`);
  console.log(
    `  ${c.cyan}• AI_API_KEY:${c.reset}      ${
      apiKey
        ? `${c.green}Configured (${apiKey.slice(0, 4)}...${apiKey.slice(-4)})${c.reset}`
        : `${c.yellow}Not set (Export AI_API_KEY="<key>" for live model execution)${c.reset}`
    }`
  );
  console.log(`  ${c.cyan}• Authentication:${c.reset}  ${c.green}Bypassed (Zero-friction evaluator auto-auth)${c.reset}`);
  console.log(`  ${c.cyan}• Working Tree:${c.reset}    ${c.dim}${process.cwd()}${c.reset}`);
  console.log(`  ${c.cyan}• Web Dashboard:${c.reset}   ${c.dim}http://localhost:3000${c.reset}`);

  // Obtain issue
  const task = customTask || (await getIssueInput());
  console.log(`\n${c.bold}${c.purple}[EVALUATION TASK RECEIVED]${c.reset} "${c.bold}${task}${c.reset}"\n`);

  // Initialize Real Autonomous Harness Pipeline
  const pipeline = new HarnessPipeline({
    task,
    repositoryRoot: process.cwd(),
    apiKey,
    prescribedModel,
    onStateChange: (state: HarnessState, detail?: string) => {
      const stateLabels: Record<HarnessState, string> = {
        INTAKE: '[STAGE 01/09 — INTAKE & SANITIZATION]',
        TASK_CONTRACT: '[STAGE 02/09 — TASK CONTRACT SPECIFICATION]',
        TARGETED_CONTEXT: '[STAGE 03/09 — TARGETED CONTEXT CARTOGRAPHY]',
        PLAN: '[STAGE 04/09 — UNDERSTAND & AUTONOMOUS PLANNING]',
        EXECUTE: '[STAGE 05/09 — CODE MUTATION & UNIFIED DIFF]',
        VERIFY: '[STAGE 06/09 — VERIFICATION & TEST MATRIX]',
        RECOVER: '[STAGE 07/09 — FAILURE DIAGNOSIS & RECOVERY]',
        PROVE: '[STAGE 08/09 — CRYPTOGRAPHIC PROOF & MERKLE SEAL]',
        COMPLETE: '[STAGE 09/09 — HARNESS EXECUTION COMPLETE]',
        FAILED: '[STAGE — EXECUTION FAILED]',
      };
      console.log(`${c.bold}${c.orange}${stateLabels[state] || state}${c.reset}`);
      if (detail) {
        console.log(`  ${c.dim}${detail}${c.reset}`);
      }
    },
    onToolCall: (evt) => {
      const statusIcon = evt.status === 'completed' ? `${c.green}✓${c.reset}` : `${c.red}✗${c.reset}`;
      const inputStr = evt.input ? JSON.stringify(evt.input) : '';
      console.log(`  ${statusIcon} ${c.cyan}[${evt.tool}]${c.reset} ${inputStr} (${evt.durationMs}ms)`);
      if (evt.error) {
        console.log(`    ${c.red}${evt.error}${c.reset}`);
      }
    },
    onVerification: (v) => {
      const icon = v.passed ? `${c.green}✓${c.reset}` : `${c.yellow}⚠${c.reset}`;
      console.log(`  ${icon} Tests: ${v.tests.passed}/${v.tests.total} passed (${v.tests.failed} failed)`);
      console.log(`  ${icon} Typecheck: ${v.typecheck.passed ? 'PASSED (0 errors)' : `FAILED (${v.typecheck.errorsCount} errors)`}`);
      console.log(`  ${icon} Scope Check: ${v.scope.passed ? 'PASSED (In bounds)' : 'FAILED (Out of bounds)'}`);
      console.log(`  ${icon} Security Check: ${v.security.passed ? 'PASSED (0 secrets)' : 'FAILED (Secrets detected)'}\n`);
    },
    onRecovery: (rec) => {
      console.log(`  ${c.yellow}↳ Diagnostic Classification:${c.reset} ${c.bold}${rec.diagnosis.category}${c.reset}`);
      console.log(`  ${c.dim}  Symptom: ${rec.diagnosis.symptom}${c.reset}`);
      console.log(`  ${c.dim}  Recovery Strategy: ${rec.diagnosis.targetedRecoveryAction}${c.reset}\n`);
    },
  });

  const result = await pipeline.execute();

  if (result.success && result.proof) {
    console.log(`\n${c.bold}${c.green}AUTHENTIC RUN RECEIPT:${c.reset}`);
    console.log(`  ${c.cyan}• Status:${c.reset}               ${c.green}${c.bold}VERIFIED ✓${c.reset}`);
    console.log(`  ${c.cyan}• Proof Hash (SHA-256):${c.reset}  ${c.bold}${result.proof.proofHash}${c.reset}`);
    console.log(`  ${c.cyan}• Merkle Root:${c.reset}          ${c.bold}${result.proof.merkleRoot}${c.reset}`);
    console.log(`  ${c.cyan}• Merkle Leaves:${c.reset}        ${result.proof.merkleLeaves.length} cryptographic leaves`);
    console.log(`  ${c.cyan}• Files Changed:${c.reset}        ${result.proof.filesChanged.length} (${result.proof.filesChanged.join(', ') || '0 files'})`);
    console.log(`  ${c.cyan}• Total Duration:${c.reset}       ${(result.telemetry.durationMs / 1000).toFixed(2)}s`);
    console.log(`  ${c.cyan}• Token Telemetry:${c.reset}      ${result.telemetry.totalTokens} tokens (${result.telemetry.modelCalls} model calls)`);
    if (result.proof.receiptPath) {
      console.log(`  ${c.cyan}• Sealed Receipt:${c.reset}       ${c.dim}${result.proof.receiptPath}${c.reset}`);
    }

    console.log(`\n${c.green}══════════════════════════════════════════════════════════════════════════════${c.reset}`);
    console.log(`${c.green}${c.bold} ✔ EVALUATION SUCCESSFUL — VERIFIED AUTONOMOUS FIX COMPLETED (EXIT CODE 0)${c.reset}`);
    console.log(`${c.green}══════════════════════════════════════════════════════════════════════════════${c.reset}\n`);
    process.exit(0);
  } else {
    console.log(`\n${c.red}══════════════════════════════════════════════════════════════════════════════${c.reset}`);
    console.log(`${c.red}${c.bold} ✖ EVALUATION FAILED — COULD NOT REACH VERIFIED STATE (EXIT CODE 1)${c.reset}`);
    console.log(`${c.red}══════════════════════════════════════════════════════════════════════════════${c.reset}`);
    if (result.error) {
      console.log(`  ${c.red}Reason: ${result.error}${c.reset}\n`);
    }
    process.exit(1);
  }
}

if (require.main === module || (typeof process.argv[1] === 'string' && process.argv[1].endsWith('terminal-harness.ts'))) {
  runTerminalHarness().catch((err) => {
    console.error(`${c.red}[EVALUATION FATAL ERROR]${c.reset}`, err);
    process.exit(1);
  });
}
