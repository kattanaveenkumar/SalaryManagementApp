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
