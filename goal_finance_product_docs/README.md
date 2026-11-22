# Goal-Oriented Financial Companion --- Product Documentation Pack

**Purpose:** Provide a coding agent with a coherent, modular source of
truth for building the MVP.

This pack intentionally separates product requirements, architecture,
data, AI behaviour, transaction import, wireframe mapping, evaluations
and implementation guidance. Read this file first, then follow the
reading order below.

## Product in one sentence

A mobile-first personal finance application that helps young adults
translate financial aspirations into achievable plans and make
consistent progress through goal management, expense visibility and an
AI financial companion.

## Documentation map

  ---------------------------------------------------------------------------
  File                                    Purpose
  --------------------------------------- -----------------------------------
  `01_PRODUCT_REQUIREMENTS.md`            Product problem, users, goals,
                                          scope, features and requirements

  `02_TECHNICAL_ARCHITECTURE.md`          Proposed application architecture,
                                          components, security and
                                          integrations

  `03_DATA_MODEL.md`                      Core entities, fields,
                                          relationships and data rules

  `04_AI_COMPANION_SPEC.md`               Companion behaviour, planning
                                          workflow, safety and approval rules

  `05_CSV_EXPENSE_IMPORT_SPEC.md`         CSV upload, mapping,
                                          categorisation, review and
                                          duplicate handling

  `06_UX_AND_WIREFRAME_MAP.md`            Existing wireframe filenames and
                                          mapping to product requirements; no
                                          wireframes are generated here

  `07_ACCEPTANCE_CRITERIA_AND_EVALS.md`   Feature acceptance criteria, test
                                          scenarios and evaluation rubric

  `08_IMPLEMENTATION_PLAN.md`             Suggested build order, milestones
                                          and definition of done

  `09_CODING_AGENT_INSTRUCTIONS.md`       Operating instructions and
                                          constraints for the coding agent
  ---------------------------------------------------------------------------

## Recommended reading order

1.  `09_CODING_AGENT_INSTRUCTIONS.md`
2.  `01_PRODUCT_REQUIREMENTS.md`
3.  `06_UX_AND_WIREFRAME_MAP.md`
4.  `02_TECHNICAL_ARCHITECTURE.md`
5.  `03_DATA_MODEL.md`
6.  `04_AI_COMPANION_SPEC.md`
7.  `05_CSV_EXPENSE_IMPORT_SPEC.md`
8.  `07_ACCEPTANCE_CRITERIA_AND_EVALS.md`
9.  `08_IMPLEMENTATION_PLAN.md`

## Decision status convention

-   **CONFIRMED** --- explicitly selected during product definition.
-   **PROPOSED** --- a sensible implementation recommendation, not yet
    approved as a product decision.
-   **OPEN** --- requires a decision, validation or implementation
    discovery.
-   **FUTURE** --- deliberately excluded from the MVP.

The coding agent must not silently turn OPEN or PROPOSED items into
claims that the product team has validated them. It should surface
material decisions before implementing them.

## Wireframes

The wireframes already exist in the design tool. Export them into a
`wireframes/` directory using the filenames listed in
`06_UX_AND_WIREFRAME_MAP.md`. Do not regenerate, reinterpret or replace
them unless explicitly asked. If an expected file is missing, ask for it
or proceed only with clearly labelled assumptions.

## Important product constraints

-   This is a goal-achievement companion, not a full banking, investment
    or wealth-management product.
-   Financial plans are recommendations. The user must explicitly
    approve a plan or material change before it becomes the active plan.
-   The app must not execute payments, transfers or automated savings.
-   CSV import is in the MVP; automatic SMS reading and direct UPI/bank
    integrations are future scope.
-   Do not fabricate transaction data, balances, integrations, financial
    advice credentials, or successful import results.
-   Clearly label sample/demo data.
-   Never imply that the app can make an unaffordable goal affordable.
    It can explain trade-offs and help revise targets or timelines.
