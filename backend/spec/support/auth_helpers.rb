# frozen_string_literal: true

module AuthHelpers
  def auth_headers(user = nil)
    user ||= create(:user)
    token = Auth::TokenService.encode({ user_id: user.id })
    {
      "Content-Type" => "application/json",
      "Authorization" => "Bearer #{token}",
    }
  end
end

RSpec.configure do |config|
  config.include AuthHelpers, type: :request
end
