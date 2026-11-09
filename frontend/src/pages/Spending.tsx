import { useRef, useState } from "react";
import { FormError, IconButton, Icons, MoneyInput, PageHeader, Panel, Segmented, useSubmit } from "../components/ui";
import { api } from "../lib/api";
import { useApi, useCollection } from "../lib/hooks";
import { formatDate, labelize, money, todayIso } from "../lib/money";
import type { Expense, SaveSplurgeItem, SpendingSummary } from "../lib/types";

const CATEGORIES = ["required", "leak", "future", "guilt_free"] as const;
const CATEGORY_HELP: Record<string, string> = {
  required: "Rent, groceries, bills, transit",
  leak: "Forgotten subscriptions, impulse buys, fees",
  future: "Savings, investing, extra debt payments",
  guilt_free: "Things you genuinely enjoy",
};

export default function Spending() {
  const [days, setDays] = useState("90");
  const summary = useApi<SpendingSummary>(`/expenses/summary?days=${days}`);
  const expenses = useCollection<Expense>(`/expenses?days=${days}`, "expense");
  const [remember, setRemember] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const refreshAll = async () => {
    await Promise.all([summary.reload(), expenses.reload()]);
  };

  const recategorize = async (expense: Expense, category: string) => {
    const result = await api.patch<Expense & { relabeled: number }>(`/expenses/${expense.id}`, { expense: { category }, remember });
    setMessage(
      remember
        ? `Moved to ${labelize(category)}. ${result.relabeled} other matching transaction${result.relabeled === 1 ? "" : "s"} updated, and future imports will follow.`
        : `Moved to ${labelize(category)}.`,
    );
    await refreshAll();
  };

  const s = summary.data;
  const monthlyTotal = s ? CATEGORIES.reduce((sum, c) => sum + s.by_category[c].monthly_cents, 0) : 0;

  return (
    <div className="stack">
      <PageHeader
        title="Spending audit"
        intro="Sort every transaction into four buckets. The goal isn't to cut everything; it's to stop paying for things you don't value."
      >
        <Segmented
          label="Period"
          value={days}
          onChange={setDays}
          options={[
            { value: "30", label: "30 days" },
            { value: "90", label: "90 days" },
            { value: "180", label: "180 days" },
          ]}
        />
      </PageHeader>

      {s && (
        <Panel title="Monthly average" note={`${s.count} transactions over ${s.days} days, ${money(monthlyTotal)} a month.`}>
          <div className="stacked-bar" aria-hidden="true">
            {CATEGORIES.map((c) =>
              s.by_category[c].monthly_cents > 0 ? <span key={c} className={`swatch-${c}`} style={{ flexGrow: s.by_category[c].monthly_cents }} /> : null,
            )}
          </div>
          <ul className="bucket-grid">
            {CATEGORIES.map((c) => (
              <li key={c}>
                <span className={`swatch swatch-${c}`} aria-hidden="true" />
                <div>
                  <strong>{labelize(c)}</strong>
                  <span className="muted small">{CATEGORY_HELP[c]}</span>
                </div>
                <span className="figure">{money(s.by_category[c].monthly_cents)}</span>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <div className="grid-2">
        <Panel title="Biggest leaks" note="Pick at least three to cancel or cap this month.">
          {s && s.top_leaks.length > 0 ? (
            <ol className="leak-list">
              {s.top_leaks.map((leak) => (
                <li key={leak.description}>
                  <span>{leak.description}</span>
                  <span className="figure">{money(leak.monthly_cents)}/mo</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="muted">No leaks tagged yet. Import a statement, then move anything you regret into Leaks.</p>
          )}
        </Panel>
        <ImportPanel onImported={refreshAll} />
      </div>

      <SaveSplurge />

      <Panel
        title="Transactions"
        action={
          <label className="check small">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            <span>Remember my category per merchant</span>
          </label>
        }
      >
        {message && (
          <p className="saved" role="status">
            {message}
          </p>
        )}
        <AddExpense onAdd={(attrs) => expenses.create(attrs).then(refreshAll)} />
        {expenses.items.length === 0 ? (
          <p className="muted">Nothing in this period yet.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th className="num">Amount</th>
                  <th>Bucket</th>
                  <th>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {expenses.items.map((e) => (
                  <tr key={e.id}>
                    <td className="nowrap">{formatDate(e.spent_on, { month: "short", day: "numeric" })}</td>
                    <td>{e.description}</td>
                    <td className="num">{money(e.amount_cents, "exact")}</td>
                    <td>
                      <select aria-label={`Bucket for ${e.description}`} className={`cat-select cat-${e.category}`} value={e.category} onChange={(ev) => recategorize(e, ev.target.value)}>
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {labelize(c)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <IconButton label={`Delete ${e.description}`} onClick={() => expenses.remove(e.id).then(summary.reload)}>
                        {Icons.trash}
                      </IconButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}

function ImportPanel({ onImported }: { onImported: () => Promise<void> }) {
  const [text, setText] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const file = useRef<HTMLInputElement>(null);
  const { busy, error, run } = useSubmit();

  const send = (csv: string) =>
    run(async () => {
      const r = await api.post<{ imported: number; skipped: number }>("/expenses/import", { csv });
      setResult(`Imported ${r.imported} transactions${r.skipped ? `, skipped ${r.skipped} already here` : ""}.`);
      setText("");
      if (file.current) file.current.value = "";
      await onImported();
    })();

  return (
    <Panel title="Import a statement" note="Download a CSV from your bank or card (RBC, TD, Scotiabank and most cards work). Money coming in is ignored.">
      <div className="stack-sm">
        <input
          ref={file}
          type="file"
          accept=".csv,text/csv"
          aria-label="Choose a CSV file"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (f) send(await f.text());
          }}
        />
        <details>
          <summary>Or paste CSV text</summary>
          <textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} aria-label="CSV text" placeholder="Date,Description,Amount" />
          <button className="button" disabled={busy || !text.trim()} onClick={() => send(text)}>
            Import pasted text
          </button>
        </details>
        {busy && <p className="muted">Importing…</p>}
        {result && <p className="saved">{result}</p>}
        <FormError message={error} />
      </div>
    </Panel>
  );
}

function AddExpense({ onAdd }: { onAdd: (attrs: Record<string, unknown>) => Promise<unknown> }) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState(todayIso());
  const [category, setCategory] = useState("");
  const { busy, error, run } = useSubmit();

  return (
    <form
      className="add-row"
      onSubmit={run(async () => {
        await onAdd({ description, amount_cents: amount, spent_on: date, category });
        setDescription("");
        setAmount(0);
      })}
    >
      <input aria-label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      <input aria-label="Description" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} required />
      <MoneyInput cents={amount || null} onChange={setAmount} required />
      <select aria-label="Bucket" value={category} onChange={(e) => setCategory(e.target.value)}>
        <option value="">Auto-sort</option>
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {labelize(c)}
          </option>
        ))}
      </select>
      <button className="button" disabled={busy}>
        Add
      </button>
      <FormError message={error} />
    </form>
  );
}

function SaveSplurge() {
  const items = useCollection<SaveSplurgeItem>("/save_splurge_items", "save_splurge_item");
  return (
    <Panel title="Save vs. splurge" note="Cut costs where you don't care so you can spend without guilt where you do.">
      <div className="grid-2 tight">
        {(["save", "splurge"] as const).map((kind) => (
          <SaveSplurgeColumn key={kind} kind={kind} items={items.items.filter((i) => i.kind === kind)} onAdd={(label) => items.create({ kind, label })} onRemove={items.remove} />
        ))}
      </div>
    </Panel>
  );
}

function SaveSplurgeColumn({
  kind,
  items,
  onAdd,
  onRemove,
}: {
  kind: "save" | "splurge";
  items: SaveSplurgeItem[];
  onAdd: (label: string) => Promise<unknown>;
  onRemove: (id: number) => Promise<unknown>;
}) {
  const [label, setLabel] = useState("");
  return (
    <div>
      <h3 className="subhead">{kind === "save" ? "Spend as little as possible on" : "Happily spend on"}</h3>
      <ul className="plain-list">
        {items.map((i) => (
          <li key={i.id}>
            <span>{i.label}</span>
            <IconButton label={`Remove ${i.label}`} onClick={() => onRemove(i.id)}>
              {Icons.trash}
            </IconButton>
          </li>
        ))}
      </ul>
      <form
        className="inline-form"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!label.trim()) return;
          await onAdd(label.trim());
          setLabel("");
        }}
      >
        <input aria-label={kind === "save" ? "Add something to save on" : "Add something to splurge on"} placeholder="Add an item" value={label} onChange={(e) => setLabel(e.target.value)} />
        <button className="button">Add</button>
      </form>
    </div>
  );
}
