import Link from "next/link";
import type { GoalProgress } from "@/domain/types";
import { formatINR } from "@/domain/money";
import { formatMonthYear } from "@/domain/dates";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { ProgressBar } from "@/components/ui/progress-bar";
import { cn } from "@/lib/cn";

const healthMeta: Record<
  GoalProgress["health"],
  { label: string; tone: "success" | "warning" | "neutral" | "accent" }
> = {
  on_track: { label: "On Track", tone: "success" },
  needs_attention: { label: "Needs Attention", tone: "warning" },
  completed: { label: "Completed", tone: "success" },
  paused: { label: "Paused", tone: "neutral" },
};

export function GoalCard({ progress, className }: { progress: GoalProgress; className?: string }) {
  const { goal, percent, savedPaise } = progress;
  const health = healthMeta[progress.health];
  const monthly = progress.monthlyContributionPaise;

  return (
    <Link
      href={`/goals/${goal.id}`}
      className={cn(
        "flex flex-col gap-3 rounded-lg border border-outline-variant/60 bg-surface-lowest p-4 shadow-sm transition-colors hover:border-primary/40",
        className,
      )}
    >
      <header className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-secondary-container text-on-secondary-container">
            <Icon name={goal.icon} size={20} />
          </span>
          <div className="min-w-0">
            <h3 className="truncate font-title text-title-md text-on-surface">{goal.name}</h3>
            <p className="truncate font-body text-body-md text-on-surface-variant tabular-nums">
              {goal.targetDate ? `Target ${formatMonthYear(goal.targetDate)}` : "No target date"}
              {monthly ? ` · ${formatINR(monthly)}/mo` : ""}
            </p>
          </div>
        </div>
        <Badge tone={health.tone}>{health.label}</Badge>
      </header>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-title text-title-lg text-on-surface tabular-nums">
            {formatINR(savedPaise)}
          </span>
          <span className="font-body text-body-md text-on-surface-variant tabular-nums">
            of {formatINR(goal.targetPaise)} ({percent}%)
          </span>
        </div>
        <ProgressBar
          percent={percent}
          tone={progress.health === "needs_attention" ? "warning" : "primary"}
          label={`${goal.name} progress`}
        />
      </div>

      {progress.nextMilestone && (
        <p className="font-body text-label-md text-on-surface-variant">
          Next: {progress.nextMilestone.label} at {progress.nextMilestone.targetPercent}% ·{" "}
          {formatINR(Math.max(0, progress.nextMilestone.targetPaise - savedPaise))} away
        </p>
      )}
    </Link>
  );
}
