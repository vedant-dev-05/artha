import { addMonths, format, getDaysInMonth, setDate, subDays } from "date-fns";
import { toISODate, todayISO } from "@/domain/dates";
import { rupeesToPaise, sumPaise } from "@/domain/money";
import {
  allocatePlan,
  applyMilestoneProgress,
  buildMilestones,
  calculateCapacity,
} from "@/domain/planning";
import type {
  AppData,
  CategoryId,
  FinancialPreferences,
  FinancialProfile,
  Goal,
  GoalProgressEvent,
  ImportBatch,
  ISODate,
  Transaction,
  TransactionDirection,
  TransactionSource,
} from "@/domain/types";

export const SCHEMA_VERSION = 1;

const DEMO_USER_ID = "demo-user";

interface SeedContext {
  now: Date;
  today: ISODate;
  timestamp: string;
}

function createContext(referenceDate?: ISODate): SeedContext {
  const today = referenceDate ?? todayISO();
  const now = new Date(`${today}T09:00:00`);
  return { now, today, timestamp: now.toISOString() };
}

function daysAgo(context: SeedContext, days: number): ISODate {
  return toISODate(subDays(context.now, days));
}

function monthDay(context: SeedContext, monthOffset: number, day: number): ISODate {
  const month = addMonths(context.now, monthOffset);
  const clampedDay = Math.min(day, getDaysInMonth(month));
  const iso = toISODate(setDate(month, clampedDay));
  // Never seed future-dated activity for the current month.
  return monthOffset >= 0 && iso > context.today ? context.today : iso;
}

function goalTargetDate(context: SeedContext, monthsAhead: number): ISODate {
  return toISODate(addMonths(context.now, monthsAhead));
}

interface TransactionSeed {
  dayOffset: number;
  description: string;
  rupees: number;
  category: CategoryId;
  direction?: TransactionDirection;
  source?: TransactionSource;
  batchId?: string;
  note?: string;
}

