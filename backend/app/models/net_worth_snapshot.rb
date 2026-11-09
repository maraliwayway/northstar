class NetWorthSnapshot < ApplicationRecord
  belongs_to :user

  # One row per day: editing balances later the same day overwrites it,
  # so the history chart builds itself as you keep your numbers current.
  def self.capture!(user, on: Date.current)
    totals = NetWorth.new(user).totals
    snapshot = user.net_worth_snapshots.find_or_initialize_by(recorded_on: on)
    snapshot.update!(assets_cents: totals[:assets_cents], liabilities_cents: totals[:liabilities_cents])
    snapshot
  end

  def as_json(*)
    {
      "id" => id, "recorded_on" => recorded_on, "assets_cents" => assets_cents,
      "liabilities_cents" => liabilities_cents, "net_cents" => assets_cents - liabilities_cents
    }
  end
end
