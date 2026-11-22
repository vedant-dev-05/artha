"use client";

import { useMemo, useState } from "react";
import { GOAL_CATEGORY_OPTIONS, validateGoalInput, type GoalInput } from "@/domain/goals";
import { formatINR } from "@/domain/money";
import { todayISO } from "@/domain/dates";
import { getCapacity } from "@/domain/selectors";
import { checkGoalFeasibility } from "@/domain/goals";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { InlineMessage } from "@/components/ui/states";
import type { Goal, GoalCategory, Priority } from "@/domain/types";

interface GoalFormProps {
  mode: "create" | "edit";
  initial?: GoalInput;
  submitLabel: string;
  onSubmit: (input: GoalInput) => void;
  secondaryLabel?: string;
  onSecondary?: (input: GoalInput) => void;
  lockedSavedPaise?: boolean;
}

const priorityOptions: Array<{ value: Priority; label: string }> = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

function parseAmount(raw: string, allowZero = false): { value: number; error?: string } {
  const cleaned = raw.replace(/[₹,\s]/g, "");
  if (cleaned.length === 0) return allowZero ? { value: 0 } : { value: 0, error: "Enter an amount." };
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) {
    return { value: 0, error: "Use digits only, with up to 2 decimal places." };
  }
  const [whole, fraction = ""] = cleaned.split(".");
  const value = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(value)) return { value: 0, error: "That amount is too large." };
  if (value === 0 && !allowZero) return { value, error: "Amount must be greater than zero." };
  return { value };
}

