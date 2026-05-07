# Salary Management System

A production-grade HR platform for managing employee compensation data across a 10 000-person
organisation. Built with Rails 7 API, Next.js 14, and PostgreSQL 16, containerised with Docker
Compose for zero-step local setup.

---

## Quick Start

```bash
# Clone and start everything (builds images, runs migrations, seeds 10 k employees)
git clone <repo>
cd SalaryManagementApp
docker compose up --build

# App is ready at:
#   Frontend  → http://localhost:3001
#   API       → http://localhost:3000
#   Default credentials: hr@incubyte.co / password123
```

> **Requirement:** Docker Desktop ≥ 4.x (or Docker Engine + Compose plugin).

---

## Architecture

```
Browser
   │  HTTPS / HTTP
   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Docker Compose network                          │
│                                                                         │
│  ┌──────────────────┐    ┌──────────────────┐    ┌───────────────────┐  │
│  │    PostgreSQL 16  │◄───│   Rails 7 API    │◄───│   Next.js 14      │  │
│  │    port: 5432     │    │   port: 3000     │    │   port: 3001      │  │
│  │                  │    │                  │    │                   │  │
│  │  healthcheck:    │    │  healthcheck:    │    │  Standalone build │  │
│  │  pg_isready      │    │  GET /health     │    │  SSR + rewrites   │  │
│  └──────────────────┘    └──────────────────┘    └───────────────────┘  │
│                                                                         │
│  Startup order: db (healthy) → backend (healthy) → frontend             │
└─────────────────────────────────────────────────────────────────────────┘
        :5432 (internal)        :3000 (host)              :3001 (host)
```

### Backend Layer

```
HTTP Request
     │
     ▼
ApplicationController        ← rescue_from: RecordNotFound, ParameterMissing
     │
     ▼
Api::V1::EmployeesController ← strong params, pagination, HTTP status codes
Api::V1::InsightsController  ← delegates 100% to service layer
Api::V1::AuthController      ← JWT login / signup
HealthController             ← GET /health → { status: "ok" }
     │
     ▼
Employees::ListService       ← 15 filter dimensions, whitelist sort, Kaminari pagination
Employees::CreateService     ← validate + persist, returns Result struct
Employees::UpdateService     ← validate + persist, returns Result struct
Insights::SalaryInsightsService ← 5 aggregation queries: KPIs, percentiles, top earners
Auth::TokenService           ← JWT encode / decode
     │
     ▼
Employee / User (ActiveRecord) ← validations, named scopes
     │
     ▼
PostgreSQL                   ← aggregation, sort, paginate at DB level
```

### Frontend Structure

```
frontend/src/
├── app/
│   ├── page.tsx              → Employees (CRUD table + 15 filter dimensions)
│   ├── insights/page.tsx     → Analytics dashboard
│   ├── login/page.tsx        → JWT login form
│   └── signup/page.tsx       → Account creation
├── components/
│   ├── employees/            → EmployeeTable, EmployeeForm, EmployeeFilters,
│   │                            ConfirmDeleteModal (portal-based action menu)
│   ├── insights/             → CountrySalaryTable, JobTitleInsights,
│   │                            PercentileTable, TopEarners, KPI cards, charts
│   ├── ui/                   → Pagination, Toast, Avatar, StatusBadge,
│   │                            LoadingSpinner, ErrorBanner
│   ├── AppNav.tsx            → Responsive nav with profile dropdown
│   └── AuthGuard.tsx         → Redirect unauthenticated users to /login
├── contexts/AuthContext.tsx  → JWT token + user state, login/logout
├── hooks/
│   ├── useEmployees.ts       → fetch, paginate, filter, CRUD mutations
│   └── useInsights.ts        → fetch all insight endpoint data
├── services/api.ts           → Typed fetch wrapper; base URL from env
└── types/index.ts            → Employee, AuthResponse, InsightData, Pagination
```

---

## API Reference

```
Auth
  POST   /api/v1/auth/login               → 200 { token, user } | 401
  POST   /api/v1/auth/signup              → 201 { token, user } | 422

Employees (JWT required)
  GET    /api/v1/employees                → 200 paginated list
         ?page=1 &per_page=25
         &name=   &country=   &job_title=
         &department=   &employment_status=   &employment_type=
         &job_level=    &salary_band=
         &salary_min=   &salary_max=
         &hire_date_from=   &hire_date_to=
         &sort_by=salary    &sort_order=desc
  POST   /api/v1/employees                → 201 | 422
  GET    /api/v1/employees/:id            → 200 | 404
  PATCH  /api/v1/employees/:id            → 200 | 422 | 404
  DELETE /api/v1/employees/:id            → 204 | 404

Insights (JWT required)
  GET    /api/v1/insights/company_kpis    → headcount, payroll, dept/status/type breakdowns
  GET    /api/v1/insights/country_salaries → min/max/avg per country
  GET    /api/v1/insights/job_title_salaries?country= → avg per job title
  GET    /api/v1/insights/salary_percentiles → p25/p50/p75/p90 per country
  GET    /api/v1/insights/top_earners?limit= → top N (1–100) by salary

Health
  GET    /health                          → 200 { status: "ok" }
```

