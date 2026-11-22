"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/app-store";
import { formatRupeeInput, parseRupeeInput } from "@/domain/money";
import { todayISO } from "@/domain/dates";
import type { Priority } from "@/domain/types";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { AmountField } from "@/components/onboarding/amount-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { Icon } from "@/components/ui/icon";

interface GoalFields {
  name: string;
  target: string;
  saved: string;
  date: string;
  priority: Priority;
}

const PRIORITIES: Array<{ value: Priority; label: string }> = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export default function GoalConfigPage() {
  const router = useRouter();
  const draft = useAppStore((state) => state.onboardingDraft);
  const updateGoal = useAppStore((state) => state.updateOnboardingGoal);
  const setStep = useAppStore((state) => state.setOnboardingStep);

  const goals = draft?.goals ?? [];
  const [fields, setFields] = useState<GoalFields[]>(() =>
    goals.map((goal) => ({
      name: goal.name,
      target: formatRupeeInput(goal.targetPaise),
      saved: goal.savedPaise ? formatRupeeInput(goal.savedPaise) : "",
      date: goal.targetDate ?? "",
      priority: goal.priority,
    })),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  function updateField(index: number, patch: Partial<GoalFields>) {
    setFields((current) => current.map((item, position) => (position === index ? { ...item, ...patch } : item)));
    setErrors((current) => ({ ...current, [`${index}`]: "" }));
  }

  function handleContinue() {
    const nextErrors: Record<string, string> = {};
    const parsed = fields.map((field, index) => {
      const target = parseRupeeInput(field.target);
      const saved = field.saved.trim().length === 0 ? { ok: true as const, paise: 0 } : parseRupeeInput(field.saved);

      if (field.name.trim().length === 0) nextErrors[`${index}-name`] = "Give this goal a name.";
      if (!target.ok) nextErrors[`${index}-target`] = target.error;
      if (!saved.ok) nextErrors[`${index}-saved`] = saved.error;
      if (field.date && field.date < todayISO()) {
        nextErrors[`${index}-date`] = "Choose today or a later date.";
      }
      return {
        name: field.name.trim(),
        targetPaise: target.ok ? target.paise : 0,
        savedPaise: saved.ok ? saved.paise : 0,
        targetDate: field.date || null,
        priority: field.priority,
      };
    });

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    parsed.forEach((goal, index) => updateGoal(index, goal));
    setStep(6);
    router.push("/onboarding/overview");
  }

  return (
    <OnboardingShell
      title="Goal Configuration"
      step={5}
      backHref="/onboarding/expenses"
      coachNote="Aiming for about three months of essential expenses is a solid Emergency Fund target."
    >
      <div className="space-y-1">
        <h2 className="font-headline text-headline-md text-on-surface">Shape your selected goals</h2>
        <p className="font-body text-body-md text-on-surface-variant">
          Targets and timelines are estimates. You can change them any time.
        </p>
      </div>

      {goals.length === 0 ? (
        <EmptyState
          icon="flag"
          title="No goals selected yet"
          description="Choose at least one aspiration so Artha can build a plan."
          action={
            <Link
              href="/onboarding/aspirations"
              className="font-label text-label-lg text-primary underline underline-offset-4"
            >
              Choose aspirations
            </Link>
          }
        />
      ) : (
        fields.map((field, index) => {
          const goal = goals[index];
          return (
            <Card key={goal.key} className="flex flex-col gap-4 p-4">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
                  <Icon name={goal.icon} size={18} />
                </span>
                <p className="font-title text-title-md text-on-surface">
                  {index + 1}. {goal.key === "emergency" ? "Emergency" : field.name || "New goal"}
                </p>
              </div>

              <div className="space-y-1.5">
                <label htmlFor={`goal-name-${index}`} className="font-label text-label-lg text-on-surface">
                  Goal name
                </label>
                <input
                  id={`goal-name-${index}`}
                  value={field.name}
                  maxLength={60}
                  onChange={(event) => updateField(index, { name: event.target.value })}
                  className="min-h-12 w-full rounded-md border border-outline-variant bg-surface-lowest px-3 font-body text-body-lg outline-none focus:border-primary"
                />
                {errors[`${index}-name`] && (
                  <p role="alert" className="font-body text-body-md text-error">
                    {errors[`${index}-name`]}
                  </p>
                )}
              </div>

              <AmountField
                id={`goal-target-${index}`}
                label="Target amount"
                value={field.target}
                onChange={(value) => updateField(index, { target: value })}
                error={errors[`${index}-target`]}
              />
              <AmountField
                id={`goal-saved-${index}`}
                label="Already saved"
                value={field.saved}
                onChange={(value) => updateField(index, { saved: value })}
                placeholder="0"
                error={errors[`${index}-saved`]}
              />

              <div className="space-y-1.5">
                <label htmlFor={`goal-date-${index}`} className="font-label text-label-lg text-on-surface">
                  Desired completion date
                </label>
                <input
                  id={`goal-date-${index}`}
                  type="date"
                  value={field.date}
                  min={todayISO()}
                  onChange={(event) => updateField(index, { date: event.target.value })}
                  className="min-h-12 w-full rounded-md border border-outline-variant bg-surface-lowest px-3 font-body text-body-lg outline-none focus:border-primary"
                />
                {errors[`${index}-date`] && (
                  <p role="alert" className="font-body text-body-md text-error">
                    {errors[`${index}-date`]}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <p className="font-label text-label-lg text-on-surface">Priority level</p>
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={`Priority for ${field.name}`}>
                  {PRIORITIES.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={field.priority === option.value}
                      onClick={() => updateField(index, { priority: option.value })}
                      className={`rounded-full border px-4 py-2 font-label text-label-md ${
                        field.priority === option.value
                          ? "border-primary bg-primary text-on-primary"
                          : "border-outline-variant bg-surface-lowest text-on-surface"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          );
        })
      )}

      <Button size="lg" fullWidth disabled={goals.length === 0} onClick={handleContinue}>
        Review financial overview
      </Button>
    </OnboardingShell>
  );
}
