module Finance
  # The five rungs of the Freedom Ladder, measured against liquid savings
  # and investments (property and vehicles don't count).
  module FreedomLadder
    RUNGS = [
      { amount_cents: 10_000, label: "Proof you can save" },
      { amount_cents: 100_000, label: "A buffer for surprises" },
      { amount_cents: 1_000_000, label: "Room to change jobs or take a break" },
      { amount_cents: 10_000_000, label: "Compounding starts doing real work" },
      { amount_cents: 100_000_000, label: "Work becomes optional" }
    ].freeze

    module_function

    def call(liquid_cents)
      liquid = [liquid_cents.to_i, 0].max
      rungs = RUNGS.map { |r| r.merge(reached: liquid >= r[:amount_cents]) }
      next_rung = rungs.find { |r| !r[:reached] }
      previous = rungs.select { |r| r[:reached] }.last&.dig(:amount_cents) || 0
      progress =
        if next_rung
          ((liquid - previous) * 100.0 / (next_rung[:amount_cents] - previous)).clamp(0, 100).round(1)
        else
          100.0
        end
      { liquid_cents: liquid, rungs: rungs, next: next_rung, progress_to_next_pct: progress }
    end
  end
end
