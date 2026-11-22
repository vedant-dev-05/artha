import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "./icon";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon = "inbox", title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-lg border border-dashed border-outline-variant bg-surface-lowest px-5 py-8 text-center",
        className,
      )}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-container text-on-surface-variant">
        <Icon name={icon} size={24} />
      </span>
      <div className="space-y-1">
        <h3 className="font-title text-title-md text-on-surface">{title}</h3>
        <p className="font-body text-body-md text-on-surface-variant">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex flex-col gap-3" role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      <div className="h-28 animate-pulse rounded-xl bg-surface-container" />
      <div className="h-20 animate-pulse rounded-lg bg-surface-container" />
      <div className="h-20 animate-pulse rounded-lg bg-surface-container" />
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  description: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Something didn’t load",
  description,
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3 rounded-lg border border-error/30 bg-error-container/40 p-4"
    >
      <div className="flex items-center gap-2 text-on-error-container">
        <Icon name="error" size={20} />
        <h3 className="font-title text-title-md">{title}</h3>
      </div>
      <p className="font-body text-body-md text-on-error-container">{description}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="font-label text-label-lg text-on-error-container underline underline-offset-4"
        >
          Try again
        </button>
      )}
    </div>
  );
}

interface InlineMessageProps {
  tone?: "info" | "warning" | "error" | "success";
  icon?: string;
  children: ReactNode;
  className?: string;
}

const messageTones = {
  info: "bg-surface-container text-on-surface",
  warning: "bg-warning-container text-on-warning-container border-warning/30",
  error: "bg-error-container text-on-error-container border-error/30",
  success: "bg-success-container text-on-success-container border-success/20",
};

export function InlineMessage({ tone = "info", icon, children, className }: InlineMessageProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-lg border border-transparent p-3 font-body text-body-md",
        messageTones[tone],
        className,
      )}
    >
      {icon && <Icon name={icon} size={18} className="mt-0.5 shrink-0" />}
      <div>{children}</div>
    </div>
  );
}
