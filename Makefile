# ==============================================================================
# PARISHRAM — Autonomous AI Coding Harness
# LCC × DevClub Hackathon Evaluation Standard Makefile
# ==============================================================================

SHELL := /bin/bash
.PHONY: all setup run web test evaluate clean help

all: setup test

help:
	@echo "PARISHRAM — Autonomous AI Coding Harness"
	@echo ""
	@echo "Standard Evaluation Targets:"
	@echo "  make setup     - Install dependencies and build project (clean reproduction)"
	@echo "  make run       - Launch PARISHRAM Terminal User Interface (TUI) evaluation harness"
	@echo "  make web       - Launch Next.js Glass-Box Web Dashboard at http://localhost:3000"
	@echo "  make test      - Run automated evaluation compliance & verification tests"
	@echo "  make evaluate  - Run headless CLI evaluation against prescribed test issue"
	@echo "  make clean     - Remove build artifacts and caches"
	@echo ""
	@echo "Terminal Evaluation Workflow:"
	@echo "  export AI_API_KEY=\"<PROVIDED_KEY>\""
	@echo "  make setup"
	@echo "  make run"
	@echo ""
	@echo "Web Dashboard Workflow:"
	@echo "  make web"

# 1. SETUP: Clean installation and project compilation
setup:
	@echo "==> Setting up PARISHRAM dependencies..."
	npm ci || npm install
	@echo "==> Compiling PARISHRAM Next.js production build..."
	npm run build

# 2. RUN: Launch PARISHRAM AI Harness Terminal User Interface (TUI) & Evaluation CLI
run:
	@echo "==> Initializing PARISHRAM AI Harness Terminal Interface..."
	@AI_API_KEY="$${AI_API_KEY}" AI_MODEL="$${AI_MODEL}" ISSUE="$${ISSUE:-$(ISSUE)}" npx tsx scripts/terminal-harness.ts $(filter-out $@,$(MAKECMDGOALS)) $(ARGS)

# 2b. WEB: Launch Next.js Glass-Box Web Dashboard
web:
	@echo "==> Launching PARISHRAM Glass-Box Web Dashboard at http://localhost:3000..."
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

# Catch-all rule to allow arbitrary arguments passed to make run (e.g. make run "fix issue")
%:
	@:
