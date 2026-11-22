"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/store/app-store";
import { CoachChat } from "@/components/coach/coach-chat";
import { Icon } from "@/components/ui/icon";
import { Sheet } from "@/components/ui/sheet";

export function CompanionLauncher() {
  const open = useAppStore((state) => state.coachOpen);
  const openCoach = useAppStore((state) => state.openCoach);
  const closeCoach = useAppStore((state) => state.closeCoach);
  const pathname = usePathname();
  const screen = pathname === "/coach" ? "coach" : pathname.split("/").filter(Boolean)[0] ?? "home";

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-[88px] z-40 mx-auto flex w-full max-w-[430px] justify-end px-4">
        <button
          type="button"
          onClick={openCoach}
          aria-label="Open Artha Coach"
          className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full border-2 border-primary bg-surface-lowest text-primary shadow-md transition-colors hover:bg-accent-soft"
        >
          <Icon name="auto_awesome" size={22} filled />
        </button>
      </div>

      <Sheet
        open={open}
        onClose={closeCoach}
        title="Artha Coach"
        description="Your goal-first financial companion"
      >
        <CoachChat screen={screen} compact onNavigate={closeCoach} />
        <div className="mt-4 border-t border-outline-variant/60 pt-3">
          <Link
            href="/coach"
            onClick={closeCoach}
            className="inline-flex items-center gap-1 font-label text-label-md text-primary hover:underline"
          >
            Open full Coach tab
            <Icon name="arrow_forward" size={14} />
          </Link>
        </div>
      </Sheet>
    </>
  );
}
