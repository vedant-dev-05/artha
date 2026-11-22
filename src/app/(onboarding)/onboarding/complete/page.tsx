"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/app-store";
import { getActivePlan } from "@/domain/selectors";
import { formatINR } from "@/domain/money";
import { formatMonthYear } from "@/domain/dates";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";

export default function SetupCompletePage() {
  const router = useRouter();
  const data = useAppStore((state) => state.data);
  const plan = getActivePlan(data);
  const activeGoals = data.goals.filter((goal) => goal.status === "active");
  const nextMilestone = data.milestones.find((milestone) => milestone.status === "upcoming");
  const nextMilestoneGoal = nextMilestone
    ? data.goals.find((goal) => goal.id === nextMilestone.goalId)
    : undefined;

  return (
    <OnboardingShell
      title="Setup Complete"
      coachNote="Nice work getting set up! I am right here whenever you want to check a purchase or adjust your plan."
    >
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-success-container text-on-success-container">
          <Icon name="check_circle" size={44} filled />
        </span>
        <div className="space-y-1">
          <Badge tone="success" icon="verified_user">Plan ready</Badge>
          <h2 className="font-display text-display-md text-on-surface">
            You are all set, {data.user.displayName}!
          </h2>
          <p className="font-body text-body-md text-on-surface-variant">
            Your personalised roadmap is ready. Every rupee you set aside now moves you closer to
            your goals — at your own pace.
          </p>
        </div>
      </div>

      <Card className="divide-y divide-outline-variant/60 px-4">
        <div className="flex items-center justify-between gap-3 py-3">
          <span className="font-title text-title-md text-on-surface">Active goals</span>
          <span className="font-title text-title-md tabular-nums text-primary">
            {activeGoals.length} {activeGoals.length === 1 ? "goal" : "goals"}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 py-3">
          <span className="font-title text-title-md text-on-surface">Monthly savings plan</span>
          <span className="font-title text-title-md tabular-nums text-primary">
            {plan ? `${formatINR(plan.totalContributionPaise)}/mo` : "No active plan"}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 py-3">
          <span className="font-title text-title-md text-on-surface">Next milestone</span>
          <span className="text-right font-body text-body-md text-on-surface-variant">
            {nextMilestone
              ? `${nextMilestone.label} · ${nextMilestoneGoal?.name ?? "Goal"}${
                  nextMilestoneGoal?.targetDate ? ` · ${formatMonthYear(nextMilestoneGoal.targetDate)}` : ""
                }`
              : "None yet"}
          </span>
        </div>
      </Card>

      <div className="mt-auto flex flex-col gap-2 pt-4">
        <Button size="lg" fullWidth onClick={() => router.push("/home")}>
          Go to my dashboard
          <Icon name="arrow_forward" size={18} />
        </Button>
        <Link
          href="/plan"
          className="text-center font-label text-label-lg text-primary hover:underline"
        >
          Review the full plan
        </Link>
      </div>
    </OnboardingShell>
  );
}
