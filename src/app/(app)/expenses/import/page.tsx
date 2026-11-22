"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useAppStore } from "@/store/app-store";
import { CATEGORIES } from "@/domain/categories";
import { formatINR } from "@/domain/money";
import {
  buildPreview,
  EMPTY_MAPPING,
  MAX_CSV_BYTES,
  MAX_CSV_ROWS,
  parseCsv,
  previewToTransaction,
  suggestMapping,
  type CsvMapping,
  type CsvPreviewRow,
  type DateFormat,
} from "@/domain/csv-import";
import type { CategoryId } from "@/domain/types";
import { TopBar } from "@/components/navigation/top-bar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { EmptyState, InlineMessage } from "@/components/ui/states";

type Stage = "upload" | "map" | "review" | "done";

const MAPPING_FIELDS: Array<{ key: keyof CsvMapping; label: string; hint: string }> = [
  { key: "date", label: "Date", hint: "Required" },
  { key: "description", label: "Description", hint: "Required" },
  { key: "debit", label: "Debit / spend", hint: "Or use a signed amount" },
  { key: "credit", label: "Credit / income", hint: "Optional" },
  { key: "amount", label: "Single amount", hint: "Signed or with a type column" },
  { key: "type", label: "Transaction type", hint: "Debit/credit, Dr/Cr" },
];

const DATE_FORMATS: Array<{ value: DateFormat; label: string }> = [
  { value: "auto", label: "Auto (DD/MM/YYYY first)" },
  { value: "dd/MM/yyyy", label: "DD/MM/YYYY" },
  { value: "MM/dd/yyyy", label: "MM/DD/YYYY" },
  { value: "yyyy-MM-dd", label: "YYYY-MM-DD" },
];

interface ImportSummary {
  imported: number;
  detected: number;
  duplicates: number;
  invalid: number;
  review: number;
  filename: string;
}

