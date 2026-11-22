"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/app-store";
import { buildWorkspaceFromDraft } from "@/domain/onboarding";
import { formatINR } from "@/domain/money";
import { formatMonthYear } from "@/domain/dates";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { EmptyState, InlineMessage } from "@/components/ui/states";

export default function PersonalisedPlanPage() {
  const router = useRouter();
  const draft = useAppStore((state) => state.onboardingDraft);
  const acceptPlan = useAppStore((state) => state.acceptOnboardingPlan);
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);
  const showToast = useAppStore((state) => state.showToast);

  const snapshot = useMemo(() => {
    if (!draft) return null;
    const workspace = buildWorkspaceFromDraft(draft);
    return { plan: workspace.plans[0], goals: workspace.goals };
  }, [draft]);

  if (!draft || !snapshot) {
    return (
      <OnboardingShell title="Personalised Financial Plan" step={7} backHref="/onboarding/overview">
        <EmptyState
          icon="planning"
          title="No plan to show yet"
          description="Complete the earlier setup steps first."
          action={
            <Link href="/onboarding/welcome" className="font-label text-label-lg text-primary underline">
              Start setup
            </Link>
          }
        />
      </OnboardingShell>
    );
  }

  const { plan, goals } = snapshot;

  function handleAccept() {
    acceptPlan();
    completeOnboarding();
    showToast("Plan approved and workspace ready");
    router.push("/onboarding/complete");
  }

  return (
    <OnboardingShell
      title="Personalised Financial Plan"
      step={7}
      backHref="/onboarding/overview"
      coachNote="This is a proposal. Nothing changes until you explicitly accept it."
    >
      <div className="space-y-1">
        <h2 className="font-headline text-headline-md text-on-surface">Your personalised savings plan</h2>
        <p className="font-body text-body-md text-on-surface-variant">
          Save {formatINR(plan.totalContributionPaise)}/month across your goals while keeping{" "}
          {formatINR(plan.unallocatedPaise)}/month flexible for unexpected weeks.
        </p>
      </div>

      <Card className="flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="font-label text-label-lg text-on-surface">Goal allocations</p>
          <Badge tone="neutral" dot={false}>Plan v{plan.version} · proposed</Badge>
        </div>
        {plan.allocations.map((allocation) => {
          const goal = goals.find((candidate) => candidate.id === allocation.goalId);
          if (!goal) return null;
          return (
            <div key={allocation.goalId} className="flex items-center gap-3 border-t border-outline-variant/60 pt-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
                <Icon name={goal.icon} size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-title text-title-md text-on-surface">{goal.name}</p>
                <p className="font-body text-body-md text-on-surface-variant">
                  {goal.targetDate ? formatMonthYear(goal.targetDate) : "12-month assumption"} ·{" "}
                  {allocation.rationale}
                </p>
              </div>
              <p className="shrink-0 font-title text-title-md tabular-nums text-primary">
                {formatINR(allocation.contributionPaise)}/mo
              </p>
            </div>
          );
        })}
      </Card>

      {plan.warnings.length > 0 && (
        <InlineMessage tone="warning" icon="warning">
          <p className="font-label text-label-lg">Worth knowing</p>
          <ul className="mt-1 list-disc space-y-1 pl-4">
            {plan.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </InlineMessage>
      )}

      <Card className="space-y-2 p-4">
        <p className="font-label text-label-lg text-on-surface">Assumptions</p>
        <ul className="list-disc space-y-1 pl-4 font-body text-body-md text-on-surface-variant">
          {plan.assumptions.map((assumption) => (
            <li key={assumption}>{assumption}</li>
          ))}
        </ul>
      </Card>

      <div className="mt-auto flex flex-col gap-2 pt-2">
        <Button size="lg" fullWidth onClick={handleAccept}>
          Accept &amp; finish setup
          <Icon name="check" size={18} />
        </Button>
        <Button variant="outline" size="lg" fullWidth onClick={() => router.push("/onboarding/goals")}>
          Modify goals
        </Button>
      </div>
    </OnboardingShell>
  );
}
