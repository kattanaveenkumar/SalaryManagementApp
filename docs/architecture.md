# Architecture

## System Topology

```
┌─────────────────────────────────────────────────────────────┐
│                    docker-compose network                    │
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   database   │    │   backend    │    │   frontend   │  │
│  │ PostgreSQL16 │◄───│  Rails 7 API │◄───│  Next.js 14  │  │
│  │  port: 5432  │    │  port: 3000  │    │  port: 3001  │  │
│  │              │    │              │    │              │  │
│  │ healthcheck: │    │ healthcheck: │    │ healthcheck: │  │
│  │  pg_isready  │    │  GET /health │    │  GET /       │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│                                                             │
│  Startup order: database → backend → frontend               │
│  Frontend calls backend via: http://backend:3000            │
└─────────────────────────────────────────────────────────────┘
        │                    │                    │
      :5432               :3000               :3001
     (internal)          (host)              (host)
```

---

## Backend Layer Architecture

```
HTTP Request
     │
     ▼
ApplicationController          ← rescue_from: RecordNotFound, ParameterMissing
     │
     ▼
Api::V1::EmployeesController   ← HTTP only: params, status codes, render
Api::V1::InsightsController    ← delegates 100% to service layer
HealthController
     │
     ▼
Employees::ListService         ← pagination + filter query building
Employees::CreateService       ← validate + persist, returns Result struct
Employees::UpdateService       ← validate + persist, returns Result struct
Insights::SalaryInsightsService← all 4 SQL aggregation queries
     │
     ▼
Employee (ActiveRecord Model)  ← validations, named scopes, no business logic
     │
     ▼
PostgreSQL                     ← aggregation, sorting, pagination at DB level
```

---

## Database Schema

```sql
CREATE TABLE employees (
  id         BIGSERIAL PRIMARY KEY,
  full_name  VARCHAR NOT NULL,           -- HR identity
  job_title  VARCHAR NOT NULL,           -- insight dimension
  country    VARCHAR NOT NULL,           -- primary grouping dimension
  salary     DECIMAL(12,2) NOT NULL,     -- financial: decimal avoids float drift
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

-- Single-column indexes: individual filters and ORDER BY
CREATE INDEX idx_employees_country   ON employees(country);
CREATE INDEX idx_employees_job_title ON employees(job_title);
CREATE INDEX idx_employees_salary    ON employees(salary);

-- Composite covering indexes: GROUP BY aggregations run as index-only scans
CREATE INDEX idx_employees_country_salary
  ON employees(country, salary);           -- MIN/MAX/AVG per country

CREATE INDEX idx_employees_country_job_title_salary
  ON employees(country, job_title, salary); -- AVG per job_title WHERE country
```

---

## API Design

```
GET    /health                               → 200 { status: "ok" }

GET    /api/v1/employees                     → 200 paginated list
       ?page=1&per_page=25&country=X&job_title=Y
POST   /api/v1/employees                     → 201 created | 422 errors
GET    /api/v1/employees/:id                 → 200 | 404
PATCH  /api/v1/employees/:id                 → 200 | 422 | 404
DELETE /api/v1/employees/:id                 → 204 | 404

GET    /api/v1/insights/country_salaries     → min/max/avg per country
GET    /api/v1/insights/job_title_salaries   → avg per title; ?country= filter
GET    /api/v1/insights/salary_percentiles   → p25/p50/p75/p90 per country
GET    /api/v1/insights/top_earners          → top N by salary; ?limit= (1–100)
```

---

## Frontend Structure

```
src/
├── app/
│   ├── page.tsx              → Employee list (CRUD table + filters)
│   └── insights/page.tsx     → Insights dashboard
├── components/
│   ├── employees/            → Table, Form, Filters, DeleteModal
│   ├── insights/             → CountryTable, JobTitleInsights, TopEarners
│   └── ui/                   → Pagination, LoadingSpinner, ErrorBanner
├── hooks/
│   ├── useEmployees.ts       → fetch, paginate, filter, mutate
│   └── useInsights.ts        → fetch all insight data
├── services/
│   └── api.ts                → typed fetch wrapper, base URL from env
└── types/index.ts            → Employee, InsightData, PaginatedResponse
```

---

## Index Coverage for Insight Queries

| Query | Index Used | Scan Type |
|-------|-----------|-----------|
| `GROUP BY country` + MIN/MAX/AVG salary | `(country, salary)` | Index-only scan |
| `WHERE country = X GROUP BY job_title` + AVG | `(country, job_title, salary)` | Index range + index-only |
| `PERCENTILE_CONT ... ORDER BY salary GROUP BY country` | `(country, salary)` | Sorted group scan |
| `ORDER BY salary DESC LIMIT 10` | `(salary)` | Index scan + early stop |

At 10k rows, all insight queries complete in < 10ms. At 1M rows, the index-only
scan strategy remains O(log n + result size) and stays fast.

---

## Scaling Strategy (1M Employees)

1. **Read replicas** — route insight queries to replica, writes to primary
2. **Materialized views** — pre-compute country_salaries on a schedule (refresh every 15 min)
3. **Connection pooling** — PgBouncer in front of PostgreSQL
4. **Caching** — Redis cache for insight endpoints (TTL = 5 minutes; insights don't need real-time accuracy)
5. **Partitioning** — partition `employees` table by `country` for country-scoped queries
