# frozen_string_literal: true

require "rails_helper"

RSpec.describe Employees::CreateService do
  describe ".call" do
    context "with valid attributes" do
      let(:attributes) do
        { full_name: "Alice Smith", job_title: "Manager", country: "Germany", salary: 90_000 }
      end

      it "returns a successful result" do
        result = described_class.call(attributes)
        expect(result.success).to be true
      end

      it "persists the employee" do
        expect { described_class.call(attributes) }.to change(Employee, :count).by(1)
      end

      it "returns the created employee" do
        result = described_class.call(attributes)
        expect(result.employee).to be_a(Employee)
        expect(result.employee).to be_persisted
      end

      it "returns no errors" do
        result = described_class.call(attributes)
        expect(result.errors).to be_empty
      end
    end

    context "with invalid attributes" do
      let(:attributes) { { full_name: "", job_title: "Engineer", country: "US", salary: 50_000 } }

      it "returns a failed result" do
        result = described_class.call(attributes)
        expect(result.success).to be false
      end

      it "does not persist the employee" do
        expect { described_class.call(attributes) }.not_to change(Employee, :count)
      end

      it "returns validation error messages" do
        result = described_class.call(attributes)
        expect(result.errors).not_to be_empty
      end
    end

    context "with salary below minimum" do
      let(:attributes) do
        { full_name: "Bob Jones", job_title: "Analyst", country: "France", salary: 1_000 }
      end

      it "returns a failed result" do
        result = described_class.call(attributes)
        expect(result.success).to be false
      end

      it "includes a salary error" do
        result = described_class.call(attributes)
        expect(result.errors.join).to match(/salary/i)
      end
    end
  end
end
