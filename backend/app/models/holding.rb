class Holding < ApplicationRecord
  belongs_to :account

  validates :symbol, presence: true
  validates :asset_class, inclusion: { in: Finance::Allocation::ASSET_CLASSES }
  validates :market_value_cents, numericality: { greater_than_or_equal_to: 0 }

  normalizes :symbol, with: ->(s) { s.strip.upcase }

  def as_json(*)
    super(only: %i[id account_id symbol name asset_class market_value_cents])
  end
end
