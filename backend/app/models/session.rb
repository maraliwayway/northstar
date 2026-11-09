class Session < ApplicationRecord
  LIFETIME = 30.days

  belongs_to :user

  attr_reader :token

  before_create :generate_token

  scope :active, -> { where(created_at: LIFETIME.ago..) }

  # Only a SHA-256 digest is stored, so a leaked database can't be replayed.
  def self.digest(token)
    OpenSSL::Digest::SHA256.hexdigest(token.to_s)
  end

  def self.find_active_by_token(token)
    active.find_by(token_digest: digest(token)) if token.present?
  end

  private

  def generate_token
    @token = SecureRandom.urlsafe_base64(32)
    self.token_digest = self.class.digest(@token)
  end
end