const TRANSACTION_SEEDS: TransactionSeed[] = [
  // --- Current month ---
  { dayOffset: 20, description: "Swiggy Order", rupees: 480, category: "food", batchId: "batch-nov" },
  { dayOffset: 18, description: "Third Wave Coffee", rupees: 260, category: "food", batchId: "batch-nov" },
  { dayOffset: 16, description: "Zomato Dinner", rupees: 690, category: "food", batchId: "batch-nov" },
  { dayOffset: 14, description: "Blinkit Groceries", rupees: 1420, category: "food", batchId: "batch-nov" },
  { dayOffset: 12, description: "Uber Auto", rupees: 210, category: "transport", batchId: "batch-nov" },
  { dayOffset: 10, description: "Metro Card Recharge", rupees: 500, category: "transport", source: "manual" },
  { dayOffset: 9, description: "Amazon India", rupees: 1150, category: "shopping", batchId: "batch-nov" },
  { dayOffset: 8, description: "Croma — Headphones", rupees: 2990, category: "shopping", batchId: "batch-nov" },
  { dayOffset: 6, description: "Netflix", rupees: 199, category: "entertainment", batchId: "batch-nov" },
  { dayOffset: 5, description: "Airtel Fiber", rupees: 1999, category: "bills", batchId: "batch-nov" },
  { dayOffset: 4, description: "Electricity Bill", rupees: 1310, category: "bills", batchId: "batch-nov" },
  { dayOffset: 3, description: "Rent — Koramangala", rupees: 18000, category: "bills", batchId: "batch-nov" },
  { dayOffset: 2, description: "Cult.fit Membership", rupees: 1500, category: "health", batchId: "batch-nov" },
  { dayOffset: 1, description: "Apollo Pharmacy", rupees: 280, category: "health", batchId: "batch-nov" },
  { dayOffset: 7, description: "MakeMyTrip — Spiti stay", rupees: 3200, category: "travel", batchId: "batch-nov" },
  { dayOffset: 13, description: "Auto fare", rupees: 120, category: "transport", source: "manual" },
  { dayOffset: 11, description: "Tea stall", rupees: 60, category: "food", source: "manual" },
  { dayOffset: 15, description: "Local market", rupees: 450, category: "food", source: "manual" },
  {
    dayOffset: 2,
    description: "Transfer to savings account",
    rupees: 5000,
    category: "transfers",
    batchId: "batch-nov",
    note: "Own-account transfer, excluded from spending.",
  },
  {
    dayOffset: 3,
    description: "Freelance payout — Studio Nine",
    rupees: 58000,
    category: "income",
    direction: "credit",
    batchId: "batch-nov",
  },

  // --- Previous month ---
  { dayOffset: 50, description: "Swiggy Order", rupees: 530, category: "food", batchId: "batch-oct" },
  { dayOffset: 48, description: "Zomato Dinner", rupees: 720, category: "food", batchId: "batch-oct" },
  { dayOffset: 46, description: "Blinkit Groceries", rupees: 1340, category: "food", batchId: "batch-oct" },
  { dayOffset: 44, description: "Chai Point", rupees: 120, category: "food", source: "manual" },
  { dayOffset: 42, description: "Uber", rupees: 260, category: "transport", batchId: "batch-oct" },
  { dayOffset: 40, description: "Rapido", rupees: 95, category: "transport", source: "manual" },
  { dayOffset: 38, description: "Amazon India", rupees: 2150, category: "shopping", batchId: "batch-oct" },
  { dayOffset: 36, description: "Myntra", rupees: 1890, category: "shopping", batchId: "batch-oct" },
  { dayOffset: 34, description: "BookMyShow", rupees: 450, category: "entertainment", batchId: "batch-oct" },
  { dayOffset: 32, description: "Spotify", rupees: 119, category: "entertainment", batchId: "batch-oct" },
  { dayOffset: 30, description: "Airtel Fiber", rupees: 1999, category: "bills", batchId: "batch-oct" },
  { dayOffset: 28, description: "Electricity Bill", rupees: 1180, category: "bills", batchId: "batch-oct" },
  { dayOffset: 27, description: "Rent — Koramangala", rupees: 18000, category: "bills", batchId: "batch-oct" },
  { dayOffset: 26, description: "Cult.fit Membership", rupees: 1500, category: "health", batchId: "batch-oct" },
  { dayOffset: 33, description: "Apollo Pharmacy", rupees: 620, category: "health", batchId: "batch-oct" },
  { dayOffset: 45, description: "MakeMyTrip — Spiti advance", rupees: 4000, category: "travel", batchId: "batch-oct" },
  {
    dayOffset: 29,
    description: "Transfer to savings account",
    rupees: 5000,
    category: "transfers",
    batchId: "batch-oct",
    note: "Own-account transfer, excluded from spending.",
  },
  {
    dayOffset: 31,
    description: "Freelance payout — Studio Nine",
    rupees: 58000,
    category: "income",
    direction: "credit",
    batchId: "batch-oct",
  },

  // --- Two months ago ---
  { dayOffset: 78, description: "Swiggy Order", rupees: 420, category: "food", batchId: "batch-sep" },
  { dayOffset: 76, description: "Third Wave Coffee", rupees: 280, category: "food", batchId: "batch-sep" },
  { dayOffset: 74, description: "Zomato Dinner", rupees: 610, category: "food", batchId: "batch-sep" },
  { dayOffset: 72, description: "Blinkit Groceries", rupees: 1280, category: "food", batchId: "batch-sep" },
  { dayOffset: 70, description: "Uber Auto", rupees: 185, category: "transport", batchId: "batch-sep" },
  { dayOffset: 68, description: "Metro Card Recharge", rupees: 500, category: "transport", source: "manual" },
  { dayOffset: 66, description: "Amazon India", rupees: 1490, category: "shopping", batchId: "batch-sep" },
  { dayOffset: 64, description: "Netflix", rupees: 199, category: "entertainment", batchId: "batch-sep" },
  { dayOffset: 62, description: "Airtel Fiber", rupees: 1999, category: "bills", batchId: "batch-sep" },
  { dayOffset: 60, description: "Electricity Bill", rupees: 1240, category: "bills", batchId: "batch-sep" },
  { dayOffset: 58, description: "Apollo Pharmacy", rupees: 340, category: "health", batchId: "batch-sep" },
  { dayOffset: 56, description: "Cult.fit Membership", rupees: 1500, category: "health", batchId: "batch-sep" },
  { dayOffset: 57, description: "Rent — Koramangala", rupees: 18000, category: "bills", batchId: "batch-sep" },
  {
    dayOffset: 58,
    description: "Transfer to savings account",
    rupees: 5000,
    category: "transfers",
    batchId: "batch-sep",
    note: "Own-account transfer, excluded from spending.",
  },
  {
    dayOffset: 61,
    description: "Freelance payout — Studio Nine",
    rupees: 58000,
    category: "income",
    direction: "credit",
    batchId: "batch-sep",
  },
];

