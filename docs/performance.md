# Performance Review — Salary Management API

## Current Baseline (10 000 employees)

All insight queries complete in < 10 ms against the seeded 10 k dataset.
Employee list with filters: < 5 ms.
The system is deliberately over-engineered for 10 k — the indexes and SQL patterns
are chosen to remain fast at 1 M+.

---

## Query Inventory & Execution Analysis

### 1. Employee List (`Employees::ListService`)

```sql
SELECT * FROM employees
WHERE full_name ILIKE '%<term>%'  -- text search
  AND country    = '<val>'        -- exact match
  AND salary    >= <min>          -- range
ORDER BY <col> <dir>
LIMIT <per_page> OFFSET <skip>
```

| Filter | Index used | Scan type at 10k | Risk at 1M |
|--------|-----------|-----------------|-----------|
| `country` exact | `idx_employees_country` | Index scan | **Fast** |
| `salary` range  | `idx_employees_salary` | Index range | **Fast** |
| `full_name ILIKE '%x%'` | none | **Sequential scan** | **Slow** |
| `work_email ILIKE '%x%'` | none | **Sequential scan** | **Slow** |
| `department` / `status` / `type` | added in migration | Index scan | **Fast** |
| `job_level` / `salary_band` | added in migration | Index scan | **Fast** |
| `hire_date` range | added in migration | Index range | **Fast** |
| `ORDER BY salary` | `idx_employees_salary` | Index scan | **Fast** |

**Bottleneck #1: ILIKE full-table text scan**
A `LIKE '%term%'` predicate with a leading wildcard cannot use a B-tree index.
At 1 M rows every name/email search is a sequential scan — roughly 60–120 ms.

### 2. Company KPIs (`SalaryInsightsService.company_kpis`)

```sql
-- One raw SQL aggregate (good — single pass)
SELECT COUNT(*), COUNT(*) FILTER (...), AVG(...), PERCENTILE_CONT(0.5)... FROM employees

-- Four additional GROUP BY queries (4 round-trips)
GROUP BY department ORDER BY COUNT(*) DESC
GROUP BY employment_status
WHERE status='Active' GROUP BY employment_type
WHERE status='Active' AND dept IS NOT NULL GROUP BY department ORDER BY AVG(salary) DESC
```

| Query | Cost at 1M | Bottleneck |
|-------|-----------|-----------|
| Raw SQL aggregate | Medium — full scan but FILTER-optimised | `PERCENTILE_CONT` must sort all rows |
| Dept breakdown | Low — `idx_employees_department` | Index-only group |
| Status breakdown | Low — `idx_employees_employment_status` | Index-only group |
| Type breakdown | Medium — filtered group | Two-pass plan |
| Dept avg salary | Medium | Full group + AVG |

**Bottleneck #2: 5 sequential database round-trips per `/insights/company_kpis` request**
Each insight page load issues 5 queries. With connection latency this adds 5–25 ms
of overhead independent of query execution time.

**Bottleneck #3: `PERCENTILE_CONT` with no materialisation**
PostgreSQL computes `PERCENTILE_CONT` via an in-memory sort. At 1 M rows the sort
requires ~80 MB of `work_mem`; it spills to disk if the limit is exceeded.

### 3. Salary Percentiles (`salary_percentiles`)

```sql
SELECT country,
  PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY salary),
  ...
FROM employees GROUP BY country ORDER BY country
```

This query sorts the entire `salary` column within each country group.
The composite index `(country, salary)` makes this an **index-only scan with
pre-sorted groups** — PostgreSQL can satisfy both `GROUP BY country` and
`ORDER BY salary` from the index without a hash/sort.

At 1 M rows this is still fast (< 100 ms) because the index covers all needed columns.

### 4. Top Earners

```sql
SELECT ... FROM employees ORDER BY salary DESC LIMIT N
```

Uses `idx_employees_salary` → index scan with early stop. O(log n + N).
Fast at any scale as long as N is small (capped at 100).

### 5. Country / Job-Title Salaries

```sql
SELECT country, job_title, COUNT(*), AVG(salary)
FROM employees
GROUP BY country, job_title
ORDER BY AVG(salary) DESC
```

