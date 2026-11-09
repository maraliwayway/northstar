import { useState } from "react";
import { Field, FormError, IconButton, Icons, MoneyInput, PageHeader, Panel, useSubmit } from "../components/ui";
import { useUser } from "../lib/auth";
import { useCollection } from "../lib/hooks";
import { formatDate, labelize, money, todayIso } from "../lib/money";
import type { IncomeExperiment } from "../lib/types";

const STATUSES = ["idea", "trying", "keeping", "stopped"];
const IDEAS = [
  "Sell clothes or gear you no longer use",
  "Freelance a skill you already use at work",
  "Tutor or coach in something you're good at",
  "Pick up a weekend shift or gig",
  "Ask what it takes to get promoted, then do it",
  "Take a course that leads to a higher-paying role",
];

export default function Income() {
  const { user } = useUser();
  const experiments = useCollection<IncomeExperiment>("/income_experiments", "income_experiment");
  const total = experiments.items.reduce((s, e) => s + e.earned_cents, 0);
  const hourlyJob = Math.round(user.annual_income_cents / 2000);

  return (
    <div className="stack">
      <PageHeader
        title="Income experiments"
        intro="Cutting spending has a floor; earning more doesn't. Try one idea for seven days and record what it paid. An extra $100 to $500 a month changes the plan."
      />

      <dl className="ledger three">
        <div>
          <dt>Earned from experiments</dt>
          <dd>{money(total)}</dd>
        </div>
        <div>
          <dt>Experiments run</dt>
          <dd>{experiments.items.length}</dd>
        </div>
        <div>
          <dt>Your job pays</dt>
          <dd>{money(hourlyJob, "exact")}/hr</dd>
          <p>Compare each experiment's hourly rate against this.</p>
        </div>
      </dl>

      <Panel title="Your experiments">
        {experiments.items.length === 0 ? (
          <p className="muted">Nothing yet. Pick an idea below and give it seven days.</p>
        ) : (
          <ul className="experiment-list">
            {experiments.items.map((e) => (
              <ExperimentRow key={e.id} experiment={e} hourlyJob={hourlyJob} onSave={(attrs) => experiments.update(e.id, attrs)} onDelete={() => experiments.remove(e.id)} />
            ))}
          </ul>
        )}
        <AddExperiment onAdd={experiments.create} />
      </Panel>

      <Panel title="Ideas to start with">
        <ul className="idea-list">
          {IDEAS.map((idea) => (
            <li key={idea}>
              <span>{idea}</span>
              <button className="button small" onClick={() => experiments.create({ idea, status: "idea" })}>
                Add
              </button>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

function ExperimentRow({
  experiment: e,
  hourlyJob,
  onSave,
  onDelete,
}: {
  experiment: IncomeExperiment;
  hourlyJob: number;
  onSave: (attrs: Partial<IncomeExperiment>) => Promise<unknown>;
  onDelete: () => void;
}) {
  const [earned, setEarned] = useState(e.earned_cents);
  const [hours, setHours] = useState(String(e.hours));
  const dirty = earned !== e.earned_cents || Number(hours) !== e.hours;
  return (
    <li>
      <div className="row between">
        <div>
          <strong>{e.idea}</strong>
          <span className="muted small block">{e.started_on ? `Started ${formatDate(e.started_on)}` : "Not started"}</span>
        </div>
        <div className="row tight">
          <select aria-label="Status" value={e.status} onChange={(ev) => onSave({ status: ev.target.value })}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {labelize(s)}
              </option>
            ))}
          </select>
          <IconButton label={`Delete ${e.idea}`} onClick={onDelete}>
            {Icons.trash}
          </IconButton>
        </div>
      </div>
      <form
        className="row"
        onSubmit={(ev) => {
          ev.preventDefault();
          onSave({ earned_cents: earned, hours: Number(hours) || 0, started_on: e.started_on ?? todayIso() });
        }}
      >
        <label className="inline-label">
          Earned <MoneyInput cents={earned} onChange={setEarned} />
        </label>
        <label className="inline-label">
          Hours <input className="short" inputMode="decimal" value={hours} onChange={(ev) => setHours(ev.target.value)} />
        </label>
        {dirty && <button className="button small">Save</button>}
        {e.hourly_cents !== null && (
          <span className={e.hourly_cents >= hourlyJob ? "positive small" : "muted small"}>{money(e.hourly_cents, "exact")}/hr</span>
        )}
      </form>
    </li>
  );
}

function AddExperiment({ onAdd }: { onAdd: (attrs: Partial<IncomeExperiment>) => Promise<unknown> }) {
  const [idea, setIdea] = useState("");
  const { busy, error, run } = useSubmit();
  return (
    <form
      className="inline-form add-block"
      onSubmit={run(async () => {
        await onAdd({ idea, status: "trying", started_on: todayIso() });
        setIdea("");
      })}
    >
      <Field label="New experiment">{(id) => <input id={id} value={idea} placeholder="What will you try for 7 days?" onChange={(e) => setIdea(e.target.value)} required />}</Field>
      <button className="button primary" disabled={busy}>
        Start today
      </button>
      <FormError message={error} />
    </form>
  );
}
