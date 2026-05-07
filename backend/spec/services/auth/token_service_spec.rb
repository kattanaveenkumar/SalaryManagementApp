# frozen_string_literal: true

require "rails_helper"

RSpec.describe Auth::TokenService do
  let(:payload) { { user_id: 42 } }

  describe ".encode" do
    it "returns a non-empty JWT string" do
      token = described_class.encode(payload.dup)
      expect(token).to be_a(String).and be_present
    end

    it "embeds an expiry claim in the future" do
      before = Time.now.to_i
      token  = described_class.encode(payload.dup)
      decoded = described_class.decode(token)
      expect(decoded[:exp]).to be > before
    end
  end

  describe ".decode" do
    it "returns a hash with the original payload keys" do
      token   = described_class.encode(payload.dup)
      decoded = described_class.decode(token)
      expect(decoded[:user_id]).to eq(42)
    end

    it "raises JWT::DecodeError for a tampered token" do
      token = described_class.encode(payload.dup)
      expect { described_class.decode("#{token}tampered") }.to raise_error(JWT::DecodeError)
    end

    it "raises JWT::ExpiredSignature for a token with past exp" do
      # Build an already-expired token directly, bypassing TokenService.encode's auto-expiry.
      expired = JWT.encode(
        { user_id: 99, exp: 1.hour.ago.to_i },
        described_class.secret,
        described_class::ALGORITHM,
      )
      expect { described_class.decode(expired) }.to raise_error(JWT::ExpiredSignature)
    end
  end
end
