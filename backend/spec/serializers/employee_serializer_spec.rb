# frozen_string_literal: true

require "rails_helper"

RSpec.describe EmployeeSerializer do
  subject(:serialized) { described_class.call(employee) }

  let(:employee) do
    create(
      :employee,
      first_name: "Jane",
      last_name: "Doe",
      job_title: "Engineer",
      country: "Canada",
      salary: 95_000,
    )
  end

  # ── Shape ─────────────────────────────────────────────────────────────────────

  describe "shape" do
    it "returns exactly the enterprise schema keys — no additions, no omissions" do
      expect(serialized.keys).to match_array(%i[
                                               id employee_id
                                               first_name last_name preferred_name full_name display_name initials
                                               work_email phone_number
                                               job_title job_level department business_unit
                                               employment_status employment_type manager_name work_location country
                                               salary currency salary_band bonus_percentage stock_grant_value
                                               hire_date compensation_review_date notes
                                               created_at updated_at
                                             ])
    end
  end

  # ── Identity & computed fields ────────────────────────────────────────────────

  describe "identity fields" do
    it "returns the correct id" do
      expect(serialized[:id]).to eq(employee.id)
    end

    it "derives full_name from first and last name" do
      expect(serialized[:full_name]).to eq("Jane Doe")
    end

    it "returns computed display_name" do
      expect(serialized[:display_name]).to eq(employee.display_name)
    end

    it "returns computed initials" do
      expect(serialized[:initials]).to eq("JD")
    end
  end

  # ── Employment fields ─────────────────────────────────────────────────────────

  describe "employment fields" do
    it "returns the correct job_title" do
      expect(serialized[:job_title]).to eq("Engineer")
    end

    it "returns the correct country" do
      expect(serialized[:country]).to eq("Canada")
    end
  end

  # ── Compensation fields ───────────────────────────────────────────────────────

  describe "compensation fields" do
    it "returns salary as a Float" do
      expect(serialized[:salary]).to eq(95_000.0)
      expect(serialized[:salary]).to be_a(Float)
    end

    it "returns nil bonus_percentage when not set" do
      expect(serialized[:bonus_percentage]).to be_nil
    end

    it "returns nil stock_grant_value when not set" do
      expect(serialized[:stock_grant_value]).to be_nil
    end
  end

  # ── Timestamps ────────────────────────────────────────────────────────────────

  describe "timestamps" do
    it "returns created_at as ISO 8601" do
      expect(serialized[:created_at]).to eq(employee.created_at.iso8601)
    end

    it "returns updated_at as ISO 8601" do
      expect(serialized[:updated_at]).to eq(employee.updated_at.iso8601)
    end
  end
end
