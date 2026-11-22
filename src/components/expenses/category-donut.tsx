import { formatINR } from "@/domain/money";
import type { Paise } from "@/domain/types";

export interface DonutSegment {
  label: string;
  color: string;
  percent: number;
}

interface CategoryDonutProps {
  segments: DonutSegment[];
  totalPaise: Paise;
  size?: number;
  stroke?: number;
  centerLabel?: string;
}

export function CategoryDonut({
  segments,
  totalPaise,
  size = 176,
  stroke = 18,
  centerLabel = "spent",
}: CategoryDonutProps) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`Spending by category: ${centerLabel}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-surface-container)"
          strokeWidth={stroke}
        />
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          {segments.map((segment) => {
            const length = (Math.max(0, segment.percent) / 100) * circumference;
            const dash = `${length} ${circumference - length}`;
            const element = (
              <circle
                key={segment.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={segment.color}
                strokeWidth={stroke}
                strokeDasharray={dash}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
              />
            );
            offset += length;
            return element;
          })}
        </g>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-headline-md tabular-nums text-on-surface">
          {formatINR(totalPaise)}
        </span>
        <span className="font-body text-label-md text-on-surface-variant">{centerLabel}</span>
      </div>
    </div>
  );
}
