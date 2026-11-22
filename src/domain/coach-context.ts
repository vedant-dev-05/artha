import { monthKey, todayISO } from "./dates";
import { formatINR } from "./money";
import {
  getActivePlan,
  getCapacity,
  getAllGoalProgress,
  getSpendingSummary,
} from "./selectors";
import type { AppData } from "./types";

/** Aggregated, privacy-filtered context sent to the Coach route. */
export interface CoachContext {
  demo: true;
  screen: string;
  capacity: {
    incomePaise: number;
    essentialsPaise: number;
    commitmentsPaise: number;
    protectedPaise: number;
    bufferPaise: number;
    bufferPercent: number;
    capacityPaise: number;
  };
  preferences: {
    tone: string;
    savingsFlexibility: string;
    proactiveSuggestions: boolean;
    personalisedInsights: boolean;
  };
  goals: Array<{
    id: string;
    name: string;
    category: string;
    priority: string;
    status: string;
    targetPaise: number;
    savedPaise: number;
    targetDate: string | null;
    monthlyPaise: number | null;
    projectedDate: string | null;
    percent: number;
  }>;
  activePlan: {
    version: number | null;
    totalPaise: number;
    unallocatedPaise: number;
    summary: string | null;
    allocations: Array<{ goalId: string; contributionPaise: number }>;
  };
  spending: {
    monthKey: string;
    totalPaise: number;
    transactionCount: number;
    categoryTotals: Array<{ label: string; totalPaise: number; count: number }>;
    provenance: string;
  };
  /** Preformatted INR strings so the model never has to convert paise itself. */
  display: {
    income: string;
    essentials: string;
    buffer: string;
    capacity: string;
    planTotal: string;
    unallocated: string;
    spending: string;
    goals: Array<{ id: string; target: string; saved: string; monthly: string }>;
  };
}

function clean(value: string, max: number): string {
  return value.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max);
}

/**
 * Build only aggregate context. Raw transaction descriptions, email, phone,
 * import filenames and free-text notes are deliberately excluded.
 */
export function buildCoachContext(data: AppData, screen: string = "coach"): CoachContext {
  const capacity = getCapacity(data);
  const plan = getActivePlan(data);
  const progress = getAllGoalProgress(data);
  const spending = getSpendingSummary(data, monthKey(todayISO()));
  const imported = data.transactions.filter((transaction) => transaction.source === "csv_import").length;
  const manual = data.transactions.length - imported;

  return {
    demo: true,
    screen: clean(screen, 40),
    capacity: {
      incomePaise: capacity.incomePaise,
      essentialsPaise: capacity.essentialsPaise,
      commitmentsPaise: capacity.commitmentsPaise,
      protectedPaise: capacity.protectedPaise,
      bufferPaise: capacity.bufferPaise,
      bufferPercent: capacity.bufferPercent,
      capacityPaise: capacity.capacityPaise,
    },
    preferences: {
      tone: data.preferences.companionTone,
      savingsFlexibility: data.preferences.savingsFlexibility,
      proactiveSuggestions: data.preferences.proactiveSuggestions,
      personalisedInsights: data.preferences.personalisedInsights,
    },
    goals: progress.map((item) => ({
      id: item.goal.id,
      name: clean(item.goal.name, 60),
      category: item.goal.category,
      priority: item.goal.priority,
      status: item.goal.status,
      targetPaise: item.goal.targetPaise,
      savedPaise: item.savedPaise,
      targetDate: item.goal.targetDate,
      monthlyPaise: item.monthlyContributionPaise,
      projectedDate: item.projectedCompletionDate,
      percent: item.percent,
    })),
    activePlan: {
      version: plan?.version ?? null,
      totalPaise: plan?.totalContributionPaise ?? 0,
      unallocatedPaise: plan?.unallocatedPaise ?? 0,
      summary: plan ? clean(plan.summary, 300) : null,
      allocations:
        plan?.allocations.map((allocation) => ({
          goalId: allocation.goalId,
          contributionPaise: allocation.contributionPaise,
        })) ?? [],
    },
    spending: {
      monthKey: spending.monthKey,
      totalPaise: spending.totalPaise,
      transactionCount: spending.transactionCount,
      categoryTotals: spending.categoryTotals.slice(0, 8).map((item) => ({
        label: clean(item.label, 30),
        totalPaise: item.totalPaise,
        count: item.count,
      })),
      provenance: `${imported} imported · ${manual} manual estimates`,
    },
    display: {
      income: formatINR(capacity.incomePaise),
      essentials: formatINR(capacity.essentialsPaise),
      buffer: formatINR(capacity.bufferPaise),
      capacity: formatINR(capacity.capacityPaise),
      planTotal: formatINR(plan?.totalContributionPaise ?? 0),
      unallocated: formatINR(plan?.unallocatedPaise ?? 0),
      spending: formatINR(spending.totalPaise),
      goals: progress.map((item) => ({
        id: item.goal.id,
        target: formatINR(item.goal.targetPaise),
        saved: formatINR(item.savedPaise),
        monthly:
          item.monthlyContributionPaise === null
            ? "Not set"
            : formatINR(item.monthlyContributionPaise),
      })),
    },
  };
}
