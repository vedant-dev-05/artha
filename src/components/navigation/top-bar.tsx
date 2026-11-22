"use client";

import Link from "next/link";
import { useAppStore } from "@/store/app-store";
import { Icon } from "@/components/ui/icon";

export function DemoStrip() {
  return (
    <div className="flex items-center justify-between gap-2 bg-accent-soft px-4 py-1.5 text-on-accent">
      <p className="font-label text-label-sm">
        Demo workspace · sample data saved in this browser
      </p>
      <Link
        href="/settings"
        className="shrink-0 font-label text-label-sm underline underline-offset-2"
      >
        About
      </Link>
    </div>
  );
}

export function Avatar({ size = 40 }: { size?: number }) {
  const user = useAppStore((state) => state.data.user);
  return (
    <span
      aria-hidden="true"
      className="flex shrink-0 items-center justify-center rounded-full bg-primary font-title text-on-primary"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.34) }}
    >
      {user.avatarInitials}
    </span>
  );
}

interface TopBarProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  showAvatar?: boolean;
  showNotifications?: boolean;
  onNotifications?: () => void;
  trailing?: React.ReactNode;
}

export function TopBar({
  title,
  subtitle,
  backHref,
  showAvatar = false,
  showNotifications = false,
  onNotifications,
  trailing,
}: TopBarProps) {
  return (
    <header className="flex items-center justify-between gap-3 px-4 pb-3 pt-5">
      <div className="flex min-w-0 items-center gap-3">
        {backHref && (
          <Link
            href={backHref}
            aria-label="Go back"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-lowest text-on-surface border border-outline-variant/70 hover:bg-surface-low transition-colors"
          >
            <Icon name="arrow_back" size={20} />
          </Link>
        )}
        {showAvatar && (
          <Link href="/profile" aria-label="Open profile" className="shrink-0 rounded-full">
            <Avatar />
          </Link>
        )}
        <div className="min-w-0">
          {subtitle && (
            <p className="truncate font-body text-body-md text-on-surface-variant">{subtitle}</p>
          )}
          <h1 className="truncate font-headline text-headline-md leading-tight text-on-surface">
            {title}
          </h1>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {trailing}
        {showNotifications && (
          <button
            type="button"
            onClick={onNotifications}
            aria-label="Notifications"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant/70 bg-surface-lowest text-on-surface transition-colors hover:bg-surface-low"
          >
            <Icon name="notifications" size={20} />
            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-success" aria-hidden="true" />
          </button>
        )}
      </div>
    </header>
  );
}
