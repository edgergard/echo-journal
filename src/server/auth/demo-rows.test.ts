import { describe, expect, it } from "vitest";

import { buildDemoSeed } from "@/server/demo/seed";

import { buildDemoRows } from "./demo-rows";

describe("buildDemoRows", () => {
  it("maps the seed to rows with fresh ids and remapped recalled refs", () => {
    const seed = buildDemoSeed(new Date("2026-11-22T12:00:00Z"));
    let counter = 0;
    const rows = buildDemoRows(seed, "user-1", () => `id-${++counter}`);

    expect(rows.entries).toHaveLength(seed.entries.length);
    expect(rows.reflections).toHaveLength(seed.reflections.length);

    const ids = new Set(rows.entries.map((row) => row.id));
    expect(ids.size).toBe(seed.entries.length);
    expect(rows.entries.every((row) => row.user_id === "user-1")).toBe(true);
    expect(rows.entries[0]).toMatchObject({
      text: seed.entries[0]?.text,
      mood: seed.entries[0]?.mood,
      created_at: seed.entries[0]?.createdAt,
    });

    for (const reflection of rows.reflections) {
      expect(ids.has(reflection.entry_id)).toBe(true);
      for (const ref of reflection.recalled) {
        expect(ids.has(ref.entryId)).toBe(true);
      }
    }
    const withRecalled = rows.reflections.find((r) => r.recalled.length > 0);
    expect(withRecalled?.recalled[0]?.entryId).toMatch(/^id-/);
  });
});
