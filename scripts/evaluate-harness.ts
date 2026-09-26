#!/usr/bin/env node
/**
 * PARISHRAM Autonomous Coding Harness — Headless CLI Evaluation Runner
 * Delegates cleanly to the unified Parishram CLI.
 */

import { spawn } from 'node:child_process';
import path from 'node:path';

const cliPath = path.resolve(__dirname, 'cli.ts');
const args = process.argv.slice(2);

const proc = spawn('npx', ['tsx', cliPath, 'evaluate', ...args], {
  stdio: 'inherit',
  env: process.env,
  shell: true,
});

proc.on('exit', (code) => {
  process.exit(code ?? 0);
});
