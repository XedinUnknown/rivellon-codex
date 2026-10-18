# Rivellon Codex. `make help` lists the targets.
-include .env
export

TARGET ?= all
DEV_PORT ?= 5173

# Game data is extracted from your own copies of the source spreadsheets (see data/source/README.md) and never
# committed. Each output is rebuilt when its spreadsheet is newer; a missing spreadsheet means the build uses the
# hand-written sample in data/sample/ instead.
NEXUS_XLSX ?= data/source/DOS2_DE_Eng.xlsx
INFO_XLSX ?= data/source/DOS2_Info_Shared.xlsx
GEN := data/generated
NEXUS_OUT := $(GEN)/nexus.json $(GEN)/nexus-icons.json
REF_OUT := $(GEN)/ref/.stamp
DATA := $(if $(wildcard $(NEXUS_XLSX)),$(NEXUS_OUT)) $(if $(wildcard $(INFO_XLSX)),$(REF_OUT))

.PHONY: help setup dev build data check lint format typecheck test e2e icons clean

help: ## List targets
	@grep -E '^[a-z-]+:.*## ' Makefile | sed 's/:.*## /\t/' | expand -t 14

setup: ## Install dependencies and the test browser
	npm ci
	npx playwright install chromium

dev: data ## Start the dev server on DEV_PORT (default 5173)
	npx vite --port $(DEV_PORT)

build: data ## Build: TARGET=single (one HTML file) | web (static site) | all (default)
ifeq ($(TARGET),all)
	npm run build
else
	npm run build:$(TARGET)
endif

data: $(DATA) ## Extract game data from the spreadsheets in data/source/ (only what changed)
	$(if $(wildcard $(NEXUS_XLSX)),,@echo "note: $(NEXUS_XLSX) not found: using sample skills and statuses, no icons")
	$(if $(wildcard $(INFO_XLSX)),,@echo "note: $(INFO_XLSX) not found: using sample reference tables")

$(NEXUS_OUT) &: $(NEXUS_XLSX)
	npm run data:nexus -- $(NEXUS_XLSX) $(GEN)/nexus.json $(GEN)/nexus-icons.json

$(REF_OUT): $(INFO_XLSX)
	npm run data:info -- $(INFO_XLSX) $(GEN)/ref

check: lint typecheck test ## Lint, typecheck and unit tests

lint: ## Lint and check formatting
	npx biome check .

format: ## Fix formatting and safe lint findings
	npx biome check --write .

typecheck: ## TypeScript, app and tooling
	npm run typecheck

test: ## Unit tests
	npm test

e2e: ## End-to-end tests against both builds, made with the sample data
	CODEX_DATA=sample npm run build
	CODEX_DATA=sample npx playwright test

icons: ## Game icon subset -> data/game-icons.json (open-licensed, committed)
	npm run data:icons

clean: ## Remove build and test output and the extracted data
	rm -rf dist test-results playwright-report $(GEN)
