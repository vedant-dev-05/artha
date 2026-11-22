"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/app-store";
import { onboardingRouteForStep } from "@/domain/onboarding-routes";
import { LoadingState } from "@/components/ui/states";

/**
 * First visit opens the onboarding welcome screen. Once a visitor chooses setup
 * or the demo workspace, the root route honours that choice. A saved setup that
 * was exited early resumes at its last step instead of falling into the demo.
 */
export function EntryRouter() {
  const router = useRouter();
  const entryChoice = useAppStore((state) => state.entryChoice);
  const onboardingDraft = useAppStore((state) => state.onboardingDraft);
  const currentStep = useAppStore((state) => state.data.onboarding.currentStep);

  useEffect(() => {
    if (entryChoice === "demo") {
      router.replace("/home");
      return;
    }
    if (entryChoice === "onboarding" && onboardingDraft) {
      router.replace(onboardingRouteForStep(currentStep));
      return;
    }
    router.replace("/onboarding/welcome");
  }, [entryChoice, onboardingDraft, currentStep, router]);

  return <LoadingState label="Preparing your workspace" />;
}
