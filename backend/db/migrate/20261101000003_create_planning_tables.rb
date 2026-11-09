class CreatePlanningTables < ActiveRecord::Migration[8.0]
  def change
    create_table :goals do |t|
      t.references :user, null: false, foreign_key: true
      t.string :horizon, null: false
      t.string :title, null: false
      t.bigint :target_cents
      t.bigint :current_cents, null: false, default: 0
      t.date :due_on
      t.boolean :completed, null: false, default: false
      t.timestamps
    end

    create_table :automation_rules do |t|
      t.references :user, null: false, foreign_key: true
      t.integer :position, null: false, default: 0
      t.string :label, null: false
      t.string :kind, null: false
      t.bigint :amount_cents
      t.decimal :percent, precision: 5, scale: 2
      t.string :destination
      t.timestamps
    end

    create_table :income_experiments do |t|
      t.references :user, null: false, foreign_key: true
      t.string :idea, null: false
      t.date :started_on
      t.bigint :earned_cents, null: false, default: 0
      t.decimal :hours, precision: 6, scale: 1, null: false, default: 0
      t.string :status, null: false, default: "trying"
      t.text :notes
      t.timestamps
    end

    create_table :save_splurge_items do |t|
      t.references :user, null: false, foreign_key: true
      t.string :kind, null: false
      t.string :label, null: false
      t.timestamps
    end

    create_table :reviews do |t|
      t.references :user, null: false, foreign_key: true
      t.date :reviewed_on, null: false
      t.jsonb :answers, null: false, default: {}
      t.string :keep_rule
      t.string :change_rule
      t.string :watch_weakness
      t.string :next_goal
      t.bigint :net_worth_cents
      t.timestamps
    end
  end
end
