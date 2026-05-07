# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Employees", type: :request do
  let(:headers) { auth_headers }
  let(:json)    { response.parsed_body }

  # ── GET /api/v1/employees ────────────────────────────────────────────────────

  describe "GET /api/v1/employees" do
    before { create_list(:employee, 3) }

    it "returns 200 OK" do
      get "/api/v1/employees", headers: headers
      expect(response).to have_http_status(:ok)
    end

    it "returns all employees in data array" do
      get "/api/v1/employees", headers: headers
      expect(json["data"].length).to eq(3)
    end

    it "includes pagination metadata" do
      get "/api/v1/employees", headers: headers
      expect(json["meta"]).to include("total_count", "total_pages", "current_page", "per_page")
    end

    it "filters by country" do
      create(:employee, country: "Japan")
      get "/api/v1/employees", params: { country: "Japan" }, headers: headers
      expect(json["data"].length).to eq(1)
      expect(json["data"].first["country"]).to eq("Japan")
    end

    it "filters by job_title" do
      create(:employee, job_title: "CTO")
      get "/api/v1/employees", params: { job_title: "CTO" }, headers: headers
      expect(json["data"].all? { |e| e["job_title"] == "CTO" }).to be true
    end

    it "filters by name (case-insensitive partial match)" do
      create(:employee, full_name: "Naveen Kumar")
      get "/api/v1/employees", params: { name: "naveen" }, headers: headers
      expect(json["data"].length).to eq(1)
      expect(json["data"].first["full_name"]).to eq("Naveen Kumar")
    end

    it "filters by salary_min" do
      create(:employee, salary: 30_000)
      create(:employee, salary: 80_000)
      get "/api/v1/employees", params: { salary_min: 50_000 }, headers: headers
      salaries = json["data"].pluck("salary")
      expect(salaries).to all(be >= 50_000)
    end

    it "filters by salary_max" do
      create(:employee, salary: 30_000)
      create(:employee, salary: 80_000)
      get "/api/v1/employees", params: { salary_max: 50_000 }, headers: headers
      salaries = json["data"].pluck("salary")
      expect(salaries).to all(be <= 50_000)
    end

    it "respects per_page param" do
      get "/api/v1/employees", params: { per_page: 2 }, headers: headers
      expect(json["data"].length).to eq(2)
    end

    it "sorts by salary descending" do
      get "/api/v1/employees", params: { sort_by: "salary", sort_order: "desc" }, headers: headers
      salaries = json["data"].pluck("salary")
      expect(salaries).to eq(salaries.sort.reverse)
    end
  end

  # ── GET /api/v1/employees/:id ────────────────────────────────────────────────

  describe "GET /api/v1/employees/:id" do
    let(:employee) { create(:employee) }

    it "returns 200 OK" do
      get "/api/v1/employees/#{employee.id}", headers: headers
      expect(response).to have_http_status(:ok)
    end

    it "returns the employee data" do
      get "/api/v1/employees/#{employee.id}", headers: headers
      expect(json["data"]["id"]).to eq(employee.id)
      expect(json["data"]["full_name"]).to eq(employee.full_name)
    end

    it "returns 404 for a non-existent id" do
      get "/api/v1/employees/0", headers: headers
      expect(response).to have_http_status(:not_found)
    end
  end

  # ── POST /api/v1/employees ───────────────────────────────────────────────────

  describe "POST /api/v1/employees" do
    let(:valid_params) do
      { employee: { full_name: "New Person", job_title: "Dev", country: "France", salary: 55_000 } }.to_json
    end

    it "returns 201 Created on success" do
      post "/api/v1/employees", params: valid_params, headers: headers
      expect(response).to have_http_status(:created)
    end

    it "creates a new employee record" do
      expect { post "/api/v1/employees", params: valid_params, headers: headers }.to change(Employee, :count).by(1)
    end

    it "returns the created employee" do
      post "/api/v1/employees", params: valid_params, headers: headers
      expect(json["data"]["full_name"]).to eq("New Person")
    end

    it "returns 422 for invalid params" do
      post "/api/v1/employees",
           params: { employee: { full_name: "" } }.to_json,
           headers: headers
      expect(response).to have_http_status(:unprocessable_entity)
    end

    it "returns error messages on validation failure" do
      post "/api/v1/employees",
           params: { employee: { full_name: "" } }.to_json,
           headers: headers
      expect(json["errors"]).not_to be_empty
    end

    it "returns 422 when the employee param key is missing" do
      post "/api/v1/employees", params: { name: "oops" }.to_json, headers: headers
      expect(response).to have_http_status(:unprocessable_entity)
    end
  end

  # ── PATCH /api/v1/employees/:id ─────────────────────────────────────────────

  describe "PATCH /api/v1/employees/:id" do
    let(:employee) { create(:employee, salary: 50_000) }

    it "returns 200 OK on success" do
      patch "/api/v1/employees/#{employee.id}",
            params: { employee: { salary: 70_000 } }.to_json,
            headers: headers
      expect(response).to have_http_status(:ok)
    end

    it "updates the employee" do
      patch "/api/v1/employees/#{employee.id}",
            params: { employee: { salary: 70_000 } }.to_json,
            headers: headers
      expect(employee.reload.salary).to eq(70_000)
    end

    it "returns the updated employee data" do
      patch "/api/v1/employees/#{employee.id}",
            params: { employee: { salary: 70_000 } }.to_json,
            headers: headers
      expect(json["data"]["salary"]).to eq(70_000.0)
    end

    it "returns 422 for invalid data" do
      patch "/api/v1/employees/#{employee.id}",
            params: { employee: { full_name: "" } }.to_json,
            headers: headers
      expect(response).to have_http_status(:unprocessable_entity)
    end

    it "returns 404 for a non-existent employee" do
      patch "/api/v1/employees/0",
            params: { employee: { salary: 70_000 } }.to_json,
            headers: headers
      expect(response).to have_http_status(:not_found)
    end
  end

  # ── DELETE /api/v1/employees/:id ────────────────────────────────────────────

  describe "DELETE /api/v1/employees/:id" do
    let!(:employee) { create(:employee) }

    it "returns 204 No Content" do
      delete "/api/v1/employees/#{employee.id}", headers: headers
      expect(response).to have_http_status(:no_content)
    end

    it "removes the employee record" do
      expect { delete "/api/v1/employees/#{employee.id}", headers: headers }.to change(Employee, :count).by(-1)
    end

    it "returns 404 for a non-existent employee" do
      delete "/api/v1/employees/0", headers: headers
      expect(response).to have_http_status(:not_found)
    end
  end
end