---

## Database Schema

```sql
-- Core identity
employees (
  id                    BIGSERIAL PRIMARY KEY,
  employee_id           VARCHAR UNIQUE,          -- EMP-2024-000001
  first_name / last_name / preferred_name VARCHAR,
  full_name             VARCHAR NOT NULL,
  work_email            VARCHAR UNIQUE (partial — NULL allowed),
  phone_number          VARCHAR,

  -- Employment
  job_title             VARCHAR NOT NULL,
  job_level             VARCHAR,                 -- IC1–IC5, M1–M4
  department            VARCHAR,
  employment_status     VARCHAR DEFAULT 'Active',
  employment_type       VARCHAR DEFAULT 'Full-Time',
  manager_name          VARCHAR,
  country               VARCHAR NOT NULL,

  -- Compensation
  salary                DECIMAL(12,2) NOT NULL,
  salary_band           VARCHAR,
  currency              VARCHAR DEFAULT 'USD',
  bonus_percentage      DECIMAL(5,2),
  stock_grant_value     DECIMAL(14,2),

  -- Dates
  hire_date             DATE,
  compensation_review_date DATE,
  notes                 TEXT,
  created_at / updated_at TIMESTAMP NOT NULL
);

-- Key indexes (abbreviated)
idx_employees_country                   (country)
idx_employees_salary                    (salary)
idx_employees_country_salary            (country, salary)        ← covering
idx_employees_country_job_title_salary  (country, job_title, salary) ← covering
idx_employees_department                (department)
idx_employees_employment_status         (employment_status)
idx_employees_hire_date                 (hire_date)
```

---

## Local Development (without Docker)

```bash
# Backend prerequisites: Ruby 3.2, PostgreSQL 16
cd backend
bundle install
bin/rails db:create db:migrate db:seed
bin/rails server -p 3000

# Frontend prerequisites: Node 20+
cd frontend
npm install
npm run dev         # http://localhost:3001
```

---

## Running Tests

```bash
# All tests via Makefile
make test           # RSpec + Jest
make test-e2e       # Playwright (21 E2E tests)
make coverage       # Tests + HTML coverage reports
make lint           # RuboCop + ESLint

# Or individually:
cd backend  && bundle exec rspec
cd frontend && npm test
cd frontend && npm run test:e2e
```

**Coverage targets:**
- Backend: ≥ 90% line coverage (enforced by SimpleCov)
- Frontend: Jest with 88 unit/integration tests across 15 suites
- E2E: 21 Playwright scenarios (auth flows, CRUD, filters, insights)

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_HOST` | `db` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_USER` | `postgres` | DB user |
| `DB_PASSWORD` | `postgres` | DB password |
| `DB_NAME` | `salary_management_development` | DB name |
| `RAILS_ENV` | `production` | Rails environment |
| `SECRET_KEY_BASE` | `change_me` | JWT signing key — **replace in production** |
| `CORS_ORIGINS` | `http://localhost:3001` | Allowed CORS origins |
| `BACKEND_URL` | `http://localhost:3000` | Backend URL (Next.js server-side proxy) |
| `NEXT_PUBLIC_API_URL` | `` (empty) | Client-side API base URL (empty = use proxy) |
| `PORT` | `3001` | Frontend port |

---

## Design Decisions

### PostgreSQL over SQLite
PostgreSQL provides `PERCENTILE_CONT` ordered-set aggregates (essential for p25/p50/p75/p90
salary percentiles) and `FILTER` clause support, neither of which SQLite supports.
Cost: a separate Docker service. Benefit: exact percentiles and concurrent write support.

### Decimal over Float for Salary
`DECIMAL(12, 2)` avoids IEEE 754 floating-point drift. A salary of $100 000.00 stored as
`FLOAT` may round to $99 999.99999 in aggregate computations. Financial data requires exact
representation.

### Service Layer with `Result` Struct
Controllers delegate 100% of business logic to service objects. Services return a typed
`Result` struct rather than raising exceptions for expected failures (validation errors).
This makes the controller thin (`if result.success? → render 201` else `render 422`) and
makes service behaviour directly testable without HTTP overhead.

