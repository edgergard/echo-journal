import { describe, expect, it } from "vitest";

import type { Entry, Mood } from "@/contracts/journal";
import {
  addDays,
  buildMoodSeries,
  filterWeekEntries,
  resolveWeekStart,
  weekDates,
  weekStartOf,
} from "@/server/week/week-utils";

function entry(id: string, createdAt: string, mood: Mood): Entry {
  return {
    id,
    userId: "u",
    text: id,
    mood,
    createdAt,
    updatedAt: createdAt,
  };
}

describe("weekStartOf", () => {
  it("returns the same day for a Monday", () => {
    expect(weekStartOf(new Date("2026-11-16T00:00:00.000Z"))).toBe(
      "2026-11-16",
    );
  });

  it("maps Sunday to the previous Monday", () => {
    expect(weekStartOf(new Date("2026-11-22T23:59:59.999Z"))).toBe(
      "2026-11-16",
    );
  });

  it("crosses month and year boundaries", () => {
    expect(weekStartOf(new Date("2027-01-02T10:00:00.000Z"))).toBe(
      "2026-12-28",
    );
  });
});

describe("resolveWeekStart", () => {
  const now = new Date("2026-11-22T12:00:00.000Z");

  it("falls back to the current week for missing or invalid values", () => {
    expect(resolveWeekStart(undefined, now)).toBe("2026-11-16");
    expect(resolveWeekStart("nope", now)).toBe("2026-11-16");
    expect(resolveWeekStart("2026-13-45", now)).toBe("2026-11-16");
  });

  it("snaps a mid-week date to its Monday", () => {
    expect(resolveWeekStart("2026-11-11", now)).toBe("2026-11-09");
  });

  it("does not go past the current week", () => {
    expect(resolveWeekStart("2026-12-07", now)).toBe("2026-11-16");
  });
});

describe("weekDates", () => {
  it("lists seven days Mon–Sun", () => {
    const dates = weekDates("2026-12-28");
    expect(dates).toHaveLength(7);
    expect(dates[0]).toBe("2026-12-28");
    expect(dates[6]).toBe("2027-01-03");
    expect(addDays("2026-11-16", -7)).toBe("2026-11-09");
  });
});

describe("filterWeekEntries", () => {
  it("keeps only entries inside the week, newest first", () => {
    const entries = [
      entry("before", "2026-11-15T23:59:59.999Z", "okay"),
      entry("mon", "2026-11-16T00:00:00.000Z", "good"),
      entry("sun", "2026-11-22T23:59:59.999Z", "low"),
      entry("after", "2026-11-23T00:00:00.000Z", "great"),
    ];
    expect(filterWeekEntries(entries, "2026-11-16").map((e) => e.id)).toEqual([
      "sun",
      "mon",
    ]);
  });
});

describe("buildMoodSeries", () => {
  it("has gaps for days without entries and takes the latest mood per day", () => {
    const entries = [
      entry("a", "2026-11-16T08:00:00.000Z", "low"),
      entry("b", "2026-11-16T20:00:00.000Z", "good"),
      entry("c", "2026-11-18T09:00:00.000Z", "rough"),
    ];
    const days = buildMoodSeries(entries, "2026-11-16");
    expect(days).toHaveLength(7);
    expect(days.map((d) => d.mood)).toEqual([
      "good",
      null,
      "rough",
      null,
      null,
      null,
      null,
    ]);
    expect(days[0]?.date).toBe("2026-11-16");
  });
});
