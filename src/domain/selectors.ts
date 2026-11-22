import { getCategory } from "./categories";
import {
  formatMonthYear,
  monthKey,
  monthKeyLabel,
  monthKeyShortLabel,
  recentMonthKeys,
  todayISO,
} from "./dates";
import { ceilToRupee, percentOf, sumPaise } from "./money";
import {
  buildGoalProgress,
  calculateCapacity,
  type CapacityBreakdown,
} from "./planning";
import type {
  AppData,
  CategoryId,
  FinancialPlan,
  GoalProgress,
  ISODate,
  Milestone,
  Paise,
  Transaction,
} from "./types";

export function getActivePlan(data: AppData): FinancialPlan | null {
  return data.plans.find((plan) => plan.status === "active") ?? null;
}

export function getProposedPlan(data: AppData): FinancialPlan | null {
  return (
    [...data.plans]
      .filter((plan) => plan.status === "proposed")
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null
  );
}

export function getCapacity(data: AppData): CapacityBreakdown {
  return calculateCapacity(data.profile, data.preferences);
}

export function getAllGoalProgress(data: AppData, asOf: ISODate = todayISO()): GoalProgress[] {
  const plan = getActivePlan(data);
  return data.goals
    .filter((goal) => goal.status !== "archived")
    .map((goal) => {
      const allocation = plan?.allocations.find((candidate) => candidate.goalId === goal.id);
      return buildGoalProgress(goal, data.progressEvents, data.milestones, allocation, asOf);
    })
    .sort((a, b) => {
      const statusRank = (progress: GoalProgress) =>
        progress.goal.status === "completed" ? 1 : 0;
      const rankDelta = statusRank(a) - statusRank(b);
      if (rankDelta !== 0) return rankDelta;
      const priority = { high: 0, medium: 1, low: 2 };
      return priority[a.goal.priority] - priority[b.goal.priority];
    });
}

export function getGoalProgress(
  data: AppData,
  goalId: string,
  asOf: ISODate = todayISO(),
): GoalProgress | null {
  return getAllGoalProgress(data, asOf).find((progress) => progress.goal.id === goalId) ?? null;
}

export interface GoalTotals {
  savedPaise: Paise;
  targetPaise: Paise;
  percent: number;
  activeCount: number;
  completedCount: number;
  addedThisMonthPaise: Paise;
  streakMonths: number;
}

export function getGoalTotals(data: AppData, asOf: ISODate = todayISO()): GoalTotals {
  const activeGoals = data.goals.filter(
    (goal) => goal.status === "active" || goal.status === "paused",
  );
  const savedPaise = sumPaise(
    data.progressEvents
      .filter((event) => activeGoals.some((goal) => goal.id === event.goalId))
      .map((event) => event.amountPaise),
  );
  const targetPaise = sumPaise(activeGoals.map((goal) => goal.targetPaise));

  const currentMonth = monthKey(asOf);
  const addedThisMonthPaise = sumPaise(
    data.progressEvents
      .filter((event) => monthKey(event.date) === currentMonth)
      .map((event) => event.amountPaise),
  );

  const monthsWithContributions = new Set(data.progressEvents.map((event) => monthKey(event.date)));
  let streakMonths = 0;
  for (const key of recentMonthKeys(24, asOf)) {
    if (monthsWithContributions.has(key)) streakMonths += 1;
    else break;
  }

  return {
    savedPaise,
    targetPaise,
    percent: percentOf(savedPaise, targetPaise),
    activeCount: activeGoals.filter((goal) => goal.status === "active").length,
    completedCount: data.goals.filter((goal) => goal.status === "completed").length,
    addedThisMonthPaise,
    streakMonths,
  };
}

export interface UpcomingMilestone {
  goalId: string;
  goalName: string;
  milestone: Milestone;
  amountAwayPaise: Paise;
}

export function getUpcomingMilestones(
  data: AppData,
  limit = 3,
  asOf: ISODate = todayISO(),
): UpcomingMilestone[] {
  const progress = getAllGoalProgress(data, asOf).filter(
    (item) => item.goal.status === "active" && item.nextMilestone,
  );
  return progress
    .map((item) => ({
      goalId: item.goal.id,
      goalName: item.goal.name,
      milestone: item.nextMilestone!,
      amountAwayPaise: Math.max(0, item.nextMilestone!.targetPaise - item.savedPaise),
    }))
    .sort((a, b) => a.amountAwayPaise - b.amountAwayPaise)
    .slice(0, limit);
}

export interface NextBestMove {
  goalId: string;
  goalName: string;
  title: string;
  message: string;
  amountPaise: Paise;
  targetDate: ISODate | null;
}

