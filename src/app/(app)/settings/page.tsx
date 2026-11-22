"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/app-store";
import { TopBar } from "@/components/navigation/top-bar";
import { LogoutButton } from "@/components/auth/logout-button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Sheet } from "@/components/ui/sheet";

interface SettingsLinkProps {
  href: string;
  icon: string;
  title: string;
  description: string;
}

function SettingsLink({ href, icon, title, description }: SettingsLinkProps) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surface-low"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-secondary-container text-on-secondary-container">
        <Icon name={icon} size={20} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-title text-title-md text-on-surface">{title}</span>
        <span className="block font-body text-body-md text-on-surface-variant">{description}</span>
      </span>
      <Icon name="chevron_right" size={20} className="shrink-0 text-outline" />
    </Link>
  );
}

const groups = [
  {
    label: "Your profile",
    links: [
      {
        href: "/settings/personal",
        icon: "person",
        title: "Personal information",
        description: "Name, email, phone & life stage",
      },
      {
        href: "/settings/financial",
        icon: "currency_rupee",
        title: "Financial profile",
        description: "Income, commitments & savings style",
      },
    ],
  },
  {
    label: "App preferences",
    links: [
      {
        href: "/settings/notifications",
        icon: "notifications",
        title: "Notifications",
        description: "Milestones, summaries & reminders",
      },
      {
        href: "/settings/companion",
        icon: "auto_awesome",
        title: "AI Companion preferences",
        description: "Tone, prompts & coaching style",
      },
    ],
  },
  {
    label: "Data & support",
    links: [
      {
        href: "/settings/data",
        icon: "upload_file",
        title: "Financial data management",
        description: "CSV imports, history & estimates",
      },
      {
        href: "/settings/privacy",
        icon: "verified_user",
        title: "Privacy & security",
        description: "What this demo stores and never does",
      },
      {
        href: "/settings/help",
        icon: "help",
        title: "Help & support",
        description: "FAQs & app details",
      },
    ],
  },
] as const;

const limits = [
  "No accounts or sign-in. Data lives in this browser only.",
  "No database. Clearing browser storage resets the demo.",
  "No bank, UPI or SMS connection. CSV import only.",
  "No money movement, investments, lending or tax advice.",
  "No email or push notifications. In-app only.",
  "No dark theme, language switcher or biometric lock.",
];

