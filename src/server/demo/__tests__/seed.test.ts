import { describe, expect, it } from "vitest";
import { createSeedData, SCHEMA_VERSION } from "@/server/demo/seed";
import { calculateCapacity } from "@/domain/planning";
import { rupeesToPaise } from "@/domain/money";
import { monthKey } from "@/domain/dates";

const REFERENCE = "2026-11-22";

describe("demo seed", () => {
  const data = createSeedData(REFERENCE);

  it("is explicitly marked as a demo and completes onboarding", () => {
    expect(data.meta.demo).toBe(true);
    expect(data.schemaVersion).toBe(SCHEMA_VERSION);
    expect(data.onboarding.completed).toBe(true);
    expect(data.user.displayName.length).toBeGreaterThan(0);
  });

  it("has three active goals with internally consistent progress", () => {
    expect(data.goals).toHaveLength(3);
    expect(data.goals.every((goal) => goal.status === "active")).toBe(true);

    const saved = data.progressEvents.reduce<Record<string, number>>((accumulator, event) => {
      accumulator[event.goalId] = (accumulator[event.goalId] ?? 0) + event.amountPaise;
      return accumulator;
    }, {});

    expect(saved["goal-emergency"]).toBe(rupeesToPaise(48000));
    expect(saved["goal-macbook"]).toBe(rupeesToPaise(22000));
    expect(saved["goal-spiti"]).toBe(rupeesToPaise(9000));
  });

  it("never seeds a future progress event or transaction", () => {
    for (const event of data.progressEvents) {
      expect(event.date <= REFERENCE).toBe(true);
      expect(Number.isInteger(event.amountPaise)).toBe(true);
      expect(event.amountPaise).toBeGreaterThan(0);
    }
    for (const transaction of data.transactions) {
      expect(transaction.date <= REFERENCE).toBe(true);
      expect(Number.isInteger(transaction.amountPaise)).toBe(true);
      expect(transaction.amountPaise).toBeGreaterThan(0);
    }
  });

  it("records ₹8,500 of contributions in the reference month", () => {
    const total = data.progressEvents
      .filter((event) => monthKey(event.date) === "2026-11")
      .reduce((sum, event) => sum + event.amountPaise, 0);
    expect(total).toBe(rupeesToPaise(8500));
  });

  it("has one active plan whose allocations reconcile with capacity", () => {
    const active = data.plans.filter((plan) => plan.status === "active");
    expect(active).toHaveLength(1);
    const plan = active[0];

    const capacity = calculateCapacity(data.profile, data.preferences);
    expect(capacity.capacityPaise).toBe(rupeesToPaise(20200));
    expect(capacity.bufferPaise).toBe(rupeesToPaise(5800));

    expect(plan.version).toBe(1);
    expect(plan.totalContributionPaise).toBe(rupeesToPaise(16770));
    expect(plan.capacityPaise).toBe(capacity.capacityPaise);
    expect(plan.unallocatedPaise).toBe(rupeesToPaise(3430));
    expect(
      plan.allocations.reduce((sum, allocation) => sum + allocation.contributionPaise, 0),
    ).toBe(plan.totalContributionPaise);
    expect(plan.approvedAt).not.toBeNull();
  });

  it("marks the emergency fund's first-quarter milestone as reached", () => {
    const reached = data.milestones.filter((milestone) => milestone.status === "reached");
    expect(reached).toHaveLength(1);
    expect(reached[0].goalId).toBe("goal-emergency");
    expect(reached[0].targetPercent).toBe(25);
  });

  it("has three months of transactions and matching import metadata", () => {
    expect(data.transactions).toHaveLength(53);
    expect(data.importBatches).toHaveLength(3);

    for (const batch of data.importBatches) {
      const rows = data.transactions.filter(
        (transaction) => transaction.importBatchId === batch.id,
      ).length;
      expect(batch.status).toBe("imported");
      expect(batch.importedRows).toBe(rows);
      expect(batch.totalRows).toBe(rows);
      expect(batch.duplicateRows).toBe(0);
      expect(batch.periodStart).not.toBeNull();
      expect(batch.periodEnd).not.toBeNull();
    }
  });

  it("excludes transfers and income from spending totals", () => {
    const transfer = data.transactions.find((transaction) => transaction.category === "transfers");
    const income = data.transactions.find((transaction) => transaction.category === "income");
    expect(transfer?.direction).toBe("debit");
    expect(income?.direction).toBe("credit");
  });

  it("is deterministic for a fixed reference date", () => {
    const second = createSeedData(REFERENCE);
    expect(second.goals).toEqual(data.goals);
    expect(second.progressEvents).toEqual(data.progressEvents);
    expect(second.transactions).toEqual(data.transactions);
    expect(second.plans).toEqual(data.plans);
  });
});
