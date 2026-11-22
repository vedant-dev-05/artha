"use client";

import { useAppStore } from "@/store/app-store";
import { getAllGoalProgress, getActivePlan, getCapacity } from "@/domain/selectors";
import { formatINR } from "@/domain/money";
import { TopBar } from "@/components/navigation/top-bar";
import { AllocationRow } from "@/components/plan/allocation-row";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { ProgressBar } from "@/components/ui/progress-bar";
import { EmptyState } from "@/components/ui/states";

export default function PlanAllocationsPage() {
  const data = useAppStore((state) => state.data);
  const openCoach = useAppStore((state) => state.openCoach);
  const plan = getActivePlan(data);
  const capacity = getCapacity(data);
  const progress = getAllGoalProgress(data);

  if (!plan) {
    return (
      <>
        <TopBar title="Goal allocation" backHref="/plan" />
        <main className="px-4">
          <EmptyState
            icon="auto_awesome"
            title="No active plan"
            description="Approve a plan with Coach to see how your capacity is allocated."
          />
        </main>
      </>
    );
  }

  const activeAllocations = plan.allocations.filter((allocation) => allocation.contributionPaise > 0);
  const usedPercent =
    capacity.capacityPaise > 0
      ? Math.round((plan.totalContributionPaise / capacity.capacityPaise) * 100)
      : 0;

  return (
    <>
      <TopBar
        title="Goal allocation"
        subtitle={`${formatINR(plan.totalContributionPaise)}/mo across ${activeAllocations.length} goals`}
        backHref="/plan"
      />

      <main className="flex flex-col gap-4 px-4">
        <Card className="flex flex-col gap-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-body text-label-md text-on-surface-variant">Available savings capacity</p>
              <p className="font-title text-title-lg tabular-nums text-on-surface">
                {formatINR(capacity.capacityPaise)}/mo
              </p>
            </div>
            <div className="text-right">
              <p className="font-body text-label-md text-on-surface-variant">Flexible buffer</p>
              <p className="font-title text-title-lg tabular-nums text-primary">
                {formatINR(plan.unallocatedPaise)}
              </p>
            </div>
          </div>
          <ProgressBar percent={usedPercent} label="Allocated capacity" />
          <p className="font-body text-body-md text-on-surface-variant">
            {formatINR(plan.totalContributionPaise)} allocated to goals · {usedPercent}% of capacity
          </p>
        </Card>

        <Card className="divide-y divide-outline-variant/40 px-4">
          {plan.allocations.map((allocation) => {
            const item = progress.find((candidate) => candidate.goal.id === allocation.goalId);
            if (!item) return null;
            return (
              <AllocationRow
                key={allocation.goalId}
                progress={item}
                monthlyPaise={allocation.contributionPaise}
                showProgress
                href={`/goals/${allocation.goalId}`}
              />
            );
          })}
        </Card>

        <Card variant="action" className="flex flex-col gap-2 p-4">
          <div className="flex items-center gap-2">
            <Icon name="auto_awesome" size={18} className="text-primary" />
            <p className="font-label text-label-md text-primary">Rebalance</p>
          </div>
          <p className="font-body text-body-md text-on-surface">
            Priorities changed? Coach can compare alternatives and show the impact before anything is
            saved.
          </p>
          <button
            type="button"
            onClick={openCoach}
            className="inline-flex min-h-11 w-fit items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 font-label text-label-lg text-on-primary"
          >
            Ask Coach to rebalance
          </button>
        </Card>
      </main>
    </>
  );
}
