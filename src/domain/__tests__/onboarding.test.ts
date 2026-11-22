import { describe, expect, it } from "vitest";
import {
  buildWorkspaceFromDraft,
  createEmptyDraft,
  syncGoalsWithAspirations,
  type OnboardingDraft,
} from "@/domain/onboarding";
import { calculateCapacity } from "@/domain/planning";
import { rupeesToPaise } from "@/domain/money";

const AS_OF = "2026-11-22";
const NOW = "2026-11-22T09:00:00.000Z";

function completeDraft(): OnboardingDraft {
  const base: OnboardingDraft = {
    ...createEmptyDraft(),
    displayName: "Test User",
    lifeStage: "freelancer",
    aspirations: ["emergency", "gadget"],
    incomeAmountPaise: rupeesToPaise(58000),
    incomeFrequency: "variable",
    incomePredictability: "somewhat_variable",
    essentialExpensesPaise: rupeesToPaise(26000),
    variableExpensesPaise: 0,
    commitmentsPaise: 0,
    existingSavingsPaise: rupeesToPaise(6000),
    protectedSpendingPaise: rupeesToPaise(6000),
  };
  return syncGoalsWithAspirations(base, AS_OF);
}

describe("onboarding draft", () => {
  it("starts empty", () => {
    const draft = createEmptyDraft();
    expect(draft.lifeStage).toBeNull();
    expect(draft.aspirations).toEqual([]);
    expect(draft.goals).toEqual([]);
    expect(draft.planAccepted).toBe(false);
  });

  it("creates goals from aspirations with a three-month emergency target", () => {
    const draft = completeDraft();
    expect(draft.goals.map((goal) => goal.key)).toEqual(["emergency", "gadget"]);
    expect(draft.goals[0].targetPaise).toBe(rupeesToPaise(78000));
    expect(draft.goals[0].savedPaise).toBe(rupeesToPaise(6000));
    expect(draft.goals[0].priority).toBe("high");
    expect(draft.goals[1].targetDate).toBe("2027-11-22");
  });

  it("preserves edits and drops deselected goals", () => {
    const draft = completeDraft();
    const edited = {
      ...draft,
      goals: draft.goals.map((goal, index) =>
        index === 1 ? { ...goal, name: "My laptop", priority: "low" as const } : goal,
      ),
      aspirations: ["gadget" as const, "travel" as const],
    };
    const synced = syncGoalsWithAspirations(edited, AS_OF);
    expect(synced.goals.map((goal) => goal.key)).toEqual(["gadget", "travel"]);
    expect(synced.goals[0].name).toBe("My laptop");
    expect(synced.goals[0].priority).toBe("low");
    expect(synced.planAccepted).toBe(false);
  });
});

describe("buildWorkspaceFromDraft", () => {
  it("builds a coherent workspace with a proposed plan by default", () => {
    const workspace = buildWorkspaceFromDraft(completeDraft(), { asOf: AS_OF, now: NOW });
    const capacity = calculateCapacity(workspace.profile, workspace.preferences);

    expect(workspace.meta.demo).toBe(true);
    expect(workspace.onboarding.completed).toBe(true);
    expect(workspace.goals).toHaveLength(2);
    expect(workspace.progressEvents).toHaveLength(1);
    expect(workspace.milestones).toHaveLength(8);
    expect(workspace.transactions).toEqual([]);
    expect(workspace.plans).toHaveLength(1);

    expect(workspace.plans[0].status).toBe("proposed");
    expect(workspace.plans[0].approvedAt).toBeNull();
    expect(capacity.capacityPaise).toBe(rupeesToPaise(20200));
    expect(workspace.plans[0].capacityPaise).toBe(capacity.capacityPaise);
    expect(
      workspace.plans[0].allocations.reduce((sum, allocation) => sum + allocation.contributionPaise, 0),
    ).toBe(workspace.plans[0].totalContributionPaise);
  });

  it("activates the plan only when explicitly approved", () => {
    const workspace = buildWorkspaceFromDraft(completeDraft(), {
      asOf: AS_OF,
      now: NOW,
      approved: true,
    });
    expect(workspace.plans[0].status).toBe("active");
    expect(workspace.plans[0].approvedAt).toBe(NOW);
  });

  it("uses a truthful fallback name and keeps the buffer adjustable", () => {
    const draft = { ...completeDraft(), displayName: "  " };
    const workspace = buildWorkspaceFromDraft(draft, { asOf: AS_OF, now: NOW });
    expect(workspace.user.displayName).toBe("You");
    expect(workspace.preferences.bufferPercent).toBe(10);
    expect(workspace.preferences.bufferMinimumPaise).toBe(rupeesToPaise(500));
  });
});
