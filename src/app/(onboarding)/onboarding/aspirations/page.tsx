"use client";

import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/app-store";
import { ASPIRATION_OPTIONS, type AspirationKey } from "@/domain/onboarding";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { OptionCard } from "@/components/onboarding/option-card";
import { Button } from "@/components/ui/button";

export default function AspirationsPage() {
  const router = useRouter();
  const draft = useAppStore((state) => state.onboardingDraft);
  const setAspirations = useAppStore((state) => state.setOnboardingAspirations);
  const setStep = useAppStore((state) => state.setOnboardingStep);

  const selected = draft?.aspirations ?? [];

  function toggle(key: AspirationKey) {
    const next = selected.includes(key)
      ? selected.filter((item) => item !== key)
      : [...selected, key];
    setAspirations(next);
  }

  function handleContinue() {
    if (selected.length === 0) return;
    setStep(3);
    router.push("/onboarding/income");
  }

  return (
    <OnboardingShell
      title="Financial Aspirations"
      step={2}
      backHref="/onboarding/profile"
      coachNote="Pairing an Emergency Fund with a lifestyle goal is a great balance — you build security while working toward something exciting."
    >
      <div className="space-y-1">
        <h2 className="font-headline text-headline-md text-on-surface">
          What would you love to achieve?
        </h2>
        <p className="font-body text-body-md text-on-surface-variant">
          Pick as many as you like. We will help you prioritise them in the next steps.
        </p>
      </div>

      <div className="flex flex-col gap-2" role="group" aria-label="Financial aspirations">
        {ASPIRATION_OPTIONS.map((option) => (
          <OptionCard
            key={option.key}
            role="checkbox"
            icon={option.icon}
            title={option.label}
            description={option.description}
            selected={selected.includes(option.key)}
            onClick={() => toggle(option.key)}
          />
        ))}
      </div>

      <Button size="lg" fullWidth disabled={selected.length === 0} onClick={handleContinue}>
        Continue ({selected.length} selected)
      </Button>
      <p className="pb-2 text-center font-body text-label-md text-on-surface-variant">
        Starting with 2–3 goals works best. You can add more later.
      </p>
    </OnboardingShell>
  );
}
