# परिश्रम — Autonomous AI Coding-Agent Harness

> **"Build it. Test it. Prove it."**  
> An autonomous coding harness designed for the **LCC × DevClub AI Coding Harness Hackathon**.

परिश्रम transforms raw foundation models into verified software engineers. Rather than acting as a conversational code assistant that guesses fixes, परिश्रम operates as a closed-loop execution harness: **orchestrating tools, managing context, analyzing failure traces, executing targeted recoveries, and generating cryptographic proof of verification.**

---

## ⚡ Standard Evaluator Workflow (P0 Compliance)

The repository provides a standard root `Makefile` adhering strictly to official hackathon evaluation guidelines. The evaluation workflow requires **zero signup, zero login, and zero UI API key entry**.

```bash
# 1. Provide the evaluation API key
export AI_API_KEY="<YOUR_EVALUATION_API_KEY>"

# 2. Setup dependencies and compile production build from clean clone
make setup

# 3. Launch FORGE application (evaluation mode automatically active)
make run

# 4. Run automated evaluation compliance & verification test suite
make test

# 5. (Optional) Run headless CLI evaluation against prescribed test case
make evaluate
```

---

## 📋 Evaluation Compliance Matrix

| Requirement | FORGE Specification | Status |
|---|---|---|
| **Root Makefile** | Exposes `make setup`, `make run`, `make test`, `make evaluate`, `make clean` | 🟢 Verified |
| **`AI_API_KEY` Support** | Consumes `process.env.AI_API_KEY` directly; zero manual UI key entry | 🟢 Verified |
| **Prescribed Model Lock** | In evaluation mode, locks to `hackathon-prescribed-text-v1` (or `FORGE_EVAL_MODEL`); model substitution & fallback disabled | 🟢 Verified |
| **Strictly Text-Only** | Evaluation adapter enforces text input/output/tools; rejects all multimodal/vision/audio invocations | 🟢 Verified |
| **Zero-Friction Auth** | Evaluator automatically receives authenticated access with zero signup or database hurdles | 🟢 Verified |
| **Clean Reproducibility** | Clean clone -> `make setup` -> `make run` works out of the box; dependencies pinned | 🟢 Verified |
| **Zero Committed Secrets** | Audited; zero API keys, tokens, or credentials committed to git | 🟢 Verified |
| **Responsive UI** | Tested across 390px, 430px, 768px, 1024px, 1440px with zero horizontal overflow | 🟢 Verified |
| **Light & Dark Mode** | Semantic design system with Light, Dark, and System theme support | 🟢 Verified |
| **IDE-Grade Settings** | 12 categorized configuration domains with search & progressive disclosure | 🟢 Verified |

---

## 🏛 Architecture: Product Mode vs. Evaluation Mode

FORGE maintains an explicit architectural boundary between commercial product capabilities and strict hackathon evaluation:

```
                          FORGE CORE
                              │
               ┌──────────────┴──────────────┐
               │                             │
         PRODUCT MODE                 EVALUATION MODE
               │                             │
         Model Router                 PRESCRIBED MODEL
               │                             │
    Qwen / Kimi / GLM / Grok / etc.          │
               │                             │
        User BYOK / Tier                     ▼
                                         AI_API_KEY
                                             │
                                      Text-Only Adapter
                                             │
                                   Harness Execution Loop
                                             │
                                      Cryptographic Proof
```

### Evaluation Mode (`FORGE_EVALUATION_MODE=true` or `AI_API_KEY` present)
- **Model:** Strictly locked to the prescribed hackathon model (`FORGE_EVAL_MODEL`).
- **Modality:** Text input, text output, repository tools, terminal diagnostics.
- **Substitution:** Model switching and fallbacks are strictly disabled.
- **Banner:** Persistent unobtrusive banner confirming `EVALUATION MODE ACTIVE`.

### Product Mode
- **Dynamic Model Catalog:**
  - **Qwen3-Coder-Next** (Flagship open-weight 262k agentic coding)
  - **Kimi K2.5** (Multimodal agentic tool loop)
  - **GLM-5 MoE** (Deep algorithmic reasoning)
  - **DeepSeek V3 Coder** (Fast inference mathematical code repair)
  - **OpenRouter** (Meta Llama 3.3 70B & Qwen 2.5 Coder 32B via public pool)
  - **xAI Grok 2 Coder & Grok 3 Hybrid Reasoning** (Frontier reasoning)
  - **Claude 3.7 Sonnet** (Hybrid reasoning token budgets)
  - **Local Ollama** (Completely air-gapped zero-data-egress execution)
