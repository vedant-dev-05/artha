import { describe, expect, it, vi } from "vitest";

// The persisted store needs localStorage even though hydration is skipped.
const memory = new Map<string, string>();
vi.stubGlobal("localStorage", {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => {
    memory.set(key, value);
  },
  removeItem: (key: string) => {
    memory.delete(key);
  },
});

const { useAppStore } = await import("@/store/app-store");
const { createSeedData } = await import("@/server/demo/seed");
const { createEmptyDraft, syncGoalsWithAspirations } = await import("@/domain/onboarding");
const { addMonthsISO, todayISO } = await import("@/domain/dates");
const { buildCoachContext } = await import("@/domain/coach-context");

function resetToSeed() {
  useAppStore.setState({
    data: createSeedData(),
    onboardingDraft: null,
    entryChoice: null,
    coachOpen: false,
    toast: null,
  });
}

function draftWithoutApproval() {
  return syncGoalsWithAspirations(
    {
      ...createEmptyDraft(),
      displayName: "Test User",
      aspirations: ["emergency"],
      incomeAmountPaise: 5_800_000,
      essentialExpensesPaise: 2_600_000,
    },
    "2026-11-22",
  );
}

describe("onboarding workspace safety", () => {
  it("keeps the working workspace intact while setup is in progress or exited", () => {
    resetToSeed();
    const original = useAppStore.getState().data;
    const originalGoals = original.goals.map((goal) => goal.id);
    const originalPlanId = original.plans[0]?.id;

    useAppStore.getState().startOnboarding();
    const during = useAppStore.getState();
    expect(during.onboardingDraft).not.toBeNull();
    expect(during.data.goals.map((goal) => goal.id)).toEqual(originalGoals);
    expect(during.data.plans[0]?.id).toBe(originalPlanId);
    expect(during.data.transactions).toHaveLength(original.transactions.length);

    useAppStore.getState().cancelOnboarding();
    const after = useAppStore.getState();
    expect(after.onboardingDraft).toBeNull();
    expect(after.data.goals.map((goal) => goal.id)).toEqual(originalGoals);
  });

  it("does not swap workspaces when completion is attempted without approval", () => {
    resetToSeed();
    const seedPlanId = useAppStore.getState().data.plans[0]?.id;
    useAppStore.setState({ onboardingDraft: draftWithoutApproval() });

    useAppStore.getState().completeOnboarding();

    const after = useAppStore.getState();
    expect(after.data.plans[0]?.id).toBe(seedPlanId);
    expect(after.onboardingDraft).not.toBeNull();
  });

  it("swaps the workspace only after the plan is explicitly approved", () => {
    resetToSeed();
    const seedPlanId = useAppStore.getState().data.plans[0]?.id;
    useAppStore.setState({ onboardingDraft: draftWithoutApproval() });

    useAppStore.getState().acceptOnboardingPlan();
    useAppStore.getState().completeOnboarding();

    const after = useAppStore.getState();
    expect(after.data.plans[0]?.id).not.toBe(seedPlanId);
    expect(after.data.plans[0]?.status).toBe("active");
    expect(after.data.goals).toHaveLength(1);
    expect(after.onboardingDraft).toBeNull();
    expect(after.entryChoice).toBe("demo");
  });
});

describe("first-visit entry choice", () => {
  it("starts unset so the root route opens the onboarding welcome screen", () => {
    resetToSeed();
    expect(useAppStore.getState().entryChoice).toBeNull();
  });

  it("persists whichever entry option the visitor chooses", () => {
    resetToSeed();
    useAppStore.getState().setEntryChoice("onboarding");
    expect(useAppStore.getState().entryChoice).toBe("onboarding");
    useAppStore.getState().setEntryChoice("demo");
    expect(useAppStore.getState().entryChoice).toBe("demo");
  });

  it("marks the demo workspace as chosen when demo data is reset", () => {
    resetToSeed();
    useAppStore.getState().resetDemo();
    expect(useAppStore.getState().entryChoice).toBe("demo");
  });

  it("logs out without deleting the saved demo workspace", () => {
    resetToSeed();
    const goalIds = useAppStore.getState().data.goals.map((goal) => goal.id);
    useAppStore.getState().setEntryChoice("demo");
    useAppStore.getState().startOnboarding();
    useAppStore.getState().logout();

    const after = useAppStore.getState();
    expect(after.entryChoice).toBeNull();
    expect(after.onboardingDraft).toBeNull();
    expect(after.coachOpen).toBe(false);
    expect(after.data.goals.map((goal) => goal.id)).toEqual(goalIds);
  });
});

