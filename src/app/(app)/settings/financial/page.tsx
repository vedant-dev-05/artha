"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useAppStore } from "@/store/app-store";
import { formatRupeeInput, parseRupeeInput } from "@/domain/money";
import type {
  CompanionTone,
  IncomeFrequency,
  IncomePredictability,
  IncomeType,
  SavingsFlexibility,
} from "@/domain/types";
import { TopBar } from "@/components/navigation/top-bar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { InlineMessage } from "@/components/ui/states";

const incomeTypes: Array<{ value: IncomeType; label: string }> = [
  { value: "regular", label: "Regular / salaried" },
  { value: "irregular", label: "Irregular / project-based" },
  { value: "allowance", label: "Allowance / stipend" },
  { value: "mixed", label: "Mixed sources" },
  { value: "unknown", label: "Not sure yet" },
];

const frequencies: Array<{ value: IncomeFrequency; label: string }> = [
  { value: "monthly", label: "Monthly" },
  { value: "weekly", label: "Weekly" },
  { value: "variable", label: "Per project / variable" },
  { value: "other", label: "Other" },
];

const predictabilityOptions: Array<{ value: IncomePredictability; label: string }> = [
  { value: "predictable", label: "Steady" },
  { value: "somewhat_variable", label: "Varies month to month" },
  { value: "highly_variable", label: "Hard to forecast" },
];

const flexibilityOptions: Array<{ value: SavingsFlexibility; label: string }> = [
  { value: "flexible", label: "Flexible" },
  { value: "balanced", label: "Balanced" },
  { value: "structured", label: "Structured" },
];

const toneOptions: Array<{ value: CompanionTone; label: string }> = [
  { value: "warm", label: "Warm & encouraging" },
  { value: "concise", label: "Concise & direct" },
  { value: "on_demand", label: "On-demand only" },
];

const fieldClass =
  "min-h-12 w-full rounded-md border border-outline-variant bg-surface-lowest px-3 font-body text-body-lg text-on-surface outline-none placeholder:text-outline focus:border-primary";
const selectClass =
  "min-h-12 w-full rounded-md border border-outline-variant bg-surface-lowest px-3 font-body text-body-md text-on-surface outline-none focus:border-primary";

function readMoney(
  raw: string,
  key: string,
  errors: Record<string, string>,
  allowZero = false,
): number {
  if (allowZero && /^0(?:\.0{1,2})?$/.test(raw.replace(/[₹,\s]/g, ""))) return 0;
  const parsed = parseRupeeInput(raw);
  if (!parsed.ok) {
    errors[key] = parsed.error;
    return 0;
  }
  return parsed.paise;
}

