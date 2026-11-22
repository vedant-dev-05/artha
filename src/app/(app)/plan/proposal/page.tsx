"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/app-store";
import { getAllGoalProgress, getCapacity, getProposedPlan } from "@/domain/selectors";
import { buildPlanAlternatives, nextPlanVersion } from "@/domain/plan-versions";
import { formatINR } from "@/domain/money";
import { formatLongDate, formatMonthYear, todayISO } from "@/domain/dates";
import { TopBar } from "@/components/navigation/top-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { EmptyState, InlineMessage } from "@/components/ui/states";
import type { FinancialPlan } from "@/domain/types";

interface PlanOption {
  id: string;
  label: string;
  description: string;
  plan: FinancialPlan;
}

export default function PlanProposalPage() {
  const router = useRouter();
  const data = useAppStore((state) => state.data);
  const proposePlan = useAppStore((state) => state.proposePlan);
  const approvePlan = useAppStore((state) => state.approvePlan);
  const rejectPlan = useAppStore((state) => state.rejectPlan);
  const showToast = useAppStore((state) => state.showToast);
  const proposed = getProposedPlan(data);
  const capacity = getCapacity(data);
  const progress = getAllGoalProgress(data);
  const [selectedId, setSelectedId] = useState("current");

  const options = useMemo<PlanOption[]>(() => {
    const current: PlanOption[] = proposed
      ? [
          {
            id: "current",
            label: "Current draft",
            description: "The proposal already waiting for your review.",
            plan: proposed,
          },
        ]
      : [];
    const alternatives = buildPlanAlternatives(
      data.goals,
      data.progressEvents,
      capacity,
      todayISO(),
      nextPlanVersion(data.plans),
      proposed?.source ?? "companion_proposal",
    ).map((option) => ({
      id: option.id,
      label: option.label,
      description: option.description,
      plan: option.plan,
    }));
    return [...current, ...alternatives];
  }, [data.goals, data.progressEvents, data.plans, capacity, proposed]);

  const selectedPlan = options.find((option) => option.id === selectedId)?.plan ?? proposed;

  function handleApprove() {
    if (!selectedPlan) return;
    let planId = proposed?.id;
    if (selectedId !== "current" || !proposed) {
      const created = proposePlan({
        source: selectedPlan.source,
        allocations: selectedPlan.allocations,
        summary: selectedPlan.summary,
      });
      if (!created) {
        showToast("This option could not be saved as a proposal.", "error");
        return;
      }
      planId = created;
    }
    if (!planId || !approvePlan(planId)) {
      showToast("The proposal is no longer available.", "error");
      return;
    }
    showToast(`Plan v${selectedPlan.version} is now active across Home, Goals and Coach.`);
    router.push("/plan");
  }

  function handleReject() {
    if (!proposed || !rejectPlan(proposed.id)) {
      showToast("There is no draft to reject.", "error");
      return;
    }
    showToast("Plan draft rejected. Your active plan is unchanged.");
    router.push("/plan");
  }

  return (
    <>
      <TopBar
        title="Plan proposal"
        subtitle={proposed ? `Draft version ${proposed.version}` : "No draft waiting"}
        backHref="/plan"
        trailing={
          <Link
            href="/plan/history"
            className="inline-flex min-h-10 items-center rounded-full border border-outline-variant bg-surface-lowest px-3 font-label text-label-md text-on-surface"
          >
            History
          </Link>
        }
      />

      <main className="flex flex-col gap-4 px-4">
        {!proposed ? (
          <EmptyState
            icon="auto_awesome"
            title="No plan proposal yet"
            description="Generate a draft from your current goals and capacity. It will stay inactive until you approve it."
            action={
              <Button
                onClick={() => {
                  const id = proposePlan({ source: "system_recalculation" });
                  if (!id) showToast("Add an active goal before generating a plan.", "error");
                }}
              >
                Generate a proposal
              </Button>
            }
          />
        ) : (
          <>
            <InlineMessage tone="warning" icon="lock">
              Nothing changes until you approve. Coach and Artha can prepare options, but only this
              screen can activate a plan.
            </InlineMessage>

            <Card className="flex flex-col gap-2 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-label text-label-md text-on-surface-variant">
                    Monthly contribution
                  </p>
                  <p className="font-display text-headline-md tabular-nums text-on-surface">
                    {formatINR(selectedPlan?.totalContributionPaise ?? 0)}/mo
                  </p>
                </div>
                <Badge tone="accent" dot={false}>
                  Awaiting approval
                </Badge>
              </div>
              <p className="font-body text-body-md text-on-surface-variant">{selectedPlan?.summary}</p>
              <div className="flex items-center justify-between border-t border-outline-variant/50 pt-3 font-body text-body-md tabular-nums text-on-surface-variant">
                <span>{formatINR(selectedPlan?.unallocatedPaise ?? 0)} left flexible</span>
                <span>{formatINR(capacity.capacityPaise)} capacity</span>
              </div>
            </Card>

            <section aria-label="Plan options" className="flex flex-col gap-2">
              <h2 className="font-headline text-headline-md text-on-surface">Compare options</h2>
              {options.map((option) => {
                const active = option.id === selectedId;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setSelectedId(option.id)}
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
                    <p className="mt-2 font-label text-label-md tabular-nums text-on-surface">
                      {formatINR(option.plan.totalContributionPaise)}/mo ·{" "}
                      {formatINR(option.plan.unallocatedPaise)} flexible
                    </p>
                  </button>
                );
              })}
            </section>

            <section aria-label="Draft allocation" className="flex flex-col gap-2">
              <h2 className="font-headline text-headline-md text-on-surface">Goal allocation</h2>
              <Card className="divide-y divide-outline-variant/40 px-4">
                {selectedPlan?.allocations.map((allocation) => {
                  const item = progress.find((candidate) => candidate.goal.id === allocation.goalId);
                  if (!item) return null;
                  return (
                    <div key={allocation.goalId} className="flex items-center gap-3 py-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-secondary-container text-on-secondary-container">
                        <Icon name={item.goal.icon} size={20} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate font-title text-title-md text-on-surface">
                            {item.goal.name}
                          </p>
                          <p className="shrink-0 font-title text-title-md tabular-nums text-on-surface">
                            {allocation.contributionPaise > 0
                              ? `${formatINR(allocation.contributionPaise)}/mo`
                              : "Not funded"}
                          </p>
                        </div>
                        <p className="font-body text-body-md text-on-surface-variant">
                          {allocation.projectedCompletionDate
                            ? `Projected ${formatMonthYear(allocation.projectedCompletionDate)}`
                            : "No projection"}
                          {item.goal.targetDate ? ` · target ${formatMonthYear(item.goal.targetDate)}` : ""}
                        </p>
                        {allocation.rationale && (
                          <p className="font-body text-label-md text-on-surface-variant">
                            {allocation.rationale}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </Card>
            </section>

            {(selectedPlan?.warnings.length ?? 0) > 0 && (
              <section aria-label="Trade-offs" className="flex flex-col gap-2">
                <h2 className="font-headline text-headline-md text-on-surface">Trade-offs</h2>
                {selectedPlan?.warnings.map((warning) => (
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
                  {(selectedPlan?.assumptions ?? []).map((assumption) => (
                    <li
                      key={assumption}
                      className="flex items-start gap-2 font-body text-body-md text-on-surface-variant"
                    >
                      <Icon name="check" size={16} className="mt-0.5 shrink-0 text-success" />
                      <span>{assumption}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </section>

            <Card className="flex flex-col gap-2 p-4">
              <p className="font-body text-body-md text-on-surface">
                Approving marks the previous active version as superseded and keeps it in history.
              </p>
              <Button fullWidth onClick={handleApprove}>
                Approve &amp; activate
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/plan/adjust"
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-outline-variant bg-surface-lowest px-3 py-2 font-label text-label-md text-on-surface"
                >
                  Modify amounts
                </Link>
                <Button variant="outline" onClick={handleReject}>
                  Reject draft
                </Button>
              </div>
              <p className="font-body text-label-md text-on-surface-variant">
                Draft created {proposed ? formatLongDate(proposed.createdAt.slice(0, 10)) : "—"}.
              </p>
            </Card>
          </>
        )}
      </main>
    </>
  );
}
