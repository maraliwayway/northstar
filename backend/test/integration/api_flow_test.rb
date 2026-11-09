require "test_helper"

class ApiFlowTest < ActionDispatch::IntegrationTest
  include AuthHelpers

  test "sign up, sign in and reach the dashboard" do
    token = sign_up
    assert_response :created
    assert token.present?

    get "/api/dashboard", headers: auth(token)
    assert_response :success
    assert_equal "maya@example.com", response.parsed_body.dig("user", "email")

    post "/api/session", params: { email: "MAYA@example.com", password: "correct-horse-battery" }, as: :json
    assert_response :created
  end

  test "rejects requests without a token" do
    get "/api/dashboard"
    assert_response :unauthorized
  end

  test "users cannot see each other's data" do
    owner = sign_up(email: "owner@example.com")
    post "/api/debts", params: { debt: { name: "Visa", kind: "credit_card", balance_cents: 50_000, interest_rate: 19.99,
                                         minimum_payment_cents: 2_500 } }, headers: auth(owner), as: :json
    debt_id = response.parsed_body["id"]

    intruder = sign_up(email: "intruder@example.com")
    get "/api/debts/#{debt_id}", headers: auth(intruder)
    assert_response :not_found
  end

  test "changing balances records a net worth snapshot" do
    token = sign_up
    post "/api/accounts", params: { account: { name: "HISA", kind: "hisa", balance_cents: 250_000, emergency_fund: true } },
                          headers: auth(token), as: :json
    assert_response :created

    get "/api/net_worth_snapshots", headers: auth(token)
    assert_equal 250_000, response.parsed_body.last["net_cents"]
  end

  test "importing a statement categorizes and skips duplicates" do
    token = sign_up
    csv = "Date,Description,Amount\n2026-10-01,UBER EATS,-21.50\n2026-10-02,BC HYDRO,-60.00\n"

    post "/api/expenses/import", params: { csv: csv }, headers: auth(token), as: :json
    assert_equal 2, response.parsed_body["imported"]

    post "/api/expenses/import", params: { csv: csv }, headers: auth(token), as: :json
    assert_equal 0, response.parsed_body["imported"]
    assert_equal 2, response.parsed_body["skipped"]
  end

  test "signing out ends the session" do
    token = sign_up
    delete "/api/session", headers: auth(token)
    assert_response :no_content

    get "/api/profile", headers: auth(token)
    assert_response :unauthorized
  end
end
