module Finance
  # Compares what you hold against the target mix for your risk profile and
  # works out how to split your next contribution so you drift back toward
  # target without selling anything (rebalancing with new money).
  class Allocation
    ASSET_CLASSES = %w[canadian_equity us_equity international_equity bonds cash].freeze

    # Equity split roughly 30 / 45 / 25 (Canada / US / international),
    # similar to the mix used by common Canadian all-in-one ETFs.
    PROFILES = {
      "conservative" => { "canadian_equity" => 12, "us_equity" => 18, "international_equity" => 10, "bonds" => 55, "cash" => 5 },
      "balanced" => { "canadian_equity" => 18, "us_equity" => 27, "international_equity" => 15, "bonds" => 40, "cash" => 0 },
      "growth" => { "canadian_equity" => 24, "us_equity" => 36, "international_equity" => 20, "bonds" => 20, "cash" => 0 },
      "aggressive" => { "canadian_equity" => 30, "us_equity" => 45, "international_equity" => 25, "bonds" => 0, "cash" => 0 }
    }.freeze

    def self.targets_for(profile, custom = nil)
      if profile == "custom" && custom.is_a?(Hash)
        targets = ASSET_CLASSES.to_h { |k| [k, custom[k].to_f] }
        total = targets.values.sum
        return targets if (total - 100).abs < 0.01
      end
      PROFILES.fetch(profile, PROFILES["balanced"]).transform_values(&:to_f)
    end

    # holdings: [{ asset_class:, market_value_cents: }]
    def initialize(holdings:, profile:, custom_targets: nil, contribution_cents: 0)
      @holdings = holdings
      @profile = profile
      @targets = self.class.targets_for(profile, custom_targets)
      @contribution_cents = [contribution_cents.to_i, 0].max
    end

    def call
      current = ASSET_CLASSES.to_h { |k| [k, 0] }
      @holdings.each do |h|
        key = h[:asset_class].to_s
        key = "cash" unless current.key?(key)
        current[key] += h[:market_value_cents].to_i
      end
      total = current.values.sum
      buys = contribution_split(current, total)

      rows = ASSET_CLASSES.map do |k|
        current_pct = total.zero? ? 0.0 : current[k] * 100.0 / total
        {
          asset_class: k,
          current_cents: current[k],
          current_pct: current_pct.round(1),
          target_pct: @targets[k].round(1),
          drift_pct: (current_pct - @targets[k]).round(1),
          buy_cents: buys[k]
        }
      end

      {
        profile: @profile,
        total_cents: total,
        contribution_cents: @contribution_cents,
        max_drift_pct: rows.map { |r| r[:drift_pct].abs }.max.to_f.round(1),
        rows: rows
      }
    end

    private

    def contribution_split(current, total)
      buys = ASSET_CLASSES.to_h { |k| [k, 0] }
      return buys if @contribution_cents.zero?

      new_total = total + @contribution_cents
      gaps = ASSET_CLASSES.to_h { |k| [k, [@targets[k] / 100 * new_total - current[k], 0].max] }
      gap_sum = gaps.values.sum

      raw =
        if gap_sum <= 0
          ASSET_CLASSES.to_h { |k| [k, @contribution_cents * @targets[k] / 100] }
        elsif gap_sum <= @contribution_cents
          leftover = @contribution_cents - gap_sum
          ASSET_CLASSES.to_h { |k| [k, gaps[k] + leftover * @targets[k] / 100] }
        else
          ASSET_CLASSES.to_h { |k| [k, @contribution_cents * gaps[k] / gap_sum] }
        end

      rounded = raw.transform_values { |v| v.floor }
      # Hand any rounding pennies to the most underweight class.
      remainder = @contribution_cents - rounded.values.sum
      rounded[raw.max_by { |_, v| v }.first] += remainder
      rounded
    end
  end
end