The `(country, job_title, salary)` composite covering index satisfies both
`GROUP BY` and the `AVG(salary)` aggregate as an index-only scan.
Fast at 1 M rows.

---

## Scaling Bottlenecks — Summary

| # | Issue | Impact at 1M | Priority |
|---|-------|-------------|---------|
| 1 | ILIKE full-table scan (name/email) | 60–200 ms per request | **High** |
| 2 | 5 DB round-trips for `/company_kpis` | 5–25 ms overhead | Medium |
| 3 | `PERCENTILE_CONT` in-memory sort | 50–150 ms, risk of disk spill | Medium |
| 4 | No query result caching | Every request hits DB | High |
| 5 | No connection pooling | Connection setup per request | High |
| 6 | Single primary DB for reads + writes | Read saturation | Medium |

---

## Proposed Improvements

### Fix #1 — Full-Text Search via `pg_trgm`

```sql
-- Enable once, in a migration
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Replace B-tree index with GIN trigram index
CREATE INDEX idx_employees_full_name_trgm
  ON employees USING GIN (full_name gin_trgm_ops);

CREATE INDEX idx_employees_work_email_trgm
  ON employees USING GIN (work_email gin_trgm_ops);
```

In Rails, the query stays identical — PostgreSQL automatically uses the GIN index
for `ILIKE '%term%'` predicates:

```ruby
scope.where("full_name ILIKE ?", "%#{name}%")  # no change needed
```

**Expected gain:** full-name search drops from 150 ms to < 5 ms at 1 M rows.
**Trade-off:** GIN indexes are larger (~3× the column size) and slower to write.
Acceptable for an HR tool where reads dominate.

### Fix #2 — Collapse KPI Queries into a Single SQL Statement

Replace the 4 `GROUP BY` queries with one query using `FILTER` aggregates or a CTE:

```sql
-- Single query replacing 4 round-trips
SELECT
  department,
  employment_status,
  employment_type,
  COUNT(*) AS headcount,
  ROUND(AVG(salary), 2) AS avg_salary
FROM employees
GROUP BY GROUPING SETS (
  (department),
  (employment_status),
  (employment_type),
  (department)         -- dept avg salary grouping
)
```

**Expected gain:** 4 round-trips → 1 round-trip. Negligible CPU overhead.
**Trade-off:** More complex SQL; result requires client-side reshaping.

### Fix #3 — Materialized View for Insight Aggregates

```sql
CREATE MATERIALIZED VIEW mv_company_kpis AS
  SELECT ... (full COMPANY_KPIS_SQL content) ...;

CREATE MATERIALIZED VIEW mv_country_salaries AS
  SELECT country, COUNT(*), MIN(salary), MAX(salary), AVG(salary) ...;

-- Refresh on a schedule (every 15 minutes via pg_cron or a Sidekiq job)
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_company_kpis;
```

**Expected gain:** Insight queries become instantaneous (< 1 ms) regardless of row count.
**Trade-off:** Data is stale by up to 15 minutes. Acceptable for HR dashboards —
payroll data rarely needs real-time accuracy.

### Fix #4 — Redis Caching Layer

```ruby
# config/initializers/redis.rb
REDIS = Redis.new(url: ENV.fetch("REDIS_URL", "redis://localhost:6379/0"))

# In SalaryInsightsService
def self.company_kpis
  REDIS.fetch("insights:company_kpis", ex: 300) do  # 5-min TTL
    JSON.generate(compute_company_kpis)
  end
end
```

