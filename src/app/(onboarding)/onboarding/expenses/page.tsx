"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/app-store";
import { formatRupeeInput, parseRupeeInput } from "@/domain/money";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { AmountField } from "@/components/onboarding/amount-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";

interface Fields {
  fixed: string;
  variable: string;
  commitments: string;
  savings: string;
  protected: string;
}

export default function ExpensesPage() {
  const router = useRouter();
  const draft = useAppStore((state) => state.onboardingDraft);
  const updateDraft = useAppStore((state) => state.updateOnboardingDraft);
  const updateGoal = useAppStore((state) => state.updateOnboardingGoal);
  const setStep = useAppStore((state) => state.setOnboardingStep);

  const [fields, setFields] = useState<Fields>({
    fixed: draft?.essentialExpensesPaise ? formatRupeeInput(draft.essentialExpensesPaise) : "",
    variable: draft?.variableExpensesPaise ? formatRupeeInput(draft.variableExpensesPaise) : "",
    commitments: draft?.commitmentsPaise ? formatRupeeInput(draft.commitmentsPaise) : "",
    savings: draft?.existingSavingsPaise ? formatRupeeInput(draft.existingSavingsPaise) : "",
    protected: draft?.protectedSpendingPaise ? formatRupeeInput(draft.protectedSpendingPaise) : "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>({});

  function setField(key: keyof Fields, value: string) {
    setFields((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function handleContinue() {
    const nextErrors: Partial<Record<keyof Fields, string>> = {};
    const parsed = {} as Record<keyof Fields, number>;

    (Object.keys(fields) as Array<keyof Fields>).forEach((key) => {
      const raw = fields[key].trim();
      if (raw.length === 0) {
        parsed[key] = 0;
        return;
      }
      const result = parseRupeeInput(raw);
      if (result.ok) parsed[key] = result.paise;
      else nextErrors[key] = result.error;
    });

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const essentials = parsed.fixed + parsed.variable;
    updateDraft({
      essentialExpensesPaise: essentials,
      variableExpensesPaise: parsed.variable,
      commitmentsPaise: parsed.commitments,
      existingSavingsPaise: parsed.savings,
      protectedSpendingPaise: parsed.protected,
    });

    // The emergency goal is suggested from essentials. Never overwrite a renamed goal.
    const emergencyIndex = (draft?.goals ?? []).findIndex(
      (goal) => goal.key === "emergency" && goal.name === "Emergency Fund",
    );
    if (emergencyIndex >= 0 && essentials > 0) {
      updateGoal(emergencyIndex, {
        targetPaise: essentials * 3,
        savedPaise: parsed.savings,
      });
    }
    setStep(5);
    router.push("/onboarding/goals");
  }

  return (
    <OnboardingShell
      title="Expenses & Commitments"
      step={4}
      backHref="/onboarding/income"
      coachNote="Protected lifestyle spend means I will never tell you to skip weekend coffee or hobbies. We plan around what matters to you."
    >
      <div className="space-y-1">
        <h2 className="font-headline text-headline-md text-on-surface">
          Roughly what goes out each month?
        </h2>
        <p className="font-body text-body-md text-on-surface-variant">
          Estimates are completely fine — we will protect your essentials and lifestyle before
          suggesting savings.
        </p>
      </div>

      <Card className="flex flex-col gap-4 p-4">
        <AmountField
          id="fixed-expenses"
          label="Fixed (rent, bills)"
          value={fields.fixed}
          onChange={(value) => setField("fixed", value)}
          error={errors.fixed}
        />
        <AmountField
          id="variable-expenses"
          label="Variable (food, travel)"
          value={fields.variable}
          onChange={(value) => setField("variable", value)}
          error={errors.variable}
          hint="Added to essentials so your plan stays realistic."
        />
        <AmountField
          id="commitments"
          label="EMIs / loans"
          value={fields.commitments}
          onChange={(value) => setField("commitments", value)}
          error={errors.commitments}
        />
        <AmountField
          id="existing-savings"
          label="Existing savings"
          value={fields.savings}
          onChange={(value) => setField("savings", value)}
          error={errors.savings}
          hint="Used as a head start for your emergency goal."
        />
        <AmountField
          id="protected-spend"
          label="Protected lifestyle spend"
          value={fields.protected}
          onChange={(value) => setField("protected", value)}
          error={errors.protected}
          hint="Guilt-free dining, coffee and hobbies — never allocated to goals."
        />
      </Card>

      <Link
        href="/expenses/import"
        className="flex items-center gap-3 rounded-xl border border-outline-variant bg-surface-lowest px-3 py-3"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-container text-on-surface-variant">
          <Icon name="upload_file" size={20} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-title text-title-md text-on-surface">
            Import bank or UPI CSV (optional)
          </span>
          <span className="block font-body text-body-md text-on-surface-variant">
            Auto-fill from a bank or UPI CSV. The file stays in this browser and is never stored.
          </span>
        </span>
        <Icon name="chevron_right" size={18} />
      </Link>

      <Button size="lg" fullWidth onClick={handleContinue}>
        Continue
      </Button>
      <p className="pb-2 text-center font-body text-label-md text-on-surface-variant">
        Do not worry if you do not know exact monthly expenses. An estimate is perfectly fine.
      </p>
    </OnboardingShell>
  );
}
