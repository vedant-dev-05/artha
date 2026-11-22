import { addMonthsISO, formatMonthYear, isPastDate, monthsUntil, todayISO } from "./dates";
import {
  ceilToRupee,
  clampPaise,
  percentOf,
  roundToRupee,
  splitEqually,
  sumPaise,
} from "./money";
import type {
  FinancialPlan,
  FinancialPreferences,
  FinancialProfile,
  Goal,
  GoalProgress,
  GoalProgressEvent,
  ISODate,
  Milestone,
  Paise,
  PlanAllocation,
  Priority,
} from "./types";

const PRIORITY_ORDER: Record<Priority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export interface CapacityBreakdown {
  incomePaise: Paise;
  essentialsPaise: Paise;
  commitmentsPaise: Paise;
  protectedPaise: Paise;
  bufferPaise: Paise;
  capacityPaise: Paise;
  bufferPercent: number;
}

/**
 * Deterministic savings capacity.
 * capacity = conservative income − essentials − commitments − protected − buffer
 */
export function calculateCapacity(
  profile: FinancialProfile,
  preferences: FinancialPreferences,
): CapacityBreakdown {
  const incomePaise = Math.max(0, Math.round(profile.incomeAmountPaise));
  const essentialsPaise = Math.max(0, Math.round(profile.essentialExpensesPaise));
  const commitmentsPaise = Math.max(0, Math.round(profile.commitmentsPaise));
  const protectedPaise = Math.max(0, Math.round(profile.protectedSpendingPaise));

  const percentBuffer = Math.round((incomePaise * preferences.bufferPercent) / 100);
  const bufferPaise = Math.max(percentBuffer, preferences.bufferMinimumPaise);

  const capacityPaise = Math.max(
    0,
    incomePaise - essentialsPaise - commitmentsPaise - protectedPaise - bufferPaise,
  );

  return {
    incomePaise,
    essentialsPaise,
    commitmentsPaise,
    protectedPaise,
    bufferPaise,
    capacityPaise,
    bufferPercent: preferences.bufferPercent,
  };
}

export function savedForGoal(goalId: string, events: GoalProgressEvent[]): Paise {
  return sumPaise(events.filter((event) => event.goalId === goalId).map((event) => event.amountPaise));
}

export function savedByGoal(events: GoalProgressEvent[]): Record<string, Paise> {
  return events.reduce<Record<string, Paise>>((accumulator, event) => {
    accumulator[event.goalId] = (accumulator[event.goalId] ?? 0) + event.amountPaise;
    return accumulator;
  }, {});
}

export function goalRemaining(goal: Goal, saved: Paise): Paise {
  return Math.max(0, goal.targetPaise - saved);
}

/**
 * Monthly amount required to hit the goal's target date.
 * Goals without a date assume a transparent 12-month horizon.
 */
export function requiredMonthlyPaise(
  goal: Goal,
  saved: Paise,
  asOf: ISODate = todayISO(),
): { amountPaise: Paise; months: number; assumedHorizon: boolean } {
  const remaining = goalRemaining(goal, saved);
  if (remaining <= 0) return { amountPaise: 0, months: 0, assumedHorizon: false };
  const assumedHorizon = goal.targetDate === null;
  const months = assumedHorizon ? 12 : monthsUntil(asOf, goal.targetDate!);
  return {
    amountPaise: ceilToRupee(remaining / months),
    months,
    assumedHorizon,
  };
}

export function projectedCompletionDate(
  goal: Goal,
  saved: Paise,
  monthlyPaise: Paise,
  asOf: ISODate = todayISO(),
): ISODate | null {
  const remaining = goalRemaining(goal, saved);
  if (remaining <= 0) return asOf;
  if (monthlyPaise <= 0) return null;
  const months = Math.max(1, Math.ceil(remaining / monthlyPaise));
  return addMonthsISO(asOf, months);
}

function sortGoals(goals: Goal[]): Goal[] {
  return [...goals].sort((a, b) => {
    const priorityDelta = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (priorityDelta !== 0) return priorityDelta;
    if (a.targetDate && b.targetDate) return a.targetDate.localeCompare(b.targetDate);
    if (a.targetDate) return -1;
    if (b.targetDate) return 1;
    return a.createdAt.localeCompare(b.createdAt);
  });
}

