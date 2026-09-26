# परिश्रम (PARISHRAM) — Design System & Visual Architecture

> **A technical, editorial, and developer-first design language designed for clarity, high information density, and deterministic engineering confidence.**

---

## 1. Design Philosophy: The Anti-AI-Slop Principle

Modern AI interfaces have fallen into a trap of generic templates: neon purple gradients, glowing cyberpunk borders, arbitrary sparkle icons, floating decorative blobs, and oversized rounded pill buttons.

**परिश्रम rejects these clichés completely.**

### Core Tenets:
1. **Developer-First Precision:** High information density, monospace-first metrics, subtle borders, and intentional whitespace.
2. **Subtle Indian/Hindi Heritage:** The product wordmark (`परिश्रम`) and subscription plan tiers (`आरम्भ`, `प्रगति`, `प्रवीण`, `दल`) introduce an intentional cultural identity, while technical developer concepts (Repository, Diffs, Proofs, Tests, Terminal) remain in standard English.
3. **Glass-Box Observability:** The UI never conceals what the agent is doing. Every AST search, test execution, error stack trace, and git patch is inspectable and verifiable.
4. **Restrained Color & Contrast:** Colors carry strict semantic meaning (Flame for active work, Green for verified proof, Amber for diagnostics, Red for failure). No decorative rainbow gradients.

---

## 2. Root-Cause Semantic Theme System

The design system is powered by semantic CSS custom properties defined in `src/app/globals.css`. Both Light and Dark modes are intentionally designed from scratch rather than mathematically inverted.

```
       LIGHT MODE                           DARK MODE
  Editorial White & Graphite            Technical Zinc & Flame
┌─────────────────────────────┐       ┌─────────────────────────────┐
│ Canvas: #f6f8fa             │       │ Canvas: #090a0d             │
│ Panel:  #ffffff             │       │ Panel:  #111418             │
│ Border: #d0d7de             │       │ Border: #232a32             │
│ Text:   #1f2328             │       │ Text:   #f4f5f7             │
│ Accent: #ea580c (Flame)     │       │ Accent: #ea580c (Flame)     │
└─────────────────────────────┘       └─────────────────────────────┘
```

### Semantic Token Architecture:

| CSS Variable | Light Theme | Dark Theme | Purpose |
|---|---|---|---|
| `--bg-canvas` | `#f6f8fa` (Warm gray) | `#090a0d` (Deep zinc) | Primary workspace canvas |
| `--bg-panel` | `#ffffff` (Pure white) | `#111418` (Obsidian) | Elevated cards, sidebars, panes |
| `--bg-elevated` | `#f0f2f5` (Cool gray) | `#181d24` (Charcoal) | Input boxes, headers, table rows |
| `--bg-subtle` | `#e8ecf1` (Subtle tint) | `#1f262f` (Subtle tint) | Hover states, inactive tabs |
| `--bg-active` | `#dfe5ec` (Active tint) | `#27313d` (Active tint) | Pressed elements, active tabs |
| `--border-subtle` | `#d0d7de` (Definite crisp) | `#232a32` (Deep technical) | Card borders, dividers, grids |
| `--border-medium` | `#afb8c1` (Prominent) | `#353f4c` (Prominent) | Selected borders, focus rings |
| `--text-primary` | `#1f2328` (Graphite) | `#f4f5f7` (Crisp white) | Headings, primary code, labels |
| `--text-secondary`| `#57606a` (Medium slate) | `#8b949e` (Cool gray) | Descriptions, explanations |
| `--text-muted` | `#8c959f` (Muted gray) | `#5b6573` (Dim gray) | Timestamps, metadata, hints |

### Status Accents:
- **Brand Flame:** `#ea580c` (Hover `#f97316`) — Represents active agent synthesis, Parishram State, and primary actions.
- **Verification Emerald:** `#10b981` (Tints `rgba(16, 185, 129, 0.12)`) — Represents passing tests, verified proofs, and zero regressions.
- **Diagnostic Amber:** `#fbbf24` / `#f59e0b` — Represents runtime warnings and recovery in progress.
- **Failure Crimson:** `#ef4444` — Represents unhandled exceptions and test failures.
- **Context Cyan:** `#38bdf8` — Represents AST symbols, token limits, and repository files.
- **Intelligence Violet:** `#a78bfa` — Represents model parameters, reasoning metrics, and settings.

### Centralized Theme Inheritance:
All dialogs, modals (`CheckoutModal`, `AccountCenter`, `DownloadModal`), drawers (`TerminalDrawer`, `WhyDrawer`), tooltips, and code viewers inherit directly from `data-theme` on the root document. Hardcoded hex colors (`bg-[#101318]`, `text-white`) have been replaced with semantic CSS tokens to ensure 100% theme fidelity.

---

## 3. Typography & Hierarchy

### Font Families:
- **Monospace Stack:** `ui-monospace, SFMono-Regular, "JetBrains Mono", Menlo, Monaco, Consolas, monospace`  
  Used for all code snippets, diffs, terminal streams, metrics, hashes, and navigation labels.
- **Sans-Serif Stack:** `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", Helvetica, Arial, sans-serif`  
  Used for documentation, issue descriptions, recovery rationales, and conversational summaries.

