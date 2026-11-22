import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "./icon";

type BadgeTone = "success" | "warning" | "neutral" | "accent";

const tones: Record<BadgeTone, { container: string; dot: string }> = {
  success: {
    container: "bg-success-container text-on-success-container",
    dot: "bg-success",
  },
  warning: {
    container: "bg-warning-container text-on-warning-container",
    dot: "bg-warning",
  },
  neutral: {
    container: "bg-surface-container text-on-surface-variant",
    dot: "bg-outline",
  },
  accent: {
    container: "bg-accent-soft text-on-accent",
    dot: "bg-on-accent",
  },
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  dot?: boolean;
  icon?: string;
}

export function Badge({ tone = "neutral", dot = true, icon, className, children, ...props }: BadgeProps) {
  const palette = tones[tone];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 font-label text-label-sm",
        palette.container,
        className,
      )}
      {...props}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", palette.dot)} aria-hidden="true" />}
      {icon && <Icon name={icon} size={13} />}
      {children}
    </span>
  );
}
