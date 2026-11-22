"use client";

import { CATEGORIES, EXPENSE_CATEGORY_IDS } from "@/domain/categories";
import type { CategoryId } from "@/domain/types";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/icon";

interface CategoryPickerProps {
  value: CategoryId;
  onChange: (category: CategoryId) => void;
  includeNonSpending?: boolean;
  className?: string;
}

export function CategoryPicker({
  value,
  onChange,
  includeNonSpending = false,
  className,
}: CategoryPickerProps) {
  const categories = includeNonSpending
    ? CATEGORIES
    : CATEGORIES.filter((category) => EXPENSE_CATEGORY_IDS.includes(category.id));

  return (
    <div className={cn("grid grid-cols-2 gap-2", className)} role="radiogroup" aria-label="Category">
      {categories.map((category) => {
        const selected = value === category.id;
        return (
          <button
            key={category.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(category.id)}
            className={cn(
              "flex min-h-11 items-center gap-2 rounded-md border px-3 py-2 text-left font-body text-body-md transition-colors",
              selected
                ? "border-primary bg-accent-soft text-on-accent"
                : "border-outline-variant bg-surface-lowest text-on-surface hover:bg-surface-low",
            )}
          >
            <Icon name={category.icon} size={18} />
            <span className="truncate">{category.label}</span>
          </button>
        );
      })}
    </div>
  );
}
