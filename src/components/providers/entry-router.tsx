"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/app-store";
import { LoadingState } from "@/components/ui/states";

/**
 * First visit opens the onboarding welcome screen. Once the visitor chooses
 * setup or the demo workspace, the choice is persisted and the root route
 * goes straight to their workspace.
 */
export function EntryRouter() {
  const router = useRouter();
  const entryChoice = useAppStore((state) => state.entryChoice);

  useEffect(() => {
    router.replace(entryChoice ? "/home" : "/onboarding/welcome");
  }, [entryChoice, router]);

  return <LoadingState label="Preparing your workspace" />;
}
