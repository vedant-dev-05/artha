"use client";

import { useEffect, type ReactNode } from "react";
import { useAppStore } from "@/store/app-store";
import { LoadingState } from "@/components/ui/states";

/**
 * Persisted demo data lives in localStorage, which is unavailable during SSR.
 * Render a stable skeleton until the store has rehydrated to avoid mismatches.
 */
export function StoreHydrator({ children }: { children: ReactNode }) {
  const hydrated = useAppStore((state) => state.hydrated);

  useEffect(() => {
    if (useAppStore.persist.hasHydrated()) {
      useAppStore.setState({ hydrated: true });
      return;
    }
    const unsubscribe = useAppStore.persist.onFinishHydration(() => {
      useAppStore.setState({ hydrated: true });
    });
    void useAppStore.persist.rehydrate();
    return unsubscribe;
  }, []);

  if (!hydrated) {
    return (
      <div className="mx-auto w-full max-w-[430px] px-4 pt-10">
        <LoadingState label="Loading your demo workspace" />
      </div>
    );
  }

  return <>{children}</>;
}
