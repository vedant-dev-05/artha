# 08 --- Suggested Implementation Plan

## 1. Build principle

Implement a narrow but complete end-to-end product loop before polishing
secondary features. Prefer working flows over disconnected screens.

## 2. Milestones

### Milestone 0 --- Inspect and align

-   Inspect supplied wireframes and identify missing assets.
-   Inspect the coding platform's existing stack and capabilities.
-   Confirm auth, database, storage and AI provider approach.
-   Record decisions and unresolved questions.
-   Create a design token/component baseline from the supplied
    wireframes.

**Exit criteria:** Project structure and implementation choices are
documented; wireframe references are mapped.

### Milestone 1 --- App shell and user profile

-   Responsive app shell and navigation.
-   Authentication or clearly labelled demo mode.
-   Profile and financial profile.
-   Settings and preferences.
-   Persistent companion entry point and overlay shell.

**Exit criteria:** User can navigate the app and edit
profile/preferences.

### Milestone 2 --- Onboarding and goals

-   Onboarding steps and skip/resume behaviour.
-   Financial profile capture.
-   Create/edit/pause goals.
-   Goal-first Home dashboard.
-   Goal detail and progress display.

**Exit criteria:** User can complete onboarding and create/manage
multiple goals.

### Milestone 3 --- Expense tracking

-   Manual expense entry.
-   Transaction list and filters.
-   CSV parsing and flexible column mapping.
-   Preview, categorisation and correction.
-   Duplicate review and import confirmation.
-   Spending summaries.

**Exit criteria:** Expense totals are derived from stored transactions;
import errors and duplicates are handled.

### Milestone 4 --- Planning and companion

-   Deterministic capacity calculation and validation.
-   AI provider adapter.
-   Context-aware companion conversations.
-   Structured plan proposal.
-   Approval/rejection/modify workflow.
-   Versioned active plans.
-   My Financial Plan summary.

**Exit criteria:** No plan is activated or changed without explicit
approval; all screens show the same active version.

### Milestone 5 --- Progress, coaching and polish

-   Milestones and achievements.
-   Plan deviation states.
-   Companion-led revision.
-   Notification preference UI; only implement actual delivery if
    configured.
-   Empty/loading/error states.
-   Accessibility and responsive review.

**Exit criteria:** Core user journeys pass the evaluation scenarios.

### Milestone 6 --- QA and handoff

-   Run acceptance tests and record results.
-   Fix critical issues.
-   Confirm access and demo data labelling.
-   Remove fake integration claims and debug controls.
-   Document setup, environment variables and known limitations.

## 3. Build order priorities

**P0 --- Must work** - App shell and navigation. - Onboarding and
goals. - Financial profile. - Expense manual entry and CSV import. -
Companion plan proposal and approval. - Active plan summary. - Data
ownership and validation.

**P1 --- Should work** - Milestones and achievements. - Advanced
category insights. - Contextual companion suggestions. - Plan history
and richer revision comparison.

**P2 --- Later** - Proactive notification delivery. - Advanced
irregular-income forecasting. - External financial data integrations. -
Social/collaborative functionality.

## 4. Demo data

Use clearly labelled sample data for development. Include at least: - A
student/allowance profile. - An early-career salaried profile. - An
irregular-income profile. - A profile with multiple goals. - A profile
with no expense history. - A profile with imported and manual
transactions.

Never present seeded demo records as a real user's financial data.

## 5. Handoff checklist

-   [ ] App runs using documented setup instructions.
-   [ ] Environment variables are documented without exposing secrets.
-   [ ] Wireframe assets are referenced correctly.
-   [ ] Database schema/migrations are included.
-   [ ] Sample data is clearly labelled.
-   [ ] CSV sample files and expected mappings are documented.
-   [ ] Acceptance/evaluation results are recorded.
-   [ ] Known limitations and future features are documented.
