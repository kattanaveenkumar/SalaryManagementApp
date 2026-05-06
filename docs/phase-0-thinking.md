# Phase 0 — Problem Analysis & Thinking

## Problem Restatement

Build a salary management system for 10,000 employees that:
- Provides CRUD for employees via a browser UI
- Delivers salary insights backed by SQL aggregations
- Seeds 10,000 realistic employees using name corpus files
- Is production-ready (testable, maintainable, deployable)

---

## Risk Identification

### Performance at 10k Scale

| Risk | Impact | Mitigation |
|------|--------|------------|
| Fetching all 10k rows at once | Frontend freeze, slow API | Mandatory server-side pagination |
| GROUP BY on unindexed columns | Full table scan on every insight | Composite covering indexes |
| Row-by-row seed inserts | 10k SQL round-trips = slow | Bulk insert via `insert_all` in batches |

### Aggregation Bottlenecks

Without proper indexes, `GROUP BY country` on 10k rows requires a full table scan.
At 1M rows this becomes catastrophic. Strategy: composite covering indexes that let
PostgreSQL answer aggregation queries with index-only scans (no heap access).

### Seed Inefficiency

Row-by-row `INSERT` = 10,000 round-trips ≈ 10–30 seconds.
Bulk `insert_all` in 1,000-record batches = 10 round-trips ≈ < 1 second.

---

## Functional Requirements

1. Employee CRUD (create, read/paginated, update, delete)
2. Filter employees by country and job_title
3. Insights:
   - Min / Max / Avg salary per country
   - Avg salary per job title within a country
   - Salary percentiles (p25 / p50 / p75 / p90) per country
   - Top 10 highest-paid employees

---

## Non-Functional Requirements

- Zero-step startup: `docker compose up --build` is the full workflow
- Idempotent seed: safe to run on every container start
- Deterministic seed: fixed PRNG seed → reproducible data across deploys
- Server-side pagination: clients can never request all 10k rows at once

---

## Measurable Success Criteria

| Metric | Target |
|--------|--------|
| API latency — paginated list | < 50ms |
| API latency — insight aggregations | < 30ms |
| Seed time — 10,000 employees | < 5 seconds |
| Docker cold startup | < 60 seconds |

---

## Key Technology Decisions

### PostgreSQL over SQLite

The assessment accepts SQLite. We chose PostgreSQL because:
1. `PERCENTILE_CONT` ordered-set aggregate (p25/p50/p75/p90) is PostgreSQL-native; not available in SQLite
2. Proper concurrent write support for a multi-user HR tool
3. More realistic production database choice for an org with 10k employees

### Rails 7 API Mode

- Fast to build, excellent testing ecosystem (RSpec + FactoryBot + Shoulda)
- `insert_all` in Rails 6+ enables true bulk insert with one method call
- Kaminari pagination integrates cleanly with existing scopes

### Next.js over plain React

- App Router gives clean file-based routing
- TypeScript support out of the box
- Production build (not dev server) suitable for Docker deployment
