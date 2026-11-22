import {
  addMonths,
  differenceInCalendarDays,
  differenceInCalendarMonths,
  endOfMonth,
  format,
  isAfter,
  isBefore,
  parseISO,
  startOfMonth,
} from "date-fns";
import type { ISODate } from "./types";

export function todayISO(): ISODate {
  return format(new Date(), "yyyy-MM-dd");
}

export function parseISODate(iso: ISODate): Date {
  return parseISO(iso);
}

export function toISODate(date: Date): ISODate {
  return format(date, "yyyy-MM-dd");
}

/** "18 Nov" */
export function formatShortDate(iso: ISODate): string {
  return format(parseISO(iso), "d MMM");
}

/** "18 November 2026" */
export function formatLongDate(iso: ISODate): string {
  return format(parseISO(iso), "d MMMM yyyy");
}

/** "Aug 2027" */
export function formatMonthYear(iso: ISODate): string {
  return format(parseISO(iso), "MMM yyyy");
}

/** "Nov" */
export function formatMonthShort(iso: ISODate): string {
  return format(parseISO(iso), "MMM");
}

/** "November 2026" */
export function formatMonthLong(iso: ISODate): string {
  return format(parseISO(iso), "MMMM yyyy");
}

/** "2026-11" */
export function monthKey(iso: ISODate): string {
  return format(parseISO(iso), "yyyy-MM");
}

export function monthKeyLabel(key: string): string {
  return format(parseISO(`${key}-01`), "MMMM yyyy");
}

export function monthKeyShortLabel(key: string): string {
  return format(parseISO(`${key}-01`), "MMM");
}

export function startOfMonthISO(iso: ISODate): ISODate {
  return toISODate(startOfMonth(parseISO(iso)));
}

export function endOfMonthISO(iso: ISODate): ISODate {
  return toISODate(endOfMonth(parseISO(iso)));
}

export function addMonthsISO(iso: ISODate, months: number): ISODate {
  return toISODate(addMonths(parseISO(iso), months));
}

/**
 * Whole calendar months from `from` to `to`, minimum 1.
 * Used to work out how many monthly contributions remain.
 */
export function monthsUntil(from: ISODate, to: ISODate): number {
  return Math.max(1, differenceInCalendarMonths(parseISO(to), parseISO(from)));
}

export function daysBetween(from: ISODate, to: ISODate): number {
  return differenceInCalendarDays(parseISO(to), parseISO(from));
}

export function isPastDate(iso: ISODate, reference: ISODate = todayISO()): boolean {
  return isBefore(parseISO(iso), parseISO(reference));
}

export function isFutureDate(iso: ISODate, reference: ISODate = todayISO()): boolean {
  return isAfter(parseISO(iso), parseISO(reference));
}

/** Most recent `count` month keys, newest first. */
export function recentMonthKeys(count: number, reference: ISODate = todayISO()): string[] {
  const base = parseISO(startOfMonthISO(reference));
  return Array.from({ length: count }, (_, index) =>
    format(addMonths(base, -index), "yyyy-MM"),
  );
}
