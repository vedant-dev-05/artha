# 01 --- Product Requirements Document (PRD)

**Product:** Goal-Oriented Financial Companion\
**Version:** 0.1 --- baseline for MVP implementation\
**Status:** Product direction confirmed; some implementation details
remain proposed/open.

## 1. Product overview

A mobile-first personal finance application for young adults
transitioning towards financial independence. The product helps users
translate financial aspirations into realistic plans, understand
spending, and maintain progress as their income, expenses and priorities
change.

The experience combines: - A goal-first home dashboard. - Goal creation
and progress tracking. - A financial plan created and adjusted through
an AI companion. - A persistent summary of the latest user-approved
financial plan. - Expense tracking through CSV import and manual
entry. - Profile, preferences, privacy and data controls. - Milestones
and individual gamification.

The product should feel approachable, supportive and non-judgmental. It
should not resemble a restrictive budgeting tool or a traditional bank
application.

## 2. Problem statement

**Working problem hypothesis:**

Young adults transitioning towards financial independence, particularly
those with irregular cash flows or newly acquired regular incomes, often
struggle to translate their financial goals into realistic and
achievable plans. Even when they establish a plan, maintaining
consistent progress becomes difficult as their income, expenses and
priorities change. Without a structured approach to managing their
finances, they may rely on parents, friends or informal advice to make
financial decisions, making it harder to independently pursue and
achieve their short-term and long-term aspirations.

This is a product hypothesis, not a proven market-wide fact. The MVP
should help test whether users experience this problem and whether the
proposed workflow provides meaningful value.

## 3. Target users

### Primary intended audience

Young adults transitioning towards financial independence, including: -
College students receiving allowances or stipends. - Interns. -
Freelancers and people with irregular income. - Early-career
professionals who have recently started earning.

### Important segmentation caveat

These groups do not have identical financial needs. Students may depend
on allowances; freelancers may face volatile cash flow; salaried
professionals may have predictable monthly income. Onboarding and
planning must adapt to the user's income type and circumstances rather
than assume one standard monthly salary.

**OPEN:** Select a narrower initial launch segment after user research.
Do not present the entire audience as one homogeneous validated segment.

## 4. Product objectives

1.  Help users define and prioritise meaningful financial goals.
2.  Convert goals into plans that reflect available financial capacity.
3.  Make spending visible without requiring exhaustive manual
    categorisation at onboarding.
4.  Help users monitor progress and understand deviations.
5.  Let users discuss financial choices and plan adjustments through a
    friendly AI companion.
6.  Keep the accepted plan visible and actionable outside chat.
7.  Encourage consistency without shame, pressure or harmful
    gamification.

## 5. Product principles

-   **Goal-first:** Goals and progress are the primary product
    experience.
-   **User control:** Users choose goals, priorities, protected spending
    and notification preferences.
-   **Adaptable:** Plans can be revisited when circumstances change.
-   **Transparent:** Show assumptions, estimates, imported facts and
    uncertainty.
-   **Non-judgmental:** Never shame users for spending, missed
    contributions or delayed goals.
-   **Consent-led:** No automated financial transactions or undisclosed
    data collection.
-   **Companion as interface, not magic:** AI supports planning and
    explanation; deterministic application logic validates and stores
    approved plans.

## 6. MVP scope

### 6.1 Onboarding and financial assessment --- IN SCOPE

Capture enough information to produce an initial financial picture: -
Personal details and life stage. - Income amount or estimate, type,
frequency and predictability. - Essential expenses and financial
commitments. - Existing savings where relevant. - Financial goals,
target amounts, desired dates and priorities. - Spending preferences and
expenses the user considers important to protect. - Optional CSV
transaction import.

Users may skip CSV import and proceed using estimates or manual
information. Do not force users to provide a complete transaction
history before they can use the app.

### 6.2 Goal management --- IN SCOPE

-   Create multiple short- and long-term goals.
-   Capture goal name, category, target amount, desired date, current
    savings and priority.
-   Allow users to edit, pause, complete or archive goals.
-   Show goal cards on the home dashboard.
-   Show a detailed goal view with progress, milestones, contribution
    guidance and relevant coaching.
-   Support user-defined priorities. A High/Medium/Low priority scheme
    is a proposed simple implementation, not a mandatory product rule.

### 6.3 Personalised financial planning --- IN SCOPE