interface Desired {
  goal: Goal;
  desiredPaise: Paise;
  assumedHorizon: boolean;
}

/**
 * Water-filling within a priority group: everyone gets an equal share, but
 * goals needing less than their share are funded first and the rest is
 * redistributed. Paise remainders are distributed deterministically.
 */
function allocateGroup(desired: Desired[], availablePaise: Paise): Map<string, Paise> {
  const result = new Map<string, Paise>();
  let pool = Math.max(0, availablePaise);
  let pending = [...desired];

  while (pending.length > 0 && pool > 0) {
    const share = Math.floor(pool / pending.length);
    if (share <= 0) break;

    const funded = pending.filter((item) => item.desiredPaise <= share);
    if (funded.length === 0) {
      const parts = splitEqually(pool, pending.length);
      pending.forEach((item, index) => {
        result.set(item.goal.id, (result.get(item.goal.id) ?? 0) + parts[index]);
      });
      pool = 0;
      break;
    }

    funded.forEach((item) => {
      const amount = roundToRupee(Math.min(item.desiredPaise, pool));
      result.set(item.goal.id, (result.get(item.goal.id) ?? 0) + amount);
      pool -= amount;
    });
    pending = pending.filter((item) => !funded.includes(item));
  }

  pending.forEach((item) => {
    if (!result.has(item.goal.id)) result.set(item.goal.id, 0);
  });

  return result;
}

export interface AllocationResult {
  allocations: PlanAllocation[];
  totalPaise: Paise;
  unallocatedPaise: Paise;
  warnings: string[];
  assumptions: string[];
}

/**
 * Allocate capacity across active goals, sequentially by priority.
 * Leftover capacity is intentionally left unallocated as flexible buffer.
 */
export function allocatePlan(
  goals: Goal[],
  events: GoalProgressEvent[],
  capacity: CapacityBreakdown,
  asOf: ISODate = todayISO(),
): AllocationResult {
  const activeGoals = sortGoals(goals.filter((goal) => goal.status === "active"));
  const saved = savedByGoal(events);
  const allocations = new Map<string, Paise>();
  const warnings: string[] = [];
  const assumptions: string[] = [];

  let pool = capacity.capacityPaise;

  const priorities: Priority[] = ["high", "medium", "low"];
  for (const priority of priorities) {
    const group = activeGoals.filter((goal) => goal.priority === priority);
    if (group.length === 0) continue;

    const desired: Desired[] = group.map((goal) => {
      const requirement = requiredMonthlyPaise(goal, saved[goal.id] ?? 0, asOf);
      return {
        goal,
        desiredPaise: requirement.amountPaise,
        assumedHorizon: requirement.assumedHorizon,
      };
    });

    const wanted = sumPaise(desired.map((item) => item.desiredPaise));
    const available = Math.min(pool, wanted);
    const groupAllocations = allocateGroup(desired, available);

    desired.forEach((item) => {
      const amount = groupAllocations.get(item.goal.id) ?? 0;
      allocations.set(item.goal.id, amount);
      if (item.assumedHorizon && amount > 0) {
        assumptions.push(
          `No target date is set for ${item.goal.name}, so the plan assumes a 12-month horizon.`,
        );
      }
    });

    pool = Math.max(0, pool - sumPaise([...groupAllocations.values()]));
  }

  activeGoals.forEach((goal) => {
    const savedAmount = saved[goal.id] ?? 0;
    const monthly = allocations.get(goal.id) ?? 0;
    const requirement = requiredMonthlyPaise(goal, savedAmount, asOf);

    if (goal.targetDate && isPastDate(goal.targetDate, asOf)) {
      warnings.push(`${goal.name}'s target date has already passed. Choose a new date to keep the plan realistic.`);
    }

    if (monthly > 0 && monthly < requirement.amountPaise) {
      const projected = projectedCompletionDate(goal, savedAmount, monthly, asOf);
      warnings.push(
        `${goal.name} needs about ₹${Math.round(requirement.amountPaise / 100).toLocaleString("en-IN")}/month to finish by ${formatMonthYear(
          goal.targetDate ?? asOf,
        )}. At the current allocation the plan reaches it ${
          projected ? `around ${formatMonthYear(projected)}` : "later than requested"
        }.`,
      );
    }
  });

  if (capacity.capacityPaise <= 0) {
    warnings.push(
      "After essentials, commitments, protected spending and a safety buffer, there is no monthly savings capacity. Adjust the inputs or protect a smaller buffer.",
    );
  }

  assumptions.push(
    `Income baseline of ₹${Math.round(capacity.incomePaise / 100).toLocaleString("en-IN")}/month.`,
    `Essentials of ₹${Math.round(capacity.essentialsPaise / 100).toLocaleString("en-IN")}/month and commitments of ₹${Math.round(
      capacity.commitmentsPaise / 100,
    ).toLocaleString("en-IN")}/month.`,
    `Protected spending of ₹${Math.round(capacity.protectedPaise / 100).toLocaleString("en-IN")}/month is kept aside.`,
    `A ₹${Math.round(capacity.bufferPaise / 100).toLocaleString("en-IN")}/month buffer (${capacity.bufferPercent}% of income, minimum ₹500) is not allocated to goals.`,
    "Contributions are monthly. Actual progress is recorded by you; Artha never moves money.",
  );

  const planAllocations: PlanAllocation[] = activeGoals.map((goal) => {
    const monthly = allocations.get(goal.id) ?? 0;
    const savedAmount = saved[goal.id] ?? 0;
    const projected = projectedCompletionDate(goal, savedAmount, monthly, asOf);
    return {
      goalId: goal.id,
      contributionPaise: monthly,
      frequency: "monthly",
      projectedCompletionDate: projected,
      rationale:
        monthly > 0
          ? `${goal.priority === "high" ? "High" : goal.priority === "medium" ? "Medium" : "Low"} priority${
              projected ? ` · projected ${formatMonthYear(projected)}` : ""
            }`
          : "Not funded at current capacity",
    };
  });

  const totalPaise = sumPaise(planAllocations.map((allocation) => allocation.contributionPaise));

  return {
    allocations: planAllocations,
    totalPaise,
    unallocatedPaise: Math.max(0, capacity.capacityPaise - totalPaise),
    warnings,
    assumptions,
  };
}

