import Link from "next/link";
import type { GoalProgress } from "@/domain/types";
import { formatINR } from "@/domain/money";
import { formatMonthYear } from "@/domain/dates";
import { Icon } from "@/components/ui/icon";
import { ProgressBar } from "@/components/ui/progress-bar";

interface AllocationRowProps {
  progress: GoalProgress;
  monthlyPaise: number;
  showProgress?: boolean;
  href?: string;
}

export function AllocationRow({ progress, monthlyPaise, showProgress = false, href }: AllocationRowProps) {
  const content = (
    <>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-secondary-container text-on-secondary-container">
        <Icon name={progress.goal.icon} size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate font-title text-title-md text-on-surface">{progress.goal.name}</p>
          <p className="shrink-0 font-title text-title-md tabular-nums text-on-surface">
            {monthlyPaise > 0 ? `${formatINR(monthlyPaise)}/mo` : "Not funded"}
          </p>
        </div>
        <p className="font-body text-body-md text-on-surface-variant tabular-nums">
          {progress.goal.targetDate ? `Target ${formatMonthYear(progress.goal.targetDate)}` : "No target date"}
          {" · "}
          {progress.projectedCompletionDate
            ? `projected ${formatMonthYear(progress.projectedCompletionDate)}`
            : "no projection"}
        </p>
        {showProgress && (
          <div className="mt-2 flex items-center gap-2">
            <ProgressBar percent={progress.percent} className="h-1.5" label={`${progress.goal.name} progress`} />
            <span className="shrink-0 font-body text-label-md tabular-nums text-on-surface-variant">
              {progress.percent}%
            </span>
          </div>
        )}
      </div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className="flex items-center gap-3 py-3 transition-colors hover:bg-surface-low/60">
        {content}
      </Link>
    );
  }

  return <div className="flex items-center gap-3 py-3">{content}</div>;
}
