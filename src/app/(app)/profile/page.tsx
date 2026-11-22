"use client";

import Link from "next/link";
import { useAppStore } from "@/store/app-store";
import { getActivePlan, getCapacity, getGoalTotals } from "@/domain/selectors";
import { formatINR } from "@/domain/money";
import { TopBar } from "@/components/navigation/top-bar";
import { Avatar } from "@/components/navigation/top-bar";
import { LogoutButton } from "@/components/auth/logout-button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";

const lifeStageLabel: Record<string, string> = {
  student: "College student",
  intern: "Intern",
  freelancer: "Freelancer",
  working_professional: "Working professional",
  other: "Other",
};

const flexibilityLabel: Record<string, string> = {
  flexible: "Flexible",
  balanced: "Balanced",
  structured: "Structured",
};

export default function ProfilePage() {
  const data = useAppStore((state) => state.data);
  const totals = getGoalTotals(data);
  const capacity = getCapacity(data);
  const plan = getActivePlan(data);

  return (
    <>
      <TopBar
        title="Profile"
        subtitle="Your identity, financial setup & preferences"
        trailing={
          <Link
            href="/settings"
            aria-label="Open settings"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant/70 bg-surface-lowest text-on-surface"
          >
            <Icon name="settings" size={20} />
          </Link>
        }
      />

      <main className="flex flex-col gap-4 px-4">
        <Card className="flex items-center gap-3 p-4">
          <Avatar size={56} />
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-headline text-headline-md text-on-surface">
              {data.user.displayName}
            </h2>
            <p className="truncate font-body text-body-md text-on-surface-variant">{data.user.email}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <Badge tone="accent" dot={false}>
                {lifeStageLabel[data.user.lifeStage] ?? data.user.lifeStage}
              </Badge>
              <Badge tone="neutral" dot={false}>
                Demo account
              </Badge>
            </div>
          </div>
        </Card>

        <section aria-label="Goals snapshot" className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h2 className="font-headline text-headline-md text-on-surface">Goals snapshot</h2>
            <Link href="/goals" className="font-label text-label-md text-primary hover:underline">
              View all
            </Link>
          </div>
          <Card className="grid grid-cols-3 divide-x divide-outline-variant/40 p-4">
            <div className="pr-3">
              <p className="font-body text-label-md text-on-surface-variant">Active</p>
              <p className="font-title text-title-lg tabular-nums text-on-surface">{totals.activeCount}</p>
            </div>
            <div className="px-3">
              <p className="font-body text-label-md text-on-surface-variant">Completed</p>
              <p className="font-title text-title-lg tabular-nums text-on-surface">
                {totals.completedCount}
              </p>
            </div>
            <div className="pl-3">
              <p className="font-body text-label-md text-on-surface-variant">Saved</p>
              <p className="font-title text-title-md tabular-nums text-on-surface">
                {formatINR(totals.savedPaise)}
              </p>
            </div>
          </Card>
        </section>

        <section aria-label="Personal information" className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h2 className="font-headline text-headline-md text-on-surface">Personal information</h2>
            <Link href="/settings/personal" className="font-label text-label-md text-primary hover:underline">
              Edit
            </Link>
          </div>
          <Card className="divide-y divide-outline-variant/40 px-4">
            {[
              ["Full name", data.user.displayName],
              ["Life stage", lifeStageLabel[data.user.lifeStage] ?? data.user.lifeStage],
              ["Phone", data.user.phone ?? "Not provided"],
              ["Age", data.user.age ? `${data.user.age} years` : "Not provided"],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-3 py-3">
                <span className="font-body text-body-md text-on-surface-variant">{label}</span>
                <span className="text-right font-body text-body-md text-on-surface">{value}</span>
              </div>
            ))}
          </Card>
        </section>

        <section aria-label="Financial profile" className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h2 className="font-headline text-headline-md text-on-surface">Financial profile</h2>
            <Link href="/settings/financial" className="font-label text-label-md text-primary hover:underline">
              Edit
            </Link>
          </div>
          <Card className="divide-y divide-outline-variant/40 px-4">
            {[
              ["Income baseline", `${formatINR(capacity.incomePaise)}/mo`],
              ["Income pattern", data.profile.incomeType === "irregular" ? "Irregular / project-based" : "Regular"],
              ["Essentials", `${formatINR(capacity.essentialsPaise)}/mo`],
              ["Commitments", `${formatINR(capacity.commitmentsPaise)}/mo`],
              ["Protected lifestyle", `${formatINR(capacity.protectedPaise)}/mo`],
              ["Savings flexibility", flexibilityLabel[data.preferences.savingsFlexibility] ?? "Balanced"],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-3 py-3">
                <span className="font-body text-body-md text-on-surface-variant">{label}</span>
                <span className="text-right font-body text-body-md tabular-nums text-on-surface">{value}</span>
              </div>
            ))}
          </Card>
        </section>

        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-lg border border-outline-variant/60 bg-surface-lowest p-4 shadow-sm transition-colors hover:border-primary/40"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-surface-container text-on-surface">
            <Icon name="settings" size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-title text-title-md text-on-surface">Settings &amp; data</p>
            <p className="font-body text-body-md text-on-surface-variant">
              Demo data, privacy and prototype limits
            </p>
          </div>
          <Icon name="chevron_right" size={18} className="text-outline" />
        </Link>

        <Card className="flex flex-col gap-3 p-4">
          <div>
            <p className="font-title text-title-md text-on-surface">Session</p>
            <p className="mt-0.5 font-body text-body-md text-on-surface-variant">
              End this demo visit. Your saved data stays in this browser.
            </p>
          </div>
          <LogoutButton fullWidth />
        </Card>

        <Card className="p-4">
          <p className="font-label text-label-md text-on-surface-variant">Active plan</p>
          <p className="mt-1 font-title text-title-md tabular-nums text-on-surface">
            {plan ? `${formatINR(plan.totalContributionPaise)}/month · v${plan.version}` : "No active plan"}
          </p>
          <Link href="/plan" className="mt-1 inline-flex items-center gap-1 font-label text-label-md text-primary hover:underline">
            View plan
            <Icon name="arrow_forward" size={14} />
          </Link>
        </Card>
      </main>
    </>
  );
}