### Covering Indexes for Insight Queries
`(country, salary)` and `(country, job_title, salary)` are composite covering indexes.
PostgreSQL can satisfy `GROUP BY country + AVG(salary)` entirely from the index —
an index-only scan with no heap fetch. At 10 k rows this is fast; at 1 M rows it remains
fast because the index access pattern is O(log n + groups).

### Offset Pagination via Kaminari
Cursor pagination handles concurrent inserts more gracefully but is harder to implement
and test. For an HR tool — where pages are browsed, not streamed — offset pagination
with page numbers is the correct UX choice. `per_page` is clamped to `[1, 100]`
server-side; clients cannot request all rows in one call.

### Docker Proxy Architecture
Browser JavaScript cannot resolve `http://backend:3000` (internal Docker DNS).
Instead of embedding a hardcoded `localhost` URL at build time (brittle across
environments), the Next.js server rewrites `/api/*` to `BACKEND_URL` server-side.
The browser fetches relative URLs; the Next.js container resolves `backend:3000`
inside the Docker network.

### Deterministic Seed (`Random.new(42)`)
All 10 000 seeded employees are generated from a fixed PRNG seed. Every fresh deploy
produces identical data — insight dashboard values are stable across environments,
which matters for QA and demos.

---

## Trade-offs

| Decision | Chosen | Alternative | Trade-off |
|----------|--------|-------------|-----------|
| DB | PostgreSQL | SQLite | Needs Docker; gains `PERCENTILE_CONT` |
| Pagination | Offset | Cursor | Simpler UX; stale page on insert |
| Service return | Result struct | Raise exceptions | Verbose; explicit; testable |
| Insight freshness | Live query | Materialized view | Always fresh; slower at 1M+ rows |
| Seed randomness | Deterministic | True random | Reproducible; not realistic churn |
| API versioning | `/api/v1/` | Unversioned | URL verbosity; future-proofs integrations |
| ILIKE search | Native `pg_trgm` ready | Elasticsearch | Simpler ops; see performance.md |

---

## Performance at Scale

The current implementation is optimised for 10 k employees. For 1 M employees,
the primary improvements are:

1. **`pg_trgm` GIN index** on `full_name` — eliminates sequential scan on name search
2. **Redis cache** for insight endpoints (TTL = 5 min) — sub-millisecond repeated loads
3. **PgBouncer** connection pooling — handles connection surge from multiple API instances
4. **Materialized views** for KPI/percentile aggregates — decouples refresh from request
5. **Read replica** for analytics queries — isolates insight I/O from CRUD writes

See [docs/performance.md](docs/performance.md) for full analysis and implementation roadmap.

---

## Project Structure

```
SalaryManagementApp/
├── backend/                   # Rails 7 API
│   ├── app/
│   │   ├── controllers/api/v1/    # EmployeesController, InsightsController, AuthController
│   │   ├── models/                # Employee, User (validations, scopes)
│   │   ├── serializers/           # EmployeeSerializer (ActiveModel::Serializer)
│   │   └── services/              # ListService, CreateService, UpdateService,
│   │                              #   SalaryInsightsService, Auth::TokenService
│   ├── db/
│   │   ├── migrate/               # schema migrations
│   │   ├── seeds.rb               # 10 k deterministic employees
│   │   └── schema.rb
│   └── spec/                  # RSpec: models, services, requests (full coverage)
├── frontend/                  # Next.js 14
│   ├── src/                   # app/, components/, hooks/, services/, types/
│   ├── e2e/                   # Playwright: auth, employees, insights (21 tests)
│   └── src/__tests__/         # Jest: 88 unit/integration tests
├── docs/
│   ├── architecture.md        # System topology + index coverage table
│   ├── decisions.md           # Engineering trade-off notes
│   ├── performance.md         # Query analysis + 1M-employee scaling roadmap
│   ├── ai-prompts.md          # Structured AI usage log
│   └── phase-0-thinking.md   # Pre-implementation analysis
├── docker-compose.yml         # 3-service stack: db + backend + frontend
├── Makefile                   # lint, format, test, coverage, docker targets
└── README.md                  # This file
```

---

## AI Assistance

This project was built with Claude as a structured pair-programming tool.
All AI output was reviewed phase-by-phase before acceptance.
Key decisions (technology selection, index strategy, salary bounds, security review)
were made by the human developer — not delegated to AI.

See [docs/ai-prompts.md](docs/ai-prompts.md) for the full structured usage log.