export function buildMilestones(goal: Goal): Milestone[] {
  const percents = [25, 50, 75, 100];
  const labels: Record<number, string> = {
    25: "First quarter",
    50: "Halfway point",
    75: "Final stretch",
    100: "Goal reached",
  };
  return percents.map((percent) => ({
    id: `${goal.id}-ms-${percent}`,
    goalId: goal.id,
    label: labels[percent],
    targetPaise: Math.round((goal.targetPaise * percent) / 100),
    targetPercent: percent,
    status: "upcoming",
    achievedAt: null,
  }));
}

/** Mark milestones reached using the chronological progress events. */
export function applyMilestoneProgress(
  milestones: Milestone[],
  events: GoalProgressEvent[],
): Milestone[] {
  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));
  return milestones.map((milestone) => {
    let running = 0;
    let achievedAt: ISODate | null = null;
    for (const event of sorted) {
      if (event.goalId !== milestone.goalId) continue;
      running += event.amountPaise;
      if (running >= milestone.targetPaise) {
        achievedAt = event.date;
        break;
      }
    }
    return {
      ...milestone,
      status: achievedAt ? "reached" : "upcoming",
      achievedAt,
    };
  });
}

export function buildGoalProgress(
  goal: Goal,
  events: GoalProgressEvent[],
  milestones: Milestone[],
  allocation: PlanAllocation | undefined,
  asOf: ISODate = todayISO(),
): GoalProgress {
  const goalEvents = events.filter((event) => event.goalId === goal.id);
  const savedPaise = sumPaise(goalEvents.map((event) => event.amountPaise));
  const remainingPaise = goalRemaining(goal, savedPaise);
  const percent = percentOf(savedPaise, goal.targetPaise);
  const reachedTarget = remainingPaise === 0;
  const goalMilestones = milestones
    .filter((milestone) => milestone.goalId === goal.id)
    .sort((a, b) => a.targetPercent - b.targetPercent);
  const nextMilestone = goalMilestones.find((milestone) => milestone.status === "upcoming") ?? null;
  const lastContributionDate =
    goalEvents.length > 0
      ? [...goalEvents].sort((a, b) => b.date.localeCompare(a.date))[0].date
      : null;

  const monthlyContributionPaise = allocation?.contributionPaise ?? null;
  const projectedDate = allocation
    ? projectedCompletionDate(goal, savedPaise, allocation.contributionPaise, asOf)
    : null;

  let health: GoalProgress["health"] = "on_track";
  if (goal.status === "completed") health = "completed";
  else if (goal.status === "paused") health = "paused";
  else if (goal.targetDate && projectedDate && projectedDate > goal.targetDate) {
    health = "needs_attention";
  } else if (
    lastContributionDate &&
    monthsUntil(lastContributionDate, asOf) > 2
  ) {
    health = "needs_attention";
  }

  return {
    goal,
    savedPaise,
    remainingPaise,
    percent,
    status: goal.status,
    health,
    monthlyContributionPaise,
    projectedCompletionDate: projectedDate,
    milestones: goalMilestones,
    nextMilestone,
    lastContributionDate,
    reachedTarget,
  };
}

