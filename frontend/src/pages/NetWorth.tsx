import { useState } from "react";
import { LineChart } from "../components/LineChart";
import { Field, FormError, IconButton, Icons, Loading, MoneyInput, PageHeader, Panel, Progress, Segmented, TextLink, useSubmit } from "../components/ui";
import { useUser } from "../lib/auth";
import { useApi, useCollection } from "../lib/hooks";
import { labelize, money } from "../lib/money";
import type { Account, Dashboard } from "../lib/types";

const KINDS = ["chequing", "hisa", "tfsa", "rrsp", "fhsa", "resp", "non_registered", "pension", "property", "vehicle", "other"];

export default function NetWorth() {
  const dashboard = useApi<Dashboard>("/dashboard");
  const accounts = useCollection<Account>("/accounts", "account");
  const refresh = () => dashboard.reload();

  if (!dashboard.data) return <Loading error={dashboard.error} onRetry={dashboard.reload} />;
  const { net_worth: nw, emergency_fund: ef } = dashboard.data;

  return (
    <div className="stack">
      <PageHeader
        title="Net worth & safety net"
        intro="What you own minus what you owe. Keep balances roughly current; every change saves a snapshot so the trend draws itself."
      />

      <dl className="ledger three">
        <div>
          <dt>Net worth</dt>
          <dd className={nw.net_cents < 0 ? "negative" : ""}>{money(nw.net_cents)}</dd>
          {nw.net_cents < 0 && <p>A starting point, not a grade.</p>}
        </div>
        <div>
          <dt>Assets</dt>
          <dd>{money(nw.assets_cents)}</dd>
        </div>
        <div>
          <dt>Liabilities</dt>
          <dd>{money(nw.liabilities_cents)}</dd>
          <p>
            <TextLink to="/debt">Edit debts</TextLink>
          </p>
        </div>
      </dl>

      <Panel title="Trend">
        <LineChart label="Net worth over time" points={nw.history.map((s) => ({ x: s.recorded_on, y: s.net_cents }))} />
      </Panel>

      <EmergencyFund ef={ef} onSaved={refresh} />

      <Panel title="Accounts and assets" note="Investment accounts are valued from their holdings once you add some on the Investing page.">
        <ul className="account-list">
          {accounts.items.map((a) => (
            <AccountRow
              key={a.id}
              account={a}
              onSave={(attrs) => accounts.update(a.id, attrs).then(refresh)}
              onDelete={() => accounts.remove(a.id).then(refresh)}
            />
          ))}
        </ul>
        <AddAccount onAdd={(attrs) => accounts.create(attrs).then(refresh)} />
      </Panel>
    </div>
  );
}

function EmergencyFund({ ef, onSaved }: { ef: Dashboard["emergency_fund"]; onSaved: () => void }) {
  const { user, saveProfile } = useUser();
  const [starter, setStarter] = useState(user.settings.starter_goal_cents);
  const save = (settings: Parameters<typeof saveProfile>[0]["settings"]) => saveProfile({ settings }).then(onSaved);

  return (
    <Panel
      title="Emergency fund"
      note="Kept in cash, not invested, so a broken laptop or a lost job never forces you to sell investments or borrow."
      tone="accent"
    >
      <div className="ef-grid">
        <div>
          <p className="big-figure">{money(ef.current_cents)}</p>
          <p className="muted">
            {ef.essential_monthly_cents > 0
              ? `Essential spending is about ${money(ef.essential_monthly_cents)} a month, so this covers ${ef.months_covered ?? 0} months.`
              : "Import spending or set your monthly expenses in Settings to size the target."}
          </p>
          <p className="muted small">Tick “Emergency fund” on the savings account that holds it.</p>
        </div>
        <div className="stack-sm">
          <span className="label">Target size</span>
          <Segmented
            label="Months of expenses"
            value={String(ef.months_target)}
            onChange={(v) => save({ emergency_months: Number(v) })}
            options={[
              { value: "3", label: "3 months" },
              { value: "6", label: "6 months" },
              { value: "12", label: "12 months" },
            ]}
          />
          <div>
            <span className="small">Starter cushion {money(ef.starter_cents)}</span>
            <Progress value={ef.current_cents} max={ef.starter_cents} label="Starter emergency fund" />
          </div>
          {ef.target_cents > 0 && (
            <div>
              <span className="small">Full fund {money(ef.target_cents)}</span>
              <Progress value={ef.current_cents} max={ef.target_cents} label="Full emergency fund" />
            </div>
          )}
          <form
            className="inline-form"
            onSubmit={(e) => {
              e.preventDefault();
              save({ starter_goal_cents: starter });
            }}
          >
            <label htmlFor="starter">Starter goal</label>
            <MoneyInput id="starter" cents={starter} onChange={setStarter} />
            <button className="button">Save</button>
          </form>
        </div>
      </div>
    </Panel>
  );
}

function AccountRow({ account, onSave, onDelete }: { account: Account; onSave: (attrs: Partial<Account>) => Promise<unknown>; onDelete: () => void }) {
  const [balance, setBalance] = useState(account.balance_cents);
  const valuedByHoldings = account.holdings_count > 0;
  return (
    <li>
      <div>
        <strong>{account.name}</strong>
        <span className="muted small block">{labelize(account.kind)}</span>
      </div>
      <label className="check small">
        <input type="checkbox" checked={account.emergency_fund} onChange={(e) => onSave({ emergency_fund: e.target.checked })} />
        <span>Emergency fund</span>
      </label>
      {valuedByHoldings ? (
        <span className="figure">
          {money(account.value_cents)} <span className="muted small block">from holdings</span>
        </span>
      ) : (
        <form
          className="row tight end"
          onSubmit={(e) => {
            e.preventDefault();
            onSave({ balance_cents: balance });
          }}
        >
          <MoneyInput cents={balance} onChange={setBalance} />
          {balance !== account.balance_cents && <button className="button small">Save</button>}
        </form>
      )}
      <IconButton label={`Delete ${account.name}`} onClick={onDelete}>
        {Icons.trash}
      </IconButton>
    </li>
  );
}

function AddAccount({ onAdd }: { onAdd: (attrs: Partial<Account>) => Promise<unknown> }) {
  const [name, setName] = useState("");
  const [kind, setKind] = useState("hisa");
  const [balance, setBalance] = useState(0);
  const [emergency, setEmergency] = useState(false);
  const { busy, error, run } = useSubmit();
  return (
    <form
      className="form-grid add-block"
      onSubmit={run(async () => {
        await onAdd({ name, kind, balance_cents: balance, emergency_fund: emergency });
        setName("");
        setBalance(0);
        setEmergency(false);
      })}
    >
      <Field label="Name">{(id) => <input id={id} value={name} placeholder="e.g. EQ Bank savings" onChange={(e) => setName(e.target.value)} required />}</Field>
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
      <Field label="Balance or value">{(id) => <MoneyInput id={id} cents={balance || null} onChange={setBalance} />}</Field>
      <div className="field end">
        <label className="check">
          <input type="checkbox" checked={emergency} onChange={(e) => setEmergency(e.target.checked)} />
          <span>Emergency fund</span>
        </label>
      </div>
      <div className="field end">
        <button className="button primary" disabled={busy}>
          Add account
        </button>
      </div>
      <FormError message={error} />
    </form>
  );
}
