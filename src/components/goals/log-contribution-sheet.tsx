"use client";

import { useEffect, useState } from "react";
import { formatINR, parseRupeeInput } from "@/domain/money";
import { todayISO } from "@/domain/dates";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { Icon } from "@/components/ui/icon";

interface LogContributionSheetProps {
  open: boolean;
  onClose: () => void;
  goalId: string | null;
  goalName: string;
  suggestedPaise?: number;
}

export function LogContributionSheet({
  open,
  onClose,
  goalId,
  goalName,
  suggestedPaise,
}: LogContributionSheetProps) {
  const logContribution = useAppStore((state) => state.logContribution);
  const showToast = useAppStore((state) => state.showToast);

  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setAmount(suggestedPaise ? String(Math.round(suggestedPaise / 100)) : "");
    setDate(todayISO());
    setNote("");
    setError(null);
  }, [open, suggestedPaise]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!goalId) return;
    const parsed = parseRupeeInput(amount);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }
    if (!date) {
      setError("Choose a date.");
      return;
    }
    logContribution({ goalId, amountPaise: parsed.paise, date, note });
    showToast(`${formatINR(parsed.paise)} added to ${goalName}`);
    onClose();
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Log a contribution"
      description={`Record money you have already set aside for ${goalName}.`}
      footer={
        <div className="flex gap-2">
          <Button type="submit" form="log-contribution-form" fullWidth>
            Save contribution
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      }
    >
      <form id="log-contribution-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="contribution-amount" className="font-label text-label-lg text-on-surface">
            Amount
          </label>
          <div className="flex items-center gap-2 rounded-md border border-outline-variant bg-surface-lowest px-3">
            <span className="font-title text-title-lg text-on-surface-variant">₹</span>
            <input
              id="contribution-amount"
              inputMode="decimal"
              autoComplete="off"
              value={amount}
              onChange={(event) => {
                setAmount(event.target.value);
                setError(null);
              }}
              placeholder="0"
              className="min-h-12 w-full bg-transparent font-title text-title-lg tabular-nums outline-none placeholder:text-outline"
              aria-describedby={error ? "contribution-error" : undefined}
              aria-invalid={Boolean(error)}
            />
          </div>
          {suggestedPaise ? (
            <p className="font-body text-label-md text-on-surface-variant">
              Suggested: {formatINR(suggestedPaise)}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="contribution-date" className="font-label text-label-lg text-on-surface">
            Date
          </label>
          <input
            id="contribution-date"
            type="date"
            value={date}
            max={todayISO()}
            onChange={(event) => setDate(event.target.value)}
            className="min-h-12 w-full rounded-md border border-outline-variant bg-surface-lowest px-3 font-body text-body-lg outline-none"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="contribution-note" className="font-label text-label-lg text-on-surface">
            Note <span className="font-body text-label-md text-on-surface-variant">(optional)</span>
          </label>
          <input
            id="contribution-note"
            value={note}
            maxLength={120}
            onChange={(event) => setNote(event.target.value)}
            placeholder="e.g. freelance surplus"
            className="min-h-12 w-full rounded-md border border-outline-variant bg-surface-lowest px-3 font-body text-body-lg outline-none placeholder:text-outline"
          />
        </div>

        {error && (
          <p
            id="contribution-error"
            role="alert"
            className="flex items-center gap-1.5 font-body text-body-md text-error"
          >
            <Icon name="error" size={16} /> {error}
          </p>
        )}

        <p className="rounded-lg bg-surface-low p-3 font-body text-body-md text-on-surface-variant">
          Artha does not move money. This only records progress you have already made.
        </p>
      </form>
    </Sheet>
  );
}
