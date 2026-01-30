import { formatInTimeZone, toZonedTime } from "date-fns-tz";
import { subDays } from "date-fns";

const IST_TIMEZONE = "Asia/Kolkata";

/**
 * Convert a date to IST timezone
 */
export function toIST(date: Date): Date {
  return toZonedTime(date, IST_TIMEZONE);
}

/**
 * Format a date in IST timezone
 */
export function formatIST(date: Date, format: string): string {
  return formatInTimeZone(date, IST_TIMEZONE, format);
}

/**
 * Get today's date in IST as YYYY-MM-DD
 */
export function getTodayIST(): string {
  return formatIST(new Date(), "yyyy-MM-dd");
}

/**
 * Get a date string in IST as YYYY-MM-DD
 */
export function getDateIST(date: Date): string {
  return formatIST(date, "yyyy-MM-dd");
}

/**
 * Calculate hours difference between two dates in IST
 */
export function hoursDifferenceIST(date1: Date, date2: Date): number {
  const ist1 = toIST(date1);
  const ist2 = toIST(date2);
  return Math.abs(ist1.getTime() - ist2.getTime()) / (1000 * 60 * 60);
}

/**
 * Get date N days ago from today in IST as YYYY-MM-DD
 * getDateDaysAgo(0) = today, getDateDaysAgo(1) = yesterday
 */
export function getDateDaysAgo(days: number): string {
  const now = new Date();
  const past = subDays(now, days);
  return formatIST(past, "yyyy-MM-dd");
}
