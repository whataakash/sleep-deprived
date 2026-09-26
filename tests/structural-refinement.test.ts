import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { RECENT_RUNS } from '../src/lib/runs/run-history';

test('Structural Refinement: 1. Sidebar contains Home, Runs, Repositories', async () => {
  const sidebarContent = await fs.readFile(
    path.join(process.cwd(), 'src/components/layout/sidebar.tsx'),
    'utf-8'
  );

  // Check Home exists
  assert.ok(
    sidebarContent.includes('>Home</span>'),
    'Sidebar should have "Home" navigation item'
  );
  // Check Mission Control is replaced in sidebar navigation
  assert.ok(
    !sidebarContent.includes('>Mission Control</span>'),
    'Sidebar should not have "Mission Control" label'
  );
  // Check Runs exists
  assert.ok(
    sidebarContent.includes('>Runs</span>'),
    'Sidebar should have "Runs" navigation item'
  );
  // Check Repositories exists
  assert.ok(
    sidebarContent.includes('>Repositories</span>'),
    'Sidebar should have "Repositories" navigation item'
  );
  // Check Models exists
  assert.ok(
    sidebarContent.includes('>Models</span>') || sidebarContent.includes('>Models & Arena</span>'),
    'Sidebar should have "Models" navigation item'
  );
});

test('Structural Refinement: 2. Home does not contain large Recent Runs list', async () => {
  const overviewContent = await fs.readFile(
    path.join(process.cwd(), 'src/components/features/overview/overview-view.tsx'),
    'utf-8'
  );

  // Home should not contain the Recent Runs list section
  assert.ok(
    !overviewContent.includes('<span>Recent Runs</span>'),
    'Home/Overview page should no longer contain Recent Runs section header'
  );
  assert.ok(
    !overviewContent.includes('All Tasks Persisted</span>'),
    'Home/Overview page should not contain the All Tasks Persisted runs list'
  );
});

test('Structural Refinement: 3. Runs view houses RECENT_RUNS data and inspection', async () => {
  const runViewContent = await fs.readFile(
    path.join(process.cwd(), 'src/components/features/run/run-view.tsx'),
    'utf-8'
  );

  // Runs page must have Recent Runs / history integration
  assert.ok(
    runViewContent.includes('Recent Runs'),
    'Runs view should have Recent Runs tab or panel'
  );
  assert.ok(
    runViewContent.includes('RECENT_RUNS'),
    'Runs view should import and display RECENT_RUNS data'
  );

  // Run history module should preserve all historical runs
  assert.equal(RECENT_RUNS.length, 4, 'All 4 historical runs must be preserved');
  assert.ok(
    RECENT_RUNS.some((r) => r.number === 1042 && r.status === 'VERIFIED'),
    'Run #1042 must be preserved with VERIFIED status'
  );
  assert.ok(
    RECENT_RUNS.some((r) => r.number === 1041 && r.status === 'VERIFIED'),
    'Run #1041 must be preserved with VERIFIED status'
  );
  assert.ok(
    RECENT_RUNS.some((r) => r.number === 1040 && r.status === 'VERIFIED'),
    'Run #1040 must be preserved with VERIFIED status'
  );
  assert.ok(
    RECENT_RUNS.some((r) => r.number === 1039 && r.status === 'VERIFIED'),
    'Run #1039 must be preserved with VERIFIED status'
  );
});

test('Structural Refinement: 4. Task Composer has attachment button on bottom-left beside model selector', async () => {
  const overviewContent = await fs.readFile(
    path.join(process.cwd(), 'src/components/features/overview/overview-view.tsx'),
    'utf-8'
  );

  // Placeholder
  assert.ok(
    overviewContent.includes('placeholder="How can I help you today?"'),
    'Composer placeholder should be "How can I help you today?"'
  );

  // Attachment button on left
  assert.ok(
    overviewContent.includes('aria-label="Attach local files"'),
    'Composer should have attachment button with aria-label'
  );
  assert.ok(
    overviewContent.includes('type="file"'),
    'Composer should have native hidden file input'
  );
  assert.ok(
    overviewContent.includes('multiple'),
    'File input should support multiple files'
  );

  // Mic and arrow on right
  assert.ok(
    overviewContent.includes('toggleListening'),
    'Composer must preserve functional microphone'
  );
  assert.ok(
    overviewContent.includes('handleSubmitTask'),
    'Composer must preserve arrow submit action'
  );
});
