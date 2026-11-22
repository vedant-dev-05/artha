import { formatINR } from "@/domain/money";
import { cn } from "@/lib/cn";
import type { Paise } from "@/domain/types";

interface MoneyProps {
  paise: Paise;
  className?: string;
  showPaise?: boolean;
  signed?: boolean;
}

export function Money({ paise, className, showPaise, signed }: MoneyProps) {
  return (
    <span className={cn("tabular-nums", className)}>{formatINR(paise, { showPaise, signed })}</span>
  );
}