-   Planning conversation occurs through the AI companion.
-   Consider income type, income predictability, expenses, commitments,
    current savings, goals, priorities and user preferences.
-   Present a proposed savings strategy and goal timelines.
-   Explain feasibility and trade-offs.
-   Allow users to request alternatives.
-   Require explicit user approval before activating a plan.
-   Do not imply that every goal can be achieved within the user's
    preferred timeline.

### 6.4 AI financial companion --- IN SCOPE

-   Persistent floating entry point across the app, positioned above the
    bottom navigation.
-   Opens an overlay or chat panel without forcing navigation away from
    the current screen.
-   Supports on-demand questions and optional proactive check-ins.
-   Uses relevant screen and user context when permitted.
-   Can explain spending, goals and plan recommendations.
-   Can guide users to screens and pre-fill proposed form values.
-   Must obtain confirmation before saving material changes or
    activating a revised plan.
-   Friendly, natural, simple, non-judgmental tone.

### 6.5 Expense tracking --- IN SCOPE

-   Dedicated expense tracking dashboard.
-   CSV import from supported UPI/bank exports.
-   Flexible column mapping because file formats vary.
-   Transaction preview and review.
-   Category assignment and user correction.
-   Duplicate detection for overlapping imports.
-   Manual expense entry.
-   Transaction list, search and filters.
-   Category-wise spending summary and monthly trends.
-   Clearly distinguish actual imported transactions from estimates and
    manual entries.

### 6.6 Progress tracking and adaptive coaching --- IN SCOPE

-   Compare actual recorded progress with the accepted plan.
-   Show goal progress and milestones.
-   Identify deviations where the data supports it.
-   Invite the user to discuss changes with the companion.
-   Propose adjustments and apply them only after approval.
-   Avoid assuming that a missing transaction means a user failed to
    save.

### 6.7 Individual gamification --- IN SCOPE

-   Milestones, achievements and optional personal challenges.
-   Reward meaningful progress and consistency.
-   Avoid punitive streaks, public comparisons or incentives to cut
    essential spending.

### 6.8 Profile and settings --- IN SCOPE

-   Personal and financial profile.
-   Financial preferences.
-   Currency (INR default for initial India-focused prototype).
-   Language and theme preferences where supported.
-   Notification preferences.
-   Companion personalisation and proactive check-in controls.
-   Uploaded files and imported transaction management.
-   Privacy, consent, account and support controls.

## 7. Out of scope for MVP

-   Investment and wealth management or investment recommendations.
-   Loans, credit facilities or lending products.
-   Tax planning or filing.
-   Payments, transfers or automated savings from user accounts.
-   Public leaderboards, financial competitions or community challenges.
-   Joint goals, shared savings and group expense management.
-   Automatic SMS inbox reading.
-   Direct UPI/bank integrations or Account Aggregator integrations.
-   Advanced forecasting for highly volatile freelance income beyond
    basic estimates and user-reviewed adjustments.

## 8. Future scope

-   Consent-based financial data integrations, subject to provider
    availability and regulatory requirements.
-   SMS transaction recognition, subject to platform permissions,
    feasibility and explicit consent.
-   Advanced irregular-income cash-flow forecasting.
-   Multi-goal optimisation.
-   Collaborative financial goals.
-   Advanced optional gamification.
-   Deeper behavioural insights based on sufficiently reliable
    historical data.

## 9. Information architecture

Primary navigation should retain the existing wireframe structure. The
product modules are:

1.  Home --- goal-first overview and next actions.
2.  Goals --- goal list, goal details and progress.
3.  Expenses --- spending dashboard and transactions.
4.  Profile --- profile and settings entry point.

The AI companion is a persistent floating interaction layer, not a
replacement for primary navigation.

The latest accepted financial plan must be accessible as **My Financial
Plan** from the Home dashboard and relevant Goals experiences. Plan
creation and revision happen through the companion.

## 10. Core user journeys

### Journey A --- New user

Welcome/authentication → personal/life-stage information → goals →
income and commitments → optional CSV import or estimates → financial
profile review → companion-led plan proposal → user approval → Home
dashboard.

### Journey B --- Create or update a goal

Goals → create/edit goal → enter target/date/current savings/priority →
discuss feasibility with companion → review recommendation → approve or
revise → goal and accepted plan update.

### Journey C --- Import expenses

