"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/icon";

const items = [
  { href: "/home", label: "Home", icon: "home" },
  { href: "/goals", label: "My Goals", icon: "flag" },
  { href: "/expenses", label: "Money", icon: "account_balance_wallet" },
  { href: "/coach", label: "Coach", icon: "auto_awesome" },
  { href: "/profile", label: "Profile", icon: "person" },
];

export function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary navigation"
      className="safe-bottom fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[430px] border-t border-outline-variant/70 bg-surface-lowest px-2 py-2"
    >
      <ul className="grid grid-cols-5 gap-1">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1 transition-colors duration-state-change",
                  active ? "text-primary" : "text-on-surface-variant hover:text-on-surface",
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-12 items-center justify-center rounded-full transition-colors duration-state-change",
                    active && "bg-accent-soft text-on-accent",
                  )}
                >
                  <Icon name={item.icon} size={21} filled={active} />
                </span>
                <span className="font-label text-label-sm leading-none">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
