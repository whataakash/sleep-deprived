'use client';

import React, { useState } from 'react';
import { Terminal, Copy, Check, ChevronUp, ChevronDown } from 'lucide-react';

interface TerminalDrawerProps {
  customSnippet?: string;
}

export function TerminalDrawer({ customSnippet }: TerminalDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'tests' | 'typecheck' | 'build' | 'diff'>('tests');
  const [copied, setCopied] = useState(false);

  const LOG_OUTPUTS = {
    tests: `$ pnpm test -- --runInBand
> auth-gateway-service@1.4.2 test
> jest --runInBand

PASS tests/unit/session.test.ts (14ms)
  ✓ creates active session with valid expiration (6ms)
  ✓ validates active session token successfully (8ms)

PASS tests/integration/auth.test.ts (42ms)
  ✓ forwards session token and accesses protected profile route (42ms)

PASS tests/regression/security.test.ts (18ms)
  ✓ strictly rejects forged bearer tokens (18ms)

Test Suites: 3 passed, 3 total
Tests:       4 passed, 4 total
Snapshots:   0 total
Time:        1.42s
Ran all test suites.`,

    typecheck: `$ pnpm run typecheck
> auth-gateway-service@1.4.2 typecheck
> tsc --noEmit

✨ TypeScript 5.8: zero diagnostics found in 28 workspace files.`,

    build: `$ pnpm run build
> auth-gateway-service@1.4.2 build
> tsup src/server/index.ts --format esm,cjs

CLI Building entry: src/server/index.ts
CLI Using tsconfig: tsconfig.json
CLI tsup v8.3.6
CLI Target: es2022
ESM Build start
ESM dist/index.mjs     18.42 KB
ESM ⚡️ Build success in 142ms
CJS Build start
CJS dist/index.cjs     22.18 KB
CJS ⚡️ Build success in 89ms
✔ Production artifacts bundled cleanly.`,

    diff: `$ git diff src/auth/client.ts
diff --git a/src/auth/client.ts b/src/auth/client.ts
--- a/src/auth/client.ts
+++ b/src/auth/client.ts
@@ -23,7 +23,13 @@ export class AuthServiceClient {
-    const headers = options.headers || {};
+    const headers = new Headers(options.headers || {});
+    
+    // FIX APPLIED BY PARISHRAM: Forward active session token
+    if (this.currentSession && this.currentSession.token) {
+      headers.set('Authorization', \`Bearer \${this.currentSession.token}\`);
+      headers.set('X-Session-ID', this.currentSession.id);
+    }`,
  };

  const currentText = customSnippet || LOG_OUTPUTS[activeTab];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full bg-[var(--bg-canvas)] border-t border-[var(--border-subtle)] flex flex-col font-mono text-xs select-none z-10 transition-colors">
      {/* Header bar */}
      <div className="px-4 py-2 bg-[var(--bg-elevated)] flex items-center justify-between border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            <Terminal className="w-4 h-4 text-[#ea580c]" />
            <span className="font-semibold text-[var(--text-primary)]">SANDBOX TERMINAL</span>
            {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>

          {isOpen && (
            <div className="flex items-center gap-1">
              {(['tests', 'typecheck', 'build', 'diff'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-2 py-0.5 rounded text-[11px] capitalize transition-colors cursor-pointer ${
                    activeTab === tab
                      ? 'bg-[var(--bg-active)] text-[#ea580c] font-semibold border border-[var(--border-active)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          )}
        </div>

        {isOpen && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[var(--text-muted)]">Container: isolated-microvm #89</span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-[var(--bg-subtle)] hover:bg-[var(--bg-active)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer text-[10px]"
            >
              {copied ? <Check className="w-3 h-3 text-[#10b981]" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Terminal Body */}
      {isOpen && (
        <div className="h-44 overflow-y-auto p-3 bg-[var(--code-bg)] text-[var(--text-secondary)] font-mono text-xs select-text">
          <pre className="whitespace-pre">{currentText}</pre>
        </div>
      )}
    </div>
  );
}
