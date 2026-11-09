ENV["RAILS_ENV"] ||= "test"
require_relative "../config/environment"
require "rails/test_help"

module ActiveSupport
  class TestCase
    parallelize(workers: 1)
  end
end

module AuthHelpers
  def sign_up(email: "maya@example.com", password: "correct-horse-battery")
    post "/api/registration", params: { user: { name: "Maya", email: email, password: password } }, as: :json
    response.parsed_body["token"]
  end

  def auth(token)
    { "Authorization" => "Bearer #{token}" }
  end
end
