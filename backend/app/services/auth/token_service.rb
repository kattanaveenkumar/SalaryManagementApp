# frozen_string_literal: true

module Auth
  class TokenService
    ALGORITHM = "HS256"
    EXPIRY    = 24.hours

    def self.encode(payload)
      payload[:exp] = EXPIRY.from_now.to_i
      JWT.encode(payload, secret, ALGORITHM)
    end

    # Returns the decoded payload hash, or raises on invalid/expired token.
    def self.decode(token)
      decoded = JWT.decode(token, secret, true, { algorithm: ALGORITHM })
      decoded.first.with_indifferent_access
    end

    def self.secret
      Rails.application.credentials.secret_key_base ||
        ENV.fetch("SECRET_KEY_BASE", "dev_fallback_secret_not_for_production")
    end
  end
end
