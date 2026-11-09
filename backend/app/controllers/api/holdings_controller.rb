module Api
  class HoldingsController < ApplicationController
    include CrudActions
    include TracksNetWorth

    def create
      account = current_user.accounts.find(params.require(:holding).require(:account_id))
      holding = account.holdings.new(record_params)
      if holding.save
        render json: holding, status: :created
      else
        render_errors(holding)
      end
    end

    private

    def scope
      current_user.holdings
    end

    def ordering
      { market_value_cents: :desc }
    end

    # account_id is deliberately not updatable: moving a holding means
    # deleting and re-adding it, which keeps ownership checks in one place.
    def record_params
      params.require(:holding).permit(:symbol, :name, :asset_class, :market_value_cents)
    end
  end
end
