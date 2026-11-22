# 06 — UX, Routes and Existing Wireframe Map

**Purpose:** Map the existing Stitch canvas screens to application routes, components and product requirements.

**Important:** These screens already exist. Do not generate replacement wireframes. Use the exact screen names below to identify the corresponding canvas frames or exported assets. If the coding environment receives the canvas directly, use these names to locate the frames. If it receives exported files, preserve these names in the export filenames or update this document to match the actual filenames.

## 1. Implementation instructions

1. Treat the supplied Artha design system and screen frames as the visual source of truth.
2. Match layout, hierarchy, typography, colours, spacing, components and interaction patterns.
3. Use the route suggestions below as a clean implementation structure, not as a reason to change the canvas design.
4. Screens identified as consolidated or superseded should not become duplicate routes.
5. Some named screens are distinct states of the same route. Implement them as states/components where appropriate rather than creating unnecessary separate pages.
6. If a screen name cannot be found on the canvas, report it as missing instead of inventing its design.
7. Keep responsive/mobile behaviour faithful to the supplied designs.

## 2. Canvas screen inventory and route mapping

Route names below are proposed implementation routes. The coding agent may adapt route syntax to the framework, but should preserve the information architecture and screen relationships.

### A. Core App & Goals

| Existing canvas screen name | Suggested route | Main component / purpose |
|---|---|---|
| `@Home Dashboard` | `/home` | `HomeDashboard`; primary Home tab, total savings, next best move, active/completed goals and milestones |
| `@Goal Detail` | `/goals/:goalId` | `GoalDetail`; individual goal progress, milestones and actions; also serves the My Goals tab/list context |
| `@Goal Creation` | `/goals/new` | `GoalCreationForm`; create a goal |
| `@Financial Feasibility & Plan` | `/goals/:goalId/feasibility` | `GoalFeasibility`; assess feasibility and adjust goal timeline |

### B. My Financial Plan

| Existing canvas screen name | Suggested route | Main component / purpose |
|---|---|---|
| `@My Financial Plan Overview` | `/plan` | `FinancialPlanOverview`; persistent approved plan summary, status, monthly target, commitments, schedule and assumptions |
| `@Goal-wise Financial Allocation` | `/plan/allocations` | `GoalAllocationBreakdown`; savings capacity and goal-wise monthly allocation |

**Navigation rule:** My Financial Plan must be accessible from Home and Goals. The plan is created and revised through the Coach conversation, but the accepted plan must remain viewable as a normal application screen.

### C. Expense Tracking & CSV Import

| Existing canvas screen name | Suggested route | Main component / purpose |
|---|---|---|
| `@Expense Tracking Dashboard` | `/expenses` | `ExpenseDashboard`; month selector, category donut chart, trends and recent transactions |
| `@Money & Expenditure Analysis` | Consolidate into `/expenses` | Earlier overview; do not build a duplicate route unless the canvas contains a materially distinct workflow |
| `@Category-wise Expense Details` | `/expenses/categories/:categoryId` | `CategoryExpenseDetails`; drill-down for all eight spending categories and their transactions |
| `@Transaction History` | `/expenses/transactions` | `TransactionHistory`; searchable/filterable chronological list, CSV vs Manual badges and inline category editing |
| `@Manual Expense Entry` | `/expenses/new` | `ManualExpenseForm`; quick manual expense entry |
| `@CSV Upload & Processing` | `/expenses/import` | `CSVUploadFlow`; drag-and-drop upload, column mapping, processing and unsupported-file errors |
| `@CSV Review & Import Confirmation` | `/expenses/import/review` | `CSVImportReview`; duplicate detection, uncertain transaction review and import confirmation summary |
| `@CSV Transaction Import & Mapping` | Part of `/expenses/import`; superseded | Earlier single-screen import/mapping prototype; use the newer two-step upload/processing and review/confirmation flow instead |

**CSV implementation note:** Treat upload/mapping/processing and review/confirmation as two stages of one import journey. Do not implement both the earlier single-screen prototype and the newer flow as competing experiences.

### D. AI Financial Companion (Coach)

