"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { GoalStatus } from "@/domain/types";
import { useAppStore } from "@/store/app-store";
import { getGoalProgress } from "@/domain/selectors";
import { formatINR } from "@/domain/money";
import { formatLongDate, formatMonthYear, formatShortDate } from "@/domain/dates";
import { TopBar } from "@/components/navigation/top-bar";
import { LogContributionSheet } from "@/components/goals/log-contribution-sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Sheet } from "@/components/ui/sheet";
import { EmptyState } from "@/components/ui/states";

const priorityLabel = { high: "High priority", medium: "Medium priority", low: "Low priority" };

const goalCategoryLabel: Record<string, string> = {
  emergency: "Safety net",
  gadget: "Work gear",
  travel: "Travel",
  education: "Education",
  purchase: "Purchase",
  home: "Home",
  custom: "Custom goal",
  other: "Goal",
};

export default function GoalDetailPage() {
  const params = useParams<{ id: string }>();
  const data = useAppStore((state) => state.data);
  const openCoach = useAppStore((state) => state.openCoach);
  const setGoalStatus = useAppStore((state) => state.setGoalStatus);
  const showToast = useAppStore((state) => state.showToast);
  const [logOpen, setLogOpen] = useState(false);
  const [statusAction, setStatusAction] = useState<GoalStatus | null>(null);

  const progress = getGoalProgress(data, params.id);

  if (!progress) {
    return (
      <>
        <TopBar title="Goal" backHref="/goals" />
        <main className="px-4">
          <EmptyState
            icon="search_off"
            title="Goal not found"
            description="This goal may have been removed from the demo workspace."
            action={
              <Link
                href="/goals"
                className="inline-flex min-h-11 items-center rounded-full bg-primary px-4 py-2.5 font-label text-label-lg text-on-primary"
              >
                Back to goals
              </Link>
            }
          />
        </main>
      </>
    );
  }

  const { goal, savedPaise, remainingPaise, percent, monthlyContributionPaise } = progress;
  const events = data.progressEvents
    .filter((event) => event.goalId === goal.id)
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <>
      <TopBar
        title={goal.name}
        subtitle={priorityLabel[goal.priority]}
        backHref="/goals"
        trailing={<Badge tone={progress.health === "needs_attention" ? "warning" : "success"}>{progress.health === "needs_attention" ? "Needs Attention" : progress.health === "paused" ? "Paused" : progress.health === "completed" ? "Completed" : "On Track"}</Badge>}
      />

      <main className="flex flex-col gap-4 px-4">
        <Card variant="elevated" className="flex flex-col gap-4 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-secondary-container text-on-secondary-container">
              <Icon name={goal.icon} size={22} />
            </span>
            <div className="min-w-0">
              <p className="font-body text-body-md text-on-surface-variant">
                {goalCategoryLabel[goal.category] ?? "Goal"}
              </p>
              <p className="font-label text-label-md text-on-surface-variant">
                {goal.targetDate ? `Target ${formatMonthYear(goal.targetDate)}` : "No target date"}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-baseline justify-between gap-2">
              <p className="font-display text-display-lg-mobile tabular-nums text-on-surface">
                {formatINR(savedPaise)}
              </p>
              <p className="font-body text-body-md tabular-nums text-on-surface-variant">
                of {formatINR(goal.targetPaise)} ({percent}%)
              </p>
            </div>
            <ProgressBar
              percent={percent}
              tone={progress.health === "needs_attention" ? "warning" : "primary"}
              label={`${goal.name} progress`}
            />
            <p className="font-body text-body-md text-on-surface-variant">
              {remainingPaise > 0
                ? `${formatINR(remainingPaise)} remaining`
                : "Target reached — mark the goal complete when you are ready."}
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-3 border-t border-outline-variant/50 pt-3">
            <div>
              <dt className="font-body text-label-md text-on-surface-variant">Monthly plan</dt>
              <dd className="font-title text-title-md tabular-nums text-on-surface">
                {monthlyContributionPaise ? `${formatINR(monthlyContributionPaise)}/mo` : "Not funded"}
              </dd>
            </div>
            <div>
              <dt className="font-body text-label-md text-on-surface-variant">Projected finish</dt>
              <dd className="font-title text-title-md tabular-nums text-on-surface">
                {progress.projectedCompletionDate
                  ? formatMonthYear(progress.projectedCompletionDate)
                  : "—"}
              </dd>
            </div>
          </dl>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setLogOpen(true)}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2.5 font-label text-label-lg text-on-primary"
            >
              <Icon name="add" size={18} />
              Add {monthlyContributionPaise ? formatINR(monthlyContributionPaise) : "contribution"}
            </button>
            <button
              type="button"
              onClick={openCoach}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-outline-variant bg-surface-lowest px-4 py-2.5 font-label text-label-lg text-on-surface"
            >
              Ask Coach
            </button>
          </div>
        </Card>

        <Card className="p-4">
          <p className="font-label text-label-md text-on-surface-variant">Manage goal</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <Link
              href={`/goals/${goal.id}/edit`}
              className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-outline-variant bg-surface-lowest px-3 py-2 font-label text-label-md text-on-surface"
            >
              <Icon name="edit" size={17} />
              Edit details
            </Link>
            <Link
              href={`/goals/${goal.id}/feasibility`}
              className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-outline-variant bg-surface-lowest px-3 py-2 font-label text-label-md text-on-surface"
            >
              <Icon name="analytics" size={17} />
              Check feasibility
            </Link>
            {goal.status === "active" ? (
              <button
                type="button"
                onClick={() => setStatusAction("paused")}
                className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-outline-variant bg-surface-lowest px-3 py-2 font-label text-label-md text-on-surface"
              >
                <Icon name="pause" size={17} />
                Pause goal
              </button>
            ) : goal.status === "paused" ? (
              <button
                type="button"
                onClick={() => setStatusAction("active")}
                className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-outline-variant bg-surface-lowest px-3 py-2 font-label text-label-md text-on-surface"
              >
                <Icon name="play_arrow" size={17} />
                Resume goal
              </button>
            ) : null}
            {goal.status !== "completed" && goal.status !== "archived" && (
              <button
                type="button"
                onClick={() => setStatusAction("completed")}
                className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-outline-variant bg-surface-lowest px-3 py-2 font-label text-label-md text-on-surface"
              >
                <Icon name="check_circle" size={17} />
                Mark complete
              </button>
            )}
          </div>
          <p className="mt-2 font-body text-label-md text-on-surface-variant">
            Pausing removes a goal from new plan calculations. Existing approved plan versions stay in
            history.
          </p>
        </Card>

        <section aria-label="Milestone journey" className="flex flex-col gap-3">
          <h2 className="font-headline text-headline-md text-on-surface">Milestone journey</h2>
          <Card className="p-4">
            <ol className="space-y-0">
              {progress.milestones.map((milestone, index) => {
                const reached = milestone.status === "reached";
                const last = index === progress.milestones.length - 1;
                return (
                  <li key={milestone.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                          reached
                            ? "bg-success-container text-on-success-container"
                            : "bg-surface-container text-on-surface-variant"
                        }`}
                      >
                        <Icon name={reached ? "check" : "flag"} size={16} />
                      </span>
                      {!last && <span className="my-1 h-8 w-px bg-outline-variant" aria-hidden="true" />}
                    </div>
                    <div className={`min-w-0 flex-1 ${last ? "" : "pb-2"}`}>
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-title text-title-md text-on-surface">
                          {milestone.label} · {milestone.targetPercent}%
                        </p>
                        {!reached && (
                          <span className="font-body text-label-md tabular-nums text-on-surface-variant">
                            {formatINR(Math.max(0, milestone.targetPaise - savedPaise))} away
                          </span>
                        )}
                      </div>
                      <p className="font-body text-body-md text-on-surface-variant">
                        {reached && milestone.achievedAt
                          ? `Reached ${formatShortDate(milestone.achievedAt)}`
                          : `${formatINR(milestone.targetPaise)} target`}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </Card>
        </section>

        <section aria-label="Contribution history" className="flex flex-col gap-3">
          <h2 className="font-headline text-headline-md text-on-surface">Contribution history</h2>
          {events.length === 0 ? (
            <EmptyState
              icon="savings"
              title="No contributions yet"
              description="Log money you set aside to start tracking progress."
            />
          ) : (
            <Card className="divide-y divide-outline-variant/40 px-4">
              {events.map((event) => (
                <div key={event.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-body text-body-lg text-on-surface">
                      {event.note ?? "Contribution"}
                    </p>
                    <p className="font-body text-label-md text-on-surface-variant">
                      {formatLongDate(event.date)} · {event.source === "manual" ? "Logged by you" : "Plan"}
                    </p>
                  </div>
                  <span className="shrink-0 font-title text-title-md tabular-nums text-success">
                    +{formatINR(event.amountPaise)}
                  </span>
                </div>
              ))}
            </Card>
          )}
        </section>

        {goal.note && (
          <Card className="p-4">
            <p className="font-label text-label-md text-on-surface-variant">Why this goal matters</p>
            <p className="mt-1 font-body text-body-md text-on-surface">{goal.note}</p>
          </Card>
        )}

        <Card variant="action" className="flex flex-col gap-2 p-4">
          <div className="flex items-center gap-2">
            <Icon name="auto_awesome" size={18} className="text-primary" />
            <p className="font-label text-label-md text-primary">Steady pace</p>
          </div>
          <p className="font-body text-body-md text-on-surface">
            {progress.projectedCompletionDate
              ? `At ${formatINR(monthlyContributionPaise ?? 0)}/month, this goal is projected for ${formatMonthYear(
                  progress.projectedCompletionDate,
                )}.`
              : "This goal is not currently funded by the active plan."}
          </p>
          <button
            type="button"
            onClick={openCoach}
            className="inline-flex w-fit items-center gap-1 font-label text-label-md text-primary hover:underline"
          >
            Explore options with Coach
            <Icon name="arrow_forward" size={14} />
          </button>
        </Card>
      </main>

      <LogContributionSheet
        open={logOpen}
        onClose={() => setLogOpen(false)}
        goalId={goal.id}
        goalName={goal.name}
        suggestedPaise={monthlyContributionPaise ?? undefined}
      />

      <Sheet
        open={statusAction !== null}
        onClose={() => setStatusAction(null)}
        title={
          statusAction === "paused"
            ? "Pause this goal?"
            : statusAction === "active"
              ? "Resume this goal?"
              : "Mark this goal complete?"
        }
        description={`This changes the status of ${goal.name}. Your logged contributions stay intact.`}
        footer={
          <div className="flex gap-2">
            <Button
              fullWidth
              variant={statusAction === "completed" ? "primary" : "secondary"}
              onClick={() => {
                if (!statusAction) return;
                setGoalStatus(goal.id, statusAction);
                showToast(
                  statusAction === "paused"
                    ? `${goal.name} paused`
                    : statusAction === "active"
                      ? `${goal.name} resumed`
                      : `${goal.name} marked complete`,
                );
                setStatusAction(null);
              }}
            >
              Confirm
            </Button>
            <Button variant="outline" onClick={() => setStatusAction(null)}>
              Cancel
            </Button>
          </div>
        }
      >
        <p className="font-body text-body-md text-on-surface-variant">
          {statusAction === "paused"
            ? "Artha will leave the approved plan unchanged, but this goal will not be included in new proposals until you resume it."
            : statusAction === "active"
              ? "This goal will be included again when a new plan is proposed. Review the plan separately if you want allocations changed."
              : "Use this when you have reached your target outside Artha. You can still view the goal and its history."}
        </p>
      </Sheet>
    </>
  );
}
