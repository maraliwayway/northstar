import { Link } from "react-router-dom";
import { LineChart } from "../components/LineChart";
import { Loading, Panel, Progress, Star, TextLink, useSubmit, FormError } from "../components/ui";
import { api } from "../lib/api";
import { useUser } from "../lib/auth";
import { useApi } from "../lib/hooks";
import { formatDate, labelize, money, percent } from "../lib/money";
import type { Dashboard, User } from "../lib/types";

export default function Overview() {
  const { data, error, reload } = useApi<Dashboard>("/dashboard");
  const { user, setUser } = useUser();
  const raise = useSubmit();

  if (!data) return <Loading error={error} onRetry={reload} />;
  const { key_numbers: k, net_worth: nw, emergency_fund: ef, ladder, roadmap, reset } = data;
  const routeRaise = (apply: boolean) =>
    raise.run(async () => {
      setUser(await api.post<User>("/profile/route_raise", { apply }));
      await reload();
    })();

  return (
    <div className="stack">
      <section className="hero">
        <p className="hero-meta">
          <Star size={16} /> Week {reset.current_week} of your 12-week reset
        </p>
        {user.why_statement ? (
          <blockquote className="why">{user.why_statement}</blockquote>
        ) : (
          <div className="why-empty">
            <p className="why">Why do you want financial freedom?</p>
            <TextLink to="/north-star">Write your North Star</TextLink>
          </div>
        )}
      </section>

      {data.last_raise && (
        <div className="notice" role="status">
          <p>
            Your take-home went up by <strong>{money(data.last_raise.delta_cents)}</strong> a month. Send{" "}
            <strong>{money(data.last_raise.suggested_invest_cents)}</strong> of it to investing before it turns into lifestyle creep?
          </p>
          <div className="row">
            <button className="button primary" disabled={raise.busy} onClick={() => routeRaise(true)}>
              Add to my investing step
            </button>
            <button className="button ghost" disabled={raise.busy} onClick={() => routeRaise(false)}>
              Not now
            </button>
          </div>
          <FormError message={raise.error} />
        </div>
      )}

      <dl className="ledger">
        <div>
          <dt>Net worth</dt>
          <dd className={nw.net_cents < 0 ? "negative" : ""}>{money(nw.net_cents)}</dd>
          <p>
            {money(nw.assets_cents)} owned, {money(nw.liabilities_cents)} owed
          </p>
        </div>
        <div>
          <dt>Savings rate</dt>
          <dd>{percent(k.savings_rate_pct)}</dd>
          <p>{money(k.monthly_savings_cents)} a month to future you</p>
        </div>
        <div>
          <dt>Financial independence number</dt>
          <dd>{money(k.fi_number_cents, "compact")}</dd>
          <p>25 × {money(k.annual_expenses_cents)} yearly spending</p>
        </div>
        <div>
          <dt>True hourly rate</dt>
          <dd>{money(k.hourly_rate_cents, "exact")}</dd>
          <p>Gross income ÷ 2,000 hours</p>
        </div>
      </dl>

      <div className="grid-2">
        <Panel title="What to do next" note="Each step makes the next one safer. Finished steps stay ticked as long as the numbers hold.">
          <ol className="roadmap">
            {roadmap.map((step) => (
              <li key={step.key} className={`step-${step.status}`}>
                <span className="step-mark" aria-hidden="true" />
                <div>
                  <Link to={step.path}>{step.title}</Link>
                  <p>{step.detail}</p>
                </div>
                <span className="sr-only">{step.status}</span>
              </li>
            ))}
          </ol>
        </Panel>

        <Panel title="Freedom ladder" note={`Measured on savings and investments: ${money(ladder.liquid_cents)}.`}>
          <ol className="ladder" reversed>
            {[...ladder.rungs].reverse().map((rung) => {
              const isNext = ladder.next?.amount_cents === rung.amount_cents;
              return (
                <li key={rung.amount_cents} className={rung.reached ? "reached" : isNext ? "next" : ""}>
                  <span className="rung-amount">{money(rung.amount_cents, "compact")}</span>
                  <span className="rung-label">{rung.label}</span>
                  {isNext && <Progress value={ladder.progress_to_next_pct} max={100} tone="gold" label="Progress to next rung" />}
                </li>
              );
            })}
          </ol>
        </Panel>
      </div>

      <div className="grid-2">
        <Panel title="Safety net" action={<TextLink to="/net-worth">Manage accounts</TextLink>}>
          <p className="big-figure">{money(ef.current_cents)}</p>
          <p className="muted">
            {ef.months_covered !== null
              ? `Covers ${ef.months_covered} months of essential spending. Target is ${ef.months_target} months (${money(ef.target_cents)}).`
              : "Import spending or set monthly expenses in Settings to size your target."}
          </p>
          <div className="milestones">
            <div>
              <span>Starter cushion {money(ef.starter_cents)}</span>
              <Progress value={ef.current_cents} max={ef.starter_cents} label="Starter emergency fund" />
            </div>
            {ef.target_cents > 0 && (
              <div>
                <span>Full fund {money(ef.target_cents)}</span>
                <Progress value={ef.current_cents} max={ef.target_cents} label="Full emergency fund" />
              </div>
            )}
          </div>
        </Panel>

        <Panel title="Where the money went" note="Monthly average over the last 90 days." action={<TextLink to="/spending">Audit</TextLink>}>
          <ul className="bucket-list">
            {Object.entries(data.spending).map(([key, cents]) => (
              <li key={key}>
                <span className={`swatch swatch-${key}`} aria-hidden="true" />
                <span>{labelize(key)}</span>
                <strong>{money(cents)}</strong>
              </li>
            ))}
          </ul>
          <p className="muted small">
            {money(k.hundred_a_month.value_cents)} is what $100 a month becomes over {k.hundred_a_month.years} years at 7%.
          </p>
        </Panel>
      </div>

      <Panel title="Net worth over time" note="A snapshot is saved whenever you change a balance.">
        <LineChart label="Net worth history" points={nw.history.map((s) => ({ x: s.recorded_on, y: s.net_cents }))} />
      </Panel>

      <div className="grid-2">
        <Panel title="Goals in motion" action={<TextLink to="/north-star">All goals</TextLink>}>
          {data.goals.length === 0 ? (
            <p className="muted">Set one measurable goal for the next 12 weeks.</p>
          ) : (
            <ul className="goal-list">
              {data.goals.map((g) => (
                <li key={g.id}>
                  <div className="row between">
                    <span>{g.title}</span>
                    <span className="muted small">{labelize(g.horizon)}</span>
                  </div>
                  {g.target_cents ? <Progress value={g.current_cents} max={g.target_cents} label={g.title} /> : null}
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Quarterly review">
          <p className="big-figure small-figure">{formatDate(data.next_review_on)}</p>
          <p className="muted">
            {data.last_review_on ? `Last reviewed ${formatDate(data.last_review_on)}.` : "You haven't done a review yet."} Thirty minutes to check
            what's working and pick one goal for the next quarter.
          </p>
          <TextLink to="/review">Start a review</TextLink>
        </Panel>
      </div>
    </div>
  );
}
