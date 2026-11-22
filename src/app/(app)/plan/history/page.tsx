"use client";

import Link from "next/link";
import { useAppStore } from "@/store/app-store";
import { formatINR } from "@/domain/money";
import { formatShortDate } from "@/domain/dates";
import { TopBar } from "@/components/navigation/top-bar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState, InlineMessage } from "@/components/ui/states";

const statusTone = {
  proposed: "accent",
  active: "success",
  superseded: "neutral",
  rejected: "warning",
} as const;

const statusLabel = {
  proposed: "Awaiting approval",
  active: "Active",
  superseded: "Superseded",
  rejected: "Rejected",
} as const;

export default function PlanHistoryPage() {
  const data = useAppStore((state) => state.data);
  const plans = [...data.plans].sort((a, b) => b.version - a.version);

  return (
    <>
      <TopBar
        title="Plan history"
        subtitle={`${plans.length} saved ${plans.length === 1 ? "version" : "versions"}`}
        backHref="/plan"
      />
      <main className="flex flex-col gap-4 px-4">
        <InlineMessage tone="info" icon="history">
          Approved plans are never overwritten. Approving a new draft marks the old active version as
          superseded and keeps it here.
        </InlineMessage>
        {plans.length === 0 ? (
          <EmptyState
            icon="history"
            title="No plan versions yet"
            description="Plans you approve or reject will be listed here."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {plans.map((plan) => (
              <Card key={plan.id} className="flex flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-title text-title-md text-on-surface">Version {plan.version}</p>
                    <p className="font-body text-label-md text-on-surface-variant">
                      Created {formatShortDate(plan.createdAt.slice(0, 10))}
                      {plan.approvedAt
                        ? ` · approved ${formatShortDate(plan.approvedAt.slice(0, 10))}`
                        : ""}
                    </p>
                  </div>
                  <Badge tone={statusTone[plan.status]} dot={false}>
                    {statusLabel[plan.status]}
                  </Badge>
                </div>
                <p className="font-body text-body-md text-on-surface-variant">{plan.summary}</p>
                <div className="grid grid-cols-2 gap-3 rounded-lg bg-surface-low p-3">
                  <div>
                    <p className="font-body text-label-md text-on-surface-variant">Monthly</p>
                    <p className="font-title text-title-md tabular-nums text-on-surface">
                      {formatINR(plan.totalContributionPaise)}
                    </p>
                  </div>
                  <div>
                    <p className="font-body text-label-md text-on-surface-variant">Flexible</p>
                    <p className="font-title text-title-md tabular-nums text-on-surface">
                      {formatINR(plan.unallocatedPaise)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {plan.allocations.map((allocation) => (
                    <span
                      key={allocation.goalId}
                      className="rounded-full bg-surface-container px-2.5 py-1 font-body text-label-md text-on-surface-variant"
                    >
                      {allocation.goalId.replace(/^goal-/, "").slice(0, 18)} ·{" "}
                      {formatINR(allocation.contributionPaise)}
                    </span>
                  ))}
                </div>
                {plan.status === "proposed" && (
                  <Link
                    href="/plan/proposal"
                    className="inline-flex w-fit items-center gap-1 font-label text-label-md text-primary hover:underline"
                  >
                    Review proposal
                    <span aria-hidden="true">→</span>
                  </Link>
                )}
              </Card>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
