"use client";

import { useState } from "react";
import Link from "next/link";
import { useAppStore } from "@/store/app-store";
import { getCategory } from "@/domain/categories";
import { formatShortDate, monthKey, todayISO } from "@/domain/dates";
import { formatINR, sumPaise } from "@/domain/money";
import { getCapacity, getSpendingSummary } from "@/domain/selectors";
import type { ImportBatch, Transaction } from "@/domain/types";
import { TopBar } from "@/components/navigation/top-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { EmptyState, InlineMessage } from "@/components/ui/states";
import { Sheet } from "@/components/ui/sheet";

const linkClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-outline-variant bg-surface-lowest px-4 font-label text-label-md text-on-surface transition-colors hover:border-primary/40";
const secondaryLinkClass =
  "inline-flex min-h-9 flex-1 items-center justify-center gap-1 rounded-full bg-secondary-container px-3 font-label text-label-md text-on-secondary-container hover:bg-accent-soft";

export default function DataManagementPage() {
  const data = useAppStore((state) => state.data);
  const deleteImportBatch = useAppStore((state) => state.deleteImportBatch);
  const deleteAllImported = useAppStore((state) => state.deleteAllImported);
  const showToast = useAppStore((state) => state.showToast);

  const [batchToDelete, setBatchToDelete] = useState<ImportBatch | null>(null);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);

  const currentMonth = monthKey(todayISO());
  const summary = getSpendingSummary(data, currentMonth);
  const isSpendingDebit = (transaction: Transaction) =>
    transaction.direction === "debit" && getCategory(transaction.category).spending;
  const csvPaise = sumPaise(
    data.transactions
      .filter(
        (transaction) =>
          isSpendingDebit(transaction) &&
          transaction.source === "csv_import" &&
          monthKey(transaction.date) === currentMonth,
      )
      .map((transaction) => transaction.amountPaise),
  );
  const manualPaise = sumPaise(
    data.transactions
      .filter(
        (transaction) =>
          isSpendingDebit(transaction) &&
          transaction.source === "manual" &&
          monthKey(transaction.date) === currentMonth,
      )
      .map((transaction) => transaction.amountPaise),
  );
  const capacity = getCapacity(data);
  const baselinePaise = capacity.essentialsPaise + capacity.commitmentsPaise + capacity.protectedPaise;
  const batches = data.importBatches;

  function handleDeleteBatch() {
    if (!batchToDelete) return;
    const removed = deleteImportBatch(batchToDelete.id);
    const filename = batchToDelete.filename;
    setBatchToDelete(null);
    showToast(`Removed ${removed} transactions from ${filename}`);
  }

  function handleDeleteAll() {
    const removed = deleteAllImported();
    setDeleteAllOpen(false);
    showToast(`Removed ${removed} imported transactions`);
  }

  return (
    <>
      <TopBar
        title="Financial data"
        subtitle="CSV imports vs. manual estimates"
        backHref="/settings"
      />

      <main className="flex flex-col gap-4 px-4">
        <InlineMessage tone="info" icon="lock">
          Raw CSV files are never retained. This demo keeps only import metadata and normalised
          transactions in this browser.
        </InlineMessage>

        <Card className="flex flex-col gap-3 p-4">
          <div className="flex items-center gap-2">
            <Icon name="analytics" size={18} className="text-primary" />
            <h2 className="font-title text-title-md text-on-surface">How your numbers are sourced</h2>
          </div>
          <p className="font-body text-body-md text-on-surface-variant">
            {summary.monthLabel} · {summary.transactionCount} spending transactions
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-md border border-outline-variant/50 bg-surface-lowest p-3">
              <Badge tone="success" dot={false} className="mb-1">
                Actual CSV
              </Badge>
              <p className="font-title text-title-md tabular-nums text-on-surface">
                {formatINR(csvPaise)}
              </p>
              <p className="font-body text-body-md text-on-surface-variant">Imported this month</p>
            </div>
            <div className="rounded-md border border-outline-variant/50 bg-surface-lowest p-3">
              <Badge tone="neutral" dot={false} className="mb-1">
                Manual estimate
              </Badge>
              <p className="font-title text-title-md tabular-nums text-on-surface">
                {formatINR(baselinePaise)}
              </p>
              <p className="font-body text-body-md text-on-surface-variant">Monthly baseline</p>
            </div>
          </div>
          <p className="font-body text-body-md text-on-surface-variant">
            This month&apos;s tracked spend is {formatINR(summary.totalPaise)} across{" "}
            {summary.transactionCount} transactions, of which {formatINR(manualPaise)} were entered
            manually. Baseline estimates are not added to transaction totals.
          </p>
        </Card>

        <Link href="/expenses/import" className={linkClass}>
          <Icon name="upload_file" size={18} />
          Upload updated CSV
        </Link>

        <section aria-label="Uploaded CSV files" className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3 px-1">
            <h2 className="font-headline text-headline-md text-on-surface">Uploaded CSV files</h2>
            <span className="font-label text-label-md tabular-nums text-on-surface-variant">
              {batches.length} {batches.length === 1 ? "file" : "files"}
            </span>
          </div>

          {batches.length === 0 ? (
            <EmptyState
              icon="description"
              title="No CSV imports yet"
              description="Upload a generic CSV and map its columns to start tracking actual spend."
              action={
                <Link href="/expenses/import" className={linkClass}>
                  Upload a CSV
                </Link>
              }
            />
          ) : (
            <div className="flex flex-col gap-3">
              {batches.map((batch) => {
                const period =
                  batch.periodStart && batch.periodEnd
                    ? `${formatShortDate(batch.periodStart)} – ${formatShortDate(batch.periodEnd)}`
                    : "Period not recorded";
                return (
                  <Card key={batch.id} className="flex flex-col gap-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-start gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-success-container text-on-success-container">
                          <Icon name="description" size={20} />
                        </span>
                        <div className="min-w-0">
                          <h3 className="truncate font-title text-title-md text-on-surface">
                            {batch.filename}
                          </h3>
                          <p className="font-body text-body-md tabular-nums text-on-surface-variant">
                            {period} · {batch.importedRows} txns
                          </p>
                          <p className="mt-0.5 font-label text-label-sm text-on-surface-variant">
                            Uploaded {formatShortDate(batch.createdAt.slice(0, 10))}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setBatchToDelete(batch)}
                        aria-label={`Delete ${batch.filename}`}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-container text-error hover:bg-error-container"
                      >
                        <Icon name="delete" size={18} />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 border-t border-outline-variant/40 pt-3">
                      <Badge tone="success" dot={false}>
                        {batch.importedRows} imported
                      </Badge>
                      <Badge tone="neutral" dot={false}>
                        {batch.skippedRows} skipped
                      </Badge>
                      <Badge tone="warning" dot={false}>
                        {batch.duplicateRows} duplicates
                      </Badge>
                    </div>
                    <Link href="/expenses/transactions" className={secondaryLinkClass}>
                      Review transactions
                      <Icon name="arrow_forward" size={14} />
                    </Link>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        <section aria-label="Manual estimates" className="flex flex-col gap-2">
          <h2 className="font-headline text-headline-md text-on-surface">Manual estimates</h2>
          <Card className="flex items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="font-title text-title-md text-on-surface">Baseline commitments</p>
              <p className="font-body text-body-md tabular-nums text-on-surface-variant">
                {formatINR(capacity.commitmentsPaise)} fixed · {formatINR(capacity.protectedPaise)}{" "}
                protected · {formatINR(baselinePaise)} total
              </p>
            </div>
            <Link
              href="/settings/financial"
              className="shrink-0 rounded-full border border-outline-variant px-3 py-1.5 font-label text-label-md text-primary hover:border-primary/40"
            >
              Edit
            </Link>
          </Card>
        </section>

        <section aria-label="Clear imported data" className="pt-1">
          <Button
            variant="danger"
            fullWidth
            disabled={batches.length === 0}
            onClick={() => setDeleteAllOpen(true)}
          >
            Delete all imported transactions
          </Button>
          <p className="mt-2 px-1 font-body text-label-md text-on-surface-variant">
            Manual entries and your profile estimates are not affected by this action.
          </p>
        </section>
      </main>

      <Sheet
        open={batchToDelete !== null}
        onClose={() => setBatchToDelete(null)}
        title="Delete this CSV import?"
        description={
          batchToDelete
            ? `${batchToDelete.filename} · ${batchToDelete.importedRows} imported transactions`
            : undefined
        }
        footer={
          <div className="flex gap-2">
            <Button variant="danger" fullWidth onClick={handleDeleteBatch}>
              Delete import
            </Button>
            <Button variant="outline" onClick={() => setBatchToDelete(null)}>
              Cancel
            </Button>
          </div>
        }
      >
        <p className="font-body text-body-md text-on-surface-variant">
          This removes the import metadata and the transactions normalised from this file. Manual
          entries stay. This cannot be undone.
        </p>
      </Sheet>

      <Sheet
        open={deleteAllOpen}
        onClose={() => setDeleteAllOpen(false)}
        title="Delete all imported transactions?"
        description="Every CSV import in this browser will be removed."
        footer={
          <div className="flex gap-2">
            <Button variant="danger" fullWidth onClick={handleDeleteAll}>
              Delete everything imported
            </Button>
            <Button variant="outline" onClick={() => setDeleteAllOpen(false)}>
              Cancel
            </Button>
          </div>
        }
      >
        <p className="font-body text-body-md text-on-surface-variant">
          All import metadata and normalised CSV transactions will be deleted. Manual entries, goals
          and your profile are kept. This cannot be undone.
        </p>
      </Sheet>
    </>
  );
}
