# Artha

Artha is a goal-first personal finance companion for young Indian adults. You describe what you are saving for, Artha works out what is realistically available each month, and you can track progress without connecting a bank account.

This repository is a **demo build**. It runs entirely on seeded sample data plus anything you add in your own browser. It is not a financial product and does not move money.

## Run locally

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. A fresh visitor lands on the onboarding welcome screen, where they can either start the seven-step setup or open the clearly labelled demo workspace. The choice is saved in this browser. "Save & exit" keeps the setup draft pending and returns to the welcome screen with a Resume option; it never silently opens the demo. Log out from Profile or Settings to end the visit and see the welcome gate again.

### Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run typecheck` | TypeScript, no emit |
| `npm run test` | Vitest unit tests (72 across domain, seed and store) |

## What works today

- **Onboarding** — nine-screen guided setup (seven numbered data steps). Choose aspirations, enter income and expenses, review a financial snapshot, then explicitly approve a proposed plan. The existing workspace is only replaced on approval. Settings → Replay setup restarts it.
- **Demo workspace** — a clearly labelled, internally consistent sample account for Aarav Sharma: three goals, an active plan, three months of transactions and import metadata. Onboarding builds an equivalent labelled demo workspace from your answers.
- **Home** — total saved, next best move, goal cards, upcoming milestones, rule-based insight.
- **Goals** — list and detail with progress, milestone journey and contribution history. Create and edit goals, check feasibility against monthly capacity, compare timeline options, pause/resume, and mark complete.
- **Log a contribution** — records money you have already set aside; updates progress and milestones. Artha never moves money. Saved amounts are read-only when editing a goal; contributions are changed from the goal screen.
- **Plan** — capacity breakdown, goal allocations, assumptions, warnings and a version label. Review or generate a draft, compare alternatives, modify amounts, approve or reject, and browse version history. Approving supersedes the old active version; nothing changes without explicit approval.
- **Money** — month-by-month spending, category donut and breakdown, trend bars, recent transactions, manual expense entry, searchable transaction history and category correction.
- **CSV import** — pick a bank/UPI `.csv`, confirm or correct the column mapping, review suggested categories/directions and likely duplicates, then import only the rows you approve. Files are read in-browser; only normalised transactions and import metadata are stored. Imported batches can be deleted individually or all at once.
- **Profile & settings** — personal info, full financial profile and buffer controls, in-app notification toggles, companion preferences, imported-data management, privacy limits, FAQ, demo reset and replay setup.
- **Coach** — floating companion overlay plus full tab, with message composer, loading/error/fallback states and safe plan-proposal hand-offs. With `GEMINI_API_KEY` set, replies come from Gemini through a server route; without it, replies are generated locally from aggregated context and clearly labelled as demo mode.

## How data is stored

- **No database, no accounts, no authentication.**
- Goals, contributions, transactions, plans and preferences live in `localStorage` under `artha-demo-v1`.
- Each visitor gets their own copy. Clearing site storage, or **Settings → Reset demo data**, restores the seed.
- Raw CSV files are never retained. Import parses the file in the browser and keeps only metadata and normalised transactions. Duplicates are detected against existing transactions by date + amount + direction + description.
- The Coach sends **aggregated context only** (`src/domain/coach-context.ts`) to the server route. Raw transaction descriptions, email, phone and import filenames are excluded. `GEMINI_API_KEY` stays server-side; no key is shipped to the browser.

## Architecture

```
src/
  app/                 Next.js App Router routes
    (app)/             Shared shell: demo strip, top bar, nav, coach, toaster
    api/coach/         Server-side Gemini proxy with validation + local fallback
  components/          UI primitives, navigation, goals, expenses, coach, plan, feedback
  domain/              Pure TypeScript: types, money, dates, categories, planning,
                       goals, plan versions, coach context/contract, selectors
  server/demo/         Deterministic demo seed
  store/               Zustand store with localStorage persistence
```

Money is stored as integer **paise** (`1 rupee = 100 paise`). Dates that represent a calendar day are `YYYY-MM-DD` strings. All allocation totals are reconciled in tests.

### Plan calculation

1. Conservative income baseline.
2. Subtract essentials, commitments, protected spending and a safety buffer.
3. The buffer is 10% of income with a ₹500 minimum.
4. Allocate capacity sequentially by priority (high → medium → low).
5. Goals in the same priority group share an equal split; unused capacity stays flexible.

### Plan approval

Draft proposals are inert. Applying a feasibility option or a Coach suggestion creates a versioned draft; only the proposal screen can activate it. Approving marks the previous active version as superseded and keeps it in history. Rejecting leaves the active plan untouched.

## Tests

```bash
npm run test
```

72 unit tests cover money parsing/formatting/splitting, capacity and buffer rules, priority allocation, milestone progression, plan proposal validation, goal validation/feasibility/alternatives, plan version transitions, onboarding draft/workspace construction, store-level workspace safety (no replacement until plan approval), goal/plan/coach/import store actions, Coach context privacy, CSV parsing/mapping/date+amount handling/duplicate detection, and seed consistency.

## Deployment

The app is Vercel-compatible (Next.js App Router). Import the repository and keep the default build settings. Live Coach responses require a server-side `GEMINI_API_KEY`; the app works without it using labelled local fallback replies.

Environment variables (see `.env.example`):

```
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.5-flash
```

Do not prefix the key with `NEXT_PUBLIC_`. The demo is deployed at <https://artha-navy.vercel.app> from <https://github.com/vedant-dev-05/artha>. Environment variables are configured as server-side secrets in the Vercel project.

## Known limits

- Demo only: no sign-in, database, bank/UPI/SMS connection, payments, investments, lending or tax advice.
- INR and English only; in-app notifications only; no dark mode, language switcher or biometric lock.
- CSV import supports `.csv` only (max 5 MB / 2,000 rows); no PDF, Excel, bank login or SMS reading. No file contents are uploaded.
- Live Coach needs a Gemini API key configured on the server; without one the label clearly states that replies are local demo output. No plan is ever changed by the Coach without explicit approval on the Plan screen.
- Artha provides planning guidance, not regulated financial advice.
