# frozen_string_literal: true

# ── Default HR user ───────────────────────────────────────────────────────────
unless User.exists?(email: "hr@incubyte.co")
  User.create!(
    email: "hr@incubyte.co",
    password: "password123",
    password_confirmation: "password123",
    role: "hr_manager",
  )
  Rails.logger.debug "Default user created: hr@incubyte.co / password123"
end

# ── Configuration ─────────────────────────────────────────────────────────────
SEED_COUNT = 10_000
BATCH_SIZE = 500

# ── Idempotency guard ─────────────────────────────────────────────────────────
if Employee.count >= SEED_COUNT
  Rails.logger.debug { "Seed already complete (#{Employee.count} employees). Skipping." }
  return
end

Rails.logger.debug "Clearing any partial seed data..."
Employee.delete_all

# ── Name corpus ───────────────────────────────────────────────────────────────
db_path     = Rails.root.join("db")
first_names = File.readlines(db_path.join("first_names.txt"), chomp: true).reject(&:empty?)
last_names  = File.readlines(db_path.join("last_names.txt"),  chomp: true).reject(&:empty?)

# ── Deterministic PRNG ────────────────────────────────────────────────────────
rng = Random.new(42)

# ── Weighted random helper ────────────────────────────────────────────────────
# Returns a random value from `items` weighted by `weights` (which must sum to 1.0).
def weighted_sample(items, weights, rng)
  r = rng.rand
  cumulative = 0.0
  items.zip(weights).each do |item, weight|
    cumulative += weight
    return item if r <= cumulative
  end
  items.last
end

# ── Domain data with realistic distributions ──────────────────────────────────

# Country distribution: US-heavy tech company (weights must sum to 1.0)
COUNTRY_WEIGHTS = [
  ["United States",     0.52],
  ["United Kingdom",    0.09],
  ["Canada",            0.07],
  ["India",             0.07],
  ["Germany",           0.05],
  ["Australia",         0.04],
  ["Netherlands",       0.02],
  ["France",            0.02],
  ["Singapore",         0.02],
  ["Brazil",            0.02],
  ["Poland",            0.02],
  ["Sweden",            0.01],
  ["Japan",             0.01],
  ["South Korea",       0.01],
  ["United Arab Emirates", 0.01],
  ["Mexico",            0.01],
  ["South Africa",      0.005],
  ["Italy",             0.005],
  ["Spain",             0.005],
  ["Argentina",         0.005],
].freeze

COUNTRIES = COUNTRY_WEIGHTS.map(&:first).freeze
COUNTRY_W = COUNTRY_WEIGHTS.map(&:last).freeze

# Department distribution: engineering-heavy tech company
DEPT_WEIGHTS = [
  ["Engineering",        0.38],
  ["Sales",              0.14],
  ["Product",            0.09],
  ["Customer Success",   0.09],
  ["Marketing",          0.08],
  ["Operations",         0.07],
  ["Human Resources",    0.05],
  ["Finance",            0.05],
  ["Design",             0.03],
  ["Legal & Compliance", 0.02],
].freeze

DEPARTMENTS = DEPT_WEIGHTS.map(&:first).freeze
DEPT_W      = DEPT_WEIGHTS.map(&:last).freeze

# Employment status distribution
STATUS_WEIGHTS = [
  ["Active",     0.80],
  ["Probation",  0.09],
  ["On Leave",   0.05],
  ["Resigned",   0.04],
  ["Terminated", 0.02],
].freeze

STATUSES  = STATUS_WEIGHTS.map(&:first).freeze
STATUS_W  = STATUS_WEIGHTS.map(&:last).freeze

# Employment type distribution
TYPE_WEIGHTS = [
  ["Full-Time",  0.70],
  ["Contractor", 0.20],
  ["Part-Time",  0.06],
  ["Intern",     0.04],
].freeze

EMP_TYPES = TYPE_WEIGHTS.map(&:first).freeze
TYPE_W    = TYPE_WEIGHTS.map(&:last).freeze

