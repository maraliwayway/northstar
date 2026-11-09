import { useId, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { toCents, toDollars } from "../lib/money";

export function PageHeader({ title, intro, children }: { title: string; intro?: ReactNode; children?: ReactNode }) {
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        {intro && <p className="intro">{intro}</p>}
      </div>
      {children && <div className="page-actions">{children}</div>}
    </header>
  );
}

export function Panel({
  title,
  note,
  action,
  children,
  tone,
  className = "",
}: {
  title?: string;
  note?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  tone?: "quiet" | "accent";
  className?: string;
}) {
  return (
    <section className={`panel ${tone ? `panel-${tone}` : ""} ${className}`}>
      {(title || action) && (
        <div className="panel-head">
          <div>
            {title && <h2>{title}</h2>}
            {note && <p className="panel-note">{note}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: ReactNode; children: (id: string) => ReactNode }) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children(id)}
      {hint && <p className="hint">{hint}</p>}
    </div>
  );
}

export function MoneyInput({
  id,
  cents,
  onChange,
  placeholder = "0",
  required,
}: {
  id?: string;
  cents: number | null | undefined;
  onChange: (cents: number) => void;
  placeholder?: string;
  required?: boolean;
}) {
  const [text, setText] = useState(toDollars(cents));
  const [focused, setFocused] = useState(false);
  const shown = focused ? text : toDollars(cents);
  return (
    <div className="money-input">
      <span aria-hidden="true">$</span>
      <input
        id={id}
        inputMode="decimal"
        value={shown}
        placeholder={placeholder}
        required={required}
        onFocus={() => {
          setText(toDollars(cents));
          setFocused(true);
        }}
        onBlur={() => setFocused(false)}
        onChange={(e) => {
          setText(e.target.value);
          onChange(toCents(e.target.value));
        }}
      />
    </div>
  );
}

export function Progress({ value, max, tone = "pine", label }: { value: number; max: number; tone?: "pine" | "gold" | "brick"; label: string }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div className={`progress progress-${tone}`} role="progressbar" aria-label={label} aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <span style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={value === o.value} className={value === o.value ? "on" : ""} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Empty({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="empty">
      <p>{children}</p>
      {action}
    </div>
  );
}

export function Loading({ error, onRetry }: { error?: string | null; onRetry?: () => void }) {
  if (error)
    return (
      <div className="state-message" role="alert">
        <p>{error}</p>
        {onRetry && (
          <button className="button" onClick={onRetry}>
            Try again
          </button>
        )}
      </div>
    );
  return <div className="state-message" aria-busy="true">Loading…</div>;
}

// Wraps a form submit with busy + error state so every form behaves the same.
export function useSubmit() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = (fn: () => Promise<unknown>) => async (event?: FormEvent) => {
    event?.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, run, setError };
}

export function FormError({ message }: { message: string | null }) {
  return message ? (
    <p className="form-error" role="alert">
      {message}
    </p>
  ) : null;
}

export function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" className="icon-button" aria-label={label} title={label} onClick={onClick}>
      {children}
    </button>
  );
}

export const Icons = {
  trash: (
    <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
      <path d="M7 3h6M4 6h12M6 6l.8 10h6.4L14 6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  up: (
    <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
      <path d="M5 12l5-5 5 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  down: (
    <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
      <path d="M5 8l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true">
      <path d="M4.5 10.5l3.5 3.5 7.5-8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

export function Star({ size = 22 }: { size?: number }) {
  return (
    <svg className="star" viewBox="0 0 32 32" width={size} height={size} aria-hidden="true">
      <path d="M16 3l2.9 10.1L29 16l-10.1 2.9L16 29l-2.9-10.1L3 16l10.1-2.9z" fill="currentColor" />
    </svg>
  );
}

export function TextLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link className="text-link" to={to}>
      {children}
    </Link>
  );
}