describe("goal lifecycle", () => {
  it("creates a goal with milestones and a starting contribution", () => {
    resetToSeed();
    const before = useAppStore.getState().data;
    const id = useAppStore.getState().createGoal({
      name: "New laptop",
      category: "gadget",
      targetPaise: 1_200_000_0,
      savedPaise: 600_000,
      targetDate: addMonthsISO(todayISO(), 12),
      priority: "high",
      note: "Work upgrade",
    });

    expect(id).toBeTruthy();
    const after = useAppStore.getState().data;
    expect(after.goals).toHaveLength(before.goals.length + 1);
    expect(after.progressEvents.filter((event) => event.goalId === id)).toHaveLength(1);
    expect(after.milestones.filter((milestone) => milestone.goalId === id)).toHaveLength(4);
  });

  it("updates goal details and status without touching logged progress", () => {
    resetToSeed();
    const goal = useAppStore.getState().data.goals[0]!;
    const eventsBefore = useAppStore
      .getState()
      .data.progressEvents.filter((event) => event.goalId === goal.id);
    const saved = eventsBefore.reduce((total, event) => total + event.amountPaise, 0);

    const updated = useAppStore.getState().updateGoal(goal.id, {
      name: "Renamed goal",
      category: goal.category,
      targetPaise: goal.targetPaise + 100_000,
      savedPaise: saved,
      targetDate: goal.targetDate,
      priority: goal.priority,
      note: goal.note,
    });
    expect(updated).toBe(true);
    expect(useAppStore.getState().data.goals.find((item) => item.id === goal.id)?.name).toBe(
      "Renamed goal",
    );

    useAppStore.getState().setGoalStatus(goal.id, "paused");
    expect(useAppStore.getState().data.goals.find((item) => item.id === goal.id)?.status).toBe(
      "paused",
    );
    expect(
      useAppStore.getState().data.progressEvents.filter((event) => event.goalId === goal.id),
    ).toHaveLength(eventsBefore.length);
  });
});

describe("plan approval workflow", () => {
  it("keeps proposals inactive until approval and preserves history", () => {
    resetToSeed();
    const originalActiveId = useAppStore.getState().data.plans.find((plan) => plan.status === "active")?.id;
    const proposalId = useAppStore.getState().proposePlan({ source: "companion_proposal" });
    expect(proposalId).toBeTruthy();

    let state = useAppStore.getState();
    expect(state.data.plans.find((plan) => plan.id === proposalId)?.status).toBe("proposed");
    expect(state.data.plans.find((plan) => plan.id === originalActiveId)?.status).toBe("active");

    expect(useAppStore.getState().approvePlan(proposalId!)).toBe(true);
    state = useAppStore.getState();
    expect(state.data.plans.find((plan) => plan.id === proposalId)?.status).toBe("active");
    expect(state.data.plans.find((plan) => plan.id === originalActiveId)?.status).toBe("superseded");

    const secondId = useAppStore.getState().proposePlan({ source: "user_adjustment" });
    expect(useAppStore.getState().rejectPlan(secondId!)).toBe(true);
    expect(useAppStore.getState().data.plans.find((plan) => plan.id === secondId)?.status).toBe(
      "rejected",
    );
    expect(
      useAppStore.getState().data.plans.find((plan) => plan.id === proposalId)?.status,
    ).toBe("active");
  });
});

describe("imported data management", () => {
  it("removes only transactions linked to the chosen batch", () => {
    resetToSeed();
    const data = useAppStore.getState().data;
    const batch = data.importBatches[0]!;
    const linked = data.transactions.filter((transaction) => transaction.importBatchId === batch.id);
    const manualCount = data.transactions.filter((transaction) => transaction.source === "manual").length;

    const removed = useAppStore.getState().deleteImportBatch(batch.id);
    const after = useAppStore.getState().data;
    expect(removed).toBe(linked.length);
    expect(after.importBatches.some((item) => item.id === batch.id)).toBe(false);
    expect(after.transactions.some((transaction) => transaction.importBatchId === batch.id)).toBe(false);
    expect(after.transactions.filter((transaction) => transaction.source === "manual")).toHaveLength(
      manualCount,
    );
  });
});

describe("Coach context privacy", () => {
  it("excludes raw transaction descriptions and personal contact details", () => {
    resetToSeed();
    const data = useAppStore.getState().data;
    const context = buildCoachContext(data, "home");
    const serialized = JSON.stringify(context);

    expect(serialized).not.toContain(data.user.email);
    if (data.user.phone) expect(serialized).not.toContain(data.user.phone);
    expect(serialized).not.toContain(data.transactions[0]!.description);
    expect(serialized).toContain("capacityPaise");
    expect(context.display.capacity).toBe("₹20,200");
    expect(context.display.buffer).toBe("₹5,800");
  });
});