export interface PlanProposalInput {
  goals: Goal[];
  events: GoalProgressEvent[];
  capacity: CapacityBreakdown;
  asOf?: ISODate;
  source?: FinancialPlan["source"];
  version?: number;
}

/** Build a deterministic, ready-to-present plan proposal. */
export function buildPlanProposal({
  goals,
  events,
  capacity,
  asOf = todayISO(),
  source = "system_recalculation",
  version = 1,
}: PlanProposalInput): FinancialPlan {
  const result = allocatePlan(goals, events, capacity, asOf);
  const funded = result.allocations.filter((allocation) => allocation.contributionPaise > 0).length;
  const summary =
    funded === 0
      ? "No monthly savings capacity is available with the current inputs."
      : `₹${Math.round(result.totalPaise / 100).toLocaleString("en-IN")}/month across ${funded} ${
          funded === 1 ? "goal" : "goals"
        }, keeping ₹${Math.round(result.unallocatedPaise / 100).toLocaleString("en-IN")} flexible each month.`;

  return {
    id: `plan-${Date.now()}`,
    version,
    status: "proposed",
    summary,
    totalContributionPaise: result.totalPaise,
    capacityPaise: capacity.capacityPaise,
    unallocatedPaise: result.unallocatedPaise,
    assumptions: result.assumptions,
    warnings: result.warnings,
    allocations: result.allocations,
    createdAt: new Date().toISOString(),
    approvedAt: null,
    source,
  };
}

/**
 * Server-side guard for plans that arrive from a model or an import.
 * Totals and dates are recomputed here; the caller's values are not trusted.
 */
export function validateProposal(
  proposal: Pick<FinancialPlan, "allocations" | "totalContributionPaise">,
  goals: Goal[],
  events: GoalProgressEvent[],
  capacity: CapacityBreakdown,
  asOf: ISODate = todayISO(),
): { ok: true } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  const activeGoalIds = new Set(goals.filter((goal) => goal.status === "active").map((goal) => goal.id));
  const saved = savedByGoal(events);

  for (const allocation of proposal.allocations) {
    if (!activeGoalIds.has(allocation.goalId)) {
      errors.push(`Unknown or inactive goal: ${allocation.goalId}`);
    }
    if (!Number.isInteger(allocation.contributionPaise) || allocation.contributionPaise < 0) {
      errors.push("Allocation amounts must be non-negative integer paise.");
    }
  }

  const total = sumPaise(proposal.allocations.map((allocation) => allocation.contributionPaise));
  if (total !== proposal.totalContributionPaise) {
    errors.push("Allocation total does not match the plan total.");
  }
  if (total > capacity.capacityPaise) {
    errors.push("Plan allocates more than the available monthly capacity.");
  }

  for (const allocation of proposal.allocations) {
    const goal = goals.find((candidate) => candidate.id === allocation.goalId);
    if (!goal) continue;
    const expected = projectedCompletionDate(
      goal,
      saved[goal.id] ?? 0,
      allocation.contributionPaise,
      asOf,
    );
    if (allocation.projectedCompletionDate && allocation.projectedCompletionDate !== expected) {
      errors.push(`Projected date for ${goal.name} was recalculated by the app.`);
    }
  }

  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}

export function clampContribution(amountPaise: Paise, capacityPaise: Paise): Paise {
  return clampPaise(amountPaise, 0, Math.max(0, capacityPaise));
}
