# frozen_string_literal: true

class User < ApplicationRecord
  ROLES = %w[hr_manager admin].freeze

  has_secure_password

  validates :email,
            presence: true,
            uniqueness: { case_sensitive: false },
            format: { with: URI::MailTo::EMAIL_REGEXP, message: "is not a valid email address" }

  validates :role, inclusion: { in: ROLES }

  before_save :downcase_email

  private

  def downcase_email
    self.email = email.downcase
  end
end
