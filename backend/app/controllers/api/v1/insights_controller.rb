# frozen_string_literal: true

module Api
  module V1
    class InsightsController < ApplicationController
      # GET /api/v1/insights/company_kpis
      def company_kpis
        render json: { data: Insights::SalaryInsightsService.company_kpis }
      end

      # GET /api/v1/insights/country_salaries
      def country_salaries
        render json: { data: Insights::SalaryInsightsService.country_salaries }
      end

      # GET /api/v1/insights/job_title_salaries?country=United+States
      def job_title_salaries
        data = Insights::SalaryInsightsService.job_title_salaries(
          country: params[:country].presence,
        )
        render json: {
          data: data,
          meta: { country_filter: params[:country].presence },
        }
      end

      # GET /api/v1/insights/salary_percentiles
      def salary_percentiles
        render json: { data: Insights::SalaryInsightsService.salary_percentiles }
      end

      # GET /api/v1/insights/top_earners?limit=10
      def top_earners
        limit = params.fetch(:limit, 10).to_i.clamp(1, 100)
        render json: { data: Insights::SalaryInsightsService.top_earners(limit: limit) }
      end
    end
  end
end
