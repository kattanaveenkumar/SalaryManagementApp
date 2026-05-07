# frozen_string_literal: true

class ExtendEmployeesEnterprise < ActiveRecord::Migration[7.1]
  def change
    change_table :employees, bulk: true do |t|
      # Core identity
      t.string  :employee_id # EMP-2026-001234
      t.string  :first_name
      t.string  :last_name
      t.string  :preferred_name
      t.string  :work_email
      t.string  :phone_number

      # Employment classification
      t.string  :employment_status, null: false, default: "Active"
      t.string  :employment_type,   null: false, default: "Full-Time"
      t.string  :department
      t.string  :business_unit
      t.string  :job_level
      t.string  :manager_name
      t.string  :work_location

      # Compensation
      t.string  :currency, null: false, default: "USD"
      t.string  :salary_band
      t.decimal :bonus_percentage,   precision: 5,  scale: 2
      t.decimal :stock_grant_value,  precision: 14, scale: 2

      # Key dates
      t.date    :hire_date
      t.date    :compensation_review_date

      # Misc
      t.text    :notes
    end

    # Indexes for filter + reporting queries
    add_index :employees, :employee_id, unique: true
    add_index :employees, :department
    add_index :employees, :employment_status
    add_index :employees, :employment_type
    add_index :employees, :job_level
    add_index :employees, :salary_band
    add_index :employees, :hire_date
    add_index :employees, :work_email, unique: true, where: "work_email IS NOT NULL"
    add_index :employees, %i[department employment_status]
  end
end
