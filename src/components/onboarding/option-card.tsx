"use client";

import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";

interface OptionCardProps {
  icon: string;
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
  role?: "radio" | "checkbox";
}

export function OptionCard({
  icon,
  title,
  description,
  selected,
  onClick,
  role = "radio",
}: OptionCardProps) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors duration-state-change",
        selected
          ? "border-primary bg-secondary-container/70"
          : "border-outline-variant bg-surface-lowest hover:border-primary/40",
      )}
    >
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
          selected ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant",
        )}
      >
        <Icon name={selected ? "check" : icon} size={20} filled={selected} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-title text-title-md text-on-surface">{title}</span>
        <span className="block font-body text-body-md text-on-surface-variant">{description}</span>
      </span>
    </button>
  );
}
