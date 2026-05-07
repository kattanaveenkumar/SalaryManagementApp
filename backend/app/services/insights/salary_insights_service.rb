# frozen_string_literal: true

module Insights
  class SalaryInsightsService
    COMPANY_KPIS_SQL = <<~SQL.squish
      SELECT
        COUNT(*)                                                                           AS total_headcount,
        COUNT(*) FILTER (WHERE employment_status = 'Active')                              AS active_headcount,
        ROUND(AVG(salary) FILTER (WHERE employment_status = 'Active')::numeric, 2)       AS avg_salary,
        ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY salary)
              FILTER (WHERE employment_status = 'Active')::numeric, 2)                   AS median_salary,
        ROUND(SUM(salary) FILTER (WHERE employment_status = 'Active')::numeric, 2)       AS total_payroll,
        COUNT(*) FILTER (WHERE employment_status = 'Probation')                           AS on_probation,
        COUNT(*) FILTER (WHERE employment_status = 'On Leave')                            AS on_leave,
        COUNT(*) FILTER (WHERE compensation_review_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 90)
                                                                                          AS reviews_due_90d
      FROM employees
    SQL

    SALARY_PERCENTILES_SQL = <<~SQL.squish
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

    # ── Company-wide KPIs ────────────────────────────────────────────────────────

    def self.company_kpis
      row = ActiveRecord::Base.connection.exec_query(COMPANY_KPIS_SQL).first

      dept_breakdown = Employee
                       .where.not(department: nil)
                       .group(:department)
                       .order(count_all: :desc)
                       .count
                       .map { |dept, count| { department: dept, headcount: count } }

      status_breakdown = Employee
                         .group(:employment_status)
                         .count
                         .map { |status, count| { status: status, count: count } }

      type_breakdown = Employee
                       .where(employment_status: "Active")
                       .group(:employment_type)
                       .count
                       .map { |type, count| { type: type, count: count } }

      dept_avg_salary = Employee
                        .where(employment_status: "Active")
                        .where.not(department: nil)
                        .group(:department)
                        .order("AVG(salary) DESC")
                        .select(:department, "ROUND(AVG(salary), 2) AS avg_salary", "COUNT(*) AS headcount")
                        .map do |r|
        { department: r.department,
          avg_salary: r.avg_salary.to_f, headcount: r.headcount.to_i }
      end

      {
        total_headcount: row["total_headcount"].to_i,
        active_headcount: row["active_headcount"].to_i,
        avg_salary: row["avg_salary"].to_f,
        median_salary: row["median_salary"].to_f,
        total_payroll: row["total_payroll"].to_f,
        on_probation: row["on_probation"].to_i,
        on_leave: row["on_leave"].to_i,
        reviews_due_90d: row["reviews_due_90d"].to_i,
        dept_breakdown: dept_breakdown,
        status_breakdown: status_breakdown,
        type_breakdown: type_breakdown,
        dept_avg_salary: dept_avg_salary,
      }
    end

    # ── Country salary aggregates ────────────────────────────────────────────────

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
            country: r.country,
            employee_count: r.employee_count.to_i,
            min_salary: r.min_salary.to_f,
            max_salary: r.max_salary.to_f,
            avg_salary: r.avg_salary.to_f,
          }
        end
    end

    # ── Job-title salary aggregates ──────────────────────────────────────────────

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
          job_title: r.job_title,
          country: r.country,
          employee_count: r.employee_count.to_i,
          avg_salary: r.avg_salary.to_f,
        }
      end
    end

    # ── Salary percentiles by country ────────────────────────────────────────────

    def self.salary_percentiles
      ActiveRecord::Base.connection.exec_query(SALARY_PERCENTILES_SQL).map do |row|
        {
          country: row["country"],
          p25: row["p25"].to_f,
          p50: row["p50"].to_f,
          p75: row["p75"].to_f,
          p90: row["p90"].to_f,
        }
      end
    end

    # ── Top earners ──────────────────────────────────────────────────────────────

    def self.top_earners(limit: 10)
      Employee
        .order(salary: :desc)
        .limit(limit)
        .select(:id, :employee_id, :full_name, :first_name, :last_name, :preferred_name,
                :job_title, :department, :country, :salary, :currency,
                :employment_status, :job_level)
        .map do |e|
          {
            id: e.id,
            employee_id: e.employee_id,
            full_name: e.full_name,
            display_name: e.display_name,
            initials: e.initials,
            job_title: e.job_title,
            department: e.department,
            country: e.country,
            salary: e.salary.to_f,
            currency: e.currency,
            employment_status: e.employment_status,
            job_level: e.job_level,
          }
        end
    end
  end
end
