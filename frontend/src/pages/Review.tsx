import { useState } from "react";
import { Field, FormError, PageHeader, Panel, Segmented, useSubmit } from "../components/ui";
import { useCollection } from "../lib/hooks";
import { downloadCalendar } from "../lib/ics";
import { addMonths, formatDate, money } from "../lib/money";
import type { Review } from "../lib/types";

const QUESTIONS: Record<string, string> = {
  automation: "Are your automatic transfers working?",
  debt: "Did consumer debt go down?",
  emergency: "Is your emergency fund growing?",
  investing: "Are you investing consistently?",
  income: "Did your income experiment work?",
  habits: "Have old spending habits stayed away?",
};
type Answer = "yes" | "partly" | "no";

export default function ReviewPage() {
  const reviews = useCollection<Review>("/reviews", "review");
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [keep, setKeep] = useState("");
  const [change, setChange] = useState("");
  const [watch, setWatch] = useState("");
  const [goal, setGoal] = useState("");
  const [done, setDone] = useState(false);
  const { busy, error, run } = useSubmit();
  const last = reviews.items[0];

  const remind = () => {
    const start = addMonths(new Date(), 3);
    start.setHours(10, 0, 0, 0);
    downloadCalendar("northstar-quarterly-review.ics", [
      {
        title: "Quarterly money review (30 min)",
        description: "Open Northstar > Quarterly review. Check automation, debt, emergency fund, investing and income. Pick one goal for the next 12 weeks.",
        start,
        minutes: 30,
        rrule: "FREQ=MONTHLY;INTERVAL=3",
      },
    ]);
  };

  return (
    <div className="stack">
      <PageHeader title="Quarterly review" intro="Thirty minutes every three months. Compare where you are with where you started and adjust one thing.">
        <button className="button" onClick={remind}>
          Add a recurring reminder to my calendar
        </button>
      </PageHeader>

      <Panel title="This quarter" note={last ? `Last review ${formatDate(last.reviewed_on)}, net worth then ${money(last.net_worth_cents)}.` : "Your first review sets the baseline."}>
        {done ? (
          <div className="stack-sm">
            <p className="saved">Review saved. Your next one is around {formatDate(addMonths(new Date(), 3).toISOString())}.</p>
            <button className="button" onClick={() => setDone(false)}>
              Start another
            </button>
          </div>
        ) : (
          <form
            className="stack"
            onSubmit={run(async () => {
              await reviews.create({ answers, keep_rule: keep, change_rule: change, watch_weakness: watch, next_goal: goal });
              setAnswers({});
              setKeep("");
              setChange("");
              setWatch("");
              setGoal("");
              setDone(true);
            })}
          >
            <ul className="question-list">
              {Object.entries(QUESTIONS).map(([key, q]) => (
                <li key={key}>
                  <span>{q}</span>
                  <Segmented
                    label={q}
                    value={answers[key] ?? ("" as Answer)}
                    onChange={(v) => setAnswers({ ...answers, [key]: v })}
                    options={[
                      { value: "yes", label: "Yes" },
                      { value: "partly", label: "Partly" },
                      { value: "no", label: "No" },
                    ]}
                  />
                </li>
              ))}
            </ul>
            <div className="form-grid">
              <Field label="One rule to keep">{(id) => <input id={id} value={keep} onChange={(e) => setKeep(e.target.value)} />}</Field>
              <Field label="One rule to change">{(id) => <input id={id} value={change} onChange={(e) => setChange(e.target.value)} />}</Field>
              <Field label="One weakness to watch">{(id) => <input id={id} value={watch} onChange={(e) => setWatch(e.target.value)} />}</Field>
              <Field label="The one goal for next quarter">{(id) => <input id={id} value={goal} onChange={(e) => setGoal(e.target.value)} required />}</Field>
            </div>
            <FormError message={error} />
            <div>
              <button className="button primary" disabled={busy}>
                Save review
              </button>
            </div>
          </form>
        )}
      </Panel>

      {reviews.items.length > 0 && (
        <Panel title="Past reviews">
          <ul className="review-history">
            {reviews.items.map((r) => (
              <li key={r.id}>
                <div className="row between">
                  <strong>{formatDate(r.reviewed_on)}</strong>
                  <span className="figure">{money(r.net_worth_cents)}</span>
                </div>
                <p>
                  <span className="muted">Goal:</span> {r.next_goal || "–"}
                </p>
                <p className="muted small">
                  {Object.values(r.answers).filter((a) => a === "yes").length} of {Object.keys(QUESTIONS).length} going well
                  {r.keep_rule ? `. Keep: ${r.keep_rule}` : ""}
                  {r.change_rule ? `. Change: ${r.change_rule}` : ""}
                  {r.watch_weakness ? `. Watch: ${r.watch_weakness}` : ""}
                </p>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}
