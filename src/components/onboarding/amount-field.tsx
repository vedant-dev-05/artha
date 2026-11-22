"use client";

import type { ChangeEvent } from "react";

interface AmountFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  hint?: string;
}

export function AmountField({
  id,
  label,
  value,
  onChange,
  placeholder = "0",
  error,
  hint,
}: AmountFieldProps) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const cleaned = event.target.value.replace(/[^\d.]/g, "");
    onChange(cleaned);
  }

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="font-label text-label-lg text-on-surface">
        {label}
      </label>
      <div className="flex items-center gap-2 rounded-md border border-outline-variant bg-surface-lowest px-3 focus-within:border-primary">
        <span className="font-title text-title-lg text-on-surface-variant">₹</span>
        <input
          id={id}
          inputMode="decimal"
          autoComplete="off"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className="min-h-12 w-full bg-transparent font-title text-title-lg tabular-nums outline-none placeholder:text-outline"
        />
      </div>
      {error && (
        <p id={`${id}-error`} role="alert" className="font-body text-body-md text-error">
          {error}
        </p>
      )}
      {!error && hint && (
        <p id={`${id}-hint`} className="font-body text-body-md text-on-surface-variant">
          {hint}
        </p>
      )}
    </div>
  );
}
