"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/app-store";
import { formatINR, parseRupeeInput } from "@/domain/money";
import { todayISO } from "@/domain/dates";
import type { CategoryId } from "@/domain/types";
import { TopBar } from "@/components/navigation/top-bar";
import { CategoryPicker } from "@/components/expenses/category-picker";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

export default function NewExpensePage() {
  const router = useRouter();
  const addTransaction = useAppStore((state) => state.addTransaction);
  const showToast = useAppStore((state) => state.showToast);

  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayISO());
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<CategoryId>("food");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};

    const parsed = parseRupeeInput(amount);
    if (!parsed.ok) nextErrors.amount = parsed.error;
    if (!description.trim()) nextErrors.description = "Add a merchant or short description.";
    if (!date) nextErrors.date = "Choose a date.";
    if (date && date > todayISO()) nextErrors.date = "Future dates are not allowed.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !parsed.ok) return;

    addTransaction({
      date,
      description,
      amountPaise: parsed.paise,
      category,
      note,
    });
    showToast(`Expense of ${formatINR(parsed.paise)} saved`);
    router.push("/expenses");
  }

  return (
    <>
      <TopBar title="Add expense" subtitle="Quick manual entry" backHref="/expenses" />

      <main className="px-4">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex items-center gap-2 rounded-lg bg-accent-soft px-3 py-2 font-label text-label-md text-on-accent">
            <Icon name="edit_note" size={16} />
            Marked as Manual
          </div>

          <div className="space-y-1.5">
            <label htmlFor="expense-amount" className="font-label text-label-lg text-on-surface">
              Amount
            </label>
            <div className="flex items-center gap-2 rounded-md border border-outline-variant bg-surface-lowest px-3">
              <span className="font-title text-title-lg text-on-surface-variant">₹</span>
              <input
                id="expense-amount"
                inputMode="decimal"
                autoComplete="off"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="0"
                aria-invalid={Boolean(errors.amount)}
                className="min-h-12 w-full bg-transparent font-title text-title-lg tabular-nums outline-none placeholder:text-outline"
              />
            </div>
            {errors.amount && (
              <p role="alert" className="font-body text-body-md text-error">
                {errors.amount}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="expense-description" className="font-label text-label-lg text-on-surface">
              Merchant or description
            </label>
            <input
              id="expense-description"
              value={description}
              maxLength={120}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="e.g. Swiggy lunch"
              aria-invalid={Boolean(errors.description)}
              className="min-h-12 w-full rounded-md border border-outline-variant bg-surface-lowest px-3 font-body text-body-lg outline-none placeholder:text-outline"
            />
            {errors.description && (
              <p role="alert" className="font-body text-body-md text-error">
                {errors.description}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <span className="font-label text-label-lg text-on-surface">Category</span>
            <CategoryPicker value={category} onChange={setCategory} />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="expense-date" className="font-label text-label-lg text-on-surface">
              Date
            </label>
            <input
              id="expense-date"
              type="date"
              value={date}
              max={todayISO()}
              onChange={(event) => setDate(event.target.value)}
              className="min-h-12 w-full rounded-md border border-outline-variant bg-surface-lowest px-3 font-body text-body-lg outline-none"
            />
            {errors.date && (
              <p role="alert" className="font-body text-body-md text-error">
                {errors.date}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="expense-note" className="font-label text-label-lg text-on-surface">
              Notes <span className="font-body text-label-md text-on-surface-variant">(optional)</span>
            </label>
            <input
              id="expense-note"
              value={note}
              maxLength={120}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Anything worth remembering"
              className="min-h-12 w-full rounded-md border border-outline-variant bg-surface-lowest px-3 font-body text-body-lg outline-none placeholder:text-outline"
            />
          </div>

          <Button type="submit" fullWidth size="lg">
            Save expense
          </Button>
          <p className="pb-2 font-body text-label-md text-on-surface-variant">
            Manual entries stay separate from CSV imports so nothing is double-counted.
          </p>
        </form>
      </main>
    </>
  );
}
