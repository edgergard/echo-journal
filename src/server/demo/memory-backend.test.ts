import { beforeEach, describe, expect, it } from "vitest";

import { DEMO_USER_ID } from "@/contracts/session";
import { MemoryEntriesRepo } from "@/server/entries/memory";
import { MemoryMemoryStore, wordOverlap } from "@/server/memory/memory";
import { MemoryReflectionsRepo } from "@/server/reflections/memory";
import { MemoryUsageLimiter } from "@/server/usage/memory";

import { resetDemoStoreForTests } from "./store";

describe("in-memory backend", () => {
  beforeEach(() => {
    resetDemoStoreForTests();
  });

  it("pages entries newest first with a cursor", async () => {
    const repo = new MemoryEntriesRepo();
    const first = await repo.list(DEMO_USER_ID, { limit: 15 });
    expect(first.entries).toHaveLength(15);
    expect(first.nextBefore).not.toBeNull();
    const second = await repo.list(DEMO_USER_ID, {
      limit: 15,
      before: first.nextBefore!,
    });
    expect(second.entries).toHaveLength(5);
    expect(second.nextBefore).toBeNull();
  });

  it("creates, updates and removes an entry with its reply", async () => {
    const repo = new MemoryEntriesRepo();
    const replies = new MemoryReflectionsRepo();
    const entry = await repo.create(DEMO_USER_ID, {
      text: "Hello",
      mood: "good",
    });
    expect((await repo.list(DEMO_USER_ID)).entries[0]?.id).toBe(entry.id);
    const updated = await repo.update(DEMO_USER_ID, entry.id, {
      text: "Hello again",
      mood: "okay",
    });
    expect(updated?.text).toBe("Hello again");
    await replies.save(DEMO_USER_ID, {
      entryId: entry.id,
      status: "done",
      text: "Hi",
      recalled: [],
      createdAt: new Date().toISOString(),
    });
    expect(await repo.remove(DEMO_USER_ID, entry.id)).toBe(true);
    expect(await replies.get(DEMO_USER_ID, entry.id)).toBeNull();
    expect(await repo.get(DEMO_USER_ID, entry.id)).toBeNull();
  });

  it("finds similar older entries by word overlap", async () => {
    expect(wordOverlap("letters from grandmother", "grandmother letters")).toBe(
      1,
    );
    const repo = new MemoryEntriesRepo();
    const newest = (await repo.list(DEMO_USER_ID)).entries[0]!;
    const similar = await new MemoryMemoryStore().similar(
      DEMO_USER_ID,
      newest,
      3,
    );
    expect(similar.length).toBeGreaterThan(0);
    for (const s of similar) {
      expect(s.entry.createdAt < newest.createdAt).toBe(true);
    }
  });

  it("enforces the daily limit", async () => {
    const usage = new MemoryUsageLimiter(2);
    expect(await usage.consume("u1")).toEqual({ allowed: true, remaining: 1 });
    expect(await usage.consume("u1")).toEqual({ allowed: true, remaining: 0 });
    expect(await usage.consume("u1")).toEqual({ allowed: false, remaining: 0 });
    expect(await usage.remaining("u2")).toBe(2);
  });
});
