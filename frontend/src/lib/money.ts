const whole = new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 });
const exact = new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", minimumFractionDigits: 2 });
const compact = new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", notation: "compact", maximumFractionDigits: 1 });

export function money(cents: number | null | undefined, mode: "whole" | "exact" | "compact" = "whole") {
  if (cents === null || cents === undefined || Number.isNaN(cents)) return "–";
  const formatter = mode === "exact" ? exact : mode === "compact" ? compact : whole;
  return formatter.format(cents / 100);
}

export function toCents(dollars: string): number {
  const value = parseFloat(dollars.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(value) ? Math.round(value * 100) : 0;
}

export function toDollars(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return "";
  return (cents / 100).toFixed(cents % 100 === 0 ? 0 : 2);
}

export const percent = (value: number | null | undefined, digits = 1) =>
  value === null || value === undefined ? "–" : `${Number(value).toFixed(digits)}%`;

export function formatDate(iso: string | null | undefined, opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" }) {
  if (!iso) return "–";
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-CA", opts);
}

export const todayIso = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

export function addMonths(date: Date, months: number) {
  const copy = new Date(date);
  copy.setMonth(copy.getMonth() + months);
  return copy;
}

export const labelize = (key: string) =>
  ({
    canadian_equity: "Canadian stocks",
    us_equity: "US stocks",
    international_equity: "International stocks",
    bonds: "Bonds",
    cash: "Cash",
    required: "Required",
    leak: "Leaks",
    future: "Future you",
    guilt_free: "Guilt-free",
    chequing: "Chequing",
    hisa: "High-interest savings",
    tfsa: "TFSA",
    rrsp: "RRSP",
    fhsa: "FHSA",
    resp: "RESP",
    non_registered: "Non-registered",
    pension: "Workplace pension",
    property: "Property",
    vehicle: "Vehicle",
    other: "Other",
    credit_card: "Credit card",
    line_of_credit: "Line of credit",
    student_loan: "Student loan",
    car_loan: "Car loan",
    mortgage: "Mortgage",
    twelve_week: "Next 12 weeks",
    one_year: "1 year",
    five_year: "5 years",
    ten_year: "10 years",
    bills: "Bills",
    emergency: "Emergency fund",
    debt: "Debt payments",
    invest: "Investing",
    savings_goal: "Savings goal",
    spending: "Guilt-free spending",
    weekly: "Weekly",
    biweekly: "Every two weeks",
    semimonthly: "Twice a month",
    monthly: "Monthly",
  })[key] ?? key.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
