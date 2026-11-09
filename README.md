# Northstar

A personal finance system for a young Canadian investor: write down why you want financial freedom, audit 90 days of spending, automate payday, pay down expensive debt, invest to a target mix and track net worth from any device.

**Stack:** Ruby on Rails 8 (JSON API) · PostgreSQL · React 18 + TypeScript (Vite) · GitHub Actions · GitHub Pages + Render

```
northstar/
├── backend/    Rails API: auth, data, and all finance logic
├── frontend/   React + TypeScript client, deployed to GitHub Pages
├── render.yaml One-click Render Blueprint for the API
└── .github/workflows/  Pages deploy + backend test CI
```

## What it does

| Area | What you get |
| --- | --- |
| North Star | Your "why" shown front and centre, motivations, and 12-week / 1 / 5 / 10-year goals |
| 12-week reset | The week-by-week plan with progress, plus an age 21–30 roadmap |
| Spending audit | CSV import (RBC, TD, Scotiabank, most cards), auto-sorting into Required / Leaks / Future you / Guilt-free, merchant rules that learn from your edits, top leaks, Save vs. Splurge |
| Paycheque plan | Ordered pay-yourself-first steps (fixed $ or % of pay), per-paycheque amounts, over-allocation warnings, calendar (.ics) payday reminders, raise guard against lifestyle creep |
| Debt | Avalanche vs. snowball simulation with an adjustable extra payment, payoff dates and interest, credit-card rules |
| Net worth | Accounts + debts, automatic daily snapshots on every change, trend chart, emergency-fund targets (3/6/12 months) |
| Investing | Risk profiles (or custom), a 3-question profile quiz, current vs. target allocation, "where to put the next contribution" without selling, compound-growth calculator, Canadian account guide |
| Overview | Freedom ladder, FI number (25× spending), true hourly rate, savings rate, a "what to do next" roadmap |
| Habits | Income experiments with $/hour, quarterly reviews with a recurring calendar reminder |

Northstar plans the money; your bank or brokerage moves it. The paycheque page tells you exactly which recurring transfers to set up.

## Design decisions worth talking about

- **Business logic lives in plain Ruby objects** (`backend/app/services/finance/`): debt payoff, allocation, compounding, paycheque splits, statement parsing. They have no Rails dependencies and are unit tested.
- **Bearer tokens instead of cookies.** The client (`github.io`) and API (`onrender.com`) are on different sites, and Safari blocks third-party cookies. Only a SHA-256 digest of each token is stored, sessions expire after 30 days, and sign-in/sign-up are rate limited.
- **Money is stored as integer cents** everywhere to avoid floating-point rounding errors.
- **Every query is scoped to `current_user`**, so one person can never read another's records (covered by an integration test).
- **Net worth history builds itself**: changes to accounts, holdings or debts upsert today's snapshot.
- **Hash routing + `base: "./"`** let the frontend work at any GitHub Pages path.

## Run it locally

You need Ruby 3.3, Node 20+ and PostgreSQL running locally.

```bash
# API on http://localhost:3000
cd backend
bundle install
bin/rails db:prepare db:seed     # seeds demo@northstar.dev / northstar-demo
bin/rails server

# Client on http://localhost:5173 (new terminal)
cd frontend
cp .env.example .env
npm install
npm run dev
```

Tests: `cd backend && bin/rails test`. Type-check the client: `cd frontend && npm run typecheck`.

## Deploy

### 1. Database (Neon, free)
Create a project at neon.tech and copy the connection string (`postgresql://…`).

### 2. API (Render)
1. Commit `backend/Gemfile.lock` first: run `bundle install` and then `bundle lock --add-platform x86_64-linux` inside `backend/`.
2. In Render, choose **New → Blueprint**, pick this repo; it reads `render.yaml`.
3. Fill in the environment variables when asked:
   - `DATABASE_URL`: the Neon connection string
   - `FRONTEND_ORIGINS`: `https://<your-username>.github.io` (add `,http://localhost:5173` for local dev)
   - Set `SEED_DEMO` to `1` and run `bin/rails db:seed` from the Render shell if you want the demo account.
4. Note your API URL, e.g. `https://northstar-api.onrender.com`. Check `https://…/up` returns green.

Free Render services sleep when idle; the first request after a quiet spell can take up to a minute. The app shows a "waking up" message while that happens.

### 3. Frontend (GitHub Pages)
1. Repo **Settings → Pages → Source: GitHub Actions**.
2. Repo **Settings → Secrets and variables → Actions → Variables**: add `API_URL` = your Render URL. Optionally add `SHOW_DEMO` = `true` to show a "fill in the demo account" button for recruiters.
3. Push to `main`. The site deploys to `https://<your-username>.github.io/<repo>/`.

## API

All routes are under `/api` and need `Authorization: Bearer <token>` except registration and sign-in.

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/registration`, `/session` | Create account / sign in (returns a token) |
| DELETE | `/session` | Sign out |
| GET, PATCH, DELETE | `/profile` | Profile + settings; delete account |
| POST | `/profile/route_raise` | Apply or dismiss the raise suggestion |
| GET | `/dashboard` | Everything the overview needs, computed server-side |
| CRUD | `/accounts`, `/holdings`, `/debts`, `/expenses`, `/goals`, `/automation_rules`, `/income_experiments`, `/save_splurge_items`, `/reviews` | Your data |
| GET | `/debts/plan?extra_cents=` | Avalanche vs. snowball |
| POST / GET | `/expenses/import`, `/expenses/summary?days=` | CSV import, audit summary |
| PATCH / POST | `/automation_rules/reorder`, `/automation_rules/template` | Reorder steps; create the default plan |
| GET | `/allocation?contribution_cents=` | Current vs. target mix and buy plan |
| GET | `/calculators/compound` | Start-now-vs-later comparison |
| GET, POST | `/net_worth_snapshots` | History; record now |

## Ideas for next steps

- Move the API to GraphQL with `graphql-ruby` (both Shopify and Wealthsimple use GraphQL).
- Add Sorbet type signatures to the finance services.
- Background jobs for monthly summary emails.

*Not financial advice. Account rules and limits come from the CRA; check your contribution room in CRA My Account.*
