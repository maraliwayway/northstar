import { useState } from "react";
import { Field, FormError, IconButton, Icons, MoneyInput, PageHeader, Panel, Segmented, useSubmit } from "../components/ui";
import { api } from "../lib/api";
import { useUser } from "../lib/auth";
import { useApi } from "../lib/hooks";
import { downloadCalendar, paydayRule } from "../lib/ics";
import { labelize, money, todayIso } from "../lib/money";
import type { PaycheckPlan, Rule } from "../lib/types";

type Payload = { rules: Rule[]; plan: PaycheckPlan };
const KINDS = ["bills", "emergency", "debt", "invest", "savings_goal", "spending"];

export default function Paycheque() {
  const { user, saveProfile } = useUser();
  const { data, setData, error, reload } = useApi<Payload>("/automation_rules");
  const action = useSubmit();
  const [payday, setPayday] = useState(user.settings.next_payday ?? todayIso());
  const [takeHome, setTakeHome] = useState(user.monthly_take_home_cents);

  const plan = data?.plan;
  const move = (index: number, delta: number) =>
    action.run(async () => {
      if (!data) return;
      const ids = data.rules.map((r) => r.id);
      const [moved] = ids.splice(index, 1);
      ids.splice(index + delta, 0, moved);
      setData(await api.patch<Payload>("/automation_rules/reorder", { ids }));
    })();

  const exportCalendar = () => {
    if (!plan) return;
    const [y, m, d] = payday.split("-").map(Number);
    const start = new Date(y, m - 1, d, 9, 0);
    const lines = plan.steps
      .filter((s) => s.kind !== "bills")
      .map((s) => `${money(s.per_paycheck_cents, "exact")} to ${s.destination || labelize(s.kind)} (${s.label})`);
    downloadCalendar("northstar-payday.ics", [
      {
        title: "Payday: pay yourself first",
        description: `Check these transfers ran:\n${lines.join("\n")}`,
        start,
        minutes: 15,
        rrule: paydayRule(user.pay_frequency, start),
      },
    ]);
  };

  return (
    <div className="stack">
      <PageHeader
        title="Paycheque plan"
        intro="Decide once where every paycheque goes, then schedule the transfers for the morning after payday so saving happens before spending can."
      />

      <Panel title="Your pay">
        <form
          className="form-grid"
          onSubmit={action.run(() => saveProfile({ monthly_take_home_cents: takeHome, settings: { next_payday: payday } }).then(reload))}
        >
          <Field label="Monthly take-home pay" hint="After tax and deductions.">
            {(id) => <MoneyInput id={id} cents={takeHome} onChange={setTakeHome} />}
          </Field>
          <Field label="How often you're paid">
            {(id) => (
              <select
                id={id}
                value={user.pay_frequency}
                onChange={(e) => action.run(() => saveProfile({ pay_frequency: e.target.value }).then(reload))()}
              >
                {["weekly", "biweekly", "semimonthly", "monthly"].map((f) => (
                  <option key={f} value={f}>
                    {labelize(f)}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Next payday">{(id) => <input id={id} type="date" value={payday} onChange={(e) => setPayday(e.target.value)} />}</Field>
          <div className="field end">
            <button className="button primary" disabled={action.busy}>
              Save pay details
            </button>
          </div>
        </form>
      </Panel>

      {!data ? (
        <FormError message={error} />
      ) : data.rules.length === 0 ? (
        <Panel title="Start with the pay-yourself-first order">
          <p className="muted">
            Bills stay in chequing, then the emergency fund, then debt minimums, then investing, and what's left is yours to spend. You can change
            every number afterwards.
          </p>
          <button className="button primary" disabled={action.busy} onClick={action.run(async () => setData(await api.post<Payload>("/automation_rules/template")))}>
            Create my plan
          </button>
          <FormError message={action.error} />
        </Panel>
      ) : (
        <Panel
          title={`Each paycheque: ${money(plan!.paycheck_cents)}`}
          note={`${plan!.paychecks_per_year} paycheques a year. ${money(plan!.monthly_saving_cents)} a month goes to savings and investing.`}
          action={
            <button className="button" onClick={exportCalendar}>
              Add payday reminders to calendar
            </button>
          }
        >
          <ol className="flow">
            {plan!.steps.map((step, i) => (
              <RuleRow key={step.id} step={step} first={i === 0} last={i === plan!.steps.length - 1} onMove={(d) => move(i, d)} onChange={reload} />
            ))}
          </ol>
          <div className={`flow-total ${plan!.over_allocated ? "warn" : ""}`}>
            {plan!.over_allocated
              ? `Over by ${money(-plan!.unassigned_cents)} per paycheque. Lower a step or the ones at the bottom won't be fully funded.`
              : `${money(plan!.unassigned_cents)} per paycheque isn't assigned yet.`}
          </div>
          <FormError message={action.error} />
          <AddRule onAdded={reload} />
        </Panel>
      )}

      <Panel title="Making it automatic">
        <div className="prose">
          <p>
            Northstar plans the money; your bank and brokerage move it. Set each transfer above as a recurring transfer or recurring deposit for the
            business day after payday, in the same order. Most Canadian banks and brokerages (Wealthsimple, Questrade, the big five) support this
            in their app.
          </p>
          <p>
            Steps set as a percentage grow with your pay automatically. Fixed-dollar steps don't, which is why Northstar watches for raises: when
            your take-home goes up, you'll be asked to route {user.settings.raise_invest_percent}% of the difference to investing.
          </p>
          <RaiseShare />
        </div>
      </Panel>
    </div>
  );
}

function RuleRow({
  step,
  first,
  last,
  onMove,
  onChange,
}: {
  step: PaycheckPlan["steps"][number];
  first: boolean;
  last: boolean;
  onMove: (delta: number) => void;
  onChange: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  return (
    <li className={`flow-step kind-${step.kind}`}>
      <div className="flow-main">
        <div>
          <strong>{step.label}</strong>
          <span className="muted small">
            {labelize(step.kind)}
            {step.destination ? `, to ${step.destination}` : ""}. {step.percent ? `${step.percent}% of pay` : `${money(step.amount_cents)} a month`}
          </span>
        </div>
        <div className="flow-amount">
          <span className="figure">{money(step.per_paycheck_cents)}</span>
          {step.short_by_cents > 0 && <span className="negative small">short {money(step.short_by_cents)}</span>}
        </div>
        <div className="row tight">
          <IconButton label="Move up" onClick={() => !first && onMove(-1)}>
            {Icons.up}
          </IconButton>
          <IconButton label="Move down" onClick={() => !last && onMove(1)}>
            {Icons.down}
          </IconButton>
          <button className="button small ghost" onClick={() => setEditing(!editing)}>
            {editing ? "Close" : "Edit"}
          </button>
        </div>
      </div>
      {editing && <RuleForm rule={step} onDone={() => onChange().then(() => setEditing(false))} />}
    </li>
  );
}

function RuleForm({ rule, onDone }: { rule?: Rule; onDone: () => Promise<void> | void }) {
  const [label, setLabel] = useState(rule?.label ?? "");
  const [kind, setKind] = useState(rule?.kind ?? "invest");
  const [mode, setMode] = useState<"percent" | "amount">(rule?.percent ? "percent" : "amount");
  const [amount, setAmount] = useState(rule?.amount_cents ?? 0);
  const [pct, setPct] = useState(String(rule?.percent ?? ""));
  const [destination, setDestination] = useState(rule?.destination ?? "");
  const { busy, error, run } = useSubmit();

  const body = {
    automation_rule: {
      label,
      kind,
      destination,
      amount_cents: mode === "amount" ? amount : null,
      percent: mode === "percent" ? Number(pct) : null,
    },
  };

  return (
    <form
      className="form-grid rule-form"
      onSubmit={run(async () => {
        if (rule) await api.patch(`/automation_rules/${rule.id}`, body);
        else await api.post("/automation_rules", body);
        await onDone();
      })}
    >
      <Field label="Name">{(id) => <input id={id} value={label} onChange={(e) => setLabel(e.target.value)} required />}</Field>
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
      <Field label="Where it goes">{(id) => <input id={id} value={destination} placeholder="e.g. TFSA" onChange={(e) => setDestination(e.target.value)} />}</Field>
      <div className="field">
        <span className="label">Amount</span>
        <Segmented
          label="Amount type"
          value={mode}
          onChange={setMode}
          options={[
            { value: "percent", label: "% of pay" },
            { value: "amount", label: "$ a month" },
          ]}
        />
        {mode === "percent" ? (
          <input aria-label="Percent of pay" inputMode="decimal" value={pct} onChange={(e) => setPct(e.target.value)} placeholder="10" />
        ) : (
          <MoneyInput cents={amount} onChange={setAmount} />
        )}
      </div>
      <div className="row">
        <button className="button primary" disabled={busy}>
          {rule ? "Save step" : "Add step"}
        </button>
        {rule && (
          <button
            type="button"
            className="button ghost danger"
            onClick={run(async () => {
              await api.del(`/automation_rules/${rule.id}`);
              await onDone();
            })}
          >
            Delete step
          </button>
        )}
      </div>
      <FormError message={error} />
    </form>
  );
}

function AddRule({ onAdded }: { onAdded: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  return open ? (
    <RuleForm onDone={() => onAdded().then(() => setOpen(false))} />
  ) : (
    <button className="button" onClick={() => setOpen(true)}>
      Add a step
    </button>
  );
}

function RaiseShare() {
  const { user, saveProfile } = useUser();
  const [value, setValue] = useState(String(user.settings.raise_invest_percent));
  return (
    <form
      className="inline-form"
      onSubmit={(e) => {
        e.preventDefault();
        saveProfile({ settings: { raise_invest_percent: Number(value) || 0 } });
      }}
    >
      <label htmlFor="raise-share">Share of every raise to invest</label>
      <input id="raise-share" inputMode="numeric" className="short" value={value} onChange={(e) => setValue(e.target.value)} />
      <span>%</span>
      <button className="button">Save</button>
    </form>
  );
}
