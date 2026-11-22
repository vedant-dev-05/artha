"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/app-store";
import { formatRupeeInput, parseRupeeInput } from "@/domain/money";
import type { IncomeFrequency, IncomePredictability } from "@/domain/types";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { AmountField } from "@/components/onboarding/amount-field";
import { OptionCard } from "@/components/onboarding/option-card";
import { Button } from "@/components/ui/button";

const frequencies: Array<{ value: IncomeFrequency; label: string; description: string }> = [
  { value: "monthly", label: "Monthly", description: "A regular payout each month" },
  { value: "weekly", label: "Weekly", description: "Paid every week or fortnight" },
  { value: "variable", label: "Per project", description: "Amount and timing change" },
];

const predictability: Array<{
  value: IncomePredictability;
  label: string;
  description: string;
}> = [
  { value: "predictable", label: "Steady", description: "Same every month" },
  { value: "somewhat_variable", label: "Varies", description: "Changes month to month" },
  { value: "highly_variable", label: "Unpredictable", description: "Hard to forecast" },
];

const changes: Array<{
  value: "similar" | "increase" | "dip";
  label: string;
  description: string;
}> = [
  { value: "similar", label: "Similar", description: "Likely to stay the same" },
  { value: "increase", label: "Increase", description: "Expecting a raise or more work" },
  { value: "dip", label: "Might dip", description: "A quieter period is likely" },
];

export default function IncomePage() {
  const router = useRouter();
  const draft = useAppStore((state) => state.onboardingDraft);
  const updateDraft = useAppStore((state) => state.updateOnboardingDraft);
  const setStep = useAppStore((state) => state.setOnboardingStep);

  const [amount, setAmount] = useState(
    draft?.incomeAmountPaise ? formatRupeeInput(draft.incomeAmountPaise) : "",
  );
  const [error, setError] = useState("");

  const frequency = draft?.incomeFrequency ?? "monthly";
  const predictabilityValue = draft?.incomePredictability ?? "predictable";
  const expectedChange = draft?.expectedIncomeChange ?? null;

  function handleContinue() {
    const parsed = parseRupeeInput(amount);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }
    setError("");
    updateDraft({ incomeAmountPaise: parsed.paise });
    setStep(4);
    router.push("/onboarding/expenses");
  }

  return (
    <OnboardingShell
      title="Income Information"
      step={3}
      backHref="/onboarding/aspirations"
      coachNote="For irregular income, we plan around your baseline month so you never feel behind when a client pays late."
    >
      <div className="space-y-1">
        <h2 className="font-headline text-headline-md text-on-surface">
          What does your typical monthly income look like?
        </h2>
        <p className="font-body text-body-md text-on-surface-variant">
          Tailored for {draft?.lifeStage?.replace("_", " ") ?? "your life stage"}. Use a rough
          three-month average if it changes often.
        </p>
      </div>

      <AmountField
        id="onboarding-income"
        label="Average monthly earnings (after tax)"
        value={amount}
        onChange={setAmount}
        placeholder="e.g. 58000"
        error={error}
      />

      <div className="space-y-2">
        <p className="font-label text-label-lg text-on-surface">How often do you get paid?</p>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Pay frequency">
          {frequencies.map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={frequency === option.value}
              onClick={() => updateDraft({ incomeFrequency: option.value })}
              className={`rounded-full border px-4 py-2 font-label text-label-md ${
                frequency === option.value
                  ? "border-primary bg-primary text-on-primary"
                  : "border-outline-variant bg-surface-lowest text-on-surface"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="font-label text-label-lg text-on-surface">How predictable is it?</p>
        <div className="flex flex-col gap-2" role="radiogroup" aria-label="Income predictability">
          {predictability.map((option) => (
            <OptionCard
              key={option.value}
              icon={option.value === "predictable" ? "verified_user" : "trending_up"}
              title={option.label}
              description={option.description}
              selected={predictabilityValue === option.value}
              onClick={() => updateDraft({ incomePredictability: option.value })}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="font-label text-label-lg text-on-surface">
          Any expected change in the next 6 months?
        </p>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Expected income change">
          {changes.map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={expectedChange === option.value}
              onClick={() => updateDraft({ expectedIncomeChange: option.value })}
              className={`rounded-full border px-3 py-2 font-label text-label-md ${
                expectedChange === option.value
                  ? "border-primary bg-secondary-container text-on-secondary-container"
                  : "border-outline-variant bg-surface-lowest text-on-surface"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <p className="font-body text-body-md text-on-surface-variant">
          We ask so the plan can avoid aggressive targets during slower months.
        </p>
      </div>

      <Button size="lg" fullWidth onClick={handleContinue}>
        Continue
      </Button>
    </OnboardingShell>
  );
}
