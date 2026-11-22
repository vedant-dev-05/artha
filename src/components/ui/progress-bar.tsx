import { cn } from "@/lib/cn";

interface ProgressBarProps {
  percent: number;
  tone?: "primary" | "accent" | "warning" | "success";
  className?: string;
  trackClassName?: string;
  label?: string;
}

const tones = {
  primary: "bg-primary",
  accent: "bg-accent",
  warning: "bg-warning",
  success: "bg-success",
};

export function ProgressBar({
  percent,
  tone = "primary",
  className,
  trackClassName,
  label,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, percent));
  return (
    <div
      className={cn(
        "h-2 w-full overflow-hidden rounded-full bg-surface-container",
        trackClassName,
        className,
      )}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      aria-label={label}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-250 ease-out", tones[tone])}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
