class CreateUsersAndSessions < ActiveRecord::Migration[8.0]
  def change
    create_table :users do |t|
      t.string :name, null: false, default: ""
      t.string :email, null: false
      t.string :password_digest, null: false
      t.integer :birth_year
      t.string :province, default: "BC"
      t.bigint :annual_income_cents, null: false, default: 0
      t.bigint :monthly_take_home_cents, null: false, default: 0
      t.bigint :monthly_expenses_cents
      t.string :pay_frequency, null: false, default: "semimonthly"
      t.string :risk_profile, null: false, default: "balanced"
      t.text :why_statement
      t.jsonb :settings, null: false, default: {}
      t.timestamps
    end
    add_index :users, :email, unique: true

    create_table :sessions do |t|
      t.references :user, null: false, foreign_key: true
      t.string :token_digest, null: false
      t.string :user_agent
      t.string :ip_address
      t.datetime :last_used_at
      t.timestamps
    end
    add_index :sessions, :token_digest, unique: true
  end
end
