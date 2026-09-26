# परिश्रम (PARISHRAM) — Complete Feature Specification

> **"Build it. Test it. Prove it."**  
> An autonomous coding-agent harness engineered for deterministic code repair, context optimization, failure recovery, and cryptographic proof of verification.

---

## 1. Executive Summary

**परिश्रम (PARISHRAM)** transforms generative AI models from probabilistic code guessers into verified software engineering agents. Unlike conversational coding chatbots that dump unvalidated snippets into chat bubbles, परिश्रम operates as a **closed-loop execution harness**:

1. Ingests and indexes the local codebase with AST symbol extraction.
2. Formulates an execution plan with targeted file mutations.
3. Executes edits in an isolated sandbox.
4. Detects failures, analyzes AST fingerprints, and generates targeted recovery tactics.
5. Runs comprehensive verification across unit tests, cross-service integration tests, compiler typecheck, and regression safeguards.
6. Seals the run with deterministic SHA-256 cryptographic proofs and Merkle tree roots.

---

## 2. Core Feature Matrix

| Domain | Feature | Description | Status |
|---|---|---|---|
| **Orchestration** | 10-Stage State Machine | Closed-loop lifecycle: `TASK` → `UNDERSTAND` → `PLAN` → `SEARCH` → `EDIT` → `RUN` → `DIAGNOSE` → `RECOVER` → `VERIFY` → `PROOF` | 🟢 Production |
| **Progress Tracking** | Parishram Path | Responsive 3-tier progress stepper (Desktop 5-stage line, Tablet compact stepper, Mobile collapsible drawer) | 🟢 Production |
| **Context Management** | Repository Context Engine | AST symbol mapping, dependency tracing, "Why This File?" relevance scoring, and 88%+ context token reduction | 🟢 Production |
| **Diagnostics** | Failure Analyzer & Recovery Planner | Automatic AST stack-trace fingerprinting; classifies errors (Missing credentials, syntax, type mismatch) and applies proven tactics | 🟢 Production |
| **Verification** | 4-Quadrant Verification Matrix | Unit tests, Integration tests, TypeScript strict typecheck (`tsc --noEmit`), and regression invariants | 🟢 Production |
| **Trust & Evidence** | Cryptographic Proof Engine | SHA-256 proof hash, Merkle root, timestamped evidence links, and interactive SVG Proof Graph | 🟢 Production |
| **Code Review** | Unified Diff Viewer | Side-by-side and inline syntax-highlighted diffs with chunk navigation and file selection | 🟢 Production |
| **Observability** | Terminal & Process Drawer | Live ANSI-colored command execution logs, sandbox stdout/stderr, and exit code telemetry | 🟢 Production |
| **Model Gateway** | Dynamic 2026 Model Catalog | Qwen3-Coder-Next, Kimi K2.5, GLM-5, DeepSeek V3, Grok 3, Claude 3.7 Sonnet, and Local Ollama | 🟢 Production |
| **Model Routing** | Autonomous Model Router | Analyzes task complexity, estimated token budget, and user plan entitlements to select optimal model | 🟢 Production |
| **Billing & Plans** | Hindi Identity Subscription System | Multi-tier plans (**आरम्भ**, **प्रगति**, **प्रवीण**, **दल**) with quotas, limits, and server-side tracking | 🟢 Production |
| **Payments** | Official Hosted Checkout | Direct gateway routing to `shivansh.p@fam` (FamPay / UPI), server-side verification, zero custom card inputs | 🟢 Production |
| **Configuration** | IDE-Grade Settings & Account | 12 structured settings domains, appearance switching, BYOK key store, and compact avatar menu | 🟢 Production |
| **Evaluation Mode** | Hackathon Compliance Mode | Headless CLI runner, locked prescribed text-only model, root Makefile targets, and zero-friction evaluator setup | 🟢 Production |

---

## 3. Autonomous Execution Lifecycle & Parishram Path

```
   ┌────────────────────────────────────────────────────────────────────────┐
   │                        PARISHRAM PATH STEPPER                          │
   └────────────────────────────────────────────────────────────────────────┘
       01               02             03            04             05
     [TASK] ──► [UNDERSTAND/PLAN] ──► [EXECUTE] ──► [VERIFY] ──► [PROOF ✓]
                         ▲               │
                         │   RECOVERY    │
                         └── [DIAGNOSE] ◄┘
```

### The 10 Lifecycle Stages:
1. **INTAKE (`TASK`):** Ingests user problem statement, bug report, or GitHub issue.
2. **UNDERSTAND:** Resolves repository dependency graph and scans related interfaces.
3. **PLAN:** Decomposes problem into discrete, test-driven remediation steps.
4. **SEARCH:** Discovers candidate symbols, imports, call sites, and test cases.
5. **EDIT:** Applies unified diff patches using clean filesystem abstractions.
6. **RUN:** Executes targeted test suites in an isolated test runner.
7. **DIAGNOSE:** If errors occur, extracts exception frames and AST fingerprints.
8. **RECOVER:** Applies targeted patch corrections without restarting from scratch.
9. **VERIFY:** Evaluates all unit tests, integration suites, and strict compiler checks.
10. **PROOF (`VERIFIED ✓`):** Seals the changes into a deterministic proof record.

