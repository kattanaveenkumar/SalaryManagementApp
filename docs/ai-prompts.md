# AI Prompts & Tool Usage

This document records how AI tools were used in building this system.
It demonstrates intentional, structured AI usage rather than blind generation.

---

## Approach

AI was used as a **staff-level pair programmer**, not a code generator.
Every output was reviewed for correctness, security, and alignment with requirements.

The development was structured in explicit phases — each phase was approved before the next
began. This ensured the AI could not race ahead and generate code that wasn't thought through.

---

## Phase 0 — Thinking (No Code)

**Prompt intent:** Force structured analysis before any implementation.

Key questions asked:
- What are the performance risks at 10k scale?
- What aggregation patterns will insight queries use?
- Why PostgreSQL over SQLite?
- What are the measurable success criteria?

**Human decision made here:** PostgreSQL over SQLite (for `PERCENTILE_CONT` support),
Rails 7 API mode, Next.js 14 frontend.

---

## Phase 1 — Architecture

**Prompt intent:** Define the full system before writing any file.

Outputs reviewed:
- Layer responsibilities (controller → service → model)
- Index strategy per query pattern
- Docker networking topology (service name routing, not localhost)
- API surface design

**Human decision made here:** Single `InsightsController` (not 4 separate controllers),
`scope "/insights"` routing pattern, `Result` struct pattern for service return values.

---

## Phase 2 — Data Model

**Prompt intent:** Justify every field, every index, every constraint.

Outputs reviewed:
- `decimal(12, 2)` for salary (not float — avoids IEEE 754 rounding in financial data)
- Composite indexes `(country, salary)` and `(country, job_title, salary)` for covering scans
- Salary validation bounds `[20_000, 500_000]` — realistic global range
- 155 × 160 name corpus = 24,800 unique combinations

---

## Phase 3 — Seed Script

**Prompt intent:** Performance-critical implementation, not just "make it work."

Outputs reviewed:
- `insert_all` in batches of 1,000 (10 round-trips vs 10,000)
- `Random.new(42)` — fixed seed for deterministic, reproducible data
- Idempotency guard: `if Employee.count >= SEED_COUNT` → skip
- Partial-run recovery: `Employee.delete_all` before reseeding

---

## Phase 4 — Insights Engine

**Prompt intent:** SQL-first aggregation, no in-memory computation.

Outputs reviewed:
- `PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY salary)` — exact percentiles, not approximate
- `exec_query` for raw SQL, ActiveRecord scope chains for parameterized queries
- `scope.where(country: country)` for safe parameterization (no string interpolation)
- `top_earners` limit clamped to `[1, 100]` in the controller (injection guard)

---

## Phase 5 — API Design

**Prompt intent:** Clean REST API with proper status codes and strong params.

Outputs reviewed:
- Strong params via `params.require(:employee).permit(...)` — no mass assignment
- `per_page` clamped to `[1, 100]` server-side — clients cannot request all 10k rows
- `head :no_content` for DELETE (no body, 204 status)
- `rescue_from` in ApplicationController handles 404/400 uniformly

---

## Phase 6 — Frontend

**Prompt intent:** Build a production-grade Next.js 14 UI using the established API surface, not a demo.

Outputs reviewed:
- `useEmployees` / `useInsights` hooks with cancellation tokens (`cancelled` flag) — prevents state updates on unmounted components
- `employeeApi` / `insightsApi` service layer — single `request<T>()` function centralises error handling and JSON decoding
- `EmployeeForm` — controlled inputs, submit-lock during async, error display from API response
- `EmployeeFilters` — debounce-free design; user presses Apply or Enter (appropriate for a data tool, not a search box)
- All insight components receive typed props and render currency via `formatCurrency` (shared `Intl.NumberFormat` instance)
- `Pagination` — computes `start/end` from `meta`, disables Prev/Next at boundaries

**Human decision made here:** Client-side country filter in `JobTitleInsights` (instant, no extra API call — data already loaded); standalone `LoadingSpinner` and `ErrorBanner` as shared primitives rather than inline states.

---

## Phase 7 — Tests

**Prompt intent:** Full test coverage with no mocking of the database (backend) and no real network calls (frontend).

Backend (109 examples, 100% line coverage):
- `spec/models/employee_spec.rb` — Shoulda matchers for every validation + scope behaviour
- `spec/serializers/employee_serializer_spec.rb` — field shape, Float type, ISO 8601 timestamps
- `spec/services/employees/{create,update,list}_service_spec.rb` — success/failure results, pagination caps
- `spec/services/insights/salary_insights_service_spec.rb` — all 4 aggregation methods with real SQL against test DB
- `spec/requests/health_spec.rb` — smoke test
- `spec/requests/api/v1/{employees,insights}_spec.rb` — full request cycle: filters, pagination, 404s, 422s

Frontend (88 tests, 15 suites):
- `lib/format.test.ts` — currency formatting edge cases
- `services/api.test.ts` — fetch mock verifies URL construction, method, body, error parsing
- `hooks/useEmployees.test.ts` / `useInsights.test.ts` — mock API, verify loading→data→error state transitions
- All 10 components tested for render, user interaction, and accessibility attributes

**Bug found and fixed:** `ROUND(PERCENTILE_CONT(...)::numeric, 2)` — PostgreSQL 12 lacks `ROUND(double precision, integer)`; explicit `::numeric` cast required. The test suite caught this before any human noticed.

**Environment issues resolved:**
- `@next/swc` native binary causes SIGBUS on this CPU; Jest config switched to `babel-jest` with Next.js bundled presets
- Ruby 3.2.2 installed via RVM; postgres user password set to match `database.yml` defaults

---

## Phase 8 — Docker / Deployment

**Prompt intent:** Zero-step startup — `docker compose up --build` is the complete workflow.

Outputs reviewed:
- `backend/Dockerfile` — two-stage build (gem install → stripped runtime image); non-root `rails` user; alpine base for minimal attack surface
- `docker-compose.yml` — three services (db, backend, frontend) with explicit `depends_on` health checks; named volume `pg_data` persists data across restarts
- `frontend/Dockerfile` — updated `NEXT_PUBLIC_API_URL` to empty and added `BACKEND_URL` build arg; browser fetches use relative paths, Next.js server proxies them to the backend Docker service name
- `frontend/next.config.js` — added `rewrites()` block: `/api/*` and `/health` proxied server-side to `BACKEND_URL` (defaulting to `http://localhost:3000` for local dev)
- `.dockerignore` files for both services — exclude test files, coverage, and local artefacts from the build context

**Key architectural decision:** Client-side fetches cannot resolve `http://backend:3000` because the browser has no access to Docker's internal DNS. Instead of exposing a hardcoded `localhost` URL as a build-time constant (brittle), the frontend proxies all `/api/*` traffic through the Next.js standalone server, which runs inside the Docker network and can resolve `backend` by service name.

**Human decision made here:** Named volume over bind-mount for Postgres data (survives `docker compose down`, discarded only on `docker compose down -v`). `SECRET_KEY_BASE` defaults to a placeholder string with an explicit comment to replace in production — not silently generating one at runtime.

---

## What Was NOT Delegated to AI

- Technology selection (PostgreSQL, Rails, Next.js) — human decision
- Index strategy — human reviewed against actual query patterns
- Salary validation bounds — human decided ($20k–$500k realistic range)
- Security review of all user input handling — human verified
- Final commit message wording — human written

---

## Code Review Process

Every file generated was reviewed for:
1. Security (no string interpolation in SQL, strong params in controllers)
2. Correctness (RuboCop compliance before accepting)
3. Alignment with the architecture decisions from Phase 1
4. Test coverage implications
