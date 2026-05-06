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
            total_count:  result.total_count,
            total_pages:  result.total_pages,
            current_page: result.current_page,
            per_page:     result.per_page,
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
          render json: { errors: result.errors }, status: :unprocessable_entity
        end
      end

      # PATCH /api/v1/employees/:id
      def update
        result = Employees::UpdateService.call(@employee, employee_params)

        if result.success
          render json: { data: EmployeeSerializer.call(result.employee) }
        else
          render json: { errors: result.errors }, status: :unprocessable_entity
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
        params.require(:employee).permit(:full_name, :job_title, :country, :salary)
      end

      def list_params
        params.permit(:country, :job_title, :page, :per_page)
      end
    end
  end
end
