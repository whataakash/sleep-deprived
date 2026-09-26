# परिश्रम — Autonomous AI Coding-Agent Harness

> **"Build it. Test it. Prove it."**  
> An autonomous coding harness engineered for the **LCC × DevClub AI Coding Harness Hackathon**.

**परिश्रम (PARISHRAM)** transforms raw foundation models into verified software engineers. Rather than acting as a conversational code assistant that guesses fixes, परिश्रम operates as a closed-loop execution harness: **orchestrating tools, managing context, analyzing failure traces, executing targeted recoveries, and generating cryptographic proof of verification.**

- 📖 **[Feature Specification & Architecture](feature.md)**
- 🎨 **[Design System & Visual Language](design.md)**

---

## ⚡ Standard Evaluator Workflow (P0 Compliance)

The repository provides a standard root `Makefile` adhering strictly to official hackathon evaluation guidelines. The evaluation workflow requires **zero signup, zero login, and zero UI API key entry**.

```bash
# 1. Provide the evaluation API key
export AI_API_KEY="<YOUR_EVALUATION_API_KEY>"

# 2. Setup dependencies and compile production build from clean clone
make setup

# 3. Launch परिश्रम application (evaluation mode automatically active)
make run

# 4. Run automated evaluation compliance & verification test suite
make test

# 5. (Optional) Run headless CLI evaluation against prescribed test case
make evaluate
```

---

## 📋 Evaluation Compliance Matrix

| Requirement | परिश्रम Specification | Status |
|---|---|---|
| **Root Makefile** | Exposes `make setup`, `make run`, `make test`, `make evaluate`, `make clean` | 🟢 Verified |
| **`AI_API_KEY` Support** | Consumes `process.env.AI_API_KEY` directly; zero manual UI key entry | 🟢 Verified |
| **Prescribed Model Lock** | In evaluation mode, locks to `hackathon-prescribed-text-v1` (or `PARISHRAM_EVAL_MODEL`); model substitution & fallback disabled | 🟢 Verified |
| **Strictly Text-Only** | Evaluation adapter enforces text input/output/tools; rejects all multimodal/vision/audio invocations | 🟢 Verified |
| **Zero-Friction Auth** | Evaluator automatically receives authenticated access with zero signup or database hurdles | 🟢 Verified |
| **Clean Reproducibility** | Clean clone -> `make setup` -> `make run` works out of the box; dependencies pinned | 🟢 Verified |
| **Zero Committed Secrets** | Audited; zero API keys, tokens, or credentials committed to git | 🟢 Verified |
| **Responsive UI** | Tested across 390px, 430px, 768px, 1024px, 1440px with zero horizontal overflow | 🟢 Verified |
| **Light & Dark Mode** | Semantic design system with Light, Dark, and System theme support | 🟢 Verified |
| **IDE-Grade Settings** | 12 categorized configuration domains with search & progressive disclosure | 🟢 Verified |

---

## 🏛 Architecture: Product Mode vs. Evaluation Mode

परिश्रम maintains an explicit architectural boundary between commercial product capabilities and strict hackathon evaluation:

```
                         PARISHRAM CORE
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

### Evaluation Mode (`PARISHRAM_EVALUATION_MODE=true` or `AI_API_KEY` present)
- **Model:** Strictly locked to the prescribed hackathon model (`PARISHRAM_EVAL_MODEL` or default `hackathon-prescribed-text-v1`).
- **Modality:** Text input, text output, repository tools, terminal diagnostics.
- **Substitution:** Model switching and fallbacks are strictly disabled.
- **Banner:** Persistent unobtrusive banner confirming `EVALUATION MODE (LOCKED)`.
- **Paywalls Bypassed:** Zero friction; no payment or account required.

### Product Mode
- **Dynamic 2026 Model Catalog:**
  - **Qwen3-Coder-Next** (Flagship open-weight 262k agentic coding)
  - **Kimi K2.5** (Multimodal agentic tool loop)
  - **GLM-5 MoE** (Deep algorithmic reasoning)
  - **DeepSeek V3 Coder** (Fast inference mathematical code repair)
  - **OpenRouter** (Meta Llama 3.3 70B & Qwen 2.5 Coder 32B via public pool)
  - **xAI Grok 2 Coder & Grok 3 Hybrid Reasoning** (Frontier reasoning)
  - **Claude 3.7 Sonnet** (Hybrid reasoning token budgets)
  - **Local Ollama** (Completely air-gapped zero-data-egress execution)
- **Hindi Identity Subscription Plans:**
  - **आरम्भ** (Starter) — Free tier, 25 verified runs/mo
  - **प्रगति** (Builder) — ₹2,499/mo, 150 verified runs/mo
  - **प्रवीण** (Professional) — ₹6,999/mo, 500 verified runs/mo
  - **दल** (Team) — ₹16,999/mo, unlimited verified runs
- **Payment Architecture:**
  - Official hosted/sandbox checkout routed server-side to verified merchant: `shivansh.p@fam`.
  - Cryptographic server-side verification with zero custom card forms on Parishram UI.

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
10. **Proof (`VERIFIED ✓`):** Seal run with SHA-256 cryptographic proof hash and Merkle verification tree.

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
5. Cryptographic proof and invariant verification (SHA-256 hash seal, `VERIFIED ✓`).
6. Zero hard-coded credentials committed in git repository.

---

## 🎨 UI & Responsive Design System

- **Responsive Parishram Path:**
  - **Desktop (≥ 1024px):** Typographic horizontal stages `01 TASK ──── 02 UNDERSTAND ──── 03 EXECUTE ──── 04 VERIFY ──── 05 PROOF` with status indicators.
  - **Tablet (768px – 1023px):** Compact horizontal stepper (`1. Task`, `2. Context`, `3. Execute`, etc.).
  - **Mobile (< 768px):** Compact `EXECUTE · Step 3 of 5` progress bar with collapsible step drawer.
  - Zero horizontal overflow across all tested viewports (390px, 430px, 768px, 1024px, 1440px).
- **Themes (Light, Dark, System):**
  - **Light Mode:** Warm white canvas (`#f6f8fa`), pure white panels (`#ffffff`), crisp borders (`#d0d7de`), graphite text (`#1f2328`).
  - **Dark Mode:** Deep technical zinc (`#090a0d`), charcoal panels (`#111418`), technical borders (`#232a32`), flame accents (`#ea580c`).
  - **System Mode:** Seamless automatic synchronization with OS preferences via `prefers-color-scheme`.
- **IDE Settings & Billing:**
  - 12 comprehensive categories: General, Appearance, Editor, AI & Models, Agent Policy, Repository, Terminal, Verification, Notifications, Privacy & Security, Account Profile, Plan & Billing.
  - Interactive search bar with instant progressive disclosure.
- **Authentic Subscription & Upgrade Flow:**
  - **Authentic Hindi Tiers:** **आरम्भ** (Starter, ₹0), **प्रगति** (Builder, ₹999/mo or ₹799/mo yearly, Save 20%), **प्रवीण** (Professional, ₹2,499/mo), and **दल** (Team, ₹4,999/mo).
  - **Dynamic Theme Invariance:** Modal and checkout flow dynamically respond to Light and Dark mode switching using semantic CSS variables.
  - **Minimalist Dashboard Placements:** Subtle topbar indicator (`आरम्भ · Upgrade ↗`) and clean link near the left account section in the sidebar.
  - **2-Column Indian GST Checkout:** Subtotal, 18% GST calculation, auto-renewal terms, and instant UPI handoff to `shivansh.p@fam`.

---

## 📄 License

MIT License — Built for the LCC × DevClub AI Coding Harness Hackathon.
