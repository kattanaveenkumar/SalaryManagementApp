# AI-Assisted Development Log

This document records how Claude was used as a structured pair programming tool across the development of this system. It is not a chronological diary — it is organised by logical phase, the order a thoughtful engineer would plan the work, not necessarily the order every line was typed.

---

## Approach

Claude was used as a **staff-level pair programmer**, not a code generator. Each phase had a clear prompt intent. Every output was reviewed for correctness, security, and architectural alignment before acceptance. No phase began until the previous one was approved.

---

## Phase 0 — Problem Analysis & Success Criteria

**Prompt intent:** Force structured analysis before any implementation. No code until the problem is understood.

Key questions asked:
- What are the performance risks at 10k scale?
- What aggregation patterns will insight queries use?
- Why PostgreSQL over SQLite?
- What are the measurable success criteria?

**Human decisions made here:**
- PostgreSQL over SQLite — `PERCENTILE_CONT` (exact salary percentiles) is PostgreSQL-native; SQLite has no equivalent
- Rails 7 API mode + Next.js 14 frontend
- Target latencies: employee list < 50ms, insight aggregations < 30ms, seed < 5 seconds

---

## Phase 1 — Architecture & API Contract

**Prompt intent:** Design the full system topology and define the API surface *before* writing any implementation file. Changing architecture after code exists is expensive. Changing a contract document costs nothing.

Outputs reviewed:
- Layer responsibilities (controller → service → model — no business logic bleeds up or down)
- API surface: every endpoint, every query param, every status code agreed upfront
- Index strategy mapped to each query pattern before schema was written
- Docker networking topology (service name routing, not `localhost`)
- `rescue_from` strategy in `ApplicationController` for uniform 404/400 handling

**Human decisions made here:**
- Single `InsightsController` (not 4 separate controllers) with `scope "/insights"` routing
- `Result` struct pattern for service return values — explicit success/failure, no exceptions for expected cases
- `/api/v1/` versioning — future-proofs payroll integrations
- `per_page` clamped server-side to `[1, 100]` — clients cannot dump all rows in one request

---

## Phase 2 — Infrastructure & Developer Tooling

**Prompt intent:** Configure linting, formatting, coverage gates, and containers *before* writing production code — not as a cleanup step at the end. Code written without a linter is code that needs retroactive cleanup.

Outputs reviewed:
- `backend/.rubocop.yml` — `plugins:` format (not deprecated `require:`), rubocop-rspec 3.x, metric exclusions for service objects (AbcSize ≤ 50, MethodLength ≤ 45), frozen string literals enforced
- `frontend/.eslintrc.json` — `plugin:@typescript-eslint/recommended` + `eslint-config-prettier`, `@typescript-eslint/no-unused-vars` as error, `next lint --max-warnings 0`
- `frontend/.prettierrc` — 100-char width, double quotes, trailing commas, LF; `eslint-config-prettier` disables conflicting ESLint rules
- `backend/spec/rails_helper.rb` — SimpleCov with LcovFormatter + HTMLFormatter, `minimum_coverage 90`, filters exclude spec/, config/, db/
- `Makefile` — root-level targets: `lint`, `format`, `format-check`, `test`, `test-e2e`, `coverage`, `docker-*`; each documented with `##` for `make help`
- `docker-compose.yml` — three services (db, backend, frontend), explicit `depends_on: condition: service_healthy`, named volume `pg_data`
- `backend/Dockerfile` — two-stage Alpine build (gem install → stripped runtime), non-root `rails` user, `force_ruby_platform: true` for musl compatibility
- `frontend/next.config.js` — `rewrites()` block proxying `/api/*` to `BACKEND_URL` server-side

**Human decisions made here:**
- Prettier over EditorConfig — runtime-enforced, not a hint
- `format:check` as a separate CI-safe script that never writes
- SimpleCov minimum at 90, not 100 — defensive branches that are genuinely hard to reach shouldn't block the suite
- Named volume over bind-mount for Postgres data — survives `docker compose down`, discarded only on `docker compose down -v`
- `SECRET_KEY_BASE` defaults to a placeholder string with an explicit comment to replace — not silently generating one at runtime

---

## Phase 3 — Data Model

**Prompt intent:** Justify every field, every index, every constraint. The schema is the contract between the application and the database — mistakes here are expensive to reverse.

