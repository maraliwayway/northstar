module Api
  class DashboardController < ApplicationController
    def show
      user = current_user
      prefs = user.preferences
      net_worth = NetWorth.new(user)
      totals = net_worth.totals
      plan = paycheck_plan(user)
      essential = user.essential_monthly_expenses_cents
      emergency_now = net_worth.emergency_fund_cents
      emergency_target = essential * prefs["emergency_months"].to_i
      consumer_debts = user.debts.where(kind: Debt::CONSUMER_KINDS)
      last_review = user.reviews.maximum(:reviewed_on)

      render json: {
        user: user,
        net_worth: totals.merge(
          breakdown: net_worth.breakdown,
          history: user.net_worth_snapshots.order(:recorded_on).last(36)
        ),
        key_numbers: Finance::KeyNumbers.call(
          annual_income_cents: user.annual_income_cents,
          monthly_take_home_cents: user.monthly_take_home_cents,
          monthly_expenses_cents: user.total_monthly_spending_cents,
          monthly_savings_cents: monthly_savings(user, plan),
          age: user.age
        ),
        emergency_fund: {
          current_cents: emergency_now,
          target_cents: emergency_target,
          starter_cents: prefs["starter_goal_cents"].to_i,
          months_target: prefs["emergency_months"].to_i,
          essential_monthly_cents: essential,
          months_covered: essential.positive? ? (emergency_now / essential.to_f).round(1) : nil
        },
        ladder: Finance::FreedomLadder.call(net_worth.liquid_cents),
        roadmap: Finance::Roadmap.call(
          baseline: user.monthly_take_home_cents.positive? && user.accounts.exists?,
          emergency_cents: emergency_now,
          starter_goal_cents: prefs["starter_goal_cents"].to_i,
          emergency_target_cents: emergency_target,
          max_debt_rate: consumer_debts.where("balance_cents > 0").maximum(:interest_rate).to_f,
          automation_rules: user.automation_rules.size,
          holdings: user.holdings.count,
          experiments: user.income_experiments.count,
          last_review_on: last_review,
          today: Date.current
        ),
        reset: reset_progress(prefs),
        debt: { consumer_cents: consumer_debts.sum(:balance_cents), total_cents: user.debts.sum(:balance_cents) },
        spending: spending_summary(user),
        goals: user.goals.where(completed: false).order(:due_on).limit(4),
        last_raise: prefs["last_raise"],
        last_review_on: last_review,
        next_review_on: (last_review || Date.current) + 3.months
      }
    end

    private

    def paycheck_plan(user)
      Finance::PaycheckPlan.call(
        monthly_take_home_cents: user.monthly_take_home_cents,
        pay_frequency: user.pay_frequency,
        rules: user.automation_rules.map(&:to_plan_input)
      )
    end

    # Planned saving if payday is automated, otherwise what the audit shows.
    def monthly_savings(user, plan)
      return plan[:monthly_saving_cents] if user.automation_rules.any?

      user.expenses.recent(90).where(category: "future").sum(:amount_cents) / 3
    end

    def spending_summary(user)
      by_category = user.expenses.recent(90).group(:category).sum(:amount_cents)
      Expense::CATEGORIES.to_h { |c| [c, by_category.fetch(c, 0) / 3] }
    end

    def reset_progress(prefs)
      started = Date.iso8601(prefs["reset_started_on"].to_s) rescue nil
      week = started ? (((Date.current - started).to_i / 7) + 1).clamp(1, 12) : 1
      { started_on: started, current_week: week, completed_weeks: Array(prefs["completed_weeks"]).map(&:to_i) }
    end
  end
end
