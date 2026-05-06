# frozen_string_literal: true

class EmployeeSerializer
  def self.call(employee)
    {
      id:         employee.id,
      full_name:  employee.full_name,
      job_title:  employee.job_title,
      country:    employee.country,
      salary:     employee.salary.to_f,
      created_at: employee.created_at.iso8601,
      updated_at: employee.updated_at.iso8601,
    }
  end
end
