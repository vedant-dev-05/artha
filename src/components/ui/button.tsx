import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "icon";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-primary text-on-primary hover:bg-primary-container active:bg-primary-container disabled:bg-surface-high disabled:text-on-surface-variant",
  secondary:
    "bg-secondary-container text-on-secondary-container hover:bg-accent-soft active:bg-accent-soft",
  outline:
    "bg-surface-lowest text-on-surface border border-outline-variant hover:border-primary/40 hover:bg-surface-low",
  ghost: "bg-transparent text-on-surface-variant hover:bg-surface-container hover:text-on-surface",
  danger: "bg-error text-on-error hover:bg-error/90",
  icon:
    "bg-surface-lowest text-on-surface border border-outline-variant/70 hover:bg-surface-low w-10 h-10 rounded-full",
};

const sizes: Record<Size, string> = {
  sm: "px-3 py-1.5 text-label-md min-h-9",
  md: "px-4 py-2.5 text-label-lg min-h-11",
  lg: "px-5 py-3 text-label-lg min-h-12",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-label transition-colors duration-state-change ease-state-change disabled:cursor-not-allowed disabled:opacity-70",
        variant !== "icon" && sizes[size],
        variants[variant],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    />
  );
}
