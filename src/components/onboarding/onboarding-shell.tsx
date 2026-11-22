"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useAppStore } from "@/store/app-store";
import { Icon } from "@/components/ui/icon";
import { InlineMessage } from "@/components/ui/states";

interface OnboardingShellProps {
  children: ReactNode;
  title: string;
  step?: number;
  backHref?: string;
  coachNote?: string;
}

const STEP_LABEL: Record<number, string> = {
  1: "Personal introduction",
  2: "Financial aspirations",
  3: "Income information",
  4: "Expenses & commitments",
  5: "Goal configuration",
  6: "Financial overview",
  7: "Personalised plan",
};

export function OnboardingShell({
  children,
  title,
  step,
  backHref,
  coachNote,
}: OnboardingShellProps) {
  const router = useRouter();
  const setEntryChoice = useAppStore((state) => state.setEntryChoice);

  function handleSaveAndExit() {
    setEntryChoice("demo");
    router.push("/home");
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-background">
      <header className="sticky top-0 z-10 bg-background/95 px-4 pb-3 pt-4 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            {backHref && (
              <Link
                href={backHref}
                aria-label="Back"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-on-surface hover:bg-surface-container"
              >
                <Icon name="arrow_back" size={20} />
              </Link>
            )}
            <div className="min-w-0">
              <p className="font-label text-label-sm text-on-surface-variant">Artha</p>
              <h1 className="truncate font-headline text-title-lg text-on-surface">{title}</h1>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {step && (
              <span className="font-label text-label-md text-on-surface-variant">
                Step {step} of 7
              </span>
            )}
            <button
              type="button"
              onClick={handleSaveAndExit}
              className="font-label text-label-md text-primary hover:underline"
            >
              Save &amp; exit
            </button>
          </div>
        </div>
        {step && (
          <div className="mt-3">
            <div
              className="h-1.5 overflow-hidden rounded-full bg-surface-container"
              role="progressbar"
              aria-valuemin={1}
              aria-valuemax={7}
              aria-valuenow={step}
              aria-label={STEP_LABEL[step] ?? `Step ${step}`}
            >
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-state-change"
                style={{ width: `${(step / 7) * 100}%` }}
              />
            </div>
          </div>
        )}
      </header>

      <main className="flex flex-1 flex-col gap-4 px-4 pb-8 pt-2">{children}</main>

      {coachNote && (
        <div className="sticky bottom-0 z-10 px-4 pb-4 pt-2">
          <div className="flex items-start gap-2 rounded-xl bg-primary px-3 py-3 text-on-primary shadow-lg">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-on-primary/15">
              <Icon name="auto_awesome" size={15} filled />
            </span>
            <div className="min-w-0">
              <p className="font-label text-label-sm text-on-primary/80">Artha Coach</p>
              <p className="font-body text-body-md">{coachNote}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function SetupNote({ children }: { children: ReactNode }) {
  return (
    <InlineMessage tone="info" icon="info">
      {children}
    </InlineMessage>
  );
}
