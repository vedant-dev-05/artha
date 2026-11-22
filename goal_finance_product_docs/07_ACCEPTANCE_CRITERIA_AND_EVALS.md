# 07 --- Acceptance Criteria and Evaluation Scenarios

## 1. Purpose

Use these criteria to verify that the MVP works as a coherent product,
not merely as a collection of attractive screens.

For each scenario, record: - Test setup. - User action. - Expected
result. - Actual result. - Pass/fail. - Defect or improvement.

Do not claim an evaluation passed unless it was actually run.

## 2. Core acceptance criteria

### Onboarding

-   User can complete required onboarding steps.
-   CSV import can be skipped.
-   User can save/resume incomplete onboarding if implemented.
-   Estimates are labelled as estimates.
-   User can review and correct financial information before plan
    creation.

### Goals

-   User can create more than one goal.
-   Required fields are validated.
-   User can edit and pause a goal.
-   Goal progress is consistent across dashboard and goal detail.
-   A completed goal is not silently archived or deleted.

### Financial plan

-   Proposed plan shows assumptions, contributions, allocations and
    timelines.
-   Plan cannot become active before explicit approval.
-   Rejected proposal does not overwrite active plan.
-   Revised plan creates a new version.
-   Dashboard, goal views and My Financial Plan show the same active
    version.
-   Infeasible target is explained with alternatives rather than false
    assurance.

### Companion

-   Companion overlay opens and closes without losing the current
    screen.
-   Responses use available user context accurately.
-   Companion does not invent financial facts.
-   Material changes require explicit approval.
-   Unsupported investment, loan, tax or transaction requests are
    handled within scope.

### Expense tracking

-   User can manually add and edit an expense.
-   Expense dashboard totals are derived from persisted transactions.
-   Credits are not counted as expenditure.
-   Imported, manual and estimated data are distinguishable.
-   Category corrections persist.
-   Duplicate candidates are surfaced for review.

### Profile and settings

-   User can edit profile and financial preferences.
-   Notification preferences are controllable.
-   User can inspect and delete imported data according to documented
    deletion behaviour.
-   Sensitive actions require confirmation.

## 3. Evaluation scenarios

### Eval 1 --- Goal feasibility

**Input:** User has ₹15,000 monthly income, ₹8,000 essential
expenses/commitments, ₹2,000 protected spending and wants to save
₹30,000 in six months.

**Expected:** App identifies the rough available capacity as ₹5,000
before any additional buffer or unrecorded expenses. A ₹5,000 monthly
contribution would leave no buffer, so the companion should not blindly
recommend it as comfortable. It should ask about missing costs or offer
a longer timeline/lower contribution. It must state assumptions.

### Eval 2 --- Multiple goals

**Input:** User has two active goals with competing dates and
priorities.

**Expected:** Companion asks which goal matters more if priority is
unclear, explains trade-offs and does not allocate the same money twice.

### Eval 3 --- Irregular income

**Input:** User's income varies significantly month to month.

**Expected:** App does not assume a fixed salary. It asks for a
conservative typical/low-month estimate or presents a range and makes
uncertainty visible.

### Eval 4 --- Protected spending

**Input:** User wants to preserve a monthly gym membership or
family/social commitment.

**Expected:** Plan treats it as a user preference/commitment rather than
automatically recommending its removal.

### Eval 5 --- Plan approval

**Input:** Companion proposes a revised plan; user asks a follow-up but
does not press Approve.

**Expected:** Existing active plan remains unchanged.

### Eval 6 --- Income decreases

**Input:** User reports that income has dropped after plan approval.

**Expected:** Companion explains impact and offers alternatives. A new
plan is stored only after explicit approval.

### Eval 7 --- CSV column mapping

**Input:** CSV has date, narration, debit, credit and balance columns.

**Expected:** Parser suggests sensible mappings, asks user to confirm,
and does not count balance as expenditure.

### Eval 8 --- Ambiguous CSV direction

**Input:** CSV has one amount column with unclear sign convention.

**Expected:** App asks user to clarify debit/credit meaning; it does not
guess.

### Eval 9 --- Duplicate import

**Input:** User uploads an overlapping date range already imported.

**Expected:** Likely duplicates are identified; identical repeat import
is idempotent; uncertain same-date/same-amount purchases are reviewable
rather than silently discarded.

### Eval 10 --- Uncategorised transactions

**Input:** Merchant names are unfamiliar.

**Expected:** Transactions remain uncategorised or marked uncertain.
User can correct categories. App does not fabricate certainty.

### Eval 11 --- Missing expense data

**Input:** User has not uploaded a CSV and has not manually entered
expenses.

**Expected:** Dashboard shows a useful empty state and offers
upload/manual entry. It does not show invented spending totals.

### Eval 12 --- Out-of-scope request

**Input:** User asks the companion to invest money, take a loan or
transfer funds.

**Expected:** Companion clearly explains that these actions are not
supported and does not imply it can execute them.

## 4. Quality rubric

Score each area from 1 to 5 after testing:

  -----------------------------------------------------------------------
  Area                                What good looks like
  ----------------------------------- -----------------------------------
  Product coherence                   Features support the
                                      goal-achievement loop

  Financial correctness               Totals, capacity and allocations
                                      are consistent

  AI reliability                      Uses context, states assumptions
                                      and avoids fabrication

  User control                        No unapproved plan or data changes

  CSV robustness                      Handles format variation and
                                      uncertain rows safely

  UX clarity                          User understands what to do and
                                      what happened

  Error handling                      No dead ends; recovery actions are
                                      clear

  Privacy                             Data access, consent and deletion
                                      are understandable
  -----------------------------------------------------------------------

## 5. Release gate

Do not call the prototype complete until: - A new user can reach the
dashboard. - At least one goal can be created. - A proposed plan can be
reviewed and approved. - Active plan appears outside chat. - Manual
expense entry works. - CSV import works for at least the sample formats
used in testing, with errors handled honestly. - Companion cannot
silently change an active plan. - Core empty/loading/error states are
present. - No secrets are exposed in client code.
