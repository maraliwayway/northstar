require "test_helper"

class DebtPayoffTest < ActiveSupport::TestCase
  DEBTS = [
    { id: 1, name: "Visa", balance_cents: 300_000, interest_rate: 20.99, minimum_payment_cents: 9_000 },
    { id: 2, name: "Line of credit", balance_cents: 80_000, interest_rate: 9.5, minimum_payment_cents: 2_500 },
    { id: 3, name: "Student loan", balance_cents: 1_200_000, interest_rate: 6.0, minimum_payment_cents: 13_000 }
  ].freeze

  def test_avalanche_never_costs_more_interest_than_snowball
    result = Finance::DebtPayoff.new(debts: DEBTS, extra_cents: 20_000).call
    assert result[:avalanche][:paid_off]
    assert_operator result[:avalanche][:total_interest_cents], :<=, result[:snowball][:total_interest_cents]
    assert_operator result[:interest_saved_with_avalanche_cents], :>=, 0
  end

  def test_orders_targets_by_strategy
    result = Finance::DebtPayoff.new(debts: DEBTS, extra_cents: 20_000).call
    assert_equal "Visa", result[:avalanche][:order].first[:name]
    assert_equal "Line of credit", result[:snowball][:order].first[:name]
  end

  def test_extra_payment_shortens_payoff
    slow = Finance::DebtPayoff.new(debts: DEBTS).call[:avalanche][:months]
    fast = Finance::DebtPayoff.new(debts: DEBTS, extra_cents: 50_000).call[:avalanche][:months]
    assert_operator fast, :<, slow
  end

  def test_flags_debt_that_minimums_never_clear
    stuck = [{ id: 1, name: "Card", balance_cents: 1_000_000, interest_rate: 29.99, minimum_payment_cents: 1_000 }]
    result = Finance::DebtPayoff.new(debts: stuck).call
    refute result[:avalanche][:paid_off]
    assert_nil result[:avalanche][:months]
  end
end
