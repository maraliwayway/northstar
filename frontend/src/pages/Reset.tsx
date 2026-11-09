import { Link } from "react-router-dom";
import { PageHeader, Panel, Progress } from "../components/ui";
import { useUser } from "../lib/auth";
import { formatDate, todayIso } from "../lib/money";

const WEEKS = [
  { month: "Direction and control", title: "Find your North Star", task: "Write why you want this, then set one measurable 12-week goal.", path: "/north-star" },
  { month: "Direction and control", title: "Audit 90 days of spending", task: "Import three months of transactions and name at least three leaks.", path: "/spending" },
  { month: "Direction and control", title: "Automate your paycheque", task: "Bills, emergency fund, debt minimums, then investing: on payday, in that order.", path: "/paycheque" },
  { month: "Direction and control", title: "Pick a debt strategy", task: "List every debt and choose avalanche or snowball. No debt? Check your credit report.", path: "/debt" },
  { month: "Momentum", title: "Build your emergency fund", task: "Start with $500 to $1,000 in a high-interest savings account.", path: "/net-worth" },
  { month: "Momentum", title: "Make your first investment", task: "Open the account, link your bank and buy something, even $20 of an index ETF.", path: "/investing" },
  { month: "Momentum", title: "Run a 7-day income experiment", task: "Sell something, freelance, or ask about a raise. $100 a month counts.", path: "/income" },
  { month: "Momentum", title: "Set 1, 5 and 10-year goals", task: "Describe what the money should make possible, not just the balance.", path: "/north-star" },
  { month: "Make it stick", title: "Write credit card rules", task: "What goes on the card, autopay the full statement, and whether rewards are worth it.", path: "/debt" },
  { month: "Make it stick", title: "Calculate your net worth", task: "Record it even if it's negative. It's a starting point, not a grade.", path: "/net-worth" },
  { month: "Make it stick", title: "Review your system", task: "What's working, what isn't, and one weakness to watch.", path: "/review" },
  { month: "Make it stick", title: "Plan the next 12 weeks", task: "Pick one goal for next quarter and book the review in your calendar.", path: "/review" },
];

const DECADE = [
  { from: 21, to: 23, title: "Foundations", body: "Build the emergency fund, start investing small amounts, and practise the habits while the stakes are low." },
  { from: 24, to: 26, title: "Direct the raises", body: "Send pay increases to investing, a home fund or other goals instead of a bigger lifestyle." },
  { from: 27, to: 30, title: "Aim at independence", body: "Track your FI number, raise your savings rate on purpose, and let compounding take a bigger share." },
];

export default function Reset() {
  const { user, saveProfile } = useUser();
  const done = user.settings.completed_weeks ?? [];
  const started = user.settings.reset_started_on;
  const currentWeek = started ? Math.min(12, Math.max(1, Math.floor((Date.parse(todayIso()) - Date.parse(started)) / (7 * 864e5)) + 1)) : 1;
  const age = user.birth_year ? new Date().getFullYear() - user.birth_year : null;

  const toggle = (week: number) =>
    saveProfile({ settings: { completed_weeks: done.includes(week) ? done.filter((w) => w !== week) : [...done, week].sort((a, b) => a - b) } });

  return (
    <div className="stack">
      <PageHeader
        title="12-week reset"
        intro="Three months to go from scattered to systematic. One focus per week; each links to the part of the app that does the work."
      >
        <button className="button ghost" onClick={() => saveProfile({ settings: { reset_started_on: todayIso(), completed_weeks: [] } })}>
          Start a new 12 weeks
        </button>
      </PageHeader>

      <Panel>
        <div className="row between">
          <p>
            Started {formatDate(started)}. You're in week {currentWeek}, with {done.length} of 12 done.
          </p>
        </div>
        <Progress value={done.length} max={12} label="Weeks completed" />
      </Panel>

      <ol className="weeks">
        {WEEKS.map((w, i) => {
          const week = i + 1;
          const isDone = done.includes(week);
          const showMonth = i % 4 === 0;
          return (
            <li key={week} className={`${isDone ? "done" : ""} ${week === currentWeek ? "current" : ""}`}>
              {showMonth && <h2 className="month-title">Month {i / 4 + 1}: {w.month}</h2>}
              <div className="week">
                <label className="week-check">
                  <input type="checkbox" checked={isDone} onChange={() => toggle(week)} />
                  <span className="sr-only">Mark week {week} done</span>
                </label>
                <div>
                  <p className="week-num">Week {week}{week === currentWeek ? ", this week" : ""}</p>
                  <h3>{w.title}</h3>
                  <p>{w.task}</p>
                </div>
                <Link className="button small" to={w.path}>
                  Open
                </Link>
              </div>
            </li>
          );
        })}
      </ol>

      <Panel title="Your twenties, roughly" note={age ? `You're ${age}.` : "Add your birth year in Settings to see where you are."}>
        <ol className="decade">
          {DECADE.map((d) => {
            const here = age !== null && age >= d.from && age <= d.to;
            return (
              <li key={d.from} className={here ? "here" : ""}>
                <span className="decade-ages">
                  {d.from} to {d.to}
                </span>
                <h3>{d.title}</h3>
                <p>{d.body}</p>
              </li>
            );
          })}
        </ol>
      </Panel>
    </div>
  );
}
