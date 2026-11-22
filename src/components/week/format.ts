import type { Mood } from "@/contracts/journal";

const parse = (date: string) => new Date(`${date}T00:00:00.000Z`);

const fmt = (date: string, options: Intl.DateTimeFormatOptions) =>
  parse(date).toLocaleDateString("en-US", { ...options, timeZone: "UTC" });

/** "Mon" */
export const weekdayShort = (date: string) => fmt(date, { weekday: "short" });

/** "Mon, Nov 17" */
export const dayLabel = (date: string) =>
  fmt(date, { weekday: "short", month: "short", day: "numeric" });

/** "Nov 17 – Nov 23, 2026" */
export function weekRangeLabel(weekStart: string, weekEnd: string): string {
  const start = fmt(weekStart, { month: "short", day: "numeric" });
  const end = fmt(weekEnd, { month: "short", day: "numeric", year: "numeric" });
  return `${start} – ${end}`;
}

/** Sentence for the chart's aria-label: "Mood this week: Mon okay, Tue low". */
export function moodSummaryLabel(
  days: { date: string; mood: Mood | null }[],
): string {
  const parts = days
    .filter((d) => d.mood !== null)
    .map((d) => `${weekdayShort(d.date)} ${d.mood}`);
  return parts.length > 0
    ? `Mood this week: ${parts.join(", ")}`
    : "Mood this week: no entries";
}
