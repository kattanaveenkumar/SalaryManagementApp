# frozen_string_literal: true

require "rails_helper"

RSpec.describe Employees::ListService do
  describe ".call" do
    before do
      create(:employee, full_name: "Alice Smith",  country: "United States", job_title: "Engineer", salary: 80_000)
      create(:employee, full_name: "Bob Jones",    country: "United States", job_title: "Designer", salary: 65_000)
      create(:employee, full_name: "Carlos Müller", country: "Germany",      job_title: "Engineer", salary: 75_000)
    end

    context "without filters" do
      it "returns all employees" do
        result = described_class.call({})
        expect(result.total_count).to eq(3)
      end

      it "returns employees ordered by id ascending by default" do
        result = described_class.call({})
        ids = result.employees.map(&:id)
        expect(ids).to eq(ids.sort)
      end
    end

    context "with country filter" do
      it "returns only employees in that country" do
        result = described_class.call(country: "United States")
        expect(result.total_count).to eq(2)
        expect(result.employees.map(&:country).uniq).to eq(["United States"])
      end
    end

    context "with job_title filter" do
      it "returns only employees with that job title" do
        result = described_class.call(job_title: "Engineer")
        expect(result.total_count).to eq(2)
        expect(result.employees.map(&:job_title).uniq).to eq(["Engineer"])
      end
    end

    context "with name filter" do
      it "returns employees whose name contains the search term (case-insensitive)" do
        result = described_class.call(name: "alice")
        expect(result.total_count).to eq(1)
        expect(result.employees.first.full_name).to eq("Alice Smith")
      end

      it "supports partial matches" do
        result = described_class.call(name: "jones")
        expect(result.total_count).to eq(1)
      end
    end

    context "with salary_min filter" do
      it "returns only employees earning at or above the minimum" do
        result = described_class.call(salary_min: "75000")
        expect(result.employees.map(&:salary)).to all(be >= 75_000)
      end
    end

    context "with salary_max filter" do
      it "returns only employees earning at or below the maximum" do
        result = described_class.call(salary_max: "70000")
        expect(result.employees.map(&:salary)).to all(be <= 70_000)
      end
    end

    context "with salary range filter" do
      it "returns employees within the range" do
        result = described_class.call(salary_min: "70000", salary_max: "80000")
        salaries = result.employees.map(&:salary)
        expect(salaries).to all(be_between(70_000, 80_000))
      end
    end

    context "with both country and job_title filters" do
      it "returns employees matching both" do
        result = described_class.call(country: "United States", job_title: "Engineer")
        expect(result.total_count).to eq(1)
      end
    end

    context "with sort parameters" do
      it "sorts by salary ascending" do
        result = described_class.call(sort_by: "salary", sort_order: "asc")
        salaries = result.employees.map { |e| e.salary.to_f }
        expect(salaries).to eq(salaries.sort)
      end

      it "sorts by salary descending" do
        result = described_class.call(sort_by: "salary", sort_order: "desc")
        salaries = result.employees.map { |e| e.salary.to_f }
        expect(salaries).to eq(salaries.sort.reverse)
      end

      it "ignores invalid sort_by column (defaults to id)" do
        result = described_class.call(sort_by: "DROP TABLE employees;", sort_order: "asc")
        ids = result.employees.map(&:id)
        expect(ids).to eq(ids.sort)
      end

      it "ignores invalid sort_order (defaults to asc)" do
        result = described_class.call(sort_by: "salary", sort_order: "DROP TABLE;")
        salaries = result.employees.map { |e| e.salary.to_f }
        expect(salaries).to eq(salaries.sort)
      end
    end

    context "when paginating" do
      before { create_list(:employee, 10) }

      it "respects per_page" do
        result = described_class.call(per_page: 5)
        expect(result.employees.length).to eq(5)
        expect(result.per_page).to eq(5)
      end

      it "returns the correct page" do
        first_page  = described_class.call(page: 1, per_page: 5)
        second_page = described_class.call(page: 2, per_page: 5)
        expect(first_page.employees.map(&:id) & second_page.employees.map(&:id)).to be_empty
      end

      it "returns correct pagination metadata" do
        result = described_class.call(per_page: 5)
        expect(result.current_page).to eq(1)
        expect(result.total_pages).to be > 1
      end

      it "caps per_page at MAX_PER_PAGE" do
        result = described_class.call(per_page: 9999)
        expect(result.per_page).to eq(described_class::MAX_PER_PAGE)
      end

      it "defaults page to 1 when not specified" do
        result = described_class.call({})
        expect(result.current_page).to eq(1)
      end
    end
  end
end
