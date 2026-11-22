"use client";

import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/app-store";
import { LIFE_STAGE_OPTIONS } from "@/domain/onboarding";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { OptionCard } from "@/components/onboarding/option-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function PersonalIntroPage() {
  const router = useRouter();
  const draft = useAppStore((state) => state.onboardingDraft);
  const updateDraft = useAppStore((state) => state.updateOnboardingDraft);
  const setStep = useAppStore((state) => state.setOnboardingStep);

  const lifeStage = draft?.lifeStage ?? null;

  function handleContinue() {
    if (!lifeStage) return;
    setStep(2);
    router.push("/onboarding/aspirations");
  }

  return (
    <OnboardingShell
      title="Personal Introduction"
      step={1}
      backHref="/onboarding/welcome"
      coachNote="If you are both studying and freelancing, pick Freelancer when gigs cover most of your spending."
    >
      <div className="space-y-1">
        <h2 className="font-headline text-headline-md text-on-surface">
          What best describes you right now?
        </h2>
        <p className="font-body text-body-md text-on-surface-variant">
          This helps us tailor income and expense questions to how you actually earn.
        </p>
      </div>

      <div className="flex flex-col gap-2" role="radiogroup" aria-label="Life stage">
        {LIFE_STAGE_OPTIONS.map((option) => (
          <OptionCard
            key={option.value}
            icon={option.icon}
            title={option.label}
            description={option.description}
            selected={lifeStage === option.value}
            onClick={() => updateDraft({ lifeStage: option.value })}
          />
        ))}
      </div>

      <Card className="space-y-2 p-4">
        <label htmlFor="onboarding-name" className="font-label text-label-lg text-on-surface">
          What should we call you? <span className="text-on-surface-variant">(optional)</span>
        </label>
        <input
          id="onboarding-name"
          value={draft?.displayName ?? ""}
          maxLength={40}
          onChange={(event) => updateDraft({ displayName: event.target.value })}
          placeholder="Your name"
          className="min-h-12 w-full rounded-md border border-outline-variant bg-surface-lowest px-3 font-body text-body-lg outline-none placeholder:text-outline focus:border-primary"
        />
      </Card>

      <Button size="lg" fullWidth disabled={!lifeStage} onClick={handleContinue}>
        Continue
      </Button>
      <p className="pb-2 text-center font-body text-label-md text-on-surface-variant">
        You can always update this later if you start an internship or full-time role.
      </p>
    </OnboardingShell>
  );
}
