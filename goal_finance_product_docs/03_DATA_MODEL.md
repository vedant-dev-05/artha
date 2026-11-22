# 03 --- Core Data Model

**Status:** Proposed logical schema. The coding agent may adapt physical
names/types to the chosen database but must preserve the concepts and
relationships.

## 1. Entity overview

``` text
User
 ├── FinancialProfile
 ├── FinancialPreferences
 ├── Goal (many)
 │     ├── GoalProgressEvent (many)
 │     └── Milestone (many)
 ├── FinancialPlan (many versions)
 │     └── PlanAllocation (many)
 ├── Transaction (many)
 │     └── ImportBatch (optional)
 ├── ImportBatch (many)
 ├── CompanionConversation (many)
 │     └── CompanionMessage (many)
 └── NotificationPreference
```

All user-owned records must include an owner/user reference and enforce
access control.

## 2. User

  -----------------------------------------------------------------------
  Field                               Type / notes
  ----------------------------------- -----------------------------------
  id                                  UUID

  email                               Auth identity; do not duplicate
                                      credentials

  display_name                        Nullable string

  phone                               Nullable, if collected

  life_stage                          student / intern / freelancer /
                                      working_professional / other

  created_at, updated_at              Timestamps
  -----------------------------------------------------------------------

## 3. FinancialProfile

  -----------------------------------------------------------------------
  Field                               Type / notes
  ----------------------------------- -----------------------------------
  id, user_id                         UUIDs

  income_type                         regular / irregular / allowance /
                                      mixed / unknown

  income_amount                       Decimal-safe amount, nullable

  income_frequency                    weekly / monthly / variable / other

  income_predictability               predictable / somewhat_variable /
                                      highly_variable

  essential_expenses_estimate         Decimal-safe amount, nullable

  commitments                         Structured list or related records

  existing_savings                    Decimal-safe amount, nullable

  currency                            ISO currency code; INR default

  source_quality                      estimate / user_confirmed /
                                      imported / mixed

  updated_at                          Timestamp
  -----------------------------------------------------------------------

Do not assume one income amount fully describes irregular cash flow.
Preserve frequency and variability.

## 4. FinancialPreferences

  Field                          Type / notes
  ------------------------------ ---------------------------------------------
  id, user_id                    UUIDs
  protected_expenses             User-designated spending categories/amounts
  savings_flexibility            flexible / balanced / structured
  preferred_check_in_frequency   off / weekly / monthly / custom
  companion_tone                 simple preference enum; default friendly
  notifications_enabled          Boolean/preferences per type
  currency, locale, theme        Preferences

## 5. Goal

  -----------------------------------------------------------------------
  Field                               Type / notes
  ----------------------------------- -----------------------------------
  id, user_id                         UUIDs

  name                                Required

  category                            travel / education / emergency /
                                      gadget / purchase / custom / other

  target_amount                       Decimal-safe positive amount

  current_saved_amount                Decimal-safe non-negative amount

  target_date                         Date, nullable if user has no
                                      deadline

  priority                            high / medium / low or configurable
                                      ordinal

  status                              active / paused / completed /
                                      archived

  created_at, updated_at              Timestamps
  -----------------------------------------------------------------------

Rules: - Target amount must be greater than zero. - Current saved amount
cannot be negative. - If current saved amount reaches target, ask
whether the user wants to mark goal completed; do not silently change
status. - A goal can exist before it has an approved plan.

## 6. FinancialPlan

Treat plans as versioned records. Do not overwrite history.

  Field                Type / notes
  -------------------- -------------------------------------------------------------
  id, user_id          UUIDs
  version              Incrementing integer per user
  status               proposed / active / superseded / rejected
  summary              Human-readable summary
  total_contribution   Decimal-safe amount
  assumptions          Structured JSON
  warnings             Structured JSON
  created_at           Timestamp
  approved_at          Nullable timestamp
  source               companion_proposal / user_adjustment / system_recalculation

Only one plan version should be active for a user at a time. A proposed
plan is not active until explicitly approved.

### PlanAllocation

  Field                       Type / notes
  --------------------------- ---------------------------
  id, plan_id, goal_id        UUIDs
  contribution_amount         Decimal-safe amount
  frequency                   weekly / monthly / custom
  projected_completion_date   Date, nullable
  rationale                   Short explanation

Validate that allocations sum to the plan total within the currency
precision.

## 7. Transaction

  Field                     Type / notes
  ------------------------- ---------------------------------------
  id, user_id               UUIDs
  import_batch_id           Nullable for manual transactions
  transaction_date          Date/time
  description               Merchant/description; protect in logs
  amount                    Decimal-safe positive amount
  direction                 debit / credit
  category                  Controlled category or uncategorised
  source                    csv_import / manual
  source_transaction_id     Nullable provider identifier
  dedupe_fingerprint        Nullable generated fingerprint
  category_confidence       Optional low/medium/high
  category_edited_by_user   Boolean
  created_at, updated_at    Timestamps

Rules: - Keep debit/credit direction explicit. - Do not treat credits as
expenditure. - Do not infer a credit is income without adequate
context. - Preserve original description and parsed values where needed
for audit/correction. - User edits should override automated
categorisation.

## 8. ImportBatch

  -----------------------------------------------------------------------
  Field                               Type / notes
  ----------------------------------- -----------------------------------
  id, user_id                         UUIDs

  original_filename                   Sanitised filename

  source_label                        User-selected bank/app or unknown

  period_start, period_end            Nullable dates

  status                              uploaded / parsing /
                                      mapping_required / review_required
                                      / ready_to_import / imported /
                                      failed

  total_rows                          Integer

  imported_rows                       Integer

  skipped_rows                        Integer

  duplicate_rows                      Integer

  error_summary                       Safe user-facing message

  created_at, completed_at            Timestamps
  -----------------------------------------------------------------------

Store file bytes in private storage only if needed. Define retention and
deletion behaviour.

## 9. CompanionConversation and CompanionMessage

Conversation: - id, user_id, title, created_at, updated_at,
context_screen.

Message: - id, conversation_id, role (user / assistant /
system-generated), content, created_at, metadata.

Do not expose internal system prompts or secrets to the client. Avoid
storing unnecessary sensitive context in conversation logs. Provide a
clear retention policy.

## 10. Progress and milestones

GoalProgressEvent: - id, user_id, goal_id, amount_delta or
updated_amount, event_date, source (manual / imported / other), note.

Milestone: - id, goal_id, label, target_amount or target_percent,
status, achieved_at.

Milestones should be generated from the accepted plan or goal progress
model, not hard-coded to identical percentages for every goal.

## 11. Data provenance

Where possible, each financial value should indicate whether it is: -
User estimate. - User-confirmed. - Imported transaction-derived. -
Calculated by the application. - AI-generated proposal (not yet
approved).

Never display a calculated estimate as a verified bank balance.
