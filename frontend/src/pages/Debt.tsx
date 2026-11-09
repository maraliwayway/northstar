import { useState } from "react";
import { Field, FormError, IconButton, Icons, MoneyInput, PageHeader, Panel, useSubmit } from "../components/ui";
import { useUser } from "../lib/auth";
import { useApi, useCollection, useDebounced } from "../lib/hooks";
import { addMonths, labelize, money } from "../lib/money";
import type { Debt, DebtPlan, PayoffResult } from "../lib/types";

const KINDS = ["credit_card", "line_of_credit", "student_loan", "car_loan", "mortgage", "other"];

export default function DebtPage() {
  const debts = useCollection<Debt>("/debts", "debt");
  const [extra, setExtra] = useState(10000);
  const debouncedExtra = useDebounced(extra);
  const plan = useApi<DebtPlan>(`/debts/plan?extra_cents=${debouncedExtra}`);
  const thenReplan = (change: Promise<unknown>) => change.then(plan.reload);

  return (
    <div className="stack">
      <PageHeader
        title="Debt payoff"
        intro="List every debt with its balance, rate and minimum. Pay the minimum on all of them and throw everything extra at one target."
      />

      <Panel title="What you owe">
        {debts.items.length === 0 ? (
          <p className="muted">No debts listed. If that's true, use this week to pull your free credit report from Equifax and TransUnion instead.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Debt</th>
                  <th className="num">Balance</th>
                  <th className="num">Rate</th>
                  <th className="num">Minimum</th>
                  <th>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {debts.items.map((d) => (
                  <DebtRow key={d.id} debt={d} onSave={(attrs) => thenReplan(debts.update(d.id, attrs))} onDelete={() => thenReplan(debts.remove(d.id))} />
                ))}
              </tbody>
            </table>
          </div>
        )}
        <AddDebt onAdd={(attrs) => thenReplan(debts.create(attrs))} />
      </Panel>

      {plan.data && plan.data.avalanche.order.length > 0 && (
        <Panel
          title="Avalanche or snowball"
          note="Mortgages are left out; this is about consumer debt. Minimums freed up by a cleared debt roll into the next one."
        >
          <div className="extra-control">
            <label htmlFor="extra">Extra each month on top of minimums</label>
            <MoneyInput id="extra" cents={extra} onChange={setExtra} />
            <input type="range" min={0} max={200000} step={2500} value={extra} onChange={(e) => setExtra(Number(e.target.value))} aria-label="Extra payment slider" />
          </div>
          <div className="compare">
            <Strategy result={plan.data.avalanche} title="Avalanche" blurb="Highest rate first. Least interest overall." />
            <Strategy result={plan.data.snowball} title="Snowball" blurb="Smallest balance first. Quicker early wins." />
          </div>
          <p className="verdict">
            {plan.data.interest_saved_with_avalanche_cents > 100
              ? `Avalanche saves ${money(plan.data.interest_saved_with_avalanche_cents)} in interest. Snowball is still a good choice if early wins keep you going.`
              : "Both orders cost about the same here, so pick whichever keeps you motivated."}
          </p>
        </Panel>
      )}

      <CardRules />
    </div>
  );
}

