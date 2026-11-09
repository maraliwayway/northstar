module Finance
  # Future value of a steady monthly contribution, compounded monthly.
  # Mirrors the "£100/month from 21 vs 25" example: 19 years at 7% ≈ 47,425.
  module Compound
    module_function

    def future_value_cents(monthly_cents:, years:, annual_rate:, starting_cents: 0)
      months = (years * 12).round
      r = annual_rate.to_f / 12
      growth = (1 + r)**months
      contributions = r.zero? ? monthly_cents * months : monthly_cents * ((growth - 1) / r)
      (starting_cents * growth + contributions).round
    end

    def compare_start_ages(monthly_cents:, early_age:, late_age:, target_age:, annual_rate: 0.07)
      [early_age, late_age].map do |age|
        years = [target_age - age, 0].max
        {
          start_age: age,
          years: years,
          contributed_cents: monthly_cents * years * 12,
          value_cents: future_value_cents(monthly_cents: monthly_cents, years: years, annual_rate: annual_rate)
        }
      end
    end
  end
end
