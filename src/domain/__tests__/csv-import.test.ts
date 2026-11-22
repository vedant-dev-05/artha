import { describe, expect, it } from "vitest";
import {
  buildPreview,
  duplicateKey,
  EMPTY_MAPPING,
  parseCsv,
  parseCsvAmount,
  parseCsvDate,
  previewToTransaction,
  suggestCategory,
  suggestMapping,
} from "@/domain/csv-import";
import { rupeesToPaise } from "@/domain/money";
import type { Transaction } from "@/domain/types";

function transaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: "tx-test",
    date: "2026-11-20",
    description: "Swiggy Order",
    amountPaise: rupeesToPaise(1420),
    direction: "debit",
    category: "food",
    source: "csv_import",
    importBatchId: "batch-test",
    note: null,
    categoryConfidence: "high",
    categoryEditedByUser: false,
    createdAt: "2026-11-20T10:00:00.000Z",
    ...overrides,
  };
}

describe("parseCsv", () => {
  it("handles quoted commas, CRLF and blank rows", () => {
    const rows = parseCsv('Date,Narration,Amount\r\n2026-11-20,"Swiggy, Order",1420\r\n\r\n2026-11-19,Airtel,1999\r\n');
    expect(rows).toHaveLength(3);
    expect(rows[1][1]).toBe("Swiggy, Order");
    expect(rows[2][2]).toBe("1999");
  });

  it("strips a UTF-8 BOM before parsing", () => {
    const rows = parseCsv("\uFEFFDate,Narration\n2026-11-20,Test\n");
    expect(rows[0][0]).toBe("Date");
  });
});

describe("suggestMapping", () => {
  it("infers common bank and UPI column names", () => {
    const mapping = suggestMapping(["Txn Date", "Narration", "Withdrawal Amt", "Deposit Amt", "Balance"]);
    expect(mapping.date).toBe(0);
    expect(mapping.description).toBe(1);
    expect(mapping.debit).toBe(2);
    expect(mapping.credit).toBe(3);
    expect(mapping.amount).toBe(-1);
  });
});

describe("parseCsvDate", () => {
  it("parses ISO, DD/MM/YYYY and named months", () => {
    expect(parseCsvDate("2026-11-20").date).toBe("2026-11-20");
    expect(parseCsvDate("20/11/2026").date).toBe("2026-11-20");
    expect(parseCsvDate("20-11-2026").date).toBe("2026-11-20");
    expect(parseCsvDate("20 Nov 2026").date).toBe("2026-11-20");
  });

  it("flags ambiguous US-style dates", () => {
    const result = parseCsvDate("03/04/2026", "MM/dd/yyyy");
    expect(result.ambiguous).toBe(true);
    expect(result.date).toBe("2026-03-04");
  });

  it("rejects impossible dates", () => {
    expect(parseCsvDate("31/02/2026").date).toBeNull();
  });
});

describe("parseCsvAmount", () => {
  it("accepts grouped amounts, signs and parentheses", () => {
    expect(parseCsvAmount("₹1,420.50")).toEqual({ paise: 142050, sign: 1 });
    expect(parseCsvAmount("-1,420")).toEqual({ paise: 142000, sign: -1 });
    expect(parseCsvAmount("(1,420)")).toEqual({ paise: 142000, sign: -1 });
  });

  it("rejects empty and malformed amounts", () => {
    expect(parseCsvAmount("")).toBeNull();
    expect(parseCsvAmount("abc")).toBeNull();
    expect(parseCsvAmount("0")).toBeNull();
  });
});

describe("suggestCategory", () => {
  it("uses merchant rules and marks unknown merchants as low confidence", () => {
    expect(suggestCategory("Swiggy Order", "debit")).toEqual({ category: "food", confidence: "high" });
    expect(suggestCategory("Airtel Fiber Bill", "debit").category).toBe("bills");
    expect(suggestCategory("UPI-98112234", "debit")).toEqual({
      category: "uncategorised",
      confidence: "low",
    });
  });
});

describe("buildPreview", () => {
  const rows = [
    ["Txn Date", "Narration", "Withdrawal Amt", "Deposit Amt"],
    ["20/11/2026", "Swiggy Order", "1,420", ""],
    ["19/11/2026", "Airtel Fiber Bill", "1,999", ""],
    ["18/11/2026", "UPI-98112234", "1,650", ""],
    ["bad-date", "Unknown", "500", ""],
  ];
  const mapping = { ...EMPTY_MAPPING, date: 0, description: 1, debit: 2, credit: 3 };

  it("flags duplicates against existing transactions and excludes them", () => {
    const preview = buildPreview({
      rows,
      mapping,
      dateFormat: "auto",
      existingTransactions: [transaction()],
    });
    expect(preview).toHaveLength(4);
    expect(preview[0].duplicate).toBe(true);
    expect(preview[0].include).toBe(false);
    expect(preview[1].status).toBe("ready");
    expect(preview[2].status).toBe("review");
    expect(preview[3].status).toBe("invalid");
  });

  it("flags ambiguous direction when a single unsigned amount is used", () => {
    const single = [
      ["Date", "Description", "Amount"],
      ["20/11/2026", "Some payment", "500"],
    ];
    const preview = buildPreview({
      rows: single,
      mapping: { ...EMPTY_MAPPING, date: 0, description: 1, amount: 2 },
      dateFormat: "auto",
      existingTransactions: [],
    });
    expect(preview[0].direction).toBeNull();
    expect(preview[0].status).toBe("review");
    expect(previewToTransaction(preview[0], "batch", "now")).toBeNull();
  });

  it("uses a stable duplicate key that includes direction", () => {
    const base = { date: "2026-11-20", amountPaise: 142000, description: "Swiggy Order" };
    expect(duplicateKey({ ...base, direction: "debit" })).not.toBe(
      duplicateKey({ ...base, direction: "credit" }),
    );
  });
});