Outputs reviewed:
- `DECIMAL(12, 2)` for salary — `FLOAT` salary of $100,000 can round to $99,999.999 in aggregate queries; financial data requires exact representation
- Composite covering indexes `(country, salary)` and `(country, job_title, salary)` — PostgreSQL can satisfy `GROUP BY country + AVG(salary)` as an index-only scan with no heap access
- Salary validation bounds `[20_000, 600_000]` — realistic global range for a 10k-person org
- 155 × 160 name corpus = 24,800 unique combinations for deterministic seed variety
- Partial unique index on `work_email WHERE work_email IS NOT NULL` — enforces uniqueness without rejecting NULL
- `employment_status`, `employment_type`, `department`, `job_level`, `salary_band`, `currency` as frozen constant arrays — validation and frontend dropdown population from one source of truth

---

## Phase 4 — Authentication

**Prompt intent:** Build authentication as infrastructure, not an afterthought. Every protected endpoint depends on it. JWT approach means no session storage needed — the API stays stateless.

Outputs reviewed:
- `User` model with `has_secure_password` — bcrypt hashing, never store plaintext
- `before_save :downcase_email` — case-insensitive email handling at persistence, not at query time
- `Auth::TokenService.encode/decode` — JWT HS256 signed with `SECRET_KEY_BASE`, all token logic in one place
- `AuthController#login` — `user&.authenticate(password)` with deliberate constant-time `nil` check (no user enumeration via timing)
- `authenticate_user!` before-action in `ApplicationController` — a single gate that protects everything; auth endpoints use `skip_before_action`
- Role field (`hr_manager`, `admin`) embedded in JWT payload — no DB lookup per request for role checks

**Human decision made here:** Two roles only (`hr_manager`, `admin`) — RBAC can be extended but adding premature granularity is over-engineering for an assessment context.

---

## Phase 5 — Business Logic & Services

**Prompt intent:** All business logic lives in service objects. Controllers are routing logic only. SQL aggregations must happen at the database level — no in-memory GROUP BY in Ruby.

Outputs reviewed:

**Seed script:**
- `Employee.insert_all` in batches of 1,000 — 10 SQL round-trips instead of 10,000
- `Random.new(42)` — fixed seed for deterministic, reproducible data across every deploy
- Idempotency guard: `if Employee.count >= SEED_COUNT` → skip (safe to run on every container start)
- Partial-run recovery: `Employee.delete_all` before reseeding if count is low

**Insights service:**
- `PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY salary)` — exact percentiles, not approximated
- `ROUND(PERCENTILE_CONT(...)::numeric, 2)` — explicit `::numeric` cast required; PostgreSQL's `ROUND(double precision, integer)` overload is unavailable on older versions
- `exec_query` for raw SQL returning typed result sets; ActiveRecord scope chains for parameterised queries
- `scope.where(country: country)` — safe parameterisation, no string interpolation
- `top_earners` limit clamped to `[1, 100]` in the controller (not the service) — injection guard at the HTTP boundary

**Employee CRUD services (ListService, CreateService, UpdateService):**
- `Result = Struct.new(:success, :employee, :errors)` — explicit return type, no exceptions for expected failures
- `SORTABLE_COLUMNS` allowlist + `SORT_ORDERS` allowlist before any column name touches SQL
- `Kaminari` `.page(n).per(m)` — `per_page` clamped to `[1, 100]` before delegation
- `build_scope` accumulates `where` clauses conditionally — only active filters generate SQL predicates

---

## Phase 6 — Frontend

**Prompt intent:** Build a production-grade Next.js 14 UI that consumes the established API contract, not a CRUD demo.

Outputs reviewed:
- `useEmployees` / `useInsights` hooks with cancellation tokens (`cancelled` flag) — prevents `setState` on unmounted components
- `employeeApi` / `insightsApi` service layer — single `request<T>()` function centralises error handling, JSON decoding, and auth header injection
- `EmployeeForm` — controlled inputs, submit-lock during async (`submitting` state), error display directly from API response body
- `EmployeeFilters` — debounce-free; user presses Apply or Enter (appropriate for a data tool, not a search box)
- `EmployeeTable` — portal-based action menu (renders to `document.body`) to avoid z-index stacking context conflicts; position calculated via `getBoundingClientRect()`
- All insight components receive typed props and render currency via a shared `Intl.NumberFormat` instance
- `AppNav` — sticky header with active link detection via `usePathname`, profile dropdown, hidden on `/login` and `/signup`
- `AuthGuard` — wraps protected pages; redirects unauthenticated users to `/login` before render