function Strategy({ result, title, blurb }: { result: PayoffResult; title: string; blurb: string }) {
  const debtFree = result.months ? addMonths(new Date(), result.months).toLocaleDateString("en-CA", { month: "long", year: "numeric" }) : null;
  return (
    <div className="strategy">
      <h3>{title}</h3>
      <p className="muted small">{blurb}</p>
      {result.paid_off ? (
        <>
          <p className="big-figure small-figure">{debtFree}</p>
          <p className="muted">
            {result.months} months, {money(result.total_interest_cents)} interest
          </p>
        </>
      ) : (
        <p className="negative">At these payments the balance never clears. Raise the extra amount.</p>
      )}
      <ol className="payoff-order">
        {result.order.map((o) => (
          <li key={o.id}>
            <span>{o.name}</span>
            <span className="muted small">{o.paid_off_month ? `month ${o.paid_off_month}` : "not cleared"}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function DebtRow({ debt, onSave, onDelete }: { debt: Debt; onSave: (attrs: Partial<Debt>) => Promise<unknown>; onDelete: () => void }) {
  const [balance, setBalance] = useState(debt.balance_cents);
  const dirty = balance !== debt.balance_cents;
  return (
    <tr>
      <td>
        <strong>{debt.name}</strong>
        <span className="muted small block">{labelize(debt.kind)}</span>
      </td>
      <td className="num">
        <form
          className="row tight end"
          onSubmit={(e) => {
            e.preventDefault();
            onSave({ balance_cents: balance });
          }}
        >
          <MoneyInput cents={balance} onChange={setBalance} />
          {dirty && <button className="button small">Save</button>}
        </form>
      </td>
      <td className={`num ${debt.interest_rate >= 8 ? "negative" : ""}`}>{debt.interest_rate.toFixed(2)}%</td>
      <td className="num">{money(debt.minimum_payment_cents)}</td>
      <td>
        <IconButton label={`Delete ${debt.name}`} onClick={onDelete}>
          {Icons.trash}
        </IconButton>
      </td>
    </tr>
  );
}

function AddDebt({ onAdd }: { onAdd: (attrs: Partial<Debt>) => Promise<unknown> }) {
  const [name, setName] = useState("");
  const [kind, setKind] = useState("credit_card");
  const [balance, setBalance] = useState(0);
  const [rate, setRate] = useState("");
  const [minimum, setMinimum] = useState(0);
  const { busy, error, run } = useSubmit();

  return (
    <form
      className="form-grid add-block"
      onSubmit={run(async () => {
        await onAdd({ name, kind, balance_cents: balance, interest_rate: Number(rate), minimum_payment_cents: minimum });
        setName("");
        setBalance(0);
        setRate("");
        setMinimum(0);
      })}
    >
      <Field label="Name">{(id) => <input id={id} value={name} placeholder="e.g. Visa" onChange={(e) => setName(e.target.value)} required />}</Field>
      <Field label="Type">
        {(id) => (
          <select id={id} value={kind} onChange={(e) => setKind(e.target.value)}>
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {labelize(k)}
              </option>
            ))}
          </select>
        )}
      </Field>
      <Field label="Balance">{(id) => <MoneyInput id={id} cents={balance || null} onChange={setBalance} required />}</Field>
      <Field label="Interest rate (%)">{(id) => <input id={id} inputMode="decimal" value={rate} placeholder="20.99" onChange={(e) => setRate(e.target.value)} required />}</Field>
      <Field label="Minimum payment">{(id) => <MoneyInput id={id} cents={minimum || null} onChange={setMinimum} />}</Field>
      <div className="field end">
        <button className="button primary" disabled={busy}>
          Add debt
        </button>
      </div>
      <FormError message={error} />
    </form>
  );
}

function CardRules() {
  const { user, saveProfile } = useUser();
  const [rules, setRules] = useState(user.settings.card_rules);
  const [saved, setSaved] = useState(false);
  const { busy, error, run } = useSubmit();
  const update = (patch: Partial<typeof rules>) => {
    setRules({ ...rules, ...patch });
    setSaved(false);
  };

  return (
    <Panel title="Credit card rules" note="Rewards are never worth it if you're paying interest. Write the rules down while you're calm.">
      <form
        className="stack-sm"
        onSubmit={run(async () => {
          await saveProfile({ settings: { card_rules: rules } });
          setSaved(true);
        })}
      >
        <Field label="What's allowed on the card">
          {(id) => <input id={id} value={rules.allowed} placeholder="Groceries, transit, bills already in the budget" onChange={(e) => update({ allowed: e.target.value })} />}
        </Field>
        <Field label="How you'll use the rewards">
          {(id) => <input id={id} value={rules.rewards_plan} placeholder="Cash back goes to the TFSA every quarter" onChange={(e) => update({ rewards_plan: e.target.value })} />}
        </Field>
        <label className="check">
          <input type="checkbox" checked={rules.autopay_full} onChange={(e) => update({ autopay_full: e.target.checked })} />
          <span>The full statement balance is paid automatically every month</span>
        </label>
        <label className="check">
          <input type="checkbox" checked={rules.paused} onChange={(e) => update({ paused: e.target.checked })} />
          <span>Cards are paused because they've been causing overspending</span>
        </label>
        {!rules.autopay_full && !rules.paused && (
          <p className="notice-inline">Set up autopay for the full statement balance, not the minimum, in your card issuer's app.</p>
        )}
        <FormError message={error} />
        <div className="row">
          <button className="button primary" disabled={busy}>
            Save rules
          </button>
          {saved && <span className="saved">Saved</span>}
        </div>
      </form>
    </Panel>
  );
}
