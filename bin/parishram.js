#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');

const cliPath = path.resolve(__dirname, '../scripts/cli.ts');
const tsx = path.resolve(__dirname, '../node_modules/.bin/tsx');

const proc = spawn(process.execPath, [tsx, cliPath, ...process.argv.slice(2)], {
  stdio: 'inherit',
  env: process.env,
});

proc.on('exit', (code) => {
  process.exit(code ?? 0);
});
