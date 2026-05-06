# frozen_string_literal: true

class CreateEmployees < ActiveRecord::Migration[7.1]
  def change
    create_table :employees do |t|
      t.string :full_name, null: false
      t.string :job_title, null: false
      t.string :country,   null: false
      t.decimal :salary, precision: 12, scale: 2, null: false

      t.timestamps
    end

    # Single-column indexes: support WHERE and GROUP BY on individual fields
    add_index :employees, :country
    add_index :employees, :job_title
    add_index :employees, :salary

    # Composite covering index for insight query:
    #   SELECT country, MIN(salary), MAX(salary), AVG(salary)
    #   GROUP BY country
    # PostgreSQL can satisfy this with an index-only scan (no heap access)
    add_index :employees, %i[country salary]

    # Composite covering index for insight query:
    #   SELECT job_title, AVG(salary) ... WHERE country = ?
    #   GROUP BY job_title
    add_index :employees, %i[country job_title salary]
  end
end