- **Account & Entitlements:** Multi-tier quota management (`FREE`, `BUILDER`, `PRO`, `TEAM`).

---

## 🔄 Autonomous Execution Lifecycle (10-Stage Loop)

```
TASK ──► UNDERSTAND ──► PLAN ──► SEARCH ──► EDIT ──► RUN ──► DIAGNOSE ──► RECOVER ──► VERIFY ──► PROOF
```

1. **Intake:** Ingest issue description, target repository metadata, and reproduction criteria.
2. **Understand:** Multi-file AST symbol parsing and semantic dependency graph creation.
3. **Plan:** Deconstruct goal into verifiable sub-goals with test expectations.
4. **Search:** Targeted symbol lookup and grep indexing across relevant files only.
5. **Edit:** Apply precision line-level patches (minimizing churn and unwanted AST rewrites).
6. **Run:** Execute test suites inside sandboxed execution environment.
7. **Diagnose:** Parse compiler diagnostics, stderr traces, stack traces, and exit codes.
8. **Recover:** Formulate revised patch strategy; adjust timeouts, imports, or logic.
9. **Verify:** Run full test suite, regression invariants, and `tsc --noEmit` typecheck.
10. **Proof:** Seal run with SHA-256 cryptographic proof hash and Merkle verification tree.

---

## 💻 RepositoryAccess Abstraction (Web, Desktop, Evaluation)

The agent engine interacts with codebases through a unified `RepositoryAccess` interface:

```typescript
export interface RepositoryAccess {
  readonly id: 'browser' | 'desktop' | 'evaluation';
  readFile(filePath: string): Promise<string>;
  writeFile(filePath: string, content: string): Promise<void>;
  listFiles(dirPath?: string): Promise<FileEntry[]>;
  search(query: string, options?: { isRegex?: boolean }): Promise<SearchMatch[]>;
  runCommand(command: string, cwd?: string): Promise<CommandExecutionResult>;
  getGitStatus(): Promise<GitStatusResult>;
  getGitDiff(): Promise<string>;
}
```

- **`BrowserRepositoryAccess`:** Virtual in-memory file store + HTML5 FileSystem API.
- **`DesktopRepositoryAccess`:** Tauri v2 desktop IPC bridge connecting to local repositories on developer machines with audit logging.
- **`EvaluationRepositoryAccess`:** Headless Node.js filesystem and child process execution for standardized evaluation test suites.

---

## 🧪 Verification & Automated Testing

Run the automated compliance test suite:

```bash
make test
```

Tests verify:
1. `EvaluationModelAdapter` consumes `AI_API_KEY` and enforces text-only constraints.
2. Prescribed model lock activates during evaluation mode (rejecting model substitution).
3. `RepositoryAccess` abstraction reads, searches, and diffs cleanly.
4. Autonomous failure analysis and recovery plan generation.
5. Cryptographic proof and invariant verification (SHA-256 hash seal).
6. Zero hard-coded credentials committed in git repository.

---

## 🎨 UI & Responsive Design System

- **Responsive ForgeLine:**
  - **Desktop (≥ 768px):** Typographic horizontal stages `01 Task ✓ ──── 02 Understand ✓ ──── 03 Execute ● ──── 04 Verify ○ ──── 05 Proof ○` with connecting progress lines.
  - **Mobile (< 768px):** Compact `EXECUTE (Step 3 of 5)` progress bar with collapsible step drawer.
  - Zero horizontal overflow across all tested breakpoints (390px, 430px, 768px, 1024px, 1440px).
- **Themes:**
  - **Light Mode:** Warm white background (`#f8fafc`), graphite typography (`#0f172a`), subtle slate borders.
  - **Dark Mode:** Deep zinc/graphite (`#090a0d`), off-white typography (`#f4f5f7`), restrained forge flame accents. No neon purple or cyberpunk glow.
- **IDE Settings:**
  - 12 comprehensive categories: General, Appearance, Editor, AI & Models, Agent Policy, Repository, Terminal, Verification, Notifications, Privacy & Security, Account Profile, Billing.
  - Interactive search bar with instant progressive disclosure.

---

## 📄 License

MIT License — Built for the LCC × DevClub AI Coding Harness Hackathon.
