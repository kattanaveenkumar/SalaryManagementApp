# frozen_string_literal: true

class HealthController < ApplicationController
  def index
    render json: { status: "ok" }, status: :ok
  end
end