function buildGoals(context: SeedContext): Goal[] {
  const createdAt = `${monthDay(context, -5, 12)}T08:30:00.000Z`;
  const updatedAt = context.timestamp;
  return [
    {
      id: "goal-emergency",
      name: "Emergency Fund",
      category: "emergency",
      targetPaise: rupeesToPaise(120000),
      targetDate: goalTargetDate(context, 9),
      priority: "high",
      status: "active",
      icon: "shield",
      note: "Three months of essentials, kept separate from everyday spending.",
      createdAt,
      updatedAt,
    },
    {
      id: "goal-macbook",
      name: "MacBook Air M3",
      category: "gadget",
      targetPaise: rupeesToPaise(110000),
      targetDate: goalTargetDate(context, 13),
      priority: "medium",
      status: "active",
      icon: "laptop_mac",
      note: "For freelance design work.",
      createdAt,
      updatedAt,
    },
    {
      id: "goal-spiti",
      name: "Solo Spiti Trip",
      category: "travel",
      targetPaise: rupeesToPaise(45000),
      targetDate: goalTargetDate(context, 18),
      priority: "low",
      status: "active",
      icon: "flight",
      note: "Ten days in Himachal, planned for spring.",
      createdAt,
      updatedAt,
    },
  ];
}

function buildProgressEvents(context: SeedContext): GoalProgressEvent[] {
  const make = (
    goalId: string,
    id: string,
    monthOffset: number,
    day: number,
    rupees: number,
    note: string,
  ): GoalProgressEvent => ({
    id,
    goalId,
    amountPaise: rupeesToPaise(rupees),
    date: monthDay(context, monthOffset, day),
    source: "manual",
    note,
    createdAt: `${monthDay(context, monthOffset, day)}T19:00:00.000Z`,
  });

  return [
    make("goal-emergency", "pe-1", -5, 20, 15000, "Moved freelance surplus"),
    make("goal-emergency", "pe-2", -4, 20, 10000, "Monthly contribution"),
    make("goal-emergency", "pe-3", -3, 20, 8000, "Monthly contribution"),
    make("goal-emergency", "pe-4", -2, 20, 6000, "Monthly contribution"),
    make("goal-emergency", "pe-5", -1, 20, 5000, "Monthly contribution"),
    make("goal-emergency", "pe-6", 0, 5, 4000, "Monthly contribution"),

    make("goal-macbook", "pe-7", -3, 15, 12000, "Project payout"),
    make("goal-macbook", "pe-8", -2, 15, 4000, "Monthly contribution"),
    make("goal-macbook", "pe-9", -1, 15, 3500, "Monthly contribution"),
    make("goal-macbook", "pe-10", 0, 15, 2500, "Monthly contribution"),

    make("goal-spiti", "pe-11", -2, 10, 4000, "Trip fund start"),
    make("goal-spiti", "pe-12", -1, 10, 3000, "Monthly contribution"),
    make("goal-spiti", "pe-13", 0, 10, 2000, "Monthly contribution"),
  ];
}

