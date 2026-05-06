# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Insights", type: :request do
  let(:json) { response.parsed_body }

  before do
    create(:employee, country: "United States", job_title: "Engineer", salary: 80_000)
    create(:employee, country: "United States", job_title: "Designer", salary: 60_000)
    create(:employee, country: "Germany",       job_title: "Analyst",  salary: 75_000)
  end

  # ── GET /api/v1/insights/country_salaries ────────────────────────────────────

  describe "GET /api/v1/insights/country_salaries" do
    before { get "/api/v1/insights/country_salaries" }

    it "returns 200 OK" do
      expect(response).to have_http_status(:ok)
    end

    it "returns data array with one entry per country" do
      expect(json["data"].length).to eq(2)
    end

    it "includes expected keys in each entry" do
      entry = json["data"].first
      expect(entry.keys).to include("country", "employee_count", "min_salary", "max_salary", "avg_salary")
    end
  end

  # ── GET /api/v1/insights/job_title_salaries ──────────────────────────────────

  describe "GET /api/v1/insights/job_title_salaries" do
    it "returns 200 OK" do
      get "/api/v1/insights/job_title_salaries"
      expect(response).to have_http_status(:ok)
    end

    it "returns all job title rows when no filter" do
      get "/api/v1/insights/job_title_salaries"
      expect(json["data"].length).to eq(3)
    end

    it "includes meta with country_filter key" do
      get "/api/v1/insights/job_title_salaries"
      expect(json["meta"]).to have_key("country_filter")
    end

    it "filters by country param" do
      get "/api/v1/insights/job_title_salaries", params: { country: "Germany" }
      expect(json["data"].length).to eq(1)
      expect(json["data"].first["country"]).to eq("Germany")
    end

    it "sets country_filter in meta when param provided" do
      get "/api/v1/insights/job_title_salaries", params: { country: "Germany" }
      expect(json["meta"]["country_filter"]).to eq("Germany")
    end
  end

  # ── GET /api/v1/insights/salary_percentiles ──────────────────────────────────

  describe "GET /api/v1/insights/salary_percentiles" do
    before { get "/api/v1/insights/salary_percentiles" }

    it "returns 200 OK" do
      expect(response).to have_http_status(:ok)
    end

    it "returns one row per country" do
      expect(json["data"].length).to eq(2)
    end

    it "includes p25, p50, p75, p90 in each row" do
      entry = json["data"].first
      expect(entry.keys).to include("p25", "p50", "p75", "p90", "country")
    end
  end

  # ── GET /api/v1/insights/top_earners ────────────────────────────────────────

  describe "GET /api/v1/insights/top_earners" do
    it "returns 200 OK" do
      get "/api/v1/insights/top_earners"
      expect(response).to have_http_status(:ok)
    end

    it "returns up to 10 earners by default" do
      get "/api/v1/insights/top_earners"
      expect(json["data"].length).to be <= 10
    end

    it "respects the limit param" do
      get "/api/v1/insights/top_earners", params: { limit: 1 }
      expect(json["data"].length).to eq(1)
    end

    it "returns employees in descending salary order" do
      get "/api/v1/insights/top_earners"
      salaries = json["data"].map { |e| e["salary"] }
      expect(salaries).to eq(salaries.sort.reverse)
    end

    it "includes expected fields for each earner" do
      get "/api/v1/insights/top_earners"
      entry = json["data"].first
      expect(entry.keys).to include("id", "full_name", "job_title", "country", "salary")
    end
  end
end
