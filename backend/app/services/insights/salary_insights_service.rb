# frozen_string_literal: true

module Insights
  class SalaryInsightsService
    # ── SQL constants ────────────────────────────────────────────────────────────
    #
    # All queries delegate aggregation entirely to PostgreSQL.
    # No data is loaded into Ruby for computation.
    #
    # Index coverage:
    #   country_salaries    → idx on (country, salary)      — index-only scan
    #   job_title_salaries  → idx on (country, job_title, salary) — covering
    #   salary_percentiles  → idx on (country, salary)      — sorted read
    #   top_earners         → idx on salary DESC            — index scan + limit

    SALARY_PERCENTILES_SQL = <<~SQL.freeze
      SELECT
        country,
        ROUND(PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY salary)::numeric, 2) AS p25,
        ROUND(PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY salary)::numeric, 2) AS p50,
        ROUND(PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY salary)::numeric, 2) AS p75,
        ROUND(PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY salary)::numeric, 2) AS p90
      FROM employees
      GROUP BY country
      ORDER BY country ASC
    SQL

    # ── Public interface ─────────────────────────────────────────────────────────

    # MIN / MAX / AVG salary grouped by country.
    # Returns: Array<Hash>
    def self.country_salaries
      Employee
        .group(:country)
        .order(:country)
        .select(
          :country,
          "COUNT(*)              AS employee_count",
          "ROUND(MIN(salary), 2) AS min_salary",
          "ROUND(MAX(salary), 2) AS max_salary",
          "ROUND(AVG(salary), 2) AS avg_salary",
        )
        .map do |r|
          {
            country:        r.country,
            employee_count: r.employee_count.to_i,
            min_salary:     r.min_salary.to_f,
            max_salary:     r.max_salary.to_f,
            avg_salary:     r.avg_salary.to_f,
          }
        end
    end

    # AVG salary grouped by job_title (and country).
    # Optional +country+ param narrows results to one country.
    # Returns: Array<Hash>
    def self.job_title_salaries(country: nil)
      scope = Employee
        .group(:country, :job_title)
        .order("AVG(salary) DESC")
        .select(
          :job_title,
          :country,
          "COUNT(*)              AS employee_count",
          "ROUND(AVG(salary), 2) AS avg_salary",
        )

      scope = scope.where(country: country) if country.present?

      scope.map do |r|
        {
          job_title:      r.job_title,
          country:        r.country,
          employee_count: r.employee_count.to_i,
          avg_salary:     r.avg_salary.to_f,
        }
      end
    end

    # Salary percentile distribution (p25 / p50 / p75 / p90) per country.
    # Uses PostgreSQL PERCENTILE_CONT ordered-set aggregate — cannot be expressed
    # through Arel, so raw SQL is used here deliberately.
    # Returns: Array<Hash>
    def self.salary_percentiles
      ActiveRecord::Base.connection.exec_query(SALARY_PERCENTILES_SQL).map do |row|
        {
          country: row["country"],
          p25:     row["p25"].to_f,
          p50:     row["p50"].to_f,
          p75:     row["p75"].to_f,
          p90:     row["p90"].to_f,
        }
      end
    end

    # Top N employees by salary.
    # Returns: Array<Hash>
    def self.top_earners(limit: 10)
      Employee
        .order(salary: :desc)
        .limit(limit)
        .select(:id, :full_name, :job_title, :country, :salary)
        .map do |e|
          {
            id:        e.id,
            full_name: e.full_name,
            job_title: e.job_title,
            country:   e.country,
            salary:    e.salary.to_f,
          }
        end
    end
  end
end
