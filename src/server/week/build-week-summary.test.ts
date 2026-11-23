import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Backend } from "@/contracts/backend";
import type { Entry } from "@/contracts/journal";
import {
  buildWeekData,
  clearWeekThemesCache,
} from "@/server/week/build-week-summary";

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
  const remaining = vi.fn(async () => ((options.allowed ?? true) ? 1 : 0));
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
    usage: { consume, remaining },
    ai: { summarizeWeek },
  } as unknown as Backend;
  return { backend, summarizeWeek, consume };
}

describe("buildWeekData", () => {
  beforeEach(() => clearWeekThemesCache());

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

  it("reports an error when the AI fails and uses no quota", async () => {
    const { backend, consume } = makeBackend(
      [
        makeEntry(1, "2026-11-17T10:00:00.000Z"),
        makeEntry(2, "2026-11-18T10:00:00.000Z"),
      ],
      { fail: true },
    );
    const { summary } = await buildWeekData(backend, "u", WEEK);
    expect(summary.status).toBe("error");
    expect(summary.days).toHaveLength(7);
    expect(consume).not.toHaveBeenCalled();
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

  const two = () => [
    makeEntry(1, "2026-11-17T10:00:00.000Z"),
    makeEntry(2, "2026-11-18T10:00:00.000Z"),
  ];

  it("serves a second view of the same week from cache without consuming", async () => {
    const { backend, consume, summarizeWeek } = makeBackend(two());
    await buildWeekData(backend, "u", WEEK);
    const { summary } = await buildWeekData(backend, "u", WEEK);
    expect(summary.status).toBe("done");
    expect(summary.themes).toHaveLength(1);
    expect(consume).toHaveBeenCalledOnce();
    expect(summarizeWeek).toHaveBeenCalledOnce();
  });

  it("misses the cache when an entry was edited", async () => {
    const first = makeBackend(two());
    await buildWeekData(first.backend, "u", WEEK);
    const edited = two().map((e) =>
      e.id === "e1" ? { ...e, updatedAt: "2026-11-19T10:00:00.000Z" } : e,
    );
    const second = makeBackend(edited);
    await buildWeekData(second.backend, "u", WEEK);
    expect(second.consume).toHaveBeenCalledOnce();
    expect(second.summarizeWeek).toHaveBeenCalledOnce();
  });

  it("regenerates and consumes on force", async () => {
    const { backend, consume, summarizeWeek } = makeBackend(two());
    await buildWeekData(backend, "u", WEEK);
    await buildWeekData(backend, "u", WEEK, { force: true });
    expect(consume).toHaveBeenCalledTimes(2);
    expect(summarizeWeek).toHaveBeenCalledTimes(2);
  });

  it("keeps no cache entry after a failed AI call", async () => {
    const ok = makeBackend(two());
    await buildWeekData(ok.backend, "u", WEEK);
    const failing = makeBackend(two(), { fail: true });
    const forced = await buildWeekData(failing.backend, "u", WEEK, {
      force: true,
    });
    expect(forced.summary.status).toBe("error");
    const after = makeBackend(two());
    await buildWeekData(after.backend, "u", WEEK);
    expect(after.consume).toHaveBeenCalledOnce();
  });

  it("caches per user", async () => {
    const { backend, consume } = makeBackend(two());
    await buildWeekData(backend, "u", WEEK);
    await buildWeekData(backend, "other", WEEK);
    expect(consume).toHaveBeenCalledTimes(2);
  });
});
