import { useState } from "react";
import { FormError, Segmented, Star, useSubmit } from "../components/ui";
import { useAuth } from "../lib/auth";

export default function Login() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { busy, error, run } = useSubmit();
  const showDemo = import.meta.env.VITE_SHOW_DEMO === "true";

  const submit = run(() => (mode === "in" ? signIn(email, password) : signUp(name, email, password)));

  return (
    <div className="login">
      <div className="login-intro">
        <span className="brand">
          <Star size={26} /> Northstar
        </span>
        <h1>A money system you set up once and check in on, not a spreadsheet you abandon.</h1>
        <p>
          Write down why you're doing this, audit 90 days of spending, automate payday, pay down expensive debt, invest to a target mix and
          watch your net worth move. Your data syncs across your phone and laptop.
        </p>
      </div>

      <form className="login-card" onSubmit={submit}>
        <Segmented
          label="Sign in or create an account"
          value={mode}
          onChange={setMode}
          options={[
            { value: "in", label: "Sign in" },
            { value: "up", label: "Create account" },
          ]}
        />
        {mode === "up" && (
          <div className="field">
            <label htmlFor="name">First name</label>
            <input id="name" autoComplete="given-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
        )}
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete={mode === "in" ? "current-password" : "new-password"}
            minLength={mode === "up" ? 10 : undefined}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {mode === "up" && <p className="hint">At least 10 characters.</p>}
        </div>
        <FormError message={error} />
        <button className="button primary wide" disabled={busy}>
          {busy ? "One moment…" : mode === "in" ? "Sign in" : "Create account"}
        </button>
        {showDemo && mode === "in" && (
          <button
            type="button"
            className="button ghost wide"
            onClick={() => {
              setEmail("demo@northstar.dev");
              setPassword("northstar-demo");
            }}
          >
            Fill in the demo account
          </button>
        )}
      </form>
    </div>
  );
}
