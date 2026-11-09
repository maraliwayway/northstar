class Goal < ApplicationRecord
  HORIZONS = %w[twelve_week one_year five_year ten_year].freeze

  belongs_to :user

  validates :title, presence: true
  validates :horizon, inclusion: { in: HORIZONS }

  def as_json(*)
    super(only: %i[id horizon title target_cents current_cents due_on completed])
  end
end
