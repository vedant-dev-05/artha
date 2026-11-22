import { describe, expect, it } from "vitest";
import {
  buildGoalAlternatives,
  checkGoalFeasibility,
  validateGoalInput,
  type GoalInput,
} from "@/domain/goals";
import { calculateCapacity } from "@/domain/planning";
import { rupeesToPaise } from "@/domain/money";
import type { FinancialPreferences, FinancialProfile, Goal } from "@/domain/types";

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

const goal: Goal = {
  id: "g1",
  name: "Emergency Fund",
  category: "emergency",
  targetPaise: rupeesToPaise(120000),
  targetDate: "2027-11-22",
  priority: "high",
  status: "active",
  icon: "shield",
  note: null,
  createdAt: `${AS_OF}T09:00:00.000Z`,
  updatedAt: `${AS_OF}T09:00:00.000Z`,
};

const baseInput: GoalInput = {
  name: "New goal",
  category: "custom",
  targetPaise: rupeesToPaise(20000),
  savedPaise: 0,
  targetDate: "2027-11-22",
  priority: "medium",
  note: null,
};

describe("validateGoalInput", () => {
  it("accepts a valid goal", () => {
    expect(validateGoalInput(baseInput, AS_OF)).toEqual({});
  });

  it("rejects empty names, zero targets and dates in the past", () => {
    const errors = validateGoalInput(
      { ...baseInput, name: " ", targetPaise: 0, targetDate: "2026-11-21" },
      AS_OF,
    );
    expect(errors.name).toBeDefined();
    expect(errors.targetPaise).toBeDefined();
    expect(errors.targetDate).toBeDefined();
  });

  it("rejects saved amounts above the target", () => {
    const errors = validateGoalInput(
      { ...baseInput, savedPaise: rupeesToPaise(25000) },
      AS_OF,
    );
    expect(errors.savedPaise).toBeDefined();
  });
});

describe("checkGoalFeasibility", () => {
  it("reports a feasible goal within capacity", () => {
    const result = checkGoalFeasibility(goal, rupeesToPaise(48000), capacity.capacityPaise, AS_OF);
    expect(result.requiredMonthlyPaise).toBe(rupeesToPaise(6000));
    expect(result.feasible).toBe(true);
    expect(result.shortfallPaise).toBe(0);
  });

  it("reports an explicit shortfall for an aggressive date", () => {
    const tight = { ...goal, targetDate: "2026-12-22" };
    const result = checkGoalFeasibility(tight, rupeesToPaise(48000), capacity.capacityPaise, AS_OF);
    expect(result.feasible).toBe(false);
    expect(result.shortfallPaise).toBeGreaterThan(0);
    expect(result.warnings.join(" ")).toContain("more each month");
  });

  it("explains the assumed 12-month horizon when no date is set", () => {
    const result = checkGoalFeasibility(
      { ...goal, targetDate: null },
      0,
      capacity.capacityPaise,
      AS_OF,
    );
    expect(result.assumedHorizon).toBe(true);
    expect(result.warnings.join(" ")).toContain("12-month horizon");
  });
});

describe("buildGoalAlternatives", () => {
  it("returns three distinct, explicitly described options", () => {
    const options = buildGoalAlternatives(goal, rupeesToPaise(48000), capacity.capacityPaise, AS_OF);
    expect(options.map((option) => option.id)).toEqual(["keep_date", "extend_date", "smaller_step"]);
    expect(options.every((option) => option.description.length > 0)).toBe(true);
    expect(options.every((option) => option.tradeOff.length > 0)).toBe(true);
  });

  it("does not claim the date moves later when a goal already fits", () => {
    const options = buildGoalAlternatives(goal, rupeesToPaise(48000), capacity.capacityPaise, AS_OF);
    const fullCapacity = options.find((option) => option.id === "extend_date")!;
    expect(fullCapacity.label).toBe("Use full capacity");
    expect(fullCapacity.tradeOff).toContain("finish sooner");
  });

  it("labels an infeasible goal's full-capacity option as extending the timeline", () => {
    const tight = { ...goal, targetDate: "2026-12-22" };
    const options = buildGoalAlternatives(tight, 0, capacity.capacityPaise, AS_OF);
    const extended = options.find((option) => option.id === "extend_date")!;
    expect(extended.label).toBe("Extend the timeline");
    expect(extended.tradeOff).toContain("date moves later");
  });
});
