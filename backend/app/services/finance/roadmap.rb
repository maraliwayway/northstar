module Finance
  # The recommended order of operations: each step unlocks the next.
  # Given a snapshot of where you are, returns every step with a status.
  module Roadmap
    HIGH_INTEREST_PCT = 8.0

    STEPS = [
      { key: "baseline", title: "Know your numbers", detail: "Add your income, accounts and debts so your savings rate and net worth are real.", path: "/settings" },
      { key: "starter_fund", title: "Build a starter emergency fund", detail: "Get your first cushion in an account you won't invest.", path: "/net-worth" },
      { key: "expensive_debt", title: "Clear high-interest debt", detail: "Anything above 8% goes before investing.", path: "/debt" },
      { key: "automate", title: "Automate payday", detail: "Pay yourself first with scheduled transfers.", path: "/paycheque" },
      { key: "full_fund", title: "Finish the emergency fund", detail: "Reach your target months of essential spending.", path: "/net-worth" },
      { key: "invest", title: "Invest consistently", detail: "Use your TFSA, RRSP or FHSA and match your target mix.", path: "/investing" },
      { key: "income", title: "Grow your income", detail: "Run an income experiment and route raises to investing.", path: "/income" },
      { key: "review", title: "Review every quarter", detail: "Thirty minutes to check what's working.", path: "/review" }
    ].freeze

    module_function

    # facts: baseline, emergency_cents, starter_goal_cents, emergency_target_cents,
    #        max_debt_rate, automation_rules, holdings, experiments, last_review_on, today
    def call(facts)
      done = {
        "baseline" => facts[:baseline],
        "starter_fund" => facts[:emergency_cents].to_i >= facts[:starter_goal_cents].to_i && facts[:starter_goal_cents].to_i.positive?,
        "expensive_debt" => facts[:max_debt_rate].to_f < HIGH_INTEREST_PCT,
        "automate" => facts[:automation_rules].to_i.positive?,
        "full_fund" => facts[:emergency_target_cents].to_i.positive? && facts[:emergency_cents].to_i >= facts[:emergency_target_cents].to_i,
        "invest" => facts[:holdings].to_i.positive?,
        "income" => facts[:experiments].to_i.positive?,
        "review" => recent_review?(facts[:last_review_on], facts[:today])
      }
      current_found = false
      STEPS.map do |step|
        status =
          if done[step[:key]]
            "done"
          elsif !current_found
            current_found = true
            "current"
          else
            "upcoming"
          end
        step.merge(status: status)
      end
    end

    def recent_review?(last_review_on, today)
      return false unless last_review_on && today

      (today - last_review_on).to_i <= 92
    end
  end
end
