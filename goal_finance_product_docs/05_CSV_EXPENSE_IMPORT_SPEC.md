# 05 --- CSV Expense Import and Tracking Specification

## 1. Purpose

Reduce the burden of manually entering expenditure by allowing users to
upload transaction CSV exports from supported UPI apps or banks, review
the parsed information and use it in the expense dashboard.

CSV import is an MVP feature. Automatic SMS reading and direct financial
account integrations are not.

## 2. User entry points

-   Optional step during onboarding after income and essential
    commitments.
-   Expense dashboard for later or repeat uploads.
-   Financial Data section in Profile/Settings for viewing and managing
    prior imports.

Recommended period: ask for the last three months as a useful starting
point, but allow shorter periods. Do not make three months mandatory.

## 3. Import flow

1.  User chooses a CSV file.
2.  Explain what information is used and why.
3.  Validate file type and size.
4.  Parse headers and sample rows.
5.  Suggest column mapping.
6.  Ask user to confirm or correct mapping.
7.  Parse transaction rows.
8.  Validate dates, amount and debit/credit direction.
9.  Preview transactions and summary.
10. Categorise transactions.
11. Flag uncertain categories and likely duplicates.
12. Let user correct, exclude or include rows.
13. Show import summary.
14. Import only after explicit confirmation.
15. Update transaction list and spending dashboard.

## 4. Flexible column mapping

Do not assume a universal CSV schema.

Potential fields: - Transaction date/time. - Description or merchant. -
Debit amount. - Credit amount. - Single signed amount. - Transaction
type. - Reference/transaction ID. - Balance (optional; not required for
MVP).

Mapping UI should let the user select which source column corresponds to
each required field.

Required logical values: - Date. - Description or a usable fallback
label. - Amount. - Direction (debit/credit), either from separate
columns or a clearly interpretable signed amount/type field.

If direction cannot be determined reliably, ask the user. Never guess
whether a row is expenditure or income.

## 5. Parsing and validation

-   Accept CSV only in MVP.
-   Validate file extension and content; extension alone is
    insufficient.
-   Handle UTF-8 and common encoding issues gracefully.
-   Handle commas, quoted descriptions, blank rows and different date
    formats.
-   Allow date format confirmation if ambiguous.
-   Reject or flag rows with invalid dates or missing/invalid amounts.
-   Handle negative amounts and separate debit/credit columns
    consistently.
-   Do not treat opening balance, closing balance or summary rows as
    transactions.
-   Show how many rows were parsed, excluded and flagged.
-   Do not execute spreadsheet formulas or macros.

## 6. Categorisation

Suggested initial categories: - Food and dining. - Transportation. -
Shopping. - Entertainment. - Education. - Bills and utilities. -
Health. - Travel. - Transfers. - Income/credits. - Other/uncategorised.

Categorisation may use rules or AI assistance, but: - Mark uncertain
categories for review. - Let users change categories. - Preserve user
corrections. - Do not classify transfers between a user's own accounts
as spending if reliably identified. - Do not assume every credit is
salary or income. - Do not present category predictions as verified
facts.

## 7. Duplicate detection

Overlapping CSV date ranges are expected.

Use a duplicate candidate strategy based on available fields, such as: -
User/account. - Date and amount. - Direction. - Normalised
description. - Provider transaction ID where available.

Do not silently delete all matching rows: two genuine purchases can have
the same date and amount. Show likely duplicates and let the user review
uncertain cases.

Make final import idempotent so repeating the same confirmed import does
not create duplicate records.

## 8. Review screen

Show: - Transaction date. - Description. - Debit/credit. - Amount. -
Suggested category. - Warning or confidence indicator where needed.

Allow: - Correct category. - Exclude row. - Edit description/date/amount
if appropriate. - Select all or review flagged rows. - Return to column
mapping.

## 9. Import result

Show: - Rows detected. - Transactions imported. - Duplicates skipped or
excluded. - Invalid rows excluded. - Categories requiring review.

Never claim all transactions were imported if some were excluded or
uncertain.

## 10. Expense dashboard outputs

-   Total debit expenditure for selected period.
-   Category-wise expenditure.
-   Monthly trend.
-   Recent transactions.
-   Search and filters.
-   Manual expense entry.
-   Source labels: imported / manual / estimate.

Credits should be shown separately where useful and must not reduce
expenditure totals unless the product explicitly defines and labels
refunds. Avoid double-counting refunds or transfers.

## 11. Manual entry

Fields: - Amount. - Date. - Description/merchant. - Category. - Optional
note.

Manual entries should be editable and clearly marked as manual.

## 12. Privacy and file handling

-   Explain what is imported before upload.
-   Use private storage if raw files are retained.
-   Do not expose files through public URLs.
-   Provide deletion of imported transactions and uploaded source files.
-   Avoid logging full transaction descriptions or raw file content.
-   Do not retain more raw data than necessary.
-   The UI must clearly communicate what deletion removes.

## 13. Future scope --- do not implement in MVP

-   SMS transaction recognition.
-   Direct UPI app integrations.
-   Account Aggregator or other consent-based bank data integrations.
-   Automatic transaction sync.

These require separate feasibility, platform, consent, provider and
regulatory review.
