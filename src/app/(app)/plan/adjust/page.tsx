"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/app-store";
import { getActivePlan, getCapacity, getProposedPlan } from "@/domain/selectors";
import { buildPlanProposal, projectedCompletionDate, savedByGoal } from "@/domain/planning";
import { formatINR } from "@/domain/money";
import { formatMonthYear, todayISO } from "@/domain/dates";
import { TopBar } from "@/components/navigation/top-bar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { EmptyState, InlineMessage } from "@/components/ui/states";

function parseRupees(raw: string): number {
  const cleaned = raw.replace(/[₹,\s]/g, "");
  if (!cleaned) return 0;
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return -1;
  const [whole, fraction = ""] = cleaned.split(".");
  const value = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(value) ? value : -1;
}

export default function AdjustPlanPage() {
  const router = useRouter();
  const data = useAppStore((state) => state.data);
  const proposePlan = useAppStore((state) => state.proposePlan);
  const showToast = useAppStore((state) => state.showToast);
  const proposed = getProposedPlan(data);
  const active = getActivePlan(data);
  const base = proposed ?? active;
  const capacity = getCapacity(data);
  const goals = useMemo(() => data.goals.filter((goal) => goal.status === "active"), [data.goals]);
  const initialAmounts = useMemo(() => {
    const result = new Map<string, string>();
    for (const goal of goals) {
      const fromBase = base?.allocations.find((allocation) => allocation.goalId === goal.id);
      result.set(goal.id, String(Math.round((fromBase?.contributionPaise ?? 0) / 100)));
    }
    return result;
  }, [goals, base]);
  const [amounts, setAmounts] = useState<Record<string, string>>(() =>
    Object.fromEntries(initialAmounts),
  );

  const saved = useMemo(() => savedByGoal(data.progressEvents), [data.progressEvents]);
  const parsed = goals.map((goal) => ({
    goal,
    paise: parseRupees(amounts[goal.id] ?? "0"),
  }));
  const hasInvalid = parsed.some((item) => item.paise < 0);
  const total = parsed.reduce((sum, item) => sum + Math.max(0, item.paise), 0);
  const overCapacity = total > capacity.capacityPaise;

  const recommended = useMemo(
    () =>
      buildPlanProposal({
        goals,
        events: data.progressEvents,
        capacity,
        asOf: todayISO(),
        version: (base?.version ?? 0) + 1,
        source: "user_adjustment",
      }),
    [goals, data.progressEvents, capacity, base?.version],
  );

  function handleSave() {
    if (hasInvalid || overCapacity || goals.length === 0) return;
    const allocations = parsed.map((item) => ({
      goalId: item.goal.id,
      contributionPaise: item.paise,
      frequency: "monthly" as const,
      projectedCompletionDate: projectedCompletionDate(
        item.goal,
        saved[item.goal.id] ?? 0,
        item.paise,
        todayISO(),
      ),
      rationale: "Amount adjusted by you",
    }));
    const id = proposePlan({
      source: "user_adjustment",
      allocations,
      summary: `Your adjusted monthly plan with ${formatINR(total)} allocated and ${formatINR(
        Math.max(0, capacity.capacityPaise - total),
      )} kept flexible. Awaiting approval.`,
    });
    if (!id) {
      showToast("The adjusted plan could not be saved.", "error");
      return;
    }
    showToast("Adjusted plan saved as a draft. Approve it on the next screen.");
    router.push("/plan/proposal");
  }

  if (goals.length === 0) {
    return (
      <>
        <TopBar title="Adjust plan" backHref="/plan/proposal" />
        <main className="px-4">
          <EmptyState
            icon="flag"
            title="No active goals"
            description="Create or resume a goal before adjusting a plan."
          />
        </main>
      </>
    );
  }

  return (
    <>
      <TopBar
        title="Adjust plan"
        subtitle="Create a draft for review"
        backHref="/plan/proposal"
      />
      <main className="flex flex-col gap-4 px-4">
        <InlineMessage tone="warning" icon="lock">
          Amounts here are saved as a proposal only. Your active plan stays in place until you approve.
        </InlineMessage>

        <Card className="flex flex-col gap-3 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-body text-label-md text-on-surface-variant">Monthly capacity</p>
              <p className="font-title text-title-lg tabular-nums text-on-surface">
                {formatINR(capacity.capacityPaise)}
              </p>
            </div>
            <div className="text-right">
              <p className="font-body text-label-md text-on-surface-variant">Draft total</p>
              <p
                className={`font-title text-title-lg tabular-nums ${
                  overCapacity ? "text-error" : "text-primary"
                }`}
              >
                {formatINR(total)}
              </p>
            </div>
          </div>
          <p className="font-body text-body-md text-on-surface-variant">
            {formatINR(Math.max(0, capacity.capacityPaise - total))} left flexible · Essentials,
            commitments, protected spending and the safety buffer are already excluded.
          </p>
        </Card>

        <section aria-label="Monthly allocations" className="flex flex-col gap-2">
          <h2 className="font-headline text-headline-md text-on-surface">Monthly allocations</h2>
          <Card className="divide-y divide-outline-variant/40 px-4">
            {parsed.map(({ goal, paise }) => (
              <div key={goal.id} className="flex flex-col gap-2 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <Icon name={goal.icon} size={18} className="shrink-0 text-primary" />
                    <p className="truncate font-title text-title-md text-on-surface">{goal.name}</p>
                  </div>
                  <span className="shrink-0 font-body text-label-md tabular-nums text-on-surface-variant">
                    {goal.targetDate ? `target ${formatMonthYear(goal.targetDate)}` : "no date"}
                  </span>
                </div>
                <div className="flex items-center gap-2 rounded-md border border-outline-variant bg-surface-lowest px-3 focus-within:border-primary">
                  <span className="font-title text-title-md text-on-surface-variant">₹</span>
                  <input
                    inputMode="decimal"
                    aria-label={`Monthly contribution for ${goal.name}`}
                    value={amounts[goal.id] ?? "0"}
                    onChange={(event) =>
                      setAmounts((current) => ({ ...current, [goal.id]: event.target.value }))
                    }
                    className="min-h-11 w-full bg-transparent font-title text-title-md tabular-nums outline-none"
                  />
                  <span className="font-body text-label-md text-on-surface-variant">/mo</span>
                </div>
                <p className="font-body text-label-md text-on-surface-variant">
                  {paise >= 0 && projectedCompletionDate(goal, saved[goal.id] ?? 0, paise)
                    ? `Projected ${formatMonthYear(
                        projectedCompletionDate(goal, saved[goal.id] ?? 0, paise)!,
                      )}`
                    : "No projection at this amount"}
                </p>
              </div>
            ))}
          </Card>
        </section>

        {hasInvalid && (
          <InlineMessage tone="error" icon="error">
            Enter whole rupees or up to two decimal places for every goal.
          </InlineMessage>
        )}
        {overCapacity && (
          <InlineMessage tone="error" icon="error">
            This draft allocates more than your monthly capacity. Lower an amount before saving.
          </InlineMessage>
        )}

        <Card className="flex flex-col gap-2 p-4">
          <Button fullWidth onClick={handleSave} disabled={hasInvalid || overCapacity}>
            Save adjusted proposal
          </Button>
          <Button
            variant="outline"
            fullWidth
            onClick={() =>
              setAmounts(
                Object.fromEntries(
                  recommended.allocations.map((allocation) => [
                    allocation.goalId,
                    String(Math.round(allocation.contributionPaise / 100)),
                  ]),
                ),
              )
            }
          >
            Reset to recommended amounts
          </Button>
        </Card>
      </main>
    </>
  );
}
