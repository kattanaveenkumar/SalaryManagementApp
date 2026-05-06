# frozen_string_literal: true

require "rails_helper"

RSpec.describe EmployeeSerializer do
  subject(:serialized) { described_class.call(employee) }

  let(:employee) { create(:employee, full_name: "Jane Doe", job_title: "Engineer", country: "Canada", salary: 95_000) }

  it "includes the expected keys" do
    expect(serialized.keys).to match_array(%i[id full_name job_title country salary created_at updated_at])
  end

  it "returns the correct id" do
    expect(serialized[:id]).to eq(employee.id)
  end

  it "returns the correct full_name" do
    expect(serialized[:full_name]).to eq("Jane Doe")
  end

  it "returns the correct job_title" do
    expect(serialized[:job_title]).to eq("Engineer")
  end

  it "returns the correct country" do
    expect(serialized[:country]).to eq("Canada")
  end

  it "returns salary as a Float" do
    expect(serialized[:salary]).to eq(95_000.0)
    expect(serialized[:salary]).to be_a(Float)
  end

  it "returns created_at as an ISO 8601 string" do
    expect(serialized[:created_at]).to eq(employee.created_at.iso8601)
  end

  it "returns updated_at as an ISO 8601 string" do
    expect(serialized[:updated_at]).to eq(employee.updated_at.iso8601)
  end
end
