# frozen_string_literal: true

module Employees
  class ListService
    DEFAULT_PER_PAGE = 25
    MAX_PER_PAGE     = 100

    SORTABLE_COLUMNS = %w[
      id employee_id full_name first_name last_name
      job_title department employment_status employment_type
      job_level country salary salary_band hire_date created_at
    ].freeze
    SORT_ORDERS = %w[asc desc].freeze

    Result = Struct.new(:employees, :total_count, :total_pages, :current_page, :per_page, keyword_init: true)

    def self.call(params)
      new(params).call
    end

    def initialize(params)
      @name        = params[:name].presence
      @email       = params[:email].presence
      @employee_id = params[:employee_id].presence
      @country           = params[:country].presence
      @job_title         = params[:job_title].presence
      @department        = params[:department].presence
      @employment_status = params[:employment_status].presence
      @employment_type   = params[:employment_type].presence
      @job_level         = params[:job_level].presence
      @salary_band       = params[:salary_band].presence
      @manager_name      = params[:manager_name].presence
      @salary_min    = params[:salary_min].presence&.to_f
      @salary_max    = params[:salary_max].presence&.to_f
      @hire_date_from = params[:hire_date_from].presence
      @hire_date_to   = params[:hire_date_to].presence
      @sort_by    = SORTABLE_COLUMNS.include?(params[:sort_by]) ? params[:sort_by] : "id"
      @sort_order = SORT_ORDERS.include?(params[:sort_order]&.downcase) ? params[:sort_order].downcase : "asc"
      @page       = [params.fetch(:page, 1).to_i, 1].max
      @per_page   = params.fetch(:per_page, DEFAULT_PER_PAGE).to_i.clamp(1, MAX_PER_PAGE)
    end

    def call
      paginated = build_scope.page(@page).per(@per_page)

      Result.new(
        employees: paginated.to_a,
        total_count: paginated.total_count,
        total_pages: paginated.total_pages,
        current_page: paginated.current_page,
        per_page: paginated.limit_value,
      )
    end

    private

    attr_reader :name, :email, :employee_id,
                :country, :job_title, :department, :employment_status,
                :employment_type, :job_level, :salary_band, :manager_name,
                :salary_min, :salary_max, :hire_date_from, :hire_date_to,
                :sort_by, :sort_order

    def build_scope
      col   = Employee.connection.quote_column_name(sort_by)
      scope = Employee.order(Arel.sql("#{col} #{sort_order}"))

      scope = scope.where("full_name ILIKE ?", "%#{name}%")          if name
      scope = scope.where("work_email ILIKE ?", "%#{email}%")        if email
      scope = scope.where("employee_id ILIKE ?", "%#{employee_id}%") if employee_id
      scope = scope.by_country(country)                               if country
      scope = scope.by_job_title(job_title)                           if job_title
      scope = scope.by_department(department)                         if department
      scope = scope.by_status(employment_status)                      if employment_status
      scope = scope.by_type(employment_type)                          if employment_type
      scope = scope.by_salary_band(salary_band)                       if salary_band
      scope = scope.where(job_level: job_level) if job_level
      scope = scope.where("manager_name ILIKE ?", "%#{manager_name}%") if manager_name
      scope = scope.where(salary: salary_min..)                  if salary_min
      scope = scope.where(salary: ..salary_max)                  if salary_max
      scope = scope.where(hire_date: hire_date_from..)           if hire_date_from
      scope = scope.where(hire_date: ..hire_date_to)             if hire_date_to
      scope
    end
  end
end
