# Net worth = what you own - what you owe.
class NetWorth
  def initialize(user)
    @user = user
    @accounts = user.accounts.includes(:holdings).to_a
    @debts = user.debts.to_a
  end

  def totals
    assets = @accounts.sum(&:value_cents)
    liabilities = @debts.sum(&:balance_cents)
    { assets_cents: assets, liabilities_cents: liabilities, net_cents: assets - liabilities }
  end

  def liquid_cents
    @accounts.select(&:liquid?).sum(&:value_cents)
  end

  def emergency_fund_cents
    @accounts.select(&:emergency_fund).sum(&:value_cents)
  end

  def breakdown
    {
      assets: @accounts.group_by(&:kind).transform_values { |list| list.sum(&:value_cents) },
      liabilities: @debts.group_by(&:kind).transform_values { |list| list.sum(&:balance_cents) }
    }
  end
end
