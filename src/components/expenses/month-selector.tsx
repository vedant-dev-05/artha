"use client";

import { addMonthsISO, monthKey, monthKeyLabel, todayISO } from "@/domain/dates";
import { Icon } from "@/components/ui/icon";

interface MonthSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function MonthSelector({ value, onChange }: MonthSelectorProps) {
  const currentKey = monthKey(todayISO());
  const isCurrent = value >= currentKey;

  return (
    <div className="flex items-center justify-between gap-2 rounded-full border border-outline-variant/60 bg-surface-lowest px-2 py-1.5">
      <button
        type="button"
        aria-label="Previous month"
        onClick={() => onChange(monthKey(addMonthsISO(`${value}-01`, -1)))}
        className="flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container"
      >
        <Icon name="chevron_left" size={20} />
      </button>
      <span className="font-label text-label-lg text-on-surface">{monthKeyLabel(value)}</span>
      <button
        type="button"
        aria-label="Next month"
        disabled={isCurrent}
        onClick={() => onChange(monthKey(addMonthsISO(`${value}-01`, 1)))}
        className="flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container disabled:opacity-30"
      >
        <Icon name="chevron_right" size={20} />
      </button>
    </div>
  );
}
