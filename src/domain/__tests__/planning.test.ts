import { describe, expect, it } from "vitest";
import {
  allocatePlan,
  applyMilestoneProgress,
  buildGoalProgress,
  buildMilestones,
  buildPlanProposal,
  calculateCapacity,
  requiredMonthlyPaise,
  validateProposal,
} from "@/domain/planning";
import { rupeesToPaise } from "@/domain/money";
import type {
  FinancialPreferences,
  FinancialProfile,
  Goal,
  GoalProgressEvent,
} from "@/domain/types";

const AS_OF = "2026-11-22";

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
  updatedAt: `${AS_OF}T09:00:00.000Z`,
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
  updatedAt: `${AS_OF}T09:00:00.000Z`,
};

function makeGoal(overrides: Partial<Goal> & Pick<Goal, "id">): Goal {
  return {
    id: overrides.id,
    name: overrides.name ?? overrides.id,
    category: overrides.category ?? "custom",
    targetPaise: overrides.targetPaise ?? rupeesToPaise(120000),
    targetDate: overrides.targetDate ?? "2027-11-22",
    priority: overrides.priority ?? "high",
    status: overrides.status ?? "active",
    icon: overrides.icon ?? "flag",
    note: overrides.note ?? null,
    createdAt: overrides.createdAt ?? `${AS_OF}T09:00:00.000Z`,
    updatedAt: overrides.updatedAt ?? `${AS_OF}T09:00:00.000Z`,
  };
}

function makeEvent(id: string, goalId: string, rupees: number, date: string): GoalProgressEvent {
  return {
    id,
    goalId,
    amountPaise: rupeesToPaise(rupees),
    date,
    source: "manual",
    note: null,
    createdAt: `${date}T09:00:00.000Z`,
  };
}

describe("calculateCapacity", () => {
  it("subtracts essentials, commitments, protected spending and a 10% buffer", () => {
    const capacity = calculateCapacity(profile, preferences);
    expect(capacity.bufferPaise).toBe(rupeesToPaise(5800));
    expect(capacity.capacityPaise).toBe(rupeesToPaise(20200));
  });

  it("applies the ₹500 minimum buffer", () => {
    const capacity = calculateCapacity(
      { ...profile, incomeAmountPaise: rupeesToPaise(3000), essentialExpensesPaise: 0, protectedSpendingPaise: 0 },
      preferences,
    );
    expect(capacity.bufferPaise).toBe(rupeesToPaise(500));
    expect(capacity.capacityPaise).toBe(rupeesToPaise(2500));
  });

  it("never returns negative capacity", () => {
    const capacity = calculateCapacity(
      { ...profile, incomeAmountPaise: rupeesToPaise(10000) },
      preferences,
    );
    expect(capacity.capacityPaise).toBe(0);
  });
});

describe("requiredMonthlyPaise", () => {
  it("rounds up so the target date is never under-funded", () => {
    const goal = makeGoal({
      id: "g1",
      targetPaise: rupeesToPaise(110000),
      targetDate: "2027-12-22",
    });
    const result = requiredMonthlyPaise(goal, rupeesToPaise(22000), AS_OF);
    expect(result.months).toBe(13);
    expect(result.amountPaise).toBe(rupeesToPaise(6770));
  });

  it("returns zero once the target is reached", () => {
    const goal = makeGoal({ id: "g1", targetPaise: rupeesToPaise(10000) });
    expect(requiredMonthlyPaise(goal, rupeesToPaise(10000), AS_OF).amountPaise).toBe(0);
  });
});

describe("allocatePlan", () => {
  it("funds high priority before medium and low", () => {
    const goals = [
      makeGoal({ id: "high", priority: "high", targetPaise: rupeesToPaise(60000), targetDate: "2027-11-22" }),
      makeGoal({ id: "medium", priority: "medium", targetPaise: rupeesToPaise(60000), targetDate: "2027-11-22" }),
      makeGoal({ id: "low", priority: "low", targetPaise: rupeesToPaise(60000), targetDate: "2027-11-22" }),
    ];
    const capacity = calculateCapacity(profile, preferences);
    const result = allocatePlan(goals, [], capacity, AS_OF);
    const byId = new Map(result.allocations.map((allocation) => [allocation.goalId, allocation.contributionPaise]));

    expect(byId.get("high")).toBe(rupeesToPaise(5000));
    expect(byId.get("medium")).toBe(rupeesToPaise(5000));
    expect(byId.get("low")).toBe(rupeesToPaise(5000));
    expect(result.totalPaise).toBe(rupeesToPaise(15000));
    expect(result.unallocatedPaise).toBe(rupeesToPaise(5200));
  });

  it("splits a constrained priority group equally", () => {
    const goals = [
      makeGoal({ id: "a", priority: "high", targetPaise: rupeesToPaise(240000), targetDate: "2027-11-22" }),
      makeGoal({ id: "b", priority: "high", targetPaise: rupeesToPaise(240000), targetDate: "2027-11-22" }),
    ];
    const capacity = calculateCapacity(profile, preferences);
    const result = allocatePlan(goals, [], capacity, AS_OF);
    const amounts = result.allocations.map((allocation) => allocation.contributionPaise).sort((a, b) => a - b);
    expect(amounts).toEqual([rupeesToPaise(10100), rupeesToPaise(10100)]);
    expect(result.unallocatedPaise).toBe(0);
  });

  it("reports a warning when capacity is exhausted", () => {
    const goals = [makeGoal({ id: "a", targetPaise: rupeesToPaise(240000), targetDate: "2027-11-22" })];
    const capacity = { ...calculateCapacity(profile, preferences), capacityPaise: 0 };
    const result = allocatePlan(goals, [], capacity, AS_OF);
    expect(result.totalPaise).toBe(0);
    expect(result.warnings.join(" ")).toContain("no monthly savings capacity");
  });
});

