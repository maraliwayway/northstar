class Expense < ApplicationRecord
  CATEGORIES = Finance::Categorizer::CATEGORIES

  belongs_to :user

  validates :description, presence: true
  validates :spent_on, presence: true
  validates :amount_cents, numericality: { greater_than: 0 }
  validates :category, inclusion: { in: CATEGORIES }

  scope :recent, ->(days) { where(spent_on: days.to_i.days.ago.to_date..) }

  def as_json(*)
    super(only: %i[id spent_on description amount_cents category source note])
  end
end
