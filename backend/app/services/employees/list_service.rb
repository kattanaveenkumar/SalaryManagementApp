# frozen_string_literal: true

module Employees
  class ListService
    DEFAULT_PER_PAGE = 25
    MAX_PER_PAGE     = 100

    Result = Struct.new(:employees, :total_count, :total_pages, :current_page, :per_page, keyword_init: true)

    def self.call(params)
      new(params).call
    end

    def initialize(params)
      @country   = params[:country].presence
      @job_title = params[:job_title].presence
      @page      = [params.fetch(:page, 1).to_i, 1].max
      @per_page  = [[params.fetch(:per_page, DEFAULT_PER_PAGE).to_i, 1].max, MAX_PER_PAGE].min
    end

    def call
      paginated = build_scope.page(@page).per(@per_page)

      Result.new(
        employees:    paginated.to_a,
        total_count:  paginated.total_count,
        total_pages:  paginated.total_pages,
        current_page: paginated.current_page,
        per_page:     paginated.limit_value,
      )
    end

    private

    attr_reader :country, :job_title

    def build_scope
      scope = Employee.order(id: :asc)
      scope = scope.by_country(country)     if country
      scope = scope.by_job_title(job_title) if job_title
      scope
    end
  end
end
