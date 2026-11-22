"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAppStore } from "@/store/app-store";
import {
  getMonthlyTrend,
  getSpendingSummary,
  type SpendingSummary,
} from "@/domain/selectors";
import { isSpendingCategory } from "@/domain/categories";
import { formatINR } from "@/domain/money";
import { monthKey, monthKeyShortLabel, recentMonthKeys, todayISO } from "@/domain/dates";
import { TopBar } from "@/components/navigation/top-bar";
import { MonthSelector } from "@/components/expenses/month-selector";
import { CategoryDonut } from "@/components/expenses/category-donut";
import { TransactionRow } from "@/components/expenses/transaction-row";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { EmptyState } from "@/components/ui/states";
import { cn } from "@/lib/cn";

function buildInsight(current: SpendingSummary, previous: SpendingSummary): string | null {
  const changes = current.categoryTotals
    .map((category) => {
      const before = previous.categoryTotals.find((item) => item.categoryId === category.categoryId);
      return {
        label: category.label,
        delta: category.totalPaise - (before?.totalPaise ?? 0),
      };
    })
    .filter((item) => item.delta !== 0)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  if (changes.length === 0) return null;
  const largest = changes[0];
  const direction = largest.delta > 0 ? "higher" : "lower";
  return `${largest.label} is ${formatINR(Math.abs(largest.delta))} ${direction} than last month.`;
}

