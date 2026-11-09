class IncomeExperiment < ApplicationRecord
  STATUSES = %w[idea trying keeping stopped].freeze

  belongs_to :user

  validates :idea, presence: true
  validates :status, inclusion: { in: STATUSES }

  def hourly_cents
    hours.to_f.positive? ? (earned_cents / hours.to_f).round : nil
  end

  def as_json(*)
    super(only: %i[id idea started_on earned_cents status notes]).merge("hours" => hours.to_f, "hourly_cents" => hourly_cents)
  end
end
