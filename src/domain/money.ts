import type { Paise } from "./types";

export const PAISE_PER_RUPEE = 100;

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

const inrPaiseFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

/** Convert a rupee amount (may include paise) to integer paise. */
export function rupeesToPaise(rupees: number): Paise {
  if (!Number.isFinite(rupees)) return 0;
  return Math.round(rupees * PAISE_PER_RUPEE);
}

export function paiseToRupees(paise: Paise): number {
  return paise / PAISE_PER_RUPEE;
}

/**
 * Parse a user-entered rupee amount.
 * Accepts "1,20,000", "₹1200", "1200.50". Rejects negatives and > 2 decimals.
 */
export function parseRupeeInput(
  raw: string,
): { ok: true; paise: Paise } | { ok: false; error: string } {
  const cleaned = raw.replace(/[₹,\s]/g, "").trim();
  if (cleaned.length === 0) {
    return { ok: false, error: "Enter an amount." };
  }
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) {
    return {
      ok: false,
      error: "Use digits only, with up to 2 decimal places.",
    };
  }
  const [whole, fraction = ""] = cleaned.split(".");
  const paisePart = Number(whole) * PAISE_PER_RUPEE + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(paisePart)) {
    return { ok: false, error: "That amount is too large." };
  }
  if (paisePart <= 0) {
    return { ok: false, error: "Amount must be greater than zero." };
  }
  return { ok: true, paise: paisePart };
}

/** Format integer paise as Indian Rupees, e.g. ₹1,14,000. */
export function formatINR(
  paise: Paise,
  options: { showPaise?: boolean; signed?: boolean } = {},
): string {
  const { showPaise = false, signed = false } = options;
  const formatter = showPaise ? inrPaiseFormatter : inrFormatter;
  const absolute = Math.abs(Math.round(paise));
  const formatted = formatter.format(absolute / PAISE_PER_RUPEE);
  if (signed && paise > 0) return `+${formatted}`;
  if (paise < 0) return `−${formatted}`;
  return formatted;
}

/** Rupee value without the currency symbol, for inputs. */
export function formatRupeeInput(paise: Paise): string {
  const rupees = paise / PAISE_PER_RUPEE;
  return Number.isInteger(rupees) ? String(rupees) : rupees.toFixed(2);
}

export function sumPaise(values: Paise[]): Paise {
  return values.reduce((total, value) => total + Math.round(value), 0);
}

export function clampPaise(value: Paise, min = 0, max = Number.MAX_SAFE_INTEGER): Paise {
  return Math.min(Math.max(Math.round(value), min), max);
}

/** Round to the nearest whole rupee (100 paise). */
export function roundToRupee(paise: Paise): Paise {
  return Math.round(paise / PAISE_PER_RUPEE) * PAISE_PER_RUPEE;
}

/** Round up to the next whole rupee. Used so required contributions are never under-funded. */
export function ceilToRupee(paise: Paise): Paise {
  return Math.ceil(paise / PAISE_PER_RUPEE) * PAISE_PER_RUPEE;
}

export function floorToRupee(paise: Paise): Paise {
  return Math.floor(paise / PAISE_PER_RUPEE) * PAISE_PER_RUPEE;
}

/** Percentage of a whole, rounded to the nearest integer and clamped to 0–100. */
export function percentOf(part: Paise, whole: Paise): number {
  if (whole <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((part / whole) * 100)));
}

/**
 * Split `total` across `weights` using integer paise and largest remainders.
 * The returned parts always sum exactly to `total`.
 */
export function splitByWeights(total: Paise, weights: number[]): Paise[] {
  const safeTotal = Math.max(0, Math.round(total));
  const weightSum = weights.reduce((sum, weight) => sum + Math.max(0, weight), 0);
  if (weights.length === 0 || weightSum <= 0) return weights.map(() => 0);

  const exact = weights.map((weight) => (safeTotal * Math.max(0, weight)) / weightSum);
  const parts = exact.map((value) => Math.floor(value));
  let remainder = safeTotal - parts.reduce((sum, value) => sum + value, 0);

  const order = exact
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index);

  let cursor = 0;
  while (remainder > 0 && order.length > 0) {
    parts[order[cursor % order.length].index] += 1;
    remainder -= 1;
    cursor += 1;
  }
  return parts;
}

/** Split an amount equally, distributing leftover paise deterministically. */
export function splitEqually(total: Paise, count: number): Paise[] {
  if (count <= 0) return [];
  return splitByWeights(
    total,
    Array.from({ length: count }, () => 1),
  );
}
