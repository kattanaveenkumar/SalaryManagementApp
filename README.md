# CompensIQ — Salary Management System

A full-stack HR platform for managing employee compensation across a 10,000-person organisation. Rails 7 API, Next.js 14 frontend, PostgreSQL 16 — containerised for zero-step local setup.

---

## Quick Start

```bash
git clone <repo>
cd SalaryManagementApp
docker compose up --build
```

| Service  | URL                   | Default credentials          |
|----------|-----------------------|------------------------------|
| Frontend | http://localhost:3001 | hr@incubyte.co / password123 |
| API      | http://localhost:3000 |                              |

> **Requires:** Docker Desktop ≥ 4.x (or Docker Engine + Compose plugin).

---

## Architecture

```
Browser
  │  (relative URLs — no hardcoded localhost)
  ▼
Next.js 14   :3001   →  rewrites /api/* server-side  →  Rails 7 API  :3000  →  PostgreSQL  :5432
                             (BACKEND_URL env var)           ↑
                                                      GET /health → 200 ok
```

The browser never calls the API directly. Next.js SSR rewrites `/api/*` to the backend Docker service name — so there's no `localhost` baked into the frontend build and the same image runs in every environment.

**Backend layers:**

```
Request
  ↓
ApplicationController          rescue_from: RecordNotFound, ParameterMissing
  ↓
EmployeesController            HTTP surface only — params, status codes, serialise
InsightsController             delegates 100% to SalaryInsightsService
AuthController                 JWT login / signup
  ↓
Employees::ListService         15 filter dimensions, sort whitelist, Kaminari pagination
Employees::CreateService       validate → persist → Result struct
Employees::UpdateService       validate → persist → Result struct
Insights::SalaryInsightsService  5 SQL aggregations — all computed at DB level
Auth::TokenService             JWT encode / decode (HS256, SECRET_KEY_BASE)
  ↓
Employee / User (ActiveRecord) validations, named scopes, no business logic
  ↓
PostgreSQL 16                  aggregation, covering indexes, index-only scans
```

---

## API

```
Auth
  POST /api/v1/auth/login    → 200 { token, user } | 401
  POST /api/v1/auth/signup   → 201 { token, user } | 422

Employees (JWT required)
  GET    /api/v1/employees       → paginated list; 15 filter params, sort, per_page (max 100)
  POST   /api/v1/employees       → 201 | 422
  GET    /api/v1/employees/:id   → 200 | 404
  PATCH  /api/v1/employees/:id   → 200 | 422 | 404
  DELETE /api/v1/employees/:id   → 204 | 404

Insights (JWT required)
  GET /api/v1/insights/company_kpis         headcount, payroll, dept/status/type breakdowns
  GET /api/v1/insights/country_salaries     min / max / avg per country
  GET /api/v1/insights/job_title_salaries   avg per job title  (?country=)
  GET /api/v1/insights/salary_percentiles   p25 / p50 / p75 / p90 per country
  GET /api/v1/insights/top_earners          top N by salary  (?limit=1–100)

Health
  GET /health → 200 { status: "ok" }
```

---

## Why These Decisions

**PostgreSQL over SQLite** — The assessment accepted SQLite. PostgreSQL was chosen because `PERCENTILE_CONT` (exact salary percentiles) requires it — SQLite has no equivalent. The cost is an extra Docker service. That's the right trade-off for an analytics-heavy HR tool.

**`DECIMAL(12,2)` for salary** — `FLOAT` salary of $100,000 can silently round to $99,999.999 in aggregate queries. Financial data needs exact representation.

**Covering indexes for insight queries** — `(country, salary)` and `(country, job_title, salary)` let PostgreSQL answer `GROUP BY country + AVG(salary)` as index-only scans with no heap access. At 10k rows this is fast; at 1M it stays fast.

**Service objects + `Result` structs** — Controllers are routing logic only. Services return `Result.new(success:, employee:, errors:)` — explicit, testable, no exceptions for expected validation failures.

**Offset pagination (not cursor)** — Cursor pagination is more correct under concurrent inserts but significantly harder to implement. For an HR tool where people browse pages, not stream a feed, offset is the right UX choice. `per_page` is clamped to `[1, 100]` server-side.

**Deterministic seed (`Random.new(42)`)** — Every fresh deploy produces the same 10,000 employees. Insight values are stable across environments, which matters for QA and demos.

**Versioned API (`/api/v1/`)** — Breaking changes can ship as `/api/v2/` without breaking existing payroll integrations.

---

## Testing & Quality

