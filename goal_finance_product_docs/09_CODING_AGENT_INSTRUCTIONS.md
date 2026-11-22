# 09 --- Instructions for the Coding Agent

You are implementing the MVP described in this documentation pack. Treat
the documentation and supplied Stitch wireframes as the product source
of truth.

## 1. Before coding

1.  Read `README.md` and all numbered documents.
2.  Inspect the repository, existing framework, package manager and
    available services.
3.  Locate the `wireframes/` directory and follow
    `06_UX_AND_WIREFRAME_MAP.md`.
4.  Identify missing wireframes and unresolved product decisions.
5.  Propose the implementation stack and architecture based on the
    existing environment.
6.  Present a concise implementation plan and list material blockers
    before making irreversible choices.

Do not regenerate wireframes. Do not assume that a filename means the
corresponding image exists.

## 2. Decision handling

-   CONFIRMED decisions must be preserved.
-   PROPOSED decisions may be implemented when appropriate, but record
    the choice.
-   OPEN decisions must be surfaced if they materially affect product
    behaviour, data model, privacy or cost.
-   FUTURE features must not be implemented as if they are part of the
    MVP.

Do not silently broaden scope.

## 3. Product rules that must never be violated

1.  Home is goal-first.
2.  Expense tracking has its own dashboard.
3.  Financial planning is discussed through the AI companion.
4.  My Financial Plan displays the latest accepted plan outside chat.
5.  The companion may propose changes but cannot silently apply material
    changes.
6.  Explicit approval is required before a plan becomes active or is
    revised.
7.  CSV import is in MVP; automatic SMS reading and direct UPI/bank
    integration are not.
8.  Manual and imported transactions must be distinguishable.
9.  Estimates must not be represented as verified transaction or account
    data.
10. No investments, loans, tax planning, payments, transfers or
    automated savings in MVP.

## 4. Engineering rules

-   Follow the existing repository conventions.
-   Use TypeScript types or equivalent schemas for domain data.
-   Keep money arithmetic decimal-safe.
-   Validate all user input on the server as well as the client.
-   Enforce user ownership and access control for all financial records.
-   Keep secrets and AI keys server-side.
-   Do not let the LLM directly write to the database.
-   Validate structured AI outputs before using them.
-   Version financial plans; never overwrite the active plan with an
    unapproved proposal.
-   Make CSV import idempotent and review duplicates.
-   Do not silently guess ambiguous CSV debit/credit semantics.
-   Use real persisted state for totals and summaries; do not hard-code
    values into production UI.
-   Label all seeded data as demo/sample data.
-   Provide empty, loading, success and error states.
-   Avoid dead buttons, placeholder actions and fake integrations.
-   Do not claim functionality works until it has been tested.

## 5. UI rules

-   Match the supplied wireframes closely.
-   Reuse existing design tokens and components.
-   Preserve bottom navigation and the floating companion icon.
-   Companion opens as an overlay without discarding current screen
    context.
-   Profile is accessed via the avatar as shown in the design
    references.
-   Use responsive mobile-first layouts.
-   Ensure accessible labels, keyboard interaction and sensible focus
    behaviour.

## 6. AI companion rules

-   Use a provider abstraction.
-   Send only the minimum relevant user context.
-   Show assumptions and uncertainty.
-   Use deterministic services for money calculations and feasibility
    validation.
-   The AI can explain and propose; application logic validates and
    persists.
-   Require a deliberate approval action before activating a plan.
-   Do not expose hidden prompts, credentials or other users' data.
-   Keep tone friendly, natural and non-judgmental.

## 7. Testing and reporting

After each milestone: - Run relevant tests. - Report what is
implemented. - Report what remains incomplete. - Report assumptions and
deviations. - Report known defects. - Do not mark acceptance criteria as
passed unless tested.

Before final handoff: - Run the acceptance scenarios in
`07_ACCEPTANCE_CRITERIA_AND_EVALS.md`. - Provide actual test results. -
Document environment setup and deployment. - Confirm the deployed URL is
accessible. - List features that are mocked, simulated or unavailable.

## 8. First response expected from the agent

Before implementation, respond with: 1. Repository and framework
findings. 2. Wireframe files found and missing. 3. Proposed
stack/services. 4. Open decisions requiring user input. 5. Phased
implementation plan.

Then wait for approval if a material stack, data/privacy or product
decision is unresolved.