export default function ExpensesPage() {
  const data = useAppStore((state) => state.data);
  const [selectedMonth, setSelectedMonth] = useState(() => monthKey(todayISO()));

  const summary = useMemo(() => getSpendingSummary(data, selectedMonth), [data, selectedMonth]);
  const previousKey = useMemo(
    () => recentMonthKeys(2, `${selectedMonth}-01`)[1] ?? selectedMonth,
    [selectedMonth],
  );
  const previous = useMemo(() => getSpendingSummary(data, previousKey), [data, previousKey]);
  const trend = useMemo(() => getMonthlyTrend(data, 6), [data]);

  const monthTransactions = useMemo(
    () =>
      data.transactions
        .filter((transaction) => monthKey(transaction.date) === selectedMonth)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [data.transactions, selectedMonth],
  );

  const spendingTransactions = monthTransactions.filter(
    (transaction) =>
      transaction.direction === "debit" && isSpendingCategory(transaction.category),
  );
  const csvCount = spendingTransactions.filter(
    (transaction) => transaction.source === "csv_import",
  ).length;
  const manualCount = spendingTransactions.filter(
    (transaction) => transaction.source === "manual",
  ).length;
  const topCategories = summary.categoryTotals.slice(0, 4);
  const insight = buildInsight(summary, previous);
  const maxTrend = Math.max(...trend.map((point) => point.totalPaise), 1);
  const currentKey = monthKey(todayISO());
  const isCurrentMonth = selectedMonth === currentKey;

  return (
    <>
      <TopBar
        title="Expense tracking"
        subtitle="Calm visibility into where money goes"
        trailing={
          <div className="flex items-center gap-2">
            <Link
              href="/expenses/import"
              aria-label="Import a CSV statement"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant/70 bg-surface-lowest text-on-surface transition-colors hover:bg-surface-low"
            >
              <Icon name="upload_file" size={20} />
            </Link>
            <Link
              href="/expenses/new"
              aria-label="Add a manual expense"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-on-primary transition-colors hover:bg-primary-container"
            >
              <Icon name="add" size={20} />
            </Link>
          </div>
        }
      />

      <main className="flex flex-col gap-5 px-4">
        <section aria-label="Month selector">
          <MonthSelector value={selectedMonth} onChange={setSelectedMonth} />
        </section>

        <section aria-label="Monthly spending overview">
          <Card className="flex flex-col gap-3 rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="font-label text-label-md text-on-surface-variant">
                  Total expenditure
                </span>
                <p className="font-display text-display-lg-mobile tabular-nums text-on-surface">
                  {formatINR(summary.totalPaise)}
                </p>
              </div>
              {summary.changePercent !== null && summary.previousTotalPaise > 0 && (
                <>
                  {summary.changePercent === 0 ? (
                    <Badge tone="neutral" dot={false}>
                      Flat vs {monthKeyShortLabel(previousKey)}
                    </Badge>
                  ) : (
                    <Badge
                      tone={summary.changePercent <= 0 ? "success" : "warning"}
                      dot={false}
                      icon={summary.changePercent <= 0 ? "trending_down" : "trending_up"}
                    >
                      {Math.abs(summary.changePercent)}% vs {monthKeyShortLabel(previousKey)}
                    </Badge>
                  )}
                </>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 border-t border-outline-variant/40 pt-2.5">
              <div>
                <span className="font-label text-label-sm text-on-surface-variant">
                  Transactions
                </span>
                <p className="font-title text-title-md tabular-nums text-on-surface">
                  {summary.transactionCount} spending
                </p>
              </div>
              <div>
                <span className="font-label text-label-sm text-on-surface-variant">Data mix</span>
                <p className="font-title text-title-md tabular-nums text-primary">
                  {csvCount} CSV · {manualCount} Manual
                </p>
              </div>
            </div>
            {!isCurrentMonth && (
              <p className="rounded-md bg-surface-low px-2.5 py-2 font-body text-label-md text-on-surface-variant">
                Showing a past month. Income and transfers are excluded from expenditure.
              </p>
            )}
          </Card>
        </section>

        <section aria-label="Category breakdown" className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-headline text-headline-md text-on-surface">By category</h2>
            <Link
              href="/expenses/transactions"
              className="font-label text-label-md text-primary hover:underline"
            >
              All transactions →
            </Link>
          </div>

          {summary.totalPaise === 0 ? (
            <EmptyState
              icon="receipt_long"
              title="No spending recorded"
              description="Add an expense or import a CSV statement to see category insights for this month."
              action={
                <Link
                  href="/expenses/new"
                  className="inline-flex min-h-11 items-center rounded-full bg-primary px-4 py-2.5 font-label text-label-lg text-on-primary"
                >
                  Add expense
                </Link>
              }
            />
          ) : (
            <Card className="flex flex-col gap-4 p-4">
              <div className="flex items-center gap-4">
                <CategoryDonut
                  size={132}
                  stroke={16}
                  totalPaise={summary.totalPaise}
                  centerLabel={summary.categoryTotals[0]?.label.split(" ")[0] ?? "spent"}
                  segments={summary.categoryTotals.map((category) => ({
                    label: category.label,
                    color: category.color,
                    percent: category.percent,
                  }))}
                />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  {topCategories.map((category) => (
                    <Link
                      key={category.categoryId}
                      href={`/expenses/category/${category.categoryId}?month=${selectedMonth}`}
                      className="flex items-center justify-between gap-2 rounded-md px-1.5 py-1 transition-colors hover:bg-surface-low"
                    >
                      <span className="flex min-w-0 items-center gap-2 font-body text-body-md text-on-surface">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="truncate">{category.label}</span>
                      </span>
                      <span className="shrink-0 font-mono text-mono-md tabular-nums text-on-surface">
                        {formatINR(category.totalPaise)}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2.5 border-t border-outline-variant/40 pt-3">
                {summary.categoryTotals.map((category) => (
                  <div key={category.categoryId} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 font-body text-body-md text-on-surface">
                        <Icon name={category.icon} size={15} style={{ color: category.color }} />
                        {category.label}
                      </span>
                      <span className="font-body text-label-md tabular-nums text-on-surface-variant">
                        {formatINR(category.totalPaise)} · {category.percent}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.max(2, category.percent)}%`,
                          backgroundColor: category.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </section>

        <section aria-label="Spending trends" className="flex flex-col gap-2.5">
          <h2 className="font-headline text-headline-md text-on-surface">Spending trends</h2>
          <Card className="flex flex-col gap-3 p-4">
            <div className="grid h-24 grid-cols-6 items-end gap-2 pt-2">
              {trend.map((point) => {
                const height = Math.max(4, Math.round((point.totalPaise / maxTrend) * 100));
                const active = point.monthKey === selectedMonth;
                return (
                  <div
                    key={point.monthKey}
                    className="flex h-full flex-col items-center justify-end gap-1"
                  >
                    <div
                      className={cn(
                        "w-full rounded-t-md transition-colors",
                        active ? "bg-primary" : "bg-secondary-container",
                      )}
                      style={{ height: `${height}%` }}
                      title={`${point.label}: ${formatINR(point.totalPaise)}`}
                    />
                    <span
                      className={cn(
                        "font-label text-label-sm",
                        active ? "text-primary" : "text-on-surface-variant",
                      )}
                    >
                      {point.label}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex flex-col gap-1.5 border-t border-outline-variant/40 pt-2">
              <p className="font-body text-body-md text-on-surface">
                {insight ??
                  (summary.totalPaise > 0
                    ? "No category changed enough to call out this month."
                    : "No spending to compare yet this month.")}
              </p>
              <p className="font-label text-label-sm text-on-surface-variant">
                Based on recorded transactions only. Transfers and income are excluded.
              </p>
            </div>
          </Card>
        </section>

        <section aria-label="Recent transactions" className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <h2 className="font-headline text-headline-md text-on-surface">Recent transactions</h2>
            <Link
              href="/expenses/transactions"
              className="font-label text-label-md text-primary hover:underline"
            >
              See all ({monthTransactions.length})
            </Link>
          </div>
          {monthTransactions.length === 0 ? (
            <EmptyState
              icon="receipt_long"
              title="Nothing recorded yet"
              description="Manual entries and CSV imports both appear here."
            />
          ) : (
            <Card className="divide-y divide-outline-variant/40 px-4">
              {monthTransactions.slice(0, 5).map((transaction) => (
                <TransactionRow key={transaction.id} transaction={transaction} />
              ))}
            </Card>
          )}
        </section>

        <section aria-label="Quick expense actions" className="grid grid-cols-2 gap-3 pb-2">
          <Link
            href="/expenses/new"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-4 py-3 text-center font-label text-label-md text-on-primary transition-colors hover:bg-primary-container"
          >
            + Add expense
          </Link>
          <Link
            href="/expenses/import"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-secondary-container px-4 py-3 text-center font-label text-label-md text-on-secondary-container transition-colors hover:bg-accent-soft"
          >
            Import CSV
          </Link>
        </section>
      </main>
    </>
  );
}
