"use client";

import Link from "next/link";
import { TopBar } from "@/components/navigation/top-bar";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { InlineMessage } from "@/components/ui/states";

const limits = [
  "No account, sign-in or database. Data lives in this browser's localStorage only.",
  "No bank, UPI or SMS connection. Transactions come from CSV files you choose, or manual entry.",
  "No biometric lock, PIN or password screen in this prototype.",
  "No analytics, advertising trackers or third-party data sharing.",
  "No raw transaction descriptions, email or phone are sent to Coach.",
  "No Gemini key in the browser; any API key is configured server-side only.",
];

export default function PrivacyPage() {
  return (
    <>
      <TopBar
        title="Privacy & security"
        subtitle="Your data stays yours"
        backHref="/settings"
      />

      <main className="flex flex-col gap-4 px-4">
        <InlineMessage tone="info" icon="lock">
          Artha is a local demo. Everything you change is saved in this browser and is not uploaded
          to a server or database.
        </InlineMessage>

        <section aria-label="What is stored" className="flex flex-col gap-2">
          <h2 className="px-1 font-label text-label-md text-on-surface-variant">What is stored</h2>
          <Card className="space-y-2 p-4 font-body text-body-md text-on-surface-variant">
            <p>
              Your profile estimates, goals, contributions, preferences and manual entries are kept
              in localStorage.
            </p>
            <p>
              For CSV imports, only import metadata and normalised transactions are kept. The raw CSV
              file itself is never retained.
            </p>
            <p>
              Clearing this site&apos;s browser storage removes the workspace. The original sample
              data is recreated the next time you open Artha.
            </p>
          </Card>
        </section>

        <section aria-label="Limits of this prototype" className="flex flex-col gap-2">
          <h2 className="px-1 font-label text-label-md text-on-surface-variant">
            Limits of this prototype
          </h2>
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

        <section aria-label="Coach" className="flex flex-col gap-2">
          <h2 className="px-1 font-label text-label-md text-on-surface-variant">Coach</h2>
          <Card className="space-y-2 p-4 font-body text-body-md text-on-surface-variant">
            <p>
              Coach is optional. When connected, it receives aggregated context through a server
              route so answers can reflect your goals and cashflow.
            </p>
            <p>
              Raw transaction descriptions, email and phone are excluded. No API key is stored in
              the browser; a Gemini key, if configured, stays server-side.
            </p>
          </Card>
        </section>

        <section aria-label="Erasing your demo" className="flex flex-col gap-2">
          <h2 className="px-1 font-label text-label-md text-on-surface-variant">Erasing your demo</h2>
          <Card className="flex flex-col gap-3 p-4">
            <p className="font-body text-body-md text-on-surface-variant">
              To erase this workspace, use Reset demo data on the settings home screen. That action
              stays there so it cannot be triggered by mistake from this page.
            </p>
            <Link
              href="/settings"
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-outline-variant bg-surface-lowest px-4 font-label text-label-lg text-on-surface transition-colors hover:border-primary/40"
            >
              Go to settings
              <Icon name="arrow_forward" size={16} />
            </Link>
          </Card>
        </section>

        <p className="pb-2 font-body text-label-md text-on-surface-variant">
          Artha provides planning guidance, not regulated financial advice.
        </p>
      </main>
    </>
  );
}