### Typography Scale:
- **Brand Title (`परिश्रम`):** `text-base sm:text-lg font-black tracking-tight`
- **View Headers (H1):** `text-lg sm:text-xl font-bold tracking-tight`
- **Section Headers (H2):** `text-sm sm:text-base font-semibold`
- **Card Titles:** `text-xs sm:text-sm font-bold`
- **Body Text:** `text-xs leading-relaxed font-sans`
- **Code & File Paths:** `text-xs font-mono font-medium`
- **Micro Labels / Badges:** `text-[10px] sm:text-[11px] font-mono uppercase tracking-wider font-bold`

---

## 4. Professional Button & Component System

Buttons avoid bloated SaaS bubbles and oversized pills. Every button adheres to strict engineering hierarchy:

### Button Classes:
1. **Primary Button:**
   - Class: `bg-[#ea580c] hover:bg-[#f97316] text-white font-semibold text-xs px-3.5 py-1.5 rounded-md shadow-xs active:scale-[0.98]`
   - Usage: "Run Demo", "Continue to Secure Checkout", "Apply Fix".
2. **Secondary Button:**
   - Class: `bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] text-[var(--text-primary)] border border-[var(--border-subtle)] text-xs px-3 py-1.5 rounded-md`
   - Usage: "Proof Graph", "Diff View", "Change Plan", "Settings".
3. **Ghost / Tertiary Button:**
   - Class: `text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] p-1.5 rounded text-xs`
   - Usage: Close icons, theme toggles, search triggers.
4. **Destructive Button:**
   - Class: `text-[#ef4444] hover:bg-[#ef4444]/10 border border-[#ef4444]/30 px-3 py-1.5 rounded-md text-xs font-semibold`
   - Usage: "Reset Demo", "Delete Fact", "Cancel Session".

### States Enforced on Every Button:
- `hover`: Distinct contrast enhancement.
- `focus-visible`: 2px focus ring (`ring-1 ring-[#ea580c]`).
- `active`: Micro-scale depression (`active:scale-[0.98]`).
- `disabled`: Muted background, opacity 50%, `cursor-not-allowed`.
- `loading`: Subtle embedded SVG spinner (`animate-spin`).

---

## 5. Responsive Layout Architecture

The application is thoroughly audited across five primary breakpoints:
- **Mobile (390px – 430px):** Single-column layout. Topbar collapses actions into the user avatar dropdown; Parishram Path shows the active step with a percentage bar and collapsible step drawer; panels stack vertically.
- **Tablet (768px – 1023px):** Compact horizontal stepper for Parishram Path; sidebar retains icons and titles.
- **Desktop (1024px – 1280px):** 5-stage Parishram Path with full connecting lines; dual-pane view for Run status and Code/Proof inspector.
- **Wide Desktop (1440px+):** Full multi-pane IDE layout with concurrent file explorer, diff viewer, and real-time terminal drawer.

---

## 6. Motion & Animation Philosophy

Animations are built on `motion/react` with strict adherence to accessibility standards:

- **Reduced Motion:** Configured with `<MotionConfig reducedMotion="user">` to automatically disable transitions for users with `prefers-reduced-motion: reduce`.
- **Purposeful Transitions Only:**
  - Modal appearance: Micro scale-up (`scale-[0.98] → scale-1`) with fade-in over 150ms.
  - Drawers: Smooth slide-in from bottom or right over 200ms with ease-out curve.
  - Progress bar: Width tweening over 300ms.
  - Accordion: Height and opacity interpolation with `AnimatePresence`.
- **Zero AI Gimmicks:** No bouncing robots, no floating particle canvases, and no infinite pulsating borders.

---

## 7. Editorial Pricing & Upgrade Modal Design System

Inspired by world-class software interfaces (Claude / Anthropic), the subscription and upgrade modal embodies an editorial, high-trust visual language:

### Step 1: "Plans that grow with you" (Plans Comparison Grid)
- **Typography:** Refined editorial serif title (`"Plans that grow with you"`) paired with crisp sans-serif feature bullets.
- **Segmented Audience Pill:** Centered toggle `[ Individual | Team and Enterprise ]` with smooth pill background transition.
- **Card Hierarchy:**
  - Standard cards have subtle `[var(--border-subtle)]` borders and muted badge elements.
  - The **Pro (Hero)** card is bordered with `[var(--border-medium)]`, features an interactive Monthly/Yearly toggle with an emerald `"Save 17%"` badge, and a high-contrast solid white primary CTA (`"Get Pro plan"`).
  - Micro-reassurance copy: `"No commitment · Cancel anytime"` placed directly under primary buttons.

### Step 2: "Configure your plan" (2-Column Checkout)
- **2-Column Asymmetric Layout:**
  - Left Column (60%): Interactive radio billing selector with active border state, comprehensive billing details (GSTIN, Company name, Street Address), and official payment tabs.
  - Right Column (40%): Sticky Order Summary card featuring serif `Pro plan` header, clean subtotal breakdown (`₹2,033.05` + `18% GST ₹365.95` = `₹2,399.00`), auto-renewal terms notice, and agreement checkbox.
- **Verified Payment Handoff:**
  - Seamless instant UPI payment to verified recipient `shivansh.p@fam`.
  - Zero custom card forms or raw credential harvesting.

