# frozen_string_literal: true

class Employee < ApplicationRecord
  # Salary bounds: realistic global range for salaried employees (USD/year)
  MIN_SALARY = 20_000
  MAX_SALARY = 500_000

  # ── Validations ─────────────────────────────────────────────────────────────

  validates :full_name,
            presence: true,
            length: { minimum: 2, maximum: 100 }

  validates :job_title,
            presence: true,
            length: { minimum: 2, maximum: 100 }

  validates :country,
            presence: true,
            length: { minimum: 2, maximum: 100 }

  validates :salary,
            presence: true,
            numericality: {
              greater_than_or_equal_to: MIN_SALARY,
              less_than_or_equal_to: MAX_SALARY,
            }

  # ── Scopes ──────────────────────────────────────────────────────────────────

  scope :by_country,   ->(country)   { where(country: country) }
  scope :by_job_title, ->(job_title) { where(job_title: job_title) }
  scope :top_earners,  ->(limit = 10) { order(salary: :desc).limit(limit) }
end
