"use client";

import Link from "next/link";
import { useAppStore } from "@/store/app-store";
import {
  getAllGoalProgress,
  getActivePlan,
  getCapacity,
  getProposedPlan,
} from "@/domain/selectors";
import { formatINR } from "@/domain/money";
import { formatLongDate } from "@/domain/dates";
import { TopBar } from "@/components/navigation/top-bar";
import { AllocationRow } from "@/components/plan/allocation-row";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { ProgressBar } from "@/components/ui/progress-bar";
import { EmptyState, InlineMessage } from "@/components/ui/states";

export default function PlanPage() {
  const data = useAppStore((state) => state.data);
  const openCoach = useAppStore((state) => state.openCoach);
  const plan = getActivePlan(data);
  const proposed = getProposedPlan(data);
  const capacity = getCapacity(data);
  const progress = getAllGoalProgress(data);

  if (!plan) {
    return (
      <>
        <TopBar title="My financial plan" backHref="/home" />
        <main className="px-4">
          <EmptyState
            icon="auto_awesome"
            title="No active plan yet"
            description="Your plan is created with Coach, then shown here once you approve it."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Link
                  href="/plan/proposal"
                  className="inline-flex min-h-11 items-center rounded-full bg-primary px-4 py-2.5 font-label text-label-lg text-on-primary"
                >
                  Review proposal
                </Link>
                <button
                  type="button"
                  onClick={openCoach}
                  className="inline-flex min-h-11 items-center rounded-full border border-outline-variant bg-surface-lowest px-4 py-2.5 font-label text-label-lg text-on-surface"
                >
                  Open Coach
                </button>
              </div>
            }
          />
        </main>
      </>
    );
  }

  const usedPercent =
    plan.capacityPaise > 0 ? Math.round((plan.totalContributionPaise / plan.capacityPaise) * 100) : 0;

  return (
    <>
      <TopBar
        title="My financial plan"
        subtitle={`Version ${plan.version}`}
        backHref="/home"
        trailing={<Badge tone="success">Active</Badge>}
      />

      <main className="flex flex-col gap-4 px-4">
        <Card variant="filled" className="flex flex-col gap-4 rounded-xl p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="font-label text-label-md text-accent">Monthly plan</p>
              <p className="font-display text-display-lg-mobile tabular-nums text-on-primary">
                {formatINR(plan.totalContributionPaise)}
                <span className="font-body text-body-md text-on-primary-container">/mo</span>
              </p>
              <p className="font-body text-body-md tabular-nums text-on-primary-container">
                of {formatINR(plan.capacityPaise)} available capacity
              </p>
            </div>
            <span className="rounded-full bg-primary-container px-3 py-1 font-label text-label-sm tabular-nums text-accent-soft">
              {usedPercent}% used
            </span>
          </div>
          <ProgressBar
            percent={usedPercent}
            tone="accent"
            trackClassName="bg-primary-container"
            label="Capacity used by the plan"
          />
          <div className="flex items-center justify-between border-t border-on-primary/10 pt-3">
            <span className="font-label text-label-sm tabular-nums text-on-primary-container">
              {formatINR(plan.unallocatedPaise)} flexible each month
            </span>
            <span className="font-label text-label-sm text-accent-soft">
              {plan.approvedAt ? `Approved ${formatLongDate(plan.approvedAt.slice(0, 10))}` : "Awaiting approval"}
            </span>
          </div>
        </Card>

        <InlineMessage tone="info" icon="info">
          {plan.summary}
        </InlineMessage>

        <div className="grid grid-cols-2 gap-2">
          <Link
            href="/plan/proposal"
            className="flex min-h-14 items-center justify-between gap-2 rounded-lg border border-outline-variant bg-surface-lowest px-3 py-2"
          >
            <span>
              <span className="block font-label text-label-md text-on-surface-variant">Draft</span>
              <span className="block font-body text-body-md text-on-surface">
                {proposed ? `v${proposed.version} awaiting review` : "Review or create"}
              </span>
            </span>
            <Icon name="chevron_right" size={16} className="text-outline" />
          </Link>
          <Link
            href="/plan/history"
            className="flex min-h-14 items-center justify-between gap-2 rounded-lg border border-outline-variant bg-surface-lowest px-3 py-2"
          >
            <span>
              <span className="block font-label text-label-md text-on-surface-variant">History</span>
              <span className="block font-body text-body-md text-on-surface">
                {data.plans.length} {data.plans.length === 1 ? "version" : "versions"}
              </span>
            </span>
            <Icon name="chevron_right" size={16} className="text-outline" />
          </Link>
        </div>

        <section aria-label="Goal allocation" className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h2 className="font-headline text-headline-md text-on-surface">Goal allocation</h2>
            <Link
              href="/plan/allocations"
              className="inline-flex items-center gap-1 font-label text-label-md text-primary hover:underline"
            >
              Details
              <Icon name="chevron_right" size={14} />
            </Link>
          </div>
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
        </section>

        <section aria-label="Plan details" className="flex flex-col gap-2">
          <h2 className="font-headline text-headline-md text-on-surface">Plan details</h2>
          <Card className="p-4">
            <dl className="divide-y divide-outline-variant/40">
              {[
                ["Income baseline", capacity.incomePaise],
                ["Essentials", capacity.essentialsPaise],
                ["Commitments", capacity.commitmentsPaise],
                ["Protected spending", capacity.protectedPaise],
                ["Safety buffer", capacity.bufferPaise],
              ].map(([label, value]) => (
                <div key={String(label)} className="flex items-center justify-between gap-3 py-2">
                  <dt className="font-body text-body-md text-on-surface-variant">{label}</dt>
                  <dd className="font-body text-body-md tabular-nums text-on-surface">
                    {formatINR(Number(value))}
                  </dd>
                </div>
              ))}
              <div className="flex items-center justify-between gap-3 py-2">
                <dt className="font-label text-label-lg text-on-surface">Available capacity</dt>
                <dd className="font-title text-title-md tabular-nums text-primary">
                  {formatINR(capacity.capacityPaise)}
                </dd>
              </div>
            </dl>
            <p className="mt-2 rounded-lg bg-surface-low p-3 font-body text-body-md text-on-surface-variant">
              Buffer is {capacity.bufferPercent}% of income, with a ₹500 minimum. You can adjust it in
              financial preferences.
            </p>
          </Card>
        </section>

        {plan.warnings.length > 0 && (
          <section aria-label="Plan warnings" className="flex flex-col gap-2">
            {plan.warnings.map((warning) => (
              <InlineMessage key={warning} tone="warning" icon="warning">
                {warning}
              </InlineMessage>
            ))}
          </section>
        )}

        <section aria-label="Assumptions" className="flex flex-col gap-2">
          <h2 className="font-headline text-headline-md text-on-surface">Assumptions</h2>
          <Card className="p-4">
            <ul className="space-y-2">
              {plan.assumptions.map((assumption) => (
                <li key={assumption} className="flex items-start gap-2 font-body text-body-md text-on-surface-variant">
                  <Icon name="check" size={16} className="mt-0.5 shrink-0 text-success" />
                  <span>{assumption}</span>
                </li>
              ))}
            </ul>
          </Card>
        </section>

        <Card variant="action" className="flex flex-col gap-2 p-4">
          <p className="font-body text-body-md text-on-surface">
            Need to change income, expenses or priorities? Coach can model the impact first. Nothing
            changes until you approve it.
          </p>
          <button
            type="button"
            onClick={openCoach}
            className="inline-flex min-h-11 w-fit items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 font-label text-label-lg text-on-primary"
          >
            <Icon name="auto_awesome" size={18} />
            Discuss with Coach
          </button>
        </Card>

        <p className="pb-2 font-body text-label-md text-on-surface-variant">
          Artha provides planning guidance, not regulated financial advice. Contributions are
          recorded manually; Artha never moves money.
        </p>
      </main>
    </>
  );
}
