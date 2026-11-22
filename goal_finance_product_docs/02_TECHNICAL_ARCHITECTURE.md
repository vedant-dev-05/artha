# 02 --- Technical Architecture

**Status:** Proposed reference architecture. Adapt to the target coding
platform, but preserve the separation of concerns and product
constraints.

## 1. Architecture goals

-   Deliver a functional, demonstrable MVP quickly.
-   Keep the UI independent from AI-provider and persistence details.
-   Make financial calculations deterministic and testable.
-   Treat AI output as an untrusted proposal until validated and
    approved.
-   Support CSV uploads without assuming one universal bank/UPI schema.
-   Make future integrations possible without implementing them in the
    MVP.

## 2. Logical architecture

``` text
Mobile-first Web Client
  ├── Onboarding & Profile UI
  ├── Home / Goals UI
  ├── Expense Dashboard & Transactions UI
  ├── My Financial Plan UI
  └── AI Companion UI
          |
          v
Application / Domain Services
  ├── User & Financial Profile Service
  ├── Goal Service
  ├── Planning & Feasibility Service
  ├── Expense & Transaction Service
  ├── CSV Import Service
  ├── Progress & Milestone Service
  └── Companion Orchestration Service
          |
          +----------------------+
          |                      |
          v                      v
   Persistent Data Store     AI Provider Adapter
          |                      |
          v                      v
   Users / Goals / Plans     LLM API (server-side only)
   Transactions / Imports    Structured response validation
   Preferences / Events     Tool/action permissions
```

## 3. Proposed implementation stack

**PROPOSED --- confirm against the chosen coding agent/platform before
implementation.**

-   Frontend: React + TypeScript, using the framework already scaffolded
    by the chosen builder. If starting from scratch, Next.js is a
    reasonable default.
-   Styling: Tailwind CSS or the existing design system generated from
    the supplied wireframes.
-   Backend/database/auth: Supabase (PostgreSQL, Auth and Storage) is a
    practical prototype option. A platform-native backend is acceptable
    if it provides equivalent controls.
-   Charts: a maintained React chart library; keep chart data derived
    from transaction records.
-   CSV parsing: a maintained parser library with client/server
    validation. Do not evaluate arbitrary spreadsheet formulas.
-   AI: server-side provider adapter. Keep provider-specific calls out
    of UI components.
-   Testing: unit tests for domain calculations and import parsing;
    integration tests for approval and persistence flows; browser-level
    tests for key journeys.

If the coding platform has already selected a stack, do not replace it
without asking. Record the chosen stack and deviations in the
implementation notes.

## 4. Frontend modules

Suggested feature-oriented structure:

``` text
src/
  app/ or routes/
  components/
    navigation/
    companion/
    charts/
    forms/
    feedback/
  features/
    onboarding/
    dashboard/
    goals/
    financial-plan/
    expenses/
    csv-import/
    profile/
    settings/
  domain/
    money/
    goals/
    planning/
    transactions/
    milestones/
  services/
    api/
    auth/
    ai/
    storage/
  lib/
  types/
  tests/
```

Do not create a giant page component. Keep feature components, domain
rules and data access separate.

## 5. Backend/domain services

### User and financial profile

-   Store user profile and financial inputs.
-   Keep estimates distinct from imported or user-confirmed values.
-   Track update timestamps and source/provenance where practical.

### Goal service

-   Create, edit, pause, complete and archive goals.
-   Validate target amount and dates.
-   Keep goal ownership enforced on the server.

### Planning service

-   Accept structured profile and goal inputs.
-   Calculate available capacity and validate proposed contributions.
-   Store plan versions and approval status.
-   Ensure an unapproved proposal cannot overwrite the active plan.

### Expense service

-   Store transactions with source, category, amount, date and import
    reference.
-   Support manual entry and corrections.
-   Derive summaries from persisted transactions.
-   Do not treat estimates as transactions.

### CSV import service

