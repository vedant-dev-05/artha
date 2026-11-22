import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "plain" | "elevated" | "filled" | "action" | "interactive";
  as?: "div" | "article" | "section";
}

const variants = {
  plain: "bg-surface-lowest border border-outline-variant/60",
  elevated: "bg-surface-lowest border border-outline-variant/60 shadow-sm",
  filled: "bg-primary text-on-primary",
  action: "bg-secondary-container/60 border border-outline-variant/60",
  interactive:
    "bg-surface-lowest border border-outline-variant/60 shadow-sm hover:border-primary/40 transition-colors duration-state-change ease-state-change",
};

export function Card({
  variant = "elevated",
  as: Tag = "div",
  className,
  ...props
}: CardProps) {
  return <Tag className={cn("rounded-lg", variants[variant], className)} {...props} />;
}
