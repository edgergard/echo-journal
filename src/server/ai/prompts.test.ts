import { describe, expect, it } from "vitest";

import type { Entry } from "@/contracts/journal";

import {
  buildReflectionPrompt,
  buildWeekPrompt,
  clip,
  ENTRY_PROMPT_MAX,
  formatEntryDate,
  REFLECTION_INSTRUCTIONS,
  WEEK_ENTRY_PROMPT_MAX,
  WEEK_INSTRUCTIONS,
  weekPromptOrder,
} from "./prompts";

const entry = (id: string, iso: string, text: string): Entry => ({
  id,
  userId: "u1",
  text,
  mood: "low",
  createdAt: iso,
  updatedAt: iso,
});

const today = entry("t", "2026-11-22T21:00:00Z", "  Called Dad tonight.  ");
const older = entry(
  "a",
  "2026-11-15T09:00:00Z",
  "Argued with Dad. It was loud.",
);
const oldest = entry(
  "b",
  "2026-11-02T09:00:00Z",
  "Lunch with Dad. He was proud.",
);
const ref = (e: Entry, quote: string) => ({
  entry: e,
  ref: { entryId: e.id, date: e.createdAt, quote },
});

describe("reflection prompt", () => {
  it("states the reply rules", () => {
    expect(REFLECTION_INSTRUCTIONS).toContain("At most 120 words");
    expect(REFLECTION_INSTRUCTIONS).toContain("one gentle, open question");
    expect(REFLECTION_INSTRUCTIONS).toContain("never diagnose");
    expect(REFLECTION_INSTRUCTIONS).toMatch(/English, unless/);
    expect(REFLECTION_INSTRUCTIONS).toContain("by its date");
  });

  it("formats dates as Mon D in UTC", () => {
    expect(formatEntryDate("2026-11-22T23:30:00Z")).toBe("Nov 22");
    expect(formatEntryDate("2026-11-01T00:10:00+02:00")).toBe("Oct 31");
  });

  it("sends today's entry, then only the recalled quotes, oldest first", () => {
    const prompt = buildReflectionPrompt({
      entry: today,
      recalled: [ref(older, "Argued with Dad."), ref(oldest, "He was proud.")],
    });
    expect(prompt).toBe(
      [
        "Today (Nov 22, mood: low):",
        '"""',
        "Called Dad tonight.",
        '"""',
        "Past entries:",
        '- Nov 2: "He was proud."',
        '- Nov 15: "Argued with Dad."',
      ].join("\n"),
    );
    // The rest of the recalled entries stays out of the prompt.
    expect(prompt).not.toContain("It was loud.");
  });

  it("tells the model not to invent a past when nothing is recalled", () => {
    const prompt = buildReflectionPrompt({ entry: today, recalled: [] });
    expect(prompt).toContain("No past entries yet: don't mention the past.");
    expect(prompt).not.toContain("Past entries:");
  });

  it("sends only the first ~2000 characters of a long entry", () => {
    const long = entry("l", "2026-11-22T09:00:00Z", "word ".repeat(1000));
    const prompt = buildReflectionPrompt({ entry: long, recalled: [] });
    const body = prompt.split('"""')[1]?.trim() ?? "";
    expect(body.length).toBeLessThanOrEqual(ENTRY_PROMPT_MAX);
    expect(body.length).toBeGreaterThan(ENTRY_PROMPT_MAX - 10);
    expect(body.endsWith("…")).toBe(true);
  });

  it("keeps the entry's paragraphs but folds runs of spaces", () => {
    expect(clip("One.\n\nTwo   three.", 100)).toBe("One.\n\nTwo three.");
  });
});

describe("week prompt", () => {
  it("numbers the entries oldest first instead of listing ids", () => {
    const prompt = buildWeekPrompt([today, older]);
    expect(prompt).toBe(
      [
        '#1 Nov 15, low: "Argued with Dad. It was loud."',
        '#2 Nov 22, low: "Called Dad tonight."',
      ].join("\n"),
    );
    expect(weekPromptOrder([today, older]).map((e) => e.id)).toEqual([
      "a",
      "t",
    ]);
    expect(WEEK_INSTRUCTIONS).toContain("3 to 5 themes");
  });

  it("clips each week entry", () => {
    const long = entry("l", "2026-11-20T09:00:00Z", "word ".repeat(400));
    expect(buildWeekPrompt([long]).length).toBeLessThan(
      WEEK_ENTRY_PROMPT_MAX + 30,
    );
  });
});
