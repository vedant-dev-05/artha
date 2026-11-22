import { describe, expect, it } from "vitest";
import { restoreINR, toModelContext } from "@/domain/coach-display";
import type { CoachContextPayload } from "@/domain/coach-contract";

const context = {
  demo: true,
  screen: "coach",
  capacity: {
    incomePaise: 5800000,
    essentialsPaise: 2600000,
    commitmentsPaise: 0,
    protectedPaise: 600000,
    bufferPaise: 580000,
    bufferPercent: 10,
    capacityPaise: 2020000,
  },
  preferences: {
    tone: "warm",
    savingsFlexibility: "balanced",
    proactiveSuggestions: true,
    personalisedInsights: true,
  },
  goals: [],
  activePlan: { version: 1, totalPaise: 800000, unallocatedPaise: 343000, summary: "Plan v1", allocations: [] },
  spending: {
    monthKey: "2026-11",
    totalPaise: 10000000,
    transactionCount: 20,
    categoryTotals: [],
    provenance: "demo",
  },
  display: {
    income: "₹58,000",
    essentials: "₹26,000",
    buffer: "₹5,800",
    capacity: "₹20,200",
    planTotal: "₹8,000",
    unallocated: "₹3,430",
    spending: "₹1,00,000",
    goals: [],
  },
} satisfies CoachContextPayload;

describe("Coach currency formatting", () => {
  it("replaces the ₹ glyph with an ASCII marker in the model context", () => {
    const modelContext = toModelContext(context);
    expect(modelContext.display.unallocated).toBe("INR 3,430");
    expect(JSON.stringify(modelContext)).not.toContain("₹");
    expect(modelContext.capacity.capacityPaise).toBe(2020000);
  });

  it("restores the marker to ₹ in model replies", () => {
    expect(restoreINR("You have INR 3,430 left and a INR 1,20,000 target.")).toBe(
      "You have ₹3,430 left and a ₹1,20,000 target.",
    );
  });
});
