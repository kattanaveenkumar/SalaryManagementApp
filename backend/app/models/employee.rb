# frozen_string_literal: true

class Employee < ApplicationRecord
  # ── Domain constants ─────────────────────────────────────────────────────────

  EMPLOYMENT_STATUSES = ["Active", "Probation", "On Leave", "Resigned", "Terminated"].freeze
  EMPLOYMENT_TYPES    = %w[Full-Time Part-Time Contractor Intern].freeze

  DEPARTMENTS = [
    "Engineering",
    "Product",
    "Design",
    "Sales",
    "Marketing",
    "Operations",
    "Finance",
    "Human Resources",
    "Customer Success",
    "Legal & Compliance",
  ].freeze

  JOB_LEVELS = %w[IC1 IC2 IC3 IC4 IC5 M1 M2 M3 M4].freeze

  SALARY_BANDS = %w[Band-1 Band-2 Band-3 Band-4 Band-5 Band-6].freeze

  CURRENCIES = %w[USD GBP EUR CAD AUD JPY INR BRL SGD AED PLN SEK MXN ZAR].freeze

  MIN_SALARY = 20_000
  MAX_SALARY = 600_000

  # ── Callbacks ────────────────────────────────────────────────────────────────

  before_validation :derive_full_name
  before_create     :assign_employee_id

  # ── Validations ──────────────────────────────────────────────────────────────

  validates :full_name,
            presence: true,
            length: { minimum: 2, maximum: 120 }

  validates :first_name, length: { maximum: 60 }, allow_blank: true
  validates :last_name,  length: { maximum: 60 }, allow_blank: true

  validates :job_title,
            presence: true,
            length: { minimum: 2, maximum: 120 }

  validates :country,
            presence: true,
            length: { minimum: 2, maximum: 100 }

  validates :salary,
            presence: true,
            numericality: {
              greater_than_or_equal_to: MIN_SALARY,
              less_than_or_equal_to: MAX_SALARY,
            }

  validates :employment_status,
            inclusion: { in: EMPLOYMENT_STATUSES },
            allow_blank: true

  validates :employment_type,
            inclusion: { in: EMPLOYMENT_TYPES },
            allow_blank: true

  validates :department,
            inclusion: { in: DEPARTMENTS },
            allow_blank: true

  validates :job_level,
            inclusion: { in: JOB_LEVELS },
            allow_blank: true

  validates :salary_band,
            inclusion: { in: SALARY_BANDS },
            allow_blank: true

  validates :currency,
            inclusion: { in: CURRENCIES },
            allow_blank: true

  validates :work_email,
            format: { with: URI::MailTo::EMAIL_REGEXP },
            uniqueness: { case_sensitive: false },
            allow_blank: true

  validates :bonus_percentage,
            numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 100 },
            allow_nil: true

  # ── Scopes ───────────────────────────────────────────────────────────────────

  scope :active,         -> { where(employment_status: "Active") }
  scope :by_country,     ->(v) { where(country: v) }
  scope :by_job_title,   ->(v) { where(job_title: v) }
  scope :by_department,  ->(v) { where(department: v) }
  scope :by_status,      ->(v) { where(employment_status: v) }
  scope :by_type,        ->(v) { where(employment_type: v) }
  scope :by_salary_band, ->(v) { where(salary_band: v) }
  scope :top_earners,    ->(limit = 10) { order(salary: :desc).limit(limit) }

  # ── Instance helpers ─────────────────────────────────────────────────────────

  def display_name
    return full_name if first_name.blank? && last_name.blank?

    pn = has_attribute?(:preferred_name) ? preferred_name : nil
    [pn.presence || first_name, last_name].compact.join(" ")
  end

  def initials
    parts = display_name.to_s.split
    return "?" if parts.empty?

    parts.first(2).map { |p| p[0]&.upcase }.join
  end

  private

  def derive_full_name
    return if first_name.blank? && last_name.blank?

    self.full_name = [first_name.presence, last_name.presence].compact.join(" ")
  end

  def assign_employee_id
    return if employee_id.present?

    year     = Time.current.year
    last_seq = self.class
                   .where("employee_id LIKE ?", "EMP-#{year}-%")
                   .maximum(:employee_id)
                   &.split("-")
                   &.last
                   .to_i

    self.employee_id = format("EMP-%<year>d-%<seq>06d", year: year, seq: last_seq + 1)
  end
end
