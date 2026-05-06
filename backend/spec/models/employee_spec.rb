# frozen_string_literal: true

require "rails_helper"

RSpec.describe Employee, type: :model do
  subject(:employee) { build(:employee) }

  # ── Validations ───────────────────────────────────────────────────────────────

  describe "validations" do
    it { is_expected.to validate_presence_of(:full_name) }
    it { is_expected.to validate_length_of(:full_name).is_at_least(2).is_at_most(100) }

    it { is_expected.to validate_presence_of(:job_title) }
    it { is_expected.to validate_length_of(:job_title).is_at_least(2).is_at_most(100) }

    it { is_expected.to validate_presence_of(:country) }
    it { is_expected.to validate_length_of(:country).is_at_least(2).is_at_most(100) }

    it { is_expected.to validate_presence_of(:salary) }
    it {
      is_expected.to validate_numericality_of(:salary)
        .is_greater_than_or_equal_to(Employee::MIN_SALARY)
        .is_less_than_or_equal_to(Employee::MAX_SALARY)
    }

    it "is invalid when salary is below minimum" do
      employee.salary = Employee::MIN_SALARY - 1
      expect(employee).not_to be_valid
    end

    it "is invalid when salary is above maximum" do
      employee.salary = Employee::MAX_SALARY + 1
      expect(employee).not_to be_valid
    end

    it "is valid at the minimum salary boundary" do
      employee.salary = Employee::MIN_SALARY
      expect(employee).to be_valid
    end

    it "is valid at the maximum salary boundary" do
      employee.salary = Employee::MAX_SALARY
      expect(employee).to be_valid
    end
  end

  # ── Scopes ────────────────────────────────────────────────────────────────────

  describe "scopes" do
    let!(:us_engineer)    { create(:employee, country: "United States", job_title: "Engineer", salary: 80_000) }
    let!(:uk_engineer)    { create(:employee, country: "United Kingdom", job_title: "Engineer", salary: 70_000) }
    let!(:us_designer)    { create(:employee, country: "United States", job_title: "Designer", salary: 60_000) }
    let!(:top_earner)     { create(:employee, :high_earner) }

    describe ".by_country" do
      it "returns only employees in the given country" do
        result = described_class.by_country("United States")
        expect(result).to include(us_engineer, us_designer)
        expect(result).not_to include(uk_engineer)
      end
    end

    describe ".by_job_title" do
      it "returns only employees with the given job title" do
        result = described_class.by_job_title("Engineer")
        expect(result).to include(us_engineer, uk_engineer)
        expect(result).not_to include(us_designer)
      end
    end

    describe ".top_earners" do
      it "returns employees ordered by salary descending" do
        result = described_class.top_earners(3)
        salaries = result.map(&:salary)
        expect(salaries).to eq(salaries.sort.reverse)
      end

      it "limits results to the given count" do
        expect(described_class.top_earners(2).count).to eq(2)
      end

      it "defaults to 10 results" do
        create_list(:employee, 15)
        expect(described_class.top_earners.count).to eq(10)
      end
    end
  end
end
