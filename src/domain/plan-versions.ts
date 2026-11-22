import { formatMonthYear } from "./dates";
import { sumPaise } from "./money";
import {
  allocatePlan,
  buildPlanProposal,
  projectedCompletionDate,
  savedByGoal,
  validateProposal,
  type CapacityBreakdown,
} from "./planning";
import type {
  FinancialPlan,
  Goal,
  GoalProgressEvent,
  ISODate,
  Paise,
  PlanAllocation,
} from "./types";

export function nextPlanVersion(plans: FinancialPlan[]): number {
  return plans.reduce((highest, plan) => Math.max(highest, plan.version), 0) + 1;
}

/**
 * Activate one proposal and mark the previously active version superseded.
 * Plan history is preserved; nothing is overwritten.
 */
export function approvePlanVersion(
  plans: FinancialPlan[],
  planId: string,
  now: string,
): FinancialPlan[] {
  const target = plans.find((plan) => plan.id === planId);
  if (!target || target.status !== "proposed") return plans;
  return plans.map((plan) => {
    if (plan.id === planId) {
      return { ...plan, status: "active" as const, approvedAt: now };
    }
    if (plan.status === "active") {
      return { ...plan, status: "superseded" as const };
    }
    return plan;
  });
}

export function rejectPlanVersion(plans: FinancialPlan[], planId: string): FinancialPlan[] {
  const target = plans.find((plan) => plan.id === planId);
  if (!target || target.status !== "proposed") return plans;
  return plans.map((plan) =>
    plan.id === planId ? { ...plan, status: "rejected" as const } : plan,
  );
}

export interface PlanAlternative {
  id: "balanced" | "flexible" | "faster";
  label: string;
  description: string;
  plan: FinancialPlan;
}

function withScaledAllocations(
  base: FinancialPlan,
  goals: Goal[],
  events: GoalProgressEvent[],
  capacity: CapacityBreakdown,
  scale: number,
  giveAwayRemainder: boolean,
  asOf: ISODate,
): FinancialPlan {
  const saved = savedByGoal(events);
  const allocations: PlanAllocation[] = base.allocations.map((allocation) => {
    const goal = goals.find((candidate) => candidate.id === allocation.goalId);
    const amount = Math.floor((allocation.contributionPaise * scale) / 100) * 100;
    const projected = goal
      ? projectedCompletionDate(goal, saved[goal.id] ?? 0, amount, asOf)
      : null;
    return {
      ...allocation,
      contributionPaise: amount,
      projectedCompletionDate: projected,
      rationale:
        amount > 0
          ? `${allocation.rationale.split(" · ")[0]}${projected ? ` · projected ${formatMonthYear(projected)}` : ""}`
          : "Not funded in this option",
    };
  });

  const total = sumPaise(allocations.map((allocation) => allocation.contributionPaise));
  if (giveAwayRemainder) {
    let pool = Math.max(0, capacity.capacityPaise - total);
    const round = Math.min(pool, 100);
    for (const allocation of allocations) {
      if (pool <= 0) break;
      const addition = Math.min(pool, round);
      allocation.contributionPaise += addition;
      pool -= addition;
      const goal = goals.find((candidate) => candidate.id === allocation.goalId);
      if (goal) {
        allocation.projectedCompletionDate = projectedCompletionDate(
          goal,
          saved[goal.id] ?? 0,
          allocation.contributionPaise,
          asOf,
        );
      }
    }
  }

  const finalTotal = sumPaise(allocations.map((allocation) => allocation.contributionPaise));
  return {
    ...base,
    allocations,
    totalContributionPaise: finalTotal,
    unallocatedPaise: Math.max(0, capacity.capacityPaise - finalTotal),
  };
}

/**
 * Deterministic alternatives for the companion. Every option is validated
 * against capacity before it is shown; none of them is active.
 */
export function buildPlanAlternatives(
  goals: Goal[],
  events: GoalProgressEvent[],
  capacity: CapacityBreakdown,
  asOf: ISODate,
  version: number,
  source: FinancialPlan["source"] = "companion_proposal",
): PlanAlternative[] {
  const balanced = buildPlanProposal({
    goals,
    events,
    capacity,
    asOf,
    source,
    version,
  });

  const flexible = withScaledAllocations(balanced, goals, events, capacity, 0.8, false, asOf);
  const faster = withScaledAllocations(balanced, goals, events, capacity, 1, true, asOf);

  const options: PlanAlternative[] = [
    {
      id: "balanced",
      label: "Balanced",
      description: "Funds goals by priority while leaving unallocated capacity flexible.",
      plan: balanced,
    },
    {
      id: "flexible",
      label: "More flexible",
      description: "Lower monthly contributions with more room for unpredictable weeks.",
      plan: flexible,
    },
    {
      id: "faster",
      label: "Faster pace",
      description: "Uses more of the remaining capacity to pull projected dates earlier.",
      plan: faster,
    },
  ];

  return options.filter((option) => validateProposal(option.plan, goals, events, capacity, asOf).ok);
}

/** Recompute an allocation for a single goal after a user edit, capped at capacity. */
export function rebalanceManualAllocation(
  plan: FinancialPlan,
  goalId: string,
  contributionPaise: Paise,
): PlanAllocation[] {
  return plan.allocations.map((allocation) =>
    allocation.goalId === goalId
      ? { ...allocation, contributionPaise: Math.max(0, Math.round(contributionPaise)) }
      : allocation,
  );
}

export function planAllocationTotal(allocations: PlanAllocation[]): Paise {
  return sumPaise(allocations.map((allocation) => allocation.contributionPaise));
}

export { allocatePlan };
