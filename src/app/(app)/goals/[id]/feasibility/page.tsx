"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAppStore } from "@/store/app-store";
import { getCapacity, getGoalProgress } from "@/domain/selectors";
import { buildPlanProposal } from "@/domain/planning";
import {
  buildGoalAlternatives,
  checkGoalFeasibility,
  type GoalAlternative,
} from "@/domain/goals";
import { formatINR } from "@/domain/money";
import { formatLongDate, formatMonthYear, todayISO } from "@/domain/dates";
import { TopBar } from "@/components/navigation/top-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { EmptyState, InlineMessage } from "@/components/ui/states";

export default function GoalFeasibilityPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const data = useAppStore((state) => state.data);
  const updateGoal = useAppStore((state) => state.updateGoal);
  const proposePlan = useAppStore((state) => state.proposePlan);
  const showToast = useAppStore((state) => state.showToast);
  const [selected, setSelected] = useState<GoalAlternative["id"]>("keep_date");

  const progress = getGoalProgress(data, params.id);
  const capacity = getCapacity(data);
  const feasibility = useMemo(
    () =>
      progress
        ? checkGoalFeasibility(
            progress.goal,
            progress.savedPaise,
            capacity.capacityPaise,
          )
        : null,
    [progress, capacity.capacityPaise],
  );
  const alternatives = useMemo(
    () =>
      progress
        ? buildGoalAlternatives(progress.goal, progress.savedPaise, capacity.capacityPaise)
        : [],
    [progress, capacity.capacityPaise],
  );

  if (!progress || !feasibility) {
    return (
      <>
        <TopBar title="Feasibility" backHref="/goals" />
        <main className="px-4">
          <EmptyState
            icon="search_off"
            title="Goal not found"
            description="This goal may have been removed from the demo workspace."
          />
        </main>
      </>
    );
  }

  const chosen = alternatives.find((item) => item.id === selected) ?? alternatives[0];

  function applyOption() {
    if (!progress || !chosen) return;
    if (chosen.targetDate && chosen.targetDate !== progress.goal.targetDate) {
      const updated = updateGoal(progress.goal.id, {
        name: progress.goal.name,
        category: progress.goal.category,
        targetPaise: progress.goal.targetPaise,
        savedPaise: progress.savedPaise,
        targetDate: chosen.targetDate,
        priority: progress.goal.priority,
        note: progress.goal.note,
      });
      if (!updated) {
        showToast("The goal date could not be updated.", "error");
        return;
      }
    }
    const activeGoals = data.goals.filter((goal) => goal.status === "active");
    const base = buildPlanProposal({
      goals: activeGoals,
      events: data.progressEvents,
      capacity,
      asOf: todayISO(),
    });
    const otherTotal = base.allocations
      .filter((allocation) => allocation.goalId !== progress.goal.id)
      .reduce((total, allocation) => total + allocation.contributionPaise, 0);
    const availableForGoal = Math.max(0, capacity.capacityPaise - otherTotal);
    const applied = Math.min(chosen.monthlyPaise, availableForGoal);
    const capped = applied < chosen.monthlyPaise;
    const allocations = base.allocations.map((allocation) =>
      allocation.goalId === progress.goal.id
        ? {
            ...allocation,
            contributionPaise: applied,
            rationale: `Feasibility option: ${chosen.label}${capped ? " (capped to available capacity)" : ""}`,
          }
        : allocation,
    );
    const summary = `Reviewed from ${progress.goal.name} feasibility: ${chosen.label}. ${formatINR(
      applied,
    )}/month applied to this goal${capped ? " after protecting other goals' allocations" : ""}.`;
    const planId = proposePlan({ source: "user_adjustment", allocations, summary });
    if (!planId) {
      showToast("A plan proposal could not be created. Check your active goals.", "error");
      return;
    }
    showToast(
      capped
        ? "Option applied within available capacity. Review the cap before approving."
        : "Option applied to a new proposal. Review before approving.",
      capped ? "info" : "success",
    );
    router.push("/plan/proposal");
  }

  return (
    <>
      <TopBar
        title="Feasibility & plan"
        subtitle={progress.goal.name}
        backHref={`/goals/${progress.goal.id}`}
      />
      <main className="flex flex-col gap-4 px-4">
        <Card className="flex flex-col gap-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-label text-label-md text-on-surface-variant">Monthly requirement</p>
              <p className="font-display text-headline-md tabular-nums text-on-surface">
                {formatINR(feasibility.requiredMonthlyPaise)}/mo
              </p>
            </div>
            <Badge tone={feasibility.feasible ? "success" : "warning"} dot={false}>
              {feasibility.feasible ? "Fits capacity" : "Needs a trade-off"}
            </Badge>
          </div>
          <dl className="grid grid-cols-2 gap-3 border-t border-outline-variant/50 pt-3">
            <div>
              <dt className="font-body text-label-md text-on-surface-variant">Available capacity</dt>
              <dd className="font-title text-title-md tabular-nums text-on-surface">
                {formatINR(feasibility.capacityPaise)}
              </dd>
            </div>
            <div>
              <dt className="font-body text-label-md text-on-surface-variant">Extra needed</dt>
              <dd className="font-title text-title-md tabular-nums text-on-surface">
                {formatINR(feasibility.shortfallPaise)}
              </dd>
            </div>
            <div>
              <dt className="font-body text-label-md text-on-surface-variant">Current target</dt>
              <dd className="font-body text-body-md text-on-surface">
                {progress.goal.targetDate
                  ? formatLongDate(progress.goal.targetDate)
                  : "No date · 12-month assumption"}
              </dd>
            </div>
            <div>
              <dt className="font-body text-label-md text-on-surface-variant">At full capacity</dt>
              <dd className="font-body text-body-md text-on-surface">
                {feasibility.dateAtCapacity
                  ? formatMonthYear(feasibility.dateAtCapacity)
                  : "Not available"}
              </dd>
            </div>
          </dl>
        </Card>

        {feasibility.warnings.map((warning) => (
          <InlineMessage key={warning} tone="warning" icon="warning">
            {warning}
          </InlineMessage>
        ))}

        <section aria-label="Timeline options" className="flex flex-col gap-2">
          <h2 className="font-headline text-headline-md text-on-surface">Timeline options</h2>
          {alternatives.map((option) => {
            const active = option.id === selected;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setSelected(option.id)}
                aria-pressed={active}
                className={`rounded-lg border p-4 text-left transition-colors ${
                  active
                    ? "border-primary bg-secondary-container/50"
                    : "border-outline-variant bg-surface-lowest hover:bg-surface-low"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-title text-title-md text-on-surface">{option.label}</p>
                    <p className="mt-1 font-body text-body-md text-on-surface-variant">
                      {option.description}
                    </p>
                  </div>
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                      active ? "border-primary bg-primary text-on-primary" : "border-outline"
                    }`}
                  >
                    {active && <Icon name="check" size={13} />}
                  </span>
                </div>
                <p className="mt-2 font-label text-label-md text-on-surface-variant">
                  {option.tradeOff}
                </p>
              </button>
            );
          })}
        </section>

        <Card className="flex flex-col gap-3 p-4">
          <p className="font-body text-body-md text-on-surface">
            Choosing an option creates a draft plan for review. Your active plan does not change until
            you approve it on the next screen.
          </p>
          <Button fullWidth onClick={applyOption}>
            Apply option & review plan
          </Button>
          <Link
            href={`/goals/${progress.goal.id}/edit`}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-outline-variant bg-surface-lowest px-4 py-2.5 font-label text-label-lg text-on-surface"
          >
            Adjust goal details instead
          </Link>
        </Card>
      </main>
    </>
  );
}
