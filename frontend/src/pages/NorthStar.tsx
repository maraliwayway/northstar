import { useState } from "react";
import { Field, FormError, IconButton, Icons, MoneyInput, PageHeader, Panel, Progress, useSubmit } from "../components/ui";
import { useUser } from "../lib/auth";
import { useCollection } from "../lib/hooks";
import { formatDate, labelize, money } from "../lib/money";
import type { Goal } from "../lib/types";

const MOTIVATIONS = [
  "Financial independence",
  "Travel without worrying",
  "Support my family",
  "Buy a home",
  "Freedom to leave a job",
  "Start a business",
  "Never stress about bills",
];

const HORIZONS: { key: string; prompt: string }[] = [
  { key: "twelve_week", prompt: "One measurable goal, e.g. save your first $1,000 or pay off a card." },
  { key: "one_year", prompt: "A specific number you can check next year." },
  { key: "five_year", prompt: "Income, career, investments, a home or a business." },
  { key: "ten_year", prompt: "The life you want your money to make possible." },
];

export default function NorthStar() {
  const { user, saveProfile } = useUser();
  const [why, setWhy] = useState(user.why_statement ?? "");
  const [custom, setCustom] = useState("");
  const [saved, setSaved] = useState(false);
  const save = useSubmit();
  const motivations = user.settings.motivations;
  const goals = useCollection<Goal>("/goals", "goal");

  const toggle = (m: string) =>
    saveProfile({ settings: { motivations: motivations.includes(m) ? motivations.filter((x) => x !== m) : [...motivations, m] } });

  return (
    <div className="stack">
      <PageHeader
        title="Your North Star"
        intro="Budgets fail when the reason is fuzzy. Write the reason down, in your own words, and you'll see it every time you open the app."
      />

      <Panel title="Why you want financial freedom">
        <form
          onSubmit={save.run(async () => {
            await saveProfile({ why_statement: why });
            setSaved(true);
          })}
        >
          <Field label="In one or two sentences" hint="Specific beats inspiring. “So I can say no to a job I hate” works better than “to be rich.”">
            {(id) => (
              <textarea
                id={id}
                className="why-input"
                rows={3}
                value={why}
                onChange={(e) => {
                  setWhy(e.target.value);
                  setSaved(false);
                }}
              />
            )}
          </Field>
          <FormError message={save.error} />
          <div className="row">
            <button className="button primary" disabled={save.busy}>
              Save my why
            </button>
            {saved && <span className="saved">Saved</span>}
          </div>
        </form>

        <h3 className="subhead">What it unlocks</h3>
        <div className="chips">
          {[...new Set([...MOTIVATIONS, ...motivations])].map((m) => (
            <button key={m} type="button" className={`chip ${motivations.includes(m) ? "on" : ""}`} aria-pressed={motivations.includes(m)} onClick={() => toggle(m)}>
              {motivations.includes(m) && Icons.check} {m}
            </button>
          ))}
        </div>
        <form
          className="inline-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (custom.trim()) toggle(custom.trim());
            setCustom("");
          }}
        >
          <input aria-label="Add your own reason" placeholder="Add your own" value={custom} onChange={(e) => setCustom(e.target.value)} />
          <button className="button">Add</button>
        </form>
      </Panel>

      <div className="grid-2">
        {HORIZONS.map((h) => (
          <GoalColumn key={h.key} horizon={h.key} prompt={h.prompt} goals={goals.items.filter((g) => g.horizon === h.key)} api={goals} />
        ))}
      </div>
    </div>
  );
}

function GoalColumn({
  horizon,
  prompt,
  goals,
  api,
}: {
  horizon: string;
  prompt: string;
  goals: Goal[];
  api: ReturnType<typeof useCollection<Goal>>;
}) {
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState(0);
  const [due, setDue] = useState("");
  const add = useSubmit();

  return (
    <Panel title={labelize(horizon)} note={prompt}>
      <ul className="goal-list">
        {goals.map((g) => (
          <li key={g.id} className={g.completed ? "done" : ""}>
            <div className="row between">
              <label className="check">
                <input type="checkbox" checked={g.completed} onChange={() => api.update(g.id, { completed: !g.completed })} />
                <span>{g.title}</span>
              </label>
              <IconButton label={`Delete ${g.title}`} onClick={() => api.remove(g.id)}>
                {Icons.trash}
              </IconButton>
            </div>
            {g.target_cents ? (
              <>
                <Progress value={g.current_cents} max={g.target_cents} label={g.title} />
                <div className="row between small">
                  <GoalProgressInput goal={g} onSave={(cents) => api.update(g.id, { current_cents: cents })} />
                  <span className="muted">
                    of {money(g.target_cents)}
                    {g.due_on ? ` by ${formatDate(g.due_on)}` : ""}
                  </span>
                </div>
              </>
            ) : g.due_on ? (
              <p className="muted small">By {formatDate(g.due_on)}</p>
            ) : null}
          </li>
        ))}
      </ul>
      <form
        className="stack-sm"
        onSubmit={add.run(async () => {
          await api.create({ horizon, title, target_cents: target || null, due_on: due || null });
          setTitle("");
          setTarget(0);
          setDue("");
        })}
      >
        <input aria-label="Goal" placeholder="Add a goal" required value={title} onChange={(e) => setTitle(e.target.value)} />
        <div className="row">
          <MoneyInput cents={target || null} onChange={setTarget} placeholder="Target (optional)" />
          <input aria-label="Due date" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
          <button className="button" disabled={add.busy}>
            Add
          </button>
        </div>
        <FormError message={add.error} />
      </form>
    </Panel>
  );
}

function GoalProgressInput({ goal, onSave }: { goal: Goal; onSave: (cents: number) => void }) {
  const [cents, setCents] = useState(goal.current_cents);
  return (
    <form
      className="row tight"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(cents);
      }}
    >
      <MoneyInput cents={cents} onChange={setCents} />
      <button className="button small">Update</button>
    </form>
  );
}
