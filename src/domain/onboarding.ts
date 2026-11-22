import { addMonthsISO, todayISO } from "./dates";
import { rupeesToPaise } from "./money";
import {
  applyMilestoneProgress,
  buildMilestones,
  buildPlanProposal,
  calculateCapacity,
} from "./planning";
import type {
  AppData,
  Goal,
  GoalCategory,
  GoalProgressEvent,
  ISODate,
  ISODateTime,
  IncomeFrequency,
  IncomePredictability,
  IncomeType,
  LifeStage,
  Paise,
  Priority,
} from "./types";

export type AspirationKey = "emergency" | "gadget" | "travel" | "education" | "purchase" | "custom";

export interface AspirationOption {
  key: AspirationKey;
  label: string;
  icon: string;
  description: string;
}

export const ASPIRATION_OPTIONS: AspirationOption[] = [
  {
    key: "emergency",
    label: "Emergency savings",
    icon: "shield",
    description: "A cushion for unexpected months",
  },
  {
    key: "gadget",
    label: "Gadgets & gear",
    icon: "laptop_mac",
    description: "A laptop, phone or setup upgrade",
  },
  {
    key: "travel",
    label: "Travel",
    icon: "flight_takeoff",
    description: "A trip you have been imagining",
  },
  {
    key: "education",
    label: "Education",
    icon: "school",
    description: "A course, exam or certification",
  },
  {
    key: "purchase",
    label: "Major purchases",
    icon: "two_wheeler",
    description: "Something bigger than a monthly buy",
  },
  {
    key: "custom",
    label: "Other goals",
    icon: "add_circle",
    description: "Name a goal of your own",
  },
];

export const LIFE_STAGE_OPTIONS: Array<{
  value: LifeStage;
  label: string;
  icon: string;
  description: string;
}> = [
  {
    value: "student",
    label: "College student",
    icon: "school",
    description: "Pocket money, part-time gigs, or scholarships",
  },
  {
    value: "intern",
    label: "Intern",
    icon: "badge",
    description: "Monthly stipend with a fixed or short-term duration",
  },
  {
    value: "freelancer",
    label: "Freelancer",
    icon: "laptop_mac",
    description: "Project-based or variable monthly payouts",
  },
  {
    value: "working_professional",
    label: "Working professional",
    icon: "work",
    description: "Regular monthly salary and steady expenses",
  },
];

export interface OnboardingGoalDraft {
  key: AspirationKey;
  name: string;
  category: GoalCategory;
  icon: string;
  targetPaise: Paise;
  savedPaise: Paise;
  targetDate: ISODate | null;
  priority: Priority;
}

export interface OnboardingDraft {
  displayName: string;
  lifeStage: LifeStage | null;
  aspirations: AspirationKey[];
  incomeAmountPaise: Paise;
  incomeFrequency: IncomeFrequency;
  incomePredictability: IncomePredictability;
  expectedIncomeChange: "similar" | "increase" | "dip" | null;
  essentialExpensesPaise: Paise;
  variableExpensesPaise: Paise;
  commitmentsPaise: Paise;
  existingSavingsPaise: Paise;
  protectedSpendingPaise: Paise;
  goals: OnboardingGoalDraft[];
  planAccepted: boolean;
}

export function createEmptyDraft(): OnboardingDraft {
  return {
    displayName: "",
    lifeStage: null,
    aspirations: [],
    incomeAmountPaise: 0,
    incomeFrequency: "monthly",
    incomePredictability: "predictable",
    expectedIncomeChange: null,
    essentialExpensesPaise: 0,
    variableExpensesPaise: 0,
    commitmentsPaise: 0,
    existingSavingsPaise: 0,
    protectedSpendingPaise: 0,
    goals: [],
    planAccepted: false,
  };
}

const DEFAULT_TARGETS: Partial<Record<AspirationKey, Paise>> = {
  gadget: rupeesToPaise(100000),
  travel: rupeesToPaise(50000),
  education: rupeesToPaise(80000),
  purchase: rupeesToPaise(60000),
  custom: rupeesToPaise(50000),
};

const DEFAULT_CATEGORIES: Record<AspirationKey, GoalCategory> = {
  emergency: "emergency",
  gadget: "gadget",
  travel: "travel",
  education: "education",
  purchase: "purchase",
  custom: "custom",
};

const DEFAULT_ICONS: Record<AspirationKey, string> = {
  emergency: "shield",
  gadget: "laptop_mac",
  travel: "flight_takeoff",
  education: "school",
  purchase: "shopping_bag",
  custom: "flag",
};

const DEFAULT_PRIORITIES: Record<AspirationKey, Priority> = {
  emergency: "high",
  gadget: "medium",
  travel: "low",
  education: "medium",
  purchase: "low",
  custom: "medium",
};

const DEFAULT_NAMES: Record<AspirationKey, string> = {
  emergency: "Emergency Fund",
  gadget: "New Laptop",
  travel: "Travel Fund",
  education: "Education Fund",
  purchase: "Major Purchase",
  custom: "My Goal",
};