**Cache invalidation strategy:**
- Insight endpoints: TTL = 5 minutes (HR dashboards don't need real-time data)
- Employee list: no cache (filters are too varied; cache key explosion)
- Invalidate on `Employee.after_commit` for write-heavy windows

**Expected gain:** Repeated insight requests serve from memory in < 1 ms.
**Trade-off:** Adds a Redis dependency; stale-on-write risk if invalidation logic drifts.

### Fix #5 — PgBouncer Connection Pooling

```yaml
# In production: add PgBouncer sidecar
# docker-compose.yml addition
pgbouncer:
  image: bitnami/pgbouncer
  environment:
    POSTGRESQL_HOST: db
    POSTGRESQL_DATABASE: salary_management_production
    PGBOUNCER_POOL_MODE: transaction  # best for Rails API
    PGBOUNCER_MAX_CLIENT_CONN: 1000
    PGBOUNCER_DEFAULT_POOL_SIZE: 25
```

**Expected gain:** 1 000 concurrent API connections share 25 actual PostgreSQL connections.
**Trade-off:** Session-mode features (advisory locks, `LISTEN/NOTIFY`) require pool-mode
adjustment. Not needed for this API.

### Fix #6 — Read Replica for Analytics

```yaml
# database.yml — Rails multiple databases
production:
  primary:
    <<: *default
    database: salary_management_production
  analytics:
    <<: *default
    database: salary_management_production
    host: <%= ENV['ANALYTICS_DB_HOST'] %>
    replica: true
```

```ruby
# Route all insight queries to the replica
class SalaryInsightsService
  connects_to database: { reading: :analytics, writing: :primary }
end
```

**Expected gain:** Insight queries no longer compete with CRUD writes for I/O.
**Trade-off:** Replication lag (typically < 100 ms) means insights may lag live data.

---

## Index Coverage — Extended Schema

The `extend_employees_enterprise` migration adds these indexes which cover
the new filter dimensions:

```sql
-- New single-column indexes (filter dimensions added in Phase 2 extension)
idx_employees_employee_id      (employee_id)
idx_employees_department       (department)
idx_employees_employment_status(employment_status)
idx_employees_employment_type  (employment_type)
idx_employees_job_level        (job_level)
idx_employees_salary_band      (salary_band)
idx_employees_hire_date        (hire_date)

-- Partial unique index (allows NULL but enforces uniqueness when present)
idx_employees_work_email_unique (work_email) WHERE work_email IS NOT NULL

-- Composite (department + status) for filtered group-by
idx_employees_department_status (department, employment_status)
```

**Missing index for Fix #1 (add as a new migration):**
```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_employees_full_name_trgm ON employees USING GIN (full_name gin_trgm_ops);
```

---

## Scaling Architecture for 1M Employees

```
                        ┌────────────────────────────────┐
                        │         Load Balancer           │
                        │      (nginx / AWS ALB)          │
                        └───────────────┬────────────────┘
                                        │
                        ┌───────────────▼────────────────┐
                        │     Rails API (N instances)     │
                        │   Puma · 5 threads per server  │
                        └──────┬───────────┬─────────────┘
                               │           │
              ┌────────────────▼──┐   ┌────▼──────────────────┐
              │   Redis Cache     │   │   PgBouncer Pool       │
              │   TTL 5 min       │   │   25 server conns      │
              │   insight KPIs    │   └────┬─────────┬─────────┘
              └───────────────────┘        │         │
                                    ┌──────▼──┐ ┌────▼──────────┐
                                    │ Primary │ │ Read Replica  │
                                    │  CRUD   │ │  Insights /   │
                                    │  Writes │ │  Analytics    │
                                    └─────────┘ └───────────────┘
```

**Capacity estimate:**
- At 1 M rows, B-tree index scans remain O(log 1M) ≈ 20 comparisons
- `PERCENTILE_CONT` at 1 M rows: ~150 ms uncached; < 1 ms with materialized view
- Full-text search with `pg_trgm` GIN: < 10 ms at 1 M rows

---

## Implementation Roadmap

| Priority | Change | Effort | Impact |
|---------|--------|--------|--------|
| P0 | Add `pg_trgm` GIN index (migration) | 1 hour | Eliminates seq scans on search |
| P0 | Redis cache for insight endpoints | 1 day | 100× improvement for repeated loads |
| P1 | PgBouncer connection pooling | 4 hours | Handles connection surge |
| P1 | Collapse KPI to 1 SQL query | 4 hours | Eliminates 4 round-trips |
| P2 | Materialized views + refresh job | 1 day | Sub-millisecond insight latency |
| P3 | Read replica routing | 2 days | Isolates analytics I/O from writes |
