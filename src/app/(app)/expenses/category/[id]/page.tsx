"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useAppStore } from "@/store/app-store";
import { getCategory } from "@/domain/categories";
import { getSpendingSummary } from "@/domain/selectors";
import { formatINR } from "@/domain/money";
import { monthKey, todayISO } from "@/domain/dates";
import type { CategoryId } from "@/domain/types";
import { TopBar } from "@/components/navigation/top-bar";
import { MonthSelector } from "@/components/expenses/month-selector";
import { TransactionRow } from "@/components/expenses/transaction-row";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { EmptyState } from "@/components/ui/states";

function CategoryDetail() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const data = useAppStore((state) => state.data);

  const categoryId = params.id as CategoryId;
  const category = getCategory(categoryId);
  const initialMonth = searchParams.get("month") ?? monthKey(todayISO());
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);

  const summary = useMemo(() => getSpendingSummary(data, selectedMonth), [data, selectedMonth]);
  const totals = summary.categoryTotals.find((item) => item.categoryId === categoryId);
  const transactions = useMemo(
    () =>
      data.transactions
        .filter(
          (transaction) =>
            transaction.category === categoryId &&
            monthKey(transaction.date) === selectedMonth,
        )
        .sort((a, b) => b.date.localeCompare(a.date)),
    [data.transactions, categoryId, selectedMonth],
  );

  return (
    <>
      <TopBar
        title={category.label}
        subtitle="Category detail"
        backHref="/expenses"
      />

      <main className="flex flex-col gap-4 px-4">
        <MonthSelector value={selectedMonth} onChange={setSelectedMonth} />

        <Card className="flex flex-col gap-3 p-4">
          <div className="flex items-center gap-3">
            <span
              className="flex h-11 w-11 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${category.color}1A`, color: category.color }}
            >
              <Icon name={category.icon} size={22} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-body text-label-md text-on-surface-variant">Spent this month</p>
              <p className="font-display text-headline-lg tabular-nums text-on-surface">
                {formatINR(totals?.totalPaise ?? 0)}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-surface-container px-3 py-1 font-label text-label-sm tabular-nums text-on-surface-variant">
              {totals?.percent ?? 0}% of spend
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.max(2, totals?.percent ?? 0)}%`,
                backgroundColor: category.color,
              }}
            />
          </div>
          <p className="font-body text-body-md text-on-surface-variant">
            {transactions.length} {transactions.length === 1 ? "transaction" : "transactions"} in{" "}
            {summary.monthLabel}. Transfers and income are never counted here.
          </p>
        </Card>

        {transactions.length === 0 ? (
          <EmptyState
            icon="receipt_long"
            title="Nothing in this category"
            description="No recorded spending in this category for the selected month."
            action={
              <Link
                href="/expenses"
                className="inline-flex min-h-11 items-center rounded-full bg-primary px-4 py-2.5 font-label text-label-lg text-on-primary"
              >
                Back to expenses
              </Link>
            }
          />
        ) : (
          <Card className="divide-y divide-outline-variant/40 px-4">
            {transactions.map((transaction) => (
              <TransactionRow key={transaction.id} transaction={transaction} />
            ))}
          </Card>
        )}

        <Link
          href="/expenses/transactions"
          className="inline-flex items-center gap-1 self-start font-label text-label-md text-primary hover:underline"
        >
          See all transactions
          <Icon name="arrow_forward" size={14} />
        </Link>
      </main>
    </>
  );
}

export default function CategoryDetailPage() {
  return (
    <Suspense fallback={null}>
      <CategoryDetail />
    </Suspense>
  );
}
