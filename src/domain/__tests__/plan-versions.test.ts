import { describe, expect, it } from "vitest";
import {
  approvePlanVersion,
  buildPlanAlternatives,
  nextPlanVersion,
  rejectPlanVersion,
} from "@/domain/plan-versions";
import {
  buildPlanProposal,
  calculateCapacity,
  validateProposal,
} from "@/domain/planning";
import { rupeesToPaise } from "@/domain/money";
import type {
  FinancialPreferences,
  FinancialProfile,
  FinancialPlan,
  Goal,
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

const capacity = calculateCapacity(profile, preferences);

function makeGoal(id: string, priority: Goal["priority"], targetRupees: number): Goal {
  return {
    id,
    name: id,
    category: "custom",
    targetPaise: rupeesToPaise(targetRupees),
    targetDate: "2027-11-22",
    priority,
    status: "active",
    icon: "flag",
    note: null,
    createdAt: `${AS_OF}T09:00:00.000Z`,
    updatedAt: `${AS_OF}T09:00:00.000Z`,
  };
}

const goals = [
  makeGoal("high", "high", 120000),
  makeGoal("medium", "medium", 110000),
  makeGoal("low", "low", 45000),
];

describe("plan version transitions", () => {
  it("supersedes the previous active plan when a proposal is approved", () => {
    const oldActive: FinancialPlan = {
      ...buildPlanProposal({ goals, events: [], capacity, asOf: AS_OF, version: 1 }),
      id: "plan-old",
      status: "active",
      approvedAt: `${AS_OF}T10:00:00.000Z`,
    };
    const proposal: FinancialPlan = {
      ...buildPlanProposal({ goals, events: [], capacity, asOf: AS_OF, version: 2 }),
      id: "plan-new",
    };

    const result = approvePlanVersion([oldActive, proposal], "plan-new", `${AS_OF}T11:00:00.000Z`);
    expect(result.find((plan) => plan.id === "plan-old")?.status).toBe("superseded");
    expect(result.find((plan) => plan.id === "plan-new")?.status).toBe("active");
    expect(result.find((plan) => plan.id === "plan-new")?.approvedAt).toBe(`${AS_OF}T11:00:00.000Z`);
  });

  it("rejects a proposal without touching an active plan", () => {
    const active: FinancialPlan = {
      ...buildPlanProposal({ goals, events: [], capacity, asOf: AS_OF, version: 1 }),
      id: "plan-active",
      status: "active",
      approvedAt: `${AS_OF}T10:00:00.000Z`,
    };
    const proposal: FinancialPlan = {
      ...buildPlanProposal({ goals, events: [], capacity, asOf: AS_OF, version: 2 }),
      id: "plan-proposed",
    };

    const result = rejectPlanVersion([active, proposal], "plan-proposed");
    expect(result.find((plan) => plan.id === "plan-active")?.status).toBe("active");
    expect(result.find((plan) => plan.id === "plan-proposed")?.status).toBe("rejected");
  });

  it("increments from the highest saved version", () => {
    expect(nextPlanVersion([{ version: 3 } as FinancialPlan, { version: 7 } as FinancialPlan])).toBe(8);
  });
});

describe("buildPlanAlternatives", () => {
  it("returns capacity-valid options that remain proposals", () => {
    const options = buildPlanAlternatives(goals, [], capacity, AS_OF, 3);
    expect(options.map((option) => option.id)).toEqual(["balanced", "flexible", "faster"]);
    for (const option of options) {
      expect(option.plan.status).toBe("proposed");
      expect(option.plan.version).toBe(3);
      expect(validateProposal(option.plan, goals, [], capacity, AS_OF)).toEqual({ ok: true });
    }
  });
});
