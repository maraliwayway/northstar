# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_11_01_000003) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "accounts", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "name", null: false
    t.string "kind", null: false
    t.bigint "balance_cents", default: 0, null: false
    t.boolean "emergency_fund", default: false, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id"], name: "index_accounts_on_user_id"
  end

  create_table "automation_rules", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.integer "position", default: 0, null: false
    t.string "label", null: false
    t.string "kind", null: false
    t.bigint "amount_cents"
    t.decimal "percent", precision: 5, scale: 2
    t.string "destination"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id"], name: "index_automation_rules_on_user_id"
  end

  create_table "debts", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "name", null: false
    t.string "kind", default: "credit_card", null: false
    t.bigint "balance_cents", default: 0, null: false
    t.decimal "interest_rate", precision: 5, scale: 2, default: "0.0", null: false
    t.bigint "minimum_payment_cents", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id"], name: "index_debts_on_user_id"
  end

  create_table "expenses", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.date "spent_on", null: false
    t.string "description", null: false
    t.bigint "amount_cents", null: false
    t.string "category", default: "required", null: false
    t.string "source", default: "manual", null: false
    t.string "note"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id", "spent_on"], name: "index_expenses_on_user_id_and_spent_on"
    t.index ["user_id"], name: "index_expenses_on_user_id"
  end

  create_table "goals", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "horizon", null: false
    t.string "title", null: false
    t.bigint "target_cents"
    t.bigint "current_cents", default: 0, null: false
    t.date "due_on"
    t.boolean "completed", default: false, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id"], name: "index_goals_on_user_id"
  end

  create_table "holdings", force: :cascade do |t|
    t.bigint "account_id", null: false
    t.string "symbol", null: false
    t.string "name"
    t.string "asset_class", null: false
    t.bigint "market_value_cents", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["account_id"], name: "index_holdings_on_account_id"
  end

  create_table "income_experiments", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "idea", null: false
    t.date "started_on"
    t.bigint "earned_cents", default: 0, null: false
    t.decimal "hours", precision: 6, scale: 1, default: "0.0", null: false
    t.string "status", default: "trying", null: false
    t.text "notes"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id"], name: "index_income_experiments_on_user_id"
  end

  create_table "net_worth_snapshots", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.date "recorded_on", null: false
    t.bigint "assets_cents", default: 0, null: false
    t.bigint "liabilities_cents", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id", "recorded_on"], name: "index_net_worth_snapshots_on_user_id_and_recorded_on", unique: true
    t.index ["user_id"], name: "index_net_worth_snapshots_on_user_id"
  end

  create_table "reviews", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.date "reviewed_on", null: false
    t.jsonb "answers", default: {}, null: false
    t.string "keep_rule"
    t.string "change_rule"
    t.string "watch_weakness"
    t.string "next_goal"
    t.bigint "net_worth_cents"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id"], name: "index_reviews_on_user_id"
  end

  create_table "save_splurge_items", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "kind", null: false
    t.string "label", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id"], name: "index_save_splurge_items_on_user_id"
  end

  create_table "sessions", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "token_digest", null: false
    t.string "user_agent"
    t.string "ip_address"
    t.datetime "last_used_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["token_digest"], name: "index_sessions_on_token_digest", unique: true
    t.index ["user_id"], name: "index_sessions_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "name", default: "", null: false
    t.string "email", null: false
    t.string "password_digest", null: false
    t.integer "birth_year"
    t.string "province", default: "BC"
    t.bigint "annual_income_cents", default: 0, null: false
    t.bigint "monthly_take_home_cents", default: 0, null: false
    t.bigint "monthly_expenses_cents"
    t.string "pay_frequency", default: "semimonthly", null: false
    t.string "risk_profile", default: "balanced", null: false
    t.text "why_statement"
    t.jsonb "settings", default: {}, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
  end

  add_foreign_key "accounts", "users"
  add_foreign_key "automation_rules", "users"
  add_foreign_key "debts", "users"
  add_foreign_key "expenses", "users"
  add_foreign_key "goals", "users"
  add_foreign_key "holdings", "accounts"
  add_foreign_key "income_experiments", "users"
  add_foreign_key "net_worth_snapshots", "users"
  add_foreign_key "reviews", "users"
  add_foreign_key "save_splurge_items", "users"
  add_foreign_key "sessions", "users"
end
