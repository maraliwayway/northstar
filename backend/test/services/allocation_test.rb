require "test_helper"

class AllocationTest < ActiveSupport::TestCase
  def test_contribution_goes_to_underweight_classes
    holdings = [
      { asset_class: "us_equity", market_value_cents: 600_000 },
      { asset_class: "bonds", market_value_cents: 400_000 }
    ]
    result = Finance::Allocation.new(holdings: holdings, profile: "growth", contribution_cents: 100_000).call
    buys = result[:rows].to_h { |r| [r[:asset_class], r[:buy_cents]] }

    assert_equal 100_000, buys.values.sum
    assert_equal 0, buys["bonds"], "bonds are already overweight for a growth profile"
    assert_operator buys["canadian_equity"], :>, 0
    assert_operator buys["international_equity"], :>, 0
  end

  def test_custom_targets_must_sum_to_100
    custom = { "canadian_equity" => 50, "us_equity" => 50, "international_equity" => 0, "bonds" => 0, "cash" => 0 }
    assert_equal 50.0, Finance::Allocation.targets_for("custom", custom)["canadian_equity"]
    broken = custom.merge("bonds" => 20)
    assert_equal Finance::Allocation::PROFILES["balanced"]["bonds"].to_f, Finance::Allocation.targets_for("custom", broken)["bonds"]
  end

  def test_empty_portfolio_splits_by_target
    result = Finance::Allocation.new(holdings: [], profile: "aggressive", contribution_cents: 10_000).call
    buys = result[:rows].to_h { |r| [r[:asset_class], r[:buy_cents]] }
    assert_equal 4_500, buys["us_equity"]
    assert_equal 10_000, buys.values.sum
  end
end
