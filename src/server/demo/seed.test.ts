import { describe, expect, it } from "vitest";

import { EntrySchema, ReflectionSchema } from "@/contracts/journal";

import { buildDemoSeed } from "./seed";

describe("buildDemoSeed", () => {
  const now = new Date("2026-11-22T12:00:00Z");
  const seed = buildDemoSeed(now);

  it("has 20 valid entries, newest first, all in the past", () => {
    expect(seed.entries).toHaveLength(20);
    for (const entry of seed.entries) {
      expect(EntrySchema.parse(entry)).toEqual(entry);
      expect(new Date(entry.createdAt).getTime()).toBeLessThan(now.getTime());
    }
    const dates = seed.entries.map((e) => e.createdAt);
    expect([...dates].sort().reverse()).toEqual(dates);
  });

  it("has valid replies whose recalled refs point to older entries", () => {
    expect(seed.reflections.length).toBeGreaterThan(10);
    const byId = new Map(seed.entries.map((e) => [e.id, e]));
    for (const reflection of seed.reflections) {
      expect(ReflectionSchema.parse(reflection)).toEqual(reflection);
      const entry = byId.get(reflection.entryId);
      expect(entry).toBeDefined();
      for (const ref of reflection.recalled) {
        const recalled = byId.get(ref.entryId);
        expect(recalled).toBeDefined();
        expect(recalled!.createdAt < entry!.createdAt).toBe(true);
      }
    }
  });

  it("gives the newest entry a reply with recalled notes", () => {
    const newest = seed.entries[0]!;
    const reply = seed.reflections.find((r) => r.entryId === newest.id);
    expect(reply?.recalled.length).toBeGreaterThan(0);
  });
});
