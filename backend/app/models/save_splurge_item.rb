class SaveSplurgeItem < ApplicationRecord
  belongs_to :user

  validates :label, presence: true
  validates :kind, inclusion: { in: %w[save splurge] }

  def as_json(*)
    super(only: %i[id kind label])
  end
end