# Job level distribution: junior-heavy pyramid
LEVEL_WEIGHTS = [
  ["IC1", 0.14],
  ["IC2", 0.26],
  ["IC3", 0.30],
  ["IC4", 0.14],
  ["IC5", 0.07],
  ["M1",  0.05],
  ["M2",  0.02],
  ["M3",  0.015],
  ["M4",  0.005],
].freeze

JOB_LEVELS = LEVEL_WEIGHTS.map(&:first).freeze
LEVEL_W    = LEVEL_WEIGHTS.map(&:last).freeze

# Salary bands tied to job levels (annual USD base, rounded to $500)
LEVEL_SALARY_RANGES = {
  "IC1" => { min: 55_000,  max: 85_000,  band: "Band-1" },
  "IC2" => { min: 85_000,  max: 125_000, band: "Band-2" },
  "IC3" => { min: 125_000, max: 175_000, band: "Band-3" },
  "IC4" => { min: 170_000, max: 230_000, band: "Band-4" },
  "IC5" => { min: 225_000, max: 320_000, band: "Band-5" },
  "M1" => { min: 155_000, max: 220_000, band: "Band-4" },
  "M2" => { min: 215_000, max: 290_000, band: "Band-5" },
  "M3" => { min: 280_000, max: 400_000, band: "Band-6" },
  "M4" => { min: 380_000, max: 580_000, band: "Band-6" },
}.freeze

# Country salary multipliers (cost-of-labor adjustment)
COUNTRY_MULTIPLIERS = {
  "United States" => 1.00,
  "United Kingdom" => 0.82,
  "Canada" => 0.78,
  "Australia" => 0.80,
  "Singapore" => 0.85,
  "Germany" => 0.72,
  "France" => 0.68,
  "Netherlands" => 0.70,
  "Sweden" => 0.71,
  "Japan" => 0.60,
  "South Korea" => 0.58,
  "Brazil" => 0.40,
  "Mexico" => 0.38,
  "Poland" => 0.42,
  "India" => 0.32,
  "South Africa" => 0.35,
  "United Arab Emirates" => 0.75,
  "Italy" => 0.62,
  "Spain" => 0.60,
  "Argentina" => 0.30,
}.freeze

