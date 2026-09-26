# ==============================================================================
# परिश्रम — Autonomous AI Coding Harness
# LCC × DevClub Hackathon Evaluation Standard Makefile
# ==============================================================================

SHELL := /bin/bash
.PHONY: all setup run test evaluate clean help

all: setup test

help:
	@echo "परिश्रम — Autonomous AI Coding Harness"
	@echo ""
	@echo "Standard Evaluation Targets:"
	@echo "  make setup     - Install dependencies and build project (clean reproduction)"
	@echo "  make run       - Launch परिश्रम application (consumes AI_API_KEY from environment)"
	@echo "  make test      - Run automated evaluation compliance & verification tests"
	@echo "  make evaluate  - Run headless CLI evaluation against prescribed test issue"
	@echo "  make clean     - Remove build artifacts and caches"
	@echo ""
	@echo "Evaluation Workflow:"
	@echo "  export AI_API_KEY=\"<PROVIDED_KEY>\""
	@echo "  make setup"
	@echo "  make run"

# 1. SETUP: Clean installation and project compilation
setup:
	@echo "==> Setting up परिश्रम dependencies..."
	npm ci || npm install
	@echo "==> Compiling परिश्रम Next.js production build..."
	npm run build

# 2. RUN: Start परिश्रम server in evaluation or product mode
run:
	@echo "==> Initializing परिश्रम AI Harness in Evaluation Mode..."
	@echo "    • AI_API_KEY: $${AI_API_KEY:+'Configured'} $${AI_API_KEY:-'Standby/Mock Evaluator Mode'}"
	@echo "    • AI_MODEL:   $${AI_MODEL:-'hackathon-prescribed-text-v1 (Locked Default)'}"
	@echo "    • Modality:   Strictly TEXT-ONLY (Zero multimodal)"
	@echo "    • Web UI:     http://localhost:3000 (Zero-click evaluator auto-auth)"
	@echo "    • API Run:    http://localhost:3000/api/evaluation/run"
	@echo "    • Headless:   make evaluate (Terminal-only CLI)"
	@echo ""
	@if [ -d ".next" ]; then \
		AI_API_KEY="$${AI_API_KEY}" AI_MODEL="$${AI_MODEL}" npm run start; \
	else \
		AI_API_KEY="$${AI_API_KEY}" AI_MODEL="$${AI_MODEL}" npm run dev; \
	fi

# 3. TEST: Automated compliance and harness verification suite
test:
	@echo "==> Running automated evaluation & verification suite..."
	AI_API_KEY="$${AI_API_KEY}" AI_MODEL="$${AI_MODEL}" npm test

# 4. EVALUATE: Headless CLI evaluation against prescribed test case
evaluate:
	@echo "==> Running headless autonomous evaluation harness..."
	AI_API_KEY="$${AI_API_KEY}" AI_MODEL="$${AI_MODEL}" npx tsx scripts/evaluate-harness.ts

# 5. SYNC: Fast-forward team rebase & verification helper
sync:
	@echo "==> Syncing branch with main..."
	git fetch origin
	git rebase origin/main
	npm test

# 6. CLEAN: Remove compilation caches and generated output
clean:
	@echo "==> Cleaning build artifacts..."
	rm -rf .next out build node_modules/.cache
