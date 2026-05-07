# frozen_string_literal: true

require "rails_helper"

RSpec.describe User, type: :model do
  subject(:user) { build(:user) }

  describe "validations" do
    it { is_expected.to have_secure_password }
    it { is_expected.to validate_presence_of(:email) }
    it { is_expected.to validate_uniqueness_of(:email).case_insensitive }
    it { is_expected.to validate_inclusion_of(:role).in_array(%w[hr_manager admin]) }

    it "rejects malformed email addresses" do
      user.email = "not-an-email"
      expect(user).not_to be_valid
      expect(user.errors[:email]).to be_present
    end

    it "accepts valid email addresses" do
      user.email = "hr@incubyte.co"
      expect(user).to be_valid
    end
  end

  describe "callbacks" do
    it "downcases the email before save" do
      user.email = "HR@INCUBYTE.CO"
      user.save!
      expect(user.reload.email).to eq("hr@incubyte.co")
    end
  end

  describe "roles" do
    it "defaults to hr_manager" do
      expect(build(:user).role).to eq("hr_manager")
    end

    it "accepts admin role" do
      expect(build(:user, :admin)).to be_valid
    end
  end
end
