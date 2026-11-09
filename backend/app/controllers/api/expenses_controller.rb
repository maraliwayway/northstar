module Api
  class ExpensesController < ApplicationController
    include CrudActions

    MAX_IMPORT_BYTES = 2.megabytes

    def index
      days = params.fetch(:days, 90).to_i.clamp(1, 730)
      expenses = scope.recent(days).order(spent_on: :desc, id: :desc).limit(1000)
      expenses = expenses.where(category: params[:category]) if Expense::CATEGORIES.include?(params[:category])
      render json: expenses
    end

    def create
      attrs = record_params
      attrs[:category] = categorize(attrs[:description]) if attrs[:category].blank?
      expense = scope.new(attrs)
      expense.save ? render(json: expense, status: :created) : render_errors(expense)
    end

    # With remember=true, the new category becomes a rule for this merchant
    # and is applied to every past and future transaction that matches.
    def update
      return render_errors(@record) unless @record.update(record_params)

      relabeled = 0
      if ActiveModel::Type::Boolean.new.cast(params[:remember])
        key = merchant_key(@record.description)
        rules = current_user.preferences["merchant_rules"].merge(key => @record.category)
        current_user.update!(settings: current_user.preferences.merge("merchant_rules" => rules))
        relabeled = scope.where("LOWER(description) LIKE ?", "%#{Expense.sanitize_sql_like(key)}%")
                         .where.not(id: @record.id)
                         .update_all(category: @record.category, updated_at: Time.current)
      end
      render json: @record.as_json.merge("relabeled" => relabeled)
    end

    def import
      csv = params.require(:csv).to_s
      return render json: { error: "That file is larger than 2 MB." }, status: 413 if csv.bytesize > MAX_IMPORT_BYTES

      parser = Finance::StatementParser.new(csv)
      rows = parser.rows
      return render json: { error: parser.errors.first || "No spending found in that file." }, status: 422 if rows.empty?

      existing = scope.where(spent_on: rows.map(&:spent_on).minmax.then { |a, b| a..b })
                      .pluck(:spent_on, :description, :amount_cents).to_set
      fresh = rows.reject { |r| existing.include?([r.spent_on, r.description, r.amount_cents]) }

      Expense.transaction do
        fresh.each do |r|
          scope.create!(spent_on: r.spent_on, description: r.description, amount_cents: r.amount_cents,
                        category: categorize(r.description), source: "import")
        end
      end

      render json: { imported: fresh.size, skipped: rows.size - fresh.size }, status: :created
    end

    def summary
      days = params.fetch(:days, 90).to_i.clamp(7, 730)
      recent = scope.recent(days)
      totals = recent.group(:category).sum(:amount_cents)
      monthly = ->(cents) { (cents * 30.0 / days).round }

      render json: {
        days: days,
        count: recent.count,
        by_category: Expense::CATEGORIES.to_h { |c| [c, { total_cents: totals.fetch(c, 0), monthly_cents: monthly.call(totals.fetch(c, 0)) }] },
        top_leaks: recent.where(category: "leak").group(:description).order(Arel.sql("SUM(expenses.amount_cents) DESC")).limit(5).sum(:amount_cents)
                         .map { |description, cents| { description: description, total_cents: cents, monthly_cents: monthly.call(cents) } },
        rules: current_user.preferences["merchant_rules"]
      }
    end

    private

    def scope
      current_user.expenses
    end

    def record_params
      params.require(:expense).permit(:spent_on, :description, :amount_cents, :category, :note)
    end

    def categorize(description)
      Finance::Categorizer.call(description, current_user.preferences["merchant_rules"])
    end

    def merchant_key(description)
      Finance::Categorizer.normalize(description).split.first(2).join(" ")
    end
  end
end