Expenses or onboarding → select CSV → identify/map columns → preview →
categorise → review uncertain items and duplicates → confirm import →
update transaction history and spending dashboard.

### Journey D --- Adjust a plan

Home/Goal/Plan → companion → explain changed income, expenses or
priorities → receive alternatives → compare impact → explicitly approve
→ update active plan and related screens.

### Journey E --- Manual expense

Expenses → add expense → enter amount/date/description/category → save →
update transaction list and supported summaries.

## 11. Functional requirements

  -------------------------------------------------------------------------
  ID                      Requirement               Priority
  ----------------------- ------------------------- -----------------------
  FR-01                   User can complete         Must
                          onboarding and            
                          save/resume progress      

  FR-02                   User can create and       Must
                          manage multiple goals     

  FR-03                   User can provide income   Must
                          and commitment            
                          information               

  FR-04                   User can optionally       Must
                          import a CSV file         

  FR-05                   App can map CSV columns   Must
                          and preview transactions  

  FR-06                   User can review and       Must
                          correct transaction       
                          categories                

  FR-07                   App detects likely        Must
                          duplicate transactions    

  FR-08                   User can add and edit     Must
                          expenses manually         

  FR-09                   App shows spending        Must
                          summaries and transaction 
                          history                   

  FR-10                   Companion can propose a   Must
                          financial plan using      
                          available user data       

  FR-11                   User must approve a       Must
                          proposed plan before      
                          activation                

  FR-12                   Accepted plan is          Must
                          accessible outside chat   

  FR-13                   App tracks goal progress  Must
                          and milestones            

  FR-14                   Companion can propose     Must
                          plan revisions            

  FR-15                   Material plan revisions   Must
                          require explicit approval 

  FR-16                   User can control          Must
                          notifications and         
                          companion preferences     

  FR-17                   User can view and delete  Must
                          imported financial data   

  FR-18                   App provides meaningful   Must
                          empty, loading, success   
                          and error states          

  FR-19                   Individual                Should
                          achievements/milestones   
                          are supported             

  FR-20                   App supports optional     Should
                          contextual companion      
                          suggestions               
  -------------------------------------------------------------------------

## 12. Non-functional requirements

-   Mobile-first responsive layout.
-   Accessible typography, contrast and touch targets.
-   Clear loading, validation and error feedback.
-   Secure handling of personal and financial data.
-   No secrets or API keys embedded in client code.
-   Input validation and safe file handling.
-   Data minimisation: collect only information needed for the feature.
-   User-visible consent and data deletion pathways.
-   Maintainable separation between UI, business logic, persistence and
    AI provider.
-   Currency and date formatting suitable for the user's locale; INR is
    the initial default.
-   Do not claim regulatory compliance or bank-grade security without
    evidence and review.

## 13. Success measures to instrument

These are proposed product metrics, not validated targets: - Onboarding
completion rate. - Percentage of users who create at least one goal. -
Percentage of proposed plans accepted or revised. - CSV import
completion and correction rates. - Percentage of users who record or
import transactions after onboarding. - Goal progress updates over
time. - Plan revision frequency and acceptance. - User-reported
usefulness and trust. - Rate of incorrect categorisation or duplicate
import.

A possible north-star hypothesis is the proportion of active users
making measurable progress towards at least one financial goal in a
month. This must be balanced with indicators of financial strain;
progress should not reward harmful under-spending.

## 14. Assumptions and open questions

-   **ASSUMPTION:** An India-first prototype using INR and common Indian
    transaction exports is appropriate.
-   **ASSUMPTION:** Users will find CSV import less burdensome than
    detailed manual categorisation.
-   **ASSUMPTION:** Users will trust a companion with financial context
    if data use and controls are transparent.
-   **OPEN:** Initial target segment should be narrowed through user
    research.
-   **OPEN:** Exact supported CSV formats depend on sample files and
    testing.
-   **OPEN:** Authentication, hosting, database and AI provider depend
    on the chosen coding environment.
-   **OPEN:** Financial planning calculations and safeguards need
    product/financial review before real-world use.

## 15. MVP boundary

Build a usable prototype that demonstrates the complete loop:

**Understand the user → create goals → propose a plan → obtain approval
→ track expenses and progress → discuss changes → approve an updated
plan.**

Do not expand into investments, banking integrations, lending or
automated money movement.
