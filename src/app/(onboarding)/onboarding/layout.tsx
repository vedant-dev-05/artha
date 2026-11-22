import type { ReactNode } from "react";
import { StoreHydrator } from "@/components/providers/store-hydrator";

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return <StoreHydrator>{children}</StoreHydrator>;
}
