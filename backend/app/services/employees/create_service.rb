# frozen_string_literal: true

module Employees
  class CreateService
    Result = Struct.new(:success, :employee, :errors, keyword_init: true)

    def self.call(attributes)
      employee = Employee.new(attributes)

      if employee.save
        Result.new(success: true, employee: employee, errors: [])
      else
        Result.new(success: false, employee: employee, errors: employee.errors.full_messages)
      end
    end
  end
end
