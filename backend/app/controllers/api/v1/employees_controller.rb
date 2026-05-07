# frozen_string_literal: true

module Api
  module V1
    class EmployeesController < ApplicationController
      before_action :set_employee, only: %i[show update destroy]

      # GET /api/v1/employees?page=1&per_page=25&country=US&job_title=Engineer
      def index
        result = Employees::ListService.call(list_params)

        render json: {
          data: result.employees.map { |e| EmployeeSerializer.call(e) },
          meta: {
            total_count: result.total_count,
            total_pages: result.total_pages,
            current_page: result.current_page,
            per_page: result.per_page,
          },
        }
      end

      # GET /api/v1/employees/:id
      def show
        render json: { data: EmployeeSerializer.call(@employee) }
      end

      # POST /api/v1/employees
      def create
        result = Employees::CreateService.call(employee_params)

        if result.success
          render json: { data: EmployeeSerializer.call(result.employee) }, status: :created
        else
          render json: { errors: result.errors }, status: :unprocessable_content
        end
      end

      # PATCH /api/v1/employees/:id
      def update
        result = Employees::UpdateService.call(@employee, employee_params)

        if result.success
          render json: { data: EmployeeSerializer.call(result.employee) }
        else
          render json: { errors: result.errors }, status: :unprocessable_content
        end
      end

      # DELETE /api/v1/employees/:id
      def destroy
        @employee.destroy!
        head :no_content
      end

      private

      def set_employee
        @employee = Employee.find(params[:id])
      end

      def employee_params
        params.require(:employee).permit(
          :first_name, :last_name, :preferred_name, :full_name,
          :work_email, :phone_number,
          :job_title, :job_level, :department, :business_unit,
          :employment_status, :employment_type,
          :manager_name, :work_location, :country,
          :salary, :currency, :salary_band, :bonus_percentage, :stock_grant_value,
          :hire_date, :compensation_review_date,
          :notes
        )
      end

      def list_params
        params.permit(
          :name, :email, :employee_id,
          :country, :job_title, :department, :employment_status, :employment_type,
          :job_level, :salary_band, :manager_name,
          :salary_min, :salary_max,
          :hire_date_from, :hire_date_to,
          :sort_by, :sort_order, :page, :per_page
        )
      end
    end
  end
end
