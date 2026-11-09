class AutomationRule < ApplicationRecord
  KINDS = %w[bills emergency debt invest savings_goal spending].freeze

  belongs_to :user

  validates :label, presence: true
  validates :kind, inclusion: { in: KINDS }
  validate :amount_or_percent

  def to_plan_input
    { id: id, label: label, kind: kind, amount_cents: amount_cents, percent: percent&.to_f, destination: destination, position: position }
  end

  def as_json(*)
    to_plan_input.stringify_keys
  end

  private

  def amount_or_percent
    return if amount_cents.to_i.positive? || percent.to_f.positive?

    errors.add(:base, "Set either a dollar amount or a percentage")
  end
end