function buildTransactions(context: SeedContext): Transaction[] {
  return TRANSACTION_SEEDS.map((seed, index): Transaction => {
    const date = daysAgo(context, seed.dayOffset);
    return {
      id: `tx-${String(index + 1).padStart(3, "0")}`,
      date,
      description: seed.description,
      amountPaise: rupeesToPaise(seed.rupees),
      direction: seed.direction ?? "debit",
      category: seed.category,
      source: seed.source ?? "csv_import",
      importBatchId: seed.source === "manual" ? null : (seed.batchId ?? null),
      note: seed.note ?? null,
      categoryConfidence: seed.source === "manual" ? "high" : "high",
      categoryEditedByUser: false,
      createdAt: `${date}T11:00:00.000Z`,
    };
  }).sort((a, b) => b.date.localeCompare(a.date));
}

function buildImportBatches(context: SeedContext, transactions: Transaction[]): ImportBatch[] {
  const definitions = [
    {
      id: "batch-nov",
      filename: "HDFC_Nov2026.csv",
      sourceLabel: "HDFC Bank",
      daysAgoStart: 21,
      daysAgoEnd: 1,
      completedDaysAgo: 1,
    },
    {
      id: "batch-oct",
      filename: "GPay_Oct2026.csv",
      sourceLabel: "Google Pay",
      daysAgoStart: 52,
      daysAgoEnd: 25,
      completedDaysAgo: 24,
    },
    {
      id: "batch-sep",
      filename: "HDFC_Sep2026.csv",
      sourceLabel: "HDFC Bank",
      daysAgoStart: 80,
      daysAgoEnd: 55,
      completedDaysAgo: 54,
    },
  ];

  return definitions.map((definition) => {
    const rows = transactions.filter(
      (transaction) => transaction.importBatchId === definition.id,
    ).length;
    return {
      id: definition.id,
      filename: definition.filename,
      sourceLabel: definition.sourceLabel,
      periodStart: daysAgo(context, definition.daysAgoStart),
      periodEnd: daysAgo(context, definition.daysAgoEnd),
      status: "imported",
      totalRows: rows,
      importedRows: rows,
      skippedRows: 0,
      duplicateRows: 0,
      createdAt: `${daysAgo(context, definition.completedDaysAgo)}T18:00:00.000Z`,
      completedAt: `${daysAgo(context, definition.completedDaysAgo)}T18:00:05.000Z`,
    };
  });
}

