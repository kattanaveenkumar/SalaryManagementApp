# frozen_string_literal: true

class ApplicationController < ActionController::API
  before_action :authenticate_user!

  rescue_from ActiveRecord::RecordNotFound,       with: :render_not_found
  rescue_from ActionController::ParameterMissing, with: :render_unprocessable_entity
  rescue_from JWT::ExpiredSignature,              with: :render_token_expired

  attr_reader :current_user

  private

  def authenticate_user!
    token = extract_bearer_token
    return render_unauthorized("Authorization token missing") unless token

    payload = decode_token(token)
    return unless payload

    @current_user = User.find_by(id: payload[:user_id])
    render_unauthorized("User not found") unless @current_user
  end

  def extract_bearer_token
    header = request.headers["Authorization"]
    return nil unless header&.start_with?("Bearer ")

    header.split(" ", 2).last
  end

  def decode_token(token)
    Auth::TokenService.decode(token)
  rescue JWT::ExpiredSignature
    render_token_expired
    nil
  rescue JWT::DecodeError
    render_unauthorized("Invalid token")
    nil
  end

  def render_unauthorized(message = "Unauthorized")
    render json: { error: message }, status: :unauthorized
  end

  def render_token_expired(*)
    render json: { error: "Token has expired — please log in again" }, status: :unauthorized
  end

  def render_not_found(exception)
    render json: { error: exception.message }, status: :not_found
  end

  def render_unprocessable_entity(exception)
    render json: { error: exception.message }, status: :unprocessable_content
  end
end
