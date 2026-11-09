class User < ApplicationRecord
  RISK_PROFILES = %w[conservative balanced growth aggressive custom].freeze
  PAY_FREQUENCIES = Finance::PaycheckPlan::PAYCHECKS_PER_YEAR.keys.freeze
  DEFAULT_SETTINGS = {
    "motivations" => [],
    "emergency_months" => 3,
    "starter_goal_cents" => 100_000,
    "raise_invest_percent" => 50,
    "completed_weeks" => [],
    "reset_started_on" => nil,
    "next_payday" => nil,
    "merchant_rules" => {},
    "custom_targets" => nil,
    "card_rules" => { "allowed" => "", "autopay_full" => false, "rewards_plan" => "", "paused" => false },
    "last_raise" => nil
  }.freeze

  has_secure_password

  has_many :sessions, dependent: :destroy
  has_many :accounts, dependent: :destroy
  has_many :holdings, through: :accounts
  has_many :debts, dependent: :destroy
  has_many :expenses, dependent: :delete_all
  has_many :net_worth_snapshots, dependent: :delete_all
  has_many :goals, dependent: :destroy
  has_many :automation_rules, -> { order(:position, :id) }, dependent: :destroy
  has_many :income_experiments, dependent: :destroy
  has_many :save_splurge_items, dependent: :destroy
  has_many :reviews, dependent: :destroy

  normalizes :email, with: ->(email) { email.strip.downcase }

  validates :email, presence: true, uniqueness: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :password, length: { minimum: 10 }, allow_nil: true
  validates :risk_profile, inclusion: { in: RISK_PROFILES }
  validates :pay_frequency, inclusion: { in: PAY_FREQUENCIES }
  validates :annual_income_cents, :monthly_take_home_cents, numericality: { greater_than_or_equal_to: 0 }
  validates :birth_year, numericality: { in: 1920..Date.current.year }, allow_nil: true

  def preferences
    DEFAULT_SETTINGS.merge(settings || {})
  end

  def age
    birth_year && Date.current.year - birth_year
  end

  # Spending that must happen every month: an explicit override, otherwise
  # the "required" bucket from the last 90 days of imported spending.
  def essential_monthly_expenses_cents
    return monthly_expenses_cents if monthly_expenses_cents.to_i.positive?

    expenses.where(spent_on: 90.days.ago.to_date.., category: "required").sum(:amount_cents) / 3
  end

  def total_monthly_spending_cents
    return monthly_expenses_cents if monthly_expenses_cents.to_i.positive?

    expenses.where(spent_on: 90.days.ago.to_date.., category: %w[required leak guilt_free]).sum(:amount_cents) / 3
  end

  def as_json(*)
    super(only: %i[id name email birth_year province annual_income_cents monthly_take_home_cents
                   monthly_expenses_cents pay_frequency risk_profile why_statement])
      .merge("settings" => preferences.except("merchant_rules"), "merchant_rule_count" => preferences["merchant_rules"].size)
  end
end
