# frozen_string_literal: true

# ── Configuration ──────────────────────────────────────────────────────────────
SEED_COUNT = 10_000
BATCH_SIZE = 1_000

# ── Idempotency guard ─────────────────────────────────────────────────────────
# Safe to rerun: if 10,000 rows already exist we skip entirely.
# If a partial run left fewer rows we delete and reseed cleanly.
if Employee.count >= SEED_COUNT
  puts "Seed already complete (#{Employee.count} employees). Skipping."
  return
end

puts "Clearing any partial seed data..."
Employee.delete_all

# ── Name corpus ───────────────────────────────────────────────────────────────
db_path     = Rails.root.join("db")
first_names = File.readlines(db_path.join("first_names.txt"), chomp: true).reject(&:empty?)
last_names  = File.readlines(db_path.join("last_names.txt"),  chomp: true).reject(&:empty?)

# ── Reference data ────────────────────────────────────────────────────────────
job_titles = [
  "Software Engineer",
  "Senior Software Engineer",
  "Principal Engineer",
  "Staff Engineer",
  "Product Manager",
  "Senior Product Manager",
  "Data Scientist",
  "Machine Learning Engineer",
  "DevOps Engineer",
  "Site Reliability Engineer",
  "UI/UX Designer",
  "QA Engineer",
  "Test Automation Engineer",
  "Marketing Manager",
  "Growth Manager",
  "Sales Representative",
  "Account Executive",
  "HR Manager",
  "Recruiter",
  "Finance Analyst",
  "Senior Finance Analyst",
  "Operations Manager",
  "Project Manager",
  "Customer Success Manager",
  "Business Analyst",
  "Scrum Master",
].freeze

countries = [
  "United States",
  "United Kingdom",
  "Canada",
  "Germany",
  "France",
  "Japan",
  "India",
  "Brazil",
  "Australia",
  "Singapore",
  "Netherlands",
  "Sweden",
  "South Korea",
  "Mexico",
  "Italy",
  "Spain",
  "South Africa",
  "United Arab Emirates",
  "Poland",
  "Argentina",
].freeze

# ── Deterministic PRNG ────────────────────────────────────────────────────────
# Fixed seed = reproducible data across runs; no random drift between deploys.
rng = Random.new(42)

# ── Salary helper ─────────────────────────────────────────────────────────────
# Rounds to nearest $100 for realism. Stays within model constants.
salary_min_steps = Employee::MIN_SALARY / 100  # 200
salary_max_steps = Employee::MAX_SALARY / 100  # 5_000

# ── Bulk insert in batches ────────────────────────────────────────────────────
# Strategy: generate one batch at a time (BATCH_SIZE hashes) and call
# insert_all — a single multi-row INSERT per batch.
#
# Performance:
#   - 10,000 records / 1,000 per batch = 10 SQL round-trips (not 10,000)
#   - Each batch is ~100 KB of SQL; well within PostgreSQL's statement limit
#   - insert_all bypasses ActiveRecord callbacks and validations intentionally:
#     the data is generated from controlled inputs (arrays above + bounded RNG)
#   - Time complexity: O(n) — linear in SEED_COUNT with small constant
#
total_batches = SEED_COUNT / BATCH_SIZE
now           = Time.current

puts "Seeding #{SEED_COUNT} employees in #{total_batches} batches of #{BATCH_SIZE}..."

total_batches.times do |batch_index|
  batch = Array.new(BATCH_SIZE) do
    {
      full_name:  "#{first_names.sample(random: rng)} #{last_names.sample(random: rng)}",
      job_title:  job_titles.sample(random: rng),
      country:    countries.sample(random: rng),
      salary:     rng.rand(salary_min_steps..salary_max_steps) * 100,
      created_at: now,
      updated_at: now,
    }
  end

  Employee.insert_all(batch)
  puts "  [#{batch_index + 1}/#{total_batches}] #{(batch_index + 1) * BATCH_SIZE} employees inserted"
end

puts "Done. Total employees: #{Employee.count}"
