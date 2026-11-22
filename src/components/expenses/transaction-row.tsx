import type { Transaction } from "@/domain/types";
import { getCategory } from "@/domain/categories";
import { formatINR } from "@/domain/money";
import { formatShortDate } from "@/domain/dates";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";

export function TransactionRow({ transaction }: { transaction: Transaction }) {
  const category = getCategory(transaction.category);
  const isCredit = transaction.direction === "credit";

  return (
    <div className="flex items-center gap-3 py-2.5">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
        style={{ backgroundColor: `${category.color}1A`, color: category.color }}
      >
        <Icon name={category.icon} size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-body text-body-lg text-on-surface">{transaction.description}</p>
        <p className="flex items-center gap-1.5 font-body text-label-md text-on-surface-variant">
          <span>{formatShortDate(transaction.date)}</span>
          <span aria-hidden="true">·</span>
          <span className="truncate">{category.label}</span>
          <Badge tone={transaction.source === "manual" ? "neutral" : "accent"} dot={false}>
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
    </div>
  );
}
