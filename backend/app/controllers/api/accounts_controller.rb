module Api
  class AccountsController < ApplicationController
    include CrudActions
    include TracksNetWorth

    def index
      render json: scope.includes(:holdings).order(:kind, :name)
    end

    private

    def scope
      current_user.accounts
    end

    def record_params
      params.require(:account).permit(:name, :kind, :balance_cents, :emergency_fund)
    end
  end
end
