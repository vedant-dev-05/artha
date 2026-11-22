"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/app-store";
import { buildWorkspaceFromDraft } from "@/domain/onboarding";
import { calculateCapacity } from "@/domain/planning";
import { formatINR } from "@/domain/money";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { EmptyState } from "@/components/ui/states";

export default function OverviewPage() {
  const router = useRouter();
  const draft = useAppStore((state) => state.onboardingDraft);
  const setStep = useAppStore((state) => state.setOnboardingStep);

  const snapshot = useMemo(() => {
    if (!draft) return null;
    const workspace = buildWorkspaceFromDraft(draft);
    return {
      capacity: calculateCapacity(workspace.profile, workspace.preferences),
      goals: workspace.goals,
      profile: workspace.profile,
    };
  }, [draft]);

  if (!draft || !snapshot) {
    return (
      <OnboardingShell title="Financial Overview" step={6} backHref="/onboarding/goals">
        <EmptyState
          icon="dashboard"
          title="Setup not started"
          description="Start onboarding to see your financial snapshot."
          action={
            <Link href="/onboarding/welcome" className="font-label text-label-lg text-primary underline">
              Start setup
            </Link>
          }
        />
      </OnboardingShell>
    );
  }

  const { capacity, goals, profile } = snapshot;
  const rows = [
    {
      label: "Monthly income",
      value: formatINR(capacity.incomePaise),
      hint: profile.incomeType === "irregular" ? "Irregular · baseline month" : "Conservative baseline",
      href: "/onboarding/income",
    },
    {
      label: "Estimated monthly expenses",
      value: formatINR(capacity.essentialsPaise + capacity.protectedPaise),
      hint: `Includes ${formatINR(capacity.protectedPaise)} protected lifestyle spend`,
      href: "/onboarding/expenses",
    },
    {
      label: "Financial commitments",
      value: formatINR(capacity.commitmentsPaise),
      hint: "EMIs and loans",
      href: "/onboarding/expenses",
    },
    {
      label: "Existing savings",
      value: formatINR(profile.existingSavingsPaise),
      hint: "Used as a head start toward goals",
      href: "/onboarding/expenses",
    },
    {
      label: "Safety buffer",
      value: formatINR(capacity.bufferPaise),
      hint: `${capacity.bufferPercent}% of income, minimum ₹500 · not allocated`,
      href: "/settings",
    },
  ];

  function handleContinue() {
    setStep(7);
    router.push("/onboarding/plan");
  }

  return (
    <OnboardingShell
      title="Financial Overview"
      step={6}
      backHref="/onboarding/goals"
      coachNote={`Your ${formatINR(capacity.capacityPaise)} monthly capacity is calculated after protecting ${formatINR(capacity.protectedPaise)} of lifestyle spend.`}
    >
      <div className="space-y-1">
        <h2 className="font-headline text-headline-md text-on-surface">Here is your financial snapshot</h2>
        <p className="font-body text-body-md text-on-surface-variant">
          Review or edit anything before we generate your personalised plan.
        </p>
      </div>

      <Card className="bg-primary p-5 text-on-primary">
        <p className="font-label text-label-md text-on-primary/80">Estimated monthly savings capacity</p>
        <p className="mt-1 font-display text-display-md tabular-nums">
          {formatINR(capacity.capacityPaise)} <span className="font-body text-body-md">/mo</span>
        </p>
        <p className="mt-2 font-body text-body-md text-on-primary/80">
          After {formatINR(capacity.essentialsPaise + capacity.commitmentsPaise)} of expenses and{" "}
          {formatINR(capacity.protectedPaise)} of protected lifestyle spend.
        </p>
      </Card>

      <Card className="divide-y divide-outline-variant/60 px-4">
        {rows.map((row) => (
          <Link
            key={row.label}
            href={row.href}
            className="flex items-center justify-between gap-3 py-3"
          >
            <span className="min-w-0">
              <span className="block font-title text-title-md text-on-surface">{row.label}</span>
              <span className="block font-body text-body-md text-on-surface-variant">{row.hint}</span>
            </span>
            <span className="flex shrink-0 items-center gap-1 text-right">
              <span className="font-title text-title-md tabular-nums text-on-surface">{row.value}</span>
              <Icon name="chevron_right" size={16} className="text-outline" />
            </span>
          </Link>
        ))}
      </Card>

      <Card className="space-y-2 p-4">
        <p className="font-label text-label-lg text-on-surface">Goals in this plan</p>
        {goals.map((goal) => (
          <div key={goal.id} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 font-body text-body-md text-on-surface">
              <Icon name={goal.icon} size={16} className="text-primary" />
              {goal.name}
            </span>
            <span className="font-body text-body-md tabular-nums text-on-surface-variant">
              {formatINR(goal.targetPaise)}
            </span>
          </div>
        ))}
      </Card>

      <Button size="lg" fullWidth onClick={handleContinue}>
        Build my personalised plan
      </Button>
    </OnboardingShell>
  );
}
