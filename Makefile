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
	@echo "==> Setting up FORGE dependencies..."
	npm ci || npm install
	@echo "==> Compiling FORGE Next.js production build..."
	npm run build

# 2. RUN: Start FORGE server in evaluation or product mode
run:
	@echo "==> Starting FORGE Harness (AI_API_KEY: $${AI_API_KEY:0:4}...$${AI_API_KEY: -4})..."
	@if [ -d ".next" ]; then \
		npm run start; \
	else \
		npm run dev; \
	fi

# 3. TEST: Automated compliance and harness verification suite
test:
	@echo "==> Running automated evaluation & verification suite..."
	npm test

# 4. EVALUATE: Headless CLI evaluation against prescribed test case
evaluate:
	@echo "==> Running headless autonomous evaluation harness..."
	npx tsx scripts/evaluate-harness.ts

# 5. CLEAN: Remove compilation caches and generated output
clean:
	@echo "==> Cleaning build artifacts..."
	rm -rf .next out build node_modules/.cache