**Human decisions made here:**
- Client-side country filter in `JobTitleInsights` — data already loaded, instant, no extra API call
- Standalone `LoadingSpinner` and `ErrorBanner` as shared primitives rather than repeated inline states
- `CompensIQ` as the product brand name in the nav — distinct from the generic system description in docs

---

## Phase 7 — Testing Strategy

**Prompt intent:** Tests should be written alongside each feature, not as a final pass. The test suite is the confidence mechanism for every refactor. No mocking of the database on the backend — the whole point of service-layer testing is to verify SQL correctness.

Backend (109 examples, ≥90% line coverage enforced by SimpleCov):
- `spec/models/employee_spec.rb` — Shoulda matchers for every validation and scope behaviour
- `spec/services/employees/{create,update,list}_service_spec.rb` — success/failure result branches, pagination caps, sort whitelist enforcement
- `spec/services/insights/salary_insights_service_spec.rb` — all aggregation methods against real SQL on the test database (no mocking)
- `spec/requests/api/v1/{employees,insights,auth}_spec.rb` — full request cycle: filters, pagination, 401s, 404s, 422s

Frontend (88 tests, 15 suites):
- `lib/format.test.ts` — currency formatting edge cases
- `services/api.test.ts` — fetch mock verifies URL construction, method, body, and error parsing
- `hooks/useEmployees.test.ts` / `useInsights.test.ts` — mock API, verify `loading → data → error` state transitions
- All 10 components tested for render, user interaction, and accessibility attributes

E2E (21 Playwright scenarios):
- `page.route()` intercepts all API calls — tests are fully deterministic with no Docker dependency
- Auth flow, employee CRUD, filter behaviour, and insights rendering all covered

**Bug caught by the test suite (not a human):** `ROUND(PERCENTILE_CONT(...)::numeric, 2)` — PostgreSQL lacks `ROUND(double precision, integer)` overload; the explicit `::numeric` cast was missing. The insight service spec caught this before any manual testing.

---

## Phase 8 — Performance Analysis

**Prompt intent:** Treat the built implementation as a black box. Identify every query, map it to its execution plan, and produce a prioritised improvement roadmap for 1M employees. Do not optimise prematurely — profile first, then decide.

Outputs reviewed:
- **Bottleneck #1:** `ILIKE '%term%'` on `full_name` / `work_email` — leading wildcard prevents B-tree index use; full sequential scan at any scale. Fix: `pg_trgm` GIN index (no Rails code change needed, just a migration)
- **Bottleneck #2:** `/company_kpis` fires 5 sequential `GROUP BY` queries. Fix: collapse to one query with `GROUPING SETS`
- **Bottleneck #3:** `PERCENTILE_CONT` requires in-memory sort; at 1M rows this may spill to disk if `work_mem` is low. Fix: materialized view refreshed on a schedule
- **Confirmed fast paths:** `top_earners` (index scan + early stop), `country_salaries` and `salary_percentiles` (composite covering indexes — index-only scans at any row count)
- Proposed: Redis caching (TTL 5 min for insight endpoints), PgBouncer connection pooling, read replica routing for analytics queries

**Human decision made here:** Proposals documented, not implemented — out of scope for this assessment. Prioritisation: P0 = `pg_trgm` + Redis (highest ROI, lowest risk); P3 = read replica (infrastructure change, needs DBA sign-off).

See [performance.md](performance.md) for the full query analysis and implementation roadmap.

---

## What Was NOT Delegated to AI

- Technology selection (PostgreSQL, Rails, Next.js) — human decision
- Index strategy — human reviewed against actual query patterns before any schema was written
- Salary validation bounds — human decided ($20k–$600k realistic global range)
- Security posture — human verified parameterised queries, strong params, auth boundaries
- Hiring signal decisions (what to document, what to cut) — human judgment

---

## Code Review Process

Every AI-generated file was reviewed for:
1. **Security** — no string interpolation in SQL, strong params on all mutations, whitelisted sort columns
2. **Correctness** — RuboCop compliance, TypeScript types, expected test behaviour
3. **Architectural alignment** — does this respect the layer boundaries defined in Phase 1?
4. **Test coverage implications** — does this path have a test? Should it?