| Existing canvas screen name | Suggested route / state | Main component / purpose |
|---|---|---|
| `@Financial Companion (Coach)` | `/coach` | `CoachConversation`; main Coach tab conversation view |
| `@AI Companion: Initial Planning` | Coach conversation state | `InitialPlanningConversation`; initial planning and feasibility assessment |
| `@AI Companion: Plan Recommendation` | Coach conversation state/card | `PlanRecommendationCard`; structured proposal with explicit Accept, Modify and Reject actions |
| `@AI Companion: Plan Adjustment` | Coach conversation state/card | `PlanAdjustmentComparison`; compares impact of income/expense changes and requires explicit approval before updating the active plan |

**Companion behaviour:** The floating companion entry point is available across the app as specified in the PRD. The full Coach tab is a dedicated conversation experience. The planning and adjustment canvas frames are conversation states/cards, not necessarily separate routes.

**Approval rule:** Only an explicit Accept/Approve action may activate a proposed plan or revision. Modify and Reject must leave the currently active plan unchanged.

### E. Onboarding Flow (Steps 1–9)

| Existing canvas screen name | Suggested route / step | Main component / purpose |
|---|---|---|
| `@Onboarding 1: Welcome` | `/onboarding/welcome` | Step 1: Welcome and Get Started/Login |
| `@Onboarding 2: Personal Intro` | `/onboarding/profile` | Step 2: Life stage selection — Student, Intern, Freelancer, Working Pro |
| `@Onboarding 3: Aspirations` | `/onboarding/aspirations` | Step 3: Financial aspirations and custom goals |
| `@Onboarding 4: Income` | `/onboarding/income` | Step 4: Income amount, frequency and regularity |
| `@Onboarding 5: Expenses` | `/onboarding/expenses` | Step 5: Fixed/variable expenses and optional CSV import |
| `@Onboarding 6: Goal Config` | `/onboarding/goals` | Step 6: Goal target amounts and timelines |
| `@Onboarding 7: Overview` | `/onboarding/overview` | Step 7: Financial overview summary before plan generation |
| `@Onboarding 8: Personalised Plan` | `/onboarding/plan` | Step 8: Generated personalised plan preview; must be reviewed and approved |
| `@Onboarding 9: Complete` | `/onboarding/complete` | Step 9: Completion and entry into Home |

**Onboarding rules:**
- Preserve the nine-step order represented in the canvas.
- CSV import remains optional; users can continue with estimates/manual inputs.
- Do not activate the plan merely because the user reaches Step 8. The user must explicitly approve the plan.
- On completion, route the user to `/home`.

### F. Profile & Settings

| Existing canvas screen name | Suggested route | Main component / purpose |
|---|---|---|
| `@Profile Overview` | `/profile` | `ProfileOverview`; header, personal/financial summaries, goals snapshot and Settings link |
| `@Edit Personal Info` | `/profile/personal` | `EditPersonalInfo`; edit personal information and life stage |
| `@Financial Profile & Preferences` | `/profile/financial` | `FinancialProfilePreferences`; edit income, commitments and savings preferences; show plan recalculation prompt when relevant |
| `@Settings` | `/settings` | `SettingsHub`; settings navigation, logout and account deletion confirmation modals |
| `@Notification Preferences` | `/settings/notifications` | `NotificationPreferences`; optional notification toggles |
| `@AI Companion Preferences` | `/settings/companion` | `CompanionPreferences`; Coach tone, proactive suggestions and prompt preferences |
| `@Financial Data Management` | `/settings/financial-data` | `FinancialDataManagement`; uploaded CSV history vs manual estimates and file/data deletion |
| `@Privacy & Security` | `/settings/privacy` | `PrivacySecurity`; biometric/PIN lock if supported, data consent and privacy policy |
| `@Help & Support` | `/settings/help` | `HelpSupport`; FAQs, support contact, problem reporting and app version |

**Settings rules:**
- Profile overview and Settings hub are separate screens.
- Editing financial profile inputs may affect the current plan. Explain the impact and ask whether the user wants to review/recalculate the plan; do not silently replace the active plan.
- Only show biometric/PIN controls if the chosen platform actually supports the feature. Otherwise present a truthful supported security option.
- Account deletion must have a clear confirmation step and documented data-deletion behaviour.

### G. System & Edge-Case States

| Existing canvas screen name | Implementation mapping | Main component / purpose |
|---|---|---|
| `@Interface States & Edge Cases` | Shared states across routes | Reference gallery for empty, loading, warning and error states across onboarding, goals, plan, expenses and Coach |