export function getNextBestMove(
  data: AppData,
  asOf: ISODate = todayISO(),
): NextBestMove | null {
  const upcoming = getUpcomingMilestones(data, 5, asOf);
  if (upcoming.length === 0) return null;
  const nearest = upcoming[0];
  const progress = getGoalProgress(data, nearest.goalId, asOf);
  if (!progress) return null;

  const amount = ceilToRupee(nearest.amountAwayPaise);
  return {
    goalId: nearest.goalId,
    goalName: nearest.goalName,
    title: `Next best move · ${nearest.goalName}`,
    message: `Add ${new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount / 100)} to reach your ${nearest.milestone.targetPercent}% milestone.`,
    amountPaise: amount,
    targetDate: progress.goal.targetDate,
  };
}

export interface CategoryTotal {
  categoryId: CategoryId;
  label: string;
  color: string;
  icon: string;
  totalPaise: Paise;
  count: number;
  percent: number;
}

export interface SpendingSummary {
  monthKey: string;
  monthLabel: string;
  totalPaise: Paise;
  previousTotalPaise: Paise;
  changePercent: number | null;
  transactionCount: number;
  categoryTotals: CategoryTotal[];
  creditsPaise: Paise;
  transfersPaise: Paise;
}

export function getSpendingSummary(data: AppData, key: string): SpendingSummary {
  const monthTransactions = data.transactions.filter(
    (transaction) => monthKey(transaction.date) === key,
  );
  const debits = monthTransactions.filter(
    (transaction) =>
      transaction.direction === "debit" && getCategory(transaction.category).spending,
  );
  const totalPaise = sumPaise(debits.map((transaction) => transaction.amountPaise));

  const previousKey = recentMonthKeys(2, `${key}-01`)[1] ?? key;
  const previousTotalPaise = sumPaise(
    data.transactions
      .filter(
        (transaction) =>
          monthKey(transaction.date) === previousKey &&
          transaction.direction === "debit" &&
          getCategory(transaction.category).spending,
      )
      .map((transaction) => transaction.amountPaise),
  );

  const byCategory = new Map<CategoryId, { totalPaise: Paise; count: number }>();
  for (const transaction of debits) {
    const existing = byCategory.get(transaction.category) ?? { totalPaise: 0, count: 0 };
    byCategory.set(transaction.category, {
      totalPaise: existing.totalPaise + transaction.amountPaise,
      count: existing.count + 1,
    });
  }

  const categoryTotals: CategoryTotal[] = [...byCategory.entries()]
    .map(([categoryId, value]) => {
      const meta = getCategory(categoryId);
      return {
        categoryId,
        label: meta.label,
        color: meta.color,
        icon: meta.icon,
        totalPaise: value.totalPaise,
        count: value.count,
        percent: percentOf(value.totalPaise, totalPaise),
      };
    })
    .sort((a, b) => b.totalPaise - a.totalPaise);

  return {
    monthKey: key,
    monthLabel: monthKeyLabel(key),
    totalPaise,
    previousTotalPaise,
    changePercent:
      previousTotalPaise > 0
        ? Math.round(((totalPaise - previousTotalPaise) / previousTotalPaise) * 100)
        : null,
    transactionCount: debits.length,
    categoryTotals,
    creditsPaise: sumPaise(
      monthTransactions
        .filter((transaction) => transaction.direction === "credit")
        .map((transaction) => transaction.amountPaise),
    ),
    transfersPaise: sumPaise(
      monthTransactions
        .filter((transaction) => transaction.category === "transfers")
        .map((transaction) => transaction.amountPaise),
    ),
  };
}

export interface TrendPoint {
  monthKey: string;
  label: string;
  totalPaise: Paise;
}

export function getMonthlyTrend(data: AppData, count = 6, asOf: ISODate = todayISO()): TrendPoint[] {
  const keys = recentMonthKeys(count, asOf).reverse();
  return keys.map((key) => {
    const totalPaise = sumPaise(
      data.transactions
        .filter(
          (transaction) =>
            monthKey(transaction.date) === key &&
            transaction.direction === "debit" &&
            getCategory(transaction.category).spending,
        )
        .map((transaction) => transaction.amountPaise),
    );
    return { monthKey: key, label: monthKeyShortLabel(key), totalPaise };
  });
}

export function getRecentTransactions(data: AppData, limit = 5): Transaction[] {
  return [...data.transactions]
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

export function getCategoryTransactions(
  data: AppData,
  categoryId: CategoryId,
  key?: string,
): Transaction[] {
  return [...data.transactions]
    .filter(
      (transaction) =>
        transaction.category === categoryId &&
        transaction.direction === "debit" &&
        (key ? monthKey(transaction.date) === key : true),
    )
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function describePlanDate(iso: ISODate | null): string {
  return iso ? formatMonthYear(iso) : "Not projected";
}

export function totalMonthlyContribution(plan: FinancialPlan | null): Paise {
  return plan?.totalContributionPaise ?? 0;
}