export default function SettingsPage() {
  const router = useRouter();
  const data = useAppStore((state) => state.data);
  const resetDemo = useAppStore((state) => state.resetDemo);
  const startOnboarding = useAppStore((state) => state.startOnboarding);
  const showToast = useAppStore((state) => state.showToast);
  const [confirmOpen, setConfirmOpen] = useState(false);

  function handleReset() {
    resetDemo();
    setConfirmOpen(false);
    showToast("Demo workspace reset");
  }

  return (
    <>
      <TopBar title="Settings" subtitle="Demo data, privacy & prototype limits" backHref="/profile" />

      <main className="flex flex-col gap-4 px-4">
        {groups.map((group) => (
          <section key={group.label} aria-label={group.label} className="flex flex-col gap-2">
            <h2 className="px-1 font-label text-label-md text-on-surface-variant">{group.label}</h2>
            <Card className="divide-y divide-outline-variant/40">
              {group.links.map((item) => (
                <SettingsLink
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  title={item.title}
                  description={item.description}
                />
              ))}
            </Card>
          </section>
        ))}

        <Card className="flex flex-col gap-3 p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-headline text-headline-md text-on-surface">Demo workspace</h2>
            <Badge tone="accent" dot={false}>
              Sample data
            </Badge>
          </div>
          <p className="font-body text-body-md text-on-surface-variant">
            Every figure in this app is seeded sample data for Aarav Sharma. Changes you make are
            saved in this browser and are not shared with anyone.
          </p>
          <dl className="grid grid-cols-2 gap-2 rounded-lg bg-surface-low p-3">
            <div>
              <dt className="font-body text-label-md text-on-surface-variant">Seeded</dt>
              <dd className="font-body text-body-md tabular-nums text-on-surface">
                {data.meta.seededAt.slice(0, 10)}
              </dd>
            </div>
            <div>
              <dt className="font-body text-label-md text-on-surface-variant">Last reset</dt>
              <dd className="font-body text-body-md tabular-nums text-on-surface">
                {data.meta.lastResetAt ? data.meta.lastResetAt.slice(0, 10) : "Never"}
              </dd>
            </div>
          </dl>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                startOnboarding();
                router.push("/onboarding/welcome");
              }}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 font-label text-label-lg text-on-primary"
            >
              <Icon name="play_arrow" size={18} />
              Replay setup
            </button>
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-outline-variant bg-surface-lowest px-4 py-2.5 font-label text-label-lg text-on-surface"
            >
              <Icon name="restart_alt" size={18} />
              Reset demo data
            </button>
            <LogoutButton />
          </div>
          <p className="font-body text-body-md text-on-surface-variant">
            Replay setup starts a guided nine-screen flow and replaces this workspace only when you
            approve the final plan.
          </p>
        </Card>

        <section aria-label="Prototype limits" className="flex flex-col gap-2">
          <h2 className="font-headline text-headline-md text-on-surface">What this prototype does not do</h2>
          <Card className="p-4">
            <ul className="space-y-2">
              {limits.map((limit) => (
                <li key={limit} className="flex items-start gap-2 font-body text-body-md text-on-surface-variant">
                  <Icon name="block" size={16} className="mt-0.5 shrink-0 text-warning" />
                  <span>{limit}</span>
                </li>
              ))}
            </ul>
          </Card>
        </section>

        <section aria-label="Privacy" className="flex flex-col gap-2">
          <h2 className="font-headline text-headline-md text-on-surface">Privacy</h2>
          <Card className="space-y-2 p-4 font-body text-body-md text-on-surface-variant">
            <p>
              This demo keeps your goals, contributions, preferences and the seeded transactions in
              your browser&apos;s local storage. Nothing is uploaded to a server or database.
            </p>
            <p>
              When the Coach is connected, only aggregated context is sent to the Gemini API through
              a server route. Raw transaction descriptions, email and phone are never included.
            </p>
            <p>
              To erase everything, use Reset demo data below or clear this site&apos;s browser
              storage. The original sample workspace will be recreated on the next visit.
            </p>
          </Card>
        </section>

        <section aria-label="About" className="flex flex-col gap-2">
          <h2 className="font-headline text-headline-md text-on-surface">About</h2>
          <Card className="divide-y divide-outline-variant/40 px-4">
            <div className="flex items-center justify-between gap-3 py-3">
              <span className="font-body text-body-md text-on-surface-variant">App</span>
              <span className="font-body text-body-md text-on-surface">Artha</span>
            </div>
            <div className="flex items-center justify-between gap-3 py-3">
              <span className="font-body text-body-md text-on-surface-variant">Build</span>
              <span className="font-body text-body-md tabular-nums text-on-surface">0.1.0 · Demo</span>
            </div>
            <div className="flex items-center justify-between gap-3 py-3">
              <span className="font-body text-body-md text-on-surface-variant">Currency</span>
              <span className="font-body text-body-md text-on-surface">INR · English</span>
            </div>
          </Card>
        </section>

        <p className="pb-2 font-body text-label-md text-on-surface-variant">
          Artha provides planning guidance, not regulated financial advice.
        </p>
      </main>

      <Sheet
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Reset demo data?"
        description="This restores the sample workspace and removes any contributions or changes you made in this browser."
        footer={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-error px-4 py-2.5 font-label text-label-lg text-on-error"
            >
              Reset everything
            </button>
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-outline-variant bg-surface-lowest px-4 py-2.5 font-label text-label-lg"
            >
              Cancel
            </button>
          </div>
        }
      >
        <p className="font-body text-body-md text-on-surface-variant">
          Your seeded goals, plan and three months of transactions will be recreated with fresh dates.
          This cannot be undone.
        </p>
      </Sheet>
    </>
  );
}