export default function FinancialProfilePage() {
  const profile = useAppStore((state) => state.data.profile);
  const preferences = useAppStore((state) => state.data.preferences);
  const updateProfile = useAppStore((state) => state.updateProfile);
  const updatePreferences = useAppStore((state) => state.updatePreferences);
  const showToast = useAppStore((state) => state.showToast);

  const [incomeType, setIncomeType] = useState<IncomeType>(profile.incomeType);
  const [incomeFrequency, setIncomeFrequency] = useState<IncomeFrequency>(profile.incomeFrequency);
  const [incomePredictability, setIncomePredictability] = useState<IncomePredictability>(
    profile.incomePredictability,
  );
  const [incomeAmount, setIncomeAmount] = useState(formatRupeeInput(profile.incomeAmountPaise));
  const [essentials, setEssentials] = useState(formatRupeeInput(profile.essentialExpensesPaise));
  const [commitments, setCommitments] = useState(formatRupeeInput(profile.commitmentsPaise));
  const [protectedSpending, setProtectedSpending] = useState(
    formatRupeeInput(profile.protectedSpendingPaise),
  );
  const [existingSavings, setExistingSavings] = useState(
    formatRupeeInput(profile.existingSavingsPaise),
  );
  const [savingsFlexibility, setSavingsFlexibility] = useState<SavingsFlexibility>(
    preferences.savingsFlexibility,
  );
  const [bufferPercent, setBufferPercent] = useState(String(preferences.bufferPercent));
  const [bufferMinimum, setBufferMinimum] = useState(
    formatRupeeInput(preferences.bufferMinimumPaise),
  );
  const [companionTone, setCompanionTone] = useState<CompanionTone>(preferences.companionTone);
  const [proactiveSuggestions, setProactiveSuggestions] = useState(
    preferences.proactiveSuggestions,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};

    const incomeAmountPaise = readMoney(incomeAmount, "incomeAmount", nextErrors);
    const essentialExpensesPaise = readMoney(essentials, "essentials", nextErrors);
    const commitmentsPaise = readMoney(commitments, "commitments", nextErrors);
    const protectedSpendingPaise = readMoney(protectedSpending, "protectedSpending", nextErrors);
    const existingSavingsPaise = readMoney(existingSavings, "existingSavings", nextErrors, true);
    const bufferMinimumPaise = readMoney(bufferMinimum, "bufferMinimum", nextErrors);

    const percent = Number(bufferPercent);
    if (!Number.isInteger(percent) || percent < 1 || percent > 50) {
      nextErrors.bufferPercent = "Choose a buffer between 1% and 50%.";
    }
    if (!nextErrors.bufferMinimum && bufferMinimumPaise < 50000) {
      nextErrors.bufferMinimum = "The minimum buffer must be at least ₹500.";
    }

    setErrors(nextErrors);
    setSaved(false);
    if (Object.keys(nextErrors).length > 0) return;

    updateProfile({
      incomeType,
      incomeAmountPaise,
      incomeFrequency,
      incomePredictability,
      essentialExpensesPaise,
      commitmentsPaise,
      protectedSpendingPaise,
      existingSavingsPaise,
    });
    updatePreferences({
      savingsFlexibility,
      bufferPercent: percent,
      bufferMinimumPaise,
      companionTone,
      proactiveSuggestions,
    });
    showToast("Financial profile saved");
    setSaved(true);
  }

  function moneyField(
    id: string,
    label: string,
    value: string,
    onChange: (value: string) => void,
    hint?: string,
  ) {
    return (
      <div className="space-y-1.5">
        <label htmlFor={id} className="font-label text-label-lg text-on-surface">
          {label}
        </label>
        <div className="flex items-center gap-2 rounded-md border border-outline-variant bg-surface-lowest px-3 focus-within:border-primary">
          <span className="font-title text-title-lg text-on-surface-variant">₹</span>
          <input
            id={id}
            inputMode="decimal"
            autoComplete="off"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="0"
            aria-invalid={Boolean(errors[id])}
            className="min-h-12 w-full bg-transparent font-title text-title-lg tabular-nums text-on-surface outline-none placeholder:text-outline"
          />
        </div>
        {errors[id] && (
          <p role="alert" className="font-body text-body-md text-error">
            {errors[id]}
          </p>
        )}
        {!errors[id] && hint && (
          <p className="font-body text-body-md text-on-surface-variant">{hint}</p>
        )}
      </div>
    );
  }

  return (
    <>
      <TopBar
        title="Financial profile"
        subtitle="Income, commitments & savings style"
        backHref="/settings"
      />

      <main className="flex flex-col gap-4 px-4">
        <InlineMessage tone="warning" icon="info">
          <p className="font-label text-label-lg text-on-warning-container">
            Changes can affect your plan
          </p>
          <p>
            Saving updates your estimates only. Your active plan is not recalculated or activated
            automatically; that needs a separate review.
          </p>
        </InlineMessage>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Card className="flex flex-col gap-4 p-4">
            <h2 className="font-headline text-headline-md text-on-surface">Income &amp; commitments</h2>
            <div className="space-y-1.5">
              <label htmlFor="financial-income-type" className="font-label text-label-lg text-on-surface">
                Income pattern
              </label>
              <select
                id="financial-income-type"
                value={incomeType}
                onChange={(event) => setIncomeType(event.target.value as IncomeType)}
                className={selectClass}
              >
                {incomeTypes.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="financial-frequency" className="font-label text-label-lg text-on-surface">
                  Income frequency
                </label>
                <select
                  id="financial-frequency"
                  value={incomeFrequency}
                  onChange={(event) => setIncomeFrequency(event.target.value as IncomeFrequency)}
                  className={selectClass}
                >
                  {frequencies.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="financial-predictability" className="font-label text-label-lg text-on-surface">
                  Predictability
                </label>
                <select
                  id="financial-predictability"
                  value={incomePredictability}
                  onChange={(event) =>
                    setIncomePredictability(event.target.value as IncomePredictability)
                  }
                  className={selectClass}
                >
                  {predictabilityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {moneyField(
              "incomeAmount",
              "Monthly income estimate",
              incomeAmount,
              setIncomeAmount,
              "Use a three-month average when income varies.",
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {moneyField("essentials", "Essentials", essentials, setEssentials)}
              {moneyField("commitments", "Fixed commitments", commitments, setCommitments)}
              {moneyField("protectedSpending", "Protected spending", protectedSpending, setProtectedSpending)}
              {moneyField("existingSavings", "Existing savings", existingSavings, setExistingSavings, "Enter 0 if you have none saved yet.")}
            </div>
          </Card>

          <Card className="flex flex-col gap-4 p-4">
            <h2 className="font-headline text-headline-md text-on-surface">Savings &amp; preferences</h2>
            <div className="space-y-1.5">
              <label htmlFor="financial-flexibility" className="font-label text-label-lg text-on-surface">
                Savings flexibility
              </label>
              <select
                id="financial-flexibility"
                value={savingsFlexibility}
                onChange={(event) =>
                  setSavingsFlexibility(event.target.value as SavingsFlexibility)
                }
                className={selectClass}
              >
                {flexibilityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="financial-buffer-percent" className="font-label text-label-lg text-on-surface">
                  Buffer percent
                </label>
                <input
                  id="financial-buffer-percent"
                  inputMode="numeric"
                  value={bufferPercent}
                  onChange={(event) => setBufferPercent(event.target.value.replace(/[^\d]/g, ""))}
                  placeholder="10"
                  aria-invalid={Boolean(errors.bufferPercent)}
                  className={fieldClass}
                />
                {errors.bufferPercent && (
                  <p role="alert" className="font-body text-body-md text-error">
                    {errors.bufferPercent}
                  </p>
                )}
              </div>
              {moneyField("bufferMinimum", "Minimum buffer", bufferMinimum, setBufferMinimum, "At least ₹500.")}
            </div>
            <div className="space-y-1.5">
              <label htmlFor="financial-tone" className="font-label text-label-lg text-on-surface">
                Companion tone
              </label>
              <select
                id="financial-tone"
                value={companionTone}
                onChange={(event) => setCompanionTone(event.target.value as CompanionTone)}
                className={selectClass}
              >
                {toneOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Link
                href="/settings/companion"
                className="inline-flex items-center gap-1 font-label text-label-md text-primary hover:underline"
              >
                All companion preferences
                <Icon name="arrow_forward" size={14} />
              </Link>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-outline-variant/40 pt-3">
              <div className="min-w-0">
                <p className="font-title text-title-md text-on-surface">Proactive suggestions</p>
                <p className="font-body text-body-md text-on-surface-variant">
                  Let Coach spot surplus funds and milestone opportunities.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={proactiveSuggestions}
                aria-label="Toggle proactive suggestions"
                onClick={() => setProactiveSuggestions((current) => !current)}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors ${
                  proactiveSuggestions ? "bg-primary" : "bg-surface-container-high"
                }`}
              >
                <span
                  className={`h-5 w-5 rounded-full shadow-sm transition-transform ${
                    proactiveSuggestions
                      ? "translate-x-5 bg-on-primary"
                      : "translate-x-0 bg-surface-lowest"
                  }`}
                />
              </button>
            </div>
          </Card>

          <Button type="submit" size="lg" fullWidth>
            Save profile changes
          </Button>
        </form>

        {saved && (
          <InlineMessage tone="success" icon="check_circle">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span>Profile updated. Recalculation needs a separate plan review.</span>
              <Link
                href="/plan/proposal"
                className="inline-flex min-h-9 items-center gap-1 rounded-full bg-primary px-3 font-label text-label-md text-on-primary"
              >
                Review updated plan
                <Icon name="arrow_forward" size={14} />
              </Link>
            </div>
          </InlineMessage>
        )}

        <p className="pb-2 font-body text-label-md text-on-surface-variant">
          Estimates are saved in this browser. Nothing here proposes or activates a plan on its own.
        </p>
      </main>
    </>
  );
}
