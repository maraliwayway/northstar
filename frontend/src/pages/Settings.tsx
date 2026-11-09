import { useState } from "react";
import { Field, FormError, MoneyInput, PageHeader, Panel, useSubmit } from "../components/ui";
import { api } from "../lib/api";
import { useUser } from "../lib/auth";
import { labelize } from "../lib/money";

const PROVINCES = ["AB", "BC", "MB", "NB", "NL", "NS", "NT", "NU", "ON", "PE", "QC", "SK", "YT"];

export default function Settings() {
  const { user, saveProfile, signOut } = useUser();
  const [form, setForm] = useState({
    name: user.name,
    birth_year: user.birth_year ? String(user.birth_year) : "",
    province: user.province ?? "BC",
    annual_income_cents: user.annual_income_cents,
    monthly_take_home_cents: user.monthly_take_home_cents,
    monthly_expenses_cents: user.monthly_expenses_cents ?? 0,
    pay_frequency: user.pay_frequency,
  });
  const [saved, setSaved] = useState(false);
  const { busy, error, run } = useSubmit();
  const danger = useSubmit();
  const set = (patch: Partial<typeof form>) => {
    setForm({ ...form, ...patch });
    setSaved(false);
  };

  return (
    <div className="stack">
      <PageHeader title="Settings" intro="These numbers drive your savings rate, hourly rate, emergency fund target and paycheque plan." />

      <Panel title="Income and spending">
        <form
          className="form-grid"
          onSubmit={run(async () => {
            await saveProfile({
              ...form,
              birth_year: form.birth_year ? Number(form.birth_year) : null,
              monthly_expenses_cents: form.monthly_expenses_cents || null,
            });
            setSaved(true);
          })}
        >
          <Field label="First name">{(id) => <input id={id} value={form.name} onChange={(e) => set({ name: e.target.value })} />}</Field>
          <Field label="Birth year" hint="Used for the age roadmap and compounding examples.">
            {(id) => <input id={id} inputMode="numeric" value={form.birth_year} onChange={(e) => set({ birth_year: e.target.value })} />}
          </Field>
          <Field label="Province">
            {(id) => (
              <select id={id} value={form.province} onChange={(e) => set({ province: e.target.value })}>
                {PROVINCES.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Yearly income before tax" hint="For your true hourly rate.">
            {(id) => <MoneyInput id={id} cents={form.annual_income_cents} onChange={(c) => set({ annual_income_cents: c })} />}
          </Field>
          <Field label="Monthly take-home pay" hint="For your savings rate and paycheque plan.">
            {(id) => <MoneyInput id={id} cents={form.monthly_take_home_cents} onChange={(c) => set({ monthly_take_home_cents: c })} />}
          </Field>
          <Field label="Pay frequency">
            {(id) => (
              <select id={id} value={form.pay_frequency} onChange={(e) => set({ pay_frequency: e.target.value })}>
                {["weekly", "biweekly", "semimonthly", "monthly"].map((f) => (
                  <option key={f} value={f}>
                    {labelize(f)}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Monthly spending (optional)" hint="Leave blank to use your imported transactions instead.">
            {(id) => <MoneyInput id={id} cents={form.monthly_expenses_cents || null} onChange={(c) => set({ monthly_expenses_cents: c })} />}
          </Field>
          <div className="field end">
            <button className="button primary" disabled={busy}>
              Save settings
            </button>
            {saved && <span className="saved">Saved</span>}
          </div>
          <FormError message={error} />
        </form>
      </Panel>

      <Panel title="Account">
        <p className="muted">
          Signed in as {user.email}. Your data is stored on the Northstar server, so it's the same on every device you sign in from.
          {user.merchant_rule_count > 0 && ` ${user.merchant_rule_count} merchant rules are sorting your imports automatically.`}
        </p>
        <div className="row">
          <button className="button" onClick={() => signOut()}>
            Sign out
          </button>
          <button
            className="button ghost danger"
            disabled={danger.busy}
            onClick={danger.run(async () => {
              if (!window.confirm("Delete your account and every number in it? This can't be undone.")) return;
              await api.del("/profile");
              await signOut().catch(() => undefined);
            })}
          >
            Delete account
          </button>
        </div>
        <FormError message={danger.error} />
      </Panel>
    </div>
  );
}
