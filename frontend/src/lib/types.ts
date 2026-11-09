export type Settings = {
  motivations: string[];
  emergency_months: number;
  starter_goal_cents: number;
  raise_invest_percent: number;
  completed_weeks: number[];
  reset_started_on: string | null;
  next_payday: string | null;
  custom_targets: Record<string, number> | null;
  card_rules: { allowed: string; autopay_full: boolean; rewards_plan: string; paused: boolean };
  last_raise: { delta_cents: number; suggested_invest_cents: number; noted_on: string } | null;
};

export type User = {
  id: number;
  name: string;
  email: string;
  birth_year: number | null;
  province: string | null;
  annual_income_cents: number;
  monthly_take_home_cents: number;
  monthly_expenses_cents: number | null;
  pay_frequency: string;
  risk_profile: string;
  why_statement: string | null;
  settings: Settings;
  merchant_rule_count: number;
};

export type Snapshot = { id: number; recorded_on: string; assets_cents: number; liabilities_cents: number; net_cents: number };

export type RoadmapStep = { key: string; title: string; detail: string; path: string; status: "done" | "current" | "upcoming" };

export type Rung = { amount_cents: number; label: string; reached: boolean };

export type Goal = {
  id: number;
  horizon: string;
  title: string;
  target_cents: number | null;
  current_cents: number;
  due_on: string | null;
  completed: boolean;
};

export type Dashboard = {
  user: User;
  net_worth: {
    assets_cents: number;
    liabilities_cents: number;
    net_cents: number;
    history: Snapshot[];
    breakdown: { assets: Record<string, number>; liabilities: Record<string, number> };
  };
  key_numbers: {
    fi_number_cents: number;
    annual_expenses_cents: number;
    monthly_expenses_cents: number;
    hourly_rate_cents: number;
    savings_rate_pct: number | null;
    monthly_savings_cents: number;
    hundred_a_month: { years: number; value_cents: number };
  };
  emergency_fund: {
    current_cents: number;
    target_cents: number;
    starter_cents: number;
    months_target: number;
    essential_monthly_cents: number;
    months_covered: number | null;
  };
  ladder: { liquid_cents: number; rungs: Rung[]; next: Rung | null; progress_to_next_pct: number };
  roadmap: RoadmapStep[];
  reset: { started_on: string | null; current_week: number; completed_weeks: number[] };
  debt: { consumer_cents: number; total_cents: number };
  spending: Record<string, number>;
  goals: Goal[];
  last_raise: Settings["last_raise"];
  last_review_on: string | null;
  next_review_on: string;
};

export type Account = {
  id: number;
  name: string;
  kind: string;
  balance_cents: number;
  value_cents: number;
  emergency_fund: boolean;
  investment: boolean;
  holdings_count: number;
};

export type Holding = { id: number; account_id: number; symbol: string; name: string | null; asset_class: string; market_value_cents: number };

export type Debt = { id: number; name: string; kind: string; balance_cents: number; interest_rate: number; minimum_payment_cents: number };

export type PayoffResult = {
  strategy: string;
  months: number | null;
  paid_off: boolean;
  total_interest_cents: number;
  order: { id: number; name: string; paid_off_month: number | null; interest_cents: number }[];
};

export type DebtPlan = {
  monthly_budget_cents: number;
  extra_cents: number;
  avalanche: PayoffResult;
  snowball: PayoffResult;
  interest_saved_with_avalanche_cents: number;
};

export type Expense = {
  id: number;
  spent_on: string;
  description: string;
  amount_cents: number;
  category: string;
  source: string;
  note: string | null;
};

export type SpendingSummary = {
  days: number;
  count: number;
  by_category: Record<string, { total_cents: number; monthly_cents: number }>;
  top_leaks: { description: string; total_cents: number; monthly_cents: number }[];
  rules: Record<string, string>;
};

export type Rule = {
  id: number;
  label: string;
  kind: string;
  amount_cents: number | null;
  percent: number | null;
  destination: string | null;
  position: number;
};

export type PaycheckPlan = {
  pay_frequency: string;
  paychecks_per_year: number;
  paycheck_cents: number;
  steps: (Rule & { per_paycheck_cents: number; short_by_cents: number })[];
  unassigned_cents: number;
  over_allocated: boolean;
  monthly_saving_cents: number;
};

export type AllocationResult = {
  profile: string;
  total_cents: number;
  contribution_cents: number;
  max_drift_pct: number;
  rows: { asset_class: string; current_cents: number; current_pct: number; target_pct: number; drift_pct: number; buy_cents: number }[];
  profiles: Record<string, Record<string, number>>;
};

export type IncomeExperiment = {
  id: number;
  idea: string;
  started_on: string | null;
  earned_cents: number;
  hours: number;
  hourly_cents: number | null;
  status: string;
  notes: string | null;
};

export type SaveSplurgeItem = { id: number; kind: "save" | "splurge"; label: string };

export type Review = {
  id: number;
  reviewed_on: string;
  answers: Record<string, string>;
  keep_rule: string | null;
  change_rule: string | null;
  watch_weakness: string | null;
  next_goal: string | null;
  net_worth_cents: number | null;
};
