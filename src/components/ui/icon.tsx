import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";

interface IconProps {
  name: string;
  className?: string;
  filled?: boolean;
  size?: number;
  style?: CSSProperties;
}

export function Icon({ name, className, filled = false, size, style }: IconProps) {
  return (
    <span
      aria-hidden="true"
      className={cn("material-symbols-outlined", className)}
      style={{
        fontSize: size ? `${size}px` : undefined,
        fontVariationSettings: filled
          ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24"
          : undefined,
        ...style,
      }}
    >
      {name}
    </span>
  );
}
