const ONBOARDING_ROUTES: Record<number, string> = {
  1: "/onboarding/profile",
  2: "/onboarding/aspirations",
  3: "/onboarding/income",
  4: "/onboarding/expenses",
  5: "/onboarding/goals",
  6: "/onboarding/overview",
  7: "/onboarding/plan",
};

export function onboardingRouteForStep(step: number): string {
  return ONBOARDING_ROUTES[step] ?? "/onboarding/profile";
}