Implement the appropriate states in their relevant feature components. Do not create a user-facing route called `/interface-states` unless a development-only gallery is useful and is excluded from normal navigation.

At minimum, map the supplied reference states to:
- Empty onboarding/profile data.
- No goals yet.
- No active plan / plan awaiting approval.
- Plan infeasible or needs revision.
- No transactions yet.
- CSV parsing/loading.
- Unsupported or malformed CSV.
- Unmapped/ambiguous columns.
- Uncategorised transactions.
- Possible duplicates.
- Import success and partial import.
- Coach loading, empty conversation and service error.

### H. Design System & Shared Assets

| Existing canvas screen name | Implementation mapping | Main component / purpose |
|---|---|---|
| `@Artha — Design System` | Global design tokens and shared components | Shared colour, typography, spacing and component tokens used across every screen |

Create reusable tokens/components from the supplied design system. Do not treat the design-system frame as a normal application route.

## 3. Primary navigation map

Use the navigation shown in the canvas. The functional destinations are:

```text
Home tab
  └── Home Dashboard
       ├── Goal Detail
       │    ├── Goal Creation
       │    └── Financial Feasibility & Plan
       └── My Financial Plan Overview
            └── Goal-wise Financial Allocation

Money / Expenses tab
  └── Expense Tracking Dashboard
       ├── Category-wise Expense Details
       ├── Transaction History
       │    └── Manual Expense Entry
       └── CSV Upload & Processing
            └── CSV Review & Import Confirmation

Coach tab
  └── Financial Companion
       ├── Initial Planning conversation state
       ├── Plan Recommendation card
       └── Plan Adjustment comparison

Profile tab
  └── Profile Overview
       ├── Edit Personal Info
       ├── Financial Profile & Preferences
       └── Settings
            ├── Notification Preferences
            ├── AI Companion Preferences
            ├── Financial Data Management
            ├── Privacy & Security
            └── Help & Support
```

The companion floating action is a persistent overlay entry point and should not replace the primary tabs.

## 4. Shared component candidates

Implement shared components where the canvas uses consistent patterns:

- `AppShell`
- `BottomNavigation`
- `TopBar` / `ProfileAvatar`
- `FloatingCompanionButton`
- `CompanionOverlay`
- `GoalCard`
- `GoalProgress`
- `MilestoneTimeline`
- `PlanStatusCard`
- `PlanAllocationRow`
- `MoneyAmount`
- `MonthSelector`
- `CategoryDonutChart`
- `TransactionRow`
- `TransactionSourceBadge`
- `CategoryPicker`
- `CSVFileDropzone`
- `CSVColumnMapper`
- `CSVTransactionReviewTable`
- `ImportSummary`
- `SettingsListItem`
- `ConfirmationModal`
- `EmptyState`
- `LoadingState`
- `ErrorState`
- `InlineValidationMessage`

Do not force every visual element into a generic component. Reuse components when behaviour and presentation are genuinely shared.

## 5. Cross-screen state consistency

- Goal name, target, current saved amount, deadline and status must match across Home, Goal Detail, Plan and Coach context.
- The active financial plan must be the same version wherever it is displayed.
- Plan proposals in Coach must remain proposals until approved.
- Expense dashboard totals, category details and transaction history must derive from the same transaction dataset and selected date range.
- CSV-imported and manually entered transactions must be distinguishable.
- Financial profile changes must not silently mutate the active plan.
- Profile and settings preferences must persist and be reflected in companion behaviour.
- Empty/loading/error states must follow the supplied `@Interface States & Edge Cases` reference.

## 6. Asset handoff checklist

Before implementation, confirm that the coding agent can access:
- [ ] All named screen frames or exported assets.
- [ ] The `@Artha — Design System` frame.
- [ ] The `@Interface States & Edge Cases` reference.
- [ ] Any icons, illustrations or fonts referenced by the canvas.
- [ ] Any interactive prototype links or annotations that explain transitions.

If the canvas is supplied directly, the agent should map by the exact `@` names in this document. If assets are exported, use descriptive filenames that retain the screen names, for example:

`wireframes/core/@Home Dashboard.png`

Do not invent export paths or assume assets are present when they have not been provided.
