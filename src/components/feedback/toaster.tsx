"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/icon";

const tones = {
  success: "bg-primary text-on-primary",
  info: "bg-surface-container-high text-on-surface",
  error: "bg-error text-on-error",
};

const icons = {
  success: "check_circle",
  info: "info",
  error: "error",
};

export function Toaster() {
  const toast = useAppStore((state) => state.toast);
  const dismiss = useAppStore((state) => state.dismissToast);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => dismiss(), 4200);
    return () => window.clearTimeout(timer);
  }, [toast, dismiss]);

  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[92px] z-[55] mx-auto flex w-full max-w-[430px] justify-center px-4"
    >
      <div
        className={cn(
          "pointer-events-auto flex items-center gap-2 rounded-full px-4 py-2.5 font-label text-label-lg shadow-md animate-sheet-in",
          tones[toast.tone],
        )}
      >
        <Icon name={icons[toast.tone]} size={18} />
        <span>{toast.message}</span>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss message"
          className="ml-1 rounded-full p-0.5 opacity-80 hover:opacity-100"
        >
          <Icon name="close" size={16} />
        </button>
      </div>
    </div>
  );
}
