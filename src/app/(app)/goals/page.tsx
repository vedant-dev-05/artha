"use client";

import Link from "next/link";
import { useAppStore } from "@/store/app-store";
import { getAllGoalProgress, getGoalTotals } from "@/domain/selectors";
import { formatINR } from "@/domain/money";
import { TopBar } from "@/components/navigation/top-bar";
import { GoalCard } from "@/components/goals/goal-card";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { EmptyState } from "@/components/ui/states";

export default function GoalsPage() {
  const data = useAppStore((state) => state.data);
  const progress = getAllGoalProgress(data);
  const totals = getGoalTotals(data);

  return (
    <>
      <TopBar
        title="My Goals"
        subtitle={`${totals.activeCount} active · ${formatINR(totals.savedPaise)} saved`}
        trailing={
          <Link
            href="/goals/new"
            className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 font-label text-label-md text-on-primary"
          >
            <Icon name="add" size={18} />
            New goal
          </Link>
        }
      />
      <main className="flex flex-col gap-4 px-4">
        <Card className="flex items-center justify-between gap-3 p-4">
          <div>
            <p className="font-label text-label-md text-on-surface-variant">Total progress</p>
            <p className="font-title text-title-lg tabular-nums text-on-surface">
              {formatINR(totals.savedPaise)}{" "}
              <span className="font-body text-body-md text-on-surface-variant">
                of {formatINR(totals.targetPaise)}
              </span>
            </p>
          </div>
          <span className="font-display text-headline-md tabular-nums text-primary">
            {totals.percent}%
          </span>
        </Card>

        {progress.length === 0 ? (
          <EmptyState
            icon="flag"
            title="No goals yet"
            description="Your goals will appear here once you create one."
            action={
              <Link
                href="/goals/new"
                className="inline-flex min-h-11 items-center rounded-full bg-primary px-4 py-2.5 font-label text-label-lg text-on-primary"
              >
                Create a goal
              </Link>
            }
          />
        ) : (
          <div className="flex flex-col gap-3">
            {progress.map((item) => (
              <GoalCard key={item.goal.id} progress={item} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
