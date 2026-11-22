import { format, isValid, parse } from "date-fns";
import { parseRupeeInput, rupeesToPaise } from "./money";
import type { CategoryId, ISODate, Transaction, TransactionDirection } from "./types";

export const MAX_CSV_BYTES = 5 * 1024 * 1024;
export const MAX_CSV_ROWS = 2000;

export interface CsvMapping {
  date: number;
  description: number;
  debit: number;
  credit: number;
  amount: number;
  type: number;
}

export const EMPTY_MAPPING: CsvMapping = {
  date: -1,
  description: -1,
  debit: -1,
  credit: -1,
  amount: -1,
  type: -1,
};

export type DateFormat = "auto" | "dd/MM/yyyy" | "MM/dd/yyyy" | "yyyy-MM-dd";

/** Minimal RFC-4180-style parser. Cells are always treated as text, never evaluated. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field.trim());
      field = "";
    } else if (char === "\n") {
      row.push(field.trim());
      if (row.some((cell) => cell.length > 0)) rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }

  row.push(field.trim());
  if (row.some((cell) => cell.length > 0)) rows.push(row);
  return rows;
}

function findColumn(headers: string[], pattern: RegExp): number {
  return headers.findIndex((header) => pattern.test(header.replace(/[^a-z0-9/ ]/gi, " ").toLowerCase()));
}

export function suggestMapping(headers: string[]): CsvMapping {
  const debit = findColumn(headers, /debit|withdraw|spend|outflow|paid/);
  const credit = findColumn(headers, /credit|deposit|inflow|received/);
  const amountIndex = headers.findIndex(
    (header, index) =>
      index !== debit &&
      index !== credit &&
      /amount|amt|value/.test(header.replace(/[^a-z0-9/ ]/gi, " ").toLowerCase()),
  );
  return {
    date: findColumn(headers, /(txn|value|transaction|posting)?\s*date|timestamp|time/),
    description: findColumn(headers, /narration|descrip|merchant|particular|details|purpose|remarks/),
    debit,
    credit,
    amount: amountIndex,
    type: findColumn(headers, /type|direction|dr\s*cr|dc\b/),
  };
}

const DATE_FORMATS = [
  "yyyy-MM-dd",
  "dd/MM/yyyy",
  "dd-MM-yyyy",
  "d/M/yyyy",
  "d-M-yyyy",
  "MM/dd/yyyy",
  "M/d/yyyy",
  "dd MMM yyyy",
  "d MMM yyyy",
  "yyyy/MM/dd",
];

export interface ParsedDate {
  date: ISODate | null;
  ambiguous: boolean;
}

export function parseCsvDate(raw: string, formatPreference: DateFormat = "auto"): ParsedDate {
  const cleaned = raw.trim().replace(/\s+(am|pm)$/i, "");
  if (!cleaned) return { date: null, ambiguous: false };

  const isoLike = cleaned.match(/^\d{4}-\d{2}-\d{2}/);
  if (isoLike) {
    const parsed = parse(isoLike[0], "yyyy-MM-dd", new Date());
    return { date: isValid(parsed) ? format(parsed, "yyyy-MM-dd") : null, ambiguous: false };
  }

  const formats =
    formatPreference === "auto"
      ? DATE_FORMATS
      : [formatPreference, ...DATE_FORMATS.filter((item) => item !== formatPreference)];

  for (const candidate of formats) {
    const parsed = parse(cleaned, candidate, new Date());
    if (!isValid(parsed)) continue;
    const ambiguous =
      candidate === "MM/dd/yyyy" || candidate === "M/d/yyyy"
        ? /^(\d{1,2})[/-](\d{1,2})[/-]/.test(cleaned) && Number(cleaned.split(/[/-]/)[0]) <= 12
        : false;
    return { date: format(parsed, "yyyy-MM-dd"), ambiguous };
  }
  return { date: null, ambiguous: false };
}

export interface ParsedAmount {
  paise: number;
  sign: -1 | 0 | 1;
}

export function parseCsvAmount(raw: string): ParsedAmount | null {
  const cleaned = raw.trim();
  if (!cleaned) return null;
  const negative = /^\(.*\)$/.test(cleaned) || cleaned.startsWith("-");
  const unsigned = cleaned.replace(/^[(-]|[)]$/g, "").replace(/[₹,\s]/g, "");
  const parsed = parseRupeeInput(unsigned);
  if (!parsed.ok) return null;
  return { paise: parsed.paise, sign: negative ? -1 : parsed.paise > 0 ? 1 : 0 };
}

const CATEGORY_RULES: Array<{ category: CategoryId; pattern: RegExp }> = [
  { category: "food", pattern: /swiggy|zomato|restaurant|cafe|coffee|food|pizza|biryani|grocer|dmart|bigbasket|blinkit|zepto|delivery/i },
  { category: "transport", pattern: /uber|ola |rapido|metro|petrol|fuel|bus|train|irctc|auto |cab|parking|toll/i },
  { category: "shopping", pattern: /amazon|flipkart|myntra|shop|store|purchase|order|apparel|electronics/i },
  { category: "entertainment", pattern: /netflix|spotify|prime |hotstar|movie|cinema|game|concert|subscription/i },
  { category: "education", pattern: /school|college|course|udemy|coursera|tuition|exam|book|education|fees/i },
  { category: "bills", pattern: /electric|water|broadband|wifi|fiber|airtel|jio|bill|rent|utility|gas|mobile|recharge/i },
  { category: "health", pattern: /pharma|medical|hospital|doctor|clinic|health|gym|medicine|diagnostic/i },
  { category: "travel", pattern: /flight|airline|indigo|hotel|trip|booking|travel|airbnb/i },
  { category: "transfers", pattern: /self transfer|bank transfer|neft|imps|rtgs|to self/i },
  { category: "income", pattern: /salary|credit interest|refund|cashback|stipend|payment received/i },
];

export interface CategorySuggestion {
  category: CategoryId;
  confidence: "low" | "medium" | "high";
}

export function suggestCategory(description: string, direction: TransactionDirection): CategorySuggestion {
  if (direction === "credit" && /salary|stipend|income|credit interest/i.test(description)) {
    return { category: "income", confidence: "high" };
  }
  const match = CATEGORY_RULES.find((rule) => rule.pattern.test(description));
  if (!match) return { category: "uncategorised", confidence: "low" };
  const strong = match.category === "food" || match.category === "bills";
  return { category: match.category, confidence: strong ? "high" : "medium" };
}

export function duplicateKey(input: {
  date: ISODate;
  amountPaise: number;
  description: string;
  direction?: TransactionDirection | null;
}): string {
  const normalised = input.description
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 40);
  const direction = input.direction ? `:${input.direction}` : "";
  return `${input.date}|${input.amountPaise}|${direction}|${normalised}`;
}

export function existingDuplicateKeys(transactions: Transaction[]): Set<string> {
  return new Set(
    transactions.map((transaction) =>
      duplicateKey({
        date: transaction.date,
        amountPaise: transaction.amountPaise,
        description: transaction.description,
        direction: transaction.direction,
      }),
    ),
  );
}

export type PreviewStatus = "ready" | "review" | "invalid";

export interface CsvPreviewRow {
  id: string;
  rowNumber: number;
  date: ISODate | null;
  description: string;
  amountPaise: number | null;
  direction: TransactionDirection | null;
  category: CategoryId;
  confidence: "low" | "medium" | "high";
  duplicate: boolean;
  dateAmbiguous: boolean;
  status: PreviewStatus;
  reasons: string[];
  include: boolean;
  key: string | null;
}

function directionFromType(raw: string): TransactionDirection | null {
  const value = raw.trim().toLowerCase();
  if (/^(debit|dr|withdrawal|withdraw|spend|paid|outflow)$/.test(value)) return "debit";
  if (/^(credit|cr|deposit|received|refund|inflow)$/.test(value)) return "credit";
  return null;
}

export interface BuildPreviewInput {
  rows: string[][];
  mapping: CsvMapping;
  dateFormat: DateFormat;
  existingTransactions: Transaction[];
}

export function buildPreview({
  rows,
  mapping,
  dateFormat,
  existingTransactions,
}: BuildPreviewInput): CsvPreviewRow[] {
  const dataRows = rows.slice(1);
  const known = existingDuplicateKeys(existingTransactions);
  const seen = new Set<string>();

  return dataRows.map((cells, index) => {
    const rowNumber = index + 2;
    const reasons: string[] = [];
    const rawDate = mapping.date >= 0 ? cells[mapping.date] ?? "" : "";
    const parsedDate = parseCsvDate(rawDate, dateFormat);
    if (!parsedDate.date) reasons.push("Invalid or missing date");
    if (parsedDate.ambiguous) reasons.push("Ambiguous date — confirm DD/MM/YYYY");

    const rawDescription = mapping.description >= 0 ? cells[mapping.description] ?? "" : "";
    const description = rawDescription.trim() || `Transaction ${rowNumber}`;
    if (!rawDescription.trim()) reasons.push("Missing description, using a fallback label");

    let amountPaise: number | null = null;
    let direction: TransactionDirection | null = null;

    const debitRaw = mapping.debit >= 0 ? cells[mapping.debit] ?? "" : "";
    const creditRaw = mapping.credit >= 0 ? cells[mapping.credit] ?? "" : "";
    const amountRaw = mapping.amount >= 0 ? cells[mapping.amount] ?? "" : "";
    const typeRaw = mapping.type >= 0 ? cells[mapping.type] ?? "" : "";

    if (debitRaw) {
      const parsed = parseCsvAmount(debitRaw);
      if (parsed) {
        amountPaise = parsed.paise;
        direction = "debit";
      }
    } else if (creditRaw) {
      const parsed = parseCsvAmount(creditRaw);
      if (parsed) {
        amountPaise = parsed.paise;
        direction = "credit";
      }
    } else if (amountRaw) {
      const parsed = parseCsvAmount(amountRaw);
      if (parsed) {
        amountPaise = parsed.paise;
        if (parsed.sign === -1) direction = "debit";
        else if (parsed.sign === 1) {
          direction = typeRaw ? directionFromType(typeRaw) : null;
          if (!direction) reasons.push("Direction unclear — choose debit or credit");
        }
      }
    }

    if (typeRaw && !direction) direction = directionFromType(typeRaw);
    if (!amountPaise || amountPaise <= 0) {
      amountPaise = null;
      reasons.push("Invalid or missing amount");
    }

    const suggestion = suggestCategory(description, direction ?? "debit");
    if (suggestion.confidence === "low") reasons.push("Category needs review");

    const key =
      parsedDate.date && amountPaise
        ? duplicateKey({ date: parsedDate.date, amountPaise, description, direction })
        : null;
    const duplicate = key ? known.has(key) || seen.has(key) : false;
    if (key) seen.add(key);
    if (duplicate) reasons.push("Possible duplicate");

    const invalid = !parsedDate.date || !amountPaise;
    const needsReview = reasons.length > 0 && !invalid;
    const status: PreviewStatus = invalid ? "invalid" : needsReview ? "review" : "ready";

    return {
      id: `preview-${rowNumber}`,
      rowNumber,
      date: parsedDate.date,
      description,
      amountPaise,
      direction,
      category: suggestion.category,
      confidence: suggestion.confidence,
      duplicate,
      dateAmbiguous: parsedDate.ambiguous,
      status,
      reasons,
      include: !invalid && !duplicate,
      key,
    };
  });
}

export function previewToTransaction(
  row: CsvPreviewRow,
  batchId: string,
  now: string,
): Transaction | null {
  if (!row.date || !row.amountPaise || !row.direction || !row.include) return null;
  return {
    id: `tx-import-${batchId}-${row.rowNumber}`,
    date: row.date,
    description: row.description.slice(0, 120),
    amountPaise: row.amountPaise,
    direction: row.direction,
    category: row.category,
    source: "csv_import",
    importBatchId: batchId,
    note: null,
    categoryConfidence: row.confidence,
    categoryEditedByUser: false,
    createdAt: now,
  };
}

export function rupeesFromPaise(paise: number): number {
  return paise / 100;
}

export { rupeesToPaise };
