# Engineering Decisions & Trade-offs

## Database: PostgreSQL over SQLite

**Decision:** Use PostgreSQL 16.

**Trade-off:** SQLite is simpler to run (no separate container) but lacks:
- `PERCENTILE_CONT` ordered-set aggregate (needed for p25/p50/p75/p90 insights)
- Concurrent write support for multi-user HR tool
- Production-grade reliability for an org with 10k employees

**Cost:** Requires a separate Docker service + health check. Worth it.

---

## Seed: Bulk Insert over Row-by-Row

**Decision:** `Employee.insert_all` in 1,000-record batches.

**Trade-off:** Bypasses ActiveRecord callbacks and validations.
This is acceptable because the data is generated from controlled inputs
(bounded arrays + bounded PRNG), not user input.

**Benefit:** 10 SQL round-trips instead of 10,000 → < 1 second instead of 10–30 seconds.
The assessment explicitly called out seed performance as important.

---

## Seed: Fixed PRNG Seed (42)

**Decision:** `Random.new(42)` — deterministic randomness.

**Trade-off:** Every fresh deploy generates the exact same 10,000 employees.
This means insight dashboard values are predictable/stable across environments,
which is a feature for QA and demos, not a bug.

---

## Pagination: Offset (page/per_page) over Cursor

**Decision:** Offset pagination via Kaminari.

**Trade-off:** Cursor pagination handles inserts during pagination more gracefully
but is significantly harder to implement and explain. At 10k rows with an HR persona
(not a social feed), offset pagination is appropriate and UX-friendly (page numbers).

---

## Service Layer: `Result` Struct over Exceptions

**Decision:** Services return `Result.new(success:, employee:, errors:)`.

**Trade-off:** More verbose than raising exceptions, but makes failure handling
explicit and testable. The controller reads `if result.success` — clear intent,
no control flow via exceptions for expected failure cases (validation errors).

---

## Insights: 4 Queries over 2

**Decision:** Implement min/max/avg per country, avg by job title, salary
percentiles, and top earners — 4 queries vs the 2 required.

**Rationale:** An HR manager of a 10,000-person org needs more than averages.
Percentile distribution reveals pay equity issues. Top earners helps identify
outliers. These are genuinely useful for the user persona.

---

## API: Versioned (`/api/v1/`) Namespace

**Decision:** All API routes under `/api/v1/`.

**Trade-off:** Slightly more verbose URLs. Benefit: future API changes can be
shipped as `/api/v2/` without breaking existing consumers. For an HR tool that
may integrate with payroll systems, this matters.

---

## Frontend: Next.js App Router over Pages Router

**Decision:** Next.js 14 with App Router.

**Trade-off:** App Router is newer and has a slightly different mental model.
Benefit: cleaner layouts, better server component support, and it is the current
Next.js standard (Pages Router is in maintenance mode).

---

## Deployment: Docker Compose over Direct Deploy

**Decision:** Full Docker Compose setup with auto-migration and auto-seed.

**Trade-off:** Adds Dockerfile complexity. Benefit: zero-step setup for any
evaluator — `docker compose up --build` is the complete workflow.
No "works on my machine" issues.
