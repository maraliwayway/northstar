module Api
  class AutomationRulesController < ApplicationController
    include CrudActions

    def index
      render json: { rules: scope, plan: plan }
    end

    def create
      rule = scope.new(record_params)
      rule.position = scope.maximum(:position).to_i + 1 if rule.position.to_i.zero?
      rule.save ? render(json: rule, status: :created) : render_errors(rule)
    end

    def reorder
      ids = Array(params.require(:ids)).map(&:to_i)
      AutomationRule.transaction do
        ids.each_with_index { |id, index| scope.where(id: id).update_all(position: index + 1) }
      end
      render json: { rules: scope.reload, plan: plan }
    end

    # The pay-yourself-first order from week 3 of the reset.
    def template
      return render json: { error: "You already have a plan. Delete its steps to start over." }, status: 422 if scope.exists?

      debt_minimums = current_user.debts.where(kind: Debt::CONSUMER_KINDS).sum(:minimum_payment_cents)
      AutomationRule.transaction do
        scope.create!(position: 1, label: "Keep for bills", kind: "bills", percent: 50, destination: "Chequing")
        scope.create!(position: 2, label: "Emergency fund", kind: "emergency", percent: 10, destination: "High-interest savings")
        if debt_minimums.positive?
          scope.create!(position: 3, label: "Debt minimums", kind: "debt", amount_cents: debt_minimums, destination: "Credit card / loans")
        end
        scope.create!(position: 4, label: "Invest", kind: "invest", percent: 10, destination: "TFSA")
        scope.create!(position: 5, label: "Guilt-free spending", kind: "spending", percent: 15, destination: "Spending account")
      end
      render json: { rules: scope.reload, plan: plan }, status: :created
    end

    private

    def scope
      current_user.automation_rules
    end

    def plan
      Finance::PaycheckPlan.call(
        monthly_take_home_cents: current_user.monthly_take_home_cents,
        pay_frequency: current_user.pay_frequency,
        rules: scope.map(&:to_plan_input)
      )
    end

    def record_params
      params.require(:automation_rule).permit(:label, :kind, :amount_cents, :percent, :destination, :position)
    end
  end
end
