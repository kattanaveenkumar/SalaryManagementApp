# frozen_string_literal: true

module Api
  module V1
    class AuthController < ApplicationController
      skip_before_action :authenticate_user!

      # POST /api/v1/auth/signup
      def signup
        user = User.new(signup_params)
        if user.save
          token = Auth::TokenService.encode({ user_id: user.id })
          render json: { token: token, user: user_payload(user) }, status: :created
        else
          render json: { errors: user.errors.full_messages }, status: :unprocessable_content
        end
      end

      # POST /api/v1/auth/login
      def login
        user = User.find_by(email: login_params[:email]&.downcase)
        if user&.authenticate(login_params[:password])
          token = Auth::TokenService.encode({ user_id: user.id })
          render json: { token: token, user: user_payload(user) }
        else
          render json: { error: "Invalid email or password" }, status: :unauthorized
        end
      end

      private

      def signup_params
        params.require(:user).permit(:email, :password, :password_confirmation, :role)
      end

      def login_params
        params.require(:user).permit(:email, :password)
      end

      def user_payload(user)
        { id: user.id, email: user.email, role: user.role }
      end
    end
  end
end