-   Store import metadata and file processing status.
-   Parse and map columns.
-   Validate dates, amounts and debit/credit direction.
-   Generate duplicate candidates.
-   Allow review before final import.
-   Make import confirmation idempotent.

### Companion orchestration service

-   Fetch only the context needed for the current conversation.
-   Send structured context to the AI provider.
-   Validate structured recommendations.
-   Expose narrowly scoped actions, not unrestricted database access.
-   Require explicit confirmation for material mutations.

## 6. Key data flows

### Initial plan

1.  Client submits goals and financial profile.
2.  Server validates and normalises inputs.
3.  Planning service calculates a baseline capacity estimate.
4.  Companion may explain and propose a plan using structured context.
5.  Server validates proposal against business rules.
6.  User reviews and approves.
7.  Server creates an active plan version.
8.  Dashboard and goal views read the active plan.

### Plan revision

1.  User asks companion to revise or reports changed circumstances.
2.  Companion receives current plan and relevant updated inputs.
3.  Planning service computes feasible alternatives.
4.  Companion explains trade-offs.
5.  User explicitly approves one alternative.
6.  Server creates a new plan version and marks it active.
7.  Previous version remains in history.

### Expense import

1.  User selects a CSV.
2.  File is validated and parsed.
3.  Column mapping is suggested or requested.
4.  Parsed transactions are previewed.
5.  Categories and duplicates are reviewed.
6.  User confirms import.
7.  Server persists transactions and import record.
8.  Expense summaries are recalculated.

## 7. Financial calculation boundaries

-   Use integer minor units (paise) or a decimal-safe money
    representation; do not use floating-point arithmetic for persisted
    money calculations.
-   Store currency explicitly; default to INR.
-   Define whether amounts are debit-positive or use signed amounts
    consistently across the domain.
-   Distinguish monthly income from income frequency and irregular
    income.
-   Do not assume all income arrives on the same date.
-   Treat user estimates as estimates.
-   A plan must not allocate more than the capacity calculation allows
    without clearly surfacing the conflict.
-   Preserve user-designated essential/protected expenses.
-   If information is incomplete, present a range or ask the user rather
    than inventing precision.
-   Planning outputs are guidance, not guaranteed outcomes or regulated
    financial advice.

## 8. Security and privacy

-   Enforce authentication and row-level ownership for every user-owned
    record.
-   Keep AI API keys and privileged database credentials server-side.
-   Validate all user input and uploaded file size/type.
-   Store uploaded CSV files privately; use short-lived access URLs if
    file storage is required.
-   Do not log raw bank statements, full transaction descriptions or
    secrets unnecessarily.
-   Provide a way to delete uploaded files and imported transaction
    records.
-   Obtain clear consent before processing financial data.
-   Do not read SMS, connect bank accounts or access UPI data in the
    MVP.
-   Avoid sending unnecessary personal identifiers to the AI provider.
-   Document retention/deletion behaviour. Do not claim deletion if
    backups or logs retain data.

## 9. AI integration contract

The AI provider must be behind an interface, for example:

``` ts
interface CompanionProvider {
  generateReply(input: CompanionInput): Promise<CompanionResponse>;
}
```

AI output that proposes a financial plan should use a validated
structured schema, not free-form text as the source of truth. Example
fields: - `summary` - `assumptions[]` - `goalAllocations[]` -
`monthlyContributionTotal` - `estimatedCompletionDates[]` -
`tradeoffs[]` - `warnings[]` - `requiresUserApproval: true`

The server must validate values and calculate totals independently. AI
must not directly write an active plan.

## 10. Future integration seams

Keep interfaces extensible for: - Consent-based Account
Aggregator/financial data integrations. - Supported bank/UPI data
providers. - SMS-derived transaction ingestion, if platform policy and
user consent permit. - Additional AI providers.

These are future possibilities only. Do not build mock buttons that
imply a real integration exists. Any prototype-only integration must be
visibly labelled as a demo.
