"use client";

import { useState } from "react";
import Link from "next/link";
import { useAppStore } from "@/store/app-store";
import {
  getAllGoalProgress,
  getActivePlan,
  getGoalTotals,
  getNextBestMove,
  getUpcomingMilestones,
} from "@/domain/selectors";
import { formatINR } from "@/domain/money";
import { formatMonthYear } from "@/domain/dates";
import { TopBar } from "@/components/navigation/top-bar";
import { GoalCard } from "@/components/goals/goal-card";
import { LogContributionSheet } from "@/components/goals/log-contribution-sheet";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { ProgressBar } from "@/components/ui/progress-bar";
import { EmptyState } from "@/components/ui/states";
import { Sheet } from "@/components/ui/sheet";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function HomePage() {
  const data = useAppStore((state) => state.data);
  const openCoach = useAppStore((state) => state.openCoach);

  const totals = getGoalTotals(data);
  const progress = getAllGoalProgress(data);
  const plan = getActivePlan(data);
  const nextMove = getNextBestMove(data);
  const upcoming = getUpcomingMilestones(data, 2);

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [logGoal, setLogGoal] = useState<{ id: string; name: string; amount: number } | null>(null);

  const reachedMilestones = data.milestones
    .filter((milestone) => milestone.status === "reached" && milestone.achievedAt)
    .sort((a, b) => (b.achievedAt ?? "").localeCompare(a.achievedAt ?? ""))
    .slice(0, 6);

  const insight = plan?.warnings[0]
    ? plan.warnings[0]
    : upcoming[0]
      ? `${upcoming[0].goalName} is ${formatINR(upcoming[0].amountAwayPaise)} away from its ${upcoming[0].milestone.targetPercent}% milestone. Keeping the monthly plan steady gets you there.`
      : "Every active goal is funded by your current plan. Nothing needs your attention right now.";

  return (
    <>
      <TopBar
        showAvatar
        subtitle={`${greeting()}, ${data.user.displayName.split(" ")[0]}`}
        title="Your goals"
        showNotifications
        onNotifications={() => setNotificationsOpen(true)}
      />

      <main className="flex flex-col gap-5 px-4">
        <section aria-label="Total savings summary">
          <Card variant="filled" className="flex flex-col gap-4 rounded-xl p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <span className="font-label text-label-md text-accent">Total saved toward goals</span>
                <p className="font-display text-display-lg-mobile tabular-nums text-on-primary">
                  {formatINR(totals.savedPaise)}
                </p>
                <p className="font-body text-body-md tabular-nums text-on-primary-container">
                  of {formatINR(totals.targetPaise)} across {totals.activeCount}{" "}
                  {totals.activeCount === 1 ? "goal" : "goals"}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-accent/30 bg-primary-container">
                <span className="font-label text-label-md tabular-nums text-accent-soft">
                  {totals.percent}%
                </span>
              </div>
            </div>

            <ProgressBar
              percent={totals.percent}
              tone="accent"
              trackClassName="bg-primary-container"
              label="Total goal progress"
            />

            <div className="flex items-center justify-between gap-2 border-t border-on-primary/10 pt-3">
              <span className="font-label text-label-sm tabular-nums text-on-primary-container">
                {totals.addedThisMonthPaise > 0
                  ? `+${formatINR(totals.addedThisMonthPaise)} added this month`
                  : "No contributions logged this month yet"}
              </span>
              {totals.streakMonths > 0 && (
                <span className="inline-flex items-center gap-1 font-label text-label-sm text-accent-soft">
                  <Icon name="trending_up" size={14} />
                  {totals.streakMonths}-month streak
                </span>
              )}
            </div>
          </Card>
        </section>

        <section aria-label="Next best move">
          <Card variant="action" className="flex flex-col gap-3 p-4">
            <header className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-on-primary">
                <Icon name="auto_awesome" size={18} filled />
              </span>
              <div>
                <h2 className="font-title text-title-md text-on-surface">Next best move</h2>
                <p className="font-body text-body-md text-on-surface-variant">
                  {plan
                    ? `${formatINR(plan.unallocatedPaise)} flexible left this month`
                    : "No active plan yet"}
                </p>
              </div>
            </header>

            {nextMove ? (
              <>
                <p className="font-body text-body-md text-on-surface">{nextMove.message}</p>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() =>
                      setLogGoal({
                        id: nextMove.goalId,
                        name: nextMove.goalName,
                        amount: nextMove.amountPaise,
                      })
                    }
                    className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-primary px-4 py-2.5 font-label text-label-lg text-on-primary transition-colors hover:bg-primary-container"
                  >
                    Log {formatINR(nextMove.amountPaise)}
                  </button>
                  <button
                    type="button"
                    onClick={openCoach}
                    className="inline-flex min-h-11 items-center justify-center rounded-full bg-secondary-container px-4 py-2.5 font-label text-label-lg text-on-secondary-container transition-colors hover:bg-accent-soft"
                  >
                    Ask Coach
                  </button>
                </div>
              </>
            ) : (
              <p className="font-body text-body-md text-on-surface">
                You&apos;re all caught up. Add another goal to keep building momentum.
              </p>
            )}
          </Card>
        </section>

        <section aria-label="Your goals list" className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-headline text-headline-md text-on-surface">Active &amp; recent goals</h2>
            <Link
              href="/goals"
              className="inline-flex items-center gap-1 font-label text-label-md text-primary hover:underline"
            >
              <span>All goals</span>
              <Icon name="arrow_forward" size={14} />
            </Link>
          </div>

          {progress.length === 0 ? (
            <EmptyState
              icon="flag"
              title="No goals yet"
              description="Create a goal to give your savings a direction."
            />
          ) : (
            <div className="flex flex-col gap-3">
              {progress.map((item) => (
                <GoalCard key={item.goal.id} progress={item} />
              ))}
            </div>
          )}
        </section>

        <section aria-label="Upcoming milestones" className="flex flex-col gap-3">
          <h2 className="font-headline text-headline-md text-on-surface">Upcoming milestones</h2>
          {upcoming.length === 0 ? (
            <EmptyState
              icon="emoji_events"
              title="No milestones in view"
              description="Milestones appear as your active goals make progress."
            />
          ) : (
            <Card className="divide-y divide-outline-variant/40 px-4">
              {upcoming.map((item) => (
                <Link
                  key={`${item.goalId}-${item.milestone.id}`}
                  href={`/goals/${item.goalId}`}
                  className="flex items-center gap-3 py-3"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft text-on-accent">
                    <Icon name="flag" size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-title text-title-md text-on-surface">
                      {item.milestone.label} · {item.milestone.targetPercent}%
                    </p>
                    <p className="truncate font-body text-body-md text-on-surface-variant">
                      {item.goalName} · {formatINR(item.amountAwayPaise)} away
                    </p>
                  </div>
                  <Icon name="chevron_right" size={18} className="text-outline" />
                </Link>
              ))}
            </Card>
          )}
        </section>

        <section aria-label="Coach insight" className="flex flex-col gap-2">
          <Card className="flex flex-col gap-2 p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Icon name="auto_awesome" size={18} className="text-primary" />
                <p className="font-label text-label-md text-primary">Coach insight</p>
              </div>
              <Badge tone="neutral" dot={false}>
                Rule-based
              </Badge>
            </div>
            <p className="font-body text-body-md text-on-surface">{insight}</p>
            <button
              type="button"
              onClick={openCoach}
              className="inline-flex w-fit items-center gap-1 font-label text-label-md text-primary hover:underline"
            >
              Review options with Coach
              <Icon name="arrow_forward" size={14} />
            </button>
          </Card>
        </section>
      </main>

      <LogContributionSheet
        open={Boolean(logGoal)}
        onClose={() => setLogGoal(null)}
        goalId={logGoal?.id ?? null}
        goalName={logGoal?.name ?? ""}
        suggestedPaise={logGoal?.amount}
      />

      <Sheet
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        title="Notifications"
        description="Milestones you have already reached. Reminders are not delivered in this demo."
      >
        {reachedMilestones.length === 0 ? (
          <EmptyState
            icon="notifications"
            title="Nothing yet"
            description="Milestone celebrations will appear here as you log progress."
          />
        ) : (
          <ul className="space-y-3">
            {reachedMilestones.map((milestone) => {
              const goal = data.goals.find((candidate) => candidate.id === milestone.goalId);
              return (
                <li key={milestone.id} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-success-container text-on-success-container">
                    <Icon name="check" size={16} />
                  </span>
                  <div>
                    <p className="font-title text-title-md text-on-surface">
                      {milestone.label} reached
                    </p>
                    <p className="font-body text-body-md text-on-surface-variant">
                      {goal?.name} · {milestone.targetPercent}%
                      {milestone.achievedAt ? ` · ${formatMonthYear(milestone.achievedAt)}` : ""}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-4 rounded-lg bg-surface-low p-3 font-body text-body-md text-on-surface-variant">
          <Badge tone="neutral" className="mr-2 align-middle">
            Demo
          </Badge>
          In-app only. Email and push delivery are not part of this prototype.
        </p>
      </Sheet>
    </>
  );
}