# Job titles by department × level (realistic role mapping)
DEPT_LEVEL_TITLES = {
  "Engineering" => {
    "IC1" => ["Associate Software Engineer", "Junior Developer"],
    "IC2" => ["Software Engineer", "Backend Engineer", "Frontend Engineer"],
    "IC3" => ["Senior Software Engineer", "Senior Backend Engineer", "Senior Frontend Engineer"],
    "IC4" => ["Staff Engineer", "Tech Lead", "Lead Engineer"],
    "IC5" => ["Principal Engineer", "Architect", "Distinguished Engineer"],
    "M1" => ["Engineering Manager"],
    "M2" => ["Director of Engineering", "Senior Engineering Manager"],
    "M3" => ["VP of Engineering"],
    "M4" => ["CTO", "SVP Engineering"],
  },
  "Product" => {
    "IC1" => ["Associate Product Manager"],
    "IC2" => ["Product Manager"],
    "IC3" => ["Senior Product Manager"],
    "IC4" => ["Group Product Manager", "Lead Product Manager"],
    "IC5" => ["Principal Product Manager", "Staff Product Manager"],
    "M1" => ["Product Director"],
    "M2" => ["Director of Product"],
    "M3" => ["VP of Product"],
    "M4" => ["Chief Product Officer"],
  },
  "Design" => {
    "IC1" => ["Junior Designer", "UI Designer"],
    "IC2" => ["Product Designer", "UX Designer"],
    "IC3" => ["Senior Product Designer", "Senior UX Designer"],
    "IC4" => ["Lead Designer", "Design Lead"],
    "IC5" => ["Principal Designer", "Staff Designer"],
    "M1" => ["Design Manager"],
    "M2" => ["Design Director"],
    "M3" => ["VP of Design"],
    "M4" => ["Chief Design Officer"],
  },
  "Sales" => {
    "IC1" => ["Sales Development Rep", "Business Development Rep"],
    "IC2" => ["Account Executive", "Inside Sales Rep"],
    "IC3" => ["Senior Account Executive", "Enterprise Account Executive"],
    "IC4" => ["Principal Account Executive", "Strategic Account Executive"],
    "IC5" => ["Regional Sales Director", "Key Account Director"],
    "M1" => ["Sales Manager"],
    "M2" => ["Director of Sales"],
    "M3" => ["VP of Sales"],
    "M4" => ["Chief Revenue Officer"],
  },
  "Marketing" => {
    "IC1" => ["Marketing Coordinator", "Content Writer"],
    "IC2" => ["Marketing Manager", "Growth Marketer"],
    "IC3" => ["Senior Marketing Manager", "Senior Growth Manager"],
    "IC4" => ["Head of Growth", "Lead Marketing Manager"],
    "IC5" => ["Principal Marketing Strategist"],
    "M1" => ["Marketing Manager"],
    "M2" => ["Director of Marketing"],
    "M3" => ["VP of Marketing"],
    "M4" => ["Chief Marketing Officer"],
  },
  "Operations" => {
    "IC1" => ["Operations Coordinator", "Business Analyst"],
    "IC2" => ["Operations Analyst", "Project Manager"],
    "IC3" => ["Senior Operations Analyst", "Senior Project Manager"],
    "IC4" => ["Operations Lead", "Program Manager"],
    "IC5" => ["Principal Operations Manager"],
    "M1" => ["Operations Manager"],
    "M2" => ["Director of Operations"],
    "M3" => ["VP of Operations"],
    "M4" => ["COO"],
  },
  "Finance" => {
    "IC1" => ["Finance Analyst", "Accounting Analyst"],
    "IC2" => ["Senior Finance Analyst", "FP&A Analyst"],
    "IC3" => ["Finance Manager", "Senior FP&A Analyst"],
    "IC4" => ["Finance Lead", "Controller"],
    "IC5" => ["Principal Finance Manager"],
    "M1" => ["Finance Manager"],
    "M2" => ["Director of Finance"],
    "M3" => ["VP of Finance"],
    "M4" => ["CFO"],
  },
  "Human Resources" => {
    "IC1" => ["HR Coordinator", "Recruiter"],
    "IC2" => ["HR Business Partner", "Senior Recruiter"],
    "IC3" => ["Senior HRBP", "Talent Acquisition Lead"],
    "IC4" => ["HR Lead", "Compensation Analyst"],
    "IC5" => ["Principal HR Manager"],
    "M1" => ["HR Manager"],
    "M2" => ["Director of HR"],
    "M3" => ["VP of People"],
    "M4" => ["Chief People Officer"],
  },
  "Customer Success" => {
    "IC1" => ["Customer Success Associate"],
    "IC2" => ["Customer Success Manager"],
    "IC3" => ["Senior Customer Success Manager"],
    "IC4" => ["Enterprise Customer Success Manager"],
    "IC5" => ["Principal CSM", "Strategic CSM"],
    "M1" => ["Customer Success Team Lead"],
    "M2" => ["Director of Customer Success"],
    "M3" => ["VP of Customer Success"],
    "M4" => ["Chief Customer Officer"],
  },
  "Legal & Compliance" => {
    "IC1" => ["Legal Coordinator", "Compliance Analyst"],
    "IC2" => ["Legal Counsel", "Compliance Manager"],
    "IC3" => ["Senior Legal Counsel", "Senior Compliance Manager"],
    "IC4" => ["Lead Legal Counsel"],
    "IC5" => ["Principal Legal Counsel"],
    "M1" => ["Legal Manager"],
    "M2" => ["Director of Legal"],
    "M3" => ["VP of Legal & Compliance"],
    "M4" => ["General Counsel", "CLO"],
  },
}.freeze

# Bonus % by level (realistic annual targets)
LEVEL_BONUS = {
  "IC1" => [5,  10],
  "IC2" => [8,  15],
  "IC3" => [10, 20],
  "IC4" => [12, 25],
  "IC5" => [15, 30],
  "M1" => [15, 30],
  "M2" => [20, 40],
  "M3" => [25, 50],
  "M4" => [30, 70],
}.freeze

