import type { Entry, WeekDay } from "@/contracts/journal";

const DAY_MS = 86_400_000;

/** YYYY-MM-DD (UTC) of a date. */
export function utcDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Monday (UTC) of the week containing `date`, as YYYY-MM-DD. */
export function weekStartOf(date: Date): string {
  const midnight = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
  );
  const sinceMonday = (new Date(midnight).getUTCDay() + 6) % 7;
  return utcDateString(new Date(midnight - sinceMonday * DAY_MS));
}

/** Shifts a YYYY-MM-DD date by whole days. */
export function addDays(dateString: string, days: number): string {
  const time = Date.parse(`${dateString}T00:00:00.000Z`);
  return utcDateString(new Date(time + days * DAY_MS));
}

/** Normalizes any YYYY-MM-DD to its week's Monday. */
export function snapToMonday(dateString: string): string {
  return weekStartOf(new Date(`${dateString}T00:00:00.000Z`));
}

/**
 * The week to show for a `?week=` value: invalid → the current week,
 * non-Monday → its Monday, future → the current week.
 */
export function resolveWeekStart(
  value: string | null | undefined,
  now: Date = new Date(),
): string {
  const current = weekStartOf(now);
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return current;
  if (Number.isNaN(Date.parse(`${value}T00:00:00.000Z`))) return current;
  const snapped = snapToMonday(value);
  return snapped > current ? current : snapped;
}

/** The seven dates (Mon–Sun) of the week. */
export function weekDates(weekStart: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

/** Entries created inside the week (UTC), newest first. */
export function filterWeekEntries(
  entries: Entry[],
  weekStart: string,
): Entry[] {
  const start = `${weekStart}T00:00:00.000Z`;
  const end = `${addDays(weekStart, 7)}T00:00:00.000Z`;
  return entries
    .filter((entry) => entry.createdAt >= start && entry.createdAt < end)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Seven days; a day with several entries takes the latest one's mood. */
export function buildMoodSeries(
  entries: Entry[],
  weekStart: string,
): WeekDay[] {
  return weekDates(weekStart).map((date) => {
    let latest: Entry | null = null;
    for (const entry of entries) {
      if (entry.createdAt.slice(0, 10) !== date) continue;
      if (!latest || entry.createdAt > latest.createdAt) latest = entry;
    }
    return { date, mood: latest ? latest.mood : null };
  });
}