/** Add new selections and drop deselected ones, keeping any edits already made. */
export function syncGoalsWithAspirations(
  draft: OnboardingDraft,
  asOf: ISODate = todayISO(),
): OnboardingDraft {
  const existing = new Map(draft.goals.map((goal) => [goal.key, goal]));
  const goals: OnboardingGoalDraft[] = draft.aspirations.map((key) => {
    const previous = existing.get(key);
    if (previous) return previous;
    const targetPaise =
      key === "emergency"
        ? draft.essentialExpensesPaise > 0
          ? draft.essentialExpensesPaise * 3
          : rupeesToPaise(60000)
        : (DEFAULT_TARGETS[key] ?? rupeesToPaise(50000));
    return {
      key,
      name: DEFAULT_NAMES[key],
      category: DEFAULT_CATEGORIES[key],
      icon: DEFAULT_ICONS[key],
      targetPaise,
      savedPaise: key === "emergency" ? draft.existingSavingsPaise : 0,
      targetDate: addMonthsISO(asOf, 12),
      priority: DEFAULT_PRIORITIES[key],
    };
  });

  return { ...draft, goals, planAccepted: false };
}

function incomeTypeFor(
  lifeStage: LifeStage | null,
  incomeFrequency: IncomeFrequency,
  incomePredictability: IncomePredictability,
): IncomeType {
  if (lifeStage === "freelancer" || incomeFrequency === "variable") return "irregular";
  if (lifeStage === "student") return "allowance";
  if (lifeStage === "intern") return "irregular";
  if (lifeStage === "working_professional" && incomePredictability === "predictable") {
    return "regular";
  }
  return "mixed";
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "YO";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export interface BuildWorkspaceOptions {
  asOf?: ISODate;
  now?: ISODateTime;
  approved?: boolean;
}

/**
 * Build a complete workspace from onboarding answers. The plan is proposed
 * here; only `approved: true` (an explicit Accept action) activates it.
 */
export function buildWorkspaceFromDraft(
  draft: OnboardingDraft,
  { asOf = todayISO(), now = new Date().toISOString(), approved = false }: BuildWorkspaceOptions = {},
): AppData {
  const profile = {
    incomeType: incomeTypeFor(draft.lifeStage, draft.incomeFrequency, draft.incomePredictability),
    incomeAmountPaise: Math.max(0, Math.round(draft.incomeAmountPaise)),
    incomeFrequency: draft.incomeFrequency,
    incomePredictability: draft.incomePredictability,
    essentialExpensesPaise: Math.max(0, Math.round(draft.essentialExpensesPaise)),
    commitmentsPaise: Math.max(0, Math.round(draft.commitmentsPaise)),
    protectedSpendingPaise: Math.max(0, Math.round(draft.protectedSpendingPaise)),
    existingSavingsPaise: Math.max(0, Math.round(draft.existingSavingsPaise)),
    currency: "INR" as const,
    sourceQuality: "user_confirmed" as const,
    updatedAt: now,
  };

  const preferences: AppData["preferences"] = {
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
    updatedAt: now,
  };

  const goals: Goal[] = draft.goals.map((goal, index) => ({
    id: `goal-onboarding-${index + 1}`,
    name: goal.name.trim() || DEFAULT_NAMES[goal.key],
    category: goal.category,
    targetPaise: Math.max(0, Math.round(goal.targetPaise)),
    targetDate: goal.targetDate,
    priority: goal.priority,
    status: "active",
    icon: goal.icon,
    note: null,
    createdAt: now,
    updatedAt: now,
  }));

  const progressEvents: GoalProgressEvent[] = [];
  draft.goals.forEach((goal, index) => {
    if (goal.savedPaise <= 0) return;
    progressEvents.push({
      id: `pe-onboarding-${index + 1}`,
      goalId: goals[index].id,
      amountPaise: Math.round(goal.savedPaise),
      date: asOf,
      source: "manual",
      note: "Already saved at setup",
      createdAt: now,
    });
  });

  const milestones = goals.flatMap((goal) =>
    applyMilestoneProgress(buildMilestones(goal), progressEvents),
  );

  const capacity = calculateCapacity(profile, preferences);
  const proposal = buildPlanProposal({
    goals,
    events: progressEvents,
    capacity,
    asOf,
    source: "system_recalculation",
    version: 1,
  });
  const plan = {
    ...proposal,
    status: approved ? ("active" as const) : ("proposed" as const),
    approvedAt: approved ? now : null,
  };

  const displayName = draft.displayName.trim() || "You";

  return {
    schemaVersion: 1,
    user: {
      id: "user-onboarding",
      displayName,
      email: "demo@artha.local",
      phone: null,
      age: null,
      lifeStage: draft.lifeStage ?? "other",
      avatarInitials: initialsFor(displayName),
      createdAt: now,
    },
    profile,
    preferences,
    goals,
    progressEvents,
    milestones,
    plans: [plan],
    transactions: [],
    importBatches: [],
    achievements: [],
    conversations: [
      {
        id: "conversation-onboarding",
        title: "Welcome to Artha",
        contextScreen: "Onboarding",
        messages: [
          {
            id: "message-onboarding-welcome",
            role: "assistant",
            content: `Hi ${displayName}! I'm Artha Coach. Your plan is ready to explore — ask me anything about it. I can explain and propose changes, but you approve every plan before it changes.`,
            createdAt: now,
            metadata: { demo: true },
          },
        ],
        createdAt: now,
        updatedAt: now,
      },
    ],
    onboarding: {
      completed: true,
      currentStep: 9,
      completedSteps: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      skippedCsv: true,
      startedAt: now,
      completedAt: now,
    },
    meta: {
      demo: true,
      seededAt: now,
      lastResetAt: null,
    },
  };
}
