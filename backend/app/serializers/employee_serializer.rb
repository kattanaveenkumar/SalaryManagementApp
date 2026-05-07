# frozen_string_literal: true

class EmployeeSerializer
  def self.call(employee)
    {
      id: employee.id,
      employee_id: employee.employee_id,
      # Name
      first_name: employee.first_name,
      last_name: employee.last_name,
      preferred_name: employee.preferred_name,
      full_name: employee.full_name,
      display_name: employee.display_name,
      initials: employee.initials,
      # Contact
      work_email: employee.work_email,
      phone_number: employee.phone_number,
      # Employment
      job_title: employee.job_title,
      job_level: employee.job_level,
      department: employee.department,
      business_unit: employee.business_unit,
      employment_status: employee.employment_status,
      employment_type: employee.employment_type,
      manager_name: employee.manager_name,
      work_location: employee.work_location,
      country: employee.country,
      # Compensation
      salary: employee.salary.to_f,
      currency: employee.currency,
      salary_band: employee.salary_band,
      bonus_percentage: employee.bonus_percentage&.to_f,
      stock_grant_value: employee.stock_grant_value&.to_f,
      # Dates
      hire_date: employee.hire_date&.iso8601,
      compensation_review_date: employee.compensation_review_date&.iso8601,
      # Misc
      notes: employee.notes,
      created_at: employee.created_at.iso8601,
      updated_at: employee.updated_at.iso8601,
    }
  end
end
