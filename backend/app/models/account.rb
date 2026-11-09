class Account < ApplicationRecord
  KINDS = %w[chequing hisa tfsa rrsp fhsa resp non_registered pension property vehicle other].freeze
  CASH_KINDS = %w[chequing hisa].freeze
  INVESTMENT_KINDS = %w[tfsa rrsp fhsa resp non_registered pension].freeze

  belongs_to :user
  has_many :holdings, dependent: :destroy

  validates :name, presence: true
  validates :kind, inclusion: { in: KINDS }

  def investment?
    INVESTMENT_KINDS.include?(kind)
  end

  def liquid?
    CASH_KINDS.include?(kind) || investment?
  end

  # Investment accounts are valued from their holdings once any are added.
  def value_cents
    holdings.any? ? holdings.sum(&:market_value_cents) : balance_cents
  end

  def as_json(*)
    super(only: %i[id name kind balance_cents emergency_fund]).merge("value_cents" => value_cents, "investment" => investment?, "holdings_count" => holdings.size)
  end
end
