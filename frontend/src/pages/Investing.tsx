import { useState } from "react";
import { LineChart } from "../components/LineChart";
import { Field, FormError, IconButton, Icons, MoneyInput, PageHeader, Panel, Segmented, TextLink, useSubmit } from "../components/ui";
import { useUser } from "../lib/auth";
import { useApi, useCollection, useDebounced } from "../lib/hooks";
import { labelize, money, percent } from "../lib/money";
import type { Account, AllocationResult, Holding } from "../lib/types";

const CLASSES = ["canadian_equity", "us_equity", "international_equity", "bonds", "cash"];
const PROFILES = ["conservative", "balanced", "growth", "aggressive", "custom"] as const;

export default function Investing() {
  const { user, saveProfile } = useUser();
  const [contribution, setContribution] = useState(50000);
  const debounced = useDebounced(contribution);
  const allocation = useApi<AllocationResult>(`/allocation?contribution_cents=${debounced}`);
  const accounts = useCollection<Account>("/accounts", "account");
  const holdings = useCollection<Holding>("/holdings", "holding");
  const refresh = () => Promise.all([allocation.reload(), accounts.reload()]);
  const investmentAccounts = accounts.items.filter((a) => a.investment);
  const a = allocation.data;

  return (
    <div className="stack">
      <PageHeader
        title="Investing"
        intro="Pick a mix you can stick with through a bad year, buy broad index funds, and let each new contribution pull you back toward target."
      />

      <Panel title="Your target mix" note="Higher stock share means more growth and bigger drops along the way.">
        <Segmented
          label="Risk profile"
          value={user.risk_profile as (typeof PROFILES)[number]}
          onChange={(v) => saveProfile({ risk_profile: v }).then(allocation.reload)}
          options={PROFILES.map((p) => ({ value: p, label: labelize(p) }))}
        />
        {user.risk_profile === "custom" && <CustomTargets onSaved={allocation.reload} />}
        <ProfileQuiz onPick={(p) => saveProfile({ risk_profile: p }).then(allocation.reload)} />
      </Panel>

      {a && (
        <Panel
          title={`Portfolio ${money(a.total_cents)}`}
          note={a.total_cents > 0 ? `Furthest from target: ${percent(a.max_drift_pct)}.` : "Add holdings below to compare against your target."}
        >
          <div className="extra-control">
            <label htmlFor="contribution">Next contribution</label>
            <MoneyInput id="contribution" cents={contribution} onChange={setContribution} />
          </div>
          <div className="table-wrap">
            <table className="table allocation">
              <thead>
                <tr>
                  <th>Asset class</th>
                  <th>Current vs target</th>
                  <th className="num">Now</th>
                  <th className="num">Target</th>
                  <th className="num">Buy</th>
                </tr>
              </thead>
              <tbody>
                {a.rows.map((r) => (
                  <tr key={r.asset_class}>
                    <td>{labelize(r.asset_class)}</td>
                    <td>
                      <div className="alloc-bar" aria-hidden="true">
                        <span className="alloc-current" style={{ width: `${Math.min(100, r.current_pct)}%` }} />
                        <span className="alloc-target" style={{ left: `${Math.min(100, r.target_pct)}%` }} />
                      </div>
                    </td>
                    <td className="num">{percent(r.current_pct)}</td>
                    <td className="num">{percent(r.target_pct, 0)}</td>
                    <td className="num">{r.buy_cents > 0 ? money(r.buy_cents) : "–"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="muted small">
            The bar shows what you hold; the tick marks the target. Buying only what's underweight rebalances without selling, so there's no
            capital gain to report in a non-registered account.
          </p>
        </Panel>
      )}

      <Panel title="Holdings" note="Update market values every month or so. Classify all-in-one ETFs by their largest share, or split them across rows.">
        {investmentAccounts.length === 0 ? (
          <div className="stack-sm">
            <p className="muted">Add an investment account first.</p>
            <div className="row">
              {["tfsa", "rrsp", "fhsa"].map((kind) => (
                <button key={kind} className="button" onClick={() => accounts.create({ name: labelize(kind), kind, balance_cents: 0 })}>
                  Add {labelize(kind)}
                </button>
              ))}
              <TextLink to="/net-worth">Other account types</TextLink>
            </div>
          </div>
        ) : (
          investmentAccounts.map((acct) => (
            <div key={acct.id} className="holding-group">
              <h3 className="subhead">
                {acct.name} <span className="muted">{money(acct.value_cents)}</span>
              </h3>
              <ul className="plain-list">
                {holdings.items
                  .filter((h) => h.account_id === acct.id)
                  .map((h) => (
                    <HoldingRow
                      key={h.id}
                      holding={h}
                      onSave={(cents) => holdings.update(h.id, { market_value_cents: cents }).then(refresh)}
                      onDelete={() => holdings.remove(h.id).then(refresh)}
                    />
                  ))}
              </ul>
            </div>
          ))
        )}
        {investmentAccounts.length > 0 && <AddHolding accounts={investmentAccounts} onAdd={(attrs) => holdings.create(attrs).then(refresh)} />}
      </Panel>

      <CompoundCalculator />

      <Panel title="Which account first" note="General information, not advice. Contribution room and rules come from the CRA; check your room in CRA My Account.">
        <dl className="account-guide">
          <div>
            <dt>Employer match</dt>
            <dd>If your employer matches group RRSP or pension contributions, take the full match first. It's part of your pay.</dd>
          </div>
          <div>
            <dt>FHSA</dt>
            <dd>
              For first-time home buyers: contributions are deductible like an RRSP and withdrawals for a qualifying home are tax-free like a TFSA.
              $8,000 a year, $40,000 lifetime.
            </dd>
          </div>
          <div>
            <dt>TFSA</dt>
            <dd>Growth and withdrawals are tax-free, and you can take money out without losing the room for good. Flexible and good early in a career.</dd>
          </div>
          <div>
            <dt>RRSP</dt>
            <dd>Contributions lower your taxable income now; withdrawals are taxed later. Gets more valuable as your tax bracket rises.</dd>
          </div>
          <div>
            <dt>Non-registered</dt>
            <dd>No limits and no tax shelter. Use it once the registered accounts are full.</dd>
          </div>
        </dl>
      </Panel>
    </div>
  );
}

function ProfileQuiz({ onPick }: { onPick: (profile: string) => void }) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const questions = [
    { key: "horizon", q: "When will you need most of this money?", options: ["Within 3 years", "3 to 7 years", "7 to 15 years", "15+ years"] },
    { key: "drop", q: "Your portfolio falls 25% in a year. You…", options: ["Sell to stop the loss", "Stop contributing", "Hold and wait", "Buy more"] },
    { key: "income", q: "How steady is your income?", options: ["Unpredictable", "Mostly steady", "Very steady"] },
  ];
  const complete = questions.every((q) => answers[q.key] !== undefined);
  const score = Object.values(answers).reduce((s, v) => s + v, 0);
  const suggestion = !complete
    ? null
    : answers.horizon === 0
      ? "conservative"
      : score <= 2
        ? "conservative"
        : score <= 4
          ? "balanced"
          : score <= 6
            ? "growth"
            : "aggressive";

  return (
    <details className="quiz">
      <summary>Not sure? Answer three questions</summary>
      {questions.map((q) => (
        <fieldset key={q.key}>
          <legend>{q.q}</legend>
          <div className="chips">
            {q.options.map((label, i) => (
              <button
                type="button"
                key={label}
                className={`chip ${answers[q.key] === i ? "on" : ""}`}
                aria-pressed={answers[q.key] === i}
                onClick={() => setAnswers({ ...answers, [q.key]: i })}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>
      ))}
      {suggestion && (
        <div className="row">
          <p>
            A <strong>{labelize(suggestion)}</strong> mix fits those answers{answers.horizon === 0 ? ", since money needed soon shouldn't ride the stock market" : ""}.
          </p>
          <button className="button primary" onClick={() => onPick(suggestion)}>
            Use {labelize(suggestion)}
          </button>
        </div>
      )}
    </details>
  );
}

function CustomTargets({ onSaved }: { onSaved: () => void }) {
  const { user, saveProfile } = useUser();
  const [targets, setTargets] = useState<Record<string, number>>(
    user.settings.custom_targets ?? { canadian_equity: 25, us_equity: 40, international_equity: 20, bonds: 15, cash: 0 },
  );
  const total = CLASSES.reduce((s, k) => s + (Number(targets[k]) || 0), 0);
  const { busy, error, run } = useSubmit();
  return (
    <form
      className="custom-targets"
      onSubmit={run(async () => {
        await saveProfile({ settings: { custom_targets: targets } });
        onSaved();
      })}
    >
      {CLASSES.map((k) => (
        <Field key={k} label={labelize(k)}>
          {(id) => <input id={id} inputMode="decimal" value={targets[k] ?? 0} onChange={(e) => setTargets({ ...targets, [k]: Number(e.target.value) || 0 })} />}
        </Field>
      ))}
      <div className="field end">
        <p className={Math.abs(total - 100) > 0.01 ? "negative small" : "muted small"}>Total {total}%{Math.abs(total - 100) > 0.01 ? ", must be 100" : ""}</p>
        <button className="button primary" disabled={busy || Math.abs(total - 100) > 0.01}>
          Save mix
        </button>
      </div>
      <FormError message={error} />
    </form>
  );
}

function HoldingRow({ holding, onSave, onDelete }: { holding: Holding; onSave: (cents: number) => Promise<unknown>; onDelete: () => void }) {
  const [value, setValue] = useState(holding.market_value_cents);
  return (
    <li>
      <div>
        <strong>{holding.symbol}</strong> <span className="muted small">{holding.name}</span>
        <span className="muted small block">{labelize(holding.asset_class)}</span>
      </div>
      <form
        className="row tight end"
        onSubmit={(e) => {
          e.preventDefault();
          onSave(value);
        }}
      >
        <MoneyInput cents={value} onChange={setValue} />
        {value !== holding.market_value_cents && <button className="button small">Save</button>}
      </form>
      <IconButton label={`Delete ${holding.symbol}`} onClick={onDelete}>
        {Icons.trash}
      </IconButton>
    </li>
  );
}

function AddHolding({ accounts, onAdd }: { accounts: Account[]; onAdd: (attrs: Partial<Holding>) => Promise<unknown> }) {
  const [accountId, setAccountId] = useState(accounts[0].id);
  const [symbol, setSymbol] = useState("");
  const [name, setName] = useState("");
  const [assetClass, setAssetClass] = useState("us_equity");
  const [value, setValue] = useState(0);
  const { busy, error, run } = useSubmit();
  return (
    <form
      className="form-grid add-block"
      onSubmit={run(async () => {
        await onAdd({ account_id: accountId, symbol, name, asset_class: assetClass, market_value_cents: value });
        setSymbol("");
        setName("");
        setValue(0);
      })}
    >
      <Field label="Account">
        {(id) => (
          <select id={id} value={accountId} onChange={(e) => setAccountId(Number(e.target.value))}>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        )}
      </Field>
      <Field label="Ticker">{(id) => <input id={id} value={symbol} placeholder="e.g. VFV" onChange={(e) => setSymbol(e.target.value)} required />}</Field>
      <Field label="Name (optional)">{(id) => <input id={id} value={name} placeholder="S&P 500 index ETF" onChange={(e) => setName(e.target.value)} />}</Field>
      <Field label="Asset class">
        {(id) => (
          <select id={id} value={assetClass} onChange={(e) => setAssetClass(e.target.value)}>
            {CLASSES.map((c) => (
              <option key={c} value={c}>
                {labelize(c)}
              </option>
            ))}
          </select>
        )}
      </Field>
      <Field label="Market value">{(id) => <MoneyInput id={id} cents={value || null} onChange={setValue} required />}</Field>
      <div className="field end">
        <button className="button primary" disabled={busy}>
          Add holding
        </button>
      </div>
      <FormError message={error} />
    </form>
  );
}

type CompoundResult = {
  comparison: { start_age: number; years: number; contributed_cents: number; value_cents: number }[];
  curve: { age: number; value_cents: number }[];
};

function CompoundCalculator() {
  const { user } = useUser();
  const age = user.birth_year ? new Date().getFullYear() - user.birth_year : 21;
  const [monthly, setMonthly] = useState(10000);
  const [rate, setRate] = useState("7");
  const [target, setTarget] = useState("40");
  const query = useDebounced(`monthly_cents=${monthly}&rate=${rate}&early_age=${age}&late_age=${age + 4}&target_age=${Math.max(Number(target) || 40, age + 5)}`);
  const { data } = useApi<CompoundResult>(`/calculators/compound?${query}`);
  const [early, late] = data?.comparison ?? [];

  return (
    <Panel title="Why starting now matters" note="Same monthly amount, four years apart. Returns are an assumption, not a promise.">
      <div className="form-grid">
        <Field label="Each month">{(id) => <MoneyInput id={id} cents={monthly} onChange={setMonthly} />}</Field>
        <Field label="Yearly return (%)">{(id) => <input id={id} inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} />}</Field>
        <Field label="Until age">{(id) => <input id={id} inputMode="numeric" value={target} onChange={(e) => setTarget(e.target.value)} />}</Field>
      </div>
      {early && late && (
        <>
          <div className="compare">
            <div className="strategy">
              <h3>Start at {early.start_age}</h3>
              <p className="big-figure small-figure">{money(early.value_cents)}</p>
              <p className="muted">{money(early.contributed_cents)} put in</p>
            </div>
            <div className="strategy">
              <h3>Start at {late.start_age}</h3>
              <p className="big-figure small-figure">{money(late.value_cents)}</p>
              <p className="muted">{money(late.contributed_cents)} put in</p>
            </div>
          </div>
          <p className="verdict">
            Waiting four years costs {money(early.value_cents - late.value_cents)}, of which only {money(early.contributed_cents - late.contributed_cents)} is
            money you'd have put in.
          </p>
          <LineChart label="Growth by age" xFormat="raw" points={(data?.curve ?? []).map((p) => ({ x: `Age ${p.age}`, y: p.value_cents }))} />
        </>
      )}
    </Panel>
  );
}

