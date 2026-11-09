module Api
  class CalculatorsController < ApplicationController
    def compound
      monthly = params.fetch(:monthly_cents, 10_000).to_i.clamp(0, 100_000_000)
      rate = params.fetch(:rate, 7).to_f.clamp(0, 20) / 100
      early = params.fetch(:early_age, current_user.age || 21).to_i.clamp(14, 90)
      late = params.fetch(:late_age, early + 4).to_i.clamp(early, 90)
      target = params.fetch(:target_age, 40).to_i.clamp(late + 1, 100)

      render json: {
        monthly_cents: monthly,
        rate: rate,
        target_age: target,
        comparison: Finance::Compound.compare_start_ages(monthly_cents: monthly, early_age: early, late_age: late,
                                                         target_age: target, annual_rate: rate),
        curve: (0..(target - early)).map do |year|
          { age: early + year, value_cents: Finance::Compound.future_value_cents(monthly_cents: monthly, years: year, annual_rate: rate) }
        end
      }
    end
  end
end
