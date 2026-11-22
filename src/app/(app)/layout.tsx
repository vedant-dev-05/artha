import type { ReactNode } from "react";
import { StoreHydrator } from "@/components/providers/store-hydrator";
import { AppShell } from "@/components/navigation/app-shell";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <StoreHydrator>
      <AppShell>{children}</AppShell>
    </StoreHydrator>
  );
}