describe("milestones and goal progress", () => {
  it("marks milestones in chronological order", () => {
    const goal = makeGoal({ id: "g1", targetPaise: rupeesToPaise(100000) });
    const milestones = buildMilestones(goal);
    const events = [
      makeEvent("e1", "g1", 30000, "2026-09-10"),
      makeEvent("e2", "g1", 30000, "2026-10-10"),
    ];
    const updated = applyMilestoneProgress(milestones, events);
    expect(updated.find((milestone) => milestone.targetPercent === 25)?.status).toBe("reached");
    expect(updated.find((milestone) => milestone.targetPercent === 50)?.status).toBe("reached");
    expect(updated.find((milestone) => milestone.targetPercent === 75)?.status).toBe("upcoming");
    expect(updated.find((milestone) => milestone.targetPercent === 50)?.achievedAt).toBe("2026-10-10");
  });

  it("computes saved, remaining and the next milestone", () => {
    const goal = makeGoal({ id: "g1", targetPaise: rupeesToPaise(100000), targetDate: "2027-11-22" });
    const events = [makeEvent("e1", "g1", 25000, "2026-11-01")];
    const milestones = applyMilestoneProgress(buildMilestones(goal), events);
    const progress = buildGoalProgress(
      goal,
      events,
      milestones,
      {
        goalId: "g1",
        contributionPaise: rupeesToPaise(7000),
        frequency: "monthly",
        projectedCompletionDate: "2027-10-22",
        rationale: "test",
      },
      AS_OF,
    );

    expect(progress.savedPaise).toBe(rupeesToPaise(25000));
    expect(progress.remainingPaise).toBe(rupeesToPaise(75000));
    expect(progress.percent).toBe(25);
    expect(progress.nextMilestone?.targetPercent).toBe(50);
    expect(progress.projectedCompletionDate).toBe("2027-10-22");
    expect(progress.health).toBe("on_track");
  });
});

describe("buildPlanProposal and validateProposal", () => {
  it("builds a plan whose allocations reconcile", () => {
    const goals = [
      makeGoal({ id: "emergency", priority: "high", targetPaise: rupeesToPaise(120000), targetDate: "2027-08-22" }),
      makeGoal({ id: "laptop", priority: "medium", targetPaise: rupeesToPaise(110000), targetDate: "2027-12-22" }),
      makeGoal({ id: "trip", priority: "low", targetPaise: rupeesToPaise(45000), targetDate: "2028-05-22" }),
    ];
    const events = [
      makeEvent("e1", "emergency", 48000, "2026-11-01"),
      makeEvent("e2", "laptop", 22000, "2026-11-01"),
      makeEvent("e3", "trip", 9000, "2026-11-01"),
    ];
    const capacity = calculateCapacity(profile, preferences);
    const plan = buildPlanProposal({ goals, events, capacity, asOf: AS_OF, version: 2 });

    expect(plan.status).toBe("proposed");
    expect(plan.version).toBe(2);
    expect(plan.totalContributionPaise).toBe(rupeesToPaise(16770));
    expect(plan.unallocatedPaise).toBe(rupeesToPaise(3430));
    expect(
      plan.allocations.reduce((total, allocation) => total + allocation.contributionPaise, 0),
    ).toBe(plan.totalContributionPaise);
    expect(validateProposal(plan, goals, events, capacity, AS_OF)).toEqual({ ok: true });
  });

  it("rejects tampered totals and over-allocation", () => {
    const goals = [makeGoal({ id: "a", targetPaise: rupeesToPaise(240000), targetDate: "2027-11-22" })];
    const capacity = calculateCapacity(profile, preferences);
    const plan = buildPlanProposal({ goals, events: [], capacity, asOf: AS_OF });

    const badTotal = validateProposal(
      { ...plan, totalContributionPaise: plan.totalContributionPaise + 100 },
      goals,
      [],
      capacity,
      AS_OF,
    );
    expect(badTotal.ok).toBe(false);

    const overAllocated = validateProposal(
      {
        allocations: [{ ...plan.allocations[0], contributionPaise: capacity.capacityPaise + 100 }],
        totalContributionPaise: capacity.capacityPaise + 100,
      },
      goals,
      [],
      capacity,
      AS_OF,
    );
    expect(overAllocated.ok).toBe(false);
  });
});
