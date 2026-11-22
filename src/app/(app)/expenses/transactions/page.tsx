"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAppStore } from "@/store/app-store";
import { CATEGORIES, getCategory } from "@/domain/categories";
import { formatINR } from "@/domain/money";
import {
  formatLongDate,
  monthKey,
  monthKeyLabel,
  recentMonthKeys,
  todayISO,
} from "@/domain/dates";
import type { CategoryId, Transaction, TransactionSource } from "@/domain/types";
import { TopBar } from "@/components/navigation/top-bar";
import { CategoryPicker } from "@/components/expenses/category-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Sheet } from "@/components/ui/sheet";
import { EmptyState } from "@/components/ui/states";

type SourceFilter = "all" | TransactionSource;

export default function TransactionsPage() {
  const data = useAppStore((state) => state.data);
  const updateTransactionCategory = useAppStore((state) => state.updateTransactionCategory);
  const showToast = useAppStore((state) => state.showToast);

  const [query, setQuery] = useState("");
  const [month, setMonth] = useState("all");
  const [category, setCategory] = useState<CategoryId | "all">("all");
  const [source, setSource] = useState<SourceFilter>("all");
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [draftCategory, setDraftCategory] = useState<CategoryId>("food");

  const monthOptions = useMemo(() => recentMonthKeys(6), []);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return data.transactions
      .filter((transaction) => (month === "all" ? true : monthKey(transaction.date) === month))
      .filter((transaction) => (category === "all" ? true : transaction.category === category))
      .filter((transaction) => (source === "all" ? true : transaction.source === source))
      .filter((transaction) =>
        term
          ? transaction.description.toLowerCase().includes(term) ||
            (transaction.note ?? "").toLowerCase().includes(term)
          : true,
      )
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  }, [data.transactions, query, month, category, source]);

  const groups = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const transaction of filtered) {
      const list = map.get(transaction.date) ?? [];
      list.push(transaction);
      map.set(transaction.date, list);
    }
    return [...map.entries()];
  }, [filtered]);

  const filtersActive = month !== "all" || category !== "all" || source !== "all" || query.length > 0;

  function openEditor(transaction: Transaction) {
    setEditing(transaction);
    setDraftCategory(transaction.category);
  }

  function saveCategory() {
    if (!editing) return;
    updateTransactionCategory(editing.id, draftCategory);
    showToast(`Moved to ${getCategory(draftCategory).label}`);
    setEditing(null);
  }

  return (
    <>
      <TopBar
        title="Transactions"
        subtitle="Tap any item to correct its category"
        backHref="/expenses"
        trailing={
          <Link
            href="/expenses/new"
            aria-label="Add manual expense"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-on-primary"
          >
            <Icon name="add" size={20} />
          </Link>
        }
      />

      <main className="flex flex-col gap-4 px-4">
        <div className="relative">
          <Icon
            name="search"
            size={18}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search merchant or note…"
            className="min-h-11 w-full rounded-full border border-outline-variant bg-surface-lowest pl-10 pr-4 font-body text-body-md text-on-surface outline-none placeholder:text-outline focus:border-primary"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            aria-label="Filter by month"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
            className="min-h-9 rounded-full border border-outline-variant bg-surface-lowest px-3 font-label text-label-md text-on-surface outline-none"
          >
            <option value="all">All months</option>
            {monthOptions.map((key) => (
              <option key={key} value={key}>
                {monthKeyLabel(key)}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter by category"
            value={category}
            onChange={(event) => setCategory(event.target.value as CategoryId | "all")}
            className="min-h-9 rounded-full border border-outline-variant bg-surface-lowest px-3 font-label text-label-md text-on-surface outline-none"
          >
            <option value="all">All categories</option>
            {CATEGORIES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter by source"
            value={source}
            onChange={(event) => setSource(event.target.value as SourceFilter)}
            className="min-h-9 rounded-full border border-outline-variant bg-surface-lowest px-3 font-label text-label-md text-on-surface outline-none"
          >
            <option value="all">All sources</option>
            <option value="csv_import">CSV</option>
            <option value="manual">Manual</option>
          </select>
          {filtersActive && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setMonth("all");
                setCategory("all");
                setSource("all");
              }}
              className="min-h-9 rounded-full border border-outline-variant bg-surface-low px-3 font-label text-label-md text-on-surface-variant"
            >
              Clear
            </button>
          )}
        </div>

        <p className="font-body text-label-md text-on-surface-variant">
          {filtered.length} {filtered.length === 1 ? "transaction" : "transactions"}
          {month !== "all" ? ` in ${monthKeyLabel(month)}` : ""}
        </p>

        {groups.length === 0 ? (
          <EmptyState
            icon="search_off"
            title="No matching transactions"
            description="Try clearing the filters, or add a manual expense."
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
          <div className="flex flex-col gap-4 pb-2">
            {groups.map(([date, items]) => (
              <section key={date} aria-label={formatLongDate(date)} className="flex flex-col gap-2">
                <h2 className="px-1 font-label text-label-md text-on-surface-variant">
                  {formatLongDate(date)}
                </h2>
                <Card className="divide-y divide-outline-variant/40 px-4">
                  {items.map((transaction) => {
                    const meta = getCategory(transaction.category);
                    const isCredit = transaction.direction === "credit";
                    return (
                      <button
                        key={transaction.id}
                        type="button"
                        onClick={() => openEditor(transaction)}
                        className="flex w-full items-center gap-3 py-2.5 text-left transition-colors hover:bg-surface-low/60"
                      >
                        <span
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
                          style={{ backgroundColor: `${meta.color}1A`, color: meta.color }}
                        >
                          <Icon name={meta.icon} size={18} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-body text-body-lg text-on-surface">
                            {transaction.description}
                          </p>
                          <p className="flex items-center gap-1.5 font-body text-label-md text-on-surface-variant">
                            <span className="truncate">{meta.label}</span>
                            <Badge
                              tone={transaction.source === "manual" ? "neutral" : "accent"}
                              dot={false}
                            >
                              {transaction.source === "manual" ? "Manual" : "CSV"}
                            </Badge>
                          </p>
                        </div>
                        <span
                          className={`shrink-0 font-title text-title-md tabular-nums ${
                            isCredit ? "text-success" : "text-on-surface"
                          }`}
                        >
                          {isCredit ? "+" : "−"}
                          {formatINR(transaction.amountPaise)}
                        </span>
                      </button>
                    );
                  })}
                </Card>
              </section>
            ))}
          </div>
        )}
      </main>

      <Sheet
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title="Edit transaction"
        description="Only the category can be changed in this demo. The original CSV file is not stored."
        footer={
          <div className="flex gap-2">
            <Button fullWidth onClick={saveCategory}>
              Save category
            </Button>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
          </div>
        }
      >
        {editing && (
          <div className="space-y-4">
            <div className="rounded-lg border border-outline-variant/60 bg-surface-lowest p-3">
              <p className="font-title text-title-md text-on-surface">{editing.description}</p>
              <p className="font-body text-body-md tabular-nums text-on-surface-variant">
                {formatINR(editing.amountPaise)} · {formatLongDate(editing.date)} ·{" "}
                {editing.source === "manual" ? "Manual entry" : "CSV import"}
              </p>
            </div>
            <div className="space-y-1.5">
              <span className="font-label text-label-lg text-on-surface">Category</span>
              <CategoryPicker
                value={draftCategory}
                onChange={setDraftCategory}
                includeNonSpending
              />
            </div>
          </div>
        )}
      </Sheet>
    </>
  );
}
