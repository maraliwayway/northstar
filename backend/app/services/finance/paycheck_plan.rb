module Finance
  # Turns ordered "pay yourself first" rules into the transfers to schedule
  # on each payday, so the bank or brokerage can do it automatically.
  module PaycheckPlan
    PAYCHECKS_PER_YEAR = { "weekly" => 52, "biweekly" => 26, "semimonthly" => 24, "monthly" => 12 }.freeze
    SAVING_KINDS = %w[emergency invest savings_goal].freeze

    module_function

    # rules: [{ id:, label:, kind:, amount_cents:, percent:, destination: }] already ordered
    def call(monthly_take_home_cents:, pay_frequency:, rules:)
      per_year = PAYCHECKS_PER_YEAR.fetch(pay_frequency, 24)
      paycheck = (monthly_take_home_cents.to_i * 12.0 / per_year).round
      remaining = paycheck

      steps = rules.map do |rule|
        wanted =
          if rule[:percent].to_f.positive?
            (paycheck * rule[:percent].to_f / 100).round
          else
            (rule[:amount_cents].to_i * 12.0 / per_year).round
          end
        amount = [wanted, [remaining, 0].max].min
        remaining -= wanted
        rule.merge(per_paycheck_cents: amount, short_by_cents: wanted - amount)
      end

      monthly_saving = steps.select { |s| SAVING_KINDS.include?(s[:kind].to_s) }
                            .sum { |s| s[:per_paycheck_cents] } * per_year / 12

      {
        pay_frequency: pay_frequency,
        paychecks_per_year: per_year,
        paycheck_cents: paycheck,
        steps: steps,
        unassigned_cents: remaining,
        over_allocated: remaining.negative?,
        monthly_saving_cents: monthly_saving
      }
    end
  end
end
