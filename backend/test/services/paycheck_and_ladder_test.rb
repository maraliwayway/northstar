require "test_helper"

class PaycheckAndLadderTest < ActiveSupport::TestCase
  def test_rules_run_in_order_and_flag_overallocation
    rules = [
      { id: 1, label: "Bills", kind: "bills", amount_cents: 200_000, percent: nil },
      { id: 2, label: "Emergency", kind: "emergency", amount_cents: nil, percent: 10 },
      { id: 3, label: "TFSA", kind: "invest", amount_cents: 200_000, percent: nil }
    ]
    plan = Finance::PaycheckPlan.call(monthly_take_home_cents: 400_000, pay_frequency: "semimonthly", rules: rules)
    assert_equal 200_000, plan[:paycheck_cents]
    assert_equal 100_000, plan[:steps][0][:per_paycheck_cents]
    assert_equal 20_000, plan[:steps][1][:per_paycheck_cents]
    assert_equal 80_000, plan[:steps][2][:per_paycheck_cents]
    assert_equal 20_000, plan[:steps][2][:short_by_cents]
    assert plan[:over_allocated]
  end

  def test_ladder_progress
    ladder = Finance::FreedomLadder.call(550_000)
    assert_equal 2, ladder[:rungs].count { |r| r[:reached] }
    assert_equal 1_000_000, ladder[:next][:amount_cents]
    assert_in_delta 50.0, ladder[:progress_to_next_pct], 0.1
  end

  def test_key_numbers
    numbers = Finance::KeyNumbers.call(annual_income_cents: 6_000_000, monthly_take_home_cents: 400_000,
                                       monthly_expenses_cents: 250_000, monthly_savings_cents: 80_000, age: 24)
    assert_equal 75_000_000, numbers[:fi_number_cents]
    assert_equal 3_000, numbers[:hourly_rate_cents]
    assert_equal 20.0, numbers[:savings_rate_pct]
  end

  def test_roadmap_marks_first_unfinished_step_current
    steps = Finance::Roadmap.call(baseline: true, emergency_cents: 0, starter_goal_cents: 100_000, max_debt_rate: 0,
                                  automation_rules: 0, holdings: 0, experiments: 0, today: Date.new(2026, 11, 1))
    assert_equal "done", steps[0][:status]
    assert_equal "current", steps[1][:status]
    assert_equal "done", steps[2][:status]
  end
end
