"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";
import { Icon } from "./icon";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function Sheet({ open, onClose, title, description, children, footer, className }: SheetProps) {
  const [mounted, setMounted] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => sheetRef.current?.focus(), 20);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(timer);
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-scrim/40 animate-fade-in"
      />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        tabIndex={-1}
        className={cn(
          "relative z-10 flex max-h-[90vh] w-full max-w-[430px] flex-col rounded-t-xl bg-surface-lowest shadow-sheet outline-none animate-sheet-in",
          className,
        )}
      >
        <header className="flex items-start justify-between gap-3 border-b border-outline-variant/60 px-5 pb-4 pt-5">
          <div className="space-y-1">
            <h2 id="sheet-title" className="font-headline text-headline-md text-on-surface">
              {title}
            </h2>
            {description && (
              <p className="font-body text-body-md text-on-surface-variant">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-container text-on-surface"
          >
            <Icon name="close" size={18} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <footer className="safe-bottom border-t border-outline-variant/60 px-5 py-4">{footer}</footer>
        )}
      </div>
    </div>,
    document.body,
  );
}
