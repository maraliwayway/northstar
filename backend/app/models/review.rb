class Review < ApplicationRecord
  QUESTIONS = {
    "automation" => "Are your automatic transfers working?",
    "debt" => "Did consumer debt go down?",
    "emergency" => "Is your emergency fund growing?",
    "investing" => "Are you investing consistently?",
    "income" => "Did your income experiment work?",
    "habits" => "Have old spending habits crept back?"
  }.freeze

  belongs_to :user

  validates :reviewed_on, presence: true

  def as_json(*)
    super(only: %i[id reviewed_on answers keep_rule change_rule watch_weakness next_goal net_worth_cents])
  end
end
