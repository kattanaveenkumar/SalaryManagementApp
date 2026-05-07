# frozen_string_literal: true

require "rails_helper"

RSpec.describe "GET /health", type: :request do
  it "returns 200 OK without any auth token" do
    get "/health"
    expect(response).to have_http_status(:ok)
  end

  it "returns status ok in JSON body" do
    get "/health"
    json = response.parsed_body
    expect(json["status"]).to eq("ok")
  end
end
