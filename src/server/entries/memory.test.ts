import { describe, expect, it } from "vitest";

import { MemoryEntriesRepo } from "./memory";
import { createEntryFor, updateEntryFor } from "./service";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe("MemoryEntriesRepo pagination", () => {
  it("pages newest first with a cursor", async () => {
    const repo = new MemoryEntriesRepo();
    const user = `u-${crypto.randomUUID()}`;
    for (let i = 0; i < 5; i++) {
      await repo.create(user, { text: `entry ${i}`, mood: "okay" });
      await sleep(2);
    }
    const first = await repo.list(user, { limit: 2 });
    expect(first.entries.map((e) => e.text)).toEqual(["entry 4", "entry 3"]);
    expect(first.nextBefore).not.toBeNull();

    const second = await repo.list(user, {
      limit: 2,
      before: first.nextBefore ?? undefined,
    });
    expect(second.entries.map((e) => e.text)).toEqual(["entry 2", "entry 1"]);

    const third = await repo.list(user, {
      limit: 2,
      before: second.nextBefore ?? undefined,
    });
    expect(third.entries.map((e) => e.text)).toEqual(["entry 0"]);
    expect(third.nextBefore).toBeNull();
  });

  it("defaults to 20 per page", async () => {
    const repo = new MemoryEntriesRepo();
    const user = `u-${crypto.randomUUID()}`;
    for (let i = 0; i < 25; i++) {
      await repo.create(user, { text: `e${i}`, mood: "good" });
      await sleep(1);
    }
    const page = await repo.list(user);
    expect(page.entries).toHaveLength(20);
    expect(page.nextBefore).not.toBeNull();
  });
});

describe("entry service (memory backend)", () => {
  it("creates, updates and removes an entry", async () => {
    const repo = new MemoryEntriesRepo();
    const user = `u-${crypto.randomUUID()}`;

    const created = await createEntryFor(repo, user, {
      text: "  First thoughts ",
      mood: "great",
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(created.entry.text).toBe("First thoughts");

    const updated = await updateEntryFor(repo, user, created.entry.id, {
      text: "Changed my mind",
      mood: "low",
    });
    expect(updated.ok && updated.entry.mood).toBe("low");
    expect((await repo.get(user, created.entry.id))?.text).toBe(
      "Changed my mind",
    );

    expect(await repo.remove(user, created.entry.id)).toBe(true);
    expect(await repo.get(user, created.entry.id)).toBeNull();
  });

  it("rejects invalid input without saving", async () => {
    const repo = new MemoryEntriesRepo();
    const user = `u-${crypto.randomUUID()}`;
    const result = await createEntryFor(repo, user, { text: "", mood: "okay" });
    expect(result.ok).toBe(false);
    expect((await repo.list(user)).entries).toHaveLength(0);
  });

  it("does not update another user's entry", async () => {
    const repo = new MemoryEntriesRepo();
    const owner = `u-${crypto.randomUUID()}`;
    const created = await createEntryFor(repo, owner, {
      text: "mine",
      mood: "okay",
    });
    if (!created.ok) throw new Error("setup failed");
    const result = await updateEntryFor(
      repo,
      "someone-else",
      created.entry.id,
      {
        text: "hijack",
        mood: "okay",
      },
    );
    expect(result.ok).toBe(false);
  });

  it("never lists, reads or deletes another user's entries", async () => {
    const repo = new MemoryEntriesRepo();
    const owner = `u-${crypto.randomUUID()}`;
    const stranger = `u-${crypto.randomUUID()}`;
    const entry = await repo.create(owner, { text: "private", mood: "low" });
    expect((await repo.list(stranger)).entries).toEqual([]);
    expect(await repo.get(stranger, entry.id)).toBeNull();
    expect(await repo.remove(stranger, entry.id)).toBe(false);
    expect(await repo.get(owner, entry.id)).not.toBeNull();
  });
});
