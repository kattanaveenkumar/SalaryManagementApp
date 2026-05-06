# frozen_string_literal: true

require "rails_helper"

RSpec.describe Employees::UpdateService do
  let(:employee) { create(:employee, salary: 60_000) }

  describe ".call" do
    context "with valid attributes" do
      let(:attributes) { { salary: 80_000, job_title: "Senior Engineer" } }

      it "returns a successful result" do
        result = described_class.call(employee, attributes)
        expect(result.success).to be true
      end

      it "updates the employee attributes" do
        described_class.call(employee, attributes)
        expect(employee.reload.salary).to eq(80_000)
        expect(employee.reload.job_title).to eq("Senior Engineer")
      end

      it "returns the updated employee" do
        result = described_class.call(employee, attributes)
        expect(result.employee).to eq(employee)
      end

      it "returns no errors" do
        result = described_class.call(employee, attributes)
        expect(result.errors).to be_empty
      end
    end

    context "with invalid attributes" do
      let(:attributes) { { full_name: "" } }

      it "returns a failed result" do
        result = described_class.call(employee, attributes)
        expect(result.success).to be false
      end

      it "does not change the employee" do
        original_name = employee.full_name
        described_class.call(employee, attributes)
        expect(employee.reload.full_name).to eq(original_name)
      end

      it "returns validation error messages" do
        result = described_class.call(employee, attributes)
        expect(result.errors).not_to be_empty
      end
    end
  end
end
