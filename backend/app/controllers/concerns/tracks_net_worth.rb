# Any change to what you own or owe updates today's net worth snapshot,
# so the history chart fills in without a manual "record" step.
module TracksNetWorth
  extend ActiveSupport::Concern

  included do
    after_action :capture_net_worth, only: %i[create update destroy]
  end

  private

  def capture_net_worth
    NetWorthSnapshot.capture!(current_user) if response.successful?
  end
end
