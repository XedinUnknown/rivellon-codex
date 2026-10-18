# Rivellon Codex. `make help` lists the targets.
-include .env
export

TARGET ?= all
DEV_PORT ?= 5173
NEXUS_XLSX ?= data/source/DOS2_DE_Eng.xlsx
INFO_XLSX ?= data/source/Divinity_ Original Sin 2 - Info (Shared).xlsx

# Larian's skill/status icons are extracted from your copy of the Nexus workbook, never committed. Builds depend on
# them only when the workbook is there; otherwise the app shows school-coloured badges instead.
NEXUS_ICONS := data/nexus-icons.json
SHEET_ICONS := $(if $(wildcard $(NEXUS_XLSX)),$(NEXUS_ICONS))
define no_icons_note
	$(if $(SHEET_ICONS),,@echo "note: $(NEXUS_XLSX) not found, so no skill/status icons (see data/source/README.md)")
endef

.PHONY: help setup dev build check lint format typecheck test e2e data data-nexus data-info icons clean

help: ## List targets
	@grep -E '^[a-z-]+:.*## ' Makefile | sed 's/:.*## /\t/' | expand -t 14

setup: ## Install dependencies and the test browser
	npm ci
	npx playwright install chromium

dev: $(SHEET_ICONS) ## Start the dev server on DEV_PORT (default 5173)
	$(no_icons_note)
	npx vite --port $(DEV_PORT)

build: $(SHEET_ICONS) ## Build: TARGET=single (one HTML file) | web (static site) | all (default)
	$(no_icons_note)
ifeq ($(TARGET),all)
	npm run build
else
	npm run build:$(TARGET)
endif

$(NEXUS_ICONS): $(NEXUS_XLSX)
	npm run data:nexus -- "$<" - "$@"

check: lint typecheck test ## Lint, typecheck and unit tests

lint: ## Lint and check formatting
	npx biome check .

format: ## Fix formatting and safe lint findings
	npx biome check --write .

typecheck: ## TypeScript, app and tooling
	npm run typecheck

test: ## Unit tests
	npm test

e2e: build ## End-to-end tests against both builds
	npx playwright test

data: data-nexus data-info ## Re-extract all data from the spreadsheets in data/source/

data-nexus: ## Nexus planner workbook -> data/nexus.json (+ the icons)
	npm run data:nexus -- "$(NEXUS_XLSX)" data/nexus.json $(NEXUS_ICONS)

data-info: ## Info (Shared) workbook -> data/ref/*.json
	npm run data:info -- "$(INFO_XLSX)" data/ref

icons: ## Game icon subset -> data/game-icons.json
	npm run data:icons

clean: ## Remove build and test output and the extracted icons
	rm -rf dist test-results playwright-report $(NEXUS_ICONS)
