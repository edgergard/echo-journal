import { describe, expect, it, vi } from "vitest";

import type { Backend } from "@/contracts/backend";
import type { Entry } from "@/contracts/journal";
import { buildWeekData } from "@/server/week/build-week-summary";

const WEEK = "2026-11-16";

function makeEntry(n: number, createdAt: string): Entry {
  return {
    id: `e${n}`,
    userId: "u",
    text: `entry ${n}`,
    mood: "okay",
    createdAt,
    updatedAt: createdAt,
  };
}

function makeBackend(
  entries: Entry[],
  options: { allowed?: boolean; fail?: boolean; pageSize?: number } = {},
) {
  const sorted = [...entries].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  const pageSize = options.pageSize ?? 100;
  const summarizeWeek = vi.fn(async () => {
    if (options.fail) throw new Error("boom");
    return [{ title: "T", text: "x", entryIds: ["e1", "ghost"] }];
  });
  const consume = vi.fn(async () => ({
    allowed: options.allowed ?? true,
    remaining: 1,
  }));
  const backend = {
    entries: {
      list: async (_user: string, opts: { before?: string } = {}) => {
        const older = opts.before
          ? sorted.filter((e) => e.createdAt < opts.before!)
          : sorted;
        const page = older.slice(0, pageSize);
        return {
          entries: page,
          nextBefore:
            older.length > pageSize ? (page.at(-1)?.createdAt ?? null) : null,
        };
      },
    },
    usage: { consume },
    ai: { summarizeWeek },
  } as unknown as Backend;
  return { backend, summarizeWeek, consume };
}

describe("buildWeekData", () => {
  it("is empty with fewer than two entries and does not call the AI", async () => {
    const { backend, summarizeWeek, consume } = makeBackend([
      makeEntry(1, "2026-11-17T10:00:00.000Z"),
      makeEntry(2, "2026-11-09T10:00:00.000Z"),
    ]);
    const { summary } = await buildWeekData(backend, "u", WEEK);
    expect(summary.status).toBe("empty");
    expect(summary.entryCount).toBe(1);
    expect(summarizeWeek).not.toHaveBeenCalled();
    expect(consume).not.toHaveBeenCalled();
  });

  it("returns themes with known entry ids only", async () => {
    const { backend, consume } = makeBackend([
      makeEntry(1, "2026-11-17T10:00:00.000Z"),
      makeEntry(2, "2026-11-18T10:00:00.000Z"),
    ]);
    const { summary, entryDates } = await buildWeekData(backend, "u", WEEK);
    expect(summary.status).toBe("done");
    expect(summary.themes[0]?.entryIds).toEqual(["e1"]);
    expect(entryDates.e2).toBe("2026-11-18T10:00:00.000Z");
    expect(consume).toHaveBeenCalledOnce();
  });

  it("reports the limit state", async () => {
    const { backend, summarizeWeek } = makeBackend(
      [
        makeEntry(1, "2026-11-17T10:00:00.000Z"),
        makeEntry(2, "2026-11-18T10:00:00.000Z"),
      ],
      { allowed: false },
    );
    const { summary } = await buildWeekData(backend, "u", WEEK);
    expect(summary.status).toBe("limit");
    expect(summarizeWeek).not.toHaveBeenCalled();
  });

  it("reports an error when the AI fails", async () => {
    const { backend } = makeBackend(
      [
        makeEntry(1, "2026-11-17T10:00:00.000Z"),
        makeEntry(2, "2026-11-18T10:00:00.000Z"),
      ],
      { fail: true },
    );
    const { summary } = await buildWeekData(backend, "u", WEEK);
    expect(summary.status).toBe("error");
    expect(summary.days).toHaveLength(7);
  });

  it("pages back past newer weeks to reach the requested one", async () => {
    const newer = Array.from({ length: 5 }, (_, i) =>
      makeEntry(10 + i, `2026-11-2${3 + i}T10:00:00.000Z`),
    );
    const inWeek = [
      makeEntry(1, "2026-11-17T10:00:00.000Z"),
      makeEntry(2, "2026-11-18T10:00:00.000Z"),
    ];
    const { backend } = makeBackend([...newer, ...inWeek], { pageSize: 2 });
    const { summary } = await buildWeekData(backend, "u", WEEK);
    expect(summary.entryCount).toBe(2);
  });
});
