import * as z from "zod";

/** The five moods, from worst to best. The order is the chart's y-axis. */
export const MOODS = ["rough", "low", "okay", "good", "great"] as const;
export const MoodSchema = z.enum(MOODS);
export type Mood = z.infer<typeof MoodSchema>;

export const ENTRY_TEXT_MAX = 5000;

/** What the user submits when creating or editing an entry. */
export const EntryInputSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, "Write something first.")
    .max(ENTRY_TEXT_MAX, `Keep it under ${ENTRY_TEXT_MAX} characters.`),
  mood: MoodSchema,
});
export type EntryInput = z.infer<typeof EntryInputSchema>;

export const EntrySchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  text: z.string(),
  mood: MoodSchema,
  /** ISO 8601 timestamps (UTC). */
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type Entry = z.infer<typeof EntrySchema>;

/** A past entry Echo drew on, shown as a "Recalled" margin note. */
export const RecalledRefSchema = z.object({
  entryId: z.string().min(1),
  /** The recalled entry's createdAt (ISO). */
  date: z.iso.datetime(),
  /** A short quote from the recalled entry (≤ 140 chars). */
  quote: z.string().max(140),
});
export type RecalledRef = z.infer<typeof RecalledRefSchema>;

/**
 * Echo's reply to one entry.
 * - done: a model reply (text + recalled refs)
 * - crisis: crisis phrases matched — no model call, show the crisis card
 * - limit: daily AI limit reached — no model call
 * - error: the model call failed; the entry is safe
 */
export const ReflectionStatusSchema = z.enum([
  "done",
  "crisis",
  "limit",
  "error",
]);
export type ReflectionStatus = z.infer<typeof ReflectionStatusSchema>;

export const ReflectionSchema = z.object({
  entryId: z.string().min(1),
  status: ReflectionStatusSchema,
  text: z.string(),
  recalled: z.array(RecalledRefSchema).max(3),
  createdAt: z.iso.datetime(),
});
export type Reflection = z.infer<typeof ReflectionSchema>;

export const WeekThemeSchema = z.object({
  title: z.string().min(1).max(60),
  text: z.string().min(1).max(240),
  entryIds: z.array(z.string().min(1)).max(5),
});
export type WeekTheme = z.infer<typeof WeekThemeSchema>;

export const WeekDaySchema = z.object({
  /** YYYY-MM-DD (UTC). */
  date: z.iso.date(),
  /** The day's latest mood, or null when there is no entry that day. */
  mood: MoodSchema.nullable(),
});
export type WeekDay = z.infer<typeof WeekDaySchema>;

export const WeekSummaryStatusSchema = z.enum([
  "done",
  "empty",
  "limit",
  "error",
]);
export type WeekSummaryStatus = z.infer<typeof WeekSummaryStatusSchema>;

export const WeekSummarySchema = z.object({
  /** Monday of the week, YYYY-MM-DD (UTC). */
  weekStart: z.iso.date(),
  status: WeekSummaryStatusSchema,
  days: z.array(WeekDaySchema).length(7),
  themes: z.array(WeekThemeSchema).max(5),
  entryCount: z.number().int().nonnegative(),
  generatedAt: z.iso.datetime(),
});
export type WeekSummary = z.infer<typeof WeekSummarySchema>;