```bash
make test          # RSpec + Jest
make test-e2e      # 21 Playwright scenarios
make coverage      # HTML reports: backend/coverage/ + frontend/coverage/
make lint          # RuboCop + ESLint (zero warnings threshold)
make format-check  # Prettier check (CI-safe, no writes)
```

| Layer    | Framework  | Count | Coverage gate |
|----------|------------|-------|---------------|
| Backend  | RSpec      | 109 examples | ≥ 90% line (SimpleCov enforced) |
| Frontend | Jest       | 88 tests across 15 suites | — |
| E2E      | Playwright | 21 scenarios | — |

E2E tests use `page.route()` mocking — no Docker dependency, no flakiness from live API state.

---

## Local Development

### Docker (recommended)

```bash
# First run — builds images, creates DB, runs migrations, seeds 10k employees
docker compose up --build

# Subsequent runs (images already built)
docker compose up

# Stop — data volume preserved across restarts
docker compose down

# Stop and wipe the database (full reset)
docker compose down -v
```

```bash
# Useful one-liners inside a running stack
docker compose exec backend bin/rails console
docker compose exec backend bin/rails db:migrate
docker compose logs -f backend
```

**Makefile shortcuts:** `make docker-build`, `make docker-up`, `make docker-down`, `make docker-logs`

**Rebuilding one service after code changes:**

```bash
docker compose build backend && docker compose up -d backend
docker compose build frontend && docker compose up -d frontend
```

### Without Docker

Requires Ruby 3.2, Node 20, PostgreSQL 16.

```bash
# Backend
cd backend
bundle install
bin/rails db:create db:migrate db:seed
bin/rails server -p 3000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

---

## Environment Variables

Copy `.env.example` and adjust for your environment.

| Variable | Default | Notes |
|----------|---------|-------|
| `SECRET_KEY_BASE` | `change_me` | **Replace in production** — used for JWT signing |
| `DB_HOST` | `db` | `db` inside Docker; `localhost` without |
| `DB_PORT` / `DB_USER` / `DB_PASSWORD` | `5432 / postgres / postgres` | |
| `DB_NAME` | `salary_management_development` | |
| `CORS_ORIGINS` | `http://localhost:3001` | Comma-separated list |
| `BACKEND_URL` | `http://localhost:3000` | Next.js server-side proxy target |
| `NEXT_PUBLIC_API_URL` | *(empty)* | Empty = use Next.js SSR proxy |
| `PORT` | `3001` | Frontend port |

---

## Trade-offs

| Decision | Chosen | Alternative | Why |
|----------|--------|-------------|-----|
| Database | PostgreSQL | SQLite | `PERCENTILE_CONT` requires PG |
| Salary type | `DECIMAL(12,2)` | `FLOAT` | Exact financial arithmetic |
| Pagination | Offset | Cursor | Simpler UX; acceptable for HR browse patterns |
| Service return | `Result` struct | Raise exceptions | Explicit; testable without HTTP overhead |
| Insight freshness | Live query | Materialized view | Always fresh; materialised views are a P2 improvement |
| Seed | Deterministic | True random | Reproducible QA and demo data |
| API versioning | `/api/v1/` | Unversioned | Future-proofs payroll integrations |
| Full-text search | `ILIKE '%term%'` | `pg_trgm` GIN | Simpler; `pg_trgm` is a ready P0 improvement |

---

## Performance

All insight queries run in < 10ms against 10k employees. The known bottlenecks at 1M employees are `ILIKE` full-table scans on name/email and in-memory `PERCENTILE_CONT` sorts. Both have concrete fixes.

See [docs/performance.md](docs/performance.md) for the full query analysis, execution plans, and a prioritised improvement roadmap — `pg_trgm` GIN index, Redis caching, materialized views, PgBouncer, and read replica routing.

---

## CI

GitHub Actions runs on every push to `main` and on all pull requests:

- **Backend:** RuboCop (0 offenses) → RSpec with PostgreSQL service (≥90% coverage enforced)
- **Frontend:** ESLint (0 warnings) → Prettier check → Jest (88 tests)

See [.github/workflows/ci.yml](.github/workflows/ci.yml).

---

## Security

JWT authentication (bcrypt passwords), strong params on all mutations, whitelisted sort columns, parameterised queries throughout. No rate limiting or token refresh in the current implementation — both are straightforward additions.

See [SECURITY.md](SECURITY.md) for the full security posture and known gaps.

---

## AI-Assisted Development

Built with Claude as a structured pair programming tool across 10 phases. Technology selection, index strategy, salary validation bounds, and security decisions were made by the developer — not delegated. Every AI output was reviewed before acceptance.

See [docs/ai-prompts.md](docs/ai-prompts.md) for the structured usage log.
