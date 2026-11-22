/**
 * Domain types for Artha.
 *
 * Money is always stored as integer paise (1 rupee = 100 paise).
 * Dates that represent a calendar day are ISO `YYYY-MM-DD` strings.
 * Timestamps are ISO-8601 strings.
 */

export type Paise = number;
export type ISODate = string;
export type ISODateTime = string;
export type CurrencyCode = "INR";

export type LifeStage =
  | "student"
  | "intern"
  | "freelancer"
  | "working_professional"
  | "other";

export type IncomeType =
  | "regular"
  | "irregular"
  | "allowance"
  | "mixed"
  | "unknown";

export type IncomeFrequency = "weekly" | "monthly" | "variable" | "other";

export type IncomePredictability =
  | "predictable"
  | "somewhat_variable"
  | "highly_variable";

export type SourceQuality = "estimate" | "user_confirmed" | "imported" | "mixed";

export type Priority = "high" | "medium" | "low";

export type GoalStatus = "active" | "paused" | "completed" | "archived";

export type GoalCategory =
  | "travel"
  | "education"
  | "emergency"
  | "gadget"
  | "purchase"
  | "home"
  | "custom"
  | "other";

export type SavingsFlexibility = "flexible" | "balanced" | "structured";

export type CompanionTone = "warm" | "concise" | "on_demand";

export type PlanStatus = "proposed" | "active" | "superseded" | "rejected";

export type PlanSource =
  | "companion_proposal"
  | "user_adjustment"
  | "system_recalculation";

export type TransactionDirection = "debit" | "credit";

export type TransactionSource = "csv_import" | "manual";

export type CategoryConfidence = "low" | "medium" | "high";

export type CategoryId =
  | "food"
  | "transport"
  | "shopping"
  | "entertainment"
  | "education"
  | "bills"
  | "health"
  | "travel"
  | "transfers"
  | "income"
  | "other"
  | "uncategorised";

export interface User {
  id: string;
  displayName: string;
  email: string;
  phone: string | null;
  age: number | null;
  lifeStage: LifeStage;
  avatarInitials: string;
  createdAt: ISODateTime;
}

export interface FinancialProfile {
  incomeType: IncomeType;
  incomeAmountPaise: Paise;
  incomeFrequency: IncomeFrequency;
  incomePredictability: IncomePredictability;
  essentialExpensesPaise: Paise;
  commitmentsPaise: Paise;
  protectedSpendingPaise: Paise;
  existingSavingsPaise: Paise;
  currency: CurrencyCode;
  sourceQuality: SourceQuality;
  updatedAt: ISODateTime;
}

export interface NotificationPreferences {
  milestones: boolean;
  progress: boolean;
  savingsReminders: boolean;
  weeklySummary: boolean;
  coachCheckIns: boolean;
}

export interface FinancialPreferences {
  savingsFlexibility: SavingsFlexibility;
  companionTone: CompanionTone;
  proactiveSuggestions: boolean;
  contextualBubbles: boolean;
  personalisedInsights: boolean;
  notifications: NotificationPreferences;
  currency: CurrencyCode;
  locale: "en-IN";
  theme: "light";
  bufferPercent: number;
  bufferMinimumPaise: Paise;
  updatedAt: ISODateTime;
}

export interface Goal {
  id: string;
  name: string;
  category: GoalCategory;
  targetPaise: Paise;
  targetDate: ISODate | null;
  priority: Priority;
  status: GoalStatus;
  icon: string;
  note: string | null;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export type ProgressSource = "manual" | "plan" | "other";

export interface GoalProgressEvent {
  id: string;
  goalId: string;
  amountPaise: Paise;
  date: ISODate;
  source: ProgressSource;
  note: string | null;
  createdAt: ISODateTime;
}

export type MilestoneStatus = "upcoming" | "reached";

export interface Milestone {
  id: string;
  goalId: string;
  label: string;
  targetPaise: Paise;
  targetPercent: number;
  status: MilestoneStatus;
  achievedAt: ISODate | null;
}

export interface PlanAllocation {
  goalId: string;
  contributionPaise: Paise;
  frequency: "monthly";
  projectedCompletionDate: ISODate | null;
  rationale: string;
}

export interface FinancialPlan {
  id: string;
  version: number;
  status: PlanStatus;
  summary: string;
  totalContributionPaise: Paise;
  capacityPaise: Paise;
  unallocatedPaise: Paise;
  assumptions: string[];
  warnings: string[];
  allocations: PlanAllocation[];
  createdAt: ISODateTime;
  approvedAt: ISODateTime | null;
  source: PlanSource;
}

export interface Transaction {
  id: string;
  date: ISODate;
  description: string;
  amountPaise: Paise;
  direction: TransactionDirection;
  category: CategoryId;
  source: TransactionSource;
  importBatchId: string | null;
  note: string | null;
  categoryConfidence: CategoryConfidence;
  categoryEditedByUser: boolean;
  createdAt: ISODateTime;
}

export type ImportBatchStatus =
  | "uploaded"
  | "parsing"
  | "mapping_required"
  | "review_required"
  | "ready_to_import"
  | "imported"
  | "failed";

export interface ImportBatch {
  id: string;
  filename: string;
  sourceLabel: string;
  periodStart: ISODate | null;
  periodEnd: ISODate | null;
  status: ImportBatchStatus;
  totalRows: number;
  importedRows: number;
  skippedRows: number;
  duplicateRows: number;
  createdAt: ISODateTime;
  completedAt: ISODateTime | null;
}

export interface Achievement {
  id: string;
  label: string;
  description: string;
  icon: string;
  achievedAt: ISODate;
}

export type CompanionRole = "user" | "assistant" | "system";

export interface CompanionMessage {
  id: string;
  role: CompanionRole;
  content: string;
  createdAt: ISODateTime;
  metadata?: Record<string, unknown> | null;
}

export interface CompanionConversation {
  id: string;
  title: string;
  contextScreen: string | null;
  messages: CompanionMessage[];
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface OnboardingState {
  completed: boolean;
  currentStep: number;
  completedSteps: number[];
  skippedCsv: boolean;
  startedAt: ISODateTime | null;
  completedAt: ISODateTime | null;
}

export interface DemoMeta {
  demo: true;
  seededAt: ISODateTime;
  lastResetAt: ISODateTime | null;
}

export interface AppData {
  schemaVersion: number;
  user: User;
  profile: FinancialProfile;
  preferences: FinancialPreferences;
  goals: Goal[];
  progressEvents: GoalProgressEvent[];
  milestones: Milestone[];
  plans: FinancialPlan[];
  transactions: Transaction[];
  importBatches: ImportBatch[];
  achievements: Achievement[];
  conversations: CompanionConversation[];
  onboarding: OnboardingState;
  meta: DemoMeta;
}

/** A goal joined with its derived progress. */
export interface GoalProgress {
  goal: Goal;
  savedPaise: Paise;
  remainingPaise: Paise;
  percent: number;
  status: GoalStatus;
  reachedTarget: boolean;
  health: "on_track" | "needs_attention" | "completed" | "paused";
  monthlyContributionPaise: Paise | null;
  projectedCompletionDate: ISODate | null;
  milestones: Milestone[];
  nextMilestone: Milestone | null;
  lastContributionDate: ISODate | null;
}
