module Api
  class AllocationsController < ApplicationController
    def show
      prefs = current_user.preferences
      profile = User::RISK_PROFILES.include?(params[:profile]) ? params[:profile] : current_user.risk_profile
      holdings = current_user.holdings.joins(:account).where(accounts: { kind: Account::INVESTMENT_KINDS })
                             .map { |h| { asset_class: h.asset_class, market_value_cents: h.market_value_cents } }

      result = Finance::Allocation.new(
        holdings: holdings,
        profile: profile,
        custom_targets: prefs["custom_targets"],
        contribution_cents: params[:contribution_cents].to_i
      ).call

      render json: result.merge(profiles: Finance::Allocation::PROFILES)
    end
  end
end