### Responsive Parishram Path Implementation:
- **Desktop (≥ 1024px):** 5 numbered stages with status badges (`✓` passed, `●` active, `○` upcoming) and connecting color-coded progress lines.
- **Tablet (768px – 1023px):** Compact horizontal stage badges (`1. Task`, `2. Context`, `3. Execute`, etc.).
- **Mobile (< 768px):** Clean header showing `EXECUTE · Step 3 of 5` with an animated progress bar and collapsible accordion drawer powered by Motion `AnimatePresence`.

---

## 4. Failure Analysis & Autonomous Recovery

When a tool or test fails during an execution run, परिश्रम activates its **Failure Analyzer** (`FailureAnalyzer.analyze()`):
1. **Fingerprint Synthesis:** Generates a deterministic hash from the error message, exception type, and stack trace frames.
2. **Category Classification:** Classifies failure into `AUTH_CREDENTIALS_MISSING`, `TYPE_MISMATCH`, `TIMEOUT`, `TEST_ASSERTION_FAILED`, or `SYNTAX_ERROR`.
3. **Recovery Planner:** Selects proven recovery tactics from persistent engineering memory.
4. **Tactic Execution:** Applies remediation (e.g. forward session tokens in headers, update interface properties, add missing imports) and re-verifies.
5. **Zero-Regression Guarantee:** Verifies that no previously passing tests are broken by the remediation.

---

## 5. Cryptographic Proof System & Evidence Graph

Every completed run produces a tamper-proof **Proof Record**:
- **Proof Hash:** SHA-256 hash sealing the verified state.
- **Merkle Tree Root:** Cryptographic tree linking requirements to code diffs and test results.
- **Task Coverage Matrix:** Lists all requirements with direct evidence links (`file:line`).
- **Interactive Proof Graph:** Visual SVG node-link graph showing the dependency flow from Requirement → AST Symbol → Applied Change → Test Assertion → Proof Seal.
- **Badge Title:** Officially marked as **`VERIFIED ✓`**.

---

## 6. Multi-Model Gateway & Dynamic Routing

### 2026 Model Catalog:
- **Qwen3-Coder-Next:** Flagship 262k context open-weight model specialized in autonomous code synthesis.
- **Kimi K2.5:** Frontier open-source multimodal model with extensive tool-calling capabilities.
- **GLM-5 MoE:** Mixture-of-experts model optimized for deep algorithmic and architectural planning.
- **DeepSeek V3 Coder:** Ultra-fast reasoning model for syntax error diagnosis and AST refactoring.
- **Claude 3.7 Sonnet:** Hybrid reasoning architecture with dynamic thinking budgets.
- **xAI Grok 3 / Grok 2:** Frontier algorithmic reasoning and verification.
- **Local Ollama:** Fully offline, air-gapped local execution for zero-data-egress compliance.

### Autonomous Model Router:
Automatically scores task complexity (1–10), counts affected files, estimates required context tokens, and picks the most cost-effective model permitted by the user's plan.

---

## 7. Subscription Plans & Payment Checkout Architecture

### Hindi Identity Plan Hierarchy:
- **आरम्भ (Starter):** Free tier, 25 autonomous runs/mo, 64k tokens context.
- **प्रगति (Builder):** ₹2,499/mo ($29/mo), 150 runs/mo, 128k context, 2x parallel tools.
- **प्रवीण (Professional):** ₹6,999/mo ($79/mo), 500 runs/mo, 256k context, 4x parallel tools.
- **दल (Team):** ₹16,999/mo ($199/mo), unlimited verified runs, 1M context, 8x parallel tools.

### Payment Architecture:
- **Merchant Destination:** Configured strictly server-side to **`shivansh.p@fam`** (FamPay / UPI).
- **Official Checkout Flow:** Clean summary screen → hosted/provider handoff (UPI QR / VPA deep link) → server-side status verification (`/api/billing/verify`).
- **Zero Fake UI:** Users never enter credit card or banking details into custom Parishram inputs.
- **State Enforcement:** Subscriptions only activate upon `PAYMENT_SUCCESS` confirmed by backend cryptographic/status checks.

---

## 8. Hackathon Evaluation Mode & CLI Compatibility

- **Environment Variable Activation:** Setting `AI_API_KEY` or `FORGE_EVALUATION_MODE=true` automatically locks the harness to `hackathon-prescribed-text-v1`.
- **Text-Only Modality Enforced:** Strictly rejects multimodal, vision, or audio payloads per hackathon evaluation guidelines.
- **Makefile Standard Targets:**
  - `make setup`: Clean dependency installation and Next.js production compilation.
  - `make run`: Starts the production server on port 3000.
  - `make test`: Runs all 6 unit and compliance tests (`tests/harness.test.ts`).
  - `make evaluate`: Headless autonomous CLI evaluation against prescribed test issues.
- **Zero Friction:** Evaluators can run the full suite without creating an account or configuring payments.
