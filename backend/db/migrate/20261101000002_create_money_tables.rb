class CreateMoneyTables < ActiveRecord::Migration[8.0]
  def change
    create_table :accounts do |t|
      t.references :user, null: false, foreign_key: true
      t.string :name, null: false
      t.string :kind, null: false
      t.bigint :balance_cents, null: false, default: 0
      t.boolean :emergency_fund, null: false, default: false
      t.timestamps
    end

    create_table :holdings do |t|
      t.references :account, null: false, foreign_key: true
      t.string :symbol, null: false
      t.string :name
      t.string :asset_class, null: false
      t.bigint :market_value_cents, null: false, default: 0
      t.timestamps
    end

    create_table :debts do |t|
      t.references :user, null: false, foreign_key: true
      t.string :name, null: false
      t.string :kind, null: false, default: "credit_card"
      t.bigint :balance_cents, null: false, default: 0
      t.decimal :interest_rate, precision: 5, scale: 2, null: false, default: 0
      t.bigint :minimum_payment_cents, null: false, default: 0
      t.timestamps
    end

    create_table :expenses do |t|
      t.references :user, null: false, foreign_key: true
      t.date :spent_on, null: false
      t.string :description, null: false
      t.bigint :amount_cents, null: false
      t.string :category, null: false, default: "required"
      t.string :source, null: false, default: "manual"
      t.string :note
      t.timestamps
    end
    add_index :expenses, %i[user_id spent_on]

    create_table :net_worth_snapshots do |t|
      t.references :user, null: false, foreign_key: true
      t.date :recorded_on, null: false
      t.bigint :assets_cents, null: false, default: 0
      t.bigint :liabilities_cents, null: false, default: 0
      t.timestamps
    end
    add_index :net_worth_snapshots, %i[user_id recorded_on], unique: true
  end
end
