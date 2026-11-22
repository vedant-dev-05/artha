"use client";

import type { ReactNode } from "react";
import { BottomNavigation } from "@/components/navigation/bottom-navigation";
import { DemoStrip } from "@/components/navigation/top-bar";
import { CompanionLauncher } from "@/components/companion/companion-launcher";
import { Toaster } from "@/components/feedback/toaster";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-surface-container/50">
      <div className="relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-background sm:shadow-md">
        <DemoStrip />
        <div className="flex-1 pb-[calc(104px+env(safe-area-inset-bottom))]">{children}</div>
        <CompanionLauncher />
        <BottomNavigation />
        <Toaster />
      </div>
    </div>
  );
}
