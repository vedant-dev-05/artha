import { addMonthsISO, monthsUntil, todayISO } from "./dates";
import { ceilToRupee } from "./money";
import { buildMilestones, requiredMonthlyPaise } from "./planning";
import type {
  Goal,
  GoalCategory,
  ISODate,
  Milestone,
  Paise,
  Priority,
} from "./types";

export const GOAL_CATEGORY_OPTIONS: Array<{
  value: GoalCategory;
  label: string;
  icon: string;
}> = [
  { value: "emergency", label: "Emergency", icon: "shield" },
  { value: "gadget", label: "Tech & Gear", icon: "laptop_mac" },
  { value: "travel", label: "Travel", icon: "flight_takeoff" },
  { value: "education", label: "Education", icon: "school" },
  { value: "purchase", label: "Major purchase", icon: "two_wheeler" },
  { value: "home", label: "Home", icon: "home" },
  { value: "custom", label: "Something else", icon: "flag" },
];

export const GOAL_CATEGORY_LABELS: Record<GoalCategory, string> = {
  travel: "Travel",
  education: "Education",
  emergency: "Emergency",
  gadget: "Tech & Gear",
  purchase: "Major purchase",
  custom: "Custom goal",
  home: "Home",
  other: "Other",
};

export interface GoalInput {
  name: string;
  category: GoalCategory;
  targetPaise: Paise;
  savedPaise: Paise;
  targetDate: ISODate | null;
  priority: Priority;
  note: string | null;
}

export type GoalInputErrors = Partial<Record<keyof GoalInput, string>>;

export function validateGoalInput(
  input: GoalInput,
  asOf: ISODate = todayISO(),
): GoalInputErrors {
  const errors: GoalInputErrors = {};
  if (input.name.trim().length === 0) errors.name = "Give this goal a name.";
  else if (input.name.trim().length > 60) errors.name = "Keep the name under 60 characters.";
  if (!Number.isInteger(input.targetPaise) || input.targetPaise <= 0) {
    errors.targetPaise = "Enter a target amount greater than zero.";
  }
  if (!Number.isInteger(input.savedPaise) || input.savedPaise < 0) {
    errors.savedPaise = "Already saved cannot be negative.";
  } else if (input.savedPaise > input.targetPaise) {
    errors.savedPaise = "Already saved cannot exceed the target. Mark the goal complete instead.";
  }
  if (input.targetDate && input.targetDate < asOf) {
    errors.targetDate = "Choose today or a later date.";
  }
  return errors;
}

/** Keep milestones reached by the user when the target changes. */
export function rebuildMilestones(goal: Goal, milestones: Milestone[]): Milestone[] {
  const fresh = buildMilestones(goal);
  return fresh.map((milestone) => {
    const previous = milestones.find(
      (item) => item.goalId === goal.id && item.targetPercent === milestone.targetPercent,
    );
    if (!previous || previous.status !== "reached") return milestone;
    return { ...milestone, status: "reached", achievedAt: previous.achievedAt };
  });
}

export interface GoalFeasibility {
  goalId: string;
  requiredMonthlyPaise: Paise;
  months: number;
  assumedHorizon: boolean;
  capacityPaise: Paise;
  shortfallPaise: Paise;
  feasible: boolean;
  monthsAtCapacity: number | null;
  dateAtCapacity: ISODate | null;
  recommendedMonthlyPaise: Paise;
  warnings: string[];
}

/**
 * Truthful feasibility check. Capacity already excludes essentials,
 * commitments, protected spending and the safety buffer.
 */
export function checkGoalFeasibility(
  goal: Goal,
  savedPaise: Paise,
  capacityPaise: Paise,
  asOf: ISODate = todayISO(),
): GoalFeasibility {
  const requirement = requiredMonthlyPaise(goal, savedPaise, asOf);
  const remaining = Math.max(0, goal.targetPaise - savedPaise);
  const safeCapacity = Math.max(0, capacityPaise);
  const shortfallPaise = Math.max(0, requirement.amountPaise - safeCapacity);
  const monthsAtCapacity = remaining > 0 && safeCapacity > 0 ? Math.ceil(remaining / safeCapacity) : null;
  const warnings: string[] = [];

  if (requirement.months <= 0) {
    warnings.push("This goal is already funded. Log a contribution or mark it complete.");
  }
  if (requirement.assumedHorizon) {
    warnings.push("No target date is set, so a transparent 12-month horizon is assumed.");
  }
  if (shortfallPaise > 0) {
    warnings.push(
      `Meeting this date needs about ₹${Math.round(shortfallPaise / 100).toLocaleString("en-IN")} more each month than your current capacity.`,
    );
  }
  if (safeCapacity <= 0) {
    warnings.push("There is no monthly capacity after essentials, commitments, protected spending and the safety buffer.");
  }

  return {
    goalId: goal.id,
    requiredMonthlyPaise: requirement.amountPaise,
    months: requirement.months,
    assumedHorizon: requirement.assumedHorizon,
    capacityPaise: safeCapacity,
    shortfallPaise,
    feasible: shortfallPaise === 0 && requirement.months > 0,
    monthsAtCapacity,
    dateAtCapacity: monthsAtCapacity ? addMonthsISO(asOf, monthsAtCapacity) : null,
    recommendedMonthlyPaise: Math.min(requirement.amountPaise, safeCapacity),
    warnings,
  };
}