CURRENCIES_BY_COUNTRY = {
  "United States" => "USD",
  "United Kingdom" => "GBP",
  "Canada" => "CAD",
  "Germany" => "EUR",
  "France" => "EUR",
  "Japan" => "JPY",
  "India" => "INR",
  "Brazil" => "BRL",
  "Australia" => "AUD",
  "Singapore" => "SGD",
  "Netherlands" => "EUR",
  "Sweden" => "SEK",
  "South Korea" => "USD", # often paid in USD
  "Mexico" => "MXN",
  "Italy" => "EUR",
  "Spain" => "EUR",
  "South Africa" => "ZAR",
  "United Arab Emirates" => "AED",
  "Poland" => "PLN",
  "Argentina" => "USD", # USD-pegged contracts common
}.freeze

# ── Seed employees ────────────────────────────────────────────────────────────
total_batches = SEED_COUNT / BATCH_SIZE
now           = Time.current
seq_counter   = 0

Rails.logger.debug { "Seeding #{SEED_COUNT} employees in #{total_batches} batches of #{BATCH_SIZE}..." }

total_batches.times do |batch_index|
  batch = Array.new(BATCH_SIZE) do
    seq_counter += 1

    first   = first_names.sample(random: rng)
    last    = last_names.sample(random: rng)
    country = weighted_sample(COUNTRIES, COUNTRY_W, rng)
    dept    = weighted_sample(DEPARTMENTS, DEPT_W, rng)
    level   = weighted_sample(JOB_LEVELS, LEVEL_W, rng)
    status  = weighted_sample(STATUSES, STATUS_W, rng)
    emp_type = weighted_sample(EMP_TYPES, TYPE_W, rng)

    # Title from dept × level matrix
    title_pool  = DEPT_LEVEL_TITLES.dig(dept, level) || ["Specialist"]
    job_title   = title_pool.sample(random: rng)

    # Salary: pick within level band, apply country multiplier, round to $500
    band_config = LEVEL_SALARY_RANGES[level]
    base_steps  = (band_config[:min]..band_config[:max]).step(500).to_a
    base_usd    = base_steps.sample(random: rng)
    multiplier  = COUNTRY_MULTIPLIERS.fetch(country, 0.60)
    salary      = (base_usd * multiplier / 500.0).round * 500
    salary      = [salary, Employee::MIN_SALARY].max
    salary      = [salary, Employee::MAX_SALARY].min

    # Bonus
    bonus_range = LEVEL_BONUS[level]
    bonus_pct   = (rng.rand(bonus_range[0]..bonus_range[1]) * 10).round / 10.0

    # Hire date: spread over last 8 years, weighted toward recent
    days_range  = 8 * 365
    # Quadratic weighting: more recent hires are more common
    raw_day     = rng.rand**1.5
    hire_offset = (raw_day * days_range).to_i
    hire_date   = (Time.zone.today - days_range + hire_offset)

    # Compensation review date: ~annual cycle from hire date
    review_date = hire_date + 365 + rng.rand(-30..30)

    currency = CURRENCIES_BY_COUNTRY.fetch(country, "USD")
    email_domain = ["techcorp.io", "globalhr.com", "enterprise.co", "staffing.net"].sample(random: rng)
    work_email = "#{first.downcase.gsub(/[^a-z]/,
                                        '')}.#{last.downcase.gsub(/[^a-z]/, '')}#{rng.rand(1..99)}@#{email_domain}"

    {
      employee_id: format("EMP-%<year>d-%<seq>06d", year: now.year, seq: seq_counter),
      first_name: first,
      last_name: last,
      full_name: "#{first} #{last}",
      work_email: work_email,
      job_title: job_title,
      country: country,
      department: dept,
      employment_status: status,
      employment_type: emp_type,
      job_level: level,
      salary_band: band_config[:band],
      salary: salary,
      bonus_percentage: bonus_pct,
      currency: currency,
      hire_date: hire_date,
      compensation_review_date: review_date,
      created_at: now,
      updated_at: now,
    }
  end

  Employee.insert_all(batch)
  Rails.logger.debug { "  [#{batch_index + 1}/#{total_batches}] #{(batch_index + 1) * BATCH_SIZE} employees inserted" }
end

Rails.logger.debug { "Done. Total employees: #{Employee.count}" }
