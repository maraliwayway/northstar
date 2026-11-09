module Api
  class DebtsController < ApplicationController
    include CrudActions
    include TracksNetWorth

    # Avalanche vs snowball for consumer debt (mortgages are left out).
    def plan
      debts = scope.where(kind: Debt::CONSUMER_KINDS).map do |d|
        { id: d.id, name: d.name, balance_cents: d.balance_cents, interest_rate: d.interest_rate.to_f,
          minimum_payment_cents: d.minimum_payment_cents }
      end
      render json: Finance::DebtPayoff.new(debts: debts, extra_cents: params[:extra_cents].to_i).call
    end

    private

    def scope
      current_user.debts
    end

    def ordering
      { interest_rate: :desc }
    end

    def record_params
      params.require(:debt).permit(:name, :kind, :balance_cents, :interest_rate, :minimum_payment_cents)
    end
  end
end