export function GoalForm({
  mode,
  initial,
  submitLabel,
  onSubmit,
  secondaryLabel,
  onSecondary,
  lockedSavedPaise = false,
}: GoalFormProps) {
  const data = useAppStore((state) => state.data);
  const capacity = getCapacity(data);
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState<GoalCategory>(initial?.category ?? "custom");
  const [target, setTarget] = useState(
    initial ? String(Math.round(initial.targetPaise / 100)) : "",
  );
  const [saved, setSaved] = useState(
    initial ? String(Math.round(initial.savedPaise / 100)) : "0",
  );
  const [targetDate, setTargetDate] = useState(initial?.targetDate ?? "");
  const [priority, setPriority] = useState<Priority>(initial?.priority ?? "medium");
  const [note, setNote] = useState(initial?.note ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const draftGoal = useMemo<Goal>(
    () => ({
      id: "preview",
      name: name || "New goal",
      category,
      targetPaise: 100,
      targetDate: targetDate || null,
      priority,
      status: "active",
      icon: "flag",
      note: null,
      createdAt: "",
      updatedAt: "",
    }),
    [name, category, targetDate, priority],
  );

  const preview = useMemo(() => {
    const parsed = parseAmount(target);
    const savedParsed = parseAmount(saved, true);
    if (!parsed.value || parsed.error || savedParsed.error) return null;
    if (savedParsed.value > parsed.value) return null;
    return checkGoalFeasibility(
      { ...draftGoal, targetPaise: parsed.value },
      savedParsed.value,
      capacity.capacityPaise,
      todayISO(),
    );
  }, [draftGoal, target, saved, capacity.capacityPaise]);

  function buildInput(): GoalInput | null {
    const parsedTarget = parseAmount(target);
    const parsedSaved = parseAmount(saved, true);
    const nextErrors: Record<string, string> = {};
    if (parsedTarget.error) nextErrors.targetPaise = parsedTarget.error;
    if (parsedSaved.error) nextErrors.savedPaise = parsedSaved.error;
    const input: GoalInput = {
      name,
      category,
      targetPaise: parsedTarget.value,
      savedPaise: parsedSaved.value,
      targetDate: targetDate || null,
      priority,
      note: note.trim() || null,
    };
    const domainErrors = validateGoalInput(input);
    for (const [key, value] of Object.entries(domainErrors)) {
      if (value && !nextErrors[key]) nextErrors[key] = value;
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return null;
    return input;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>, action?: (input: GoalInput) => void) {
    event.preventDefault();
    const input = buildInput();
    if (!input) return;
    (action ?? onSubmit)(input);
  }

  return (
    <form onSubmit={(event) => handleSubmit(event)} className="flex flex-col gap-4">
      <section className="flex flex-col gap-2">
        <label htmlFor="goal-name" className="font-label text-label-lg text-on-surface">
          Goal name
        </label>
        <input
          id="goal-name"
          value={name}
          maxLength={60}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Emergency Fund"
          className="min-h-12 rounded-md border border-outline-variant bg-surface-lowest px-3 font-body text-body-lg outline-none placeholder:text-outline focus:border-primary"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "goal-name-error" : undefined}
        />
        {errors.name && <FieldError id="goal-name-error">{errors.name}</FieldError>}
      </section>

      <section className="flex flex-col gap-2">
        <p className="font-label text-label-lg text-on-surface">Category</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {GOAL_CATEGORY_OPTIONS.map((option) => {
            const selected = option.value === category;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setCategory(option.value)}
                aria-pressed={selected}
                className={`flex min-h-11 items-center gap-2 rounded-lg border px-3 py-2 text-left font-body text-body-md transition-colors ${
                  selected
                    ? "border-primary bg-secondary-container text-on-secondary-container"
                    : "border-outline-variant bg-surface-lowest text-on-surface-variant hover:bg-surface-low"
                }`}
              >
                <Icon name={option.icon} size={18} />
                <span className="truncate">{option.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="goal-target" className="font-label text-label-lg text-on-surface">
            Target amount
          </label>
          <div className="flex items-center gap-2 rounded-md border border-outline-variant bg-surface-lowest px-3 focus-within:border-primary">
            <span className="font-title text-title-lg text-on-surface-variant">₹</span>
            <input
              id="goal-target"
              inputMode="decimal"
              value={target}
              onChange={(event) => setTarget(event.target.value)}
              placeholder="0"
              className="min-h-12 w-full bg-transparent font-title text-title-lg tabular-nums outline-none placeholder:text-outline"
              aria-invalid={Boolean(errors.targetPaise)}
              aria-describedby={errors.targetPaise ? "goal-target-error" : undefined}
            />
          </div>
          {errors.targetPaise && <FieldError id="goal-target-error">{errors.targetPaise}</FieldError>}
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="goal-saved" className="font-label text-label-lg text-on-surface">
            Already saved
          </label>
          <div className="flex items-center gap-2 rounded-md border border-outline-variant bg-surface-lowest px-3 focus-within:border-primary">
            <span className="font-title text-title-lg text-on-surface-variant">₹</span>
            <input
              id="goal-saved"
              inputMode="decimal"
              value={saved}
              disabled={lockedSavedPaise}
              onChange={(event) => setSaved(event.target.value)}
              placeholder="0"
              className="min-h-12 w-full bg-transparent font-title text-title-lg tabular-nums outline-none placeholder:text-outline disabled:opacity-70"
              aria-invalid={Boolean(errors.savedPaise)}
              aria-describedby={errors.savedPaise ? "goal-saved-error" : undefined}
            />
          </div>
          {lockedSavedPaise && (
            <p className="font-body text-label-md text-on-surface-variant">
              Logged contributions are changed from the goal screen.
            </p>
          )}
          {errors.savedPaise && <FieldError id="goal-saved-error">{errors.savedPaise}</FieldError>}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="goal-date" className="font-label text-label-lg text-on-surface">
            Desired completion date
          </label>
          <input
            id="goal-date"
            type="date"
            value={targetDate}
            min={todayISO()}
            onChange={(event) => setTargetDate(event.target.value)}
            className="min-h-12 rounded-md border border-outline-variant bg-surface-lowest px-3 font-body text-body-lg outline-none focus:border-primary"
            aria-invalid={Boolean(errors.targetDate)}
            aria-describedby={errors.targetDate ? "goal-date-error" : "goal-date-hint"}
          />
          {errors.targetDate ? (
            <FieldError id="goal-date-error">{errors.targetDate}</FieldError>
          ) : (
            <p id="goal-date-hint" className="font-body text-label-md text-on-surface-variant">
              Leave empty to assume a 12-month horizon.
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <p className="font-label text-label-lg text-on-surface">Priority</p>
          <div className="grid grid-cols-3 gap-1 rounded-lg border border-outline-variant bg-surface-lowest p-1">
            {priorityOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setPriority(option.value)}
                aria-pressed={priority === option.value}
                className={`min-h-10 rounded-md font-label text-label-md transition-colors ${
                  priority === option.value
                    ? "bg-primary text-on-primary"
                    : "text-on-surface-variant hover:bg-surface-container"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <label htmlFor="goal-note" className="font-label text-label-lg text-on-surface">
          Why this goal matters <span className="font-body text-label-md text-on-surface-variant">(optional)</span>
        </label>
        <input
          id="goal-note"
          value={note}
          maxLength={240}
          onChange={(event) => setNote(event.target.value)}
          placeholder="A short reminder for future you"
          className="min-h-12 rounded-md border border-outline-variant bg-surface-lowest px-3 font-body text-body-lg outline-none placeholder:text-outline focus:border-primary"
        />
      </section>

      <Card variant="action" className="flex flex-col gap-2 p-4">
        <p className="font-label text-label-md text-primary">Estimated savings needed</p>
        {preview ? (
          <>
            <p className="font-display text-headline-md tabular-nums text-on-surface">
              {formatINR(preview.requiredMonthlyPaise)}/month
            </p>
            <p className="font-body text-body-md text-on-surface-variant">
              Over {preview.months} {preview.months === 1 ? "month" : "months"} ·{" "}
              {preview.feasible ? "fits your current capacity" : "above your current capacity"}
            </p>
            {preview.warnings.map((warning) => (
              <p key={warning} className="font-body text-body-md text-on-surface-variant">
                • {warning}
              </p>
            ))}
          </>
        ) : (
          <p className="font-body text-body-md text-on-surface-variant">
            Enter a target to see an estimate. Capacity is {formatINR(capacity.capacityPaise)}/month.
          </p>
        )}
        <p className="font-body text-label-md text-on-surface-variant">
          Capacity already excludes essentials, commitments, protected spending and the safety buffer.
        </p>
      </Card>

      {Object.keys(errors).length > 0 && (
        <InlineMessage tone="error" icon="error">
          Check the highlighted fields before continuing.
        </InlineMessage>
      )}

      <div className="flex flex-col gap-2">
        <Button type="submit" fullWidth>
          {submitLabel}
        </Button>
        {secondaryLabel && onSecondary && (
          <Button
            type="button"
            variant="outline"
            fullWidth
            onClick={(event) => {
              const input = buildInput();
              if (input) onSecondary(input);
            }}
          >
            {secondaryLabel}
          </Button>
        )}
      </div>
      {mode === "create" && (
        <p className="pb-2 font-body text-label-md text-on-surface-variant">
          Saving a goal does not change your active plan. You will review any plan update separately.
        </p>
      )}
    </form>
  );
}

function FieldError({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p id={id} role="alert" className="flex items-center gap-1 font-body text-body-md text-error">
      <Icon name="error" size={14} /> {children}
    </p>
  );
}
