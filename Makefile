.PHONY: help setup lint lint-backend lint-frontend \
        format format-backend format-frontend format-check \
        test test-backend test-frontend test-e2e \
        coverage coverage-backend coverage-frontend \
        docker-up docker-down docker-build

BACKEND_DIR  := backend
FRONTEND_DIR := frontend

# ── Help ──────────────────────────────────────────────────────────────────────

help: ## Show this help message
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage: make \033[36m<target>\033[0m\n\nTargets:\n"} \
	      /^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-22s\033[0m %s\n", $$1, $$2 }' $(MAKEFILE_LIST)
	@echo ""

# ── Setup ─────────────────────────────────────────────────────────────────────

setup: ## Install all dependencies (backend gems + frontend packages)
	cd $(BACKEND_DIR) && bundle install
	cd $(FRONTEND_DIR) && npm install

# ── Lint ──────────────────────────────────────────────────────────────────────

lint: lint-backend lint-frontend ## Run all linters (RuboCop + ESLint)

lint-backend: ## Run RuboCop (treats all offenses as errors)
	cd $(BACKEND_DIR) && bundle exec rubocop

lint-frontend: ## Run ESLint with --max-warnings 0
	cd $(FRONTEND_DIR) && npm run lint

# ── Format ────────────────────────────────────────────────────────────────────

format: format-backend format-frontend ## Auto-format all code

format-backend: ## Run RuboCop --autocorrect on backend
	cd $(BACKEND_DIR) && bundle exec rubocop --autocorrect

format-frontend: ## Run Prettier --write on frontend
	cd $(FRONTEND_DIR) && npm run format

format-check: ## Verify formatting without writing (use in CI)
	cd $(BACKEND_DIR) && bundle exec rubocop --format progress
	cd $(FRONTEND_DIR) && npm run format:check

# ── Test ──────────────────────────────────────────────────────────────────────

test: test-backend test-frontend ## Run all unit/integration tests

test-backend: ## Run RSpec
	cd $(BACKEND_DIR) && bundle exec rspec

test-frontend: ## Run Jest
	cd $(FRONTEND_DIR) && npm test -- --passWithNoTests

test-e2e: ## Run Playwright E2E tests
	cd $(FRONTEND_DIR) && npm run test:e2e

# ── Coverage ──────────────────────────────────────────────────────────────────

coverage: coverage-backend coverage-frontend ## Generate test coverage reports

coverage-backend: ## Run RSpec and open SimpleCov HTML report
	cd $(BACKEND_DIR) && bundle exec rspec
	@echo "Coverage report: $(BACKEND_DIR)/coverage/index.html"

coverage-frontend: ## Run Jest with coverage
	cd $(FRONTEND_DIR) && npm run test:coverage
	@echo "Coverage report: $(FRONTEND_DIR)/coverage/lcov-report/index.html"

# ── Docker ────────────────────────────────────────────────────────────────────

docker-build: ## Build all Docker images
	docker compose build

docker-up: ## Start all services (db + backend + frontend)
	docker compose up -d

docker-down: ## Stop all services
	docker compose down

docker-logs: ## Tail logs from all services
	docker compose logs -f
