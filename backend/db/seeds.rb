# Demo data so the app (and your portfolio link) has something to show.
# Runs in development, or anywhere with SEED_DEMO=1.
return unless Rails.env.development? || ENV["SEED_DEMO"] == "1"

demo = User.find_or_initialize_by(email: "demo@northstar.dev")
demo.assign_attributes(
  name: "Demo", password: "northstar-demo", birth_year: Date.current.year - 23, province: "BC",
  annual_income_cents: 62_000_00, monthly_take_home_cents: 4_000_00, pay_frequency: "semimonthly",
  risk_profile: "growth",
  why_statement: "I want enough saved that no job, landlord or emergency gets to decide my next move for me.",
  settings: {
    "motivations" => ["Financial independence", "Buy a home", "Travel without worrying"],
    "reset_started_on" => (Date.current - 20).iso8601, "completed_weeks" => [1, 2],
    "emergency_months" => 3, "starter_goal_cents" => 1_000_00, "raise_invest_percent" => 50
  }
)
demo.save!

ActiveRecord::Base.transaction do
  [demo.accounts, demo.debts, demo.expenses, demo.goals, demo.automation_rules, demo.income_experiments,
   demo.save_splurge_items, demo.reviews, demo.net_worth_snapshots].each(&:destroy_all)

  demo.accounts.create!(name: "Everyday chequing", kind: "chequing", balance_cents: 1_850_00)
  demo.accounts.create!(name: "Emergency HISA", kind: "hisa", balance_cents: 4_200_00, emergency_fund: true)
  tfsa = demo.accounts.create!(name: "TFSA", kind: "tfsa")
  fhsa = demo.accounts.create!(name: "FHSA", kind: "fhsa")
  tfsa.holdings.create!(symbol: "VFV", name: "S&P 500 index ETF", asset_class: "us_equity", market_value_cents: 6_400_00)
  tfsa.holdings.create!(symbol: "XEF", name: "International developed ETF", asset_class: "international_equity", market_value_cents: 1_800_00)
  tfsa.holdings.create!(symbol: "VCN", name: "Canada all cap", asset_class: "canadian_equity", market_value_cents: 2_100_00)
  fhsa.holdings.create!(symbol: "ZAG", name: "Aggregate bond", asset_class: "bonds", market_value_cents: 3_000_00)

  demo.debts.create!(name: "Visa", kind: "credit_card", balance_cents: 1_400_00, interest_rate: 20.99, minimum_payment_cents: 45_00)
  demo.debts.create!(name: "Student loan", kind: "student_loan", balance_cents: 14_500_00, interest_rate: 6.2, minimum_payment_cents: 165_00)

  samples = [
    ["Rent", 1_250_00, "required"], ["BC Hydro", 62_00, "required"], ["Save-On-Foods", 118_40, "required"],
    ["Uber Eats", 38_20, "leak"], ["Netflix", 18_99, "leak"], ["Amazon", 46_10, "leak"],
    ["Climbing gym", 79_00, "guilt_free"], ["Concert tickets", 95_00, "guilt_free"],
    ["Wealthsimple TFSA deposit", 300_00, "future"]
  ]
  3.times do |month|
    samples.each_with_index do |(description, cents, category), i|
      demo.expenses.create!(spent_on: Date.current - (month * 30) - i, description: description,
                            amount_cents: cents, category: category, source: "import")
    end
  end

  demo.automation_rules.create!(position: 1, label: "Keep for bills", kind: "bills", percent: 45, destination: "Chequing")
  demo.automation_rules.create!(position: 2, label: "Emergency fund", kind: "emergency", percent: 8, destination: "Emergency HISA")
  demo.automation_rules.create!(position: 3, label: "Debt minimums", kind: "debt", amount_cents: 210_00, destination: "Visa + student loan")
  demo.automation_rules.create!(position: 4, label: "Invest", kind: "invest", amount_cents: 500_00, destination: "TFSA")
  demo.automation_rules.create!(position: 5, label: "Guilt-free", kind: "spending", percent: 15, destination: "Spending")

  demo.goals.create!(horizon: "twelve_week", title: "Pay off the Visa", target_cents: 1_400_00, current_cents: 600_00, due_on: Date.current + 60)
  demo.goals.create!(horizon: "one_year", title: "Emergency fund at 3 months", target_cents: 7_500_00, current_cents: 4_200_00, due_on: Date.current + 300)
  demo.goals.create!(horizon: "five_year", title: "Down payment saved in the FHSA", target_cents: 40_000_00)
  demo.goals.create!(horizon: "ten_year", title: "Work feels optional, not required")

  demo.income_experiments.create!(idea: "Sell old camera gear on Facebook Marketplace", started_on: Date.current - 14,
                                  earned_cents: 340_00, hours: 3, status: "keeping")
  %w[Phone\ plan Fast\ fashion Takeout\ on\ weeknights].each { |label| demo.save_splurge_items.create!(kind: "save", label: label) }
  %w[Climbing Concerts\ with\ friends Good\ coffee\ beans].each { |label| demo.save_splurge_items.create!(kind: "splurge", label: label) }

  [180, 120, 60, 0].each_with_index do |days_ago, i|
    demo.net_worth_snapshots.create!(recorded_on: Date.current - days_ago, assets_cents: 14_000_00 + i * 1_900_00,
                                     liabilities_cents: 17_600_00 - i * 600_00)
  end
end

NetWorthSnapshot.capture!(demo)
puts "Demo user ready: demo@northstar.dev / northstar-demo"
