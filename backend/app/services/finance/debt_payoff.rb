module Finance
  # Simulates paying down consumer debt with a fixed monthly budget
  # (every minimum + an optional extra). When a debt is cleared its minimum
  # rolls into the next target, which is what makes both methods accelerate.
  #
  #   avalanche: highest interest rate first (least total interest)
  #   snowball:  smallest balance first     (fastest early wins)
  class DebtPayoff
    MAX_MONTHS = 600
    Debt = Struct.new(:id, :name, :balance_cents, :interest_rate, :minimum_payment_cents, keyword_init: true)

    def initialize(debts:, extra_cents: 0)
      @debts = debts.map { |d| d.is_a?(Debt) ? d : Debt.new(**d.to_h.slice(*Debt.members)) }
                    .select { |d| d.balance_cents.to_i.positive? }
      @extra_cents = [extra_cents.to_i, 0].max
    end

    def call
      avalanche = simulate(:avalanche)
      snowball = simulate(:snowball)
      {
        monthly_budget_cents: monthly_budget,
        extra_cents: @extra_cents,
        avalanche: avalanche,
        snowball: snowball,
        interest_saved_with_avalanche_cents: snowball[:total_interest_cents] - avalanche[:total_interest_cents]
      }
    end

    def simulate(strategy)
      ledger = @debts.map do |d|
        { debt: d, balance: d.balance_cents.to_f, paid_month: nil, interest: 0.0 }
      end
      order = ordering(strategy)
      month = 0

      while ledger.any? { |l| l[:balance] > 0.5 } && month < MAX_MONTHS
        month += 1
        active = ledger.select { |l| l[:balance] > 0.5 }

        active.each do |l|
          interest = l[:balance] * l[:debt].interest_rate.to_f / 100 / 12
          l[:balance] += interest
          l[:interest] += interest
        end

        available = monthly_budget.to_f
        active.each do |l|
          payment = [l[:debt].minimum_payment_cents.to_f, l[:balance]].min
          l[:balance] -= payment
          available -= payment
        end

        active.select { |l| l[:balance] > 0.5 }.sort_by { |l| order.call(l[:debt]) }.each do |l|
          break if available <= 0

          payment = [available, l[:balance]].min
          l[:balance] -= payment
          available -= payment
        end

        active.each do |l|
          next unless l[:balance] <= 0.5

          l[:balance] = 0.0
          l[:paid_month] ||= month
        end
      end

      cleared = ledger.all? { |l| l[:paid_month] }
      {
        strategy: strategy.to_s,
        months: cleared ? month : nil,
        paid_off: cleared,
        total_interest_cents: ledger.sum { |l| l[:interest] }.round,
        order: ledger.sort_by { |l| [l[:paid_month] || Float::INFINITY, order.call(l[:debt])] }.map do |l|
          { id: l[:debt].id, name: l[:debt].name, paid_off_month: l[:paid_month], interest_cents: l[:interest].round }
        end
      }
    end

    private

    def monthly_budget
      @debts.sum { |d| d.minimum_payment_cents.to_i } + @extra_cents
    end

    def ordering(strategy)
      case strategy
      when :avalanche then ->(d) { [-d.interest_rate.to_f, d.balance_cents.to_i] }
      when :snowball then ->(d) { [d.balance_cents.to_i, -d.interest_rate.to_f] }
      else raise ArgumentError, "unknown strategy #{strategy}"
      end
    end
  end
end