export default function ImportPage() {
  const transactions = useAppStore((state) => state.data.transactions);
  const commitImport = useAppStore((state) => state.commitImport);
  const fileInput = useRef<HTMLInputElement>(null);

  const [stage, setStage] = useState<Stage>("upload");
  const [filename, setFilename] = useState("");
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<CsvMapping>(EMPTY_MAPPING);
  const [dateFormat, setDateFormat] = useState<DateFormat>("auto");
  const [preview, setPreview] = useState<CsvPreviewRow[]>([]);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<ImportSummary | null>(null);

  const headers = rows[0] ?? [];
  const sampleRows = rows.slice(1, 4);

  const counts = useMemo(() => {
    const included = preview.filter((row) => row.include && row.date && row.amountPaise && row.direction);
    return {
      included: included.length,
      duplicates: preview.filter((row) => row.duplicate).length,
      invalid: preview.filter((row) => row.status === "invalid").length,
      review: preview.filter((row) => row.status === "review").length,
    };
  }, [preview]);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError("");
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError(`"${file.name}" is not a CSV file. Export your statement as .csv, or add an expense manually.`);
      return;
    }
    if (file.size > MAX_CSV_BYTES) {
      setError("The file is larger than 5 MB. Export a shorter date range and try again.");
      return;
    }

    const text = (await file.text()).replace(/^\uFEFF/, "");
    const parsed = parseCsv(text);
    if (parsed.length < 2 || (parsed[0]?.length ?? 0) < 2) {
      setError("This does not look like a CSV statement. Expected a header row and at least one transaction row.");
      return;
    }
    if (parsed.length - 1 > MAX_CSV_ROWS) {
      setError(`This file has more than ${MAX_CSV_ROWS} rows. Export a shorter period.`);
      return;
    }

    setRows(parsed);
    setFilename(file.name);
    setMapping(suggestMapping(parsed[0]));
    setStage("map");
  }

  function handleProcess() {
    setError("");
    if (mapping.date < 0 || mapping.description < 0) {
      setError("Choose a date column and a description column before continuing.");
      return;
    }
    if (mapping.debit < 0 && mapping.credit < 0 && mapping.amount < 0) {
      setError("Choose at least one amount column (debit, credit or a single amount).");
      return;
    }
    const next = buildPreview({ rows, mapping, dateFormat, existingTransactions: transactions });
    if (next.every((row) => row.status === "invalid")) {
      setError("No usable transactions were found. Check the column mapping and date format.");
      return;
    }
    setPreview(next);
    setStage("review");
  }

  function updateRow(id: string, patch: Partial<CsvPreviewRow>) {
    setPreview((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  function handleConfirm() {
    const included = preview.filter(
      (row) => row.include && row.date && row.amountPaise && row.direction,
    );
    const now = new Date().toISOString();
    const prepared = included.map((row) => previewToTransaction(row, "pending", now)).filter(
      (row): row is NonNullable<typeof row> => row !== null,
    );
    const dates = prepared.map((row) => row.date).sort();
    const imported = commitImport({
      filename,
      sourceLabel: detectSourceLabel(filename),
      periodStart: dates[0] ?? null,
      periodEnd: dates[dates.length - 1] ?? null,
      rows: prepared,
      totalRows: preview.length,
      duplicateRows: counts.duplicates,
    });
    setSummary({
      imported,
      detected: preview.length,
      duplicates: counts.duplicates,
      invalid: counts.invalid,
      review: counts.review,
      filename,
    });
    setStage("done");
  }

  function reset() {
    setStage("upload");
    setFilename("");
    setRows([]);
    setMapping(EMPTY_MAPPING);
    setPreview([]);
    setError("");
    setSummary(null);
    if (fileInput.current) fileInput.current.value = "";
  }

  return (
    <>
      <TopBar
        title={stage === "review" ? "Review import" : "Import CSV"}
        subtitle={stage === "review" ? filename : "Bring in a bank or UPI statement"}
        backHref={stage === "upload" ? "/expenses" : undefined}
      />

      <main className="flex flex-col gap-4 px-4">
        <InlineMessage tone="info" icon="lock">
          The file stays in this browser. Artha reads it locally, keeps only the normalised
          transactions and import metadata, and never stores the raw CSV.
        </InlineMessage>

        {error && (
          <InlineMessage tone="error" icon="error">
            <p className="font-label text-label-lg">Import problem</p>
            <p>{error}</p>
          </InlineMessage>
        )}

        <div className="flex items-center gap-2" aria-label="Import progress">
          {(["upload", "map", "review", "done"] as Stage[]).map((item, index) => (
            <div key={item} className="flex flex-1 items-center gap-2">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-label-sm ${
                  stage === item
                    ? "bg-primary text-on-primary"
                    : index < ["upload", "map", "review", "done"].indexOf(stage)
                      ? "bg-success-container text-on-success-container"
                      : "bg-surface-container text-on-surface-variant"
                }`}
              >
                {index + 1}
              </span>
              {index < 3 && <span className="h-px flex-1 bg-outline-variant" />}
            </div>
          ))}
        </div>

        {stage === "upload" && (
          <>
            <Card className="flex flex-col items-center gap-3 p-6 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
                <Icon name="upload_file" size={28} />
              </span>
              <div className="space-y-1">
                <h2 className="font-headline text-headline-md text-on-surface">Choose a CSV statement</h2>
                <p className="font-body text-body-md text-on-surface-variant">
                  Bank or UPI exports work best. A three-month statement is a useful starting point,
                  but shorter periods are fine.
                </p>
              </div>
              <input
                ref={fileInput}
                id="csv-file"
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                onChange={(event) => void handleFile(event.target.files?.[0])}
              />
              <Button size="lg" fullWidth onClick={() => fileInput.current?.click()}>
                <Icon name="upload_file" size={18} />
                Choose CSV file
              </Button>
              <p className="font-body text-label-md text-on-surface-variant">
                CSV only · max 5 MB · up to 2,000 rows · no PDF, Excel or account login
              </p>
            </Card>

            <Card className="space-y-2 p-4">
              <h2 className="font-title text-title-md text-on-surface">What happens next</h2>
              <ol className="list-decimal space-y-1 pl-5 font-body text-body-md text-on-surface-variant">
                <li>Confirm which columns hold date, description and amounts.</li>
                <li>Review suggested categories, direction and likely duplicates.</li>
                <li>Import only the rows you approve.</li>
              </ol>
            </Card>
          </>
        )}

        {stage === "map" && (
          <>
            <Card className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-title text-title-md text-on-surface">{filename}</p>
                  <p className="font-body text-body-md text-on-surface-variant">
                    {rows.length - 1} rows · {headers.length} columns
                  </p>
                </div>
                <Badge tone="accent" icon="description" dot={false}>
                  Parsed locally
                </Badge>
              </div>

              <div className="space-y-3">
                {MAPPING_FIELDS.map((field) => (
                  <div key={field.key} className="space-y-1">
                    <label htmlFor={`map-${field.key}`} className="font-label text-label-md text-on-surface">
                      {field.label} <span className="text-on-surface-variant">· {field.hint}</span>
                    </label>
                    <select
                      id={`map-${field.key}`}
                      value={mapping[field.key]}
                      onChange={(event) =>
                        setMapping((current) => ({ ...current, [field.key]: Number(event.target.value) }))
                      }
                      className="min-h-11 w-full rounded-md border border-outline-variant bg-surface-lowest px-3 font-body text-body-md outline-none focus:border-primary"
                    >
                      <option value={-1}>None</option>
                      {headers.map((header, index) => (
                        <option key={`${header}-${index}`} value={index}>
                          {header || `Column ${index + 1}`}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}

                <div className="space-y-1">
                  <label htmlFor="date-format" className="font-label text-label-md text-on-surface">
                    Date format
                  </label>
                  <select
                    id="date-format"
                    value={dateFormat}
                    onChange={(event) => setDateFormat(event.target.value as DateFormat)}
                    className="min-h-11 w-full rounded-md border border-outline-variant bg-surface-lowest px-3 font-body text-body-md outline-none focus:border-primary"
                  >
                    {DATE_FORMATS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </Card>

            <Card className="overflow-hidden p-0">
              <p className="border-b border-outline-variant/60 px-4 py-2 font-label text-label-md text-on-surface-variant">
                First rows
              </p>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[420px] text-left font-body text-body-md">
                  <thead className="bg-surface-low text-on-surface-variant">
                    <tr>
                      {headers.map((header, index) => (
                        <th key={`${header}-${index}`} className="whitespace-nowrap px-3 py-2 font-label text-label-sm">
                          {header || `Column ${index + 1}`}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sampleRows.map((row, index) => (
                      <tr key={index} className="border-t border-outline-variant/40">
                        {headers.map((_, column) => (
                          <td key={column} className="max-w-[160px] truncate px-3 py-2 text-on-surface">
                            {row[column] || "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <div className="flex flex-wrap gap-2">
              <Button size="lg" fullWidth onClick={handleProcess}>
                Process &amp; preview transactions
              </Button>
              <Button variant="ghost" fullWidth onClick={reset}>
                Choose another file
              </Button>
            </div>
          </>
        )}

        {stage === "review" && (
          <>
            <div className="flex flex-wrap gap-2">
              <Badge tone="accent" dot={false} icon="task_alt">
                {counts.included} ready to import
              </Badge>
              <Badge tone="warning" dot={false} icon="warning">
                {counts.review} need review
              </Badge>
              {counts.duplicates > 0 && (
                <Badge tone="neutral" dot={false} icon="content_copy">
                  {counts.duplicates} duplicates
                </Badge>
              )}
              {counts.invalid > 0 && (
                <Badge tone="warning" dot={false} icon="block">
                  {counts.invalid} invalid
                </Badge>
              )}
            </div>

            {preview.length === 0 ? (
              <EmptyState
                icon="table_chart"
                title="No rows to review"
                description="Go back and check the column mapping."
              />
            ) : (
              <div className="flex flex-col gap-3">
                {preview.map((row) => (
                  <Card
                    key={row.id}
                    className={`p-4 ${row.include ? "" : "opacity-70"}`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={row.include}
                        disabled={row.status === "invalid"}
                        onChange={(event) => updateRow(row.id, { include: event.target.checked })}
                        aria-label={`Include ${row.description}`}
                        className="mt-1 h-5 w-5 shrink-0 accent-primary"
                      />
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate font-title text-title-md text-on-surface">
                              {row.description}
                            </p>
                            <p className="font-body text-body-md text-on-surface-variant">
                              {row.date ?? "Invalid date"} · row {row.rowNumber}
                            </p>
                          </div>
                          <p className="shrink-0 font-title text-title-md tabular-nums text-on-surface">
                            {row.direction === "credit" ? "+" : "−"}
                            {formatINR(row.amountPaise ?? 0)}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {row.duplicate && <Badge tone="warning" icon="content_copy">Possible duplicate</Badge>}
                          {row.status === "invalid" && <Badge tone="warning" icon="block">Invalid row</Badge>}
                          {row.confidence === "low" && <Badge tone="neutral" icon="help">Category unknown</Badge>}
                          {row.status === "ready" && !row.duplicate && (
                            <Badge tone="success" icon="check">Auto-categorised</Badge>
                          )}
                        </div>

                        {row.reasons.length > 0 && (
                          <p className="font-body text-body-md text-on-surface-variant">
                            {row.reasons.join(" · ")}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              updateRow(row.id, {
                                direction: row.direction === "credit" ? "debit" : "credit",
                              })
                            }
                            className="inline-flex min-h-9 items-center rounded-full border border-outline-variant bg-surface-lowest px-3 font-label text-label-md text-on-surface"
                          >
                            <Icon name={row.direction === "credit" ? "south_west" : "north_east"} size={15} />
                            {row.direction === "credit" ? "Credit" : "Debit"}
                          </button>
                          <select
                            value={row.category}
                            onChange={(event) =>
                              updateRow(row.id, { category: event.target.value as CategoryId, confidence: "high" })
                            }
                            aria-label={`Category for ${row.description}`}
                            className="min-h-9 rounded-full border border-outline-variant bg-surface-lowest px-3 font-label text-label-md outline-none focus:border-primary"
                          >
                            {CATEGORIES.map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            <div className="flex flex-col gap-2 pt-2">
              <Button
                size="lg"
                fullWidth
                disabled={counts.included === 0}
                onClick={handleConfirm}
              >
                Confirm &amp; import {counts.included} transactions
              </Button>
              <Button variant="outline" fullWidth onClick={() => setStage("map")}>
                Back to column mapping
              </Button>
            </div>
          </>
        )}

        {stage === "done" && summary && (
          <>
            <Card className="flex flex-col items-center gap-3 p-6 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-success-container text-on-success-container">
                <Icon name="check_circle" size={32} filled />
              </span>
              <h2 className="font-headline text-headline-md text-on-surface">Import complete</h2>
              <p className="font-body text-body-md text-on-surface-variant">
                {summary.imported} actual CSV transactions were added from {summary.filename}.
                Manual entries stay separate.
              </p>
            </Card>

            <Card className="divide-y divide-outline-variant/60 px-4">
              {[
                ["Rows detected", summary.detected],
                ["Transactions imported", summary.imported],
                ["Duplicates skipped", summary.duplicates],
                ["Invalid rows excluded", summary.invalid],
                ["Flagged for review", summary.review],
              ].map(([label, value]) => (
                <div key={String(label)} className="flex items-center justify-between gap-3 py-3">
                  <span className="font-body text-body-md text-on-surface-variant">{label}</span>
                  <span className="font-title text-title-md tabular-nums text-on-surface">{value}</span>
                </div>
              ))}
            </Card>

            <div className="flex flex-col gap-2">
              <Link
                href="/expenses"
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-4 font-label text-label-lg text-on-primary"
              >
                View Expense Dashboard
              </Link>
              <Button variant="outline" size="lg" fullWidth onClick={reset}>
                Import another file
              </Button>
            </div>
          </>
        )}
      </main>
    </>
  );
}

function detectSourceLabel(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.includes("hdfc")) return "HDFC CSV";
  if (lower.includes("sbi")) return "SBI CSV";
  if (lower.includes("icici")) return "ICICI CSV";
  if (lower.includes("gpay") || lower.includes("google")) return "Google Pay CSV";
  if (lower.includes("phonepe")) return "PhonePe CSV";
  return "Bank / UPI CSV";
}
