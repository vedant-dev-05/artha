"use client";

import Link from "next/link";
import { useAppStore } from "@/store/app-store";
import { getActivePlan, getCapacity } from "@/domain/selectors";
import { formatINR } from "@/domain/money";
import { CoachChat } from "@/components/coach/coach-chat";
import { TopBar } from "@/components/navigation/top-bar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";

export default function CoachPage() {
  const data = useAppStore((state) => state.data);
  const plan = getActivePlan(data);
  const capacity = getCapacity(data);

  return (
    <>
      <TopBar
        title="Artha Coach"
        subtitle="Supportive guidance, grounded in your numbers"
        trailing={<Badge tone="neutral" dot={false}>Demo</Badge>}
      />

      <main className="flex flex-col gap-4 px-4">
        <Card className="flex items-center gap-3 p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
            <Icon name="auto_awesome" size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-body text-body-md text-on-surface-variant">
              {formatINR(capacity.capacityPaise)}/mo capacity ·{" "}
              {plan ? `Plan v${plan.version} active` : "No active plan"}
            </p>
            <p className="font-body text-label-md text-on-surface-variant">
              Coach sees aggregates only. Approve plan changes on the Plan screen or in chat.
            </p>
          </div>
          <Link
            href="/plan/proposal"
            className="shrink-0 rounded-full border border-outline-variant bg-surface-lowest px-3 py-2 font-label text-label-md text-on-surface"
          >
            Drafts
          </Link>
        </Card>

        <CoachChat screen="coach" />
      </main>
    </>
  );
}