export interface GoalAlternative {
  id: "keep_date" | "extend_date" | "smaller_step";
  label: string;
  description: string;
  monthlyPaise: Paise;
  targetDate: ISODate | null;
  tradeOff: string;
}

export function buildGoalAlternatives(
  goal: Goal,
  savedPaise: Paise,
  capacityPaise: Paise,
  asOf: ISODate = todayISO(),
): GoalAlternative[] {
  const feasibility = checkGoalFeasibility(goal, savedPaise, capacityPaise, asOf);
  const remaining = Math.max(0, goal.targetPaise - savedPaise);
  const safeCapacity = Math.max(0, capacityPaise);
  const assumedDate = goal.targetDate ?? addMonthsISO(asOf, 12);
  const atCapacityDate = feasibility.dateAtCapacity;
  const fullCapacityMovesLater = Boolean(atCapacityDate && atCapacityDate > assumedDate);
  const smallerMonthly = Math.floor((safeCapacity * 0.8) / 100) * 100;
  const smallerDate =
    remaining > 0 && smallerMonthly > 0
      ? addMonthsISO(asOf, Math.max(1, Math.ceil(remaining / smallerMonthly)))
      : null;
  const smallerMovesLater = Boolean(smallerDate && smallerDate > assumedDate);

  const options: GoalAlternative[] = [
    {
      id: "keep_date",
      label: "Keep the date",
      description: `Save about ₹${Math.round(feasibility.requiredMonthlyPaise / 100).toLocaleString("en-IN")}/month until ${goal.targetDate ? goal.targetDate : "the assumed date"}.`,
      monthlyPaise: feasibility.requiredMonthlyPaise,
      targetDate: goal.targetDate,
      tradeOff:
        feasibility.shortfallPaise > 0
          ? `Needs ₹${Math.round(feasibility.shortfallPaise / 100).toLocaleString("en-IN")}/month more than current capacity.`
          : "Fits your current capacity.",
    },
    {
      id: "extend_date",
      label: fullCapacityMovesLater ? "Extend the timeline" : "Use full capacity",
      description: atCapacityDate
        ? `Save about ₹${Math.round(safeCapacity / 100).toLocaleString("en-IN")}/month and finish around ${atCapacityDate}.`
        : "No monthly capacity is available yet.",
      monthlyPaise: safeCapacity,
      targetDate: atCapacityDate,
      tradeOff: fullCapacityMovesLater
        ? "Keeps your essentials and buffer protected; the date moves later."
        : "Uses more of your monthly capacity so you finish sooner.",
    },
    {
      id: "smaller_step",
      label: "Smaller, steadier step",
      description: `Save about ₹${Math.round(smallerMonthly / 100).toLocaleString("en-IN")}/month and review again later.`,
      monthlyPaise: smallerMonthly,
      targetDate: smallerDate,
      tradeOff: smallerMovesLater
        ? "Leaves more room for an unpredictable month; the date moves further out."
        : "Leaves more room for an unpredictable month while keeping the horizon short.",
    },
  ];
  return options;
}

export function defaultGoalIcon(category: GoalCategory): string {
  return GOAL_CATEGORY_OPTIONS.find((option) => option.value === category)?.icon ?? "flag";
}

export function monthsBetween(from: ISODate, to: ISODate): number {
  return monthsUntil(from, to);
}

export function suggestTargetDate(monthlyPaise: Paise, savedPaise: Paise, goal: Goal, asOf = todayISO()): ISODate | null {
  const remaining = Math.max(0, goal.targetPaise - savedPaise);
  if (remaining <= 0 || monthlyPaise <= 0) return null;
  return addMonthsISO(asOf, Math.ceil(remaining / monthlyPaise));
}

export function roundContributionToRupee(paise: Paise): Paise {
  return ceilToRupee(paise);
}
