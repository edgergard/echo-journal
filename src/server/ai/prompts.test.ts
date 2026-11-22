import { describe, expect, it } from "vitest";

import type { Entry } from "@/contracts/journal";

import {
  buildReflectionPrompt,
  buildWeekPrompt,
  formatEntryDate,
  REFLECTION_INSTRUCTIONS,
  WEEK_INSTRUCTIONS,
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
const older = entry("a", "2026-11-15T09:00:00Z", "Argued with Dad.");
const oldest = entry("b", "2026-11-02T09:00:00Z", "Lunch with Dad.");
const ref = (e: Entry) => ({
  entry: e,
  ref: { entryId: e.id, date: e.createdAt, quote: e.text },
});

describe("reflection prompt", () => {
  it("states the reply rules", () => {
    expect(REFLECTION_INSTRUCTIONS).toContain("at most 120 words");
    expect(REFLECTION_INSTRUCTIONS).toContain("one gentle, open question");
    expect(REFLECTION_INSTRUCTIONS).toContain("never diagnose");
    expect(REFLECTION_INSTRUCTIONS).toMatch(/Write in English, unless/);
    expect(REFLECTION_INSTRUCTIONS).toContain("by its date");
  });

  it("formats dates as Mon D in UTC", () => {
    expect(formatEntryDate("2026-11-22T23:30:00Z")).toBe("Nov 22");
    expect(formatEntryDate("2026-11-01T00:10:00+02:00")).toBe("Oct 31");
  });

  it("puts today's entry first, then recalled entries oldest first by date", () => {
    const prompt = buildReflectionPrompt({
      entry: today,
      recalled: [ref(older), ref(oldest)],
    });
    expect(prompt).toContain(
      `Today's entry (Nov 22, mood: low):\n"""\nCalled Dad tonight.\n"""`,
    );
    expect(prompt).toContain("Related past entries (oldest first):");
    const nov2 = prompt.indexOf('- Nov 2 (mood: low): "Lunch with Dad."');
    const nov15 = prompt.indexOf('- Nov 15 (mood: low): "Argued with Dad."');
    expect(nov2).toBeGreaterThan(-1);
    expect(nov15).toBeGreaterThan(nov2);
    expect(prompt.trimEnd().endsWith("Write Echo's reply now.")).toBe(true);
  });

  it("tells the model not to invent a past when nothing is recalled", () => {
    const prompt = buildReflectionPrompt({ entry: today, recalled: [] });
    expect(prompt).toContain("There are no related past entries yet");
    expect(prompt).not.toContain("Related past entries");
  });

  it("clips long recalled entries", () => {
    const long = entry("l", "2026-11-10T09:00:00Z", "word ".repeat(400));
    const prompt = buildReflectionPrompt({
      entry: today,
      recalled: [ref(long)],
    });
    const line = prompt.split("\n").find((l) => l.startsWith("- Nov 10"));
    expect(line && line.length).toBeLessThan(700);
    expect(line).toContain("…");
  });
});

describe("week prompt", () => {
  it("lists every entry with its id, oldest first", () => {
    const prompt = buildWeekPrompt([today, older]);
    expect(prompt.startsWith("This week's entries (2, oldest first):")).toBe(
      true,
    );
    expect(prompt.indexOf("id: a")).toBeLessThan(prompt.indexOf("id: t"));
    expect(prompt).toContain("- id: t | Nov 22 | mood: low");
    expect(WEEK_INSTRUCTIONS).toContain("3 to 5 themes");
  });
});
