class Debt < ApplicationRecord
  KINDS = %w[credit_card line_of_credit student_loan car_loan mortgage other].freeze
  CONSUMER_KINDS = KINDS - %w[mortgage]

  belongs_to :user

  validates :name, presence: true
  validates :kind, inclusion: { in: KINDS }
  validates :interest_rate, numericality: { in: 0..100 }
  validates :balance_cents, :minimum_payment_cents, numericality: { greater_than_or_equal_to: 0 }

  def as_json(*)
    super(only: %i[id name kind balance_cents interest_rate minimum_payment_cents]).merge("interest_rate" => interest_rate.to_f)
  end
end
