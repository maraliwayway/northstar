module Finance
  # The four numbers from "The money plan I wish I had at 21":
  # FI number, true hourly rate, savings rate, and the power of $100/month.
  module KeyNumbers
    WITHDRAWAL_MULTIPLE = 25 # the inverse of the 4% rule
    WORK_HOURS_PER_YEAR = 2000

    module_function

    def call(annual_income_cents:, monthly_take_home_cents:, monthly_expenses_cents:, monthly_savings_cents:, age: nil)
      annual_expenses = monthly_expenses_cents.to_i * 12
      hourly = annual_income_cents.to_i / WORK_HOURS_PER_YEAR
      savings_rate =
        monthly_take_home_cents.to_i.positive? ? (monthly_savings_cents.to_f * 100 / monthly_take_home_cents).round(1) : nil
      hundred_years = age ? [65 - age, 1].max : 40

      {
        fi_number_cents: annual_expenses * WITHDRAWAL_MULTIPLE,
        annual_expenses_cents: annual_expenses,
        monthly_expenses_cents: monthly_expenses_cents.to_i,
        hourly_rate_cents: hourly,
        savings_rate_pct: savings_rate,
        monthly_savings_cents: monthly_savings_cents.to_i,
        hundred_a_month: {
          years: hundred_years,
          value_cents: Compound.future_value_cents(monthly_cents: 10_000, years: hundred_years, annual_rate: 0.07)
        }
      }
    end

    # How many hours of work a purchase costs.
    def hours_for(price_cents, hourly_rate_cents)
      return nil unless hourly_rate_cents.to_i.positive?

      (price_cents.to_f / hourly_rate_cents).round(1)
    end
  end
end
