require "test_helper"

class CompoundTest < ActiveSupport::TestCase
  def test_matches_the_video_example
    early, late = Finance::Compound.compare_start_ages(monthly_cents: 10_000, early_age: 21, late_age: 25, target_age: 40)
    assert_in_delta 47_425_00, early[:value_cents], 2_000
    assert_in_delta 31_696_00, late[:value_cents], 2_000
    assert_equal 22_800_00, early[:contributed_cents]
  end

  def test_zero_rate_is_just_contributions
    assert_equal 120_000, Finance::Compound.future_value_cents(monthly_cents: 10_000, years: 1, annual_rate: 0)
  end
end
