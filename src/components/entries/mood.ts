import type { Mood } from "@/contracts/journal";

/** Mood words shown to the user — mood is never conveyed by colour alone. */
export const MOOD_LABELS: Record<Mood, string> = {
  rough: "Rough",
  low: "Low",
  okay: "Okay",
  good: "Good",
  great: "Great",
};

const dateFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

const longDateFormat = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});

/** "Nov 22, 2026" (UTC, so server and client render the same text). */
export function formatEntryDate(iso: string | Date): string {
  return dateFormat.format(new Date(iso));
}

/** "Sunday, November 22" — page titles. */
export function formatLongDate(iso: string | Date): string {
  return longDateFormat.format(new Date(iso));
}

/** The first non-empty line of an entry. */
export function firstLine(text: string): string {
  return (
    text
      .split("\n")
      .find((line) => line.trim() !== "")
      ?.trim() ?? ""
  );
}
