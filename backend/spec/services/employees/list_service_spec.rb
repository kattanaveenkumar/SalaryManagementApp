# frozen_string_literal: true

require "rails_helper"

RSpec.describe Employees::ListService do
  describe ".call" do
    before do
      create(:employee, country: "United States", job_title: "Engineer", salary: 80_000)
      create(:employee, country: "United States", job_title: "Designer", salary: 65_000)
      create(:employee, country: "Germany",       job_title: "Engineer", salary: 75_000)
    end

    context "without filters" do
      it "returns all employees" do
        result = described_class.call({})
        expect(result.total_count).to eq(3)
      end

      it "returns employees ordered by id ascending" do
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

    context "with both filters combined" do
      it "returns employees matching both country and job_title" do
        result = described_class.call(country: "United States", job_title: "Engineer")
        expect(result.total_count).to eq(1)
      end
    end

    context "pagination" do
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