export function createSeedData(referenceDate?: ISODate): AppData {
  const context = createContext(referenceDate);

  const user = {
    id: DEMO_USER_ID,
    displayName: "Aarav Sharma",
    email: "aarav.sharma@example.com",
    phone: "+91 98765 43210",
    age: 24,
    lifeStage: "freelancer" as const,
    avatarInitials: "AS",
    createdAt: `${monthDay(context, -6, 1)}T09:00:00.000Z`,
  };

  const profile: FinancialProfile = {
    incomeType: "irregular",
    incomeAmountPaise: rupeesToPaise(58000),
    incomeFrequency: "monthly",
    incomePredictability: "somewhat_variable",
    essentialExpensesPaise: rupeesToPaise(26000),
    commitmentsPaise: 0,
    protectedSpendingPaise: rupeesToPaise(6000),
    existingSavingsPaise: 0,
    currency: "INR",
    sourceQuality: "user_confirmed",
    updatedAt: context.timestamp,
  };

  const preferences: FinancialPreferences = {
    savingsFlexibility: "balanced",
    companionTone: "warm",
    proactiveSuggestions: true,
    contextualBubbles: true,
    personalisedInsights: true,
    notifications: {
      milestones: true,
      progress: true,
      savingsReminders: false,
      weeklySummary: true,
      coachCheckIns: true,
    },
    currency: "INR",
    locale: "en-IN",
    theme: "light",
    bufferPercent: 10,
    bufferMinimumPaise: rupeesToPaise(500),
    updatedAt: context.timestamp,
  };

  const goals = buildGoals(context);
  const progressEvents = buildProgressEvents(context);
  const transactions = buildTransactions(context);
  const importBatches = buildImportBatches(context, transactions);

  const milestones = applyMilestoneProgress(
    goals.flatMap((goal) => buildMilestones(goal)),
    progressEvents,
  );

  const capacity = calculateCapacity(profile, preferences);
  const allocation = allocatePlan(goals, progressEvents, capacity, context.today);
  const planTotal = sumPaise(allocation.allocations.map((item) => item.contributionPaise));

  const approvedAt = `${monthDay(context, -1, 1)}T10:00:00.000Z`;

  const plans = [
    {
      id: "plan-1",
      version: 1,
      status: "active" as const,
      summary: `₹${Math.round(planTotal / 100).toLocaleString("en-IN")}/month across three goals, keeping ₹${Math.round(
        allocation.unallocatedPaise / 100,
      ).toLocaleString("en-IN")} flexible each month.`,
      totalContributionPaise: planTotal,
      capacityPaise: capacity.capacityPaise,
      unallocatedPaise: allocation.unallocatedPaise,
      assumptions: allocation.assumptions,
      warnings: allocation.warnings,
      allocations: allocation.allocations,
      createdAt: approvedAt,
      approvedAt,
      source: "companion_proposal" as const,
    },
  ];

  const achievements = [
    {
      id: "ach-1",
      label: "First goal created",
      description: "You gave your savings a direction.",
      icon: "flag",
      achievedAt: monthDay(context, -5, 12),
    },
    {
      id: "ach-2",
      label: "₹10,000 saved",
      description: "Your first five figures, set aside on purpose.",
      icon: "savings",
      achievedAt: monthDay(context, -4, 20),
    },
    {
      id: "ach-3",
      label: "Quarter of the way",
      description: "Emergency Fund reached 25%.",
      icon: "workspace_premium",
      achievedAt: monthDay(context, -3, 20),
    },
  ];

  const conversations = [
    {
      id: "conv-1",
      title: "Building my safety net",
      contextScreen: "home",
      createdAt: `${monthDay(context, -5, 12)}T10:05:00.000Z`,
      updatedAt: `${monthDay(context, -5, 12)}T10:12:00.000Z`,
      messages: [
        {
          id: "msg-1",
          role: "user" as const,
          content:
            "I want to build an emergency fund and save for a MacBook, but my freelance income changes every month.",
          createdAt: `${monthDay(context, -5, 12)}T10:05:00.000Z`,
          metadata: { demo: true },
        },
        {
          id: "msg-2",
          role: "assistant" as const,
          content:
            "That makes sense. Let's use a conservative monthly baseline rather than your best month, so the plan still works in a quieter month.",
          createdAt: `${monthDay(context, -5, 12)}T10:06:00.000Z`,
          metadata: { demo: true },
        },
        {
          id: "msg-3",
          role: "user" as const,
          content: "A normal month is around ₹58,000. Essentials are about ₹26,000.",
          createdAt: `${monthDay(context, -5, 12)}T10:08:00.000Z`,
          metadata: { demo: true },
        },
        {
          id: "msg-4",
          role: "assistant" as const,
          content:
            "Thanks. I'll keep ₹6,000 aside for the things you don't want to give up, and a 10% buffer. That leaves about ₹20,200 a month for goals.",
          createdAt: `${monthDay(context, -5, 12)}T10:12:00.000Z`,
          metadata: { demo: true },
        },
      ],
    },
  ];

  return {
    schemaVersion: SCHEMA_VERSION,
    user,
    profile,
    preferences,
    goals,
    progressEvents,
    milestones,
    plans,
    transactions,
    importBatches,
    achievements,
    conversations,
    onboarding: {
      completed: true,
      currentStep: 7,
      completedSteps: [1, 2, 3, 4, 5, 6, 7],
      skippedCsv: false,
      startedAt: `${monthDay(context, -6, 1)}T09:05:00.000Z`,
      completedAt: `${monthDay(context, -6, 1)}T09:40:00.000Z`,
    },
    meta: {
      demo: true,
      seededAt: context.timestamp,
      lastResetAt: null,
    },
  };
}
