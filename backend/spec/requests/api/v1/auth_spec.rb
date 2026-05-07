# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Auth", type: :request do
  let(:headers) { { "Content-Type" => "application/json" } }

  # ── Signup ─────────────────────────────────────────────────────────────────
  describe "POST /api/v1/auth/signup" do
    let(:valid_params) do
      {
        user: {
          email: "new@example.com",
          password: "password123",
          password_confirmation: "password123",
        },
      }
    end

    context "with valid credentials" do
      it "returns 201 with a token and user payload" do
        post "/api/v1/auth/signup", params: valid_params.to_json, headers: headers

        expect(response).to have_http_status(:created)
        json = response.parsed_body
        expect(json["token"]).to be_present
        expect(json["user"]["email"]).to eq("new@example.com")
        expect(json["user"]["role"]).to eq("hr_manager")
        expect(json["user"]).not_to have_key("password_digest")
      end

      it "persists the user in the database" do
        expect do
          post "/api/v1/auth/signup", params: valid_params.to_json, headers: headers
        end.to change(User, :count).by(1)
      end
    end

    context "with mismatched passwords" do
      it "returns 422 with an errors array" do
        params = valid_params.deep_merge(user: { password_confirmation: "wrong" })
        post "/api/v1/auth/signup", params: params.to_json, headers: headers

        expect(response).to have_http_status(:unprocessable_entity)
        expect(response.parsed_body["errors"]).to be_an(Array)
      end
    end

    context "with duplicate email" do
      before { create(:user, email: "new@example.com") }

      it "returns 422" do
        post "/api/v1/auth/signup", params: valid_params.to_json, headers: headers
        expect(response).to have_http_status(:unprocessable_entity)
      end
    end

    context "with invalid email format" do
      it "returns 422" do
        params = valid_params.deep_merge(user: { email: "not-an-email" })
        post "/api/v1/auth/signup", params: params.to_json, headers: headers
        expect(response).to have_http_status(:unprocessable_entity)
      end
    end
  end

  # ── Login ──────────────────────────────────────────────────────────────────
  describe "POST /api/v1/auth/login" do
    let!(:user) { create(:user, email: "hr@incubyte.co", password: "password123") }

    context "with correct credentials" do
      it "returns 200 with a token" do
        post "/api/v1/auth/login",
             params: { user: { email: "hr@incubyte.co", password: "password123" } }.to_json,
             headers: headers

        expect(response).to have_http_status(:ok)
        json = response.parsed_body
        expect(json["token"]).to be_present
        expect(json["user"]["email"]).to eq("hr@incubyte.co")
      end

      it "is case-insensitive for the email" do
        post "/api/v1/auth/login",
             params: { user: { email: "HR@INCUBYTE.CO", password: "password123" } }.to_json,
             headers: headers

        expect(response).to have_http_status(:ok)
      end
    end

    context "with wrong password" do
      it "returns 401" do
        post "/api/v1/auth/login",
             params: { user: { email: "hr@incubyte.co", password: "wrong" } }.to_json,
             headers: headers

        expect(response).to have_http_status(:unauthorized)
        expect(response.parsed_body["error"]).to match(/invalid/i)
      end
    end

    context "with unknown email" do
      it "returns 401" do
        post "/api/v1/auth/login",
             params: { user: { email: "ghost@example.com", password: "password123" } }.to_json,
             headers: headers

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  # ── Protected route enforcement ────────────────────────────────────────────
  describe "protected routes" do
    context "with no Authorization header" do
      it "returns 401 on GET /api/v1/employees" do
        get "/api/v1/employees"
        expect(response).to have_http_status(:unauthorized)
      end

      it "returns 401 on GET /api/v1/insights/country_salaries" do
        get "/api/v1/insights/country_salaries"
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context "with an invalid token" do
      it "returns 401" do
        get "/api/v1/employees", headers: { "Authorization" => "Bearer bad.token.here" }
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context "with an expired token" do
      it "returns 401 with a descriptive message" do
        expired_token = JWT.encode(
          { user_id: 999, exp: 1.hour.ago.to_i },
          Auth::TokenService.secret,
          Auth::TokenService::ALGORITHM,
        )
        get "/api/v1/employees", headers: { "Authorization" => "Bearer #{expired_token}" }

        expect(response).to have_http_status(:unauthorized)
        expect(response.parsed_body["error"]).to match(/expired/i)
      end
    end

    context "with a valid token" do
      let(:user)  { create(:user) }
      let(:token) { Auth::TokenService.encode({ user_id: user.id }) }

      it "allows access to GET /api/v1/employees" do
        get "/api/v1/employees", headers: { "Authorization" => "Bearer #{token}" }
        expect(response).to have_http_status(:ok)
      end
    end
  end

  # ── Health endpoint remains public ─────────────────────────────────────────
  describe "GET /health" do
    it "is accessible without a token" do
      get "/health"
      expect(response).to have_http_status(:ok)
    end
  end
end
