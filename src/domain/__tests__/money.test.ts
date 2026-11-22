import { describe, expect, it } from "vitest";
import {
  ceilToRupee,
  formatINR,
  formatRupeeInput,
  parseRupeeInput,
  percentOf,
  rupeesToPaise,
  splitByWeights,
  splitEqually,
  sumPaise,
} from "@/domain/money";

describe("rupeesToPaise", () => {
  it("converts whole rupees and paise without floating point drift", () => {
    expect(rupeesToPaise(1200)).toBe(120000);
    expect(rupeesToPaise(0.1)).toBe(10);
    expect(rupeesToPaise(19.99)).toBe(1999);
  });

  it("returns zero for non-finite input", () => {
    expect(rupeesToPaise(Number.NaN)).toBe(0);
    expect(rupeesToPaise(Number.POSITIVE_INFINITY)).toBe(0);
  });
});

describe("parseRupeeInput", () => {
  it("accepts Indian grouping, the rupee symbol and decimals", () => {
    expect(parseRupeeInput("₹1,20,000")).toEqual({ ok: true, paise: 12000000 });
    expect(parseRupeeInput("1200.5")).toEqual({ ok: true, paise: 120050 });
    expect(parseRupeeInput(" 42 ")).toEqual({ ok: true, paise: 4200 });
  });

  it("rejects empty, negative, malformed and zero amounts", () => {
    expect(parseRupeeInput("").ok).toBe(false);
    expect(parseRupeeInput("-500").ok).toBe(false);
    expect(parseRupeeInput("12.345").ok).toBe(false);
    expect(parseRupeeInput("0").ok).toBe(false);
    expect(parseRupeeInput("abc").ok).toBe(false);
  });
});

describe("formatting", () => {
  it("formats integer paise as Indian rupees", () => {
    expect(formatINR(11400000)).toContain("1,14,000");
    expect(formatINR(199900, { showPaise: true })).toContain("1,999.00");
  });

  it("formats signed values for display", () => {
    expect(formatINR(50000, { signed: true }).startsWith("+")).toBe(true);
    expect(formatINR(-50000).startsWith("−")).toBe(true);
  });

  it("round-trips a paise amount for inputs", () => {
    expect(formatRupeeInput(120050)).toBe("1200.50");
    expect(formatRupeeInput(120000)).toBe("1200");
  });
});

describe("split helpers", () => {
  it("splits equally and preserves the exact total", () => {
    const parts = splitEqually(10000, 3);
    expect(parts).toEqual([3334, 3333, 3333]);
    expect(sumPaise(parts)).toBe(10000);
  });

  it("distributes weighted remainders deterministically", () => {
    const parts = splitByWeights(10000, [2, 1, 1]);
    expect(parts).toEqual([5000, 2500, 2500]);
    expect(sumPaise(parts)).toBe(10000);
  });

  it("handles zero and empty splits", () => {
    expect(splitEqually(0, 3)).toEqual([0, 0, 0]);
    expect(splitEqually(100, 0)).toEqual([]);
    expect(splitByWeights(100, [0, 0])).toEqual([0, 0]);
  });
});

describe("rounding and percentages", () => {
  it("rounds contributions up to the next rupee", () => {
    expect(ceilToRupee(676923)).toBe(677000);
    expect(ceilToRupee(676900)).toBe(676900);
  });

  it("clamps percentages to 0–100", () => {
    expect(percentOf(5000, 10000)).toBe(50);
    expect(percentOf(20000, 10000)).toBe(100);
    expect(percentOf(0, 0)).toBe(0);
  });
});
