module Api
  class NetWorthSnapshotsController < ApplicationController
    def index
      render json: current_user.net_worth_snapshots.order(:recorded_on).last(120)
    end

    def create
      render json: NetWorthSnapshot.capture!(current_user), status: :created
    end
  end
end
