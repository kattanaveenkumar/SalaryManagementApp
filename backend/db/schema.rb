# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.1].define(version: 2026_05_07_120000) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "employees", force: :cascade do |t|
    t.string "full_name", null: false
    t.string "job_title", null: false
    t.string "country", null: false
    t.decimal "salary", precision: 12, scale: 2, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "employee_id"
    t.string "first_name"
    t.string "last_name"
    t.string "preferred_name"
    t.string "work_email"
    t.string "phone_number"
    t.string "employment_status", default: "Active", null: false
    t.string "employment_type", default: "Full-Time", null: false
    t.string "department"
    t.string "business_unit"
    t.string "job_level"
    t.string "manager_name"
    t.string "work_location"
    t.string "currency", default: "USD", null: false
    t.string "salary_band"
    t.decimal "bonus_percentage", precision: 5, scale: 2
    t.decimal "stock_grant_value", precision: 14, scale: 2
    t.date "hire_date"
    t.date "compensation_review_date"
    t.text "notes"
    t.index ["country", "job_title", "salary"], name: "index_employees_on_country_and_job_title_and_salary"
    t.index ["country", "salary"], name: "index_employees_on_country_and_salary"
    t.index ["country"], name: "index_employees_on_country"
    t.index ["department", "employment_status"], name: "index_employees_on_department_and_employment_status"
    t.index ["department"], name: "index_employees_on_department"
    t.index ["employee_id"], name: "index_employees_on_employee_id", unique: true
    t.index ["employment_status"], name: "index_employees_on_employment_status"
    t.index ["employment_type"], name: "index_employees_on_employment_type"
    t.index ["hire_date"], name: "index_employees_on_hire_date"
    t.index ["job_level"], name: "index_employees_on_job_level"
    t.index ["job_title"], name: "index_employees_on_job_title"
    t.index ["salary"], name: "index_employees_on_salary"
    t.index ["salary_band"], name: "index_employees_on_salary_band"
    t.index ["work_email"], name: "index_employees_on_work_email", unique: true, where: "(work_email IS NOT NULL)"
  end

  create_table "users", force: :cascade do |t|
    t.string "email", null: false
    t.string "password_digest", null: false
    t.string "role", default: "hr_manager", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
  end

end
