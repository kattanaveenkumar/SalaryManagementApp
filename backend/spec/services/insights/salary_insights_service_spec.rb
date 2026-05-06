# frozen_string_literal: true

require "rails_helper"

RSpec.describe Insights::SalaryInsightsService do
  before do
    create(:employee, country: "United States", job_title: "Engineer",  salary: 80_000)
    create(:employee, country: "United States", job_title: "Engineer",  salary: 100_000)
    create(:employee, country: "United States", job_title: "Designer",  salary: 60_000)
    create(:employee, country: "Germany",       job_title: "Analyst",   salary: 70_000)
    create(:employee, country: "Germany",       job_title: "Analyst",   salary: 90_000)
  end

  describe ".country_salaries" do
    subject(:result) { described_class.country_salaries }

    it "returns one row per country" do
      countries = result.map { |r| r[:country] }
      expect(countries).to match_array(["Germany", "United States"])
    end

    it "returns correct aggregate values for a country" do
      us = result.find { |r| r[:country] == "United States" }
      expect(us[:employee_count]).to eq(3)
      expect(us[:min_salary]).to eq(60_000.0)
      expect(us[:max_salary]).to eq(100_000.0)
      expect(us[:avg_salary]).to be_within(0.01).of(80_000.0)
    end

    it "orders results alphabetically by country" do
      countries = result.map { |r| r[:country] }
      expect(countries).to eq(countries.sort)
    end

    it "returns all numeric fields as Float" do
      result.each do |row|
        %i[min_salary max_salary avg_salary].each do |field|
          expect(row[field]).to be_a(Float), "expected #{field} to be Float"
        end
      end
    end
  end

  describe ".job_title_salaries" do
    subject(:result) { described_class.job_title_salaries }

    it "returns one row per country+job_title combination" do
      expect(result.length).to eq(3)
    end

    it "returns avg_salary as Float" do
      result.each { |row| expect(row[:avg_salary]).to be_a(Float) }
    end

    it "orders results by avg_salary descending" do
      salaries = result.map { |r| r[:avg_salary] }
      expect(salaries).to eq(salaries.sort.reverse)
    end

    context "with country filter" do
      it "returns only rows for that country" do
        filtered = described_class.job_title_salaries(country: "Germany")
        expect(filtered.map { |r| r[:country] }.uniq).to eq(["Germany"])
      end

      it "returns empty array when no employees match" do
        expect(described_class.job_title_salaries(country: "Japan")).to be_empty
      end
    end
  end

  describe ".salary_percentiles" do
    subject(:result) { described_class.salary_percentiles }

    it "returns one row per country" do
      countries = result.map { |r| r[:country] }
      expect(countries).to match_array(["Germany", "United States"])
    end

    it "returns p25, p50, p75, p90 as Float" do
      result.each do |row|
        %i[p25 p50 p75 p90].each do |pct|
          expect(row[pct]).to be_a(Float), "expected #{pct} to be Float"
        end
      end
    end

    it "returns percentiles in ascending order (p25 <= p50 <= p75 <= p90)" do
      result.each do |row|
        expect(row[:p25]).to be <= row[:p50]
        expect(row[:p50]).to be <= row[:p75]
        expect(row[:p75]).to be <= row[:p90]
      end
    end
  end

  describe ".top_earners" do
    it "returns up to the requested number of employees" do
      expect(described_class.top_earners(limit: 3).length).to eq(3)
    end

    it "returns employees ordered by salary descending" do
      salaries = described_class.top_earners(limit: 5).map { |e| e[:salary] }
      expect(salaries).to eq(salaries.sort.reverse)
    end

    it "returns the expected fields for each record" do
      record = described_class.top_earners(limit: 1).first
      expect(record.keys).to match_array(%i[id full_name job_title country salary])
    end

    it "returns salary as Float" do
      described_class.top_earners(limit: 5).each { |e| expect(e[:salary]).to be_a(Float) }
    end

    it "defaults limit to 10" do
      create_list(:employee, 10)
      expect(described_class.top_earners.length).to eq(10)
    end
  end
end
