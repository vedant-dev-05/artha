"use client";

import Link from "next/link";
import { TopBar } from "@/components/navigation/top-bar";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";

const faqs = [
  {
    question: "Which CSV formats can I import?",
    answer:
      "Any generic CSV with a header row can be used. The importer lets you map which columns hold the date, description and debit, credit or signed amount. Artha does not verify or claim built-in support for specific banks or UPI apps.",
  },
  {
    question: "How does Artha handle irregular freelance income?",
    answer:
      "Set a conservative monthly baseline in your financial profile. The plan is built around that baseline, and you can record extra contributions in stronger months. Review the plan whenever your income pattern changes.",
  },
  {
    question: "What happens if I miss a monthly savings target?",
    answer:
      "Nothing breaks. Artha does not send warnings or penalties. You can log a smaller contribution, adjust a goal, or review the plan separately to consider a different target date.",
  },
  {
    question: "Where does my data live?",
    answer:
      "In this browser's localStorage only. There is no account, database or analytics. Raw CSV files are not retained; only import metadata and normalised transactions are kept. Use Reset demo data in Settings to restore the sample workspace.",
  },
  {
    question: "What can the Coach do and not do?",
    answer:
      "Coach is optional and uses aggregated context through a server route to offer guidance. Raw transaction descriptions, email and phone are never sent, and no API key is stored in the browser. It is not a regulated financial adviser and cannot move money.",
  },
];

export default function HelpPage() {
  return (
    <>
      <TopBar title="Help & support" subtitle="Answers & app details" backHref="/settings" />

      <main className="flex flex-col gap-4 px-4">
        <section aria-label="Frequently asked questions" className="flex flex-col gap-2">
          <h2 className="font-headline text-headline-md text-on-surface">Frequently asked</h2>
          <Card className="divide-y divide-outline-variant/40">
            {faqs.map((faq) => (
              <details key={faq.question} className="group p-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2 font-title text-title-md text-on-surface">
                  <span>{faq.question}</span>
                  <Icon
                    name="expand_more"
                    size={20}
                    className="shrink-0 text-on-surface-variant transition-transform group-open:rotate-180"
                  />
                </summary>
                <p className="pt-2 font-body text-body-md text-on-surface-variant">{faq.answer}</p>
              </details>
            ))}
          </Card>
        </section>

        <section aria-label="Useful destinations" className="flex flex-col gap-2">
          <h2 className="font-label text-label-md text-on-surface-variant">Useful destinations</h2>
          <Card className="divide-y divide-outline-variant/40">
            <Link
              href="/settings/data"
              className="flex items-center justify-between gap-3 p-4 transition-colors hover:bg-surface-low"
            >
              <span className="font-title text-title-md text-on-surface">Manage imported data</span>
              <Icon name="chevron_right" size={18} className="text-outline" />
            </Link>
            <Link
              href="/settings/privacy"
              className="flex items-center justify-between gap-3 p-4 transition-colors hover:bg-surface-low"
            >
              <span className="font-title text-title-md text-on-surface">
                Privacy &amp; security
              </span>
              <Icon name="chevron_right" size={18} className="text-outline" />
            </Link>
          </Card>
        </section>

        <Card className="flex items-center justify-between gap-3 p-4">
          <div className="min-w-0">
            <p className="font-title text-title-md text-on-surface">Artha Personal Finance</p>
            <p className="font-body text-body-md text-on-surface-variant">
              Goal-first financial companion · INR · English
            </p>
          </div>
          <span className="shrink-0 font-label text-label-md tabular-nums text-on-surface-variant">
            v0.1.0 · Demo
          </span>
        </Card>

        <p className="pb-2 font-body text-label-md text-on-surface-variant">
          This prototype has no support inbox or contact channel. Artha provides planning guidance,
          not regulated financial advice.
        </p>
      </main>
    </>
  );
}
