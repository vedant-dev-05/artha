"use client";

import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/app-store";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";

const highlights = [
  { icon: "flag", title: "Goal-first balance", text: "Start with what matters to you" },
  { icon: "verified_user", title: "Honest plans", text: "Built around your real numbers" },
  { icon: "auto_awesome", title: "AI Coach", text: "Explains and proposes, never surprises" },
];

export default function WelcomePage() {
  const router = useRouter();
  const startOnboarding = useAppStore((state) => state.startOnboarding);
  const setOnboardingStep = useAppStore((state) => state.setOnboardingStep);

  function handleStart() {
    startOnboarding();
    setOnboardingStep(1);
    router.push("/onboarding/profile");
  }

  return (
    <OnboardingShell
      title="Welcome"
      coachNote="Setup takes about 2 minutes — no bank login needed. I will be right here as you go."
    >
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary text-on-primary">
          <Icon name="savings" size={40} filled />
        </span>
        <div className="space-y-1">
          <p className="font-label text-label-lg text-primary">Artha</p>
          <h2 className="font-display text-display-md text-on-surface">
            Turn your goals into a realistic savings plan
          </h2>
          <p className="font-body text-body-md text-on-surface-variant">
            Whether it is an emergency cushion, a new laptop, or your next trip, Artha builds a
            flexible INR plan around your real income and lifestyle.
          </p>
        </div>
      </div>

      <Card className="flex flex-col gap-3 p-4">
        {highlights.map((item) => (
          <div key={item.title} className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
              <Icon name={item.icon} size={18} />
            </span>
            <div>
              <p className="font-title text-title-md text-on-surface">{item.title}</p>
              <p className="font-body text-body-md text-on-surface-variant">{item.text}</p>
            </div>
          </div>
        ))}
      </Card>

      <div className="mt-auto flex flex-col gap-2 pt-4">
        <Button size="lg" fullWidth onClick={handleStart}>
          Get Started
          <Icon name="arrow_forward" size={18} />
        </Button>
        <Button variant="ghost" fullWidth onClick={() => router.push("/home")}>
          Explore the demo workspace instead
        </Button>
        <p className="text-center font-body text-label-md text-on-surface-variant">
          Demo only · no account, no bank connection, nothing sent anywhere
        </p>
      </div>
    </OnboardingShell>
  );
}
